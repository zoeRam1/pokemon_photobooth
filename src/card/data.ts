import { CUSTOM_STICKERS } from "./customStickers";

/** Card canvas size (export resolution) */
export const W = 900;
export const H = 1200;

export interface Rect { x: number; y: number; w: number; h: number }
/** Metal frame around the photo window */
export const FRAME: Rect = { x: 44, y: 172, w: 812, h: 548 };
/** The photo window itself */
export const WIN: Rect = { x: 60, y: 188, w: 780, h: 516 };

export type ShapeName =
  | "star" | "heart" | "sparkle" | "bolt" | "bow" | "cloud" | "flower" | "crown" | "moon" | "note";

export type ThemeId = "prism" | "volt" | "sakura" | "galaxy" | "mint" | "ember";
export interface Theme {
  name: string;
  type: string;
  border: string[];
  panel: string;
  pattern: string;
  shape: ShapeName;
  deco: [string, string];
  ink: string;
  sky: [string, string];
}

export const THEMES: Record<ThemeId, Theme> = {
  prism:  { name: "Holo Prism", type: "Prism",    border: ["#ff7eb3", "#ffd86b", "#8ef0a6", "#6ad4ff", "#b18cff", "#ff7eb3"], panel: "#f3f6fc", pattern: "#a9dcff", shape: "star",    deco: ["#ffe24a", "#38b6ff"], ink: "#22283a", sky: ["#3f9cff", "#d6edff"] },
  volt:   { name: "Volt",       type: "Electric", border: ["#ffe94d", "#ffb300", "#fff6b0", "#ffc400", "#ffe94d"],            panel: "#fffbea", pattern: "#ffe68f", shape: "bolt",    deco: ["#ffd400", "#2b7bff"], ink: "#2c2410", sky: ["#2b7bff", "#c4e3ff"] },
  sakura: { name: "Sakura",     type: "Fairy",    border: ["#ffb3d1", "#ff7fb0", "#ffe0ec", "#ff9cc5", "#ffb3d1"],            panel: "#fff4f8", pattern: "#ffcade", shape: "heart",   deco: ["#ff5fa2", "#ffffff"], ink: "#3b1f2c", sky: ["#ff9ec7", "#ffeef5"] },
  galaxy: { name: "Galaxy",     type: "Cosmic",   border: ["#4b35b0", "#8a4fe8", "#1f1c5e", "#c27bff", "#4b35b0"],            panel: "#1c1942", pattern: "#3a3384", shape: "sparkle", deco: ["#ffe680", "#c79bff"], ink: "#f3efff", sky: ["#120f3a", "#6a45c4"] },
  mint:   { name: "Mint Leaf",  type: "Grass",    border: ["#8ee8bb", "#3cc48a", "#d4f8e4", "#5ad19c", "#8ee8bb"],            panel: "#f1fcf5", pattern: "#c2efd8", shape: "flower",  deco: ["#2fbf7f", "#ffe066"], ink: "#16352a", sky: ["#4cc596", "#e3f9ee"] },
  ember:  { name: "Ember",      type: "Fire",     border: ["#ffb03d", "#ff5a3d", "#ffd27a", "#ff763d", "#ffb03d"],            panel: "#fff6ef", pattern: "#ffd6bb", shape: "star",    deco: ["#ff6a2b", "#ffc23d"], ink: "#3a1c10", sky: ["#ff7a45", "#ffe3cc"] },
};
export const THEME_IDS = Object.keys(THEMES) as ThemeId[];

export type FinishId = "silver" | "gold" | "rose" | "holo";
export interface Finish { name: string; g: string[]; edge: string }
export const FINISHES: Record<FinishId, Finish> = {
  silver: { name: "Silver", g: ["#ffffff", "#b9bec9", "#f4f5f8", "#9aa1ad", "#e9ebf0"], edge: "#7d838f" },
  gold:   { name: "Gold",   g: ["#fff6cf", "#e2ad2b", "#fff3c2", "#b9860f", "#ffe28a"], edge: "#8a6106" },
  rose:   { name: "Rose",   g: ["#fff0f5", "#e59bb6", "#ffe3ec", "#c26d8d", "#ffd2e1"], edge: "#9b4b69" },
  holo:   { name: "Holo",   g: ["#ffd1ea", "#bfe9ff", "#fff6b8", "#c9ffe0", "#e0c9ff"], edge: "#8b88b8" },
};
export const FINISH_IDS = Object.keys(FINISHES) as FinishId[];

export type RarityId = "C" | "U" | "R" | "SR" | "UR";
export interface Rarity {
  r: RarityId;
  stars: number;
  /** relative pull weight */
  w: number;
  fill: [string, string] | "rainbow";
  range: [number, number];
  blurb: string;
  burst: number;
}
export const RARITIES: Rarity[] = [
  { r: "C",  stars: 1, w: 30, fill: ["#ffffff", "#a3aab6"], range: [80, 990],     blurb: "A classic!",          burst: 12 },
  { r: "U",  stars: 2, w: 27, fill: ["#d9ffe5", "#26b866"], range: [1000, 2990],  blurb: "Ooh, uncommon.",      burst: 16 },
  { r: "R",  stars: 3, w: 22, fill: ["#fff08a", "#f29a05"], range: [3000, 5990],  blurb: "Rare pull!",          burst: 22 },
  { r: "SR", stars: 4, w: 14, fill: ["#ffffff", "#8fa6ff"], range: [6000, 8990],  blurb: "Super rare!!",        burst: 30 },
  { r: "UR", stars: 5, w: 7,  fill: "rainbow",              range: [9999, 9999],  blurb: "ULTRA RARE ✦ holo!!", burst: 42 },
];
export const RAR: Record<RarityId, Rarity> = Object.fromEntries(RARITIES.map(x => [x.r, x])) as Record<RarityId, Rarity>;

