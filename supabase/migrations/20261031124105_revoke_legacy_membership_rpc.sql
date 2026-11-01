-- The legacy public helper is no longer used by RLS policies.
revoke all on function public.mkdo_is_room_member(uuid,uuid) from public, anon, authenticated, service_role;
drop function if exists public.mkdo_is_room_member(uuid,uuid);
