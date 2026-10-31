import { describe, it, expect } from "vitest";
import { buildDeck, type Card } from "./cards";
import {
  createGame,
  endTurn,
  gaugeTotal,
  playAntidotes,
  playGift,
  playUselessCombo,
  playSirene,
  playTrick,
  playDraw,
  respond,
  type GameState,
} from "./engine";

let n = 0;
const gift = (v: number, inevitable = false): Card => ({ id: `t${n++}`, kind: "gift", name: "G", emoji: "", value: v, inevitable, desc: "" });
const anti = (v: number): Card => ({ id: `t${n++}`, kind: "antidote", name: "A", emoji: "", value: v, desc: "" });
const useless = (): Card => ({ id: `t${n++}`, kind: "useless", name: "U", emoji: "", desc: "" });
const raie = (): Card => ({ id: `t${n++}`, kind: "defense", effect: "protection", riposte: true, name: "R", emoji: "", desc: "" });

function setup(h0: Card[], h1: Card[], players = 2): GameState {
  const s = createGame(Array.from({ length: players }, (_, i) => ({ name: `J${i}`, isAI: false })));
  s.players.forEach((p) => (p.hand = []));
  s.players[0]!.hand = h0;
  s.players[1]!.hand = h1;
  return s;
}

const trick = (effect: string): Card => ({ id: `t${n++}`, kind: "trick", effect: effect as NonNullable<Card["effect"]>, name: effect, emoji: "", desc: "" });

