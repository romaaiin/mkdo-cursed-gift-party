import darkva from "@/assets/cards/dlc/darkva.jpg.asset.json";
import harry from "@/assets/cards/dlc/harry.jpg.asset.json";
import blatteman from "@/assets/cards/dlc/blatteman.jpg.asset.json";
import evileven from "@/assets/cards/dlc/evileven.jpg.asset.json";
import absinthe from "@/assets/cards/dlc/absinthe.jpg.asset.json";

/** Cartes hors jeu de base, mises de côté pour un futur pack DLC (non jouées). */
export interface DlcCard { id: string; name: string; kind: "defense" | "useless"; riposte?: boolean; desc: string; art: string }

export const DLC_CARDS: DlcCard[] = [
  { id: "darkva", name: "Darkva Dort", kind: "defense", riposte: true, desc: "RIPOSTE : annule le pouvoir d'une Défense qu'un autre joueur joue. Prends-la et ajoute-la à ta main.", art: darkva.url },
  { id: "harry", name: "Harry Prouteur", kind: "defense", desc: "Garde cette carte dans ta jauge. Chaque fois que l'on t'offre un Maudit Cadeau avec succès, tu peux piocher une carte.", art: harry.url },
  { id: "blatteman", name: "Blatteman", kind: "defense", riposte: true, desc: "RIPOSTE : annule le pouvoir d'une Fourberie qu'un autre joueur joue. Prends-la et ajoute-la à ta main.", art: blatteman.url },
  { id: "evileven", name: "Evileven", kind: "defense", desc: "Garde cette carte dans ta jauge. Ta jauge a une capacité de 11 points au lieu de 10 points.", art: evileven.url },
  { id: "absinthe", name: "Absinthe Vierge", kind: "useless", desc: "Si cette carte est ton signe du zodiaque, joue-la et échange-la contre n'importe quelle carte de la Défausse Septique.", art: absinthe.url },
];
