// src/features/today/Today.tsx
import { useEffect, useMemo, useState } from "react";
import { ExerciseCard } from "@/components/ExerciseCard";
import { RestBar } from "@/components/RestBar";
import type { ExerciseLog, Session, SetKind } from "@/app/types";
import { saveSession, getLastSetLike } from "@/app/history";

function seedSession(): Session { /* igual que tenías */ }

export function Today() {
  const [session, setSession] = useState<Session>(() => seedSession());
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [lastMap, setLastMap] = useState<Record<string, { weight?: number; reps: number }>>({});

  // precarga “Últimas” para el ejercicio actual (todas sus series)
  useEffect(() => {
    const ex = session.exerciseLogs[currentExerciseIndex];
    if (!ex) return;
    (async () => {
      const keyBase = `${ex.exercise_ref.id}@${ex.exercise_ref.version}`;
      const entries = await Promise.all(
        ex.sets_snapshot.map(async (def) => {
          const last = await getLastSetLike(
            ex.exercise_ref.id,
            ex.exercise_ref.version,
            def.kind,
            def.order,
            session.date
          );
          return [`${keyBase}#${def.kind}:${def.order}`, last] as const;
        })
      );
      const obj: Record<string, { weight?: number; reps: number } | undefined> = {};
      for (const [k, v] of entries) obj[k] = v;
      setLastMap((m) => ({ ...m, ...obj }));
    })();
  }, [currentExerciseIndex, session.exerciseLogs, session.date]);

  const isLastSetForExercise = useMemo(() => {
    const ex = session.exerciseLogs[currentExerciseIndex];
    return ex?.completedSets >= ex?.totalSetsPlan;
  }, [session, currentExerciseIndex]);

  const onSaveSet = async (input: { kind: SetKind; order: number; weight?: number; reps: number; rir?: number }) => {
    setSession((s) => {
      const copy = structuredClone(s);
      const ex = copy.exerciseLogs[currentExerciseIndex];
      ex.setLogs.push({
        kind: input.kind,
        order: input.order,
        reps: input.reps,
        weightInput: input.weight,
        rir: input.rir,
        techOK: true
      });
      ex.completedSets = Math.min(ex.completedSets + 1, ex.totalSetsPlan);
      return copy;
    });
  };

  // persiste toda la sesión cada vez que cambia (simple y fiable)
  useEffect(() => { saveSession(session); }, [session]);

  const goNext = () => {
    setCurrentExerciseIndex((i) => Math.min(i + 1, session.exerciseLogs.length - 1));
  };

  return (
    <div style={{ paddingBottom: 96 }}>
      {session.exerciseLogs.map((ex, idx) => (
        <div key={idx} style={{ marginBottom: 12 }}>
          <ExerciseCard
            exercise={ex}
            isCurrent={idx === currentExerciseIndex}
            getLast={(kind, order) => lastMap[`${ex.exercise_ref.id}@${ex.exercise_ref.version}#${kind}:${order}`]}
            onSaveSet={onSaveSet}
          />
        </div>
      ))}
      <RestBar isLastSetForExercise={isLastSetForExercise} onNext={goNext} />
    </div>
  );
}
