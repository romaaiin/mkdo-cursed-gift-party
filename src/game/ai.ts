import {
  type GameState,
  type RiposteChoice,
  endTurn,
  findCure,
  gaugeTotal,
  itemValue,
  playAntidotes,
  playDraw,
  playGift,
  playSirene,
  playTrick,
  playUselessCombo,
  riposteOptions,
  MAX_GAUGE,
} from "./engine";
import { ATTACH_BONUS } from "./cards";

/** One AI action; returns the next state (always progresses). */
export function aiStep(s: GameState): GameState {
  const me = s.players[s.current]!;
  const foes = s.players.filter((p) => p.alive && p.id !== me.id);
  const giftable = foes.filter((p) => !p.shielded);
  const weakestGiftable = [...giftable].sort((a, b) => gaugeTotal(b) - gaugeTotal(a))[0];
  const weakest = [...foes].sort((a, b) => gaugeTotal(b) - gaugeTotal(a))[0];
  const tryDo = (f: () => GameState) => {
    try {
      return f();
    } catch {
      return null;
    }
  };

  if (s.playsLeft > 0) {
    const g = gaugeTotal(me);
    if (g >= 5) {
      const cure = findCure(me, s.playsLeft);
      if (cure) {
        const r = tryDo(() => playAntidotes(s, me.id, cure.a, cure.g));
        if (r) return r;
      }
      const dog = me.hand.find((c) => c.effect === "magichien");
      if (dog && weakest) {
        const r = tryDo(() => playTrick(s, me.id, dog.id, weakest.id));
        if (r) return r;
      }
      const sir = me.hand.find((c) => c.effect === "sirene" || (c.effect === "yeti" && g >= 7));
      if (sir) {
        const r = tryDo(() => playSirene(s, me.id, sir.id));
        if (r) return r;
      }
    }
    if (s.playsLeft === 3 && me.hand.length <= 3) {
      const t = me.hand.find((c) => c.effect === "tresor");
      if (t) return playDraw(s, me.id, t.id);
    }
    if (!s.giftGiven && weakestGiftable) {
      const gracula = me.hand.find((c) => c.effect === "gracula");
      if (gracula && s.playsLeft > 1) {
        const r = tryDo(() => playTrick(s, me.id, gracula.id, me.id));
        if (r) return r;
      }
      const gifts = me.hand.filter((c) => c.kind === "gift").sort((a, b) => b.value! - a.value!);
      if (gifts.length) {
        const r = tryDo(() => playGift(s, me.id, gifts[0]!.id, weakestGiftable.id));
        if (r) return r;
      }
      const useless = me.hand.filter((c) => c.kind === "useless");
      if (useless.length >= 2 && useless.length !== 3 && s.playsLeft >= 2) {
        const r = tryDo(() => playUselessCombo(s, me.id, [useless[0]!.id, useless[1]!.id], weakestGiftable.id));
        if (r) return r;
      }
    }
    const sec = me.hand.find((c) => !!ATTACH_BONUS[c.effect!]);
    const withGauge = foes.filter((f) => f.gauge.length).sort((a, b) => gaugeTotal(b) - gaugeTotal(a))[0];
    if (sec && withGauge) {
      const it = [...withGauge.gauge].sort((a, b) => itemValue(b) - itemValue(a))[0]!;
      const r = tryDo(() => playTrick(s, me.id, sec.id, withGauge.id, it.id));
      if (r) return r;
    }
    const keep = me.hand.find((c) => c.effect === "aligathor");
    if (keep) {
      const r = tryDo(() => playDraw(s, me.id, keep.id));
      if (r) return r;
    }
    const leo = me.hand.find((c) => c.effect === "leonard");
    if (leo && foes[0] && foes.some((f) => f.gauge.some((it) => it.baseValue === 2)) && gaugeTotal(me) <= 5) {
      const r = tryDo(() => playTrick(s, me.id, leo.id, foes[0]!.id));
      if (r) return r;
    }
    const lowest = [...foes].sort((a, b) => gaugeTotal(a) - gaugeTotal(b))[0];
    const fr = me.hand.find((c) => c.effect === "franken");
    if (fr && lowest && gaugeTotal(me) > gaugeTotal(lowest) + 2) {
      const r = tryDo(() => playTrick(s, me.id, fr.id, lowest.id));
      if (r) return r;
    }
    const bo = me.hand.find((c) => c.effect === "boules");
    if (bo && me.gauge.length && weakestGiftable) {
      const r = tryDo(() => playTrick(s, me.id, bo.id, weakestGiftable.id));
      if (r) return r;
    }
    const richest = [...foes].sort((a, b) => b.hand.length - a.hand.length)[0];
    const steal = me.hand.find((c) => c.effect === "vol" || c.effect === "deuil" || c.effect === "petgaz" || c.effect === "tentacule" || c.effect === "plante" || c.effect === "dramacula" || (c.effect === "trollol" && me.hand.length < 4));
    if (steal && richest && richest.hand.length) {
      const r = tryDo(() => playTrick(s, me.id, steal.id, richest.id));
      if (r) return r;
    }
  }
  return endTurn(s, me.id);
}

export function aiRiposte(s: GameState, pid: string): RiposteChoice | null {
  const pend = s.pending!;
  const me = s.players.find((p) => p.id === pid)!;
  const opts = riposteOptions(s, pid);
  const dmg = pend.type === "gift" ? itemValue(pend.item) : (ATTACH_BONUS[pend.card.effect!] ?? 1);
  const lethal = gaugeTotal(me) + dmg >= MAX_GAUGE;
  if (!lethal && dmg < 3 && Math.random() < 0.6) return null;
  if (opts.includes("cacarma")) return "cacarma";
  if (opts.includes("combo3")) return "combo3";
  if (opts.includes("protection")) return "protection";
  return null;
}
