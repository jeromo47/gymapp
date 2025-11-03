import { useEffect, useState } from "react";
import { db } from "@/app/db"; // ya creado antes
import type { Session } from "@/app/types";

export function History() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    (async () => {
      const all = await db.sessions.orderBy("date").reverse().toArray();
      setSessions(all);
    })();
  }, []);

  if (!sessions.length)
    return <div className="card glass"><h3>Historial</h3><p className="muted">Aún no hay sesiones guardadas.</p></div>;

  return (
    <div className="card glass">
      <h3 style={{marginTop:0}}>Historial</h3>
      <div style={{display:"grid", gap:12}}>
        {sessions.map(s => (
          <div key={s.session_id} className="card set">
            <div className="row" style={{justifyContent:"space-between"}}>
              <strong>{new Date(s.date).toLocaleString()}</strong>
              <span className="badge">{s.workoutName}</span>
            </div>
            <div className="muted" style={{marginTop:6}}>
              {kpiLine(s)}
            </div>
          </div>
        ))}
      </div>
      <div className="footer-spacer" />
    </div>
  );
}

function kpiLine(s: Session) {
  const totalSets = s.exerciseLogs.reduce((a,e)=>a+e.setLogs.length,0);
  const totalVol = s.exerciseLogs.reduce((a,e)=>a+e.setLogs.reduce((x,sl)=>x+(sl.weightInput??0)*(sl.reps??0),0),0);
  return `Series: ${totalSets} • Volumen: ${Math.round(totalVol)} kg`;
}