describe("Maudits Cadeaux rules", () => {
  it("Jour de deuil discards exactly one card from the target's hand", () => {
    const s = setup([trick("deuil")], [anti(1), anti(1), anti(1)]);
    const r = playTrick(s, "p0", s.players[0]!.hand[0]!.id, "p1");
    expect(r.players[1]!.hand.length).toBe(2);
  });

  it("Magichien d'Os copies a Fourberie from the top 4 of the discard", () => {
    const s = setup([trick("magichien")], [anti(1), anti(1), anti(1)]);
    s.discard.push(trick("deuil"), useless(), useless());
    const r = playTrick(s, "p0", s.players[0]!.hand[0]!.id, "p1");
    expect(r.players[1]!.hand.length).toBe(2);
  });

  it("Magichien d'Os cannot be played without a Fourberie in the top 4", () => {
    const s = setup([trick("magichien")], [useless()]);
    s.discard.push(trick("deuil"), useless(), useless(), useless(), useless());
    expect(() => playTrick(s, "p0", s.players[0]!.hand[0]!.id, "p1")).toThrow();
  });

  it("deals 7 cards to each player", () => {
    const s = createGame([{ name: "a", isAI: false }, { name: "b", isAI: true }]);
    expect(s.players.every((p) => p.hand.length === 7)).toBe(true);
  });

  it("eliminates a player whose gauge reaches 10", () => {
    const s = setup([gift(4)], [], 3);
    s.players[1]!.gauge = [{ id: "x", base: [gift(6)], extras: [], baseValue: 6 }];
    const r = playGift(s, "p0", s.players[0]!.hand[0]!.id, "p1");
    expect(r.players[1]!.alive).toBe(false);
  });

  it("does not eliminate at 9", () => {
    const s = setup([gift(3)], []);
    s.players[1]!.gauge = [{ id: "x", base: [gift(6)], extras: [], baseValue: 6 }];
    const r = playGift(s, "p0", s.players[0]!.hand[0]!.id, "p1");
    expect(gaugeTotal(r.players[1]!)).toBe(9);
    expect(r.players[1]!.alive).toBe(true);
  });

  it("allows only one gift per turn", () => {
    const s = setup([gift(1), gift(1)], []);
    const r = playGift(s, "p0", s.players[0]!.hand[0]!.id, "p1");
    expect(() => playGift(r, "p0", r.players[0]!.hand[0]!.id, "p1")).toThrow();
  });

  it("forbids gifting yourself", () => {
    const s = setup([gift(1)], []);
    expect(() => playGift(s, "p0", s.players[0]!.hand[0]!.id, "p0")).toThrow();
  });

  it("limits plays to 3 per turn", () => {
    const s = setup([anti(1), anti(1), anti(1), anti(1)], []);
    s.players[0]!.gauge = [1, 2, 3, 4].map((i) => ({ id: `g${i}`, base: [gift(1)], extras: [], baseValue: 1 }));
    let r = playAntidotes(s, "p0", [s.players[0]!.hand[0]!.id], ["g1"]);
    r = playAntidotes(r, "p0", [r.players[0]!.hand[0]!.id], ["g2"]);
    r = playAntidotes(r, "p0", [r.players[0]!.hand[0]!.id], ["g3"]);
    expect(() => playAntidotes(r, "p0", [r.players[0]!.hand[0]!.id], ["g4"])).toThrow();
  });

  it("requires the exact antidote value", () => {
    const s = setup([anti(5)], []);
    s.players[0]!.gauge = [{ id: "g", base: [gift(4)], extras: [], baseValue: 4 }];
    expect(() => playAntidotes(s, "p0", [s.players[0]!.hand[0]!.id], ["g"])).toThrow();
    s.players[0]!.gauge.push({ id: "h", base: [gift(1)], extras: [], baseValue: 1 });
    const r = playAntidotes(s, "p0", [s.players[0]!.hand[0]!.id], ["g", "h"]);
    expect(gaugeTotal(r.players[0]!)).toBe(0);
  });

  it("inevitable gifts skip ripostes", () => {
    const s = setup([gift(2, true)], [raie()]);
    const r = playGift(s, "p0", s.players[0]!.hand[0]!.id, "p1");
    expect(r.pending).toBeNull();
    expect(gaugeTotal(r.players[1]!)).toBe(2);
  });

  it("Protection de la Raie cancels a normal gift", () => {
    const s = setup([gift(3)], [raie()]);
    const r = playGift(s, "p0", s.players[0]!.hand[0]!.id, "p1");
    expect(r.pending).not.toBeNull();
    const r2 = respond(r, "p1", "protection");
    expect(gaugeTotal(r2.players[1]!)).toBe(0);
  });

  it("2 useless gifts make an inevitable 1 pt gift costing 2 plays", () => {
    const s = setup([useless(), useless()], [raie()]);
    const r = playUselessCombo(s, "p0", s.players[0]!.hand.map((c) => c.id), "p1");
    expect(gaugeTotal(r.players[1]!)).toBe(1);
    expect(r.playsLeft).toBe(1);
  });

  it("ending the turn draws one card", () => {
    const s = setup([], []);
    const r = endTurn(s, "p0");
    expect(r.players[0]!.hand.length).toBe(1);
    expect(r.current).toBe(1);
  });

  it("base deck has 63 cards with 21 Maudits Cadeaux", () => {
    const d = buildDeck();
    expect(d.length).toBe(63);
    expect(d.filter((card) => card.effect === "gracula")).toHaveLength(3);
    expect(d.filter((c) => c.kind === "gift").length).toBe(21);
  });

  it("Gracula stacks and adds +1 to the next gift", () => {
    const g1 = trick("gracula"), g2 = trick("gracula"), present = gift(2);
    const s = setup([g1, g2, present], []);
    const first = playTrick(s, "p0", g1.id, "p0");
    expect(first.players[0]!.gracula).toHaveLength(1);
    const second = playTrick(first, "p0", g2.id, "p0");
    expect(second.players[0]!.gracula).toHaveLength(2);
    const offered = playGift(second, "p0", present.id, "p1");
    expect(offered.players[0]!.gracula).toHaveLength(0);
    expect(offered.players[1]!.gauge[0]!.extras).toHaveLength(2);
    expect(gaugeTotal(offered.players[1]!)).toBe(4);
  });

  it("Gracula remains pending until a gift is available", () => {
    const g = trick("gracula");
    const s = setup([g], []);
    const r = playTrick(s, "p0", g.id, "p0");
    expect(r.players[0]!.gracula).toHaveLength(1);
    expect(r.players[0]!.hand).toHaveLength(0);
  });

  it("Gracula bonus counts toward antidote value", () => {
    const g = trick("gracula"), present = gift(2), antidote = anti(3);
    const s = setup([g, present], []);
    s.players[1]!.hand = [antidote];
    const staged = playTrick(s, "p0", g.id, "p0");
    const offered = playGift(staged, "p0", present.id, "p1");
    const item = offered.players[1]!.gauge[0]!;
    expect(itemValue(item)).toBe(3);
    const cured = playAntidotes(offered, "p1", [antidote.id], [item.id]);
    expect(gaugeTotal(cured.players[1]!)).toBe(0);
  });

  it("Momie Touthanpéku adds 3 to a gift", () => {
    const momie: Card = { id: "m", kind: "trick", effect: "momie", name: "M", emoji: "", desc: "" };
    const s = setup([momie], []);
    s.players[1]!.gauge = [{ id: "x", base: [gift(2)], extras: [], baseValue: 2 }];
    const r = playTrick(s, "p0", "m", "p1", "x");
    expect(gaugeTotal(r.players[1]!)).toBe(5);
  });

  it("Bienvenue chez l'Yéti blocks Maudits Cadeaux for a full round but not Fourberies", () => {
    const yeti: Card = { id: "y", kind: "defense", effect: "yeti", name: "Y", emoji: "", desc: "" };
    const s = setup([yeti], [gift(3)]);
    let r = playSirene(s, "p0", "y");
    r = endTurn(r, "p0");
    expect(() => playGift(r, "p1", r.players[1]!.hand.find((c) => c.kind === "gift")!.id, "p0")).toThrow();
    expect(gaugeTotal(r.players[0]!)).toBe(0);
    const vol: Card = { id: "v", kind: "trick", effect: "vol", name: "V", emoji: "", desc: "" };
    r.players[1]!.hand.push(vol);
    expect(() => playTrick(r, "p1", "v", "p0")).not.toThrow();
  });
});

