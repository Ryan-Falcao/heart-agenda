
-- agenda_invites
CREATE TABLE public.agenda_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id uuid NOT NULL REFERENCES public.shared_agendas(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL,
  invited_email text,
  code text UNIQUE NOT NULL DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  role public.agenda_role NOT NULL DEFAULT 'editor',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '7 days'
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_invites TO authenticated;
GRANT SELECT ON public.agenda_invites TO anon;
GRANT ALL ON public.agenda_invites TO service_role;

ALTER TABLE public.agenda_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner can insert invite" ON public.agenda_invites
  FOR INSERT TO authenticated
  WITH CHECK (public.is_agenda_owner(agenda_id, auth.uid()));

CREATE POLICY "anyone can read invite" ON public.agenda_invites
  FOR SELECT USING (true);

CREATE POLICY "invited can update status" ON public.agenda_invites
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "owner can delete invite" ON public.agenda_invites
  FOR DELETE TO authenticated
  USING (public.is_agenda_owner(agenda_id, auth.uid()));

CREATE INDEX idx_agenda_invites_email ON public.agenda_invites(invited_email);
CREATE INDEX idx_agenda_invites_agenda ON public.agenda_invites(agenda_id);

-- shared_task_completions
CREATE TABLE public.shared_task_completions (
  task_id uuid NOT NULL REFERENCES public.shared_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_task_completions TO authenticated;
GRANT ALL ON public.shared_task_completions TO service_role;

ALTER TABLE public.shared_task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can manage own completion" ON public.shared_task_completions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "agenda members can view completions" ON public.shared_task_completions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_tasks st
      WHERE st.id = task_id
        AND public.is_agenda_member(st.agenda_id, auth.uid())
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.agenda_invites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_task_completions;
