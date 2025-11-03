import { useEffect, useMemo, useRef, useState } from "react";
import { RestBar } from "@/components/RestBar";
import { saveSession, getLastSetLike } from "@/app/history";
import type { Session, ExerciseLog, SetKind, SetDef } from "@/app/types";
import { rid } from "@/app/id";

function deep<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }

export function Today() {
  const [session, setSession] = useState<Session>(() => seedSession());
  const [idx, setIdx] = useState(0);
  const [lastMap, setLastMap] = useState<Record<string, { weight?: number; reps: number }>>({});

  const current = session.exerciseLogs[idx];

  // Precarga "Últ" por set (id+ver+kind+order). Recalcula al cambiar de ejercicio o de serie.
  useEffect(() => {
    const ex = current; if (!ex) return;
    (async () => {
      const base = `${ex.exercise_ref.id}@${ex.exercise_ref.version}`;
      const pairs = await Promise.all(ex.sets_snapshot.map(async d => {
        const last = await getLastSetLike(
          ex.exercise_ref.id,
          ex.exercise_ref.version,
          d.kind,
          d.order,
          session.date
        );
        return [`${base}#${d.kind}:${d.order}`, last] as const;
      }));
      const m: Record<string, { weight?: number; reps: number } | undefined> = {};
      for (const [k, v] of pairs) m[k] = v;
      setLastMap(o => ({ ...o, ...m }));
    })();
  // 👇 añadimos completedSets para que refresque al pasar a la siguiente serie
  }, [idx, current?.exercise_ref.id, current?.exercise_ref.version, current?.completedSets, session.date]);

  // Siguiente set a realizar (solo uno visible)
  const nextDef: SetDef | undefined = useMemo(() => {
    if (!current) return undefined;
    if (current.completedSets >= current.totalSetsPlan) return undefined;
    return current.sets_snapshot[current.completedSets];
  }, [current]);

  const isLastSetForExercise = useMemo(() => {
    const ex = current;
    return (ex?.completedSets ?? 0) >= (ex?.totalSetsPlan ?? 0);
  }, [current]);

  // Persistencia local
  useEffect(() => { saveSession(session); }, [session]);

  // Avanzar a ejercicio siguiente
  const goNextExercise = () => setIdx(i => Math.min(i + 1, session.exerciseLogs.length - 1));

  const onRestFinished = () => {};

  const onSaveSet = (input: { kind: SetKind; order: number; weight?: number; reps: number; rir?: number }) => {
    setSession(s => {
      const copy = deep(s);
      const ex = copy.exerciseLogs[idx];
      ex.setLogs.push({ kind: input.kind, order: input.order, reps: input.reps, weightInput: input.weight, rir: input.rir, techOK: true });
      ex.completedSets = Math.min(ex.completedSets + 1, ex.totalSetsPlan);
      return copy;
    });
    // Dispara descanso global (60s)
    window.dispatchEvent(new CustomEvent("rest:start", { detail: 60 }));
  };

  return (
    <div>
      {session.exerciseLogs.map((ex, i) => (
        <ExerciseCard
          key={ex.exercise_ref.id}
          active={i === idx}
          ex={ex}
          getLast={(k, o) => lastMap[`${ex.exercise_ref.id}@${ex.exercise_ref.version}#${k}:${o}`]}
          onSave={onSaveSet}
          currentOnly
        />
      ))}

      <div className="footer-spacer" />
      <RestBar seconds={60} onRestFinished={onRestFinished} isLastSetForExercise={isLastSetForExercise} onNext={goNextExercise} />
    </div>
  );
}

