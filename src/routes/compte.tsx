import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import background from "@/assets/lobby-background.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check } from "lucide-react";
import { AVATARS, avatarUrl } from "@/components/game/card-art";
import { DEFAULT_PROFILE, HISTORY_KEY, loadLocal, parseHistory, parseProfile, PROFILE_KEY, saveLocal } from "@/game/profile";

export const Route = createFileRoute("/compte")({
  head: () => ({
    meta: [
      { title: "Mon compte — Maudits Cadeaux" },
      { name: "description", content: "Choisis ton nom de joueur et ta photo de profil parmi les cartes Maudits Cadeaux." },
      { property: "og:title", content: "Mon compte — Maudits Cadeaux" },
      { property: "og:description", content: "Choisis ton nom de joueur et ta photo de profil parmi les cartes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Compte,
});

function Compte() {
  const [p, setP] = useState(DEFAULT_PROFILE);
  const [stats, setStats] = useState({ games: 0, wins: 0 });
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setP(loadLocal(PROFILE_KEY, parseProfile));
    const h = loadLocal(HISTORY_KEY, parseHistory);
    setStats({ games: h.length, wins: h.filter(r => r.won).length });
  }, []);
  const save = () => { const clean = parseProfile(JSON.stringify(p)); setP(clean); saveLocal(PROFILE_KEY, clean); setSaved(true); };
  const edit = (patch: Partial<typeof p>) => { setP({ ...p, ...patch }); setSaved(false); };
  return (
    <main className="landscape-shell">
      <div className="game-stage">
        <img src={background} alt="" className="table-art" />
        <section className="page-panel">
          <header className="flex items-center gap-3">
            <Button size="icon" variant="outline" asChild><Link to="/" aria-label="Retour à l'accueil"><ArrowLeft /></Link></Button>
            <h1 className="font-display text-2xl text-primary">Mon compte</h1>
          </header>
          <div className="page-scroll grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-5">
            <div className="flex flex-col items-center gap-3 text-center">
              <img src={avatarUrl(p.avatar)} alt="Ma photo de profil" className="h-24 w-24 rounded-full border-4 border-secondary object-cover" />
              <label className="w-full text-left text-sm">Nom dans les parties
                <Input value={p.name} maxLength={20} onChange={e => edit({ name: e.target.value })} className="mt-1" />
              </label>
              <label className="w-full text-left text-sm">Devise de joueur
                <Input value={p.motto} maxLength={60} placeholder="Ex. : Toujours un cadeau d'avance" onChange={e => edit({ motto: e.target.value })} className="mt-1" />
              </label>
              <p className="text-xs text-muted-foreground">{stats.games} partie{stats.games > 1 ? "s" : ""} · {stats.wins} victoire{stats.wins > 1 ? "s" : ""}</p>
              <Button className="btn-slime" onClick={save}>{saved ? <><Check />Enregistré</> : "Enregistrer"}</Button>
            </div>
            <div>
              <p className="mb-2 font-display text-sm text-secondary">Photo de profil</p>
              <div className="avatar-grid">
                {AVATARS.map(a => (
                  <button key={a.id} type="button" className="avatar-choice" aria-pressed={p.avatar === a.id} aria-label={a.label} title={a.label} onClick={() => edit({ avatar: a.id })}>
                    <img src={a.url} alt="" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
