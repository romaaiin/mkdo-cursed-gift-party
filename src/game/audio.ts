/** Browser-only audio is initialized by a user gesture, never during SSR. */
export class GameAudio {
  private context: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private effectsGain: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private beat = 0;
  private musicEnabled = false;
  private soundsEnabled = true;

  async unlock() {
    try {
      this.context ??= new AudioContext();
      if (!this.musicGain) {
        this.musicGain = this.context.createGain();
        this.effectsGain = this.context.createGain();
        this.musicGain.connect(this.context.destination);
        this.effectsGain.connect(this.context.destination);
      }
      await this.context.resume();
      this.configure(this.musicEnabled, this.soundsEnabled);
    } catch { /* Audio remains silent on unsupported browsers. */ }
  }

  configure(music: boolean, sounds: boolean) {
    this.musicEnabled = music;
    this.soundsEnabled = sounds;
    if (this.musicGain) this.musicGain.gain.value = music ? 0.065 : 0;
    if (this.effectsGain) this.effectsGain.gain.value = sounds ? 0.12 : 0;
    if (!music && this.timer) { clearInterval(this.timer); this.timer = null; }
    if (music && this.context && !this.timer) {
      this.tick();
      this.timer = setInterval(() => this.tick(), 340);
    }
  }

  private note(frequency: number, duration: number, gain: GainNode | null, type: OscillatorType = "sine") {
    const ctx = this.context;
    if (!ctx || !gain || ctx.state !== "running") return;
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0, ctx.currentTime);
    envelope.gain.linearRampToValueAtTime(0.65, ctx.currentTime + 0.015);
    envelope.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.connect(envelope);
    envelope.connect(gain);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
  }

  private tick() {
    // Original playful, slightly spooky music-box loop in A minor.
    const melody = [440, 523.25, 659.25, 622.25, 587.33, 523.25, 493.88, 329.63, 440, 523.25, 698.46, 659.25, 587.33, 493.88, 523.25, 415.3];
    this.note(melody[this.beat % melody.length] ?? 440, 0.28, this.musicGain, "triangle");
    if (this.beat % 4 === 0) this.note(this.beat % 8 === 0 ? 110 : 164.81, 0.8, this.musicGain);
    this.beat++;
  }

  effect(kind: "card" | "turn" | "attack" | "win") {
    if (!this.soundsEnabled) return;
    const notes = { card: 720, turn: 440, attack: 196, win: 880 };
    this.note(notes[kind], kind === "win" ? 0.7 : 0.18, this.effectsGain, kind === "attack" ? "sawtooth" : "sine");
  }

  dispose() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    void this.context?.close().catch(() => undefined);
    this.context = null;
  }
}