-- Restrict multiplayer state and RPC execution to the intended trusted roles.
revoke all on public.mkdo_game_states from anon, authenticated;
grant select, insert, update, delete on public.mkdo_game_states to service_role;
drop policy if exists "game state is server only" on public.mkdo_game_states;
create policy "game state is server only" on public.mkdo_game_states
 for all to authenticated using (false) with check (false);

revoke all on function public.mkdo_create_room(text,text,public.mkdo_room_visibility,smallint,boolean) from public, anon;
revoke all on function public.mkdo_join_room(text,text,text) from public, anon;
revoke all on function public.mkdo_quick_match(text,text,smallint) from public, anon;
grant execute on function public.mkdo_create_room(text,text,public.mkdo_room_visibility,smallint,boolean) to authenticated;
grant execute on function public.mkdo_join_room(text,text,text) to authenticated;
grant execute on function public.mkdo_quick_match(text,text,smallint) to authenticated;

revoke all on function public.mkdo_is_room_member(uuid,uuid) from public, anon, authenticated;
grant execute on function public.mkdo_is_room_member(uuid,uuid) to service_role;
