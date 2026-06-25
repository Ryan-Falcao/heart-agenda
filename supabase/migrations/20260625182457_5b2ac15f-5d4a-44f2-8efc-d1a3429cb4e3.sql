
-- ============ ENUMS ============
do $$ begin
  create type public.friendship_status as enum ('pending','accepted','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.agenda_role as enum ('owner','editor','viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.task_status as enum ('pending','in_progress','done');
exception when duplicate_object then null; end $$;

-- ============ PROFILES email column (if missing) ============
alter table public.profiles add column if not exists email text;

-- Backfill email from auth.users
update public.profiles p set email = u.email
from auth.users u where p.id = u.id and (p.email is null or p.email = '');

-- Update handle_new_user to also copy email
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, sobrenome, data_nascimento, avatar_url, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', ''),
    coalesce(new.raw_user_meta_data->>'sobrenome', ''),
    nullif(new.raw_user_meta_data->>'data_nascimento','')::date,
    new.raw_user_meta_data->>'avatar_url',
    new.email
  );
  return new;
end;
$$;

-- Ensure trigger exists on auth.users
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end $$;

-- Allow authenticated users to look up other profiles (needed for friend search)
drop policy if exists "Authenticated can view profiles" on public.profiles;
create policy "Authenticated can view profiles"
on public.profiles for select
to authenticated
using (true);

-- ============ FRIENDSHIPS ============
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id)
);

create unique index if not exists friendships_pair_uniq
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

grant select, insert, update, delete on public.friendships to authenticated;
grant all on public.friendships to service_role;
alter table public.friendships enable row level security;

drop policy if exists "Users see own friendships" on public.friendships;
create policy "Users see own friendships" on public.friendships for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "Users create friendships they send" on public.friendships;
create policy "Users create friendships they send" on public.friendships for insert to authenticated
  with check (auth.uid() = requester_id);

