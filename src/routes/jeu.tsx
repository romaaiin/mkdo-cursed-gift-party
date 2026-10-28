import { createFileRoute } from "@tanstack/react-router";
import { GameBoard } from "@/components/game/GameBoard";

export const Route = createFileRoute("/jeu")({
  validateSearch: (s: Record<string, unknown>) => ({
    bots: Math.min(3, Math.max(1, Number(s["bots"]) || 2)),
  }),
  head: () => ({
    meta: [
      { title: "Partie solo — Maudits Cadeaux" },
      { name: "description", content: "Affronte l'ordinateur à coups de Maudits Cadeaux." },
      { property: "og:title", content: "Partie solo — Maudits Cadeaux" },
      { property: "og:description", content: "Affronte l'ordinateur à coups de Maudits Cadeaux." },
    ],
  }),
  component: JeuPage,
});

function JeuPage() {
  const { bots } = Route.useSearch();
  return <GameBoard bots={bots} />;
}
