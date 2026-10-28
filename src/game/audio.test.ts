import { afterEach, describe, expect, it, vi } from "vitest";
import { GameAudio } from "./audio";

describe("audio settings", () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
  function setup() {
    vi.useFakeTimers();
    const start = vi.fn();
    const gains: { gain: { value: number } }[] = [];
    vi.stubGlobal("AudioContext", class {
      state = "running";
      currentTime = 0;
      destination = {};
      resume = async () => {};
      close = async () => {};
      createGain() {
        const node = { gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() };
        gains.push(node);
        return node;
      }
      createOscillator() { return { frequency: { value: 0 }, type: "sine", connect: vi.fn(), start, stop: vi.fn(), disconnect: vi.fn() }; }
    });
    return { audio: new GameAudio(), start, gains };
  }
  it("silences music immediately and stops scheduling it when disabled", async () => {
    const { audio, start, gains } = setup();
    audio.configure(true, true);
    await audio.unlock();
    expect(start).toHaveBeenCalled();
    audio.configure(false, true);
    expect(gains[0]?.gain.value).toBe(0);
    const count = start.mock.calls.length;
    vi.advanceTimersByTime(1500);
    expect(start).toHaveBeenCalledTimes(count);
    audio.dispose();
  });
  it("blocks sound effects independently and restores them when enabled", async () => {
    const { audio, start, gains } = setup();
    audio.configure(false, false);
    await audio.unlock();
    audio.effect("card");
    expect(start).not.toHaveBeenCalled();
    expect(gains[1]?.gain.value).toBe(0);
    audio.configure(false, true);
    audio.effect("card");
    expect(start).toHaveBeenCalledTimes(1);
    expect(gains[1]?.gain.value).toBeGreaterThan(0);
    audio.dispose();
  });
});