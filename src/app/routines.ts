// src/app/routines.ts
import { supabase } from "@/app/supabase";
import { rid } from "@/app/id";
import type { Session, ExerciseLog } from "@/app/types";

/* ─────────────────── Tipos ─────────────────── */
export type SetKind = "TOP" | "BOFF" | "SET";
export type SetDef = {
  kind: SetKind;
  order: number;
  repMin: number;
  repMax: number;
  presetWeight?: number;
};

export type ExerciseTemplate = {
  /** ID estable: NO debe cambiar al renombrar. */
  id: string;
  name: string;
  scheme: string;
  sets: SetDef[];
};

export type RoutineTemplate = {
  name: string;
  exercises: ExerciseTemplate[];
};

/* ──────────────── Local storage ─────────────── */
const LS_KEY = "routine_templates_v1";

export function loadTemplatesLocal(): RoutineTemplate[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveTemplatesLocal(list: RoutineTemplate[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

/* ──────────────── Remoto (Supabase) ─────────────── */
export async function fetchTemplatesRemote(): Promise<RoutineTemplate[] | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("routine_templates")
    .select("name,payload")
    .order("name", { ascending: true }); // estable si nombras "1. …, 2. …"

  if (error) {
    console.error("fetchTemplatesRemote:", error.message);
    return null;
  }
  return (data ?? []).map(r => r.payload as RoutineTemplate);
}

export async function upsertAllTemplatesRemote(list: RoutineTemplate[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const rows = list.map(t => ({
    user_id: user.id,
    name: t.name,
    payload: t
  }));

  const { error } = await supabase
    .from("routine_templates")
    .upsert(rows, { onConflict: "user_id,name" });

  if (error) console.error("upsertAllTemplatesRemote:", error.message);
}

export async function saveTemplatesAll(list: RoutineTemplate[]) {
  saveTemplatesLocal(list);
  try { await upsertAllTemplatesRemote(list); } catch {}
}

/* ───────────── Carga híbrida (prioriza remoto) ───────────── */
export async function loadTemplates(): Promise<RoutineTemplate[]> {
  const local = loadTemplatesLocal();
  try {
    const remote = await fetchTemplatesRemote();
    if (remote) {
      saveTemplatesLocal(remote); // sincroniza cache local
      return remote;
    }
    return local;
  } catch {
    return local;
  }
}

/* ───────────── Normalización con ID estable ───────────── */
export function normalizeTemplate(t: any): RoutineTemplate {
  const exs = Array.isArray(t?.exercises) ? t.exercises : [];
  const exercises: ExerciseTemplate[] = exs.map((e: any, i: number) => ({
    // Si falta id, se genera UNO SOLA VEZ (estable para esa plantilla)
    id: typeof e?.id === "string" && e.id.trim() ? e.id : (e?._id ?? crypto.randomUUID()),
    name: String(e?.name ?? `Ejercicio ${i + 1}`),
    scheme: String(e?.scheme ?? ""),
    sets: normalizeSets(e?.sets)
  }));

  return {
    name: String(t?.name ?? "Mi rutina"),
    exercises
  };
}

function normalizeSets(arr: any): SetDef[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((s: any, i: number) => {
    const kind: SetKind =
      s?.kind === "TOP" || s?.kind === "BOFF" || s?.kind === "SET" ? s.kind : "SET";
    const order = Number.isFinite(+s?.order) ? +s.order : i + 1;
    const repMin = Number.isFinite(+s?.repMin) ? +s.repMin : 8;
    const repMax = Number.isFinite(+s?.repMax) ? +s.repMax : Math.max(8, repMin);
    const presetWeight = Number.isFinite(+s?.presetWeight) ? +s.presetWeight : undefined;
    return { kind, order, repMin, repMax, presetWeight };
  });
}

/* ───────────── Importar JSON (con numeración opcional) ───────────── */
export function importTemplatesFromJSON(raw: string): RoutineTemplate[] {
  const data = JSON.parse(raw);
  const incoming: RoutineTemplate[] = Array.isArray(data)
    ? data.map(normalizeTemplate)
    : [normalizeTemplate(data)];

  // Si no están numeradas, numera según orden de llegada: "1. Nombre", "2. Nombre", ...
  const numbered = incoming.map((t, i) => {
    const already = /^\d+\.\s/.test(t.name);
    return already ? t : { ...t, name: `${i + 1}. ${t.name}` };
  });

  const current = loadTemplatesLocal();
  const merged = mergeByName(current, numbered); // respeta orden de inserción
  void saveTemplatesAll(merged);
  return merged;
}

/** Merge por nombre, sin ordenar alfabéticamente (conserva el orden de llegada). */
function mergeByName(a: RoutineTemplate[], b: RoutineTemplate[]): RoutineTemplate[] {
  const map = new Map<string, RoutineTemplate>();
  for (const t of a) if (!map.has(t.name)) map.set(t.name, t);
  for (const t of b) map.set(t.name, t);
  return Array.from(map.values());
}

/* ───────────── Conversión plantilla → sesión del día ───────────── */
export function routineToSession(t: RoutineTemplate): Session {
  const logs: ExerciseLog[] = t.exercises.map(ex => ({
    exercise_ref: { id: ex.id, version: 1 }, // ⟵ ID estable para enlazar histórico
    name_snapshot: ex.name,
    scheme_snapshot: ex.scheme,
    sets_snapshot: ex.sets,
    setLogs: [],
    completedSets: 0,
    totalSetsPlan: ex.sets.length
  }));

  return {
    session_id: rid(),
    date: new Date().toISOString(),
    workoutName: t.name,
    exerciseLogs: logs
  };
}
