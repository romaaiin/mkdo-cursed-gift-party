import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import type { Card } from "@/game/cards";
import {
  createGame,
  endTurn,
  GameError,
  gaugeTotal,
  itemValue,
  playAntidotes,
  playDraw,
  playGift,
  playSirene,
  playTrick,
  playUselessCombo,
  respond,
  riposteOptions,
  type GameState,
  type RiposteChoice,
} from "@/game/engine";
import { aiRiposte, aiStep } from "@/game/ai";
import { CardView } from "./CardView";
import { Gauge } from "./Gauge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine, Maximize, Minimize, X } from "lucide-react";
import table from "@/assets/game-table.jpg";
import { cardArt } from "./card-art";
import { SettingsControl, useGameSettings } from "./GameSettings";

const BOT_NAMES = ["Gros Bulot", "Tata Yolande", "Momie Touthanpéku"];
const ME = "p0";

export function GameBoard({ bots }: { bots: number }) {
  const { preferences, setGameActive, sound } = useGameSettings();
  useEffect(() => { setGameActive(true); return () => setGameActive(false); }, [setGameActive]);
  const newGame = () =>
    createGame([
      { name: "Toi", isAI: false },
      ...BOT_NAMES.slice(0, bots).map((name) => ({ name, isAI: true })),
    ]);
  const [s, setS] = useState<GameState | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [cureA, setCureA] = useState<string[]>([]);
  const [cureG, setCureG] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => setS(newGame()), [bots]); // client-only shuffle

  useEffect(() => {
    if (!s) return;
    sound(s.winner ? "win" : s.pending?.to === ME ? "attack" : "turn");
  }, [s?.seq, s?.pending, s?.winner]);

  // Drive AI turns and AI ripostes
  useEffect(() => {
    if (!s || s.winner) return;
    if (s.pending) {
      const target = s.pending.to;
      const t = s.players.find((p) => p.id === target);
      if (!t?.isAI) return;
      const id = setTimeout(() => setS(respond(s, t.id, aiRiposte(s, t.id))), 800);
      return () => clearTimeout(id);
    }
    if (s.players[s.current]?.isAI) {
      const id = setTimeout(() => setS(aiStep(s)), 900);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [s]);

  const me = s?.players.find((p) => p.id === ME);
  const myTurn = !!s && s.players[s.current]?.id === ME && !s.pending && !s.winner;
  const card = useMemo(() => me?.hand.find((c) => c.id === sel) ?? null, [me, sel]);

  if (!s || !me) return <div className="grid min-h-dvh place-items-center font-display text-2xl">Mélange…</div>;

  const foes = s.players.filter((p) => p.id !== ME);
  const aliveFoes = foes.filter((p) => p.alive);

  const act = (f: () => GameState) => {
    try {
      setS(f());
      setSel(null);
      setCureA([]);
      setCureG([]);
      setErr(null);
    } catch (e) {
      setErr(e instanceof GameError ? e.message : String(e));
    }
  };

  const open = (c: Card) => {
    sound("card");
    setErr(null);
    setSel(sel === c.id ? null : c.id);
    if (c.kind === "antidote") {
      setCureA([c.id]);
      setCureG([]);
    }
  };

  const useless = me.hand.filter((c) => c.kind === "useless");
  const pendingForMe = s.pending && s.pending.to === ME ? s.pending : null;
  const winner = s.players.find((p) => p.id === s.winner);
  const discard = s.discard.at(-1);
  const current = s.players[s.current];
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) { await document.exitFullscreen(); setExpanded(false); }
      else {
        await document.querySelector(".landscape-shell")?.requestFullscreen();
        setExpanded(true);
        const orientation = screen.orientation as ScreenOrientation & { lock?: (mode: string) => Promise<void> };
        await orientation.lock?.("landscape").catch(() => undefined);
      }
    } catch { setExpanded(false); }
  };

  return (
    <main className="landscape-shell">
      <div className="game-stage" data-animations={preferences.animations ? "on" : "off"}>
        <img className="table-art" src={table} alt="" />
        <header className="game-topbar">
          <Link to="/" className="game-brand font-display">Maudits <span className="text-secondary">Cadeaux</span></Link>
          <div className="game-tools">
            <SettingsControl />
            <Button size="icon" variant="outline" title="Plein écran" aria-label="Plein écran" onClick={fullscreen}>{expanded ? <Minimize /> : <Maximize />}</Button>
            <Button size="icon" variant="outline" asChild><Link to="/" aria-label="Quitter la partie" title="Quitter la partie"><X /></Link></Button>
          </div>
        </header>

        {foes.map((f, i) => {
          const position = foes.length === 1 ? "top" : foes.length === 2 ? (i === 0 ? "left" : "right") : i === 1 ? "top" : i === 0 ? "left" : "right";
          const avatar = f.id === "p1" ? "magichien" : f.id === "p2" ? "cacarma" : "momie";
          const art = cardArt({ id: f.id, kind: "trick", effect: avatar, name: f.name, emoji: "", desc: "" });
          return (
            <section key={f.id} className={cn("opponent", `opponent-${position}`, current?.id === f.id && "opponent-active", !f.alive && "opacity-40 grayscale")}>
              <div className="opponent-hand" aria-label={`${f.hand.length} cartes cachées`}>
                {Array.from({ length: Math.min(f.hand.length, 7) }, (_, j) => <span key={j} className="card-back" />)}
              </div>
              <div className="opponent-name flex items-center justify-center gap-2">
                {art && <img src={art} alt="" className="h-7 w-7 rounded-full object-cover" />}
                <span className="min-w-0 flex-1 truncate font-display">{f.alive ? f.name : `💀 ${f.name}`}{f.shielded && " ❄️"}</span>
                <span className="text-primary">{f.hand.length}</span>
              </div>
              <div className="mt-1"><Gauge player={f} compact /><span className="text-[10px]">{gaugeTotal(f)} / 10</span></div>
            </section>
          );
        })}

        <div className="table-center">
          <div className="table-pile">
            <Button variant="ghost" className="h-auto p-0 hover:bg-transparent" disabled={!myTurn} aria-label="Piocher et finir mon tour" title="Piocher et finir mon tour" onClick={() => act(() => endTurn(s, ME))}><span className="card-back" /></Button>
            <span>Pioche · {s.deck.length}</span>
          </div>
          <div className="table-pile">
            {discard ? <CardView card={discard} size="sm" /> : <div className="discard-empty" />}
            <span>Défausse Septique</span>
          </div>
        </div>
        <div className="turn-status" aria-live="polite">
          <strong>{myTurn ? "À toi de maudire !" : `${current?.name ?? ""} joue…`}</strong>
          <p>{s.log.at(-1)}</p>
        </div>

        <section className="player-gauge">
          <p className="font-display text-primary">Ta Maudite Jauge{me.shielded && " ❄️"}</p>
          <Gauge player={me} />
          <p className="mt-2 text-[10px] text-muted-foreground">{me.hand.length} cartes · {myTurn ? `${s.playsLeft} coups` : "En attente"}</p>
        </section>
        <div className="hand-area">
          <div className="hand-scroll">
            <div className="hand-fan" aria-label="Ta main">
              {me.hand.map((c, i) => {
                const offset = i - (me.hand.length - 1) / 2;
                const style = { "--fan-angle": `${Math.max(-14, Math.min(14, offset * 4))}deg`, "--fan-y": `${Math.min(18, Math.abs(offset) * 4)}px` } as CSSProperties;
                return <div key={c.id} className={cn("fan-card", sel === c.id && "is-selected")} style={style}><CardView card={c} selected={sel === c.id} onClick={() => open(c)} /></div>;
              })}
              {!me.hand.length && <p className="py-10 text-sm text-muted-foreground">Main vide…</p>}
            </div>
          </div>
        </div>
        <div className="finish-turn">
          <Button className="btn-slime h-auto w-full gap-2 px-2 py-3 text-xs whitespace-normal" disabled={!myTurn} onClick={() => act(() => endTurn(s, ME))}><ArrowDownToLine />Finir mon tour</Button>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">{s.giftGiven ? "Cadeau offert" : "Cadeau disponible"}</p>
        </div>

        {card && (
          <div className="action-overlay" onClick={() => setSel(null)}>
            <div className="action-dialog" role="dialog" aria-modal="true" aria-label={card.name} onClick={(e) => e.stopPropagation()}>
              <Button size="icon" variant="ghost" className="absolute top-1 right-1" aria-label="Fermer la carte" onClick={() => setSel(null)}><X /></Button>
              <CardView card={card} size="lg" />
              <div className="action-content">
                {myTurn ? <ActionPanel s={s} card={card} useless={useless} aliveFoes={aliveFoes} cureA={cureA} cureG={cureG} setCureA={setCureA} setCureG={setCureG} act={act} err={err} /> : <><h2 className="font-display text-lg text-primary">{card.name}</h2><p className="mt-2 text-sm">{card.desc}</p></>}
              </div>
            </div>
          </div>
        )}
        {pendingForMe && <RiposteModal s={s} onChoose={(c) => act(() => respond(s, ME, c))} />}
        {winner && <div className="action-overlay"><div className="action-dialog flex-col text-center">
          <div className="text-5xl">{winner.id === ME ? "🏆" : "💀"}</div>
          <h2 className="font-display text-3xl text-primary">{winner.id === ME ? "Victoire !" : `${winner.name} gagne`}</h2>
          <Button className="btn-slime h-auto px-8 py-3" onClick={() => { setS(newGame()); setSel(null); }}>Rejouer</Button>
          <Link to="/" className="text-sm underline">Menu</Link>
        </div></div>}
      </div>
    </main>
  );
}

