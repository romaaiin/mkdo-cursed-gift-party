export interface GamePreferences {
  music: boolean;
  sounds: boolean;
  animations: boolean;
}

export const DEFAULT_PREFERENCES: GamePreferences = { music: true, sounds: true, animations: true };
export const PREFERENCES_KEY = "mkdo-game-preferences";

export function parsePreferences(raw: string | null): GamePreferences {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (!value || typeof value !== "object") return { ...DEFAULT_PREFERENCES };
    const stored = value as Record<string, unknown>;
    return {
      music: typeof stored.music === "boolean" ? stored.music : true,
      sounds: typeof stored.sounds === "boolean" ? stored.sounds : true,
      animations: typeof stored.animations === "boolean" ? stored.animations : true,
    };
  } catch { return { ...DEFAULT_PREFERENCES }; }
}