-- MKDO online multiplayer foundation
-- Apply with: supabase db push
create extension if not exists pgcrypto;

create type public.mkdo_room_visibility as enum ('public', 'private');
create type public.mkdo_room_status as enum ('waiting', 'starting', 'playing', 'finished', 'cancelled');
create type public.mkdo_member_status as enum ('connected', 'disconnected', 'left');

create table public.mkdo_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 20),
  avatar text not null default 'default',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mkdo_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  visibility public.mkdo_room_visibility not null,
  status public.mkdo_room_status not null default 'waiting',
  host_id uuid not null references auth.users(id),
  max_players smallint not null default 4 check (max_players between 2 and 4),
  dlc_enabled boolean not null default false,
  game_state jsonb,
  state_version bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 hours')
);
create index mkdo_rooms_matchmaking_idx on public.mkdo_rooms(status, visibility, created_at)
  where status = 'waiting';

create table public.mkdo_room_members (
  room_id uuid not null references public.mkdo_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 20),
  avatar text not null default 'default',
  seat smallint not null check (seat between 0 and 3),
  status public.mkdo_member_status not null default 'connected',
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (room_id, user_id),
  unique (room_id, seat)
);
create index mkdo_room_members_user_idx on public.mkdo_room_members(user_id);

create or replace function public.mkdo_is_room_member(p_room_id uuid, p_user_id uuid)
returns boolean language sql stable security definer set search_path = public
as $ select exists(select 1 from public.mkdo_room_members m where m.room_id = p_room_id and m.user_id = p_user_id) $;

alter table public.mkdo_profiles enable row level security;
alter table public.mkdo_rooms enable row level security;
alter table public.mkdo_room_members enable row level security;

-- A player may only read their own profile. Profile writes are mediated by authenticated APIs.
create policy "profile owner can read" on public.mkdo_profiles
  for select to authenticated using (id = auth.uid());

-- Only members can read private room metadata and membership. Public waiting rooms are discoverable.
create policy "members and public lobby can read rooms" on public.mkdo_rooms
  for select to authenticated using (
    public.mkdo_is_room_member(id, auth.uid())
    or (visibility = 'public' and status = 'waiting')
  );
create policy "members can read room roster" on public.mkdo_room_members
  for select to authenticated using (
    public.mkdo_is_room_member(room_id, auth.uid())
  );

-- Never expose the complete game state (it contains private hands) to clients. Edge Functions use service_role.
revoke select (game_state) on public.mkdo_rooms from anon, authenticated;

-- No direct client INSERT/UPDATE/DELETE policies are intentionally provided.
-- All room lifecycle and game-state mutations must go through trusted Edge Functions.

create or replace function public.mkdo_create_room(
  p_nickname text,
  p_avatar text,
  p_visibility public.mkdo_room_visibility,
  p_max_players smallint default 4,
  p_dlc_enabled boolean default false
) returns table(room_id uuid, room_code text)
language plpgsql security definer set search_path = public
as $$
declare
  v_room_id uuid := gen_random_uuid();
  v_code text;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if char_length(trim(p_nickname)) not between 2 and 20 then raise exception 'invalid_nickname'; end if;
  if p_max_players not between 2 and 4 then raise exception 'invalid_capacity'; end if;
  loop
    v_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 6));
    exit when not exists (select 1 from public.mkdo_rooms r where r.code = v_code);
  end loop;
  insert into public.mkdo_rooms(id, code, visibility, host_id, max_players, dlc_enabled)
  values (v_room_id, v_code, p_visibility, auth.uid(), p_max_players, p_dlc_enabled);
  insert into public.mkdo_room_members(room_id, user_id, nickname, avatar, seat)
  values (v_room_id, auth.uid(), trim(p_nickname), coalesce(nullif(p_avatar, ''), 'default'), 0);
  return query select v_room_id, v_code;
end;
$$;

