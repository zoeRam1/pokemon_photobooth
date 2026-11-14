import { useEffect, useState } from "react";
import { onStickerImageLoad } from "../card/images";

/** Bumps whenever a sticker image finishes loading, so a draw effect depending on it redraws. */
export function useImageLoadTick(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => onStickerImageLoad(() => setTick(t => t + 1)), []);
  return tick;
}
