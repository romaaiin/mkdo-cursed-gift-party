import { ATTACH_BONUS, buildDeck, buildDlcDeck, type Card } from "./cards";

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
  shielded: boolean;
  /** Cartes posées et conservées dans la jauge (Léonard, Aligathor) : 0 point. */
  kept: Card[];
  /** Gracula en attente du prochain Maudit Cadeau offert. */
  gracula: Card[];
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
  return it.baseValue + it.extras.reduce((s, c) => s + (ATTACH_BONUS[c.effect!] ?? 0), 0);
}
export function gaugeTotal(p: Player) {
  return p.gauge.reduce((s, it) => s + itemValue(it), 0);
}

export function createGame(seats: { name: string; isAI: boolean }[], opts: { dlc?: boolean } = {}): GameState {
  const deck = shuffle([...buildDeck(), ...(opts.dlc ? buildDlcDeck() : [])]);
  const players = seats.map((s, i) => ({
    id: `p${i}`,
    name: s.name,
    isAI: s.isAI,
    hand: deck.splice(0, HAND_SIZE),
    gauge: [],
    alive: true,
    shielded: false,
    kept: [] as Card[],
    gracula: [] as Card[],
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

function assertTarget(s: GameState, pid: string, tid: string, gift = false) {
  if (pid === tid) throw new GameError("Interdit de s'offrir un cadeau à soi-même !");
  const t = P(s, tid);
  if (!t.alive) throw new GameError("Ce joueur est déjà éliminé");
  if (gift && t.shielded) throw new GameError(`${t.name} est protégé(e) par le Yéti ❄️`);
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
  const back = [...p.hand, ...p.kept, ...(p.gracula ?? []), ...p.gauge.flatMap((g) => [...g.base, ...g.extras])];
  p.hand = [];
  p.gauge = [];
  p.kept = [];
  p.gracula = [];
  syncLeonard(s);
  s.deck = shuffle([...s.deck, ...back]);
  log(s, `💀 ${p.name} est éliminé(e) ! Ses cartes retournent dans la pioche.`);
  const alive = s.players.filter((x) => x.alive);
  if (alive.length === 1) {
    s.winner = alive[0]!.id;
    log(s, `🏆 ${alive[0]!.name} remporte la partie !`);
  }
}

/** Léonard de Vinslip : tant qu'il est dans une jauge, les Maudits Cadeaux de 2 pts valent 3 pts. */
export function leonardActive(s: GameState) {
  return s.players.some((p) => p.alive && (p.kept ?? []).some((c) => c.effect === "leonard"));
}
function adjust(s: GameState, it: GaugeItem) {
  const c = it.base[0];
  if (it.base.length === 1 && c?.kind === "gift" && c.value === 2) it.baseValue = leonardActive(s) ? 3 : 2;
}
function syncLeonard(s: GameState) {
  s.players.forEach((p) => p.gauge.forEach((it) => adjust(s, it)));
}
function addGift(s: GameState, p: Player, c: Card) {
  // Cadeau placé par un effet subi (Dramacula/Plante) : ce n'est pas un cadeau offert par le joueur.
  const it = newItem([c], c.value!);
  adjust(s, it);
  p.gauge.push(it);
}
const rnd = <T,>(a: T[]) => a.splice(Math.floor(Math.random() * a.length), 1)[0]!;

/** Carte la moins précieuse à défausser (Vol à l'arraché). */
function keepScore(c: Card) {
  return c.kind === "useless" ? 0 : c.kind === "gift" ? 1 + (c.value ?? 0) : c.kind === "antidote" ? 5 : 8;
}

function deliver(s: GameState, pend: Pending) {
  const target = P(s, pend.to);
  if (target.shielded && pend.type === "gift") {
    s.discard.push(...pend.item.base, ...pend.item.extras);
    log(s, `❄️ ${target.name} est à l'abri chez le Yéti !`);
    return;
  }
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
    adjust(s, pend.item);
    to.gauge.push(pend.item);
    log(s, `🎁 ${from.name} offre ${pend.item.base[0]!.name} (${itemValue(pend.item)}) à ${to.name}`);
    checkElim(s, to);
    return;
  }
  const c = pend.card;
  const bonus = ATTACH_BONUS[c.effect!];
  if (bonus) {
    const it =
      to.gauge.find((g) => g.id === pend.itemId) ??
      [...to.gauge].sort((a, b) => itemValue(b) - itemValue(a))[0];
    if (!it) {
      s.discard.push(c);
      log(s, `${c.name} tombe à plat, ${to.name} n'a rien dans sa jauge`);
      return;
    }
    it.extras.push(c);
    log(s, `${c.emoji} ${from.name} ajoute +${bonus} sur un cadeau de ${to.name}`);
    checkElim(s, to);
  } else if (c.effect === "vol") {
    s.discard.push(c);
    const own = from.hand.find((x) => x.id === pend.itemId) ?? [...from.hand].sort((x, y) => keepScore(x) - keepScore(y))[0];
    if (!own) return log(s, `🦝 ${from.name} n'a aucune carte à défausser`);
    from.hand = from.hand.filter((x) => x !== own);
    s.discard.push(own);
    if (to.hand.length) from.hand.push(rnd(to.hand));
    log(s, `🦝 ${from.name} défausse une carte et en pioche une chez ${to.name}`);
  } else if (c.effect === "magichien") {
    const top = s.discard.slice(-4).reverse();
    const copy = top.find((x) => x.kind === "trick" && x.effect !== "magichien");
    s.discard.push(c);
    if (!copy) return log(s, `🐕 ${c.name} : aucune Fourberie à reproduire dans la Défausse Septique`);
    log(s, `🐕 ${from.name} reproduit ${copy.name} sur ${to.name}`);
    s.discard = s.discard.filter((x) => x !== copy);
    resolve(s, { ...pend, card: copy });
  } else if (c.effect === "franken") {
    s.discard.push(c);
    [from.gauge, to.gauge] = [to.gauge, from.gauge];
    log(s, `🧟 ${from.name} et ${to.name} échangent leurs jauges`);
    checkElim(s, from);
    if (!s.winner) checkElim(s, to);
  } else if (c.effect === "petgaz") {
    s.discard.push(c);
    if (to.hand.length) from.hand.push(rnd(to.hand));
    log(s, `💨 ${from.name} pioche une carte dans la main de ${to.name}`);
  } else if (c.effect === "trollol") {
    s.discard.push(c);
    [from.hand, to.hand] = [to.hand, from.hand];
    log(s, `🧌 ${from.name} et ${to.name} échangent leurs mains`);
  } else if (c.effect === "dramacula") {
    s.discard.push(c);
    const before = to.hand.length;
    draw(s, to, 1);
    if (to.hand.length > before) {
      const d = to.hand.pop()!;
      if (d.kind === "gift") {
        addGift(s, to, d);
        log(s, `🧛 ${to.name} révèle ${d.name} : direction la jauge !`);
        checkElim(s, to);
      } else {
        to.hand.push(d);
        log(s, `🧛 ${to.name} révèle ${d.name} et la garde en main`);
      }
    }
  } else if (c.effect === "boules") {
    s.discard.push(c);
    const it = from.gauge.find((g) => g.id === pend.itemId) ?? [...from.gauge].sort((x, y) => itemValue(y) - itemValue(x))[0];
    if (!it) return log(s, `🎄 ${from.name} n'a aucun cadeau à déplacer`);
    from.gauge = from.gauge.filter((g) => g !== it);
    to.gauge.push(it);
    log(s, `🎄 ${from.name} déplace un cadeau de ${itemValue(it)} chez ${to.name}`);
    checkElim(s, to);
  } else if (c.effect === "plante") {
    s.discard.push(c);
    const gifts = to.hand.filter((x) => x.kind === "gift");
    to.hand = to.hand.filter((x) => x.kind !== "gift");
    gifts.forEach((g) => addGift(s, to, g));
    log(s, `🌱 ${to.name} pose ${gifts.length} Maudit${gifts.length > 1 ? "s" : ""} Cadeau${gifts.length > 1 ? "x" : ""} dans sa jauge`);
    checkElim(s, to);
  } else if (c.effect === "tentacule") {
    s.discard.push(c);
    for (const o of s.players) {
      if (o === from || !o.alive) continue;
      for (let k = 0; k < 2 && o.hand.length; k++) from.hand.push(rnd(o.hand));
    }
    log(s, `🐙 ${from.name} pioche jusqu'à 2 cartes dans la main de chaque joueur`);
  } else if (c.effect === "deuil") {
    s.discard.push(c);
    if (to.hand.length) s.discard.push(to.hand.splice(Math.floor(Math.random() * to.hand.length), 1)[0]!);
    log(s, `⚰️ Une carte de ${to.name} part dans la Défausse Septique`);
  }
}

function afterAction(s: GameState) {
  if (s.winner || s.pending) return;
  const cur = s.players[s.current]!;
  if (!cur.alive) advance(s, false);
}

function advance(s: GameState, drawCard: boolean) {
  const cur = s.players[s.current]!;
  if (drawCard && cur.alive) draw(s, cur, (cur.kept ?? []).some((c) => c.effect === "aligathor") ? 2 : 1);
  if (s.winner) return;
  let n = s.current;
  do n = (n + 1) % s.players.length;
  while (!s.players[n]!.alive);
  s.current = n;
  s.players[n]!.shielded = false;
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
  assertTarget(s, pid, tid, true);
  const p = P(s, pid);
  const c = p.hand.find((x) => x.id === cardId);
  if (!c || c.kind !== "gift") throw new GameError("Ce n'est pas un Maudit Cadeau");
  take(p, cardId);
  s.playsLeft--;
  s.giftGiven = true;
  const item = newItem([c], c.value!);
  item.extras.push(...(p.gracula ?? []));
  p.gracula = [];
  deliver(s, { type: "gift", from: pid, to: tid, item, inevitable: !!c.inevitable });
  afterAction(s);
  return s;
}

export function playUselessCombo(st: GameState, pid: string, ids: string[], tid: string) {
  const s = clone(st);
  assertTurn(s, pid, 2);
  if (s.giftGiven) throw new GameError("Un seul Maudit Cadeau par tour !");
  assertTarget(s, pid, tid, true);
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
  const item = newItem(cards, 1);
  item.extras.push(...(p.gracula ?? []));
  p.gracula = [];
  deliver(s, { type: "gift", from: pid, to: tid, item, inevitable: true });
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
  const p = P(s, pid);
  const c = p.hand.find((x) => x.id === cardId);
  if (!c || c.kind !== "trick") throw new GameError("Ce n'est pas une Fourberie");
  if (c.effect === "gracula") {
    take(p, cardId);
    p.gracula ??= [];
    p.gracula.push(c);
    s.playsLeft--;
    log(s, `🧛 ${p.name} prépare Gracula : son prochain Maudit Cadeau gagne +1 pt (${p.gracula.length} en attente)`);
    afterAction(s);
    return s;
  }
  assertTarget(s, pid, tid);
  if (ATTACH_BONUS[c.effect!] && !P(s, tid).gauge.length)
    throw new GameError("Ce joueur n'a aucun cadeau dans sa jauge");
  if (c.effect === "leonard") {
    take(p, cardId);
    p.kept.push(c);
    s.playsLeft--;
    syncLeonard(s);
    log(s, `🎨 ${p.name} pose Léonard de Vinslip : les cadeaux de 2 pts valent 3 pts !`);
    s.players.forEach((x) => x.alive && checkElim(s, x));
    afterAction(s);
    return s;
  }
  const mine = gaugeTotal(p);
  if (c.effect === "petgaz" && mine < 5) throw new GameError("Il faut 5 points ou plus dans ta jauge");
  if (c.effect === "tentacule" && mine < 7) throw new GameError("Il faut 7 points ou plus dans ta jauge");
  if (c.effect === "boules" && !p.gauge.length) throw new GameError("Ta jauge est vide, rien à déplacer");
  if (c.effect === "vol" && p.hand.length < 2) throw new GameError("Il te faut une autre carte à défausser");
  if (c.effect === "magichien" && !s.discard.slice(-4).some((x) => x.kind === "trick" && x.effect !== "magichien"))
    throw new GameError("Aucune Fourberie dans les 4 premières cartes de la Défausse Septique");
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
  if (!c || (c.effect !== "sirene" && c.effect !== "yeti")) throw new GameError("Carte invalide");
  if (c.effect === "yeti") {
    take(p, cardId);
    s.discard.push(c);
    p.shielded = true;
    s.playsLeft--;
    log(s, `❄️ ${p.name} se réfugie chez le Yéti`);
    return s;
  }
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
  if (c.effect === "aligathor") {
    p.kept.push(c);
    s.playsLeft--;
    log(s, `🐊 ${p.name} garde l'Aligathor : il piochera 2 cartes en fin de tour`);
    return s;
  }
  s.discard.push(c);
  if (c.effect === "tresor") {
    draw(s, p, 3);
    log(s, `💰 ${p.name} pioche 3 cartes et finit son tour`);
    advance(s, false);
    return s;
  }
  return s;
}

export function respond(st: GameState, pid: string, choice: RiposteChoice | null) {
  const s = clone(st);
  const pend = s.pending;
  if (!pend || pend.to !== pid) throw new GameError("Aucune riposte attendue");
  s.pending = null;
  const me = P(s, pid);
  const attackCards = pend.type === "gift" ? [...pend.item.base, ...pend.item.extras] : [pend.card];
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
