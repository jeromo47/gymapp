import { SetRow } from "@/components/SetRow";
import type { ExerciseLog, SetKind } from "@/app/types";

export function ExerciseCard({
  exercise, isCurrent,
  getLast,
  onSaveSet
}: {
  exercise: ExerciseLog; isCurrent: boolean;
  getLast: (kind: SetKind, order: number) => ({ weight?: number; reps: number } | undefined);
  onSaveSet: (input: { kind: SetKind; order: number; weight?: number; reps: number; rir?: number }) => void;
}) {
  const total = exercise.totalSetsPlan;
  return (
    <div style={{ padding: 12, borderRadius: 16, background: isCurrent ? "rgba(240,255,240,.8)" : "rgba(245,245,245,.8)", boxShadow: isCurrent ? "0 2px 8px rgba(0,0,0,.08)" : undefined }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <h3 style={{ margin: 0 }}>{exercise.name_snapshot}</h3>
        <span style={{ fontSize: 12, background: "#eee", padding: "2px 6px", borderRadius: 6 }}>
          {exercise.completedSets}/{total}
        </span>
      </div>
      <div style={{ color: "#666", fontSize: 13, marginBottom: 8 }}>{exercise.scheme_snapshot}</div>

      {exercise.sets_snapshot.map((def, idx) => {
        const order = def.order;
        const kind = def.kind;
        const last = getLast(kind, order);
        return (
          <div key={idx} style={{ marginBottom: 8 }}>
            <SetRow kind={kind} order={order} type={inferType(exercise)} last={last} onSave={onSaveSet} />
          </div>
        );
      })}
    </div>
  );
}

function inferType(_ex: ExerciseLog) { return "barbell" as const; } // TODO: añade el tipo real en tus datos
