export interface PlayerProfile { name: string; avatar: string; motto: string }
export interface ResultRow { name: string; place: number; gauge: number; isMe: boolean }
export interface GameRecord { id: string; date: string; won: boolean; turns: number; results: ResultRow[] }

export const PROFILE_KEY = "mkdo-profile";
export const HISTORY_KEY = "mkdo-history";
export const TURN_SECONDS = 60;
export const DEFAULT_PROFILE: PlayerProfile = { name: "Toi", avatar: "gift", motto: "" };

export function parseProfile(raw: string | null): PlayerProfile {
  try {
    const v = JSON.parse(raw ?? "null") as Record<string, unknown> | null;
    if (!v || typeof v !== "object") return { ...DEFAULT_PROFILE };
    const name = typeof v["name"] === "string" ? v["name"].trim().slice(0, 20) : "";
    return {
      name: name || DEFAULT_PROFILE.name,
      avatar: typeof v["avatar"] === "string" ? v["avatar"] : DEFAULT_PROFILE.avatar,
      motto: typeof v["motto"] === "string" ? v["motto"].slice(0, 60) : "",
    };
  } catch { return { ...DEFAULT_PROFILE }; }
}

export function parseHistory(raw: string | null): GameRecord[] {
  try { const v: unknown = JSON.parse(raw ?? "[]"); return Array.isArray(v) ? (v as GameRecord[]) : []; } catch { return []; }
}

/** Newest first, capped at 50 games. */
export function addRecord(history: GameRecord[], record: GameRecord): GameRecord[] {
  return [record, ...history.filter(r => r.id !== record.id)].slice(0, 50);
}

/** Winner is 1st; eliminated players are ranked by reverse elimination order. */
export function rankPlayers(players: { id: string; name: string }[], winnerId: string, eliminated: string[], gauges: Record<string, number>, meId: string): ResultRow[] {
  const order = [winnerId, ...[...eliminated].reverse().filter(id => id !== winnerId)];
  return order.map((id, i) => {
    const p = players.find(x => x.id === id)!;
    return { name: p.name, place: i + 1, gauge: gauges[id] ?? 0, isMe: id === meId };
  });
}

export function nextSecondsLeft(left: number) { return Math.max(0, left - 1); }

export function loadLocal<T>(key: string, parse: (raw: string | null) => T): T {
  try { return parse(localStorage.getItem(key)); } catch { return parse(null); }
}
export function saveLocal(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}
