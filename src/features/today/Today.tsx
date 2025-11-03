import { useEffect, useMemo, useRef, useState } from "react";
import { RestBar } from "@/components/RestBar";
import { saveSession, getLastSetLike } from "@/app/history";
import { loadTemplates, importTemplatesFromJSON, routineToSession, RoutineTemplate } from "@/app/routines";
import type { Session, ExerciseLog, SetKind, SetDef } from "@/app/types";
import { rid } from "@/app/id";
import { recommendNextLoad, type SetTarget } from "@/app/progression";
import { saveRemoteSet } from "@/app/remote";

/* Deep clone helper */
function deep<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }

export function Today() {
  const [templates, setTemplates] = useState<RoutineTemplate[]>(() => loadTemplates());
  const [routineName, setRoutineName] = useState<string>(() => templates[0]?.name ?? "Mi rutina");

  const [session, setSession] = useState<Session>(() => {
    if (templates[0]) return routineToSession(templates[0]);
    return seedSession();
  });

  const [idx, setIdx] = useState(0);
  const [lastMap, setLastMap] = useState<Record<string, { weight?: number; reps: number }>>({});
  const importRef = useRef<HTMLInputElement | null>(null);

  // Regenerar sesión al cambiar rutina
  useEffect(() => {
    const t = templates.find(x => x.name === routineName);
    if (t) { setSession(routineToSession(t)); setIdx(0); }
  }, [routineName]);

  const current = session.exerciseLogs[idx];

  // Precargar "Último" por set
  useEffect(() => {
    const ex = current; if (!ex) return;
    (async () => {
      const base = `${ex.exercise_ref.id}@${ex.exercise_ref.version}`;
      const pairs = await Promise.all(ex.sets_snapshot.map(async d => {
        const last = await getLastSetLike(
          ex.exercise_ref.id, ex.exercise_ref.version, d.kind, d.order, session.date
        );
        return [`${base}#${d.kind}:${d.order}`, last] as const;
      }));
      const m: Record<string, { weight?: number; reps: number } | undefined> = {};
      for (const [k, v] of pairs) m[k] = v;
      setLastMap(o => ({ ...o, ...m }));
    })();
  }, [idx, current?.exercise_ref.id, current?.exercise_ref.version, current?.completedSets, session.date]);

  const isLastSetForExercise = useMemo(() => {
    const ex = current;
    return (ex?.completedSets ?? 0) >= (ex?.totalSetsPlan ?? 0);
  }, [current]);

  useEffect(() => { saveSession(session); }, [session]);

  const goNextExercise = () => setIdx(i => Math.min(i + 1, session.exerciseLogs.length - 1));
  const onRestFinished = () => {};

  const onSaveSet = (input: { kind: SetKind; order: number; weight?: number; reps: number }) => {
    setSession(s => {
      const copy = deep(s);
      const ex = copy.exerciseLogs[idx];
      ex.setLogs.push({ kind: input.kind, order: input.order, reps: input.reps, weightInput: input.weight, techOK: true });
      ex.completedSets = Math.min(ex.completedSets + 1, ex.totalSetsPlan);
      saveSession(copy);
      void saveRemoteSet({
        session_id: copy.session_id,
        session_date_iso: copy.date,
        workout_name: copy.workoutName,
        exercise_id: ex.exercise_ref.id,
        exercise_name: ex.name_snapshot,
        set_kind: input.kind,
        set_order: input.order,
        weight: input.weight ?? null,
        reps: input.reps
      });
      return copy;
    });
    window.dispatchEvent(new CustomEvent("rest:start", { detail: 60 }));
  };

  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" });

  return (
    <div>
      {/* HEADER */}
      <header className="card glass header-rel" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>Hoy</h2>
          <span className="badge">{todayLabel}</span>
          <select
            value={routineName}
            onChange={(e) => setRoutineName(e.target.value)}
            style={{
              background: "rgba(255,255,255,.06)",
              color: "var(--text)",
              border: "1px solid var(--panel-border)",
              borderRadius: 10,
              padding: "8px 12px",
              fontSize: "1.6rem"   // ⟵ tamaño de texto aumentado
            }}
          >
            {templates.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
          </select>
        </div>

        {/* Botón de importar JSON (icono pequeño) */}
        <label className="btn stealth-btn" title="Importar rutinas (JSON)" style={{ padding: "6px 10px", gap: 6 }}>
          <span aria-hidden style={{ fontSize: 18, lineHeight: 1 }}>⤓</span>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={async () => {
              const file = importRef.current?.files?.[0];
              if (!file) return;
              try {
                const raw = await file.text();
                const merged = importTemplatesFromJSON(raw);
                setTemplates(merged);
                if (!merged.find(x => x.name === routineName) && merged[0]) setRoutineName(merged[0].name);
              } catch (err: any) {
                alert("Error importando: " + (err?.message ?? String(err)));
              } finally {
                if (importRef.current) importRef.current.value = "";
              }
            }}
          />
        </label>
      </header>

      {/* Ejercicios */}
      {session.exerciseLogs.map((ex, i) => {
        const topOfToday =
          ex.setLogs.filter(s => s.kind === "TOP" && typeof s.weightInput === "number")
            .slice(-1)[0]?.weightInput ?? undefined;

        return (
          <ExerciseCard
            key={ex.exercise_ref.id}
            active={i === idx}
            ex={ex}
            getLast={(k, o) => lastMap[`${ex.exercise_ref.id}@${ex.exercise_ref.version}#${k}:${o}`]}
            onSave={onSaveSet}
            currentOnly
            topOfToday={topOfToday}
          />
        );
      })}

      <div className="footer-spacer" />

      <RestBar seconds={60} onRestFinished={onRestFinished} isLastSetForExercise={isLastSetForExercise} onNext={goNextExercise} />
    </div>
  );
}

/* ---------- CARD DE EJERCICIO ---------- */
function ExerciseCard({
  ex, active, getLast, onSave, currentOnly, topOfToday
}: {
  ex: ExerciseLog;
  active: boolean;
  currentOnly?: boolean;
  topOfToday?: number;
  getLast: (k: SetKind, o: number) => ({ weight?: number; reps: number } | undefined);
  onSave: (p: { kind: SetKind; order: number; weight?: number; reps: number }) => void;
}) {
  const nextIndex = ex.completedSets;
  const nextSet = ex.sets_snapshot[nextIndex];

  return (
    <div className="card glass exercise" style={{ boxShadow: active ? "0 8px 28px rgba(0,0,0,.35)" : undefined, opacity: active ? 1 : 0.7 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <div className="row">
          <h3 style={{ margin: 0 }}>{ex.name_snapshot}</h3>
          <span className="badge">{ex.completedSets}/{ex.totalSetsPlan}</span>
        </div>
        <span className="muted" style={{ whiteSpace: "nowrap" }}>{ex.scheme_snapshot}</span>
      </div>

      <div style={{ marginTop: 8 }} className="set-shell">
        {currentOnly ? (
          nextSet ? (
            <SetRow
              key={`${ex.exercise_ref.id}-${nextSet.kind}-${nextSet.order}-${ex.completedSets}`}
              def={nextSet}
              last={getLast(nextSet.kind, nextSet.order)}
              onSave={onSave}
              exerciseName={ex.name_snapshot}
              topOfToday={topOfToday}
            />
          ) : (
            <div className="muted">✅ Ejercicio completado</div>
          )
        ) : (
          ex.sets_snapshot.map((d, i) => (
            <SetRow
              key={i}
              def={d}
              last={getLast(d.kind, d.order)}
              onSave={onSave}
              exerciseName={ex.name_snapshot}
              topOfToday={topOfToday}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ---------- SET ROW ---------- */
function SetRow({
  def, last, onSave, exerciseName, topOfToday
}: {
  def: SetDef;
  last?: { weight?: number; reps: number };
  onSave: (p: { kind: SetKind; order: number; weight?: number; reps: number }) => void;
  exerciseName: string;
  topOfToday?: number;
}) {
  const [w, setW] = useState<number>(last?.weight ?? def.presetWeight ?? 0);
  const [r, setR] = useState<number>(last?.reps ?? def.repMin);
  const [touched, setTouched] = useState(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const cdRef = useRef<number | null>(null);

  useEffect(() => () => { if (cdRef.current) clearInterval(cdRef.current); }, []);
  const startCooldown = (s: number) => {
    if (cdRef.current) clearInterval(cdRef.current);
    setCooldown(s);
    cdRef.current = window.setInterval(() => {
      setCooldown(prev => { if (prev <= 1) { clearInterval(cdRef.current!); cdRef.current = null; return 0; } return prev - 1; });
    }, 1000);
  };

  useEffect(() => {
    if (!touched) {
      const liftCategory = /sentadilla|muerto|press|remo|dominadas|barra|multipower/i.test(exerciseName) ? "compound" : "isolation";
      const target: SetTarget = { repMin: def.repMin, repMax: def.repMax, kind: def.kind, liftCategory };
      const rec = recommendNextLoad(target, last, def.presetWeight, topOfToday);
      setW(rec.suggestedWeight);
      setR(last?.reps ?? def.repMin);
    }
  }, [def.kind, def.repMin, def.repMax, exerciseName, last?.weight, last?.reps, def.presetWeight, topOfToday, touched]);

  const disabled = cooldown > 0;
  const liftCategory = /sentadilla|muerto|press|remo|dominadas|barra|multipower/i.test(exerciseName)
    ? "compound" : "isolation";
  const target: SetTarget = { repMin: def.repMin, repMax: def.repMax, kind: def.kind, liftCategory };
  const rec = recommendNextLoad(target, last, def.presetWeight, topOfToday);

  const handleSave = () => {
    if (disabled) return;
    onSave({ kind: def.kind, order: def.order, weight: w, reps: r });
    startCooldown(60);
    window.dispatchEvent(new CustomEvent("rest:start", { detail: 60 }));
  };

  return (
    <div className="card set" aria-busy={disabled ? "true" : "false"}>
      <div className="set-header">
        <span className="badge">{def.kind}</span>
        <div className="set-badges">
          <span className="muted">
            Último {last ? `${last.weight ?? 0} kg × ${last.reps} rep` : "—"}
          </span>
        </div>
      </div>

      <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
        <span className="badge">
          {rec.action === "UP" ? "↑" : rec.action === "DOWN" ? "↓" : "＝"} {rec.suggestedWeight} kg
        </span>
        <small className="muted">{rec.objective}</small>
        <button className="btn" style={{ padding: "6px 10px" }} onClick={() => setW(rec.suggestedWeight)} disabled={disabled}>
          Aplicar
        </button>
      </div>

      <div className="set-controls">
        <div className="control">
          <div className="label">Peso (kg)</div>
          <div className="row-mini">
            <button className="btn icon" onClick={() => { setTouched(true); setW(prev => Math.max(0, +(prev - 1.25).toFixed(2))); }} disabled={disabled}>−</button>
            <strong className="kpi">{w}</strong>
            <button className="btn icon" onClick={() => { setTouched(true); setW(prev => +(prev + 1.25).toFixed(2)); }} disabled={disabled}>+</button>
          </div>
        </div>

        <div className="control">
          <div className="label">Reps</div>
          <div className="row-mini">
            <button className="btn icon" onClick={() => { setTouched(true); setR(prev => Math.max(1, prev - 1)); }} disabled={disabled}>−</button>
            <strong className="kpi">{r}</strong>
            <button className="btn icon" onClick={() => { setTouched(true); setR(prev => prev + 1); }} disabled={disabled}>+</button>
          </div>
        </div>

        <button className="btn primary save" disabled={disabled} onClick={handleSave}>
          {disabled
            ? `⏱ ${String(Math.floor(cooldown / 60)).padStart(2, "0")}:${String(cooldown % 60).padStart(2, "0")}`
            : "Guardar"}
        </button>
      </div>
    </div>
  );
}

/* ---------- SEED POR DEFECTO ---------- */
function seedSession(): Session {
  const make = (name: string, id: string, scheme: string, sets: SetDef[]): ExerciseLog => ({
    exercise_ref: { id, version: 1 },
    name_snapshot: name,
    scheme_snapshot: scheme,
    sets_snapshot: sets,
    setLogs: [],
    completedSets: 0,
    totalSetsPlan: sets.length
  });

  const ex1 = make("Press inclinado multipower", "press-inclinado", "1xTOP 6–9, 2xBOFF 12–15", [
    { kind: "TOP", order: 1, repMin: 6, repMax: 9, presetWeight: 27.5 },
    { kind: "BOFF", order: 2, repMin: 12, repMax: 15, presetWeight: 22.5 },
    { kind: "BOFF", order: 3, repMin: 12, repMax: 15, presetWeight: 22.5 }
  ]);

  const ex2 = make("Press plano mancuernas", "press-mancuernas", "3xSET 10–15", [
    { kind: "SET", order: 1, repMin: 10, repMax: 15, presetWeight: 18 },
    { kind: "SET", order: 2, repMin: 10, repMax: 15, presetWeight: 18 },
    { kind: "SET", order: 3, repMin: 10, repMax: 15, presetWeight: 18 }
  ]);

  return {
    session_id: rid(),
    date: new Date().toISOString(),
    workoutName: "Push 1",
    exerciseLogs: [ex1, ex2]
  };
}
