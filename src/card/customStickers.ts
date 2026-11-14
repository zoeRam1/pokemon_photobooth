import type { StickerDef } from "./data";

/**
 * Custom stickers: drop a transparent-background PNG into src/assets/stickers/ and it becomes
 * a sticker automatically — no code changes needed. The id and label come from the filename.
 */
const files = import.meta.glob("../assets/stickers/*.png", { eager: true, import: "default" }) as Record<string, string>;

function toId(name: string): string {
  return `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;
}

export const CUSTOM_STICKERS: StickerDef[] = Object.entries(files)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([path, src]) => {
    const name = path.split("/").pop()!.replace(/\.png$/i, "");
    return { id: toId(name), kind: "image", src, label: name };
  });