create or replace function public.mkdo_join_room(
  p_code text,
  p_nickname text,
  p_avatar text
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_room public.mkdo_rooms%rowtype;
  v_seat smallint;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if char_length(trim(p_nickname)) not between 2 and 20 then raise exception 'invalid_nickname'; end if;
  select * into v_room from public.mkdo_rooms
    where code = upper(trim(p_code)) and status = 'waiting' and expires_at > now()
    for update;
  if not found then raise exception 'room_not_found_or_closed'; end if;
  if exists(select 1 from public.mkdo_room_members where room_id = v_room.id and user_id = auth.uid()) then
    return v_room.id;
  end if;
  select seat into v_seat from generate_series(0, v_room.max_players - 1) seat
    where not exists(select 1 from public.mkdo_room_members m where m.room_id = v_room.id and m.seat = seat)
    order by seat limit 1;
  if v_seat is null then raise exception 'room_full'; end if;
  insert into public.mkdo_room_members(room_id, user_id, nickname, avatar, seat)
  values(v_room.id, auth.uid(), trim(p_nickname), coalesce(nullif(p_avatar, ''), 'default'), v_seat);
  return v_room.id;
end;
$$;

create or replace function public.mkdo_quick_match(
  p_nickname text,
  p_avatar text,
  p_max_players smallint default 4
) returns table(room_id uuid, room_code text, created boolean)
language plpgsql security definer set search_path = public
as $$
declare
  v_room public.mkdo_rooms%rowtype;
  v_id uuid;
  v_code text;
  v_seat smallint;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if char_length(trim(p_nickname)) not between 2 and 20 then raise exception 'invalid_nickname'; end if;
  if p_max_players not between 2 and 4 then raise exception 'invalid_capacity'; end if;
  -- Serialize matchmaking to avoid overfilling rooms under concurrent joins.
  perform pg_advisory_xact_lock(hashtext('mkdo_quick_match'));
  select r.* into v_room from public.mkdo_rooms r
    where r.visibility = 'public' and r.status = 'waiting'
      and r.max_players = p_max_players and r.expires_at > now()
      and (select count(*) from public.mkdo_room_members m where m.room_id = r.id) < r.max_players
    order by r.created_at
    for update skip locked limit 1;
  if found then
    select seat into v_seat from generate_series(0, v_room.max_players - 1) seat
      where not exists(select 1 from public.mkdo_room_members m where m.room_id = v_room.id and m.seat = seat)
      order by seat limit 1;
    if v_seat is null then raise exception 'room_full'; end if;
    insert into public.mkdo_room_members(room_id, user_id, nickname, avatar, seat)
    values(v_room.id, auth.uid(), trim(p_nickname), coalesce(nullif(p_avatar, ''), 'default'), v_seat);
    return query select v_room.id, v_room.code, false;
  else
    v_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 6));
    insert into public.mkdo_rooms(code, visibility, host_id, max_players)
    values(v_code, 'public', auth.uid(), p_max_players) returning id into v_id;
    insert into public.mkdo_room_members(room_id, user_id, nickname, avatar, seat)
    values(v_id, auth.uid(), trim(p_nickname), coalesce(nullif(p_avatar, ''), 'default'), 0);
    return query select v_id, v_code, true;
  end if;
end;
$$;

revoke all on function public.mkdo_create_room(text,text,public.mkdo_room_visibility,smallint,boolean) from public;
revoke all on function public.mkdo_join_room(text,text,text) from public;
revoke all on function public.mkdo_quick_match(text,text,smallint) from public;
grant execute on function public.mkdo_create_room(text,text,public.mkdo_room_visibility,smallint,boolean) to authenticated;
grant execute on function public.mkdo_join_room(text,text,text) to authenticated;
grant execute on function public.mkdo_quick_match(text,text,smallint) to authenticated;

-- Realtime publishes roster and room status. Never publish game_state to anon clients.
alter publication supabase_realtime add table public.mkdo_rooms;
alter publication supabase_realtime add table public.mkdo_room_members;
