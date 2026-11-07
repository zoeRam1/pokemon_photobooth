import type { CSSProperties } from "react";
import { RAR, THEMES, type CardState } from "../card/data";

export const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
export const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** "R ★★★ · Holo Prism" pill */
export function CardChip({ card }: { card: CardState }) {
  return (
    <span className="chip">
      <b>{card.rarity}</b> {"★".repeat(RAR[card.rarity].stars)} · {THEMES[card.theme].name}
    </span>
  );
}

/** Face-down card back with the logo word */
export function CardBack({ brand, style }: { brand: string; style?: CSSProperties }) {
  return <div className="cb" data-brand={brand || "PicMon"} style={style} />;
}
