-- Move the RLS membership predicate into a non-exposed schema.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;

create or replace function private.mkdo_is_room_member(p_room_id uuid,p_user_id uuid)
returns boolean language sql stable security definer set search_path=public
as $function$
 select exists(select 1 from public.mkdo_room_members m where m.room_id=p_room_id and m.user_id=p_user_id)
$function$;
revoke all on function private.mkdo_is_room_member(uuid,uuid) from public, anon;
grant execute on function private.mkdo_is_room_member(uuid,uuid) to authenticated, service_role;

drop policy if exists "members and public lobby can read rooms" on public.mkdo_rooms;
create policy "members and public lobby can read rooms" on public.mkdo_rooms
 for select to authenticated using (
  private.mkdo_is_room_member(id,(select auth.uid()))
  or (visibility='public' and status='waiting')
);
drop policy if exists "members can read room roster" on public.mkdo_room_members;
create policy "members can read room roster" on public.mkdo_room_members
 for select to authenticated using (private.mkdo_is_room_member(room_id,(select auth.uid())));
