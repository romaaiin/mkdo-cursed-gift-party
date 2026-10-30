import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import background from "@/assets/lobby-background.jpg";
import { Button } from "@/components/ui/button";
import { Play, BookOpen, UserRound, History } from "lucide-react";
import { SettingsControl } from "@/components/game/GameSettings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maudits Cadeaux — le jeu mobile" },
      { name: "description", content: "Offre des Maudits Cadeaux à tes adversaires jusqu'à ce que leur jauge explose." },
      { property: "og:title", content: "Maudits Cadeaux — le jeu mobile" },
      { property: "og:description", content: "Offre des Maudits Cadeaux à tes adversaires jusqu'à ce que leur jauge explose." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [bots, setBots] = useState(2);
  const [dlc, setDlc] = useState(false);
  return (
    <main className="landscape-shell">
      <div className="game-stage lobby-stage">
      <img src={background} alt="" className="table-art" />
      <div className="lobby-settings"><SettingsControl /></div>
      <div className="lobby">
      <h1 className="lobby-title font-display text-primary text-outline">
        Maudits
        <br />
        <span className="text-secondary">Cadeaux</span>
      </h1>
      <div className="lobby-options">
        <p className="font-display text-sm">Adversaires</p>
        <div className="flex justify-center gap-2">
          {[1, 2, 3].map((n) => (
            <Button
              key={n}
              onClick={() => setBots(n)}
              aria-pressed={bots === n}
              variant={bots === n ? "default" : "outline"}
              className="h-10 w-12 font-display text-lg"
            >
              {n}
            </Button>
          ))}
        </div>
        <Button
          onClick={() => setDlc(!dlc)}
          aria-pressed={dlc}
          variant={dlc ? "default" : "outline"}
          className="h-9 font-display text-sm"
        >
          Pack DLC : {dlc ? "activé" : "désactivé"}
        </Button>
        <Button asChild className="btn-slime h-auto py-3 text-xl"><Link to="/jeu" search={{ bots, dlc }}><Play />Jouer en solo</Link></Button>
        <Button disabled variant="secondary" className="h-auto py-2 text-sm">
          En ligne — bientôt
        </Button>
      </div>
      <div className="flex flex-wrap justify-center"><Button variant="link" asChild className="text-accent"><Link to="/regles"><BookOpen />Les règles</Link></Button><Button variant="link" asChild className="text-accent"><Link to="/compte"><UserRound />Mon compte</Link></Button><Button variant="link" asChild className="text-accent"><Link to="/historique"><History />Historique</Link></Button></div>
      </div>
      </div>
    </main>
  );
}
