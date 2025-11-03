import { useEffect, useRef, useState } from "react";

export function RestBar({ isLastSetForExercise, onNext }: { isLastSetForExercise: boolean; onNext: () => void }) {
  const [sec, setSec] = useState(60);
  const [running, setRunning] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const h = () => start(60);
    window.addEventListener("rest:start", h);
    return () => window.removeEventListener("rest:start", h);
  }, []);

  const start = (s: number) => {
    if (timer.current) clearInterval(timer.current);
    setSec(s); setRunning(true);
    timer.current = window.setInterval(() => {
      setSec(prev => {
        if (prev <= 1) { clearInterval(timer.current!); setRunning(false); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const pause = () => { if (timer.current) clearInterval(timer.current); setRunning(false); };
  const add30 = () => setSec(v => v + 30);

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "rgba(10,15,20,0.9)", borderTop: "1px solid rgba(255,255,255,0.1)",
      display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", backdropFilter: "blur(8px)"
    }}>
      <strong>⏱ {String(Math.floor(sec/60)).padStart(2,"0")}:{String(sec%60).padStart(2,"0")}</strong>
      <button className="btn" onClick={add30}>+30s</button>
      {!running ? <button className="btn" onClick={()=>start(60)}>Iniciar</button> : <button className="btn" onClick={pause}>Pausar</button>}
      <div style={{flex:1}} />
      {isLastSetForExercise && <button className="btn primary" onClick={onNext}>Siguiente →</button>}
    </div>
  );
}
