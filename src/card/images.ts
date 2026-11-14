/**
 * Tiny cache + load-event bus for sticker image assets. Kept free of React so `stickers.ts`
 * stays a plain canvas-drawing module; components that need to redraw once a pending image
 * finishes loading subscribe via the `useImageLoadTick` hook.
 */
const cache = new Map<string, HTMLImageElement>();
const listeners = new Set<() => void>();

export function getStickerImage(src: string): HTMLImageElement {
  let img = cache.get(src);
  if (!img) {
    img = new Image();
    img.onload = () => listeners.forEach(fn => fn());
    img.src = src;
    cache.set(src, img);
  }
  return img;
}

export function isStickerImageReady(img: HTMLImageElement): boolean {
  return img.complete && img.naturalWidth > 0;
}

/** Notifies on every sticker image load. Returns an unsubscribe function. */
export function onStickerImageLoad(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
