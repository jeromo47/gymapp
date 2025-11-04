import { supabase } from "./supabase";
import type { RoutineTemplate } from "./routines";

/* =========================================================
   1️⃣  Guardado de sesiones y sets (ya lo tenías)
   ========================================================= */

type SaveSetInput = {
  session_id: string;
  session_date_iso: string;
  workout_name: string;
  exercise_id: string;
  exercise_name: string;
  set_kind: "TOP" | "BOFF" | "SET";
  set_order: number;
  weight: number | null;
  reps: number;
};

/** Guarda/actualiza la cabecera de sesión y luego registra el set */
export async function saveRemoteSet(input: SaveSetInput) {
  const { data: { user } } = await supabase.auth.getUser();
  const user_id = user?.id ?? null;

  // Upsert de sesión
  await supabase.from("sessions").upsert({
    session_id: input.session_id,
    user_id,
    date_iso: input.session_date_iso,
    workout_name: input.workout_name
  }, { onConflict: "session_id" });

  // Insert de set
  await supabase.from("set_logs").insert({
    session_id: input.session_id,
    exercise_id: input.exercise_id,
    exercise_name: input.exercise_name,
    set_kind: input.set_kind,
    set_order: input.set_order,
    weight: input.weight,
    reps: input.reps
  });
}

/* =========================================================
   2️⃣  Sincronización remota de rutinas (plantillas JSON)
   ========================================================= */

/**
 * Guarda/actualiza todas las plantillas de rutinas del usuario
 * en la tabla `routine_templates` (creada en Supabase).
 */
export async function upsertAllTemplatesRemote(list: RoutineTemplate[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return; // si no hay login, no hace nada

  const rows = list.map(t => ({
    user_id: user.id,
    name: t.name,
    payload: t // se guarda la rutina completa como JSON
  }));

  const { error } = await supabase
    .from("routine_templates")
    .upsert(rows, { onConflict: "user_id,name" });

  if (error) console.error("❌ upsertAllTemplatesRemote error:", error.message);
}

/**
 * Descarga todas las plantillas de rutinas del usuario actual
 * desde la tabla `routine_templates`.
 */
export async function fetchTemplatesRemote(): Promise<RoutineTemplate[] | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("routine_templates")
    .select("payload")
    .order("name", { ascending: true });

  if (error) {
    console.error("❌ fetchTemplatesRemote error:", error.message);
    return null;
  }

  return (data ?? []).map(row => row.payload as RoutineTemplate);
}
