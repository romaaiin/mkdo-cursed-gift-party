import type { Card, Kind } from "@/game/cards";
import { KIND_LABEL } from "@/game/cards";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { cardArt } from "./card-art";

export const KIND_BG: Record<Kind, string> = {
  gift: "bg-k-gift",
  antidote: "bg-k-antidote",
  trick: "bg-k-trick",
  defense: "bg-k-defense",
  draw: "bg-k-draw",
  useless: "bg-k-useless",
};

export function CardView({
  card,
  selected,
  onClick,
  size = "md",
}: {
  card: Card;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}) {
  const dims = size === "sm" ? "w-14 h-20 text-[9px]" : size === "lg" ? "w-44 h-64 text-sm" : "w-24 h-36 text-[11px]";
  const badge =
    card.kind === "gift" ? card.value : card.kind === "antidote" ? `-${card.value}` : null;
  const art = cardArt(card);
  return (
    <Button
      variant="ghost"
      type="button"
      onClick={onClick}
      aria-label={card.name}
      aria-pressed={onClick ? Boolean(selected) : undefined}
      title={`${card.name} — ${card.desc}`}
      className={cn(
        "game-card relative flex shrink-0 flex-col items-center justify-between gap-0 rounded-lg p-1 whitespace-normal text-foreground transition-transform hover:brightness-110 hover:text-foreground",
        dims,
        selected && "ring-2 ring-primary",
      )}
    >
      <span className={cn("card-category w-full shrink-0 truncate rounded-sm px-1 text-left text-[8px] font-bold uppercase text-ink", KIND_BG[card.kind])}>{KIND_LABEL[card.kind]}</span>
      {art ? (
        <img src={art} alt="" draggable={false} className="my-1 min-h-0 w-full flex-1 rounded-sm object-cover" />
      ) : (
        <span className={cn("grid flex-1 place-items-center", size === "lg" ? "text-7xl" : size === "sm" ? "text-2xl" : "text-4xl")}>{card.emoji}</span>
      )}
      <span className="line-clamp-2 w-full shrink-0 text-center font-bold leading-tight">{card.name}</span>
      {card.inevitable && <span className="mt-0.5 shrink-0 rounded bg-ink px-1 text-[8px] font-bold text-primary">INÉVITABLE</span>}
      {badge != null && (
        <span className="card-value absolute top-4 left-1 grid h-6 min-w-6 place-items-center rounded-sm bg-ink/90 px-1 font-display text-base text-primary">
          {badge}
        </span>
      )}
    </Button>
  );
}
