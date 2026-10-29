import type { Card } from "@/game/cards";
import antidote from "@/assets/cards/antidote.jpg.asset.json";
import cacarma from "@/assets/cards/cacarma.jpg.asset.json";
import deuil from "@/assets/cards/deuil.jpg.asset.json";
import dramacula from "@/assets/cards/dramacula.jpg.asset.json";
import franken from "@/assets/cards/franken.jpg.asset.json";
import gift from "@/assets/cards/gift.jpg.asset.json";
import grimoire from "@/assets/cards/grimoire.jpg.asset.json";
import lingots from "@/assets/cards/lingots.jpg.asset.json";
import magichien from "@/assets/cards/magichien.jpg.asset.json";
import momie from "@/assets/cards/momie.jpg.asset.json";
import petgaz from "@/assets/cards/petgaz.jpg.asset.json";
import protection from "@/assets/cards/protection.jpg.asset.json";
import rouleau from "@/assets/cards/rouleau.jpg.asset.json";
import sirene from "@/assets/cards/sirene.jpg.asset.json";
import tresor from "@/assets/cards/tresor.jpg.asset.json";
import vol from "@/assets/cards/vol.jpg.asset.json";
import yeti from "@/assets/cards/yeti.jpg.asset.json";

const effects: Record<string, string> = {
  cacarma: cacarma.url, deuil: deuil.url, dramacula: dramacula.url,
  franken: franken.url, magichien: magichien.url, momie: momie.url,
  petgaz: petgaz.url, protection: protection.url, sirene: sirene.url,
  tresor: tresor.url, vol: vol.url, yeti: yeti.url,
};
const useless: Record<string, string> = {
  "Rouleau de pique-cul": rouleau.url,
  "Grimoire des furoncles": grimoire.url,
  "Lingots de bave": lingots.url,
};

/** Art is presentation-only: it does not change the card's rules or identity. */
export function cardArt(card: Card): string | undefined {
  if (card.kind === "gift") return gift.url;
  if (card.kind === "antidote") return antidote.url;
  if (card.kind === "useless") return useless[card.name];
  return card.effect ? effects[card.effect] : undefined;
}
/** Profile pictures chosen among the supplied card illustrations. */
export const AVATARS: { id: string; label: string; url: string }[] = [
  { id: "gift", label: "Maudit Cadeau", url: gift.url },
  { id: "antidote", label: "Antidote", url: antidote.url },
  { id: "rouleau", label: "Rouleau de pique-cul", url: rouleau.url },
  { id: "grimoire", label: "Grimoire des furoncles", url: grimoire.url },
  { id: "lingots", label: "Lingots de bave", url: lingots.url },
  ...Object.entries({ cacarma: "Cacarma", deuil: "Jour de deuil", dramacula: "Dramacula", franken: "Frankenschlingue", magichien: "Magichien d'Os", momie: "Momie", petgaz: "Petgaz", protection: "Protection de la raie", sirene: "Sirène d'urgence", tresor: "Faculeux trésor", vol: "Vol à l'arraché", yeti: "Bienvenue chez l'Yéti" }).map(([id, label]) => ({ id, label, url: effects[id]! })),
];
export const avatarUrl = (id: string) => (AVATARS.find(a => a.id === id) ?? AVATARS[0]!).url;
