import { useEffect, useRef, useState } from "react";

export function RestBar({
  isLastSetForExercise,
  onNext
}: { isLastSetForExercise: boolean; onNext: () => void }) {
  const [sec, setSec] = useState(60);
  const [running, setRunning] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current) }, []);

  const start = (s = sec) => {
    if (timer.current) window.clearInterval(timer.current);
    setSec(s); setRunning(true);
    timer.current = window.setInterval(() => setSec((v) => {
      if (v <= 1) { stop(); return 0; }
      return v - 1;
    }), 1000);
  };
  const stop = () => { setRunning(false); if (timer.current) window.clearInterval(timer.current); };
  const add30 = () => setSec((v) => v + 30);

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: 12,
      display: "flex", gap: 12, alignItems: "center",
      background: "rgba(240,240,240,.9)", borderTop: "1px solid #ddd" }}>
      <strong>⏱ {String(Math.floor(sec/60)).padStart(2,"0")}:{String(sec%60).padStart(2,"0")}</strong>
      <button onClick={() => add30()}>+30s</button>
      {!running ? <button onClick={() => start(60)}>Iniciar</button> : <button onClick={stop}>Pausar</button>}
      <div style={{ flex: 1 }} />
      {isLastSetForExercise && <button onClick={onNext} style={{ fontWeight: 700 }}>Siguiente →</button>}
    </div>
  );
}
