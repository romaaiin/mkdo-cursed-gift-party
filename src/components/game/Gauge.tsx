import { gaugeTotal, itemValue, MAX_GAUGE, type Player } from "@/game/engine";
import { cn } from "@/lib/utils";

export function Gauge({ player, compact }: { player: Player; compact?: boolean }) {
  const total = gaugeTotal(player);
  const pct = Math.min(100, (total / MAX_GAUGE) * 100);
  return (
    <div className="w-full">
      <div className={cn("sticker relative overflow-hidden rounded-full bg-ink", compact ? "h-3" : "h-5")}>
        <div
          className={cn("h-full transition-all duration-500", total >= 7 ? "bg-destructive" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
        {!compact && (
          <span className="absolute inset-0 grid place-items-center font-display text-xs text-foreground">
            {total} / {MAX_GAUGE}
          </span>
        )}
      </div>
      {!compact && player.gauge.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {player.gauge.map((g) => (
            <span key={g.id} className="rounded-full bg-k-gift px-2 py-0.5 text-[10px] font-bold text-ink">
              {g.base[0].emoji} {itemValue(g)}
              {g.extras.length > 0 && " 🎃"}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
