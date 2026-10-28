import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/regles")({
  head: () => ({
    meta: [
      { title: "Règles — Maudits Cadeaux" },
      { name: "description", content: "Les règles du jeu Maudits Cadeaux, hyper faciles à apprendre." },
      { property: "og:title", content: "Règles — Maudits Cadeaux" },
      { property: "og:description", content: "Les règles du jeu Maudits Cadeaux, hyper faciles à apprendre." },
    ],
  }),
  component: Regles,
});

const rules = [
  ["🎯 But", "Élimine les autres joueurs en leur offrant des Maudits Cadeaux. Une jauge à 10 = éliminé."],
  ["🃏 Départ", "7 cartes chacun, le reste forme la pioche."],
  ["🔁 Ton tour", "Jusqu'à 3 cartes, dont un seul Maudit Cadeau à un seul joueur. Finis en piochant 1 carte."],
  ["🎁 Inévitable", "Impossible de riposter, mais tu pourras t'en débarrasser plus tard."],
  ["🧪 Antidote", "Guérit la valeur exacte de cadeaux dans ta jauge. Plusieurs antidotes possibles."],
  ["🎃 Fourberie", "Déstabilise un adversaire pendant ton tour."],
  ["🐟 Riposte", "Se joue quand on t'attaque, même hors de ton tour."],
  ["🧶 Inutiles", "2 = Maudit Cadeau 1 pt Inévitable. 3 = Cacarma (renvoi à l'envoyeur)."],
  ["💀 Élimination", "Les cartes de l'éliminé (jauge + main) retournent dans la pioche, pas dans la Défausse Septique."],
  ["🔁 Plus de pioche ?", "La Défausse Septique est mélangée et devient la nouvelle pioche."],
  ["💡 Conseil", "N'essaie pas de répartir : attaque celui qui a la jauge la plus remplie !"],
];

function Regles() {
  return (
    <main className="mx-auto max-w-md px-5 py-6">
      <Link to="/" className="font-display text-accent">← Menu</Link>
      <h1 className="mt-3 font-display text-4xl text-primary text-outline">Les règles</h1>
      <p className="text-sm text-muted-foreground">Hyper facile, même un bulot peut y jouer !</p>
      <div className="mt-4 space-y-3">
        {rules.map(([t, d]) => (
          <div key={t} className="sticker rounded-2xl bg-card p-3">
            <p className="font-display text-lg">{t}</p>
            <p className="text-sm">{d}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
