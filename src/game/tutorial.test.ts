import { describe, expect, it } from "vitest";
import { createGame, endTurn, playGift } from "./engine";
import { INITIAL_TUTORIAL, tutorialStep } from "./tutorial";

describe("first-game tutorial timing", () => {
  const game = () => createGame([{ name: "Toi", isAI: false }, { name: "Bot", isAI: true }]);
  it("welcomes a new player before asking them to inspect their hand", () => {
    const s = game();
    expect(tutorialStep(s, INITIAL_TUTORIAL)).toBe("welcome");
    expect(tutorialStep(s, { ...INITIAL_TUTORIAL, welcomed: true })).toBe("hand");
  });
  it("explains playing only after inspection and finishing after a real action", () => {
    const s = game();
    const progress = { ...INITIAL_TUTORIAL, welcomed: true, inspected: true };
    expect(tutorialStep(s, progress)).toBe("play");
    expect(tutorialStep(s, { ...progress, acted: true })).toBe("end");
  });
  it("waits for adversaries and completes the introduction on the player's next turn", () => {
    const progress = { welcomed: true, inspected: true, acted: true, ended: true };
    const next = endTurn(game(), "p0");
    expect(tutorialStep(next, progress)).toBe("wait");
    expect(tutorialStep(endTurn(next, "p1"), progress)).toBe("return");
  });
  it("prioritizes a real incoming attack over the normal tutorial step", () => {
    const s = game();
    const gift = [...s.deck, ...s.players.flatMap(p => p.hand)].find(c => c.kind === "gift" && !c.inevitable);
    const defense = [...s.deck, ...s.players.flatMap(p => p.hand)].find(c => c.effect === "protection");
    if (!gift || !defense || !s.players[0] || !s.players[1]) throw new Error("Missing base cards");
    s.players[0].hand = [defense];
    s.players[1].hand = [gift];
    s.current = 1;
    const attacked = playGift(s, "p1", gift.id, "p0");
    expect(tutorialStep(attacked, INITIAL_TUTORIAL)).toBe("riposte");
  });
});