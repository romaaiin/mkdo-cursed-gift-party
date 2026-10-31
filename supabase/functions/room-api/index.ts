import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "authentication_required" }, 401);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anonKey) return json({ error: "server_not_configured" }, 503);

  const client = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) return json({ error: "invalid_session" }, 401);

  let body: { action?: string; nickname?: string; avatar?: string; code?: string; roomId?: string; visibility?: "public" | "private"; maxPlayers?: number; dlc?: boolean };
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  if (body.action === "snapshot") {
    if (!body.roomId) return json({ error: "room_id_required" }, 400);
    const { data: membership } = await client.from("mkdo_room_members").select("user_id").eq("room_id", body.roomId).eq("user_id", auth.user.id).maybeSingle();
    if (!membership) return json({ error: "not_a_room_member" }, 403);
    const [{ data: room, error: roomError }, { data: members, error: membersError }] = await Promise.all([
      client.from("mkdo_rooms").select("id,code,visibility,status,host_id,max_players,dlc_enabled,state_version,created_at,expires_at").eq("id", body.roomId).single(),
      client.from("mkdo_room_members").select("user_id,nickname,avatar,seat,status,joined_at").eq("room_id", body.roomId).order("seat"),
    ]);
    if (roomError || membersError) return json({ error: "room_snapshot_failed" }, 500);
    return json({ room, members, userId: auth.user.id });
  }
  const nickname = (body.nickname ?? "").trim();
  if (nickname.length < 2 || nickname.length > 20) return json({ error: "invalid_nickname" }, 400);
  const avatar = (body.avatar ?? "default").slice(0, 40);
  const maxPlayers = Number(body.maxPlayers ?? 4);
  if (!Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 4) return json({ error: "invalid_capacity" }, 400);

  let roomId: string | null = null;
  let roomCode: string | null = null;
  let created = false;
  if (body.action === "create") {
    const visibility = body.visibility === "private" ? "private" : "public";
    const { data, error } = await client.rpc("mkdo_create_room", {
      p_nickname: nickname, p_avatar: avatar, p_visibility: visibility,
      p_max_players: maxPlayers, p_dlc_enabled: body.dlc === true,
    });
    if (error) return json({ error: error.message }, 400);
    roomId = data?.[0]?.room_id ?? null;
    roomCode = data?.[0]?.room_code ?? null;
    created = true;
  } else if (body.action === "join") {
    if (!body.code || !/^[A-Za-z0-9]{6}$/.test(body.code)) return json({ error: "invalid_room_code" }, 400);
    const { data, error } = await client.rpc("mkdo_join_room", { p_code: body.code, p_nickname: nickname, p_avatar: avatar });
    if (error) return json({ error: error.message }, 400);
    roomId = data;
    roomCode = body.code.toUpperCase();
  } else if (body.action === "matchmake") {
    const { data, error } = await client.rpc("mkdo_quick_match", {
      p_nickname: nickname, p_avatar: avatar, p_max_players: maxPlayers,
    });
    if (error) return json({ error: error.message }, 400);
    roomId = data?.[0]?.room_id ?? null;
    roomCode = data?.[0]?.room_code ?? null;
    created = data?.[0]?.created ?? false;
  } else {
    return json({ error: "unknown_action" }, 400);
  }
  if (!roomId) return json({ error: "room_creation_failed" }, 500);

  const [{ data: room, error: roomError }, { data: members, error: membersError }] = await Promise.all([
    client.from("mkdo_rooms").select("id,code,visibility,status,host_id,max_players,dlc_enabled,state_version,created_at,expires_at").eq("id", roomId).single(),
    client.from("mkdo_room_members").select("user_id,nickname,avatar,seat,status,joined_at").eq("room_id", roomId).order("seat"),
  ]);
  if (roomError || membersError) return json({ error: "room_snapshot_failed" }, 500);
  return json({ room, members, roomCode, created, userId: auth.user.id });
});
