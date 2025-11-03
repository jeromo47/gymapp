import { supabase } from "./supabase";

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
  // Asegura usuario (si usas login Google con Supabase Auth, esto devuelve el user)
  const { data: { user } } = await supabase.auth.getUser();
  const user_id = user?.id ?? null; // si no hay login activo, guarda igual (opcional: abortar)

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