function ActionPanel({
  s, card, useless, aliveFoes, cureA, cureG, setCureA, setCureG, act, err,
}: {
  s: GameState;
  card: Card;
  useless: Card[];
  aliveFoes: GameState["players"];
  cureA: string[];
  cureG: string[];
  setCureA: (v: string[]) => void;
  setCureG: (v: string[]) => void;
  act: (f: () => GameState) => void;
  err: string | null;
}) {
  const me = s.players.find((p) => p.id === ME);
  if (!me) return null;
  const Targets = ({ onPick }: { onPick: (id: string) => void }) => (
    <div className="flex flex-wrap gap-2">
      {aliveFoes.map((f) => (
        <Button key={f.id} className="btn-slime px-4 py-2 text-sm" onClick={() => onPick(f.id)}>
          {f.name} ({gaugeTotal(f)})
        </Button>
      ))}
    </div>
  );
  const toggle = (arr: string[], id: string) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  let body: React.ReactNode = null;
  if (card.kind === "gift") body = <><p>Offrir à :</p><Targets onPick={(t) => act(() => playGift(s, ME, card.id, t))} /></>;
  else if (card.kind === "useless")
    body = useless.length >= 2 ? (
      <>
        <p>Combo 2 Inutiles → Maudit Cadeau 1 pt Inévitable (2 coups) :</p>
        <Targets onPick={(t) => act(() => playUselessCombo(s, ME, [card.id, useless.find((u) => u.id !== card.id)?.id ?? ""], t))} />
      </>
    ) : <p>Inutile seul… Garde-en 2 pour un combo, ou 3 pour un Cacarma.</p>;
  else if (card.kind === "trick")
    body = <><p>Cibler :</p><Targets onPick={(t) => act(() => playTrick(s, ME, card.id, t))} /></>;
  else if (card.kind === "draw" || card.effect === "sirene" || card.effect === "yeti")
    body = (
      <Button className="btn-slime px-6 py-2" onClick={() => act(() => (card.kind === "draw" ? playDraw(s, ME, card.id) : playSirene(s, ME, card.id)))}>
        Jouer la carte
      </Button>
    );
  else if (card.riposte) body = <p>Riposte : se joue automatiquement quand on t'attaque.</p>;
  else if (card.kind === "antidote") {
    const antis = me.hand.filter((c) => c.kind === "antidote");
    const a = antis.filter((c) => cureA.includes(c.id)).reduce((x, c) => x + (c.value ?? 0), 0);
    const g = me.gauge.filter((it) => cureG.includes(it.id)).reduce((x, it) => x + itemValue(it), 0);
    body = me.gauge.length ? (
      <>
        <p>Antidotes :</p>
        <div className="flex flex-wrap gap-1">
          {antis.map((c) => (
            <Button key={c.id} onClick={() => setCureA(toggle(cureA, c.id))}
              className={cn("rounded-full border-2 border-ink px-3 py-1 text-xs font-bold", cureA.includes(c.id) ? "bg-k-antidote text-ink" : "bg-muted")}>
              -{c.value}
            </Button>
          ))}
        </div>
        <p>Cadeaux à guérir :</p>
        <div className="flex flex-wrap gap-1">
          {me.gauge.map((it) => (
            <Button key={it.id} onClick={() => setCureG(toggle(cureG, it.id))}
              className={cn("rounded-full border-2 border-ink px-3 py-1 text-xs font-bold", cureG.includes(it.id) ? "bg-k-gift text-ink" : "bg-muted")}>
              {it.base[0]?.emoji} {itemValue(it)}
            </Button>
          ))}
        </div>
        <Button className="btn-slime px-6 py-2" disabled={a !== g || !g} onClick={() => act(() => playAntidotes(s, ME, cureA, cureG))}>
          Guérir ({a} / {g})
        </Button>
      </>
    ) : <p>Ta jauge est vide, rien à guérir.</p>;
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="flex gap-3">
        
        <div>
          <p className="font-display text-base">{card.name}</p>
          <p className="text-xs text-muted-foreground">{card.desc}</p>
        </div>
      </div>
      {body}
      {err && <p className="font-bold text-destructive">{err}</p>}
    </div>
  );
}

