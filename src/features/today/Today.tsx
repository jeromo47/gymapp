import { useMemo, useState } from "react";
import { ExerciseCard } from "@/components/ExerciseCard";
import { RestBar } from "@/components/RestBar";
import type { ExerciseLog, Session, SetKind } from "@/app/types";

function seedSession(): Session {
  const pressInclinado: ExerciseLog = {
    exercise_ref: { id: "press-inclinado", version: 1 },
    name_snapshot: "Press inclinado multipower",
    scheme_snapshot: "1xTOP 6–9, 2xBOFF 12–15",
    sets_snapshot: [
      { kind: "TOP", order: 1, repMin: 6, repMax: 9, presetWeight: 27.5 },
      { kind: "BOFF", order: 2, repMin: 12, repMax: 15, presetWeight: 22.5 },
      { kind: "BOFF", order: 3, repMin: 12, repMax: 15, presetWeight: 22.5 }
    ],
    setLogs: [],
    completedSets: 0,
    totalSetsPlan: 3
  };
  const pressMan: ExerciseLog = {
    exercise_ref: { id: "press-mancuernas", version: 1 },
    name_snapshot: "Press plano mancuernas",
    scheme_snapshot: "3xSET 10–15",
    sets_snapshot: [
      { kind: "SET", order: 1, repMin: 10, repMax: 15, presetWeight: 18 },
      { kind: "SET", order: 2, repMin: 10, repMax: 15, presetWeight: 18 },
      { kind: "SET", order: 3, repMin: 10, repMax: 15, presetWeight: 18 }
    ],
    setLogs: [],
    completedSets: 0,
    totalSetsPlan: 3
  };
  return {
    session_id: crypto.randomUUID(),
    date: new Date().toISOString(),
    workoutName: "Push 1",
    exerciseLogs: [pressInclinado, pressMan]
  };
}

export function Today() {
  const [session, setSession] = useState<Session>(() => seedSession());
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  const isLastSetForExercise = useMemo(() => {
    const ex = session.exerciseLogs[currentExerciseIndex];
    return ex.completedSets >= ex.totalSetsPlan;
  }, [session, currentExerciseIndex]);

  const onSaveSet = (input: { kind: SetKind; order: number; weight?: number; reps: number; rir?: number }) => {
    setSession((s) => {
      const copy = structuredClone(s);
      const ex = copy.exerciseLogs[currentExerciseIndex];
      ex.setLogs.push({ kind: input.kind, order: input.order, reps: input.reps, weightInput: input.weight, rir: input.rir, techOK: true });
      ex.completedSets = Math.min(ex.completedSets + 1, ex.totalSetsPlan);
      return copy;
    });
    // Aquí podrías activar un estado global para que la RestBar inicie el temporizador automáticamente.
  };

  const goNext = () => {
    setCurrentExerciseIndex((i) => Math.min(i + 1, session.exerciseLogs.length - 1));
  };

  return (
    <div style={{ paddingBottom: 96 }}>
      {session.exerciseLogs.map((ex, idx) => (
        <div key={idx} style={{ marginBottom: 12 }}>
          <ExerciseCard exercise={ex} isCurrent={idx === currentExerciseIndex} onSaveSet={onSaveSet} />
        </div>
      ))}
      <RestBar isLastSetForExercise={isLastSetForExercise} onNext={goNext} />
    </div>
  );
}
