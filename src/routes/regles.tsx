import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Flag, Layers, RotateCw, Shield, FlaskConical, Sparkles, CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsControl } from "@/components/game/GameSettings";
import background from "@/assets/game-table.jpg";

export const Route = createFileRoute("/regles")({
  head: () => ({
    meta: [
      { title: "Règles — Maudits Cadeaux" },
      { name: "description", content: "Les règles du jeu Maudits Cadeaux, hyper faciles à apprendre." },
      { property: "og:title", content: "Règles — Maudits Cadeaux" },
      { property: "og:description", content: "Les règles du jeu Maudits Cadeaux, hyper faciles à apprendre." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Regles,
});

const chapters = [
  { title: "But & départ", icon: Flag, heading: "Sois le dernier joueur encore en jeu", sections: [
    ["La victoire", "Offre des Maudits Cadeaux aux autres joueurs pour remplir leur jauge. À 10 points ou plus, un joueur qui ne peut pas se défendre est éliminé immédiatement. Le dernier survivant gagne. Avoir la main vide ne donne pas la victoire."],
    ["Préparer la partie", "Le jeu de base contient 63 cartes, pour 2 à 4 joueurs. Mélange les cartes, distribue-en 7 à chacun et pose le reste face cachée : c’est la pioche. Chaque jauge commence à 0."],
    ["Qui commence ?", "Autour d’une vraie table, le plus jeune commence, puis on joue dans le sens des aiguilles d’une montre. Dans la partie solo actuelle, tu commences, puis les adversaires jouent dans l’ordre affiché."],
    ["Exemple", "Un adversaire a 8 points dans sa jauge. Un cadeau de 2 points porte sa jauge à 10 : sans défense possible, il est éliminé."],
  ] },
  { title: "Zones & cartes", icon: Layers, heading: "Ta main n’est pas ta Maudite Jauge", sections: [
    ["La main", "Les cartes que tu peux jouer sont dans ta main. Les autres joueurs n’en voient que le dos et le nombre. Un cadeau en main n’ajoute aucun point à ta jauge."],
    ["La Maudite Jauge", "Devant chaque joueur, elle reçoit les cadeaux offerts par les adversaires. Additionne les valeurs des cadeaux et les bonus des Fourberies qui y sont attachées."],
    ["Pioche & Défausse Septique", "La pioche est face cachée. La défausse est face visible : les cartes dont le pouvoir a été appliqué y vont, sauf mention contraire. Les cadeaux guéris, les Fourberies attachées et les Antidotes utilisés vont aussi à la défausse."],
    ["Les six familles", "Maudits Cadeaux : remplissent une jauge. Antidotes : guérissent. Fourberies : gênent les adversaires. Défenses : te protègent. Pioches : refont ta main. Cadeaux Inutiles : se combinent."],
  ] },
  { title: "Ton tour", icon: RotateCw, heading: "Jusqu’à 3 cartes, puis tu pioches", sections: [
    ["1 · Choisis tes cartes", "Tu peux jouer 0, 1, 2 ou 3 cartes. Joue-les une par une et applique chaque pouvoir immédiatement. Chaque carte jouée compte dans la limite, sauf une Riposte de défense."],
    ["2 · Offre au maximum un cadeau", "Un seul Maudit Cadeau par tour, à un seul autre joueur. Tu ne peux pas t’en offrir à toi-même. Tu peux utiliser tes autres cartes pour guérir ta jauge ou jouer des Fourberies et des Défenses."],
    ["3 · Termine en piochant", "Quand tu décides d’arrêter, pioche 1 carte : ton tour se termine et le joueur suivant joue. Tu n’es pas obligé d’utiliser tes 3 coups. Un pouvoir de carte peut modifier cette fin de tour."],
    ["Exemple de tour", "Joue un Antidote, offre un cadeau de 2 points, puis joue une Fourberie : 3 cartes utilisées. Termine en piochant 1 carte. Deux Antidotes et un cadeau constituent aussi 3 cartes."],
  ] },
  { title: "Défenses", icon: Shield, heading: "Riposter maintenant, ou guérir plus tard", sections: [
    ["Protection de la Raie", "En Riposte, annule un Maudit Cadeau ou une Fourberie qui te vise. La défense et l’attaque annulée vont à la défausse."],
    ["Cacarma", "En Riposte, renvoie le cadeau ou la Fourberie à son lanceur. La Riposte peut se jouer pendant le tour adverse et ne consomme pas tes 3 cartes de tour."],
    ["Cadeau Inévitable", "Aucune Riposte ne peut empêcher de le recevoir. Il n’est pas inguérissable : une fois dans ta jauge, un Antidote ou un autre pouvoir adapté peut le retirer, si tu n’as pas déjà été éliminé."],
    ["Défenses pendant ton tour", "Une Défense sans mention Riposte se joue pendant ton tour et compte comme une carte. Lis son pouvoir. Les pouvoirs de Sirène d’urgence et du Yéti sont détaillés dans le chapitre Fourberies & pouvoirs."],
    ["Ripostes avancées", "Avec certaines cartes additionnelles, plusieurs Ripostes peuvent s’enchaîner : on ne répond qu’à la dernière carte jouée. Ces cartes et ces chaînes avancées ne sont pas incluses dans la partie solo actuelle."],
  ] },
  { title: "Antidotes & combos", icon: FlaskConical, heading: "Guérir demande la valeur exacte", sections: [
    ["Les Antidotes", "Le jeu de base comporte des Antidotes de −1, −2 et −5. Tu peux en combiner plusieurs et guérir plusieurs cadeaux en même temps. Leur somme doit correspondre exactement au total des cadeaux retirés, bonus attachés compris."],
    ["Exemples valables", "Un cadeau de 2 : un Antidote −2 ou deux −1. Deux cadeaux de 3 et 2 : un Antidote −5. Un cadeau de 4 : deux Antidotes −2. Chaque Antidote utilisé compte comme une carte du tour."],
    ["Exemple interdit", "Un Antidote −5 ne guérit pas un cadeau de 4 tout seul : la valeur n’est pas exacte. Il ne retire pas seulement une partie d’un cadeau. Un cadeau de 2 augmenté de 1 demande 3 points d’Antidotes."],
    ["Deux Cadeaux Inutiles", "Joue 2 Cadeaux Inutiles ensemble : ils deviennent un cadeau de 1 point Inévitable placé dans la jauge adverse. Cela coûte 2 cartes et utilise ton unique cadeau du tour."],
    ["Trois Cadeaux Inutiles", "Défausse 3 Cadeaux Inutiles en réponse à une attaque pour réaliser l’effet d’un Cacarma. Ce combo est une Riposte, pas un cadeau offert pendant ton tour."],
  ] },
  { title: "Fourberies & pouvoirs", icon: Sparkles, heading: "Pouvoirs officiels et version solo actuelle", sections: [
    ["À savoir avant de jouer", "Plusieurs pouvoirs du solo restent provisoires et ne correspondent pas encore aux cartes fournies. Les différences sont indiquées ci-dessous ; les règles de la partie ne sont pas modifiées par ce guide."],
    ["Magichien d’Os", "Carte fournie : choisis une Fourberie parmi les 4 premières cartes de la défausse et applique son pouvoir. Solo actuel : transfère ton plus gros cadeau à un adversaire."],
    ["Momie Touthanpéku", "Carte fournie : transforme un cadeau de 1 point dans une jauge en cadeau de 3 points. Solo actuel : ajoute 3 points à un cadeau adverse."],
    ["Frankenschlingue", "Carte fournie : échange les cartes de ta jauge avec celles d’un autre joueur. Solo actuel : fait défausser une carte au hasard à l’adversaire."],
    ["Petgaz à effet de serre", "Carte fournie : si ta jauge atteint au moins 5, pioche une carte dans la main d’un autre joueur. Solo actuel : échange les deux mains."],
    ["Vol à l’arraché", "Carte fournie : défausse une carte de ta main pour en piocher une dans la main adverse. Solo actuel : vole une carte au hasard sans défausse supplémentaire."],
    ["Jour de deuil", "Carte fournie : choisis une carte de la main adverse et défausse-la. Solo actuel : fait défausser 2 cartes au hasard."],
    ["Dramacula", "Carte fournie : le prochain cadeau offert gagne 1 point. Solo actuel : ajoute 1 point à un cadeau déjà dans la jauge adverse."],
    ["Sirène d’urgence", "Carte fournie : choisis un cadeau de ta jauge et mélange-le dans la pioche. Solo actuel : retire ton plus gros cadeau et le place dans la défausse."],
    ["Faculeux trésor", "Carte fournie : joue-la en premier, ne fais aucune autre action et termine ton tour en piochant 2 cartes. Solo actuel : pioche 3 cartes et termine immédiatement le tour."],
    ["Bienvenue chez l’Yéti", "Carte fournie : les autres joueurs ne peuvent pas t’offrir de Maudit Cadeau pendant un tour de jeu complet. Les Fourberies peuvent toujours te viser."],
    ["Au secourge", "Pouvoir officiel à confirmer : visuel manquant. Solo actuel : ajoute 2 points à un cadeau adverse."],
    ["Cartes hors du jeu de base", "Cacam ikaze, Va te faire tentaculer et les autres cartes additionnelles visibles dans certains visuels ne font pas partie des 63 cartes du jeu de base actuel."],
  ] },
  { title: "Fin & questions", icon: CircleHelp, heading: "Les réponses aux situations fréquentes", sections: [
    ["Un joueur est éliminé", "À 10 points ou plus sans défense possible, il ne peut plus jouer. Ses cartes en main et celles de sa jauge retournent dans la pioche et sont mélangées, pas dans la Défausse Septique."],
    ["La pioche est vide", "Mélange la Défausse Septique et retourne-la face cachée pour former la nouvelle pioche. Continue la partie normalement."],
    ["Puis-je jouer juste après avoir reçu un cadeau ?", "Tu peux seulement jouer une Riposte adaptée à l’attaque. Pour un Antidote ou une Défense normale, attends ton tour. Si ta jauge atteint 10 et que tu ne peux pas riposter, tu es déjà éliminé."],
    ["Dois-je jouer toutes mes cartes ?", "Non : tu peux jouer 0 à 3 cartes, puis piocher pour terminer. Tu gardes les autres en main, même si tu en possèdes plus de 7."],
    ["Peut-on jouer à plus de 4 ?", "Le jeu physique conseille de mélanger 2 jeux de base pour jouer de 5 à 8 joueurs. La partie solo de cette application propose 1 à 3 adversaires, soit 2 à 4 joueurs au total."],
    ["Un dernier conseil", "Surveille les jauges les plus remplies, conserve une Riposte utile et prévois des Antidotes de valeur exacte. Éliminer un adversaire est souvent plus efficace que répartir tes cadeaux partout."],
  ] },
];

function Regles() {
  const [chapter, setChapter] = useState(0);
  const selected = chapters[chapter] ?? chapters[0];
  return (
    <main className="landscape-shell">
      <div className="game-stage rules-stage">
        <img src={background} alt="" className="table-art" />
        <header className="rules-header"><Button asChild size="icon" variant="outline"><Link to="/" aria-label="Retour au menu" title="Retour au menu"><ArrowLeft /></Link></Button><h1 className="font-display text-2xl text-primary">Maudits Cadeaux · Les règles</h1><SettingsControl /></header>
        <div className="rules-layout">
          <nav className="rules-nav" aria-label="Chapitres des règles">{chapters.map(({ title, icon: Icon }, i) => <Button key={title} variant={chapter === i ? "default" : "ghost"} aria-current={chapter === i ? "page" : undefined} onClick={() => setChapter(i)}><Icon className="h-4 w-4 shrink-0" /><span>{title}</span></Button>)}</nav>
          <article key={chapter} className="rules-article" aria-label={selected?.title}>
            <p className="mb-2 text-xs text-secondary">{chapter + 1} / {chapters.length} · Jeu de base</p>
            <h2 className="mb-5 font-display text-xl text-primary">{selected?.heading}</h2>
            {selected?.sections.map(([title, text]) => <section className="rules-section" key={title}><h3 className="mb-2 font-display text-base text-accent">{title}</h3><p>{text}</p></section>)}
            <div className="flex justify-between gap-3 pt-4"><Button variant="outline" disabled={chapter === 0} onClick={() => setChapter(c => c - 1)}>Précédent</Button><Button disabled={chapter === chapters.length - 1} onClick={() => setChapter(c => c + 1)}>Suivant</Button></div>
          </article>
        </div>
      </div>
    </main>
  );
}
