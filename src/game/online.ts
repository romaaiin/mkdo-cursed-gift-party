export interface OnlineSession {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user: { id: string; is_anonymous?: boolean; email?: string };
}
export interface OnlineRoom {
  id: string; code: string; visibility: "public" | "private"; status: string;
  host_id: string; max_players: number; dlc_enabled: boolean; state_version: number;
}
export interface OnlineMember { user_id: string; nickname: string; avatar: string; seat: number; status: string; }
export interface RoomSnapshot { room: OnlineRoom; members: OnlineMember[]; roomCode?: string; created?: boolean; userId: string; }

// These are public client credentials. Environment variables may override them for previews/staging.
const URL = ((import.meta.env["VITE_SUPABASE_URL"] as string | undefined) || "https://jjffnvexrnichsfayhnf.supabase.co").replace(/\/$/, "");
const KEY = (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined) || "sb_publishable_T6T2SSSZZiFc-T_4tf9gxQ_lXrt3uAx";
const SESSION_KEY = "mkdo-online-session-v1";
export const isOnlineConfigured = () => Boolean(URL && KEY);
export const loadOnlineSession = (): OnlineSession | null => {
  try { const value = localStorage.getItem(SESSION_KEY); return value ? JSON.parse(value) as OnlineSession : null; } catch { return null; }
};
export const saveOnlineSession = (session: OnlineSession | null) => {
  if (!session) localStorage.removeItem(SESSION_KEY); else localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};
async function authRequest(path: string, body: unknown): Promise<OnlineSession> {
  const response = await fetch(URL + "/auth/v1/" + path, { method: "POST", headers: { "Content-Type": "application/json", apikey: KEY }, body: JSON.stringify(body) });
  const payload = await response.json() as OnlineSession & { msg?: string; message?: string; error_description?: string; expires_in?: number };
  if (!response.ok || !payload.access_token) throw new Error(payload.msg ?? payload.message ?? payload.error_description ?? "Échec de l'authentification");
  if (!payload.expires_at && payload.expires_in) payload.expires_at = Math.floor(Date.now() / 1000) + payload.expires_in;
  saveOnlineSession(payload); return payload;
}
const captchaSecurity = (captchaToken: string) => ({ gotrue_meta_security: { captcha_token: captchaToken } });
export const signInGuest = (captchaToken: string) => authRequest("signup", { data: { mode: "guest" }, ...captchaSecurity(captchaToken) });
export const signUpAccount = (email: string, password: string, captchaToken: string) => authRequest("signup", { email, password, data: { mode: "account" }, ...captchaSecurity(captchaToken) });
export const signInAccount = (email: string, password: string, captchaToken: string) => authRequest("token?grant_type=password", { email, password, ...captchaSecurity(captchaToken) });

async function freshSession(fallback: OnlineSession): Promise<OnlineSession> {
  const current = loadOnlineSession() ?? fallback;
  if (!current.expires_at || current.expires_at > Math.floor(Date.now() / 1000) + 60) return current;
  if (!current.refresh_token) {
    saveOnlineSession(null);
    throw new Error("Session expirée. Reconnecte-toi pour continuer.");
  }
  try {
    return await authRequest("token?grant_type=refresh_token", { refresh_token: current.refresh_token });
  } catch {
    saveOnlineSession(null);
    throw new Error("Session expirée. Reconnecte-toi pour continuer.");
  }
}
export async function roomApi<T>(session: OnlineSession, body: Record<string, unknown>): Promise<T> {
  const activeSession = await freshSession(session);
  const response = await fetch(URL + "/functions/v1/room-api", {
    method: "POST", headers: { "Content-Type": "application/json", apikey: KEY, Authorization: "Bearer " + activeSession.access_token }, body: JSON.stringify(body),
  });
  const payload = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Erreur du service multijoueur");
  return payload;
}

export interface CloudPlayerProfile { nickname: string; avatar: string; motto: string; }

async function profileRequest<T>(session: OnlineSession, path: string, init: RequestInit = {}): Promise<T> {
  const activeSession = await freshSession(session);
  const response = await fetch(URL + "/rest/v1/" + path, {
    ...init,
    headers: {
      apikey: KEY,
      Authorization: "Bearer " + activeSession.access_token,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => null) as T | { message?: string; details?: string } | null;
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "message" in payload ? payload.message : null;
    throw new Error(message || "Impossible de synchroniser le profil.");
  }
  return payload as T;
}

export async function loadCloudProfile(session: OnlineSession): Promise<CloudPlayerProfile | null> {
  const rows = await profileRequest<CloudPlayerProfile[]>(
    session,
    "mkdo_profiles?select=nickname,avatar,motto&id=eq." + encodeURIComponent(session.user.id),
  );
  const row = rows[0];
  return row ? { nickname: row.nickname, avatar: row.avatar, motto: row.motto ?? "" } : null;
}

export async function saveCloudProfile(session: OnlineSession, profile: CloudPlayerProfile): Promise<CloudPlayerProfile> {
  const rows = await profileRequest<CloudPlayerProfile[]>(
    session,
    "rpc/mkdo_save_profile",
    { method: "POST", body: JSON.stringify({ p_nickname: profile.nickname, p_avatar: profile.avatar, p_motto: profile.motto }) },
  );
  const saved = rows[0];
  if (!saved) throw new Error("Le profil a été enregistré sans réponse exploitable.");
  return { nickname: saved.nickname, avatar: saved.avatar, motto: saved.motto ?? "" };
}
