// Noms d'adversaires en solo : jeux de mots dans la direction artistique
// du jeu (monstres, cadeaux maudits, ambiance macabre et rigolote).
export const BOT_NAMES = [
  "Comte Draculard",
  "Mort de Rire",
  "Frankensteak",
  "Yéti Proute",
  "Momie Marmottante",
  "Zombie Resto",
  "Vampirinette",
  "Garou Gourmand",
  "Croque-Mitaine",
  "Crâne Déchanillé",
  "Gargouille Gaufrée",
  "Sorcière de Service",
  "Micro-Ogre",
  "Homme Invisible",
  "Yéti Gonzales",
  "Vlad l'Empaleur",
  "Frankensellerie",
  "Bouh Dumas",
  "Tête de Mort Vivant",
  "Poulpe Comptoir",
];

/** Mélange la réserve et renvoie `count` noms distincts. */
export function pickBotNames(count: number): string[] {
  const pool = [...BOT_NAMES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }
  return pool.slice(0, Math.max(0, Math.min(count, pool.length)));
}
