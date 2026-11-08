import { useEffect, useRef, type Dispatch, type PointerEvent as ReactPointerEvent, type SetStateAction } from "react";
import { H, W, WIN, type CardState, type PlacedSticker } from "../card/data";
import { clamp } from "../card/draw-utils";
import { drawCard, photoLayout, textZone, type TextField } from "../card/drawCard";
import { handlePos, hitSticker } from "../card/stickers";
import { useImageLoadTick } from "../hooks/useImageLoadTick";

type Drag =
  | { mode: "move"; uid: number; dx: number; dy: number }
  | { mode: "handle"; uid: number; cx: number; cy: number; d0: number; a0: number; s0: number; r0: number }
  | { mode: "pan"; px: number; py: number; ox: number; oy: number };

interface Props {
  card: CardState;
  setCard: Dispatch<SetStateAction<CardState>>;
  photo: HTMLImageElement | null;
  fontsLoaded: boolean;
  selectedUid: number | null;
  setSelectedUid: (uid: number | null) => void;
  /** a tap on the name, a stat, or the caption */
  onTextTap: (field: TextField) => void;
  onStickerGrab: () => void;
}

export function updateSticker(setCard: Dispatch<SetStateAction<CardState>>, uid: number, patch: Partial<PlacedSticker>) {
  setCard(c => ({ ...c, stickers: c.stickers.map(s => (s.uid === uid ? { ...s, ...patch } : s)) }));
}

/** The live, interactive card: drag stickers, resize/spin with the handle, pan the photo, tap text to edit. */
export function CardEditor({ card, setCard, photo, fontsLoaded, selectedUid, setSelectedUid, onTextTap, onStickerGrab }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drag = useRef<Drag | null>(null);
  const selRef = useRef(selectedUid); selRef.current = selectedUid;
  const imgTick = useImageLoadTick();

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (ctx) drawCard(ctx, card, photo, { selectedUid });
  }, [card, photo, selectedUid, fontsLoaded, imgTick]);

  // mouse wheel resizes the selected sticker (needs a non-passive listener)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const uid = selRef.current;
      if (uid == null) return;
      e.preventDefault();
      setCard(c => ({
        ...c,
        stickers: c.stickers.map(s => (s.uid === uid ? { ...s, scale: clamp(s.scale * (e.deltaY < 0 ? 1.06 : 0.94), 0.25, 4) } : s)),
      }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [setCard]);

  const toCard = (e: ReactPointerEvent): [number, number] => {
    const r = ref.current!.getBoundingClientRect();
    return [((e.clientX - r.left) * W) / r.width, ((e.clientY - r.top) * H) / r.height];
  };

  const onDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const [px, py] = toCard(e);
    e.currentTarget.setPointerCapture(e.pointerId);

    const sel = card.stickers.find(s => s.uid === selectedUid);
    if (sel) {
      const [hx, hy] = handlePos(sel);
      if (Math.hypot(px - hx, py - hy) < 36) {
        drag.current = { mode: "handle", uid: sel.uid, cx: sel.x, cy: sel.y, d0: Math.hypot(hx - sel.x, hy - sel.y), a0: Math.atan2(hy - sel.y, hx - sel.x), s0: sel.scale, r0: sel.rot };
        return;
      }
    }
    const i = hitSticker(card.stickers, px, py);
    if (i >= 0) {
      const st = card.stickers[i];
      setSelectedUid(st.uid);
      drag.current = { mode: "move", uid: st.uid, dx: px - st.x, dy: py - st.y };
      onStickerGrab();
      return;
    }
    setSelectedUid(null);
    const zone = textZone(px, py);
    if (zone) {
      // stop the follow-up mousedown from pulling focus back off the field we're about to focus
      e.preventDefault();
      onTextTap(zone);
      return;
    }
    if (photo && px > WIN.x && px < WIN.x + WIN.w && py > WIN.y && py < WIN.y + WIN.h) {
      const L = photoLayout(photo, card.zoom, card.ox, card.oy);
      drag.current = { mode: "pan", px, py, ox: L.ox, oy: L.oy };
    }
  };

  const onMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const [px, py] = toCard(e);
    const d = drag.current;
    if (!d) {
      e.currentTarget.style.cursor = hitSticker(card.stickers, px, py) >= 0 ? "move" : textZone(px, py) ? "text" : "grab";
      return;
    }
    if (d.mode === "move") {
      updateSticker(setCard, d.uid, { x: clamp(px - d.dx, 0, W), y: clamp(py - d.dy, 0, H) });
    } else if (d.mode === "handle") {
      const dist = Math.hypot(px - d.cx, py - d.cy), a = Math.atan2(py - d.cy, px - d.cx);
      updateSticker(setCard, d.uid, { scale: clamp((d.s0 * dist) / d.d0, 0.25, 4), rot: d.r0 + (a - d.a0) });
    } else if (photo) {
      const L = photoLayout(photo, card.zoom, d.ox + (px - d.px), d.oy + (py - d.py));
      setCard(c => ({ ...c, ox: L.ox, oy: L.oy }));
    }
  };

  const end = () => { drag.current = null; };

  return (
    <canvas
      id="card" ref={ref} width={W} height={H} aria-label="Your card"
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={end} onPointerCancel={end}
    />
  );
}
