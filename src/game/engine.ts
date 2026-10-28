import { buildDeck, type Card } from "./cards";

export const MAX_GAUGE = 10;
export const MAX_PLAYS = 3;
export const HAND_SIZE = 7;

export interface GaugeItem {
  id: string;
  base: Card[];
  extras: Card[];
  baseValue: number;
}

export interface Player {
  id: string;
  name: string;
  isAI: boolean;
  hand: Card[];
  gauge: GaugeItem[];
  alive: boolean;
}

export type Pending =
  | { type: "gift"; from: string; to: string; item: GaugeItem; inevitable: boolean }
  | { type: "trick"; from: string; to: string; card: Card; itemId?: string };

export type RiposteChoice = "protection" | "cacarma" | "combo3";

export interface GameState {
  players: Player[];
  deck: Card[];
  discard: Card[];
  current: number;
  playsLeft: number;
  giftGiven: boolean;
  pending: Pending | null;
  winner: string | null;
  log: string[];
  seq: number;
}

export class GameError extends Error {}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function itemValue(it: GaugeItem) {
  return it.baseValue + it.extras.length * 2;
}
export function gaugeTotal(p: Player) {
  return p.gauge.reduce((s, it) => s + itemValue(it), 0);
}

export function createGame(seats: { name: string; isAI: boolean }[]): GameState {
  const deck = shuffle(buildDeck());
  const players = seats.map((s, i) => ({
    id: `p${i}`,
    name: s.name,
    isAI: s.isAI,
    hand: deck.splice(0, HAND_SIZE),
    gauge: [],
    alive: true,
  }));
  return {
    players,
    deck,
    discard: [],
    current: 0,
    playsLeft: MAX_PLAYS,
    giftGiven: false,
    pending: null,
    winner: null,
    log: [`La partie commence ! ${players[0]!.name} joue en premier.`],
    seq: 0,
  };
}

const clone = (s: GameState): GameState => structuredClone(s);
const P = (s: GameState, id: string) => {
  const p = s.players.find((x) => x.id === id);
  if (!p) throw new GameError("Joueur inconnu");
  return p;
};
const log = (s: GameState, m: string) => {
  s.log = [...s.log.slice(-40), m];
};

function draw(s: GameState, p: Player, n: number) {
  for (let i = 0; i < n; i++) {
    if (s.deck.length === 0) {
      if (s.discard.length === 0) return;
      s.deck = shuffle(s.discard);
      s.discard = [];
      log(s, "La Défausse Septique est remélangée en pioche 🤢");
    }
    p.hand.push(s.deck.shift()!);
  }
}

function take(p: Player, cardId: string): Card {
  const i = p.hand.findIndex((c) => c.id === cardId);
  if (i < 0) throw new GameError("Carte absente de ta main");
  return p.hand.splice(i, 1)[0]!;
}

function assertTurn(s: GameState, pid: string, cost = 1) {
  if (s.winner) throw new GameError("La partie est terminée");
  if (s.pending) throw new GameError("Une riposte est en attente");
  const cur = s.players[s.current]!;
  if (cur.id !== pid) throw new GameError("Ce n'est pas ton tour");
  if (s.playsLeft < cost) throw new GameError("Tu as déjà joué 3 cartes ce tour");
}

function assertTarget(s: GameState, pid: string, tid: string) {
  if (pid === tid) throw new GameError("Interdit de s'offrir un cadeau à soi-même !");
  if (!P(s, tid).alive) throw new GameError("Ce joueur est déjà éliminé");
}

export function riposteOptions(s: GameState, pid: string): RiposteChoice[] {
  const p = P(s, pid);
  const o: RiposteChoice[] = [];
  if (p.hand.some((c) => c.effect === "protection")) o.push("protection");
  if (p.hand.some((c) => c.effect === "cacarma")) o.push("cacarma");
  if (p.hand.filter((c) => c.kind === "useless").length >= 3) o.push("combo3");
  return o;
}

function checkElim(s: GameState, p: Player) {
  if (!p.alive || gaugeTotal(p) < MAX_GAUGE) return;
  p.alive = false;
  const back = [...p.hand, ...p.gauge.flatMap((g) => [...g.base, ...g.extras])];
  p.hand = [];
  p.gauge = [];
  s.deck = shuffle([...s.deck, ...back]);
  log(s, `💀 ${p.name} est éliminé(e) ! Ses cartes retournent dans la pioche.`);
  const alive = s.players.filter((x) => x.alive);
  if (alive.length === 1) {
    s.winner = alive[0]!.id;
    log(s, `🏆 ${alive[0]!.name} remporte la partie !`);
  }
}

function deliver(s: GameState, pend: Pending) {
  const target = P(s, pend.to);
  const inev = pend.type === "gift" && pend.inevitable;
  if (!inev && riposteOptions(s, target.id).length > 0) {
    s.pending = pend;
    return;
  }
  resolve(s, pend);
}

