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

describe("Maudits Cadeaux rules", () => {
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
    expect(d.filter((c) => c.kind === "gift").length).toBe(21);
  });

  it("Momie Touthanpéku adds 3 to a gift", () => {
    const momie: Card = { id: "m", kind: "trick", effect: "momie", name: "M", emoji: "", desc: "" };
    const s = setup([momie], []);
    s.players[1]!.gauge = [{ id: "x", base: [gift(2)], extras: [], baseValue: 2 }];
    const r = playTrick(s, "p0", "m", "p1", "x");
    expect(gaugeTotal(r.players[1]!)).toBe(5);
  });

  it("Bienvenue chez l'Yéti makes the player untargetable until the next turn", () => {
    const yeti: Card = { id: "y", kind: "defense", effect: "yeti", name: "Y", emoji: "", desc: "" };
    const s = setup([yeti], [gift(3)]);
    let r = playSirene(s, "p0", "y");
    r = endTurn(r, "p0");
    expect(() => playGift(r, "p1", r.players[1]!.hand.find((c) => c.kind === "gift")!.id, "p0")).toThrow();
    expect(gaugeTotal(r.players[0]!)).toBe(0);
  });
});
