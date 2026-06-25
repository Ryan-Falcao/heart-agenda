## Visão geral

Vou entregar tudo em uma única leva, organizado em 4 blocos. Realtime via Supabase Realtime. Push via Edge Function `send-push-notification` (precisa do `web-push`, que roda bem em edge function). Convites de amizade por **código curto + QR code** (escolha sua).

## 1. Banco de dados (uma migração)

Tabelas em `public` (todas com RLS + GRANT):

- `friendships(user_id, friend_id, status: pending|accepted|rejected)` — par único (LEAST/GREATEST) para evitar duplicatas. RLS: ambos os lados podem ler; quem envia cria; ambos podem atualizar status.
- `friend_invite_codes(user_id, code unique, expires_at)` — código curto (8 chars) gerado pelo dono. Lido por qualquer usuário autenticado (para resolver código), gerenciado só pelo dono.
- `shared_agendas(id, name, owner_id, color, created_at)` — RLS via função `is_agenda_member(agenda_id, user_id)`.
- `shared_agenda_members(agenda_id, user_id, role: owner|editor|viewer, joined_at)` — owner gerencia; membros leem.
- `shared_tasks(id, agenda_id, title, description, due_date, assigned_to, created_by, status: pending|in_progress|done)` — leitura por membros; escrita por owner/editor; viewer só lê. Trigger `notify_task_change` que chama Edge Function via `pg_net` quando tarefa é criada/atribuída/concluída.
- `push_subscriptions(user_id, endpoint unique, p256dh, auth)` — RLS restrito ao próprio usuário.
- `notification_preferences(user_id, push_enabled, minutes_before)` — preferência de antecedência (default 10 min).

Função SECURITY DEFINER `is_agenda_member()` para evitar recursão de RLS.
`ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_tasks` para realtime.

Estendo `profiles` para permitir busca por e-mail por usuários autenticados (policy adicional SELECT por authenticated em campos públicos: id, nome, sobrenome, avatar_url, email).

## 2. Web Push

- Gero VAPID keypair agora e salvo `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` como secrets do Cloud.
- `VITE_VAPID_PUBLIC_KEY` exposto no `.env` (chave pública pode ir no frontend).
- `public/sw.js` atualizado com handlers `push` e `notificationclick` (mantém o `notification-sw.js` legado funcionando para alarmes locais).
- Edge function `send-push-notification` usando `npm:web-push`:
  - Recebe `{ user_ids: string[], title, body, url, tag }`
  - Busca subscriptions, envia para todas, remove as 410/404.
- Trigger SQL chama essa função via `pg_net` em:
  1. Task atribuída ao usuário (insert/update com `assigned_to` mudando).
  2. Task concluída — notifica todos os membros da agenda.
- Lembretes "10 min antes do prazo": **pg_cron** roda a cada minuto e chama a edge function para tarefas próximas do `due_date` ainda não notificadas (coluna `reminder_sent_at`).

## 3. Frontend (TypeScript + shadcn)

Novos hooks em `src/agenda/hooks/`:
- `useFriendships` — listar amigos, pedidos recebidos/enviados, enviar por e-mail, gerar/resolver código de convite, aceitar/rejeitar.
- `useSharedAgendas` — listar, criar, convidar membros, alterar papel, sair.
- `useSharedTasks(agendaId)` — CRUD + subscribe em `shared_tasks` filtrado por `agenda_id`.
- `usePushNotifications` — registra SW, pede permissão, faz `pushManager.subscribe` com VAPID e salva no banco; toggle e antecedência.

Novas telas:
- `FriendsScreen` com tabs: **Amigos**, **Recebidos**, **Enviados**, e bloco "Adicionar amigo" (e-mail / código / **botão QR** que abre modal com QR code do seu código + campo para colar/escanear código de outro).
  - QR code via `qrcode` (lib pequena, ~20KB).
  - Leitura de QR via input do código manual + suporte opcional a câmera (`html5-qrcode` se couber; senão só código manual).
- `SharedAgendasListScreen` — lista das agendas compartilhadas + botão "Nova".
- `SharedAgendaDetailScreen` — header com membros (avatars), lista de tarefas com status, responsável (avatar+nome), data; CRUD respeitando role (`viewer` só lê).
- `NewSharedAgendaModal`, `InviteMemberModal`, `NewSharedTaskModal`.
- `PushPermissionModal` exibido na primeira entrada em agenda compartilhada.
- Bottom nav ganha aba "Amigos" e "Compartilhadas" (ou agrupo dentro do "+").

## 4. Wiring

- Append integração ao `BottomNav`/`AppRoot` sem mexer em `/auth` e `/reset-password`.
- `vite build` ao final para validar.

## Detalhes técnicos

- `friendships`: chave composta `(LEAST(user_id,friend_id), GREATEST(...))` via índice único; helper RPC `send_friend_request(target_user_id)` para sempre normalizar a ordem.
- `is_agenda_member(agenda_id, uid)` SECURITY DEFINER evita recursão em policies de `shared_tasks`/`shared_agenda_members`.
- Edge function `send-push-notification` com `verify_jwt = false` (chamada por `pg_net`/cron) — protegida por header `x-internal-secret` setado como secret.
- pg_cron job "reminder-loop" a cada 1 min chamando `https://<projeto>.lovable.app/...` da edge function com filtro `due_date BETWEEN now() AND now()+interval '<minutes_before> minutes' AND reminder_sent_at IS NULL`.
- Realtime: `supabase.channel('shared_tasks:'+agendaId).on('postgres_changes',{event:'*',schema:'public',table:'shared_tasks',filter:`agenda_id=eq.${agendaId}`}, ...)` dentro de `useEffect` com cleanup.
- Libs novas: `web-push` (edge), `qrcode` (frontend). QR via câmera fica opcional.

## Fora de escopo (avisar)

- Notificações desktop nativas (estamos usando Web Push padrão, requer HTTPS — funciona no app publicado, **não funciona no iframe do preview**; testar publicado).
- iOS Safari só suporta Web Push se o app for adicionado à tela inicial (PWA).

Confirma que posso seguir? Vou começar pela migração + secrets VAPID na sequência.