import { H, W, type CardState } from "../card/data";
import { drawCard } from "../card/drawCard";
import type { DownloadsApi, DownloadsError } from "./claude";

let downloads: DownloadsApi | null = null;
window.claude?.use("downloads").then(d => { downloads = d; }).catch(() => { downloads = null; });

function anchorSave(blob: Blob, filename: string): string {
  try {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return "Card saved ✦";
  } catch {
    return "Saving isn't available here. Long-press or right-click the card to save it.";
  }
}

/** Renders the card at full size (no selection outline) and saves it as a PNG. Returns a status message. */
export async function saveCard(card: CardState, photo: HTMLImageElement | null): Promise<string> {
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  drawCard(c.getContext("2d")!, card, photo, { selectedUid: null });
  const blob = await new Promise<Blob | null>(r => c.toBlob(r, "image/png"));
  if (!blob) return "Couldn't create the image. Try again.";
  const filename = `${(card.name || "my").replace(/[^\w.-]+/g, "_")}-${card.rarity}-card.png`;
  if (!downloads) return anchorSave(blob, filename);
  try {
    await downloads.save({ filename, data: blob });
    return "Card saved ✦";
  } catch (e) {
    const code = (e as DownloadsError | undefined)?.code;
    if (code === "declined") return "Save cancelled";
    if (code === "rate_limited") return "One moment, then try again";
    return anchorSave(blob, filename);
  }
}
