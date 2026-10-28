import { describe, expect, it } from "vitest";
import { parsePreferences } from "./preferences";

describe("independent game settings", () => {
  it("lets a player disable music without disabling sound or animation", () => {
    expect(parsePreferences('{"music":false,"sounds":true,"animations":true}')).toEqual({ music: false, sounds: true, animations: true });
  });
  it("lets a player disable effects without disabling music or animation", () => {
    expect(parsePreferences('{"music":true,"sounds":false,"animations":true}')).toEqual({ music: true, sounds: false, animations: true });
  });
  it("lets a player disable animations without disabling audio", () => {
    expect(parsePreferences('{"music":true,"sounds":true,"animations":false}')).toEqual({ music: true, sounds: true, animations: false });
  });
  it("restores enabled settings and tolerates broken saved values", () => {
    expect(parsePreferences('{"music":true,"sounds":true,"animations":true}')).toEqual({ music: true, sounds: true, animations: true });
    expect(parsePreferences('broken')).toEqual({ music: true, sounds: true, animations: true });
  });
});