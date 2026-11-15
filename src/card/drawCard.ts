import { FINISHES, FRAME, H, RAR, THEMES, W, WIN, type CardState, type Finish, type Theme } from "./data";
import { clamp, lin, rng, rr } from "./draw-utils";
import { shapeParts, starPath } from "./shapes";
import { drawSelection, drawSticker } from "./stickers";

export interface DrawOptions {
  /** show the "?" silhouette when there is no photo yet */
  placeholder?: boolean;
  /** uid of the sticker to outline with the edit handle */
  selectedUid?: number | null;
  /**
   * Draw only part of the card: "under" = everything beneath the photo window,
   * "over" = everything on top of it (stars, logo, deco, stickers…) on a transparent canvas.
   * Lets the booth cache both and redraw just the window for a live preview.
   */
  layer?: "all" | "under" | "over";
}

/** Anything that can fill the photo window */
export type PhotoSource = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;
const sourceSize = (src: PhotoSource): [number, number] =>
  src instanceof HTMLImageElement ? [src.naturalWidth || src.width, src.naturalHeight || src.height]
  : src instanceof HTMLVideoElement ? [src.videoWidth, src.videoHeight]
  : [src.width, src.height];

export interface PhotoLayout { dx: number; dy: number; dw: number; dh: number; ox: number; oy: number }

/** Cover-fits the photo in the window, clamping the pan so the window is always filled. */
export function photoLayout(img: PhotoSource, zoom: number, ox: number, oy: number): PhotoLayout {
  const [iw, ih] = sourceSize(img);
  const sc = Math.max(WIN.w / iw, WIN.h / ih) * zoom;
  const dw = iw * sc, dh = ih * sc;
  const mx = (dw - WIN.w) / 2, my = (dh - WIN.h) / 2;
  const cx = clamp(ox, -mx, mx), cy = clamp(oy, -my, my);
  return { dx: WIN.x + WIN.w / 2 - dw / 2 + cx, dy: WIN.y + WIN.h / 2 - dh / 2 + cy, dw, dh, ox: cx, oy: cy };
}

/** Tap-to-edit zones on the card, in card px */
export type TextField = "name" | "atk" | "def" | "desc";
export function textZone(px: number, py: number): TextField | null {
  if (py > 40 && py < 135 && px > 290 && px < 700) return "name";
  if (py > 798 && py < 886 && px > 64 && px < W - 64) return px < W / 2 ? "atk" : "def";
  if (py > 900 && py < 1110 && px > 64 && px < W - 64) return "desc";
  return null;
}

const metal = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, F: Finish) =>
  lin(ctx, x, y, x + w * 0.4, y + h, F.g);

