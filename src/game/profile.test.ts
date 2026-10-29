import { describe, expect, it } from "vitest";
import { addRecord, parseProfile, rankPlayers, TURN_SECONDS, type GameRecord } from "./profile";

describe("profile & history", () => {
  it("turn timer is 60 seconds", () => expect(TURN_SECONDS).toBe(60));
  it("empty name falls back to Toi", () => expect(parseProfile('{"name":"  "}').name).toBe("Toi"));
  it("ranks winner first then last eliminated", () => {
    const players = [{ id: "p0", name: "A" }, { id: "p1", name: "B" }, { id: "p2", name: "C" }];
    const r = rankPlayers(players, "p2", ["p0", "p1"], { p0: 11, p1: 10, p2: 4 }, "p0");
    expect(r.map(x => [x.name, x.place])).toEqual([["C", 1], ["B", 2], ["A", 3]]);
  });
  it("keeps newest 50 games", () => {
    let h: GameRecord[] = [];
    for (let i = 0; i < 55; i++) h = addRecord(h, { id: String(i), date: "", won: false, turns: 1, results: [] });
    expect(h).toHaveLength(50);
    expect(h[0]!.id).toBe("54");
  });
});