function resolve(s: GameState, pend: Pending) {
  const from = P(s, pend.from);
  const to = P(s, pend.to);
  if (pend.type === "gift") {
    to.gauge.push(pend.item);
    log(s, `🎁 ${from.name} offre ${pend.item.base[0]!.name} (${itemValue(pend.item)}) à ${to.name}`);
    checkElim(s, to);
    return;
  }
  const c = pend.card;
  if (c.effect === "secourge") {
    const it =
      to.gauge.find((g) => g.id === pend.itemId) ??
      [...to.gauge].sort((a, b) => itemValue(b) - itemValue(a))[0];
    if (!it) {
      s.discard.push(c);
      log(s, `${c.name} tombe à plat, ${to.name} n'a rien dans sa jauge`);
      return;
    }
    it.extras.push(c);
    log(s, `🎃 ${from.name} ajoute +2 sur un cadeau de ${to.name}`);
    checkElim(s, to);
  } else if (c.effect === "vol") {
    s.discard.push(c);
    if (to.hand.length) {
      const i = Math.floor(Math.random() * to.hand.length);
      from.hand.push(to.hand.splice(i, 1)[0]!);
    }
    log(s, `🦝 ${from.name} vole une carte à ${to.name}`);
  } else if (c.effect === "deuil") {
    s.discard.push(c);
    for (let k = 0; k < 2 && to.hand.length; k++) {
      const i = Math.floor(Math.random() * to.hand.length);
      s.discard.push(to.hand.splice(i, 1)[0]!);
    }
    log(s, `⚰️ ${to.name} défausse 2 cartes`);
  }
}

function afterAction(s: GameState) {
  if (s.winner || s.pending) return;
  const cur = s.players[s.current]!;
  if (!cur.alive) advance(s, false);
}

function advance(s: GameState, drawCard: boolean) {
  const cur = s.players[s.current]!;
  if (drawCard && cur.alive) draw(s, cur, 1);
  if (s.winner) return;
  let n = s.current;
  do n = (n + 1) % s.players.length;
  while (!s.players[n]!.alive);
  s.current = n;
  s.playsLeft = MAX_PLAYS;
  s.giftGiven = false;
  s.seq++;
  log(s, `C'est au tour de ${s.players[n]!.name}`);
}

let itemSeq = 0;
const newItem = (base: Card[], baseValue: number): GaugeItem => ({
  id: `g${Date.now().toString(36)}${itemSeq++}`,
  base,
  extras: [],
  baseValue,
});

export function playGift(st: GameState, pid: string, cardId: string, tid: string) {
  const s = clone(st);
  assertTurn(s, pid);
  if (s.giftGiven) throw new GameError("Un seul Maudit Cadeau par tour !");
  assertTarget(s, pid, tid);
  const p = P(s, pid);
  const c = p.hand.find((x) => x.id === cardId);
  if (!c || c.kind !== "gift") throw new GameError("Ce n'est pas un Maudit Cadeau");
  take(p, cardId);
  s.playsLeft--;
  s.giftGiven = true;
  deliver(s, { type: "gift", from: pid, to: tid, item: newItem([c], c.value!), inevitable: !!c.inevitable });
  afterAction(s);
  return s;
}

export function playUselessCombo(st: GameState, pid: string, ids: string[], tid: string) {
  const s = clone(st);
  assertTurn(s, pid, 2);
  if (s.giftGiven) throw new GameError("Un seul Maudit Cadeau par tour !");
  assertTarget(s, pid, tid);
  const p = P(s, pid);
  if (ids.length !== 2) throw new GameError("Il faut 2 Cadeaux Inutiles");
  const cards = ids.map((id) => {
    const c = p.hand.find((x) => x.id === id);
    if (!c || c.kind !== "useless") throw new GameError("Il faut 2 Cadeaux Inutiles");
    return c;
  });
  ids.forEach((id) => take(p, id));
  s.playsLeft -= 2;
  s.giftGiven = true;
  deliver(s, { type: "gift", from: pid, to: tid, item: newItem(cards, 1), inevitable: true });
  afterAction(s);
  return s;
}

export function playAntidotes(st: GameState, pid: string, antidoteIds: string[], itemIds: string[]) {
  const s = clone(st);
  assertTurn(s, pid, Math.max(1, antidoteIds.length));
  const p = P(s, pid);
  if (!antidoteIds.length || !itemIds.length) throw new GameError("Choisis des antidotes et des cadeaux");
  const antis = antidoteIds.map((id) => {
    const c = p.hand.find((x) => x.id === id);
    if (!c || c.kind !== "antidote") throw new GameError("Ce n'est pas un Antidote");
    return c;
  });
  const items = itemIds.map((id) => {
    const it = p.gauge.find((g) => g.id === id);
    if (!it) throw new GameError("Cadeau introuvable dans ta jauge");
    return it;
  });
  const cure = antis.reduce((a, c) => a + c.value!, 0);
  const sum = items.reduce((a, it) => a + itemValue(it), 0);
  if (cure !== sum) throw new GameError(`Il faut la valeur exacte : ${cure} ≠ ${sum}`);
  antidoteIds.forEach((id) => take(p, id));
  p.gauge = p.gauge.filter((g) => !itemIds.includes(g.id));
  s.discard.push(...antis, ...items.flatMap((g) => [...g.base, ...g.extras]));
  s.playsLeft -= antis.length;
  log(s, `🧪 ${p.name} guérit ${sum} pt${sum > 1 ? "s" : ""}`);
  return s;
}

