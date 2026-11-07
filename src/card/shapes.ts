import type { ShapeName } from "./data";

export interface ShapePart { p: Path2D; c: string }

export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round(r + (t - r) * p); g = Math.round(g + (t - g) * p); b = Math.round(b + (t - b) * p);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

type PathLike = Path2D | CanvasRenderingContext2D;

export function starPath(p: PathLike, cx: number, cy: number, R: number, ir: number, n = 5, rot = -Math.PI / 2) {
  for (let i = 0; i < n * 2; i++) {
    const rad = i % 2 ? ir : R, a = rot + (i * Math.PI) / n;
    const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
    if (i) p.lineTo(x, y); else p.moveTo(x, y);
  }
  p.closePath();
}

function circ(p: Path2D, x: number, y: number, r: number) { p.moveTo(x + r, y); p.arc(x, y, r, 0, Math.PI * 2); }

function poly(p: Path2D, pts: [number, number][], s: number) {
  pts.forEach(([x, y], i) => (i ? p.lineTo(x * s, y * s) : p.moveTo(x * s, y * s)));
  p.closePath();
}

/** Builds a shape centred on 0,0 with radius ≈ s, as layered paths. */
export function shapeParts(shape: ShapeName, s: number, color: string): ShapePart[] {
  const P = () => new Path2D();
  switch (shape) {
    case "star": { const p = P(); starPath(p, 0, s * 0.06, s, s * 0.5); return [{ p, c: color }]; }
    case "heart": {
      const p = P(); p.moveTo(0, s * 0.92);
      p.bezierCurveTo(-s * 1.35, s * 0.05, -s * 0.78, -s * 1.0, 0, -s * 0.42);
      p.bezierCurveTo(s * 0.78, -s * 1.0, s * 1.35, s * 0.05, 0, s * 0.92); p.closePath();
      return [{ p, c: color }];
    }
    case "sparkle": {
      const p = P(), k = s * 0.14;
      p.moveTo(0, -s); p.quadraticCurveTo(k, -k, s, 0); p.quadraticCurveTo(k, k, 0, s);
      p.quadraticCurveTo(-k, k, -s, 0); p.quadraticCurveTo(-k, -k, 0, -s); p.closePath();
      const q = P(), m = s * 0.32, kk = m * 0.14, ox = s * 0.72, oy = -s * 0.68;
      q.moveTo(ox, oy - m); q.quadraticCurveTo(ox + kk, oy - kk, ox + m, oy); q.quadraticCurveTo(ox + kk, oy + kk, ox, oy + m);
      q.quadraticCurveTo(ox - kk, oy + kk, ox - m, oy); q.quadraticCurveTo(ox - kk, oy - kk, ox, oy - m); q.closePath();
      return [{ p, c: color }, { p: q, c: color }];
    }
    case "bolt": {
      const p = P(); poly(p, [[0.22, -1], [-0.55, 0.12], [-0.04, 0.12], [-0.26, 1], [0.56, -0.2], [0.06, -0.2], [0.36, -1]], s);
      return [{ p, c: color }];
    }
    case "bow": {
      const loops = P();
      loops.ellipse(-s * 0.5, -s * 0.12, s * 0.52, s * 0.38, -0.3, 0, Math.PI * 2);
      loops.moveTo(s * 1.02, -s * 0.12);
      loops.ellipse(s * 0.5, -s * 0.12, s * 0.52, s * 0.38, 0.3, 0, Math.PI * 2);
      const tails = P();
      poly(tails, [[-0.05, 0], [-0.5, 0.92], [-0.26, 0.8], [-0.12, 0.98], [0.06, 0.05]], s);
      poly(tails, [[0.05, 0], [0.5, 0.92], [0.26, 0.8], [0.12, 0.98], [-0.06, 0.05]], s);
      const knot = P(); knot.ellipse(0, -s * 0.1, s * 0.2, s * 0.24, 0, 0, Math.PI * 2);
      return [{ p: tails, c: shade(color, -0.12) }, { p: loops, c: color }, { p: knot, c: shade(color, -0.22) }];
    }
    case "cloud": {
      const p = P();
      circ(p, -s * 0.5, s * 0.12, s * 0.42); circ(p, 0, -s * 0.18, s * 0.58); circ(p, s * 0.52, s * 0.1, s * 0.44);
      circ(p, -s * 0.15, s * 0.3, s * 0.4); circ(p, s * 0.22, s * 0.32, s * 0.38);
      return [{ p, c: color }];
    }
    case "flower": {
      const p = P();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
        circ(p, Math.cos(a) * s * 0.52, Math.sin(a) * s * 0.52, s * 0.42);
      }
      const c = P(); circ(c, 0, 0, s * 0.3);
      return [{ p, c: color }, { p: c, c: "#ffd93b" }];
    }
    case "crown": {
      const p = P(); poly(p, [[-0.82, 0.55], [0.82, 0.55], [0.88, -0.42], [0.42, 0.02], [0, -0.7], [-0.42, 0.02], [-0.88, -0.42]], s);
      const g = P(); circ(g, -s * 0.88, -s * 0.5, s * 0.14); circ(g, 0, -s * 0.8, s * 0.15); circ(g, s * 0.88, -s * 0.5, s * 0.14);
      const j = P(); circ(j, 0, s * 0.26, s * 0.14); circ(j, -s * 0.45, s * 0.3, s * 0.09); circ(j, s * 0.45, s * 0.3, s * 0.09);
      return [{ p, c: color }, { p: g, c: "#ff7eb6" }, { p: j, c: "#7fd3ff" }];
    }
    case "moon": {
      // crescent = outer circle minus an offset circle, traced along both arcs
      const R = s, d = s * 0.5, r = s * 0.82;
      const x = (d * d + R * R - r * r) / (2 * d), y = Math.sqrt(Math.max(0, R * R - x * x));
      const th = Math.atan2(y, x), ph = Math.atan2(y, x - d);
      const p = P(); p.arc(0, 0, R, th, Math.PI * 2 - th); p.arc(d, 0, r, -ph, ph, true); p.closePath();
      return [{ p, c: color }];
    }
    case "note": {
      const p = P();
      p.ellipse(-s * 0.48, s * 0.6, s * 0.3, s * 0.22, -0.35, 0, Math.PI * 2);
      p.moveTo(s * 0.72, s * 0.45); p.ellipse(s * 0.42, s * 0.45, s * 0.3, s * 0.22, -0.35, 0, Math.PI * 2);
      p.rect(-s * 0.3, -s * 0.62, s * 0.13, s * 1.22);
      p.rect(s * 0.6, -s * 0.8, s * 0.13, s * 1.24);
      p.moveTo(-s * 0.3, -s * 0.62); p.lineTo(s * 0.73, -s * 0.85); p.lineTo(s * 0.73, -s * 0.55); p.lineTo(-s * 0.3, -s * 0.32); p.closePath();
      return [{ p, c: color }];
    }
  }
}

