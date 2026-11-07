import { useEffect, useState } from "react";

/** Bottom toast; `n` changes on every new message so repeats re-show it. */
export function Toast({ msg, n }: { msg: string; n: number }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!n) return;
    setOn(true);
    const t = setTimeout(() => setOn(false), 2600);
    return () => clearTimeout(t);
  }, [n]);
  return <div className={`toast${on ? " on" : ""}`} role="status" aria-live="polite">{msg}</div>;
}
