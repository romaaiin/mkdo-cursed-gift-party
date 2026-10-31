import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Copy, Globe2, LockKeyhole, Users } from "lucide-react";
import background from "@/assets/lobby-background.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_PROFILE, loadLocal, parseProfile, PROFILE_KEY } from "@/game/profile";
import { isOnlineConfigured, loadOnlineSession, roomApi, saveOnlineSession, signInAccount, signInGuest, signUpAccount, type OnlineSession, type RoomSnapshot } from "@/game/online";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: { sitekey: string; callback: (token: string) => void; "expired-callback"?: () => void; "error-callback"?: (code?: string) => boolean | void; theme?: "light" | "dark" | "auto" }) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const TURNSTILE_SITE_KEY = import.meta.env["VITE_TURNSTILE_SITE_KEY"] as string | undefined;

// TEMPORARY diagnostic (non-sensitive): short sitekey fingerprint + document/frame origins at render time.
const keyFingerprint = (key: string) => `${key.slice(0, 6)}…${key.slice(-4)} (${key.length} car.)`;
interface TurnstileDiag { hostname: string; inFrame: boolean; topHost: string; ancestors: string; scripts: number; widgets: number; renderedKey: string; }
function readFrameInfo() {
  let inFrame = false; let topHost = "?";
  try { inFrame = window.self !== window.top; } catch { inFrame = true; }
  try { topHost = window.top?.location.hostname ?? "?"; } catch { topHost = "inaccessible (autre domaine)"; }
  const list = (window.location as Location & { ancestorOrigins?: DOMStringList }).ancestorOrigins;
  const ancestors = list ? Array.from({ length: list.length }, (_, i) => list.item(i) ?? "").join(" › ") || "aucun" : "non exposé";
  return { inFrame, topHost, ancestors };
}