export function playTrick(st: GameState, pid: string, cardId: string, tid: string, itemId?: string) {
  const s = clone(st);
  assertTurn(s, pid);
  assertTarget(s, pid, tid);
  const p = P(s, pid);
  const c = p.hand.find((x) => x.id === cardId);
  if (!c || c.kind !== "trick") throw new GameError("Ce n'est pas une Fourberie");
  if (c.effect === "secourge" && !P(s, tid).gauge.length)
    throw new GameError("Ce joueur n'a aucun cadeau dans sa jauge");
  take(p, cardId);
  s.playsLeft--;
  deliver(s, itemId ? { type: "trick", from: pid, to: tid, card: c, itemId } : { type: "trick", from: pid, to: tid, card: c });
  afterAction(s);
  return s;
}

export function playSirene(st: GameState, pid: string, cardId: string) {
  const s = clone(st);
  assertTurn(s, pid);
  const p = P(s, pid);
  const c = p.hand.find((x) => x.id === cardId);
  if (!c || c.effect !== "sirene") throw new GameError("Carte invalide");
  if (!p.gauge.length) throw new GameError("Ta jauge est vide");
  take(p, cardId);
  const big = [...p.gauge].sort((a, b) => itemValue(b) - itemValue(a))[0]!;
  p.gauge = p.gauge.filter((g) => g !== big);
  s.discard.push(c, ...big.base, ...big.extras);
  s.playsLeft--;
  log(s, `🚨 ${p.name} se débarrasse de ${big.base[0]!.name}`);
  return s;
}

export function playDraw(st: GameState, pid: string, cardId: string) {
  const s = clone(st);
  assertTurn(s, pid);
  const p = P(s, pid);
  const c = p.hand.find((x) => x.id === cardId);
  if (!c || c.kind !== "draw") throw new GameError("Carte invalide");
  if (c.effect === "tresor" && s.playsLeft !== MAX_PLAYS)
    throw new GameError("Le Faculeux trésor se joue en tout premier");
  take(p, cardId);
  s.discard.push(c);
  if (c.effect === "tresor") {
    draw(s, p, 3);
    log(s, `💰 ${p.name} pioche 3 cartes et finit son tour`);
    advance(s, false);
    return s;
  }
  draw(s, p, 2);
  s.playsLeft--;
  log(s, `⛏️ ${p.name} pioche 2 cartes`);
  return s;
}

export function respond(st: GameState, pid: string, choice: RiposteChoice | null) {
  const s = clone(st);
  const pend = s.pending;
  if (!pend || pend.to !== pid) throw new GameError("Aucune riposte attendue");
  s.pending = null;
  const me = P(s, pid);
  const attackCards = pend.type === "gift" ? [...pend.item.base] : [pend.card];
  if (!choice) {
    resolve(s, pend);
  } else {
    if (!riposteOptions(s, pid).includes(choice)) throw new GameError("Riposte indisponible");
    if (choice === "combo3") {
      const u = me.hand.filter((c) => c.kind === "useless").slice(0, 3);
      u.forEach((c) => take(me, c.id));
      s.discard.push(...u);
    } else {
      const c = me.hand.find((x) => x.effect === choice)!;
      take(me, c.id);
      s.discard.push(c);
    }
    if (choice === "protection") {
      s.discard.push(...attackCards);
      log(s, `🐟 ${me.name} se protège avec la Raie !`);
    } else {
      log(s, `🔄 Cacarma ! ${me.name} renvoie à l'envoyeur`);
      const back: Pending =
        pend.type === "gift"
          ? { ...pend, from: pid, to: pend.from }
          : { type: "trick", card: pend.card, from: pid, to: pend.from };
      resolve(s, back);
    }
  }
  afterAction(s);
  return s;
}

export function endTurn(st: GameState, pid: string) {
  const s = clone(st);
  assertTurn(s, pid, 0);
  advance(s, true);
  return s;
}

/** Find antidotes + gauge items with exactly matching values. */
export function findCure(p: Player, maxCards: number) {
  const antis = p.hand.filter((c) => c.kind === "antidote");
  let best: { a: string[]; g: string[]; v: number } | null = null;
  const aSubs = subsets(antis).filter((x) => x.length && x.length <= maxCards);
  const gSubs = subsets(p.gauge).filter((x) => x.length);
  for (const a of aSubs) {
    const av = a.reduce((s, c) => s + c.value!, 0);
    for (const g of gSubs) {
      const gv = g.reduce((s, it) => s + itemValue(it), 0);
      if (gv === av && (!best || gv > best.v || (gv === best.v && a.length < best.a.length)))
        best = { a: a.map((c) => c.id), g: g.map((it) => it.id), v: gv };
    }
  }
  return best;
}

function subsets<T>(arr: T[]): T[][] {
  const a = arr.slice(0, 8);
  const out: T[][] = [];
  for (let m = 0; m < 1 << a.length; m++) out.push(a.filter((_, i) => m & (1 << i)));
  return out;
}
