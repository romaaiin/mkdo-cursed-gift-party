import darkva from "@/assets/cards/dlc/darkva.jpg.asset.json";
import harry from "@/assets/cards/dlc/harry.jpg.asset.json";

/** Cartes hors jeu de base, mises de côté pour un futur pack DLC (non jouées). */
export interface DlcCard { id: string; name: string; kind: "defense"; riposte?: boolean; desc: string; art: string }

export const DLC_CARDS: DlcCard[] = [
  { id: "darkva", name: "Darkva Dort", kind: "defense", riposte: true, desc: "RIPOSTE : annule le pouvoir d'une Défense qu'un autre joueur joue. Prends-la et ajoute-la à ta main.", art: darkva.url },
  { id: "harry", name: "Harry Prouteur", kind: "defense", desc: "Garde cette carte dans ta jauge. Chaque fois que l'on t'offre un Maudit Cadeau avec succès, tu peux piocher une carte.", art: harry.url },
];
