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
  | "tresor"
  | "leonard"
  | "boules"
  | "trollol"
  | "aligathor"
  | "plante"
  | "tentacule";

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
  /** Carte du pack DLC (hors 63 cartes de base). */
  dlc?: boolean;
}

/** Fourberies posées sur un Maudit Cadeau et leur bonus de points. */
export const ATTACH_BONUS: Partial<Record<Effect, number>> = { secourge: 2, momie: 3 };

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

  add(3, { kind: "trick", effect: "magichien", name: "Magichien d'Os", emoji: "🐕", desc: "Choisis une Fourberie dans les 4 premières cartes de la Défausse Septique. Reproduis immédiatement son pouvoir." });
  add(2, { kind: "trick", effect: "momie", name: "Momie Touthanpéku", emoji: "🧻", desc: "Pose-la sur un Maudit Cadeau d'un adversaire : +3 pts." });
  add(3, { kind: "trick", effect: "vol", name: "Vol à l'arraché", emoji: "🦝", desc: "Défausse une carte de ta main pour piocher une carte dans la main d'un autre joueur." });
  add(2, { kind: "trick", effect: "franken", name: "Frankenschlingue", emoji: "🧟", desc: "Échange les cartes de ta jauge avec celles d'un autre joueur." });
  add(2, { kind: "trick", effect: "secourge", name: "Au secourge", emoji: "🎃", desc: "Pose-la sur un Maudit Cadeau d'un adversaire : +2 pts." });
  add(3, { kind: "trick", effect: "petgaz", name: "Petgaz à effet de serre", emoji: "💨", desc: "Si tu as 5 points ou plus dans ta jauge, pioche une carte dans la main d'un autre joueur." });
  add(3, { kind: "trick", effect: "dramacula", name: "Dramacula", emoji: "🧛", desc: "Choisis un joueur, il pioche une carte et la révèle. Si c'est un Maudit Cadeau, il la met dans sa jauge, sinon il l'ajoute à sa main." });
  add(2, { kind: "trick", effect: "deuil", name: "Jour de deuil", emoji: "⚰️", desc: "Choisis une carte au hasard dans la main d'un autre joueur et mets-la dans la Défausse Septique." });

  add(2, { kind: "defense", effect: "sirene", name: "Sirène d'urgence", emoji: "🚨", desc: "Défausse le plus gros Maudit Cadeau de ta jauge." });
  add(3, { kind: "defense", effect: "protection", riposte: true, name: "Protection de la Raie", emoji: "🐟", desc: "RIPOSTE : te protège d'une Fourberie ou d'un Maudit Cadeau que l'on t'offre." });
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

/** Cartes DLC jouables (option « pack DLC » du lobby), 1 exemplaire chacune. */
export function buildDlcDeck(): Card[] {
  const t: Tpl[] = [
    { kind: "trick", effect: "leonard", name: "Léonard de Vinslip", emoji: "🎨", desc: "Garde cette carte dans ta jauge. Les Maudits Cadeaux de 2 points de toutes les jauges valent désormais 3 points." },
    { kind: "trick", effect: "boules", name: "T'as les boules", emoji: "🎄", desc: "Choisis un Maudit Cadeau dans ta jauge et déplace-le dans la jauge d'un autre joueur." },
    { kind: "trick", effect: "trollol", name: "Trollol", emoji: "🧌", desc: "Échange ta main avec celle d'un autre joueur." },
    { kind: "draw", effect: "aligathor", name: "Aligathor", emoji: "🐊", desc: "Garde cette carte dans ta jauge. À la fin de ton tour, pioche 2 cartes au lieu d'une." },
    { kind: "trick", effect: "plante", name: "Plante Cradenivore", emoji: "🌱", desc: "Choisis un autre joueur : il pose tous les Maudits Cadeaux de sa main dans sa jauge." },
    { kind: "trick", effect: "tentacule", name: "Va te faire tentaculer", emoji: "🐙", desc: "Si tu as 7 points ou plus dans ta jauge, pioche jusqu'à 2 cartes dans la main de chaque joueur." },
  ];
  return t.map((c, i) => ({ ...c, dlc: true, id: `d${i}` }));
}

export const KIND_LABEL: Record<Kind, string> = {
  gift: "Maudit Cadeau",
  antidote: "Antidote",
  trick: "Fourberie",
  defense: "Défense",
  draw: "Pioche",
  useless: "Cadeau Inutile",
};
