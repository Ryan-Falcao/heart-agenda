
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Remove agendamento anterior se existir
do $$
declare jid int;
begin
  select jobid into jid from cron.job where jobname = 'agenda_reminder_scan';
  if jid is not null then
    perform cron.unschedule(jid);
  end if;
end $$;

-- Agenda varredura a cada minuto
select cron.schedule(
  'agenda_reminder_scan',
  '* * * * *',
  $job$
    select net.http_post(
      url := 'https://qdewykdkuorsvfctljgl.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', 'agenda_internal_push_2026_secret_a9f3k2m'
      ),
      body := jsonb_build_object('mode','reminder-scan')
    );
  $job$
);
