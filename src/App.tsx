import { useCallback, useEffect, useState } from "react";
import { initialCard, type CardState } from "./card/data";
import { fontsReady } from "./lib/fonts";
import { PullStage } from "./components/PullStage";
import { BoothStage } from "./components/BoothStage";
import { PickStage } from "./components/PickStage";
import { EditStage } from "./components/EditStage";
import { Toast } from "./components/Toast";

export type Stage = "pull" | "booth" | "pick" | "edit";
export interface Shot { id: number; url: string; img: HTMLImageElement }

let nextShotId = 1;

export default function App() {
  const [stage, setStage] = useState<Stage>("pull");
  const [card, setCard] = useState<CardState>(initialCard);
  const [shots, setShots] = useState<Shot[]>([]);
  const [pickedId, setPickedId] = useState<number | null>(null);
  const [photoId, setPhotoId] = useState<number | null>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [toast, setToast] = useState({ msg: "", n: 0 });

  useEffect(() => { void fontsReady.then(() => setFontsLoaded(true)); }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [stage]);

  const showToast = useCallback((msg: string) => setToast(t => ({ msg, n: t.n + 1 })), []);

  const addShot = useCallback((url: string) => {
    const img = new Image();
    img.onload = () => setShots(s => [...s, { id: nextShotId++, url, img }]);
    img.src = url;
  }, []);
  const removeShot = useCallback((id: number) => {
    setShots(s => s.filter(x => x.id !== id));
    setPickedId(p => (p === id ? null : p));
  }, []);

  const photo = shots.find(s => s.id === photoId)?.img ?? null;

  const usePicked = (id: number | null) => {
    if (id == null) return;
    setPickedId(id);
    setPhotoId(id);
    setCard(c => ({ ...c, zoom: 1, ox: 0, oy: 0 }));
    setStage("edit");
  };

  const newPull = () => {
    setCard(c => ({ ...initialCard(), name: c.name, brand: c.brand, studio: c.studio, lab1: c.lab1, lab2: c.lab2 }));
    setShots([]); setPickedId(null); setPhotoId(null);
    setStage("pull");
  };

  return (
    <>
      {stage === "pull" && (
        <PullStage card={card} setCard={setCard} fontsLoaded={fontsLoaded} onStart={() => setStage("booth")} />
      )}
      {stage === "booth" && (
        <BoothStage
          card={card} shots={shots} addShot={addShot} removeShot={removeShot}
          onBack={() => setStage("pull")}
          onDone={() => { setPickedId(p => p ?? shots[shots.length - 1]?.id ?? null); setStage("pick"); }}
        />
      )}
      {stage === "pick" && (
        <PickStage
          shots={shots} pickedId={pickedId} setPickedId={setPickedId}
          onBack={() => setStage("booth")} onUse={usePicked}
        />
      )}
      {stage === "edit" && (
        <EditStage
          card={card} setCard={setCard} photo={photo} fontsLoaded={fontsLoaded} toast={showToast}
          onChangePhoto={() => { setPickedId(photoId); setStage("pick"); }}
          onRetake={() => setStage("booth")}
          onNewPull={newPull}
        />
      )}
      <Toast msg={toast.msg} n={toast.n} />
    </>
  );
}
