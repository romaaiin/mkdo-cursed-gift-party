import type { Card } from "./cards";
import type { GameState } from "./engine";

export const TUTORIAL_KEY = "mkdo-tutorial-seen-v1";
export type TutorialStep = "welcome" | "hand" | "play" | "end" | "wait" | "return" | "riposte" | "winner";
export interface TutorialProgress { welcomed: boolean; inspected: boolean; acted: boolean; ended: boolean }
export const INITIAL_TUTORIAL: TutorialProgress = { welcomed: false, inspected: false, acted: false, ended: false };

export function tutorialStep(s: GameState, progress: TutorialProgress): TutorialStep {
  if (s.winner) return "winner";
  if (s.pending?.to === "p0") return "riposte";
  if (!progress.welcomed) return "welcome";
  if (s.players[s.current]?.id !== "p0" || s.pending) return "wait";
  if (progress.ended) return "return";
  if (!progress.inspected) return "hand";
  if (!progress.acted && s.playsLeft > 0) return "play";
  return "end";
}

export function cardLesson(card: Card, s: GameState): string {
  if (card.kind === "gift") return s.giftGiven ? "Tu as déjà offert ton cadeau ce tour. Ferme cette carte et choisis une autre famille, ou termine ton tour." : `Choisis un adversaire ci-dessous : ce cadeau ajoute ${card.value ?? 0} point(s) à sa jauge.${card.inevitable ? " Il est Inévitable : aucune Riposte possible." : " Il pourra se défendre avec une Riposte."} Un seul cadeau est autorisé par tour.`;
  if (card.kind === "antidote") return "Choisis tes Antidotes et les cadeaux de ta jauge à retirer. Les deux totaux doivent être exactement égaux ; chaque Antidote coûte un coup. Si ta jauge est vide, garde cette carte pour plus tard.";
  if (card.riposte) return "Garde cette défense en main. Quand une attaque te vise, tu pourras choisir de riposter, même pendant le tour adverse et sans utiliser tes coups.";
  if (card.kind === "useless") return "Seul, ce cadeau ne se joue pas. Deux Inutiles font un cadeau de 1 point Inévitable (2 coups) ; trois permettent de riposter comme un Cacarma.";
  if (card.kind === "draw") return "Cette Pioche spéciale se joue uniquement en premier. Dans le solo actuel, elle fait piocher 3 cartes et termine ton tour ; la carte officielle indique 2 cartes.";
  if (card.kind === "trick") return "Lis le pouvoir appliqué dans cette version, puis choisis un adversaire. Cette Fourberie coûte un coup et peut provoquer une Riposte. Certains pouvoirs restent provisoires : les différences figurent dans les règles.";
  return "Cette Défense se joue pendant ton tour et coûte un coup. Lis son pouvoir, puis joue-la si elle est utile ; sinon, garde-la pour plus tard.";
}

export const TUTORIAL_LESSONS: Record<TutorialStep, { title: string; text: string; target: string }> = {
  welcome: { title: "Ta première partie", text: "Le dernier survivant gagne. Offre des cadeaux pour faire monter les jauges adverses à 10, et protège la tienne. On apprend en jouant : tu peux arrêter le guide à tout moment.", target: "" },
  hand: { title: "Découvre ta main", text: "Les cartes en bas sont à toi. Touche une carte pour lire son pouvoir : elle n’est pas jouée tant que tu n’as pas confirmé une action.", target: "hand" },
  play: { title: "À toi de choisir", text: "Offre un cadeau en choisissant un adversaire, ou joue une carte utile. Une défense de Riposte se garde pour une attaque. Tu peux aussi terminer sans jouer.", target: "hand" },
  end: { title: "Bien joué !", text: "Tu peux jouer jusqu’à 3 cartes, dont un seul cadeau. Quand tu veux arrêter, touche « Finir mon tour » : tu pioches 1 carte et la main passe au suivant.", target: "finish" },
  wait: { title: "Observe les adversaires", text: "Ils jouent à leur tour. Surveille les jauges : 10 points sans défense, c’est l’élimination. Si une attaque te vise et que tu peux riposter, un choix apparaîtra.", target: "opponents" },
  return: { title: "Te voilà prêt !", text: "C’est à nouveau ton tour. Si ta jauge est remplie, pense aux Antidotes de valeur exacte. Continue à jouer ; le bouton d’aide permet de relancer ces conseils.", target: "gauge" },
  riposte: { title: "Une attaque te vise !", text: "Protection de la Raie annule l’attaque ; Cacarma la renvoie. Choisis une Riposte ci-dessous ou accepte l’attaque. Cela ne consomme pas tes coups de tour.", target: "" },
  winner: { title: "Fin de la première partie", text: "Le dernier joueur encore en jeu remporte la partie. Tu peux rejouer et retrouver le guide avec le bouton d’aide.", target: "" },
};