import type { Shot } from "../App";

interface Props {
  shots: Shot[];
  pickedId: number | null;
  setPickedId: (id: number) => void;
  onBack: () => void;
  onUse: (id: number | null) => void;
}

export function PickStage({ shots, pickedId, setPickedId, onBack, onUse }: Props) {
  return (
    <section className="stage">
      <div className="bar">
        <button className="btn ghost sm" onClick={onBack}>‹ Booth</button>
        <h2>Pick your shot</h2>
        <button className="btn pink sm" onClick={() => onUse(pickedId)} disabled={pickedId == null}>Put it on my card ›</button>
      </div>
      <div className="pick">
        {shots.map((s, i) => (
          <button
            key={s.id}
            aria-label={`Shot ${i + 1}`}
            aria-pressed={s.id === pickedId}
            onClick={() => setPickedId(s.id)}
            onDoubleClick={() => onUse(s.id)}
          >
            <img src={s.url} alt="" />
          </button>
        ))}
      </div>
    </section>
  );
}