function TurnstileBox({ onToken, resetKey }: { onToken: (token: string | null) => void; resetKey: number }) {
  const container = useRef<HTMLDivElement>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [diag, setDiag] = useState<TurnstileDiag | null>(null);
  useEffect(() => {
    onToken(null);
    if (!TURNSTILE_SITE_KEY || !container.current) return;
    let widgetId: string | undefined;
    let active = true;
    const render = () => {
      if (!active || !container.current || !window.turnstile || widgetId) return;
      const options = {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "auto" as const,
        callback: (token: string) => { setErrorCode(null); onToken(token); },
        "expired-callback": () => onToken(null),
        "error-callback": (code?: string) => { setErrorCode(code ?? "inconnu"); onToken(null); return false; },
      };
      widgetId = window.turnstile.render(container.current, options);
      const next: TurnstileDiag = {
        hostname: window.location.hostname,
        ...readFrameInfo(),
        scripts: document.querySelectorAll('script[src*="challenges.cloudflare.com/turnstile"]').length,
        widgets: document.querySelectorAll('iframe[src*="challenges.cloudflare.com"]').length,
        renderedKey: keyFingerprint(options.sitekey),
      };
      console.info("[turnstile-diag]", next);
      setDiag(next);
    };
    const existing = document.getElementById("cloudflare-turnstile-script") as HTMLScriptElement | null;
    if (window.turnstile) render();
    else if (existing) existing.addEventListener("load", render);
    else {
      const script = document.createElement("script");
      script.id = "cloudflare-turnstile-script";
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", render);
      script.addEventListener("error", () => onToken(null));
      document.head.appendChild(script);
    }
    const recount = window.setTimeout(() => setDiag(d => d && { ...d, widgets: document.querySelectorAll('iframe[src*="challenges.cloudflare.com"]').length }), 3000);
    return () => {
      active = false;
      window.clearTimeout(recount);
      if (existing) existing.removeEventListener("load", render);
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [onToken, resetKey]);
  return <div className="space-y-1"><div ref={container} />{errorCode && <p className="text-xs text-destructive">Vérification indisponible (code Cloudflare {errorCode}). {errorCode.startsWith("1102") ? "Ce site n'est pas autorisé pour cette clé Turnstile." : "Réessaie dans un instant."}</p>}{!TURNSTILE_SITE_KEY && <p className="text-xs text-destructive">Configuration Turnstile manquante : VITE_TURNSTILE_SITE_KEY.</p>}
    {diag && <dl className="rounded border border-dashed p-2 font-mono text-[10px] leading-tight text-muted-foreground" aria-label="Diagnostic Turnstile">
      <div>Diagnostic temporaire</div>
      <div>page : {diag.hostname}</div>
      <div>dans un cadre : {diag.inFrame ? "oui" : "non"} · page parente : {diag.topHost}</div>
      <div>origines parentes : {diag.ancestors}</div>
      <div>clé utilisée : {diag.renderedKey}</div>
      <div>scripts Turnstile : {diag.scripts} · widgets : {diag.widgets}</div>
    </dl>}
  </div>;
}

export const Route = createFileRoute("/en-ligne")({ component: OnlinePage });
function OnlinePage() {
  const [profile] = useState(() => loadLocal(PROFILE_KEY, parseProfile) ?? DEFAULT_PROFILE);
  const [session, setSession] = useState<OnlineSession | null>(() => loadOnlineSession());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const configured = isOnlineConfigured();
  const captchaConfigured = Boolean(TURNSTILE_SITE_KEY);
  const onCaptchaToken = useCallback((token: string | null) => setCaptchaToken(token), []);
  const run = async (action: () => Promise<void>) => { setBusy(true); setError(""); setNotice(""); try { await action(); } catch (e) { setError(e instanceof Error ? e.message : "Une erreur est survenue"); } finally { setBusy(false); } };
  const authenticateWithCaptcha = (auth: (token: string) => Promise<OnlineSession>) => run(async () => {
    if (!captchaToken) throw new Error("Valide le contrôle anti-robot avant de continuer.");
    const token = captchaToken;
    setCaptchaToken(null);
    try {
      const next = await auth(token);
      setSession(next);
      setNotice(next.user.is_anonymous ? "Session invité créée." : "Connexion réussie.");
    } finally {
      setCaptchaResetKey(value => value + 1);
    }
  });
  const create = (visibility: "public" | "private") => run(async () => {
    if (!session) throw new Error("Connecte-toi d'abord.");
    setSnapshot(await roomApi<RoomSnapshot>(session, { action: "create", visibility, nickname: profile.name, avatar: profile.avatar, maxPlayers: 4 }));
  });
  const match = () => run(async () => {
    if (!session) throw new Error("Connecte-toi d'abord.");
    const result = await roomApi<RoomSnapshot>(session, { action: "matchmake", nickname: profile.name, avatar: profile.avatar, maxPlayers: 4 });
    setSnapshot(result); setNotice(result.created ? "Recherche lancée : en attente d'autres joueurs." : "Salle trouvée : tu as rejoint la partie.");
  });
  const join = () => run(async () => {
    if (!session) throw new Error("Connecte-toi d'abord.");
    setSnapshot(await roomApi<RoomSnapshot>(session, { action: "join", code, nickname: profile.name, avatar: profile.avatar }));
  });
  useEffect(() => {
    if (!session || !snapshot?.room.id) return;
    let active = true;
    const refresh = async () => { try { const next = await roomApi<RoomSnapshot>(session, { action: "snapshot", roomId: snapshot.room.id }); if (active) setSnapshot(next); } catch (e) { if (active) setError(e instanceof Error ? e.message : "Synchronisation interrompue"); } };
    const id = window.setInterval(refresh, 2500);
    return () => { active = false; window.clearInterval(id); };
  }, [session, snapshot?.room.id]);
  return <main className="landscape-shell"><div className="game-stage lobby-stage"><img src={background} alt="" className="table-art" />
    <section className="page-panel"><header className="flex items-center gap-3"><Button size="icon" variant="outline" asChild><Link to="/" aria-label="Retour"><ArrowLeft /></Link></Button><h1 className="font-display text-2xl text-primary">Parties en ligne</h1></header>
    <div className="page-scroll space-y-4">
      {!configured && <div className="rounded-lg border border-amber-500/50 bg-amber-950/20 p-3 text-sm"><strong>Backend à configurer.</strong><p>Le lobby ne peut pas se connecter tant que le projet Supabase n'est pas configuré.</p></div>}
      {!session ? <div className="space-y-3"><div className="rounded-lg border p-3 space-y-2"><h2 className="font-display text-lg">Vérification anti-robot</h2><p className="text-xs text-muted-foreground">Cette vérification protège la création de compte et la connexion.</p><TurnstileBox onToken={onCaptchaToken} resetKey={captchaResetKey} /></div><div className="grid gap-3 md:grid-cols-2"><div className="rounded-lg border p-3 space-y-2"><h2 className="font-display text-lg">Jouer en invité</h2><p className="text-xs text-muted-foreground">Connexion immédiate sans inscription.</p><Button className="btn-slime w-full" disabled={!configured || !captchaConfigured || !captchaToken || busy} onClick={() => authenticateWithCaptcha(signInGuest)}>Continuer en invité</Button></div><div className="rounded-lg border p-3 space-y-2"><h2 className="font-display text-lg">Compte joueur</h2><Input type="email" placeholder="Adresse e-mail" value={email} onChange={e => setEmail(e.target.value)} /><Input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} /><div className="flex gap-2"><Button variant="outline" disabled={!configured || !captchaConfigured || !captchaToken || busy || !email || password.length < 8} onClick={() => authenticateWithCaptcha(token => signInAccount(email, password, token))}>Connexion</Button><Button className="btn-slime" disabled={!configured || !captchaConfigured || !captchaToken || busy || !email || password.length < 8} onClick={() => authenticateWithCaptcha(token => signUpAccount(email, password, token))}>Créer</Button></div><p className="text-[11px] text-muted-foreground">Mot de passe : 8 caractères minimum.</p></div></div></div> : <div className="rounded-lg border p-3 flex flex-wrap items-center justify-between gap-2"><span className="text-sm">Connecté : <strong>{profile.name}</strong> {session.user.is_anonymous ? "(invité)" : "(compte)"}</span><Button variant="outline" size="sm" onClick={() => { saveOnlineSession(null); setSession(null); setSnapshot(null); }}>Déconnexion</Button></div>}
      {session && !snapshot && <div className="grid gap-3 md:grid-cols-2"><div className="rounded-lg border p-3 space-y-2"><Globe2 className="text-primary" /><h2 className="font-display text-lg">Partie aléatoire</h2><p className="text-xs text-muted-foreground">Rejoins une salle publique mondiale ou en crées une si aucune place n'est disponible.</p><Button className="btn-slime w-full" disabled={busy} onClick={match}>Trouver des joueurs</Button></div><div className="rounded-lg border p-3 space-y-2"><LockKeyhole className="text-primary" /><h2 className="font-display text-lg">Partie privée</h2><Button className="btn-slime w-full" disabled={busy} onClick={() => create("private")}>Créer une salle privée</Button><div className="flex gap-2"><Input placeholder="Code à 6 caractères" maxLength={6} value={code} onChange={e => setCode(e.target.value.toUpperCase())} /><Button variant="outline" disabled={busy || code.length !== 6} onClick={join}>Rejoindre</Button></div></div></div>}
      {snapshot && <div className="rounded-lg border p-3 space-y-3"><div className="flex items-center justify-between gap-2"><h2 className="font-display text-lg">{snapshot.room.visibility === "private" ? "Salle privée" : "Salle publique"}</h2><span className="text-xs text-muted-foreground">{snapshot.members.length}/{snapshot.room.max_players} joueurs</span></div><div className="flex items-center gap-2"><span className="font-mono text-2xl tracking-widest">{snapshot.room.code}</span><Button size="icon" variant="outline" onClick={() => navigator.clipboard.writeText(snapshot.room.code)} aria-label="Copier le code"><Copy /></Button></div><div className="space-y-2">{snapshot.members.map(m => <div key={m.user_id} className="flex items-center gap-2 rounded-md bg-muted/40 p-2 text-sm"><Users className="h-4 w-4" /><span>{m.nickname}</span>{m.user_id === snapshot.room.host_id && <span className="ml-auto text-xs text-primary">Hôte</span>}</div>)}</div><p className="text-xs text-muted-foreground">En attente des autres joueurs. Synchronisation périodique du lobby.</p><Button variant="outline" onClick={() => setSnapshot(null)}>Retour aux salons</Button></div>}
      {busy && <p className="text-xs text-muted-foreground">Connexion en cours…</p>}{notice && <p className="text-sm text-primary">{notice}</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div></section></div></main>;
}
