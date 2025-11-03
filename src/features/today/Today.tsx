import { useState } from "react";
import { RestBar } from "@/components/RestBar";
import { rid } from "@/app/id";

export function Today() {
  const [exercise, setExercise] = useState({ name: "Press Banca", series: 3, done: 0 });

  const saveSet = () => {
    setExercise(e => ({ ...e, done: Math.min(e.done + 1, e.series) }));
    window.dispatchEvent(new CustomEvent("rest:start"));
  };

  return (
    <div className="card glass" style={{ paddingBottom: 90 }}>
      <h3>{exercise.name}</h3>
      <p className="muted">{exercise.done}/{exercise.series} series completadas</p>
      <button className="btn primary" onClick={saveSet}>Guardar serie</button>
      <RestBar isLastSetForExercise={exercise.done>=exercise.series} onNext={()=>alert("Siguiente ejercicio")} />
    </div>
  );
}
