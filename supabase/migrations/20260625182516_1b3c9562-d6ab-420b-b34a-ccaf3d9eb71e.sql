
revoke execute on function public.is_agenda_member(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.is_agenda_owner(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.agenda_role_of(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.add_owner_as_member() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
