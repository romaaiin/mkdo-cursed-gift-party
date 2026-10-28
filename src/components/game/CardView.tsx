import type { Card, Kind } from "@/game/cards";
import { KIND_LABEL } from "@/game/cards";
import { cn } from "@/lib/utils";

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
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "sticker relative flex shrink-0 flex-col items-center justify-between rounded-xl p-1.5 text-ink transition-transform",
        dims,
        KIND_BG[card.kind],
        selected && "-translate-y-4 ring-4 ring-accent",
      )}
    >
      <span className="w-full truncate text-left font-bold uppercase opacity-80">{KIND_LABEL[card.kind]}</span>
      <span className={size === "lg" ? "text-7xl" : size === "sm" ? "text-2xl" : "text-4xl"}>{card.emoji}</span>
      <span className="line-clamp-2 w-full text-center font-bold leading-tight">{card.name}</span>
      {size === "lg" && <span className="text-center text-xs leading-snug">{card.desc}</span>}
      {badge != null && (
        <span className="sticker absolute -top-2 -right-2 grid h-7 min-w-7 place-items-center rounded-full bg-background px-1 font-display text-xs text-foreground">
          {badge}
        </span>
      )}
      {card.inevitable && (
        <span className="absolute bottom-6 rounded bg-ink px-1 text-[8px] font-bold text-primary">INÉVITABLE</span>
      )}
    </button>
  );
}
