import { describe, expect, it } from "vitest";
import { BOT_NAMES, pickBotNames } from "./bot-names";

describe("noms d'adversaires en solo", () => {
  it("renvoie exactement le nombre demandé", () => {
    expect(pickBotNames(1)).toHaveLength(1);
    expect(pickBotNames(3)).toHaveLength(3);
  });

  it("ne renvoie que des noms de la réserve, sans doublon", () => {
    for (const picked of pickBotNames(BOT_NAMES.length)) {
      expect(BOT_NAMES).toContain(picked);
    }
    expect(new Set(pickBotNames(BOT_NAMES.length)).size).toBe(BOT_NAMES.length);
  });

  it("gère les bornes : zéro et trop demandé", () => {
    expect(pickBotNames(0)).toHaveLength(0);
    expect(pickBotNames(BOT_NAMES.length + 5)).toHaveLength(BOT_NAMES.length);
  });

  it("chaque nom est non vide", () => {
    for (const name of BOT_NAMES) expect(name.trim().length).toBeGreaterThan(0);
  });
});
