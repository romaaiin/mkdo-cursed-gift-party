export type Kind = "gift" | "antidote" | "trick" | "defense" | "draw" | "useless";
export type Effect =
  | "secourge"
  | "vol"
  | "deuil"
  | "sirene"
  | "protection"
  | "cacarma"
  | "tresor"
  | "pioche";

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

type Tpl = Omit<Card, "id">;

const gifts: [string, string, number, number, boolean?][] = [
  ["Slip usagé", "🩲", 1, 4],
  ["Chaussette moisie", "🧦", 1, 4],
  ["Tarte aux limaces", "🥧", 2, 4],
  ["Pot de vomi", "🤮", 2, 4],
  ["Poupée hantée", "🪆", 3, 3],
  ["Chaton zombie", "🧟", 3, 3],
  ["Fromage qui marche", "🧀", 4, 4],
  ["Doudou possédé", "🧸", 5, 3],
  ["Crotte surprise", "💩", 2, 3, true],
  ["Clown en boîte", "🤡", 3, 2, true],
];

export function buildDeck(): Card[] {
  const t: Tpl[] = [];
  const add = (n: number, c: Tpl) => {
    for (let i = 0; i < n; i++) t.push(c);
  };
  for (const [name, emoji, value, n, inev] of gifts) {
    add(n, {
      kind: "gift",
      name,
      emoji,
      value,
      inevitable: !!inev,
      desc: `Maudit Cadeau de ${value} pt${value > 1 ? "s" : ""}${inev ? ". INÉVITABLE : aucune riposte possible." : "."}`,
    });
  }
  add(1, {
    kind: "gift",
    name: "Maudit Cad'or",
    emoji: "👑",
    value: 666,
    desc: "Maudit Cadeau de 666 points. Élimine direct !",
  });
  for (const [v, n] of [
    [1, 5],
    [2, 5],
    [3, 3],
    [5, 2],
  ] as const) {
    add(n, {
      kind: "antidote",
      name: `Antidote -${v}`,
      emoji: "🧪",
      value: v,
      desc: `Guérit exactement ${v} pt${v > 1 ? "s" : ""} de Maudits Cadeaux de ta jauge.`,
    });
  }
  add(3, {
    kind: "trick",
    effect: "secourge",
    name: "Au secourge !",
    emoji: "🎃",
    desc: "Pose-la sur un Maudit Cadeau d'un adversaire : +2 pts.",
  });
  add(3, {
    kind: "trick",
    effect: "vol",
    name: "Vol à l'arraché",
    emoji: "🦝",
    desc: "Vole une carte au hasard dans la main d'un adversaire.",
  });
  add(2, {
    kind: "trick",
    effect: "deuil",
    name: "Jour de deuil",
    emoji: "⚰️",
    desc: "Un adversaire défausse 2 cartes au hasard.",
  });
  add(2, {
    kind: "defense",
    effect: "sirene",
    name: "Sirène d'urgence",
    emoji: "🚨",
    desc: "Défausse le plus gros Maudit Cadeau de ta jauge.",
  });
  add(3, {
    kind: "defense",
    effect: "protection",
    riposte: true,
    name: "Protection de la Raie",
    emoji: "🐟",
    desc: "RIPOSTE : annule un Maudit Cadeau ou une Fourberie qui te vise.",
  });
  add(2, {
    kind: "defense",
    effect: "cacarma",
    riposte: true,
    name: "Cacarma",
    emoji: "🔄",
    desc: "RIPOSTE : renvoie le Maudit Cadeau ou la Fourberie à l'envoyeur.",
  });
  add(2, {
    kind: "draw",
    effect: "tresor",
    name: "Faculeux trésor",
    emoji: "💰",
    desc: "En premier coup du tour : pioche 3 cartes, puis ton tour s'arrête.",
  });
  add(3, {
    kind: "draw",
    effect: "pioche",
    name: "Petite pioche",
    emoji: "⛏️",
    desc: "Pioche 2 cartes.",
  });
  const useless: [string, string][] = [
    ["Pull moche de tata Yolande", "🧶"],
    ["Bougie parfum chou", "🕯️"],
    ["Mug « Meilleur collègue »", "☕"],
    ["Porte-clés dauphin", "🐬"],
  ];
  for (const [name, emoji] of useless)
    add(2, {
      kind: "useless",
      name,
      emoji,
      desc: "Cadeau Inutile. 2 = Maudit Cadeau 1 pt Inévitable. 3 = Cacarma.",
    });
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
