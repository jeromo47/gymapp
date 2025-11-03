export type ExerciseType = "barbell" | "dumbbell" | "machine" | "cable" | "bw";
export type SetKind = "TOP" | "BOFF" | "SET" | "RP" | "DROP" | "APROX";

export interface SetDef { kind: SetKind; order: number; repMin: number; repMax: number; presetWeight?: number }
export interface Exercise {
  exercise_id: string;        // estable
  version: number;            // sube si cambias sets/kind/order
  name: string;
  type: ExerciseType;
  scheme: string;
  sets: SetDef[];
  archived?: boolean;
  created_at: string;
  updated_at: string;
}
export interface ExerciseRef { id: string; version: number }

export interface SetLog {
  kind: SetKind; order: number;
  reps: number; weightInput?: number; rir?: number; techOK?: boolean; note?: string;
}
export interface ExerciseLog {
  exercise_ref: ExerciseRef;
  name_snapshot: string;
  scheme_snapshot: string;
  sets_snapshot: SetDef[];   // para alinear “Últ + Δ”
  setLogs: SetLog[];
  completedSets: number;
  totalSetsPlan: number;
}
export interface Session {
  session_id: string;
  date: string;              // ISO
  workoutName: string;
  exerciseLogs: ExerciseLog[];
}
