// src/app/history.ts
import { supabase } from "@/app/supabase";
import type { Session } from "@/app/types";

/* ─────────────────── Historial local ─────────────────── */
const LS_HISTORY = "history_sessions_v1";

/** Carga todas las sesiones guardadas localmente. */
function loadSessionsLocal(): Session[] {
  try {
    const raw = localStorage.getItem(LS_HISTORY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** Guarda/actualiza una sesión en el historial local (upsert por session_id). */
export function saveSession(s: Session): void {
  const list = loadSessionsLocal();
  const idx = list.findIndex(x => x.session_id === s.session_id);
  if (idx >= 0) list[idx] = s;
  else list.push(s);
  localStorage.setItem(LS_HISTORY, JSON.stringify(list));
}

/* ───────────────── Último set similar (Supabase) ───────────────── */

/**
 * Devuelve el último set ANTERIOR a la fecha indicada para un ejercicio/kind/order.
 * Busca primero por exercise_id (correcto) y, si no hay nada, usa fallback por nombre
 * para rescatar histórico antiguo cuando el id cambió en algún momento.
 */
export async function getLastSetLike(
  exercise_id: string,
  _version: number, // reservado por si versionas ejercicios más adelante
  kind: "TOP" | "BOFF" | "SET",
  order: number,
  session_date_iso: string
): Promise<{ weight?: number; reps: number } | undefined> {
  // 1) Búsqueda principal por ID estable
  let { data, error } = await supabase
    .from("set_logs")
    .select("weight,reps,created_at,exercise_name")
    .eq("exercise_id", exercise_id)
    .eq("set_kind", kind)
    .eq("set_order", order)
    .lt("created_at", session_date_iso)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("getLastSetLike by ID:", error.message);
  }

  // 2) Fallback por nombre (para datos antiguos con id cambiado)
  if (!data || !data[0]) {
    // Heurística: convertir ids tipo "press-inclinado" → "%press%inclinado%"
    const nameHint = exercise_id.replace(/[-_]+/g, " ").trim();
    const pattern = `%${nameHint}%`;

    const { data: alt, error: err2 } = await supabase
      .from("set_logs")
      .select("weight,reps,created_at")
      .eq("set_kind", kind)
      .eq("set_order", order)
      .lt("created_at", session_date_iso)
      .ilike("exercise_name", pattern)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!err2 && alt && alt[0]) data = alt;
  }

  if (!data || !data[0]) return undefined;
  return {
    weight: data[0].weight ?? undefined,
    reps: data[0].reps
  };
}
