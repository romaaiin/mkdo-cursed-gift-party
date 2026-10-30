import { createFileRoute } from "@tanstack/react-router";
import { GameBoard } from "@/components/game/GameBoard";

export const Route = createFileRoute("/jeu")({
  validateSearch: (s: Record<string, unknown>) => ({
    bots: Math.min(3, Math.max(1, Number(s["bots"]) || 2)),
    dlc: s["dlc"] === true || s["dlc"] === "true" || s["dlc"] === 1 || s["dlc"] === "1",
  }),
  head: () => ({
    meta: [
      { title: "Partie solo — Maudits Cadeaux" },
      { name: "description", content: "Affronte l'ordinateur à coups de Maudits Cadeaux." },
      { property: "og:title", content: "Partie solo — Maudits Cadeaux" },
      { property: "og:description", content: "Affronte l'ordinateur à coups de Maudits Cadeaux." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JeuPage,
});

function JeuPage() {
  const { bots, dlc } = Route.useSearch();
  return <GameBoard bots={bots} dlc={dlc} />;
}
