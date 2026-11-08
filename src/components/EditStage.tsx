import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { STK, WIN, type CardState } from "../card/data";
import type { TextField } from "../card/drawCard";
import { saveCard } from "../lib/save";
import { CardEditor } from "./CardEditor";
import { CardChip } from "./common";
import { DetailsPanel, FramePanel, PhotoPanel, StickersPanel } from "./panels";

type Tab = "details" | "frame" | "stickers" | "photo";
const TABS: [Tab, string][] = [["details", "Details"], ["frame", "Frame"], ["stickers", "Stickers"], ["photo", "Photo"]];

let nextUid = 1;

interface Props {
  card: CardState;
  setCard: Dispatch<SetStateAction<CardState>>;
  photo: HTMLImageElement | null;
  fontsLoaded: boolean;
  toast: (msg: string) => void;
  onChangePhoto: () => void;
  onRetake: () => void;
  onNewPull: () => void;
}

export function EditStage({ card, setCard, photo, fontsLoaded, toast, onChangePhoto, onRetake, onNewPull }: Props) {
  const [tab, setTab] = useState<Tab>("details");
  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const [stickerColor, setStickerColor] = useState<string | null>(null);
  const [focusReq, setFocusReq] = useState<{ field: TextField; n: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const removeSelected = () => {
    if (selectedUid == null) return;
    setCard(c => ({ ...c, stickers: c.stickers.filter(s => s.uid !== selectedUid) }));
    setSelectedUid(null);
  };

  // Delete/Backspace removes the selected sticker; Escape deselects
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (selectedUid == null) return;
      const tag = (document.activeElement as HTMLElement | null)?.tagName ?? "";
      if (/INPUT|TEXTAREA/.test(tag)) return;
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); removeSelected(); }
      if (e.key === "Escape") setSelectedUid(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const addSticker = (id: string) => {
    const d = STK[id];
    const uid = nextUid++;
    setCard(c => ({
      ...c,
      stickers: [...c.stickers, {
        uid, id,
        x: WIN.x + WIN.w * (0.25 + Math.random() * 0.5),
        y: WIN.y + WIN.h * (0.2 + Math.random() * 0.6),
        rot: (Math.random() - 0.5) * 0.5,
        scale: d.kind === "shape" || d.kind === "emoji" || d.kind === "image" ? 0.9 : 1,
        color: d.kind === "emoji" || d.kind === "image" ? null : stickerColor,
      }],
    }));
    setSelectedUid(uid);
  };

  const onSave = async () => {
    setSaving(true);
    toast(await saveCard(card, photo));
    setSaving(false);
  };

  return (
    <section className="stage">
      <div className="bar">
        <button className="btn ghost sm" onClick={onChangePhoto}>‹ Change photo</button>
        <h2>Decorate your card</h2>
        <CardChip card={card} />
      </div>
      <div className="edit">
        <div className="cardwrap">
          <CardEditor
            card={card} setCard={setCard} photo={photo} fontsLoaded={fontsLoaded}
            selectedUid={selectedUid} setSelectedUid={setSelectedUid}
            onTextTap={field => { setTab("details"); setFocusReq(r => ({ field, n: (r?.n ?? 0) + 1 })); }}
            onStickerGrab={() => setTab("stickers")}
          />
          <p className="hint">
            Tap the name, stats or caption on the card to edit them. Tap a sticker to add it. Drag stickers to move them,
            drag the yellow dot to resize and spin. Drag your photo inside the window to reposition it.
          </p>
        </div>

        <aside className="panel">
          <div className="tabs" role="tablist">
            {TABS.map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>

          {tab === "details" && <DetailsPanel card={card} setCard={setCard} focusReq={focusReq} />}
          {tab === "frame" && <FramePanel card={card} setCard={setCard} />}
          {tab === "stickers" && (
            <StickersPanel
              card={card} setCard={setCard} fontsLoaded={fontsLoaded}
              color={stickerColor} setColor={setStickerColor}
              selectedUid={selectedUid} setSelectedUid={setSelectedUid}
              onAdd={addSticker} onRemove={removeSelected} nextUid={() => nextUid++}
            />
          )}
          {tab === "photo" && <PhotoPanel card={card} setCard={setCard} onChangePhoto={onChangePhoto} />}

          <div className="actions">
            <button className="btn" onClick={() => void onSave()} disabled={saving}>⬇ Save card (PNG)</button>
            <div className="row">
              <button className="btn ghost sm" onClick={onRetake}>Retake photos</button>
              <button className="btn ghost sm" onClick={onNewPull}>New pull</button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
