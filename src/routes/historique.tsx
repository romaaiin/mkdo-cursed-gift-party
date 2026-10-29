import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import background from "@/assets/lobby-background.jpg";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import { HISTORY_KEY, loadLocal, parseHistory, saveLocal, type GameRecord } from "@/game/profile";

export const Route = createFileRoute("/historique")({
  head: () => ({
    meta: [
      { title: "Historique des parties — Maudits Cadeaux" },
      { name: "description", content: "Retrouve tes parties terminées, les classements et les jauges de chaque joueur." },
      { property: "og:title", content: "Historique des parties — Maudits Cadeaux" },
      { property: "og:description", content: "Classements et scores de tes parties de Maudits Cadeaux." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Historique,
});

function Historique() {
  const [h, setH] = useState<GameRecord[]>([]);
  useEffect(() => setH(loadLocal(HISTORY_KEY, parseHistory)), []);
  const wins = h.filter(r => r.won).length;
  return (
    <main className="landscape-shell">
      <div className="game-stage">
        <img src={background} alt="" className="table-art" />
        <section className="page-panel">
          <header className="flex items-center gap-3">
            <Button size="icon" variant="outline" asChild><Link to="/" aria-label="Retour à l'accueil"><ArrowLeft /></Link></Button>
            <h1 className="font-display text-2xl text-primary">Historique</h1>
            <span className="text-xs text-muted-foreground">{h.length} parties · {wins} victoires</span>
            {h.length > 0 && <Button size="sm" variant="ghost" className="ml-auto" onClick={() => { if (confirm("Effacer tout l'historique ?")) { saveLocal(HISTORY_KEY, []); setH([]); } }}><Trash2 />Effacer</Button>}
          </header>
          <div className="page-scroll space-y-2 pr-1">
            {h.length === 0 && <p className="mt-8 text-center text-sm">Aucune partie terminée pour l'instant. <Link to="/" className="text-secondary underline">Lance une partie !</Link></p>}
            {h.map(r => (
              <article key={r.id} className="rounded-xl border-2 border-border bg-card/60 p-2 text-sm">
                <div className="mb-1 flex items-center justify-between font-display">
                  <span className={r.won ? "text-secondary" : "text-primary"}>{r.won ? "🏆 Victoire" : "💀 Défaite"}</span>
                  <span className="text-xs text-muted-foreground">{new Date(r.date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })} · {r.turns} tours</span>
                </div>
                <ol className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs sm:grid-cols-4">
                  {r.results.map(p => (
                    <li key={p.place} className={p.isMe ? "font-bold text-secondary" : ""}>
                      {p.place}. {p.name} — jauge {p.gauge}/10{p.place > 1 && " (éliminé)"}
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
