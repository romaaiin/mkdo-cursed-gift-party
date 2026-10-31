export interface OnlineSession {
  access_token: string;
  refresh_token?: string;
  user: { id: string; is_anonymous?: boolean; email?: string };
}
export interface OnlineRoom {
  id: string; code: string; visibility: "public" | "private"; status: string;
  host_id: string; max_players: number; dlc_enabled: boolean; state_version: number;
}
export interface OnlineMember { user_id: string; nickname: string; avatar: string; seat: number; status: string; }
export interface RoomSnapshot { room: OnlineRoom; members: OnlineMember[]; roomCode?: string; created?: boolean; userId: string; }
const URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "");
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const SESSION_KEY = "mkdo-online-session-v1";
export const isOnlineConfigured = () => Boolean(URL && KEY);
export const loadOnlineSession = (): OnlineSession | null => {
  try { const value = localStorage.getItem(SESSION_KEY); return value ? JSON.parse(value) as OnlineSession : null; } catch { return null; }
};
export const saveOnlineSession = (session: OnlineSession | null) => {
  if (!session) localStorage.removeItem(SESSION_KEY); else localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};
async function authRequest(path: string, body: unknown): Promise<OnlineSession> {
  if (!URL || !KEY) throw new Error("Le mode en ligne n'est pas configuré.");
  const response = await fetch(URL + "/auth/v1/" + path, { method: "POST", headers: { "Content-Type": "application/json", apikey: KEY }, body: JSON.stringify(body) });
  const payload = await response.json() as OnlineSession & { msg?: string; message?: string; error_description?: string };
  if (!response.ok || !payload.access_token) throw new Error(payload.msg ?? payload.message ?? payload.error_description ?? "Échec de l'authentification");
  saveOnlineSession(payload); return payload;
}
export const signInGuest = () => authRequest("signup", { data: { mode: "guest" } });
export const signUpAccount = (email: string, password: string) => authRequest("signup", { email, password, data: { mode: "account" } });
export const signInAccount = (email: string, password: string) => authRequest("token?grant_type=password", { email, password });
export async function roomApi<T>(session: OnlineSession, body: Record<string, unknown>): Promise<T> {
  if (!URL || !KEY) throw new Error("Le mode en ligne n'est pas configuré.");
  const response = await fetch(URL + "/functions/v1/room-api", {
    method: "POST", headers: { "Content-Type": "application/json", apikey: KEY, Authorization: "Bearer " + session.access_token }, body: JSON.stringify(body),
  });
  const payload = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Erreur du service multijoueur");
  return payload;
}