const RIPOSTE_LABEL: Record<RiposteChoice, string> = {
  protection: "🐟 Protection de la Raie",
  cacarma: "🔄 Cacarma",
  combo3: "🔄 Cacarma (3 Inutiles)",
};

function RiposteModal({ s, onChoose }: { s: GameState; onChoose: (c: RiposteChoice | null) => void }) {
  const p = s.pending;
  if (!p) return null;
  const from = s.players.find((x) => x.id === p.from);
  const what = p.type === "gift" ? p.item.base[0] : p.card;
  if (!what || !from) return null;
  const opts = riposteOptions(s, ME);
  return (
    <div className="action-overlay">
      <div className="action-dialog" role="dialog" aria-modal="true" aria-label="Riposte">
        <CardView card={what} size="lg" />
        <div className="action-content">
        <p className="font-display text-xl text-secondary">{from.name} t'attaque !</p>
        <p className="my-3 text-xs text-muted-foreground">{what.desc}</p>
        <div className="grid gap-2">
          {opts.map((o) => (
            <Button key={o} className="btn-slime py-3" onClick={() => onChoose(o)}>{RIPOSTE_LABEL[o]}</Button>
          ))}
          <Button className="rounded-full border-2 border-border py-2 text-sm" onClick={() => onChoose(null)}>
            Accepter le cadeau
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
}
