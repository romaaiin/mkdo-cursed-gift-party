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
const URL = ((import.meta.env.VITE_SUPABASE_URL as string | undefined) || "https://jjffnvexrnichsfayhnf.supabase.co").replace(/\/$/, "");
const KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || "sb_publishable_T6T2SSSZZiFc-T_4tf9gxQ_lXrt3uAx";
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
export const signInGuest = () => authRequest("signup", { data: { mode: "guest" } });
export const signUpAccount = (email: string, password: string) => authRequest("signup", { email, password, data: { mode: "account" } });
export const signInAccount = (email: string, password: string) => authRequest("token?grant_type=password", { email, password });

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
