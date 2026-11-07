import { STK, type PlacedSticker } from "./data";
import { drawFace, shapeParts } from "./shapes";
import { rr } from "./draw-utils";

/** Sticker radius at scale 1, in card px */
export const BASE = 60;

const TEXT_FONT = `900 44px Rubik, "Nunito", sans-serif`;
const BUBBLE_FONT = `900 46px Rubik, "Nunito", sans-serif`;
const EMOJI_FONT = `100px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;

let measureCtx: CanvasRenderingContext2D | null = null;
function mctx(): CanvasRenderingContext2D {
  if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d")!;
  return measureCtx;
}

/** Unscaled width/height of a sticker's bounding box */
export function stickerSize(id: string): [number, number] {
  const d = STK[id];
  if (d.kind === "shape") return [BASE * 2.15, BASE * 2.15];
  if (d.kind === "emoji") return [BASE * 2, BASE * 2];
  const ctx = mctx();
  ctx.font = d.kind === "bubble" ? BUBBLE_FONT : TEXT_FONT;
  const tw = ctx.measureText(d.text).width;
  return d.kind === "bubble" ? [tw + 70, 110] : [tw + 34, 72];
}

export function drawSticker(ctx: CanvasRenderingContext2D, st: PlacedSticker) {
  const d = STK[st.id];
  ctx.save();
  ctx.translate(st.x, st.y); ctx.rotate(st.rot); ctx.scale(st.scale, st.scale);
  ctx.lineJoin = "round"; ctx.lineCap = "round";
  const shadow = () => { ctx.shadowColor = "rgba(20,10,40,.28)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 5; };
  const noShadow = () => { ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; };

  if (d.kind === "shape") {
    const color = st.color ?? d.color;
    const parts = shapeParts(d.shape, BASE, color);
    // die-cut white outline: stroke everything first so the fills hide inner seams
    shadow(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 16;
    parts.forEach(pt => ctx.stroke(pt.p)); noShadow();
    parts.forEach(pt => ctx.stroke(pt.p));
    parts.forEach(pt => { ctx.fillStyle = pt.c; ctx.fill(pt.p); });
    // glossy highlight
    ctx.save();
    const glossPart = parts.length > 1 && d.shape !== "flower" && d.shape !== "crown" ? parts[1] : parts[0];
    ctx.clip(glossPart.p);
    ctx.fillStyle = "rgba(255,255,255,.35)";
    ctx.beginPath(); ctx.ellipse(-BASE * 0.35, -BASE * 0.55, BASE * 0.5, BASE * 0.22, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (d.face) drawFace(ctx, d.shape, BASE);
  } else if (d.kind === "text") {
    ctx.font = TEXT_FONT; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    shadow(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 18; ctx.strokeText(d.text, 0, 2); noShadow();
    ctx.fillStyle = st.color ?? d.color; ctx.fillText(d.text, 0, 2);
  } else if (d.kind === "bubble") {
    const color = st.color ?? d.color;
    const [w] = stickerSize(st.id);
    const bw = w - 16, bh = 84;
    shadow(); ctx.fillStyle = "#fff"; rr(ctx, -bw / 2, -bh / 2 - 8, bw, bh, 40); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-bw * 0.18, bh / 2 - 12); ctx.lineTo(-bw * 0.32, bh / 2 + 22); ctx.lineTo(-bw * 0.02, bh / 2 - 12); ctx.closePath(); ctx.fill();
    noShadow();
    ctx.strokeStyle = color; ctx.lineWidth = 6; rr(ctx, -bw / 2 + 6, -bh / 2 - 2, bw - 12, bh - 12, 34); ctx.stroke();
    ctx.font = BUBBLE_FONT; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = color; ctx.fillText(d.text, 0, -6);
  } else {
    ctx.font = EMOJI_FONT; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    // white die-cut edge: the shadow of a glyph is its silhouette, so offset it all the way round
    ctx.shadowColor = "#fff"; ctx.shadowBlur = 0;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.shadowOffsetX = Math.cos(a) * 7 * st.scale; ctx.shadowOffsetY = Math.sin(a) * 7 * st.scale;
      ctx.fillText(d.text, 0, 6);
    }
    noShadow(); shadow(); ctx.fillText(d.text, 0, 6); noShadow(); ctx.fillText(d.text, 0, 6);
  }
  ctx.restore();
}

function halfBox(st: PlacedSticker): [number, number] {
  const [w, h] = stickerSize(st.id);
  return [(w * st.scale) / 2 + 10, (h * st.scale) / 2 + 10];
}

/** Position of the resize/rotate handle (bottom-right corner), card px */
export function handlePos(st: PlacedSticker): [number, number] {
  const [hw, hh] = halfBox(st);
  const c = Math.cos(st.rot), s = Math.sin(st.rot);
  return [st.x + hw * c - hh * s, st.y + hw * s + hh * c];
}

export function drawSelection(ctx: CanvasRenderingContext2D, st: PlacedSticker) {
  const [hw, hh] = halfBox(st);
  ctx.save(); ctx.translate(st.x, st.y); ctx.rotate(st.rot);
  ctx.setLineDash([12, 8]); ctx.lineWidth = 4; ctx.strokeStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 6;
  ctx.strokeRect(-hw, -hh, hw * 2, hh * 2); ctx.setLineDash([]);
  ctx.fillStyle = "#ffd23f"; ctx.strokeStyle = "#2a1c00"; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(hw, hh, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0; ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.arc(hw, hh, 10, -0.3, Math.PI * 1.2); ctx.stroke();
  ctx.restore();
}

/** Index of the top-most sticker under a point, or -1 */
export function hitSticker(stickers: PlacedSticker[], px: number, py: number): number {
  for (let i = stickers.length - 1; i >= 0; i--) {
    const st = stickers[i];
    const [w, h] = stickerSize(st.id);
    const dx = px - st.x, dy = py - st.y, c = Math.cos(-st.rot), s = Math.sin(-st.rot);
    const lx = dx * c - dy * s, ly = dx * s + dy * c;
    if (Math.abs(lx) <= (w * st.scale) / 2 + 6 && Math.abs(ly) <= (h * st.scale) / 2 + 6) return i;
  }
  return -1;
}
