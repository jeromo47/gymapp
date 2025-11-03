import { rid } from "@/app/id";
import type { Session, ExerciseLog, SetDef } from "@/app/types";

export type RoutineTemplate = {
  name: string;
  exercises: Array<{
    id: string;
    name: string;
    scheme: string;
    sets: SetDef[];
  }>;
};

const LS_KEY = "gymapp.templates.v1";
export const defaultTemplates: RoutineTemplate[] = []; // si quieres, añade por defecto

export function loadTemplates(): RoutineTemplate[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [...defaultTemplates];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [...defaultTemplates];
  } catch { return [...defaultTemplates]; }
}
export function saveTemplates(list: RoutineTemplate[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}
export function importTemplatesFromJSON(raw: string): RoutineTemplate[] {
  const data = JSON.parse(raw);
  const list: RoutineTemplate[] = Array.isArray(data) ? data : [data];
  list.forEach(t => {
    if (typeof t.name !== "string") throw new Error("Plantilla sin nombre");
    if (!Array.isArray(t.exercises)) throw new Error("Plantilla sin ejercicios");
  });
  const existing = loadTemplates();
  const map = new Map<string, RoutineTemplate>();
  for (const t of existing) map.set(t.name, t);
  for (const t of list) map.set(t.name, t);
  const merged = [...map.values()];
  saveTemplates(merged);
  return merged;
}
export function routineToSession(t: RoutineTemplate, date = new Date()): Session {
  const exerciseLogs: ExerciseLog[] = t.exercises.map(e => ({
    exercise_ref: { id: e.id, version: 1 },
    name_snapshot: e.name,
    scheme_snapshot: e.scheme,
    sets_snapshot: e.sets,
    setLogs: [],
    completedSets: 0,
    totalSetsPlan: e.sets.length
  }));
  return {
    session_id: rid(),
    date: date.toISOString(),
    workoutName: t.name,
    exerciseLogs
  };
}
