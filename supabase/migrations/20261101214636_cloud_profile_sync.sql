-- Synchronize player profile fields across authenticated devices.
alter table public.mkdo_profiles add column if not exists motto text not null default '';

create or replace function public.mkdo_save_profile(p_nickname text,p_avatar text,p_motto text default '')
returns table(nickname text,avatar text,motto text)
language plpgsql security definer set search_path=public
as $function$
declare
 v_user_id uuid:=auth.uid();
 v_nickname text:=trim(coalesce(p_nickname,''));
 v_avatar text:=trim(coalesce(p_avatar,'default'));
 v_motto text:=trim(coalesce(p_motto,''));
begin
 if v_user_id is null then raise exception 'authentication_required'; end if;
 if char_length(v_nickname) not between 2 and 20 then raise exception 'invalid_nickname'; end if;
 if char_length(v_avatar) not between 1 and 64 then raise exception 'invalid_avatar'; end if;
 if char_length(v_motto)>60 then raise exception 'invalid_motto'; end if;
 insert into public.mkdo_profiles(id,nickname,avatar,motto,updated_at)
 values(v_user_id,v_nickname,v_avatar,v_motto,now())
 on conflict(id) do update set nickname=excluded.nickname,avatar=excluded.avatar,motto=excluded.motto,updated_at=now();
 return query select p.nickname,p.avatar,p.motto from public.mkdo_profiles p where p.id=v_user_id;
end;
$function$;
revoke all on function public.mkdo_save_profile(text,text,text) from public,anon;
grant execute on function public.mkdo_save_profile(text,text,text) to authenticated;
