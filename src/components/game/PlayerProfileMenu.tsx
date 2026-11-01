import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AVATARS, avatarUrl } from "@/components/game/card-art";
import { DEFAULT_PROFILE, loadLocal, parseProfile, PROFILE_KEY } from "@/game/profile";

/** Small player menu shared by the home lobby and online lobby. */
export function PlayerProfileMenu() {
  const [open, setOpen] = useState(false);
  const [profile] = useState(() => loadLocal(PROFILE_KEY, parseProfile));
  const avatar = AVATARS.find(item => item.id === profile.avatar);
  return <>
    <Button size="icon" variant="outline" aria-label="Menu du profil joueur" title="Mon profil" onClick={() => setOpen(true)}>
      {avatar ? <img src={avatarUrl(profile.avatar)} alt="" className="h-7 w-7 rounded-full object-cover" /> : <UserRound />}
    </Button>
    {open && <div className="action-overlay settings-overlay" onClick={() => setOpen(false)}>
      <section className="action-dialog settings-dialog space-y-4" role="dialog" aria-modal="true" aria-label="Menu du profil joueur" onClick={event => event.stopPropagation()}>
        <header className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl text-primary">Profil joueur</h2>
          <Button size="icon" variant="ghost" aria-label="Fermer le menu du profil" onClick={() => setOpen(false)}><X /></Button>
        </header>
        <div className="flex items-center gap-3">
          <img src={avatarUrl(profile.avatar)} alt="" className="h-16 w-16 rounded-full border-2 border-secondary object-cover" />
          <div className="min-w-0">
            <p className="font-display text-lg">{profile.name || DEFAULT_PROFILE.name}</p>
            <p className="text-xs text-muted-foreground">{profile.motto || "Aucune devise renseignée"}</p>
          </div>
        </div>
        <Button asChild className="btn-slime w-full" onClick={() => setOpen(false)}>
          <Link to="/compte">Modifier le profil</Link>
        </Button>
      </section>
    </div>}
  </>;
}
