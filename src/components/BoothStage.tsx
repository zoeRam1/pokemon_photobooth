import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { H, W, WIN, type CardState } from "../card/data";
import { drawCard, drawWindow } from "../card/drawCard";
import { fontsReady } from "../lib/fonts";
import { useCamera } from "../hooks/useCamera";
import type { Shot } from "../App";
import { CardChip, sleep } from "./common";

interface Props {
  card: CardState;
  shots: Shot[];
  addShot: (url: string) => void;
  removeShot: (id: number) => void;
  onBack: () => void;
  onDone: () => void;
}

const isTouch = () => window.matchMedia("(pointer: coarse)").matches;

/** Reads image files, downsizes big ones, and hands back JPEG data URLs. */
function readFiles(files: FileList | null, add: (url: string) => void) {
  [...(files ?? [])].forEach(f => {
    if (!f.type.startsWith("image/")) return;
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 1800 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        add(c.toDataURL("image/jpeg", 0.92));
      };
      img.src = fr.result as string;
    };
    fr.readAsDataURL(f);
  });
}

export function BoothStage({ card, shots, addShot, removeShot, onBack, onDone }: Props) {
  const { videoRef, status, error, retry } = useCamera();
  const [count, setCount] = useState<number | null>(null);
  const [countKey, setCountKey] = useState(0);
  const [flashKey, setFlashKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  // StrictMode double-invokes effects in dev: reset true on (re)mount, not just false on cleanup
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => { const s = stripRef.current; if (s) s.scrollLeft = s.scrollWidth; }, [shots.length]);

  const live = status === "live";
  const previewRef = useRef<HTMLCanvasElement>(null);

  // Live card preview: the card's "under" and "over" layers are rendered once per card change,
  // and each animation frame only redraws the window with the current camera frame between them.
  useEffect(() => {
    const canvas = previewRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const makeLayer = (layer: "under" | "over") => {
      const c = document.createElement("canvas"); c.width = W; c.height = H;
      drawCard(c.getContext("2d")!, card, null, { layer });
      return c;
    };
    let under = makeLayer("under"), over = makeLayer("over");
    let raf = 0, stopped = false;
    // redraw text layers once the card fonts arrive
    void fontsReady.then(() => { if (!stopped) { under = makeLayer("under"); over = makeLayer("over"); } });
    const frame = () => {
      const v = videoRef.current;
      const hasFrame = !!v && v.readyState >= 2 && v.videoWidth > 0;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(under, 0, 0);
      // zoom 1 / no pan matches capture(): a centred crop at the window's aspect
      drawWindow(ctx, card, hasFrame ? v : null, { mirror: true, zoom: 1, ox: 0, oy: 0, placeholder: true });
      ctx.drawImage(over, 0, 0);
      if (!stopped) raf = requestAnimationFrame(frame);
    };
    frame();
    return () => { stopped = true; cancelAnimationFrame(raf); };
  }, [card, videoRef]);

  const countdown = async (n: number) => {
    for (let i = n; i > 0; i--) {
      if (!alive.current) return;
      setCount(i); setCountKey(k => k + 1);
      await sleep(800);
    }
    setCount(null);
  };

  /** Grabs a mirrored frame cropped to the card window's aspect, so the booth view matches the card. */
  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const vw = video.videoWidth, vh = video.videoHeight, ar = WIN.w / WIN.h;
    let sw = vw, sh = vw / ar;
    if (sh > vh) { sh = vh; sw = vh * ar; }
    const c = document.createElement("canvas");
    c.width = Math.round(sw); c.height = Math.round(sh);
    const x = c.getContext("2d")!;
    x.translate(c.width, 0); x.scale(-1, 1);
    x.drawImage(video, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, c.width, c.height);
    setFlashKey(k => k + 1);
    addShot(c.toDataURL("image/jpeg", 0.92));
  };

  const snap = async (n: number) => {
    if (busy || !live) return;
    setBusy(true);
    await countdown(3);
    for (let i = 0; i < n && alive.current; i++) {
      capture();
      if (i < n - 1) { await sleep(350); await countdown(1); }
    }
    if (alive.current) setBusy(false);
  };

  const onFiles = (e: ChangeEvent<HTMLInputElement>) => { readFiles(e.target.files, addShot); e.target.value = ""; };

  return (
    <section className="stage">
      <div className="bar">
        <button className="btn ghost sm" onClick={onBack}>‹ Cards</button>
        <h2>Strike a pose</h2>
        <CardChip card={card} />
      </div>
      <div className="booth">
        <div className="vf">
          <canvas ref={previewRef} width={W} height={H} aria-label="Live preview of your card" />
          {/* camera feed source: drawn into the card canvas, never shown directly */}
          <video ref={videoRef} className="vf-src" playsInline muted autoPlay />
          <div className="vf-win">
            <div className="count">{count != null && <span key={countKey}>{count}</span>}</div>
            <div className={`flash${flashKey ? " go" : ""}`} key={flashKey} />
          </div>
        </div>
        {status === "error" && (
          <div className="cam-msg">
            <strong>Live camera unavailable</strong>
            <p>{error}</p>
            <button className="btn sm" onClick={() => void retry()}>Try the camera</button>
          </div>
        )}

        <div className="row" style={{ 'marginTop': "10px" }}>
          <button className="btn" onClick={() => void snap(1)} disabled={!live || busy}>📸 Snap</button>
          <button className="btn pink" onClick={() => void snap(4)} disabled={!live || busy}>Burst ×4</button>
          {isTouch() && (
            <label className="btn ghost">Phone camera
              <input type="file" accept="image/*" capture="user" onChange={onFiles} />
            </label>
          )}
          <label className="btn ghost">Upload photos
            <input type="file" accept="image/*" multiple onChange={onFiles} />
          </label>
        </div>

        <div className="strip" ref={stripRef}>
          {shots.map((s, i) => (
            <div className="thumb" key={s.id}>
              <img src={s.url} alt={`Shot ${i + 1}`} />
              <button aria-label={`Delete shot ${i + 1}`} onClick={() => removeShot(s.id)}>×</button>
            </div>
          ))}
        </div>

        <button className="btn pink" onClick={onDone} disabled={!shots.length}>
          {shots.length ? `Done · pick from ${shots.length} shot${shots.length > 1 ? "s" : ""}` : "Done · pick a photo"}
        </button>
      </div>
    </section>
  );
}
