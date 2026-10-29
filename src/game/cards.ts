export type Kind = "gift" | "antidote" | "trick" | "defense" | "draw" | "useless";
export type Effect =
  | "secourge"
  | "momie"
  | "dramacula"
  | "magichien"
  | "vol"
  | "deuil"
  | "franken"
  | "petgaz"
  | "sirene"
  | "yeti"
  | "protection"
  | "cacarma"
  | "tresor";

export interface Card {
  id: string;
  kind: Kind;
  name: string;
  emoji: string;
  value?: number;
  inevitable?: boolean;
  effect?: Effect;
  riposte?: boolean;
  desc: string;
}

/** Fourberies posées sur un Maudit Cadeau et leur bonus de points. */
export const ATTACH_BONUS: Partial<Record<Effect, number>> = { secourge: 2, momie: 3, dramacula: 1 };

type Tpl = Omit<Card, "id">;

/** Jeu de base Maudits Cadeaux (63 cartes). */
export function buildDeck(): Card[] {
  const t: Tpl[] = [];
  const add = (n: number, c: Tpl) => {
    for (let i = 0; i < n; i++) t.push(c);
  };
  const gift = (n: number, value: number, emoji: string, inevitable = false) =>
    add(n, {
      kind: "gift",
      name: `Maudit Cadeau ${value} pt${value > 1 ? "s" : ""}${inevitable ? " Inévitable" : ""}`,
      emoji,
      value,
      inevitable,
      desc: `Offre-le à un adversaire : +${value} dans sa Maudite Jauge.${inevitable ? " INÉVITABLE : aucune riposte possible." : ""}`,
    });
  gift(1, 5, "🧸");
  gift(1, 4, "🧀");
  gift(4, 3, "🪆");
  gift(5, 2, "🥧");
  gift(3, 1, "🧦");
  gift(4, 2, "💩", true);
  gift(3, 1, "🩲", true);

  for (const [v, n] of [
    [1, 3],
    [2, 2],
    [5, 1],
  ] as const)
    add(n, {
      kind: "antidote",
      name: `Antidote -${v}`,
      emoji: "🧪",
      value: v,
      desc: `Guérit exactement ${v} pt${v > 1 ? "s" : ""} de Maudits Cadeaux dans ta jauge.`,
    });

  add(3, { kind: "trick", effect: "magichien", name: "Magichien d'Os", emoji: "🐕", desc: "Refile ton plus gros Maudit Cadeau (avec ses Fourberies) à un adversaire." });
  add(2, { kind: "trick", effect: "momie", name: "Momie Touthanpéku", emoji: "🧻", desc: "Pose-la sur un Maudit Cadeau d'un adversaire : +3 pts." });
  add(3, { kind: "trick", effect: "vol", name: "Vol à l'arraché", emoji: "🦝", desc: "Vole une carte au hasard dans la main d'un adversaire." });
  add(2, { kind: "trick", effect: "franken", name: "Frankenschlingue", emoji: "🧟", desc: "Un adversaire défausse 1 carte au hasard." });
  add(2, { kind: "trick", effect: "secourge", name: "Au secourge", emoji: "🎃", desc: "Pose-la sur un Maudit Cadeau d'un adversaire : +2 pts." });
  add(3, { kind: "trick", effect: "petgaz", name: "Petgaz à effet de serre", emoji: "💨", desc: "Échange ta main avec celle d'un adversaire." });
  add(3, { kind: "trick", effect: "dramacula", name: "Dramacula", emoji: "🧛", desc: "Pose-la sur un Maudit Cadeau d'un adversaire : +1 pt." });
  add(2, { kind: "trick", effect: "deuil", name: "Jour de deuil", emoji: "⚰️", desc: "Un adversaire défausse 2 cartes au hasard." });

  add(2, { kind: "defense", effect: "sirene", name: "Sirène d'urgence", emoji: "🚨", desc: "Défausse le plus gros Maudit Cadeau de ta jauge." });
  add(3, { kind: "defense", effect: "protection", riposte: true, name: "Protection de la Raie", emoji: "🐟", desc: "RIPOSTE : annule un Maudit Cadeau ou une Fourberie qui te vise." });
  add(3, { kind: "defense", effect: "cacarma", riposte: true, name: "Cacarma", emoji: "🔄", desc: "RIPOSTE : renvoie une Fourberie ou un Maudit Cadeau vers son lanceur." });
  add(2, { kind: "defense", effect: "yeti", name: "Bienvenue chez l'Yéti", emoji: "❄️", desc: "Les autres joueurs ne peuvent pas t'offrir de Maudit Cadeau pendant un tour de jeu complet." });

  add(3, { kind: "draw", effect: "tresor", name: "Faculeux trésor", emoji: "🌈", desc: "En premier coup du tour : pioche 3 cartes, puis ton tour s'arrête." });

  for (const [name, emoji] of [
    ["Rouleau de pique-cul", "🧻"],
    ["Lingots de bave", "🫠"],
    ["Grimoire des furoncles", "📕"],
  ] as const)
    add(1, { kind: "useless", name, emoji, desc: "Cadeau Inutile. 2 = Maudit Cadeau 1 pt Inévitable. 3 = Cacarma." });

  return t.map((c, i) => ({ ...c, id: `c${i}` }));
}

export const KIND_LABEL: Record<Kind, string> = {
  gift: "Maudit Cadeau",
  antidote: "Antidote",
  trick: "Fourberie",
  defense: "Défense",
  draw: "Pioche",
  useless: "Cadeau Inutile",
};
