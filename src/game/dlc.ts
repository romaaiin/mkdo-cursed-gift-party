import darkva from "@/assets/cards/dlc/darkva.jpg.asset.json";
import harry from "@/assets/cards/dlc/harry.jpg.asset.json";
import blatteman from "@/assets/cards/dlc/blatteman.jpg.asset.json";
import evileven from "@/assets/cards/dlc/evileven.jpg.asset.json";
import absinthe from "@/assets/cards/dlc/absinthe.jpg.asset.json";
import pelle from "@/assets/cards/dlc/pelle.jpg.asset.json";
import momiecorne from "@/assets/cards/dlc/momiecorne.jpg.asset.json";
import chaperon from "@/assets/cards/dlc/chaperon.jpg.asset.json";
import phoque from "@/assets/cards/dlc/phoque.jpg.asset.json";

/** Cartes hors jeu de base, mises de côté pour un futur pack DLC (non jouées). */
export interface DlcCard { id: string; name: string; kind: "defense" | "useless"; riposte?: boolean; desc: string; art: string }

export const DLC_CARDS: DlcCard[] = [
  { id: "darkva", name: "Darkva Dort", kind: "defense", riposte: true, desc: "RIPOSTE : annule le pouvoir d'une Défense qu'un autre joueur joue. Prends-la et ajoute-la à ta main.", art: darkva.url },
  { id: "harry", name: "Harry Prouteur", kind: "defense", desc: "Garde cette carte dans ta jauge. Chaque fois que l'on t'offre un Maudit Cadeau avec succès, tu peux piocher une carte.", art: harry.url },
  { id: "blatteman", name: "Blatteman", kind: "defense", riposte: true, desc: "RIPOSTE : annule le pouvoir d'une Fourberie qu'un autre joueur joue. Prends-la et ajoute-la à ta main.", art: blatteman.url },
  { id: "evileven", name: "Evileven", kind: "defense", desc: "Garde cette carte dans ta jauge. Ta jauge a une capacité de 11 points au lieu de 10 points.", art: evileven.url },
  { id: "absinthe", name: "Absinthe Vierge", kind: "useless", desc: "Si cette carte est ton signe du zodiaque, joue-la et échange-la contre n'importe quelle carte de la Défausse Septique.", art: absinthe.url },
  { id: "pelle", name: "La Pelle et la Brouette", kind: "defense", riposte: true, desc: "RIPOSTE : redirige un Maudit Cadeau ou un Maudit Cadeau inévitable vers le joueur à ta droite.", art: pelle.url },
  { id: "momiecorne", name: "Momiecorne", kind: "defense", desc: "Si tu perds avec cette carte en main, joue-la. Choisis l'un des Maudits Cadeaux de ta jauge et défausse-le. Continue de jouer.", art: momiecorne.url },
  { id: "chaperon", name: "Le Petit Chaperon Loup", kind: "defense", riposte: true, desc: "RIPOSTE : annule le pouvoir d'une Pioche qu'un autre joueur joue. Prends-la et ajoute-la à ta main.", art: chaperon.url },
  { id: "phoque", name: "Phoque You", kind: "defense", riposte: true, desc: "RIPOSTE : annule n'importe quelle carte en train d'être jouée.", art: phoque.url },
];