function drawSky(ctx: CanvasRenderingContext2D, T: Theme, rand: () => number) {
  ctx.fillStyle = lin(ctx, 0, WIN.y, 0, WIN.y + WIN.h, T.sky); ctx.fillRect(WIN.x, WIN.y, WIN.w, WIN.h);
  const gg = ctx.createRadialGradient(W / 2, WIN.y + WIN.h * 0.75, 20, W / 2, WIN.y + WIN.h * 0.75, WIN.w * 0.55);
  gg.addColorStop(0, "rgba(255,255,255,.45)"); gg.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gg; ctx.fillRect(WIN.x, WIN.y, WIN.w, WIN.h);
  ctx.fillStyle = "rgba(255,255,255,.85)";
  for (let i = 0; i < 6; i++) {
    const cx = WIN.x + rand() * WIN.w, cy = WIN.y + WIN.h * (0.35 + rand() * 0.6), s = 30 + rand() * 50;
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      ctx.moveTo(cx + (k - 2) * s * 0.6 + s * 0.6, cy);
      ctx.arc(cx + (k - 2) * s * 0.6, cy - (k % 2) * s * 0.3, s * 0.6, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255,255,255,.9)";
  for (let i = 0; i < 14; i++) {
    const p = new Path2D(); starPath(p, WIN.x + rand() * WIN.w, WIN.y + rand() * WIN.h * 0.6, 6 + rand() * 8, 2, 4, 0); ctx.fill(p);
  }
}

function drawPlaceholder(ctx: CanvasRenderingContext2D, T: Theme) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.beginPath(); ctx.arc(W / 2, WIN.y + 205, 78, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(W / 2, WIN.y + WIN.h + 40, 190, 190, 0, Math.PI, 0); ctx.fill();
  ctx.font = `120px "Lilita One", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = T.sky[0]; ctx.fillText("?", W / 2, WIN.y + 212);
  ctx.restore();
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, max: number, start: number, min: number, font: (px: number) => string) {
  let size = start; ctx.font = font(size);
  while (ctx.measureText(text).width > max && size > min) { size--; ctx.font = font(size); }
  return size;
}

function wrap(ctx: CanvasRenderingContext2D, txt: string, max: number): string[] {
  const out: string[] = [];
  txt.split("\n").forEach(par => {
    let line = "";
    par.split(/(\s+)/).forEach(tok => {
      const t = line + tok;
      if (ctx.measureText(t).width > max && line.trim()) { out.push(line.trim()); line = tok.trimStart(); }
      else line = t;
    });
    out.push(line.trim());
  });
  return out;
}

/**
 * Fills the photo window: sky backdrop, then the photo (cover-fit, zoom/pan from the card state),
 * or the "?" placeholder, then the inner bevel. `mirror` flips the source like a selfie camera.
 */
export function drawWindow(
  ctx: CanvasRenderingContext2D, S: CardState, photo: PhotoSource | null,
  opts: { placeholder?: boolean; mirror?: boolean; zoom?: number; ox?: number; oy?: number } = {},
) {
  const T = THEMES[S.theme];
  ctx.save(); rr(ctx, WIN.x, WIN.y, WIN.w, WIN.h, 8); ctx.clip();
  drawSky(ctx, T, rng(S.seed + 7));
  const [pw] = photo ? sourceSize(photo) : [0];
  if (photo && pw) {
    const L = photoLayout(photo, opts.zoom ?? S.zoom, opts.ox ?? S.ox, opts.oy ?? S.oy);
    if (opts.mirror) {
      ctx.translate(L.dx * 2 + L.dw, 0); ctx.scale(-1, 1);
    }
    ctx.drawImage(photo, L.dx, L.dy, L.dw, L.dh);
  } else if (opts.placeholder !== false) drawPlaceholder(ctx, T);
  ctx.restore();
  ctx.save(); rr(ctx, WIN.x, WIN.y, WIN.w, WIN.h, 8); ctx.clip();
  ctx.lineWidth = 6; ctx.strokeStyle = "rgba(0,0,0,.18)"; rr(ctx, WIN.x, WIN.y, WIN.w, WIN.h, 8); ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.9)"; rr(ctx, WIN.x - 1, WIN.y - 1, WIN.w + 2, WIN.h + 2, 9); ctx.stroke();
  ctx.restore();
}

export function drawCard(ctx: CanvasRenderingContext2D, S: CardState, photo: HTMLImageElement | null, opts: DrawOptions = {}) {
  const T = THEMES[S.theme], F = FINISHES[S.finish], R = RAR[S.rarity];
  const rand = rng(S.seed);
  const layer = opts.layer ?? "all";
  ctx.save(); ctx.clearRect(0, 0, W, H);

  if (layer !== "over") {

  // ---- outer holo border
  rr(ctx, 0, 0, W, H, 40); ctx.save(); ctx.clip();
  ctx.fillStyle = lin(ctx, 0, 0, W, H, T.border); ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = 0.6;
  ctx.fillStyle = lin(ctx, W, 0, 0, H, [...T.border].reverse()); ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 0.22; ctx.fillStyle = "#fff";
  for (let i = 0; i < 7; i++) {
    const x = -300 + i * 230 + rand() * 60, wd = 20 + rand() * 70;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + wd, 0); ctx.lineTo(x + wd + 500, H); ctx.lineTo(x + 500, H); ctx.fill();
  }
  ctx.restore(); ctx.globalAlpha = 1;

  // ---- inner panel + scattered pattern
  rr(ctx, 28, 28, W - 56, H - 56, 26); ctx.save(); ctx.clip();
  ctx.fillStyle = T.panel; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = S.theme === "galaxy" ? 0.9 : 0.75;
  for (let i = 0; i < 46; i++) {
    const s = 14 + rand() * 40, x = 28 + rand() * (W - 56), y = 28 + rand() * (H - 56), rot = rand() * Math.PI;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = T.pattern;
    ctx.fill(shapeParts(T.shape, s, T.pattern)[0].p); ctx.restore();
  }
  if (S.theme === "galaxy") {
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 90; i++) {
      ctx.globalAlpha = 0.3 + rand() * 0.6;
      ctx.beginPath(); ctx.arc(28 + rand() * (W - 56), 28 + rand() * (H - 56), 0.8 + rand() * 2.2, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // ---- studio pill
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.25)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  rr(ctx, 48, 48, 236, 72, 36); ctx.fillStyle = metal(ctx, 48, 48, 236, 72, F); ctx.fill(); ctx.shadowColor = "transparent";
  ctx.lineWidth = 3; ctx.strokeStyle = F.edge; ctx.stroke();
  ctx.fillStyle = "#1b1b22"; ctx.beginPath(); ctx.arc(86, 84, 24, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff"; rr(ctx, 72, 75, 28, 20, 4); ctx.fill(); rr(ctx, 80, 70, 12, 7, 2); ctx.fill();
  ctx.fillStyle = "#1b1b22"; ctx.beginPath(); ctx.arc(86, 85, 6, 0, Math.PI * 2); ctx.fill();
  ctx.textBaseline = "middle"; ctx.textAlign = "left";
  const studio = S.studio.trim() || " ";
  const pillFont = (px: number) => `700 ${px}px Rubik, sans-serif`;
  ctx.font = pillFont(22);
  let lines = [studio];
  if (ctx.measureText(studio).width > 166) {
    const sp = studio.split(" "), mid = Math.ceil(sp.length / 2);
    if (sp.length > 1) lines = [sp.slice(0, mid).join(" "), sp.slice(mid).join(" ")];
  }
  let fs = 22; ctx.font = pillFont(fs);
  while (Math.max(...lines.map(l => ctx.measureText(l).width)) > 166 && fs > 11) { fs--; ctx.font = pillFont(fs); }
  if (lines.length === 1) ctx.fillText(lines[0], 118, 85);
  else { ctx.fillText(lines[0], 118, 85 - fs * 0.55); ctx.fillText(lines[1], 118, 85 + fs * 0.6); }
  ctx.restore();

  // ---- name
  ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.lineJoin = "round";
  fitFont(ctx, S.name, 380, 54, 24, px => `800 ${px}px Rubik, sans-serif`);
  ctx.lineWidth = 10; ctx.strokeStyle = S.theme === "galaxy" ? "rgba(20,15,60,.8)" : "rgba(255,255,255,.85)";
  ctx.strokeText(S.name, 492, 104); ctx.fillStyle = T.ink; ctx.fillText(S.name, 492, 104);
  ctx.restore();

  // ---- window frame with raised tab
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.3)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5;
  const { x: fx, y: fy, w: fw, h: fh } = FRAME;
  ctx.beginPath();
  ctx.moveTo(fx + 18, fy - 18); ctx.lineTo(560, fy - 18); ctx.lineTo(600, fy);
  ctx.lineTo(fx + fw - 18, fy); ctx.arcTo(fx + fw, fy, fx + fw, fy + 18, 18);
  ctx.lineTo(fx + fw, fy + fh - 18); ctx.arcTo(fx + fw, fy + fh, fx + fw - 18, fy + fh, 18);
  ctx.lineTo(fx + 18, fy + fh); ctx.arcTo(fx, fy + fh, fx, fy + fh - 18, 18);
  ctx.lineTo(fx, fy); ctx.arcTo(fx, fy - 18, fx + 18, fy - 18, 18); ctx.closePath();
  ctx.fillStyle = metal(ctx, fx, fy - 18, fw, fh + 18, F); ctx.fill();
  ctx.shadowColor = "transparent"; ctx.lineWidth = 3; ctx.strokeStyle = F.edge; ctx.stroke();
  if (S.finish === "holo") {
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = lin(ctx, fx, 0, fx + fw, 0, ["#ff8fd0", "#ffe680", "#8ff0c0", "#8fd0ff", "#c9a0ff"]); ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.restore();

  // ---- window contents
  if (layer === "all") drawWindow(ctx, S, photo, { placeholder: opts.placeholder });
  if (layer === "under") { ctx.restore(); return; }
  }

  // ---- rarity badge + stars (everything from here sits on top of the window)
  ctx.save(); ctx.textAlign = "right"; ctx.textBaseline = "alphabetic"; ctx.lineJoin = "round";
  ctx.font = `italic 900 92px Rubik, sans-serif`;
  const bx = W - 52, by = 128, bw = ctx.measureText(S.rarity).width;
  ctx.lineWidth = 22; ctx.strokeStyle = "#fff"; ctx.strokeText(S.rarity, bx, by);
  ctx.lineWidth = 11; ctx.strokeStyle = "#2b1a00"; ctx.strokeText(S.rarity, bx, by);
  ctx.fillStyle = R.fill === "rainbow"
    ? lin(ctx, bx - bw, 0, bx, 0, ["#ff6fae", "#ffd23f", "#6ef0a0", "#5cc8ff", "#b18cff"])
    : lin(ctx, 0, by - 70, 0, by, R.fill);
  ctx.fillText(S.rarity, bx, by);
  ctx.restore();
  for (let i = 0; i < R.stars; i++) {
    const cx = W - 78 - i * 62, cy = 178, p = new Path2D(); starPath(p, cx, cy, 30, 14);
    ctx.save(); ctx.lineJoin = "round";
    ctx.lineWidth = 9; ctx.strokeStyle = "#fff"; ctx.stroke(p);
    ctx.lineWidth = 3.5; ctx.strokeStyle = "#7a4e00"; ctx.stroke(p);
    ctx.fillStyle = lin(ctx, 0, cy - 30, 0, cy + 30, ["#fff6a8", "#ffc21a", "#f29a05"]); ctx.fill(p);
    ctx.restore();
  }

  // ---- stat bar
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.28)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
  rr(ctx, 64, 800, W - 128, 84, 42); ctx.fillStyle = metal(ctx, 64, 800, W - 128, 84, F); ctx.fill();
  ctx.shadowColor = "transparent"; ctx.lineWidth = 3; ctx.strokeStyle = F.edge; ctx.stroke();
  rr(ctx, 78, 812, W - 156, 60, 30); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.stroke();
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#2a2f3a";
  const statTxt = (lab: string, val: string, fb: string) => `${(lab.trim() || fb).toUpperCase()} / ${val || "0"}`;
  ([[statTxt(S.lab1, S.atk, "ATK"), W * 0.31], [statTxt(S.lab2, S.def, "DEF"), W * 0.69]] as const).forEach(([t, x]) => {
    fitFont(ctx, t, 330, 42, 24, px => `italic 900 ${px}px Rubik, sans-serif`);
    ctx.fillText(t, x, 844);
  });
  ctx.restore();

  // ---- caption
  ctx.save(); ctx.fillStyle = T.ink; ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
  let fsd = 34, dl: string[];
  do { ctx.font = `800 ${fsd}px Nunito, sans-serif`; dl = wrap(ctx, S.desc, W - 170); fsd -= 2; } while (dl.length > 4 && fsd > 18);
  const lh = (fsd + 2) * 1.3;
  dl.slice(0, 5).forEach((l, i) => ctx.fillText(l, 84, 948 + i * lh));
  ctx.restore();

  // ---- footer
  ctx.save(); ctx.font = `700 22px Rubik, sans-serif`; ctx.textAlign = "right"; ctx.fillStyle = T.ink; ctx.globalAlpha = 0.85;
  ctx.fillText(`PicMon ★ ${new Date().getFullYear()} ${S.studio}.`, W - 64, H - 54);
  ctx.restore();

  // ---- big decorative shapes
  if (S.deco) {
    const spots: [number, number, number][] = [[34, 220, 74], [38, 690, 58], [872, 380, 86], [866, 900, 64], [96, 1130, 96]];
    const dr = rng(S.seed + 99);
    spots.forEach(([x, y, s], i) => {
      const col = T.deco[i % 2];
      ctx.save(); ctx.translate(x, y); ctx.rotate((dr() - 0.5) * 1.2);
      const parts = shapeParts(T.shape, s, col);
      ctx.lineJoin = "round"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 8;
      ctx.shadowColor = "rgba(0,0,0,.18)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
      parts.forEach(pt => ctx.stroke(pt.p)); ctx.shadowColor = "transparent";
      parts.forEach(pt => { ctx.fillStyle = col; ctx.fill(pt.p); });
      ctx.restore();
    });
  }

  // ---- logo wordmark overlapping the window's bottom edge
  ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.lineJoin = "round";
  const logo = (S.brand).toUpperCase();
  const ls = fitFont(ctx, logo, 520, 96, 40, px => `${px}px "Lilita One", sans-serif`);
  ctx.translate(W / 2, 752); ctx.rotate(-0.025);
  ctx.lineWidth = 26; ctx.strokeStyle = "#0d1a5c"; ctx.strokeText(logo, 0, 6);
  ctx.lineWidth = 18; ctx.strokeStyle = "#2d63e6"; ctx.strokeText(logo, 0, 0);
  ctx.fillStyle = lin(ctx, 0, -ls * 0.7, 0, 0, ["#fff27a", "#ffd23f", "#f5a800"]); ctx.fillText(logo, 0, 0);
  ctx.restore();

  // ---- stickers
  S.stickers.forEach(st => drawSticker(ctx, st));
  if (opts.selectedUid != null) {
    const sel = S.stickers.find(s => s.uid === opts.selectedUid);
    if (sel) drawSelection(ctx, sel);
  }
  ctx.restore();
}
