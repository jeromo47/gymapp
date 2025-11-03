import { useState } from "react";
import { platePresentation } from "@/lib/plateMath";
import type { SetKind, ExerciseType } from "@/app/types";

export function SetRow({
  kind, order, type, last, onSave
}: {
  kind: SetKind; order: number; type: ExerciseType;
  last?: { weight?: number; reps: number };
  onSave: (input: { kind: SetKind; order: number; weight?: number; reps: number; rir?: number }) => void;
}) {
  const [weight, setWeight] = useState<number>(last?.weight ?? 0);
  const [reps, setReps] = useState<number>(last?.reps ?? 8);
  const [rir, setRir] = useState<number>(1);

  const pres = platePresentation(type, weight);
  const delta = last ? {
    w: (weight ?? 0) - (last.weight ?? 0),
    r: reps - last.reps
  } : undefined;

  const step = type === "barbell" ? 1.25 : (type === "dumbbell" ? 2 : 2);

  return (
    <div style={{ padding: 8, borderRadius: 8, background: "#f7f7f7" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 12, background: "#eee", padding: "2px 6px", borderRadius: 6 }}>{kind}</span>
        <div style={{ flex: 1 }} />
        {last && <span style={{ fontSize: 12, color: "#666" }}>Últ: {(last.weight ?? 0)}×{last.reps}</span>}
        {delta && (delta.w !== 0 || delta.r !== 0) && (
          <span style={{
            fontSize: 12, color: "white",
            background: (delta.w > 0 || delta.r > 0) ? "green" : "red",
            padding: "2px 6px", borderRadius: 6
          }}>
            {(delta.w>0?"+":"") + delta.w + "kg"} • {(delta.r>0?"+":"") + delta.r + "rep"}
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Field label={type === "barbell" ? "kg/lado" : type === "dumbbell" ? "kg/manc" : "kg"}>
          <button onClick={() => setWeight((w) => Math.max(0, (w ?? 0) - step))}>−</button>
          <span style={{ width: 48, textAlign: "center" }}>{weight ?? 0}</span>
          <button onClick={() => setWeight((w) => (w ?? 0) + step)}>+</button>
        </Field>

        <Field label="Reps">
          <button onClick={() => setReps((r) => Math.max(1, r - 1))}>−</button>
          <span style={{ width: 36, textAlign: "center" }}>{reps}</span>
          <button onClick={() => setReps((r) => r + 1)}>+</button>
        </Field>

        <Field label="RIR">
          <button onClick={() => setRir((r) => Math.max(0, r - 1))}>−</button>
          <span style={{ width: 36, textAlign: "center" }}>{rir}</span>
          <button onClick={() => setRir((r) => r + 1)}>+</button>
        </Field>

        <div style={{ flex: 1 }} />
        <button onClick={() => onSave({ kind, order, weight, reps, rir })}>✔</button>
      </div>

      <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
        Total: {pres.total.toFixed(1)} kg {pres.perSide && `— ${pres.perSide}`}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: any }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "#666" }}>{label}</div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>{children}</div>
    </div>
  );
}
