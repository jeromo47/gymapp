import { useEffect, useRef, useState } from "react";

export function RestBar({
  seconds = 60,
  onRestFinished,
  isLastSetForExercise,
  onNext
}: {
  seconds?: number;
  onRestFinished: () => void;
  isLastSetForExercise: boolean;
  onNext: () => void;
}) {
  const [sec, setSec] = useState(0);
  const [running, setRunning] = useState(false);
  const t = useRef<number | null>(null);
  const total = seconds;

  // Escucha eventos globales para arrancar el descanso
  useEffect(() => {
    const h = (e: Event) => {
      const custom = e as CustomEvent<number | undefined>;
      start(custom.detail ?? total);
    };
    window.addEventListener("rest:start", h as any);
    return () => window.removeEventListener("rest:start", h as any);
  }, [total]);

  useEffect(() => () => { if (t.current) clearInterval(t.current); }, []);

  const start = (s: number) => {
    if (t.current) clearInterval(t.current);
    setSec(s); setRunning(true);
    t.current = window.setInterval(() => {
      setSec(prev => {
        if (prev <= 1) {
          clearInterval(t.current!);
          t.current = null;
          setRunning(false);
          onRestFinished();       // Notifica fin de descanso
          // Si era el último set del ejercicio, pasamos al siguiente
          if (isLastSetForExercise) {
            setTimeout(onNext, 800); // pequeño respiro visual
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  const pause = () => { if (t.current) clearInterval(t.current); setRunning(false); };
  const add30 = () => setSec(v => v + 30);

  const pct = Math.max(0, Math.min(100, ((total - sec) / total) * 100));

  return (
    <div className="restbar">
      <strong>⏱ {String(Math.floor(sec/60)).padStart(2,"0")}:{String(sec%60).padStart(2,"0")}</strong>
      <div className="progress"><span style={{ width: `${pct}%` }} /></div>
      <button className="btn" onClick={add30}>+30s</button>
      {!running
        ? <button className="btn" onClick={() => start(total)}>Iniciar</button>
        : <button className="btn" onClick={pause}>Pausar</button>}
      <div style={{ flex: 1 }} />
      {isLastSetForExercise && <button className="btn primary" onClick={onNext}>Siguiente →</button>}
    </div>
  );
}