/** Little kawaii face: eyes, sparkle highlights, blush and smile. */
export function drawFace(ctx: CanvasRenderingContext2D, shape: ShapeName, s: number) {
  const offsets: Partial<Record<ShapeName, [number, number]>> = {
    star: [0, s * 0.12], heart: [0, -s * 0.05], cloud: [0, s * 0.08], moon: [-s * 0.5, s * 0.02],
  };
  const off = offsets[shape] ?? [0, 0];
  const sc = shape === "moon" ? 0.7 : 1;
  ctx.save(); ctx.translate(off[0], off[1]); ctx.scale(sc, sc);
  ctx.fillStyle = "#2b2140";
  ctx.beginPath(); ctx.ellipse(-s * 0.2, -s * 0.04, s * 0.065, s * 0.085, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(s * 0.2, -s * 0.04, s * 0.065, s * 0.085, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(-s * 0.18, -s * 0.07, s * 0.025, 0, Math.PI * 2); ctx.arc(s * 0.22, -s * 0.07, s * 0.025, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,105,150,.55)";
  ctx.beginPath();
  ctx.ellipse(-s * 0.36, s * 0.1, s * 0.1, s * 0.06, 0, 0, Math.PI * 2);
  ctx.ellipse(s * 0.36, s * 0.1, s * 0.1, s * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2b2140"; ctx.lineWidth = s * 0.045; ctx.lineCap = "round";
  ctx.beginPath(); ctx.arc(0, s * 0.04, s * 0.09, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  ctx.restore();
}
