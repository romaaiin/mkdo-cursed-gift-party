import { useEffect, useMemo, useState } from "react";
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

const BOT_NAMES = ["Gros Bulot", "Tata Yolande", "Momie Touthanpéku"];
const ME = "p0";

export function GameBoard({ bots }: { bots: number }) {
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

  useEffect(() => setS(newGame()), [bots]); // client-only shuffle

  // Drive AI turns and AI ripostes
  useEffect(() => {
    if (!s || s.winner) return;
    if (s.pending) {
      const t = s.players.find((p) => p.id === s.pending!.to)!;
      if (!t.isAI) return;
      const id = setTimeout(() => setS(respond(s, t.id, aiRiposte(s, t.id))), 800);
      return () => clearTimeout(id);
    }
    if (s.players[s.current]!.isAI) {
      const id = setTimeout(() => setS(aiStep(s)), 900);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [s]);

  const me = s?.players.find((p) => p.id === ME);
  const myTurn = !!s && s.players[s.current]!.id === ME && !s.pending && !s.winner;
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
    setErr(null);
    setSel(sel === c.id ? null : c.id);
    if (c.kind === "antidote") {
      setCureA([c.id]);
      setCureG([]);
    }
  };

  const useless = me.hand.filter((c) => c.kind === "useless");
  const lastLog = s.log.slice(-3);
  const pendingForMe = s.pending && s.pending.to === ME ? s.pending : null;
  const winner = s.winner ? s.players.find((p) => p.id === s.winner)! : null;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-3 px-3 pt-3 pb-4">
      {/* Opponents */}
      <div className="flex items-start justify-between gap-2">
        <Link to="/" className="font-display text-xl text-primary">✕</Link>
        <div className="grid flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${foes.length}, minmax(0,1fr))` }}>
          {foes.map((f) => (
            <div
              key={f.id}
              className={cn(
                "zone-neon p-2",
                s.players[s.current]!.id === f.id && "ring-4 ring-accent",
                !f.alive && "opacity-40 grayscale",
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="truncate font-display text-sm">{f.alive ? f.name : `💀 ${f.name}`}{f.shielded && " ❄️"}</span>
                <span className="text-[10px] text-muted-foreground">🃏{f.hand.length}</span>
              </div>
              <Gauge player={f} />
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="zone-neon flex items-center gap-3 p-3">
        <div className="flex flex-col items-center">
          <div className="sticker grid h-20 w-14 place-items-center rounded-lg bg-secondary font-display text-lg text-secondary-foreground">
            {s.deck.length}
          </div>
          <span className="mt-1 text-[10px] text-muted-foreground">Pioche</span>
        </div>
        <div className="flex flex-col items-center">
          {s.discard.length ? (
            <CardView card={s.discard[s.discard.length - 1]!} size="sm" />
          ) : (
            <div className="h-20 w-14 rounded-lg border-2 border-dashed" />
          )}
          <span className="mt-1 text-[10px] text-muted-foreground">Défausse Septique</span>
        </div>
        <ul className="flex-1 space-y-1 text-xs leading-tight">
          {lastLog.map((l, i) => (
            <li key={i} className={i === lastLog.length - 1 ? "font-semibold" : "text-muted-foreground"}>
              {l}
            </li>
          ))}
        </ul>
      </div>

      {/* Me */}
      <div className="zone-neon p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-display text-lg">Ta Maudite Jauge{me.shielded && " ❄️"}</span>
          {myTurn && (
            <span className="font-display text-sm text-accent">
              {s.playsLeft} coup{s.playsLeft > 1 ? "s" : ""} · {s.giftGiven ? "cadeau offert" : "cadeau dispo"}
            </span>
          )}
        </div>
        <Gauge player={me} />
      </div>

      {/* Action panel */}
      {card && myTurn && (
        <ActionPanel
          s={s}
          card={card}
          useless={useless}
          aliveFoes={aliveFoes}
          cureA={cureA}
          cureG={cureG}
          setCureA={setCureA}
          setCureG={setCureG}
          act={act}
          err={err}
        />
      )}

      {/* Hand */}
      <div className="mt-auto">
        <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pt-5 pb-2">
          {me.hand.map((c) => (
            <CardView key={c.id} card={c} selected={sel === c.id} onClick={() => open(c)} />
          ))}
          {!me.hand.length && <p className="py-10 text-sm text-muted-foreground">Main vide…</p>}
        </div>
        <button
          className="btn-slime mt-2 w-full py-3 text-xl"
          disabled={!myTurn}
          onClick={() => act(() => endTurn(s, ME))}
        >
          {myTurn ? "Piocher et finir mon tour" : `${s.players[s.current]!.name} joue…`}
        </button>
      </div>

      {pendingForMe && (
        <RiposteModal
          s={s}
          onChoose={(c) => act(() => respond(s, ME, c))}
        />
      )}

      {winner && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-6">
          <div className="sticker w-full max-w-sm rounded-3xl bg-card p-6 text-center">
            <div className="animate-wobble text-7xl">{winner.id === ME ? "🏆" : "💀"}</div>
            <h2 className="mt-3 font-display text-3xl text-primary text-outline">
              {winner.id === ME ? "Victoire !" : `${winner.name} gagne`}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {winner.id === ME ? "Tes cadeaux étaient vraiment maudits." : "Tu as été gâté(e)… à mort."}
            </p>
            <button className="btn-slime mt-5 w-full py-3 text-lg" onClick={() => { setS(newGame()); setSel(null); }}>
              Rejouer
            </button>
            <Link to="/" className="mt-3 block text-sm underline">Menu</Link>
          </div>
        </div>
      )}
    </div>
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
  const me = s.players.find((p) => p.id === ME)!;
  const Targets = ({ onPick }: { onPick: (id: string) => void }) => (
    <div className="flex flex-wrap gap-2">
      {aliveFoes.map((f) => (
        <button key={f.id} className="btn-slime px-4 py-2 text-sm" onClick={() => onPick(f.id)}>
          {f.name} ({gaugeTotal(f)})
        </button>
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
        <Targets onPick={(t) => act(() => playUselessCombo(s, ME, [card.id, useless.find((u) => u.id !== card.id)!.id], t))} />
      </>
    ) : <p>Inutile seul… Garde-en 2 pour un combo, ou 3 pour un Cacarma.</p>;
  else if (card.kind === "trick")
    body = <><p>Cibler :</p><Targets onPick={(t) => act(() => playTrick(s, ME, card.id, t))} /></>;
  else if (card.kind === "draw" || card.effect === "sirene" || card.effect === "yeti")
    body = (
      <button className="btn-slime px-6 py-2" onClick={() => act(() => (card.kind === "draw" ? playDraw(s, ME, card.id) : playSirene(s, ME, card.id)))}>
        Jouer la carte
      </button>
    );
  else if (card.riposte) body = <p>Riposte : se joue automatiquement quand on t'attaque.</p>;
  else if (card.kind === "antidote") {
    const antis = me.hand.filter((c) => c.kind === "antidote");
    const a = antis.filter((c) => cureA.includes(c.id)).reduce((x, c) => x + c.value!, 0);
    const g = me.gauge.filter((it) => cureG.includes(it.id)).reduce((x, it) => x + itemValue(it), 0);
    body = me.gauge.length ? (
      <>
        <p>Antidotes :</p>
        <div className="flex flex-wrap gap-1">
          {antis.map((c) => (
            <button key={c.id} onClick={() => setCureA(toggle(cureA, c.id))}
              className={cn("rounded-full border-2 border-ink px-3 py-1 text-xs font-bold", cureA.includes(c.id) ? "bg-k-antidote text-ink" : "bg-muted")}>
              -{c.value}
            </button>
          ))}
        </div>
        <p>Cadeaux à guérir :</p>
        <div className="flex flex-wrap gap-1">
          {me.gauge.map((it) => (
            <button key={it.id} onClick={() => setCureG(toggle(cureG, it.id))}
              className={cn("rounded-full border-2 border-ink px-3 py-1 text-xs font-bold", cureG.includes(it.id) ? "bg-k-gift text-ink" : "bg-muted")}>
              {it.base[0]!.emoji} {itemValue(it)}
            </button>
          ))}
        </div>
        <button className="btn-slime px-6 py-2" disabled={a !== g || !g} onClick={() => act(() => playAntidotes(s, ME, cureA, cureG))}>
          Guérir ({a} / {g})
        </button>
      </>
    ) : <p>Ta jauge est vide, rien à guérir.</p>;
  }

  return (
    <div className="sticker space-y-2 rounded-2xl bg-popover p-3 text-sm">
      <div className="flex gap-3">
        <span className="text-3xl">{card.emoji}</span>
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
  const p = s.pending!;
  const from = s.players.find((x) => x.id === p.from)!;
  const what = p.type === "gift" ? p.item.base[0]! : p.card;
  const opts = riposteOptions(s, ME);
  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-ink/70 p-3">
      <div className="sticker w-full max-w-md rounded-3xl bg-card p-5">
        <p className="font-display text-xl text-secondary">{from.name} t'attaque !</p>
        <div className="my-3 flex justify-center">
          <CardView card={what} size="lg" />
        </div>
        <div className="grid gap-2">
          {opts.map((o) => (
            <button key={o} className="btn-slime py-3" onClick={() => onChoose(o)}>{RIPOSTE_LABEL[o]}</button>
          ))}
          <button className="rounded-full border-2 border-border py-2 text-sm" onClick={() => onChoose(null)}>
            Accepter ce merveilleux présent
          </button>
        </div>
      </div>
    </div>
  );
}