/* ------- Tarjeta de ejercicio (solo 1 set visible si currentOnly=true) ------- */
function ExerciseCard({
  ex, active, getLast, onSave, currentOnly
}:{
  ex: ExerciseLog;
  active: boolean;
  currentOnly?: boolean;
  getLast: (k: SetKind, o: number) => ({ weight?: number; reps: number } | undefined);
  onSave: (p: { kind: SetKind; order: number; weight?: number; reps: number; rir?: number }) => void;
}) {
  const nextIndex = ex.completedSets;
  const nextSet = ex.sets_snapshot[nextIndex];

  return (
    <div className="card glass exercise" style={{ boxShadow: active ? "0 8px 28px rgba(0,0,0,.35)" : undefined, opacity: active ? 1 : .7 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <div className="row"><h3 style={{ margin: 0 }}>{ex.name_snapshot}</h3><span className="badge">{ex.completedSets}/{ex.totalSetsPlan}</span></div>
        <span className="muted" style={{ whiteSpace: "nowrap" }}>{ex.scheme_snapshot}</span>
      </div>

      <div style={{ marginTop: 8 }} className="set-shell">
        {currentOnly ? (
          nextSet ? (
            <SetRow
              key={`${ex.exercise_ref.id}-${ex.exercise_ref.version}-${nextSet.kind}-${nextSet.order}-${ex.completedSets}`} // fuerza remount al pasar de serie
              def={nextSet}
              last={getLast(nextSet.kind, nextSet.order)}
              onSave={onSave}
            />
          ) : (
            <div className="muted">✅ Ejercicio completado</div>
          )
        ) : (
          ex.sets_snapshot.map((d, i) => (
            <SetRow key={i} def={d} last={getLast(d.kind, d.order)} onSave={onSave} />
          ))
        )}
      </div>
    </div>
  );
}

/* ------- SetRow: cabecera “Último …”, filas Peso/Reps/RIR (- valor +), Guardar con ⏱ ------- */
function SetRow({
  def, last, onSave
}:{
  def: SetDef;
  last?: { weight?: number; reps: number };
  onSave: (p:{kind:SetKind;order:number;weight?:number;reps:number;rir?:number}) => void;
}) {
  // Valores iniciales = último si existe, si no, preset/repMin
  const [w, setW] = useState<number>(last?.weight ?? def.presetWeight ?? 0);
  const [r, setR] = useState<number>(last?.reps ?? def.repMin);
  const [rir, setRIR] = useState<number>(1);
  const [touched, setTouched] = useState(false);

  // Cooldown del botón Guardar
  const [cooldown, setCooldown] = useState<number>(0);
  const cdRef = useRef<number | null>(null);

  // Si llega el "último" después de montar y no has tocado, sincroniza
  useEffect(() => {
    if (!touched && last) {
      setW(last.weight ?? def.presetWeight ?? 0);
      setR(last.reps);
    }
  }, [last?.weight, last?.reps, touched, def.presetWeight]);

  useEffect(() => () => { if (cdRef.current) clearInterval(cdRef.current); }, []);

  const startCooldown = (s:number) => {
    if (cdRef.current) clearInterval(cdRef.current);
    setCooldown(s);
    cdRef.current = window.setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(cdRef.current!); cdRef.current = null; return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const disabled = cooldown > 0;

  const handleSave = () => {
    if (disabled) return;
    onSave({ kind: def.kind, order: def.order, weight: w, reps: r, rir });
    startCooldown(60);
    window.dispatchEvent(new CustomEvent("rest:start", { detail: 60 }));
  };

  return (
    <div className="card set" aria-busy={disabled ? "true" : "false"}>
      {/* Cabecera con “Último __ kg × __ rep” alineado al mockup */}
      <div className="set-header">
        <span className="badge">{def.kind}</span>
        <div className="set-badges">
          <span className="muted">
            Último {last ? `${last.weight ?? 0} kg × ${last.reps} rep` : `—`}
          </span>
        </div>
      </div>

      {/* Controles en vertical: etiqueta arriba, fila (- valor +) abajo */}
<div className="set-controls">
  {/* Peso (kg) */}
  <div className="control">
    <div className="label">Peso (kg)</div>
    <div className="row-mini">
      <button
        className="btn icon"
        onClick={() => { setTouched(true); setW(prev => Math.max(0, +(prev - 1.25).toFixed(2))); }}
        disabled={disabled}
      >−</button>
      <strong className="kpi">{w}</strong>
      <button
        className="btn icon"
        onClick={() => { setTouched(true); setW(prev => +(prev + 1.25).toFixed(2)); }}
        disabled={disabled}
      >+</button>
    </div>
  </div>

  {/* Repeticiones */}
  <div className="control">
    <div className="label">Reps</div>
    <div className="row-mini">
      <button
        className="btn icon"
        onClick={() => { setTouched(true); setR(prev => Math.max(1, prev - 1)); }}
        disabled={disabled}
      >−</button>
      <strong className="kpi">{r}</strong>
      <button
        className="btn icon"
        onClick={() => { setTouched(true); setR(prev => prev + 1); }}
        disabled={disabled}
      >+</button>
    </div>
  </div>

  {/* RIR */}
  <div className="control">
    <div className="label">RIR</div>
    <div className="row-mini">
      <button
        className="btn icon"
        onClick={() => { setTouched(true); setRIR(prev => Math.max(0, prev - 1)); }}
        disabled={disabled}
      >−</button>
      <strong className="kpi">{rir}</strong>
      <button
        className="btn icon"
        onClick={() => { setTouched(true); setRIR(prev => prev + 1); }}
        disabled={disabled}
      >+</button>
    </div>
  </div>

  {/* Guardar */}
  <button className="btn primary save" disabled={disabled} onClick={handleSave}>
    {disabled
      ? `⏱ ${String(Math.floor(cooldown / 60)).padStart(2, "0")}:${String(cooldown % 60).padStart(2, "0")}`
      : "Guardar"}
  </button>
</div>

    </div>
  );
}

/* ---------- Seed de ejemplo ---------- */
function seedSession(): Session {
  const make = (name:string, id:string, scheme:string, sets:SetDef[]): ExerciseLog => ({
    exercise_ref: { id, version: 1 },
    name_snapshot: name,
    scheme_snapshot: scheme,
    sets_snapshot: sets,
    setLogs: [],
    completedSets: 0,
    totalSetsPlan: sets.length
  });

  const ex1 = make("Press inclinado multipower", "press-inclinado", "1xTOP 6–9, 2xBOFF 12–15", [
    { kind:"TOP",  order:1, repMin:6,  repMax:9,  presetWeight:27.5 },
    { kind:"BOFF", order:2, repMin:12, repMax:15, presetWeight:22.5 },
    { kind:"BOFF", order:3, repMin:12, repMax:15, presetWeight:22.5 }
  ]);

  const ex2 = make("Press plano mancuernas", "press-mancuernas", "3xSET 10–15", [
    { kind:"SET", order:1, repMin:10, repMax:15, presetWeight:18 },
    { kind:"SET", order:2, repMin:10, repMax:15, presetWeight:18 },
    { kind:"SET", order:3, repMin:10, repMax:15, presetWeight:18 }
  ]);

  return { session_id: rid(), date: new Date().toISOString(), workoutName: "Push 1", exerciseLogs: [ex1, ex2] };
}
