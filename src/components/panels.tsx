import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  FINISHES, FINISH_IDS, RARITIES, STICKERS, STICKER_COLORS, STK, THEMES, THEME_IDS,
  defaultDesc, rollStats, type CardState, type PlacedSticker, type StickerDef,
} from "../card/data";
import type { TextField } from "../card/drawCard";
import { drawSticker, stickerLabel, stickerSize } from "../card/stickers";
import { updateSticker } from "./CardEditor";
import { useImageLoadTick } from "../hooks/useImageLoadTick";

type SetCard = Dispatch<SetStateAction<CardState>>;
const usePatch = (setCard: SetCard) => (p: Partial<CardState>) => setCard(c => ({ ...c, ...p }));

/* ------------------------------------------------------------------ Details */

// last tap-to-edit request already handled, so remounting the tab doesn't re-focus
let handledFocusN = 0;

export function DetailsPanel({ card, setCard, focusReq }: {
  card: CardState; setCard: SetCard; focusReq: { field: TextField; n: number } | null;
}) {
  const patch = usePatch(setCard);
  const refs = {
    name: useRef<HTMLInputElement>(null),
    atk: useRef<HTMLInputElement>(null),
    def: useRef<HTMLInputElement>(null),
    desc: useRef<HTMLTextAreaElement>(null),
  };
  const [flash, setFlash] = useState<{ field: TextField; n: number } | null>(null);

  // a tap on the card text focuses the matching field and flashes it
  useEffect(() => {
    if (!focusReq || focusReq.n === handledFocusN) return;
    const el = refs[focusReq.field].current;
    if (!el) return;
    handledFocusN = focusReq.n;
    setFlash(focusReq);
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.select();
  }, [focusReq]); // refs are stable

  // alternating class names restart the flash animation on repeat taps
  const fieldClass = (f: TextField) => `field${flash?.field === f ? (flash.n % 2 ? " flash-a" : " flash-b") : ""}`;

  return (
    <div className="tabpane">
      <div className={fieldClass("name")}>
        <label htmlFor="fName">Name</label>
        <input id="fName" ref={refs.name} maxLength={28} placeholder="your.name" value={card.name} onChange={e => patch({ name: e.target.value })} />
      </div>
      <div className="stat">
        <div className="field">
          <label htmlFor="fLab1">Stat 1</label>
          <input id="fLab1" maxLength={5} aria-label="First stat name" value={card.lab1} onChange={e => patch({ lab1: e.target.value })} />
        </div>
        <div className={fieldClass("atk")}>
          <label htmlFor="fAtk">Value</label>
          <input id="fAtk" ref={refs.atk} maxLength={6} inputMode="numeric" value={card.atk} onChange={e => patch({ atk: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="fLab2">Stat 2</label>
          <input id="fLab2" maxLength={5} aria-label="Second stat name" value={card.lab2} onChange={e => patch({ lab2: e.target.value })} />
        </div>
        <div className={fieldClass("def")}>
          <label htmlFor="fDef">Value</label>
          <input id="fDef" ref={refs.def} maxLength={6} inputMode="numeric" value={card.def} onChange={e => patch({ def: e.target.value })} />
        </div>
      </div>
      <div className={fieldClass("desc")}>
        <label htmlFor="fDesc">Caption</label>
        <textarea id="fDesc" ref={refs.desc} maxLength={160} value={card.desc} onChange={e => patch({ desc: e.target.value, descAuto: false })} />
        <span className="count-note">{card.desc.length} / 160</span>
      </div>
      <div className="two">
        <div className="field">
          <label htmlFor="fBrand">Logo</label>
          <input id="fBrand" maxLength={14} value={card.brand} onChange={e => patch({ brand: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="fStudio">Studio badge</label>
          <input id="fStudio" maxLength={26} value={card.studio} onChange={e => patch({ studio: e.target.value })} />
        </div>
      </div>
      <button className="btn ghost sm" onClick={() => setCard(c => ({ ...c, ...rollStats(c.rarity) }))}>🎲 Re-roll stats</button>
    </div>
  );
}

/* ------------------------------------------------------------------ Frame */

export function FramePanel({ card, setCard }: { card: CardState; setCard: SetCard }) {
  const patch = usePatch(setCard);
  const pickTheme = (k: CardState["theme"]) => setCard(c => ({
    ...c, theme: k,
    desc: c.descAuto || c.desc === defaultDesc(c.theme) ? defaultDesc(k) : c.desc,
  }));
  return (
    <div className="tabpane">
      {/* <div>
        <p className="lbl">Frame colour</p>
        <div className="swatches">
          {THEME_IDS.map(k => {
            const T = THEMES[k];
            return (
              <button key={k} className="sw" aria-pressed={card.theme === k} onClick={() => pickTheme(k)}>
                <div className="prev" style={{ background: `linear-gradient(135deg,${T.border.join(",")})`, ["--panel" as string]: T.panel }} />
                <span>{T.name}</span>
              </button>
            );
          })}
        </div>
      </div> */}
      <div>
        <p className="lbl">Window finish</p>
        <div className="seg">
          {FINISH_IDS.map(k => (
            <button key={k} aria-pressed={card.finish === k} onClick={() => patch({ finish: k })}>{FINISHES[k].name}</button>
          ))}
        </div>
      </div>
      {/* <div>
        <p className="lbl">Rarity</p>
        <div className="seg">
          {RARITIES.map(R => (
            <button key={R.r} aria-pressed={card.rarity === R.r} onClick={() => patch({ rarity: R.r })}>
              {R.r} {"★".repeat(R.stars)}
            </button>
          ))}
        </div>
      </div> */}
      <label className="check">
        <input type="checkbox" checked={card.deco} onChange={e => patch({ deco: e.target.checked })} /> Big decorative shapes
      </label>
    </div>
  );
}

/* ------------------------------------------------------------------ Stickers */

const colorableKind = (kind: StickerDef["kind"]) => kind !== "emoji" && kind !== "image";

function StickerThumb({ id, color, fontsLoaded }: { id: string; color: string | null; fontsLoaded: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const imgTick = useImageLoadTick();
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 128, 128);
    const [w, h] = stickerSize(id);
    const scale = Math.min(104 / (w + 16), 104 / (h + 16));
    drawSticker(ctx, { uid: 0, id, x: 64, y: 64, rot: 0, scale, color: colorableKind(STK[id].kind) ? color : null });
  }, [id, color, fontsLoaded, imgTick]);
  return <canvas ref={ref} width={128} height={128} />;
}

const toDeg = (rad: number) => Math.round((((rad * 180) / Math.PI + 540) % 360) - 180);

export function StickersPanel(props: {
  card: CardState; setCard: SetCard; fontsLoaded: boolean;
  color: string | null; setColor: (c: string | null) => void;
  selectedUid: number | null; setSelectedUid: (u: number | null) => void;
  onAdd: (id: string) => void; onRemove: () => void; nextUid: () => number;
}) {
  const { card, setCard, fontsLoaded, color, setColor, selectedUid, setSelectedUid, onAdd, onRemove, nextUid } = props;
  const sel = card.stickers.find(s => s.uid === selectedUid);
  const update = (p: Partial<PlacedSticker>) => { if (sel) updateSticker(setCard, sel.uid, p); };

  const chooseColor = (c: string | null) => {
    setColor(c);
    if (sel && colorableKind(STK[sel.id].kind)) update({ color: c });
  };
  const toFront = () => {
    if (!sel) return;
    setCard(c => ({ ...c, stickers: [...c.stickers.filter(s => s.uid !== sel.uid), sel] }));
  };
  const duplicate = () => {
    if (!sel) return;
    const uid = nextUid();
    setCard(c => ({ ...c, stickers: [...c.stickers, { ...sel, uid, x: sel.x + 40, y: sel.y + 40 }] }));
    setSelectedUid(uid);
  };

  return (
    <div className="tabpane">
      <div>
        <p className="lbl">Sticker colour</p>
        <div className="colors">
          <button
            aria-label="Original colours" title="Original colours" aria-pressed={color === null}
            style={{ background: "conic-gradient(#ff5fa2,#ffd93b,#4fd18b,#7fd3ff,#8b6cff,#ff5fa2)" }}
            onClick={() => chooseColor(null)}
          />
          {STICKER_COLORS.map(c => (
            <button key={c} aria-label={`Colour ${c}`} aria-pressed={color === c} style={{ background: c }} onClick={() => chooseColor(c)} />
          ))}
        </div>
      </div>
      <div>
        <p className="lbl">Tap to add</p>
        <div className="stickers">
          {STICKERS.map(d => (
            <button key={d.id} aria-label={`Add ${stickerLabel(d)} sticker`} onClick={() => onAdd(d.id)}>
              <StickerThumb id={d.id} color={color} fontsLoaded={fontsLoaded} />
            </button>
          ))}
        </div>
      </div>
      {sel && (
        <div className="selbox">
          <p className="lbl" style={{ margin: 0 }}>Selected sticker</p>
          <label className="range"><span>Size</span>
            <input type="range" min={0.25} max={4} step={0.01} value={sel.scale} onChange={e => update({ scale: +e.target.value })} />
          </label>
          <label className="range"><span>Spin</span>
            <input type="range" min={-180} max={180} step={1} value={toDeg(sel.rot)} onChange={e => update({ rot: (+e.target.value * Math.PI) / 180 })} />
          </label>
          <div className="row" style={{ justifyContent: "flex-start" }}>
            <button className="btn ghost sm" onClick={toFront}>To front</button>
            <button className="btn ghost sm" onClick={duplicate}>Duplicate</button>
            <button className="btn ghost sm danger" onClick={onRemove}>Remove</button>
          </div>
        </div>
      )}
      <button className="btn ghost sm" onClick={() => { setCard(c => ({ ...c, stickers: [] })); setSelectedUid(null); }}>
        Clear all stickers
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ Photo */

export function PhotoPanel({ card, setCard, onChangePhoto }: { card: CardState; setCard: SetCard; onChangePhoto: () => void }) {
  const patch = usePatch(setCard);
  return (
    <div className="tabpane">
      <label className="range"><span>Zoom</span>
        <input type="range" min={1} max={3} step={0.01} value={card.zoom} onChange={e => patch({ zoom: +e.target.value })} />
      </label>
      <p className="hint" style={{ textAlign: "left" }}>Drag the photo inside the card window to move it.</p>
      <div className="row" style={{ justifyContent: "flex-start" }}>
        <button className="btn ghost sm" onClick={() => patch({ zoom: 1, ox: 0, oy: 0 })}>Reset framing</button>
        <button className="btn ghost sm" onClick={onChangePhoto}>Use another shot</button>
      </div>
    </div>
  );
}