drop policy if exists "Users update own friendships" on public.friendships;
create policy "Users update own friendships" on public.friendships for update to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id)
  with check (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "Users delete own friendships" on public.friendships;
create policy "Users delete own friendships" on public.friendships for delete to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- ============ FRIEND INVITE CODES ============
create table if not exists public.friend_invite_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists friend_invite_codes_user_idx on public.friend_invite_codes(user_id);

grant select, insert, update, delete on public.friend_invite_codes to authenticated;
grant all on public.friend_invite_codes to service_role;
alter table public.friend_invite_codes enable row level security;

drop policy if exists "Authenticated read invite codes" on public.friend_invite_codes;
create policy "Authenticated read invite codes" on public.friend_invite_codes for select to authenticated using (true);

drop policy if exists "Users manage own codes" on public.friend_invite_codes;
create policy "Users manage own codes" on public.friend_invite_codes for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ SHARED AGENDAS ============
create table if not exists public.shared_agendas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  color text not null default '#2563EB',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.shared_agendas to authenticated;
grant all on public.shared_agendas to service_role;
alter table public.shared_agendas enable row level security;

create table if not exists public.shared_agenda_members (
  agenda_id uuid not null references public.shared_agendas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.agenda_role not null default 'viewer',
  joined_at timestamptz not null default now(),
  primary key (agenda_id, user_id)
);

grant select, insert, update, delete on public.shared_agenda_members to authenticated;
grant all on public.shared_agenda_members to service_role;
alter table public.shared_agenda_members enable row level security;

-- Security definer helpers (avoid RLS recursion)
create or replace function public.is_agenda_member(_agenda uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.shared_agenda_members where agenda_id = _agenda and user_id = _user)
$$;

create or replace function public.is_agenda_owner(_agenda uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.shared_agendas where id = _agenda and owner_id = _user)
$$;

create or replace function public.agenda_role_of(_agenda uuid, _user uuid)
returns public.agenda_role language sql stable security definer set search_path = public as $$
  select role from public.shared_agenda_members where agenda_id = _agenda and user_id = _user
$$;

-- Policies for shared_agendas
drop policy if exists "Members read agendas" on public.shared_agendas;
create policy "Members read agendas" on public.shared_agendas for select to authenticated
  using (public.is_agenda_member(id, auth.uid()));

drop policy if exists "Users create their agendas" on public.shared_agendas;
create policy "Users create their agendas" on public.shared_agendas for insert to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "Owner updates agenda" on public.shared_agendas;
create policy "Owner updates agenda" on public.shared_agendas for update to authenticated
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "Owner deletes agenda" on public.shared_agendas;
create policy "Owner deletes agenda" on public.shared_agendas for delete to authenticated
  using (auth.uid() = owner_id);

-- Policies for shared_agenda_members
drop policy if exists "Members read members" on public.shared_agenda_members;
create policy "Members read members" on public.shared_agenda_members for select to authenticated
  using (public.is_agenda_member(agenda_id, auth.uid()));

drop policy if exists "Owner manages members" on public.shared_agenda_members;
create policy "Owner manages members" on public.shared_agenda_members for all to authenticated
  using (public.is_agenda_owner(agenda_id, auth.uid()) or auth.uid() = user_id)
  with check (public.is_agenda_owner(agenda_id, auth.uid()) or auth.uid() = user_id);

-- Auto-add owner as member when agenda is created
create or replace function public.add_owner_as_member()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.shared_agenda_members (agenda_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists trg_add_owner_as_member on public.shared_agendas;
create trigger trg_add_owner_as_member
  after insert on public.shared_agendas
  for each row execute function public.add_owner_as_member();

-- ============ SHARED TASKS ============
create table if not exists public.shared_tasks (
  id uuid primary key default gen_random_uuid(),
  agenda_id uuid not null references public.shared_agendas(id) on delete cascade,
  title text not null,
  description text,
  due_date timestamptz,
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete cascade,
  status public.task_status not null default 'pending',
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shared_tasks_agenda_idx on public.shared_tasks(agenda_id);
create index if not exists shared_tasks_due_idx on public.shared_tasks(due_date);

grant select, insert, update, delete on public.shared_tasks to authenticated;
grant all on public.shared_tasks to service_role;
alter table public.shared_tasks enable row level security;

drop policy if exists "Members read tasks" on public.shared_tasks;
create policy "Members read tasks" on public.shared_tasks for select to authenticated
  using (public.is_agenda_member(agenda_id, auth.uid()));

drop policy if exists "Editors insert tasks" on public.shared_tasks;
create policy "Editors insert tasks" on public.shared_tasks for insert to authenticated
  with check (
    public.agenda_role_of(agenda_id, auth.uid()) in ('owner','editor')
    and auth.uid() = created_by
  );

drop policy if exists "Editors update tasks" on public.shared_tasks;
create policy "Editors update tasks" on public.shared_tasks for update to authenticated
  using (public.agenda_role_of(agenda_id, auth.uid()) in ('owner','editor'))
  with check (public.agenda_role_of(agenda_id, auth.uid()) in ('owner','editor'));

drop policy if exists "Editors delete tasks" on public.shared_tasks;
create policy "Editors delete tasks" on public.shared_tasks for delete to authenticated
  using (public.agenda_role_of(agenda_id, auth.uid()) in ('owner','editor'));

-- Realtime
alter publication supabase_realtime add table public.shared_tasks;
alter table public.shared_tasks replica identity full;

-- ============ PUSH SUBSCRIPTIONS ============
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant all on public.push_subscriptions to service_role;
alter table public.push_subscriptions enable row level security;

drop policy if exists "Users manage own subscriptions" on public.push_subscriptions;
create policy "Users manage own subscriptions" on public.push_subscriptions for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ NOTIFICATION PREFERENCES ============
create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  push_enabled boolean not null default true,
  minutes_before integer not null default 10,
  sound_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.notification_preferences to authenticated;
grant all on public.notification_preferences to service_role;
alter table public.notification_preferences enable row level security;

drop policy if exists "Users manage own prefs" on public.notification_preferences;
create policy "Users manage own prefs" on public.notification_preferences for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ UPDATED_AT TRIGGERS ============
drop trigger if exists trg_friendships_updated on public.friendships;
create trigger trg_friendships_updated before update on public.friendships
  for each row execute function public.set_updated_at();

drop trigger if exists trg_shared_agendas_updated on public.shared_agendas;
create trigger trg_shared_agendas_updated before update on public.shared_agendas
  for each row execute function public.set_updated_at();

drop trigger if exists trg_shared_tasks_updated on public.shared_tasks;
create trigger trg_shared_tasks_updated before update on public.shared_tasks
  for each row execute function public.set_updated_at();
