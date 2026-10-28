import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import hero from "@/assets/maudit-cadeau.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maudits Cadeaux — le jeu mobile" },
      { name: "description", content: "Offre des Maudits Cadeaux à tes adversaires jusqu'à ce que leur jauge explose." },
      { property: "og:title", content: "Maudits Cadeaux — le jeu mobile" },
      { property: "og:description", content: "Offre des Maudits Cadeaux à tes adversaires jusqu'à ce que leur jauge explose." },
    ],
  }),
  component: Index,
});

function Index() {
  const [bots, setBots] = useState(2);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center px-6 py-8 text-center">
      <h1 className="font-display text-5xl leading-none text-primary text-outline">
        Maudits
        <br />
        <span className="text-secondary">Cadeaux</span>
      </h1>
      <img src={hero} alt="Un Maudit Cadeau qui dégouline" width={816} height={816} className="animate-wobble my-4 w-64" />
      <p className="text-sm text-muted-foreground">Un cadeau, ça ne se refuse pas. Remplis la jauge des autres jusqu'à 10 !</p>

      <div className="sticker mt-6 w-full rounded-3xl bg-card p-4">
        <p className="font-display text-lg">Adversaires</p>
        <div className="mt-2 flex justify-center gap-2">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => setBots(n)}
              className={`sticker h-12 w-12 rounded-full font-display text-xl ${bots === n ? "bg-accent text-accent-foreground" : "bg-muted"}`}
            >
              {n}
            </button>
          ))}
        </div>
        <Link to="/jeu" search={{ bots }} className="btn-slime mt-4 block py-3 text-2xl">
          Jouer en solo
        </Link>
        <button disabled className="btn-slime mt-3 w-full bg-secondary py-3 text-lg text-secondary-foreground">
          En ligne — bientôt
        </button>
      </div>
      <Link to="/regles" className="mt-5 font-display text-lg text-accent underline">Les règles</Link>
    </main>
  );
}
