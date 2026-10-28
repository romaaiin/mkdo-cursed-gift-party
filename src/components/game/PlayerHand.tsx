import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Card } from "@/game/cards";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CardView } from "./CardView";

export function PlayerHand({ cards, selected, onSelect }: { cards: Card[]; selected: string | null; onSelect: (card: Card) => void }) {
  const scroll = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  useEffect(() => {
    const element = scroll.current;
    if (!element) return;
    const update = () => setEdges({ left: element.scrollLeft > 1, right: element.scrollLeft + element.clientWidth < element.scrollWidth - 1 });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    const fan = element.firstElementChild;
    if (fan) observer.observe(fan);
    element.addEventListener("scroll", update);
    update();
    return () => { observer.disconnect(); element.removeEventListener("scroll", update); };
  }, [cards.length]);
  const move = (direction: number) => {
    const element = scroll.current;
    if (element) element.scrollBy({ left: direction * element.clientWidth * 0.7, behavior: "auto" });
  };
  return <div className={cn("hand-area", cards.length > 9 && "hand-many")}>
    {(edges.left || edges.right) && <>
      <Button className="hand-arrow hand-arrow-left" size="icon" variant="outline" disabled={!edges.left} aria-label="Voir les cartes de gauche" title="Voir les cartes de gauche" onClick={() => move(-1)}><ChevronLeft /></Button>
      <Button className="hand-arrow hand-arrow-right" size="icon" variant="outline" disabled={!edges.right} aria-label="Voir les cartes de droite" title="Voir les cartes de droite" onClick={() => move(1)}><ChevronRight /></Button>
    </>}
    <div className="hand-scroll" ref={scroll} tabIndex={0} role="region" aria-label="Cartes en main, défilement horizontal">
      <div className="hand-fan" aria-label="Ta main">
        {cards.map((card, i) => {
          const offset = i - (cards.length - 1) / 2;
          const style = { "--fan-angle": `${cards.length > 9 ? 0 : Math.max(-14, Math.min(14, offset * 4))}deg`, "--fan-y": `${cards.length > 9 ? 0 : Math.min(18, Math.abs(offset) * 4)}px` } as CSSProperties;
          return <div key={card.id} className={cn("fan-card", selected === card.id && "is-selected")} style={style}><CardView card={card} selected={selected === card.id} onClick={() => onSelect(card)} /></div>;
        })}
        {!cards.length && <p className="py-10 text-sm text-muted-foreground">Main vide…</p>}
      </div>
    </div>
  </div>;
}