describe("effets officiels des Fourberies", () => {
  const giftItem = (v: number) => ({ id: `i${n++}`, base: [gift(v)], extras: [], baseValue: v });
  const play = (s: GameState, c: Card, itemId?: string) => {
    let r = playTrick(s, "p0", c.id, "p1", itemId);
    if (r.pending) r = respond(r, "p1", null);
    return r;
  };

  it("Vol à l'arraché : défausse 1 carte de sa main et en pioche 1 chez la cible", () => {
    const v = trick("vol"), junk = useless(), loot = gift(3);
    const r = play(setup([v, junk], [loot]), v, junk.id);
    expect(r.players[0]!.hand.map((c) => c.id)).toEqual([loot.id]);
    expect(r.discard.map((c) => c.id)).toContain(junk.id);
  });

  it("Petgaz : refusé sous 5 points, vole 1 carte à partir de 5", () => {
    const p = trick("petgaz"), loot = gift(1);
    const low = setup([p], [loot]);
    expect(() => playTrick(low, "p0", p.id, "p1")).toThrow();
    const s = setup([p], [loot]);
    s.players[0]!.gauge = [giftItem(5)];
    const r = play(s, p);
    expect(r.players[0]!.hand.map((c) => c.id)).toEqual([loot.id]);
    expect(r.players[1]!.hand).toHaveLength(0);
  });

  it("Dramacula : un Maudit Cadeau pioché va dans la jauge de la cible", () => {
    const d = trick("dramacula"), g = gift(2);
    const s = setup([d], []);
    s.deck = [g];
    const r = play(s, d);
    expect(gaugeTotal(r.players[1]!)).toBe(2);
    expect(r.players[1]!.hand).toHaveLength(0);
  });

  it("Dramacula : une autre carte piochée reste dans la main de la cible", () => {
    const d = trick("dramacula"), a = anti(1);
    const s = setup([d], []);
    s.deck = [a];
    const r = play(s, d);
    expect(r.players[1]!.hand.map((c) => c.id)).toEqual([a.id]);
    expect(gaugeTotal(r.players[1]!)).toBe(0);
  });

  it("Frankenschlingue : échange les jauges", () => {
    const f = trick("franken");
    const s = setup([f], []);
    s.players[0]!.gauge = [giftItem(4)];
    s.players[1]!.gauge = [giftItem(1)];
    const r = play(s, f);
    expect(gaugeTotal(r.players[0]!)).toBe(1);
    expect(gaugeTotal(r.players[1]!)).toBe(4);
  });

  it("Trollol : échange les mains", () => {
    const t = trick("trollol"), mine = gift(1), theirs = anti(2);
    const r = play(setup([t, mine], [theirs]), t);
    expect(r.players[0]!.hand.map((c) => c.id)).toEqual([theirs.id]);
    expect(r.players[1]!.hand.map((c) => c.id)).toEqual([mine.id]);
  });

  it("T'as les boules : déplace un cadeau de sa jauge vers la cible", () => {
    const b = trick("boules");
    const s = setup([b], []);
    const it = giftItem(3);
    s.players[0]!.gauge = [it];
    const r = play(s, b, it.id);
    expect(gaugeTotal(r.players[0]!)).toBe(0);
    expect(gaugeTotal(r.players[1]!)).toBe(3);
  });

  it("Plante Cradenivore : la cible pose tous ses Maudits Cadeaux en jauge", () => {
    const p = trick("plante"), a = anti(1);
    const r = play(setup([p], [gift(2), gift(1), a]), p);
    expect(gaugeTotal(r.players[1]!)).toBe(3);
    expect(r.players[1]!.hand.map((c) => c.id)).toEqual([a.id]);
  });

  it("Va te faire tentaculer : 7 pts requis, pioche jusqu'à 2 cartes chez chaque joueur", () => {
    const t = trick("tentacule");
    const s = setup([t], [gift(1), gift(1), gift(1)], 3);
    s.players[2]!.hand = [anti(1)];
    expect(() => playTrick(s, "p0", t.id, "p1")).toThrow();
    s.players[0]!.gauge = [giftItem(7)];
    const r = play(s, t);
    expect(r.players[0]!.hand).toHaveLength(3);
    expect(r.players[1]!.hand).toHaveLength(1);
    expect(r.players[2]!.hand).toHaveLength(0);
  });

  it("Léonard de Vinslip : reste en jauge et les cadeaux de 2 pts valent 3", () => {
    const l = trick("leonard");
    const s = setup([l, gift(2)], []);
    s.players[1]!.gauge = [giftItem(2), giftItem(1)];
    const r = playTrick(s, "p0", l.id, "p1");
    expect(r.players[0]!.kept.map((c) => c.id)).toEqual([l.id]);
    expect(gaugeTotal(r.players[1]!)).toBe(4);
    const g2 = r.players[0]!.hand[0]!;
    const r2 = respondIfNeeded(playGift(r, "p0", g2.id, "p1"));
    expect(gaugeTotal(r2.players[1]!)).toBe(7);
  });

  it("Aligathor : reste en jauge et fait piocher 2 cartes en fin de tour", () => {
    const a: Card = { id: `t${n++}`, kind: "draw", effect: "aligathor", name: "Aligathor", emoji: "", desc: "" };
    const s = setup([a], []);
    s.deck = [gift(1), gift(1), gift(1)];
    const r = endTurn(playDraw(s, "p0", a.id), "p0");
    expect(r.players[0]!.kept).toHaveLength(1);
    expect(r.players[0]!.hand).toHaveLength(2);
  });

  it("le pack DLC n'est ajouté que sur demande", () => {
    expect(createGame([{ name: "a", isAI: false }, { name: "b", isAI: true }]).deck.length + 14).toBe(63);
    expect(createGame([{ name: "a", isAI: false }, { name: "b", isAI: true }], { dlc: true }).deck.length + 14).toBe(69);
  });
});

function respondIfNeeded(s: GameState) {
  return s.pending ? respond(s, s.pending.to, null) : s;
}