export type StickerDef =
  | { id: string; kind: "shape"; shape: ShapeName; color: string; face?: boolean }
  | { id: string; kind: "text" | "bubble"; text: string; color: string }
  | { id: string; kind: "emoji"; text: string }
  | { id: string; kind: "image"; src: string; label: string };

export const STICKER_COLORS = ["#ffd93b", "#ff5fa2", "#ff8a3d", "#7fd3ff", "#8b6cff", "#4fd18b", "#ffffff", "#2b2f45"];

const BUILTIN_STICKERS: StickerDef[] = [
  { id: "star",    kind: "shape", shape: "star",    color: "#ffd93b", face: true },
  { id: "heart",   kind: "shape", shape: "heart",   color: "#ff5fa2", face: true },
  { id: "sparkle", kind: "shape", shape: "sparkle", color: "#7fd3ff" },
  { id: "bolt",    kind: "shape", shape: "bolt",    color: "#ffd400" },
  { id: "bow",     kind: "shape", shape: "bow",     color: "#ff7eb6" },
  { id: "cloud",   kind: "shape", shape: "cloud",   color: "#cfe8ff", face: true },
  { id: "flower",  kind: "shape", shape: "flower",  color: "#ffb0d0" },
  { id: "crown",   kind: "shape", shape: "crown",   color: "#ffcf3d" },
  { id: "moon",    kind: "shape", shape: "moon",    color: "#ffe680", face: true },
  { id: "note",    kind: "shape", shape: "note",    color: "#8b6cff" },
  { id: "k1", kind: "text",   text: "(˶ᵔ ᵕ ᵔ˶)",   color: "#ff5fa2" },
  { id: "k2", kind: "text",   text: "٩(ˊᗜˋ*)و",    color: "#8b6cff" },
  { id: "k3", kind: "text",   text: "♡ so cute ♡", color: "#ff5fa2" },
  { id: "k4", kind: "text",   text: "NEW!",        color: "#ff8a3d" },
  { id: "k5", kind: "text",   text: "★ BFF ★",     color: "#2b7bff" },
  { id: "k6", kind: "bubble", text: "hi!!",        color: "#ff5fa2" },
  { id: "e1", kind: "emoji", text: "🍓" }, { id: "e2", kind: "emoji", text: "🎀" },
  { id: "e3", kind: "emoji", text: "🐱" }, { id: "e4", kind: "emoji", text: "🌈" },
  { id: "e5", kind: "emoji", text: "🍰" }, { id: "e6", kind: "emoji", text: "💌" },
  { id: "e7", kind: "emoji", text: "🧸" }, { id: "e8", kind: "emoji", text: "🌸" },
];

export const STICKERS: StickerDef[] = [...BUILTIN_STICKERS, ...CUSTOM_STICKERS];
export const STK: Record<string, StickerDef> = Object.fromEntries(STICKERS.map(s => [s.id, s]));

/** A sticker placed on the card (card px, radians) */
export interface PlacedSticker {
  uid: number;
  id: string;
  x: number;
  y: number;
  rot: number;
  scale: number;
  /** null = sticker's original colour */
  color: string | null;
}

export interface CardState {
  theme: ThemeId;
  finish: FinishId;
  rarity: RarityId;
  seed: number;
  deco: boolean;
  name: string;
  brand: string;
  studio: string;
  lab1: string;
  lab2: string;
  atk: string;
  def: string;
  desc: string;
  /** caption follows the theme until the user types their own */
  descAuto: boolean;
  zoom: number;
  ox: number;
  oy: number;
  stickers: PlacedSticker[];
}

export const defaultDesc = (theme: ThemeId) =>
  `${THEMES[theme].type} type … often found in photobooths collecting cute stickers ٩(ˊᗜˋ*)و ☆`;

export function initialCard(): CardState {
  return {
    theme: "prism", finish: "silver", rarity: "R", seed: 1, deco: true,
    name: "your.name", brand: "PicMon", studio: "Photo Booth Club",
    lab1: "ATK", lab2: "DEF", atk: "4200", def: "3800",
    desc: defaultDesc("prism"), descAuto: true,
    zoom: 1, ox: 0, oy: 0, stickers: [],
  };
}

export function rollStats(rarity: RarityId): Pick<CardState, "atk" | "def"> {
  const [lo, hi] = RAR[rarity].range;
  const pick = () => String(lo === hi ? lo : Math.round((lo + Math.random() * (hi - lo)) / 10) * 10);
  return { atk: pick(), def: pick() };
}

function weightedRarity(): RarityId {
  const total = RARITIES.reduce((a, r) => a + r.w, 0);
  let x = Math.random() * total;
  for (const r of RARITIES) if ((x -= r.w) < 0) return r.r;
  return "C";
}

/** A fresh random card: theme, finish, rarity, stats and pattern seed. */
export function pullCard(prev: CardState): CardState {
  const theme = THEME_IDS[Math.floor(Math.random() * THEME_IDS.length)];
  const rarity = weightedRarity();
  const finishes: FinishId[] = ["silver", "silver", "gold", "rose", "holo"];
  const finish = rarity === "UR" ? "holo" : finishes[Math.floor(Math.random() * finishes.length)];
  return {
    ...prev,
    theme, rarity, finish,
    seed: (Math.random() * 1e9) | 0,
    ...rollStats(rarity),
    desc: prev.descAuto ? defaultDesc(theme) : prev.desc,
  };
}
