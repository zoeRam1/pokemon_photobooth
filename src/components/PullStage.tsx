import { useEffect, useMemo, useRef, useState, type CSSProperties, type Dispatch, type PointerEvent as ReactPointerEvent, type SetStateAction } from "react";
import { FINISHES, RAR, THEMES, pullCard, type CardState } from "../card/data";
import { drawCard } from "../card/drawCard";
import { CardBack, reduceMotion, sleep } from "./common";

type Phase = "idle" | "shuffling" | "revealed";

interface Props {
  card: CardState;
  setCard: Dispatch<SetStateAction<CardState>>;
  fontsLoaded: boolean;
  onStart: () => void;
}

export function PullStage({ card, setCard, fontsLoaded, onStart }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [flipped, setFlipped] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  // StrictMode double-invokes effects in dev: reset true on (re)mount, not just false on cleanup
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  // keep the face-up card drawn with the latest pull; `phase` is included because the
  // "up"/"down" key below remounts the canvas (fresh, blank bitmap) when phase flips to
  // "revealed" — without it in the deps, that remount wouldn't trigger a redraw
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawCard(ctx, card, null, { placeholder: true });
  }, [card, fontsLoaded, phase]);

  const pull = async () => {
    if (phase === "shuffling") return;
    setShowResult(false);
    setCard(c => pullCard(c));
    setPhase("shuffling");
    const rm = reduceMotion();
    await sleep(rm ? 100 : 1750);
    if (!alive.current) return;
    setPhase("revealed");
    await sleep(rm ? 50 : 480);
    if (!alive.current) return;
    setFlipped(true);
    await sleep(rm ? 50 : 420);
    if (!alive.current) return;
    setBurstKey(k => k + 1);
    setShowResult(true);
  };

  // holo tilt + shine follow the pointer once the card is face-up
  const onMove = (e: ReactPointerEvent) => {
    const el = revealRef.current;
    if (!el || !flipped) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    el.style.transform = `rotateY(${(px - 0.5) * 22}deg) rotateX(${(0.5 - py) * 22}deg)`;
    el.style.setProperty("--mx", `${100 - px * 100}%`);
    el.style.setProperty("--my", `${100 - py * 100}%`);
  };
  const onLeave = () => { if (revealRef.current) revealRef.current.style.transform = ""; };

  const T = THEMES[card.theme], R = RAR[card.rarity];
  const deckClass = phase === "shuffling" ? "deck shuffling" : phase === "revealed" ? "deck gone" : "deck";

  return (
    <section className="stage">
      <h1 className="brand">PicMon Booth</h1>
      <p className="tag" style={{ marginBottom: '10px', minHeight: '40px' }}>
        {showResult
          ? "Here's your card. Time to put your face on it."
          : "Hit PULL to shuffle and draw a random card, then step into the booth and make it yours."}
      </p>
      <div className="table" onPointerMove={onMove} onPointerLeave={onLeave}>
        <div className={deckClass}>
          {Array.from({ length: 6 }, (_, i) => <CardBack key={i} brand={card.brand} />)}
        </div>
        <div className="reveal" ref={revealRef} data-r={card.rarity} hidden={phase !== "revealed"}>
          <div className="lift" key={phase === "revealed" ? "up" : "down"}>
            <div className={`flip${flipped ? " on" : ""}`}>
              <div className="face"><CardBack brand={card.brand} style={{ inset: 0 }} /></div>
              <div className="face front">
                <canvas ref={canvasRef} width={900} height={1200} aria-label="Your pulled card" />
                <div className="shine" />
              </div>
            </div>
          </div>
        </div>
        <Burst key={burstKey} active={burstKey > 0} count={R.burst} colors={[T.deco[0], T.deco[1], "#fff", "#ffd23f", "#ff6fae"]} />
      </div>
      <div style={{ minHeight: '120px' }}>
        {showResult ? (
          <div className="result">
            <p className="rline">
              {R.blurb} <span style={{ color: "var(--sun)" }}>{"★".repeat(R.stars)}</span>
              <small>{T.name} frame · {FINISHES[card.finish].name} finish · {T.type} type</small>
            </p>
            <div className="row">
              <button className="btn pink" onClick={onStart}>Start the photobooth</button>
              <button className="btn ghost" onClick={pull}>Pull again</button>
            </div>
          </div>
        ): <button className="btn pull-btn" onClick={pull} disabled={phase !== "idle"}>PULL</button>}
      </div>
    </section>
  );
}

function Burst({ active, count, colors }: { active: boolean; count: number; colors: string[] }) {
  const [done, setDone] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDone(true), 1500); return () => clearTimeout(t); }, []);
  const parts = useMemo(() => Array.from({ length: count }, (_, i) => {
    const a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 160;
    return {
      ch: ["★", "✦", "♥", "✧"][i % 4],
      style: {
        "--x": `${Math.cos(a) * d}px`, "--y": `${Math.sin(a) * d}px`, "--c": colors[i % colors.length],
        fontSize: `${12 + Math.random() * 18}px`, animationDelay: `${Math.random() * 0.15}s`,
      } as CSSProperties,
    };
  // colours compared by value: the array is rebuilt on every parent render
  }), [count, colors.join("|")]);
  if (!active || done) return <div className="burst" />;
  return <div className="burst">{parts.map((p, i) => <i key={i} style={p.style}>{p.ch}</i>)}</div>;
}
