-- Ensure pgcrypto calls resolve regardless of a restricted function search_path.
create or replace function public.mkdo_create_room(p_nickname text,p_avatar text,p_visibility public.mkdo_room_visibility,p_max_players smallint default 4,p_dlc_enabled boolean default false)
returns table(room_id uuid,room_code text) language plpgsql security definer set search_path=public,extensions
as $function$
declare v_room_id uuid:=gen_random_uuid(); v_code text;
begin
 if auth.uid() is null then raise exception 'authentication_required'; end if;
 if char_length(trim(p_nickname)) not between 2 and 20 then raise exception 'invalid_nickname'; end if;
 if p_max_players not between 2 and 4 then raise exception 'invalid_capacity'; end if;
 loop
  v_code:=upper(substr(encode(extensions.gen_random_bytes(6),'hex'),1,6));
  exit when not exists(select 1 from public.mkdo_rooms r where r.code=v_code);
 end loop;
 insert into public.mkdo_rooms(id,code,visibility,host_id,max_players,dlc_enabled) values(v_room_id,v_code,p_visibility,auth.uid(),p_max_players,p_dlc_enabled);
 insert into public.mkdo_room_members(room_id,user_id,nickname,avatar,seat) values(v_room_id,auth.uid(),trim(p_nickname),coalesce(nullif(p_avatar,''),'default'),0);
 return query select v_room_id,v_code;
end;
$function$;

create or replace function public.mkdo_quick_match(p_nickname text,p_avatar text,p_max_players smallint default 4)
returns table(room_id uuid,room_code text,created boolean) language plpgsql security definer set search_path=public,extensions
as $function$
declare v_room public.mkdo_rooms%rowtype; v_id uuid; v_code text; v_seat smallint;
begin
 if auth.uid() is null then raise exception 'authentication_required'; end if;
 if char_length(trim(p_nickname)) not between 2 and 20 then raise exception 'invalid_nickname'; end if;
 if p_max_players not between 2 and 4 then raise exception 'invalid_capacity'; end if;
 perform pg_advisory_xact_lock(hashtext('mkdo_quick_match'));
 select r.* into v_room from public.mkdo_rooms r where r.visibility='public' and r.status='waiting' and r.max_players=p_max_players and r.expires_at>now()
 and (select count(*) from public.mkdo_room_members m where m.room_id=r.id)<r.max_players order by r.created_at limit 1 for update skip locked;
 if found then
  select s.seat_no into v_seat from generate_series(0,v_room.max_players-1) s(seat_no)
  where not exists(select 1 from public.mkdo_room_members m where m.room_id=v_room.id and m.seat=s.seat_no) order by s.seat_no limit 1;
  if v_seat is null then raise exception 'room_full'; end if;
  insert into public.mkdo_room_members(room_id,user_id,nickname,avatar,seat) values(v_room.id,auth.uid(),trim(p_nickname),coalesce(nullif(p_avatar,''),'default'),v_seat);
  return query select v_room.id,v_room.code,false;
 else
  v_code:=upper(substr(encode(extensions.gen_random_bytes(6),'hex'),1,6));
  insert into public.mkdo_rooms(code,visibility,host_id,max_players) values(v_code,'public',auth.uid(),p_max_players) returning id into v_id;
  insert into public.mkdo_room_members(room_id,user_id,nickname,avatar,seat) values(v_id,auth.uid(),trim(p_nickname),coalesce(nullif(p_avatar,''),'default'),0);
  return query select v_id,v_code,true;
 end if;
end;
$function$;
