import { useEffect, useMemo, useState } from "react";
import { RestBar } from "@/components/RestBar";
import { saveSession, getLastSetLike } from "@/app/history";
import type { Session, ExerciseLog, SetKind, SetDef } from "@/app/types";
import { rid } from "@/app/id";

function deep<T>(x:T):T { return JSON.parse(JSON.stringify(x)); }

export function Today() {
  const [session, setSession] = useState<Session>(() => seedSession());
  const [idx, setIdx] = useState(0);
  const [lastMap, setLastMap] = useState<Record<string, { weight?: number; reps: number }>>({});

  // precargar “Últ” del ejercicio actual
  useEffect(() => {
    const ex = session.exerciseLogs[idx];
    if (!ex) return;
    (async () => {
      const base = `${ex.exercise_ref.id}@${ex.exercise_ref.version}`;
      const pairs = await Promise.all(ex.sets_snapshot.map(async d => {
        const last = await getLastSetLike(ex.exercise_ref.id, ex.exercise_ref.version, d.kind, d.order, session.date);
        return [`${base}#${d.kind}:${d.order}`, last] as const;
      }));
      const m: any = {};
      for (const [k,v] of pairs) m[k] = v;
      setLastMap(o => ({ ...o, ...m }));
    })();
  }, [idx, session.exerciseLogs, session.date]);

  const current = session.exerciseLogs[idx];
  const isLastSet = useMemo(() => (current?.completedSets ?? 0) >= (current?.totalSetsPlan ?? 0), [current]);

  const onSaveSet = (input: { kind: SetKind; order: number; weight?: number; reps: number; rir?: number }) => {
    setSession(s => {
      const copy = deep(s);
      const ex = copy.exerciseLogs[idx];
      ex.setLogs.push({ kind: input.kind, order: input.order, reps: input.reps, weightInput: input.weight, rir: input.rir, techOK: true });
      ex.completedSets = Math.min(ex.completedSets + 1, ex.totalSetsPlan);
      return copy;
    });
    window.dispatchEvent(new CustomEvent("rest:start"));
  };

  useEffect(() => { saveSession(session); }, [session]);

  const goNext = () => setIdx(i => Math.min(i + 1, session.exerciseLogs.length - 1));

  return (
    <div>
      {session.exerciseLogs.map((ex, i) => (
        <ExerciseCard
          key={ex.exercise_ref.id}
          active={i===idx}
          ex={ex}
          getLast={(k,o)=>lastMap[`${ex.exercise_ref.id}@${ex.exercise_ref.version}#${k}:${o}`]}
          onSave={onSaveSet}
        />
      ))}
      <div className="footer-spacer" />
      <RestBar isLastSetForExercise={isLastSet} onNext={goNext} />
    </div>
  );
}

function ExerciseCard({
  ex, active, getLast, onSave
}:{
  ex: ExerciseLog;
  active: boolean;
  getLast: (k:SetKind,o:number)=>({weight?:number;reps:number}|undefined);
  onSave: (p:{kind:SetKind;order:number;weight?:number;reps:number;rir?:number})=>void;
}) {
  return (
    <div className="card glass exercise" style={{ boxShadow: active ? "0 8px 28px rgba(0,0,0,.35)" : undefined }}>
      <div className="row" style={{justifyContent:"space-between"}}>
        <div className="row"><h3 style={{margin:0}}>{ex.name_snapshot}</h3><span className="badge">{ex.completedSets}/{ex.totalSetsPlan}</span></div>
        <span className="muted">{ex.scheme_snapshot}</span>
      </div>

      <div style={{display:"grid", gap:8, marginTop:8}}>
        {ex.sets_snapshot.map((d, i) => (
          <SetRow key={i} def={d} last={getLast(d.kind, d.order)} onSave={(payload)=>onSave(payload)} />
        ))}
      </div>
    </div>
  );
}

function SetRow({
  def, last, onSave
}:{ def:SetDef; last?:{weight?:number;reps:number}; onSave:(p:{kind:SetKind;order:number;weight?:number;reps:number;rir?:number})=>void }) {
  const [w,setW] = useState<number>(last?.weight ?? (def.presetWeight ?? 0));
  const [r,setR] = useState<number>(last?.reps ?? def.repMin);
  const [rir,setRIR] = useState<number>(1);
  const delta = last ? { w: (w - (last.weight ?? 0)), r: (r - last.reps) } : undefined;

  const labelDelta = delta && (delta.w !== 0 || delta.r !== 0)
    ? <span className={`delta ${delta.w>0||delta.r>0?"up":"down"}`}>{(delta.w>0?"+":"")+delta.w}kg • {(delta.r>0?"+":"")+delta.r}rep</span>
    : null;

  return (
    <div className="card set">
      <div className="row" style={{justifyContent:"space-between"}}>
        <span className="badge">{def.kind}</span>
        <div className="row">
          {last && <span className="muted">Últ: {(last.weight ?? 0)}×{last.reps}</span>}
          {labelDelta}
        </div>
      </div>

      <div className="row" style={{marginTop:8}}>
        <Control label="kg">
          <button className="btn" onClick={()=>setW(prev=>Math.max(0,+(prev-1.25).toFixed(2)))}>−</button>
          <strong className="kpi" style={{width:68, textAlign:"center"}}>{w}</strong>
          <button className="btn" onClick={()=>setW(prev=>+(prev+1.25).toFixed(2))}>+</button>
        </Control>

        <Control label="Reps">
          <button className="btn" onClick={()=>setR(prev=>Math.max(1,prev-1))}>−</button>
          <strong className="kpi" style={{width:42, textAlign:"center"}}>{r}</strong>
          <button className="btn" onClick={()=>setR(prev=>prev+1)}>+</button>
        </Control>

        <Control label="RIR">
          <button className="btn" onClick={()=>setRIR(prev=>Math.max(0,prev-1))}>−</button>
          <strong className="kpi" style={{width:42, textAlign:"center"}}>{rir}</strong>
          <button className="btn" onClick={()=>setRIR(prev=>prev+1)}>+</button>
        </Control>

        <div style={{flex:1}} />
        <button className="btn primary" onClick={()=>onSave({kind:def.kind, order:def.order, weight:w, reps:r, rir})}>Guardar</button>
      </div>
    </div>
  );
}

function Control({ label, children }:{label:string; children:any}) {
  return (
    <div>
      <div className="muted" style={{fontSize:12}}>{label}</div>
      <div className="row">{children}</div>
    </div>
  );
}

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
