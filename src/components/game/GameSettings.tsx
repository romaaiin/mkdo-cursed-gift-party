import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Settings, Music2, Volume2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { GameAudio } from "@/game/audio";
import { DEFAULT_PREFERENCES, parsePreferences, PREFERENCES_KEY, type GamePreferences } from "@/game/preferences";

const SettingsContext = createContext<{
  preferences: GamePreferences;
  update: (key: keyof GamePreferences, enabled: boolean) => void;
  setGameActive: (active: boolean) => void;
  sound: (kind: "card" | "turn" | "attack" | "win") => void;
} | null>(null);

export function GameSettingsProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [ready, setReady] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const audio = useRef<GameAudio | null>(null);
  useEffect(() => {
    audio.current = new GameAudio();
    try { setPreferences(parsePreferences(localStorage.getItem(PREFERENCES_KEY))); } catch { /* Device storage can be unavailable. */ }
    setReady(true);
    const unlock = () => { void audio.current?.unlock(); };
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("keydown", unlock);
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
      audio.current?.dispose();
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences)); } catch { /* Keep session preferences if storage is unavailable. */ }
    const configure = () => audio.current?.configure(gameActive && preferences.music && !document.hidden, preferences.sounds && !document.hidden);
    configure();
    document.addEventListener("visibilitychange", configure);
    return () => document.removeEventListener("visibilitychange", configure);
  }, [preferences, gameActive, ready]);
  return <SettingsContext.Provider value={{ preferences, update: (key, enabled) => setPreferences(p => ({ ...p, [key]: enabled })), setGameActive, sound: kind => audio.current?.effect(kind) }}>{children}</SettingsContext.Provider>;
}

export function useGameSettings() {
  const settings = useContext(SettingsContext);
  if (!settings) throw new Error("GameSettingsProvider is required");
  return settings;
}

export function SettingsControl() {
  const [open, setOpen] = useState(false);
  const { preferences, update } = useGameSettings();
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);
  return <>
    <Button size="icon" variant="outline" aria-label="Réglages" title="Réglages" onClick={() => setOpen(true)}><Settings /></Button>
    {open && <div className="action-overlay settings-overlay" onClick={() => setOpen(false)}>
      <div className="action-dialog settings-dialog" role="dialog" aria-modal="true" aria-label="Réglages de la partie" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-4"><h2 className="font-display text-xl text-primary">Réglages</h2><Button autoFocus size="icon" variant="ghost" aria-label="Fermer les réglages" onClick={() => setOpen(false)}><X /></Button></div>
        {([{ key: "music", label: "Musique", icon: Music2 }, { key: "sounds", label: "Effets sonores", icon: Volume2 }, { key: "animations", label: "Animations", icon: Sparkles }] as const).map(({ key, label, icon: Icon }) => <label key={key} className="settings-row" htmlFor={`setting-${key}`}><span className="flex items-center gap-3"><Icon className="h-5 w-5 text-secondary" />{label}</span><Switch id={`setting-${key}`} aria-label={label} checked={preferences[key]} onCheckedChange={enabled => update(key, enabled)} /></label>)}
      </div>
    </div>}
  </>;
}