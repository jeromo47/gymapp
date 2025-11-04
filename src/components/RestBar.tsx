// src/components/RestBar.tsx
import { useEffect, useRef, useState } from "react";
import { ensureNotifyPermission, notifyRestEnd, buzz } from "@/app/notify";

type Props = {
  seconds: number; // p.ej. 60
  isLastSetForExercise: boolean;
  onNext: () => void;          // pasar al siguiente ejercicio
  onRestFinished?: () => void; // callback opcional
};

const LKEY = "restbar_end_at_v1";

export function RestBar({ seconds, isLastSetForExercise, onNext, onRestFinished }: Props) {
  const [remaining, setRemaining] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(false);
  const endAtRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);

  // Arranca/actualiza desde almacenamiento si había un descanso activo
  useEffect(() => {
    const saved = localStorage.getItem(LKEY);
    if (saved) {
      const endAt = Number(saved);
      if (Number.isFinite(endAt) && endAt > Date.now()) {
        endAtRef.current = endAt;
        setRunning(true);
        setRemaining(Math.max(0, Math.ceil((endAt - Date.now()) / 1000)));
      } else {
        localStorage.removeItem(LKEY);
      }
    }
    // Permiso de notificaciones (best-effort)
    ensureNotifyPermission();
  }, []);

  // TICK por timestamp (resiliente a background/lock)
  useEffect(() => {
    if (!running) return;
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => {
      const endAt = endAtRef.current;
      if (!endAt) { setRunning(false); return; }
      const ms = endAt - Date.now();
      const sec = Math.max(0, Math.ceil(ms / 1000));
      setRemaining(sec);
      if (sec <= 0) {
        clearInterval(tickRef.current!);
        tickRef.current = null;
        endAtRef.current = null;
        localStorage.removeItem(LKEY);
        setRunning(false);

        // Señal (suena/vibra si el SO lo permite)
        buzz();
        notifyRestEnd();
        onRestFinished?.();

        // Si era el último set del ejercicio, permite pasar
        if (isLastSetForExercise) onNext();
      }
    }, 1000) as unknown as number;

    // Limpieza
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [running, isLastSetForExercise, onNext, onRestFinished]);

  // API pública: escucha el evento global "rest:start"
  useEffect(() => {
    const handler = (ev: Event) => {
      // detail: segundos (número) — si no, usa el por defecto del componente
      const s = (ev as CustomEvent<number>).detail || seconds;
      start(s);
    };
    window.addEventListener("rest:start", handler as EventListener);
    return () => window.removeEventListener("rest:start", handler as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  function start(s: number) {
    const endAt = Date.now() + s * 1000;
    endAtRef.current = endAt;
    localStorage.setItem(LKEY, String(endAt));
    setRemaining(s);
    setRunning(true);
  }

  function cancel() {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    endAtRef.current = null;
    localStorage.removeItem(LKEY);
    setRemaining(0);
    setRunning(false);
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="restbar card glass" style={{ position: "fixed", left: 16, right: 16, bottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div className="row" style={{ gap: 12, alignItems: "baseline" }}>
        <strong>Descanso</strong>
        <span className="badge">{mm}:{ss}</span>
      </div>
      <div className="row" style={{ gap: 8 }}>
        {running ? (
          <>
            {/* Reiniciar: útil si guardas una nueva serie antes de tiempo */}
            <button className="btn" onClick={() => start(seconds)}>Reiniciar</button>
            <button className="btn" onClick={cancel}>Cancelar</button>
          </>
        ) : (
          <button className="btn primary" onClick={() => start(seconds)}>Iniciar</button>
        )}
        {isLastSetForExercise && (
          <button className="btn" onClick={onNext}>Siguiente</button>
        )}
      </div>
    </div>
  );
}
