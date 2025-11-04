// src/app/routines.ts
import type { SetDef as SetDefT, Session, ExerciseLog } from "@/app/types";
import { rid } from "@/app/id";
import { upsertAllTemplatesRemote, fetchTemplatesRemote } from "./remote";

/* =========================
   Tipos de plantillas
   ========================= */

export type SetKind = "TOP" | "BOFF" | "SET";

export type SetDef = SetDefT | {
  kind: SetKind;
  order: number;
  repMin: number;
  repMax: number;
  presetWeight?: number;
};

export type ExerciseTemplate = {
  id: string;            // identificador estable (slug)
  name: string;          // nombre visible
  scheme: string;        // ej: "1xTOP 6–9, 2xBOFF 12–15"
  sets: SetDef[];        // definición de sets para este ejercicio
};

export type RoutineTemplate = {
  name: string;                 // nombre de rutina (único por usuario)
  exercises: ExerciseTemplate[]; // lista de ejercicios
};

/* =========================
   Almacenamiento local
   ========================= */

const LKEY = "routine_templates_v1";

export function loadTemplatesLocal(): RoutineTemplate[] {
  try {
    const raw = localStorage.getItem(LKEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTemplatesLocal(list: RoutineTemplate[]) {
  localStorage.setItem(LKEY, JSON.stringify(list));
}

/* =========================
   Merge y normalización
   ========================= */

function normalizeSetDef(s: any, i: number): SetDef {
  // Normaliza claves y valores básicos
  const kind: SetKind = s.kind ?? s.type ?? "SET";
  const order: number = Number(s.order ?? i + 1);
  const repMin: number = Number(s.repMin ?? s.repsMin ?? s.min ?? 8);
  const repMax: number = Number(s.repMax ?? s.repsMax ?? s.max ?? 12);
  const presetWeight = s.presetWeight != null ? Number(s.presetWeight) : undefined;
  return { kind, order, repMin, repMax, presetWeight };
}

function normalizeExercise(e: any): ExerciseTemplate {
  const id = String(e.id ?? e.slug ?? e.name ?? "exercise").toLowerCase().replace(/\s+/g, "-");
  const name = String(e.name ?? e.title ?? id);
  const scheme = String(e.scheme ?? e.plan ?? "");
  const setsRaw = Array.isArray(e.sets) ? e.sets : [];
  const sets = setsRaw.map(normalizeSetDef);
  return { id, name, scheme, sets };
}

function normalizeTemplate(t: any): RoutineTemplate {
  const name = String(t.name ?? t.title ?? "Mi rutina");
  const exRaw = Array.isArray(t.exercises ?? t.ejercicios) ? (t.exercises ?? t.ejercicios) : [];
  const exercises = exRaw.map(normalizeExercise);
  return { name, exercises };
}

function mergeByName(a: RoutineTemplate[], b: RoutineTemplate[]): RoutineTemplate[] {
  const map = new Map<string, RoutineTemplate>();
  for (const t of a) map.set(t.name, t);
  for (const t of b) map.set(t.name, t); // b sobreescribe a en caso de duplicado
  return [...map.values()].sort((x, y) => x.name.localeCompare(y.name, "es"));
}

/* =========================
   Carga híbrida (local + remoto)
   ========================= */

/**
 * Carga plantillas desde local y, si hay sesión en Supabase,
 * hace fetch remoto y mergea, guardando el resultado de vuelta en local.
 *
 * Nota: devolvemos siempre algo (local como mínimo).
 */
export async function loadTemplates(): Promise<RoutineTemplate[]> {
  const local = loadTemplatesLocal();
  try {
    const remote = await fetchTemplatesRemote(); // null si no hay user
    if (!remote) return local;
    const merged = mergeByName(local, remote);
    saveTemplatesLocal(merged);
    return merged;
  } catch {
    return local;
  }
}

/** Si quieres llamarla explícitamente por claridad (alias) */
export const loadTemplatesHybrid = loadTemplates;

/* =========================
   Guardar (local + remoto)
   ========================= */

export async function saveTemplatesAll(list: RoutineTemplate[]) {
  saveTemplatesLocal(list);
  // No rompe si no hay usuario (la función remota hace early return)
  await upsertAllTemplatesRemote(list);
}

/* =========================
   Importar desde JSON (string)
   ========================= */

export function importTemplatesFromJSON(raw: string): RoutineTemplate[] {
  const data = JSON.parse(raw);
  const incoming: RoutineTemplate[] = Array.isArray(data)
    ? data.map(normalizeTemplate)
    : [normalizeTemplate(data)];

  const current = loadTemplatesLocal();
  const merged = mergeByName(current, incoming);

  // Guarda local + sube remoto (si hay sesión)
  void saveTemplatesAll(merged);

  return merged;
}

/* =========================
   Instanciar sesión desde plantilla
   ========================= */

export function routineToSession(t: RoutineTemplate): Session {
  const exerciseLogs: ExerciseLog[] = t.exercises.map((ex) => ({
    exercise_ref: { id: ex.id, version: 1 },
    name_snapshot: ex.name,
    scheme_snapshot: ex.scheme,
    sets_snapshot: ex.sets.map((s, idx) => normalizeSetDef(s, idx)),
    setLogs: [],
    completedSets: 0,
    totalSetsPlan: ex.sets.length
  }));

  return {
    session_id: rid(),
    date: new Date().toISOString(),
    workoutName: t.name,
    exerciseLogs
  };
}
