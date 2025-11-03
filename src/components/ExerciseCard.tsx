import { SetRow } from "@/components/SetRow";
import type { ExerciseLog, SetKind, ExerciseType } from "@/app/types";

export function ExerciseCard({
  exercise, isCurrent, onSaveSet
}: {
  exercise: ExerciseLog; isCurrent: boolean;
  onSaveSet: (input: { kind: SetKind; order: number; weight?: number; reps: number; rir?: number }) => void;
}) {
  const total = exercise.totalSetsPlan;
  return (
    <div style={{
      padding: 12, borderRadius: 16,
      background: isCurrent ? "rgba(240,255,240,.8)" : "rgba(245,245,245,.8)",
      boxShadow: isCurrent ? "0 2px 8px rgba(0,0,0,.08)" : undefined
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <h3 style={{ margin: 0 }}>{exercise.name_snapshot}</h3>
        <span style={{ fontSize: 12, background: "#eee", padding: "2px 6px", borderRadius: 6 }}>
          {exercise.completedSets}/{total}
        </span>
      </div>
      <div style={{ color: "#666", fontSize: 13, marginBottom: 8 }}>{exercise.scheme_snapshot}</div>

      {Array.from({ length: total }).map((_, idx) => {
        const order = idx + 1;
        const kind: SetKind = idx === 0 && exercise.scheme_snapshot.toLowerCase().includes("top") ? "TOP" : "BOFF";
        const last = undefined as unknown as { weight?: number; reps: number } | undefined; // Integración real luego
        return (
          <div key={idx} style={{ marginBottom: 8 }}>
            <SetRow kind={kind} order={order} type={exerciseTypeFromName(exercise.name_snapshot)} last={last}
              onSave={onSaveSet} />
          </div>
        );
      })}
    </div>
  );
}

// Simplificación: deduce tipo por nombre (cámbialo por dato real)
function exerciseTypeFromName(_name: string): ExerciseType {
  return "barbell";
}
