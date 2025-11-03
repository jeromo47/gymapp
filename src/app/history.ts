// src/app/history.ts
import { db } from "@/app/db";
import type { Session, ExerciseLog, SetLog, SetKind } from "@/app/types";

export async function saveSession(s: Session) {
  await db.sessions.put(s);
}

export async function getLastSetLike(
  exerciseId: string,
  version: number,
  kind: SetKind,
  order: number,
  beforeISO: string // fecha actual
): Promise<{ weight?: number; reps: number } | undefined> {
  // Busca sesiones anteriores por fecha descendente y devuelve el primer match exacto
  const sessions = await db.sessions
    .orderBy("date")
    .filter((x) => x.date < beforeISO)
    .reverse()
    .toArray();

  for (const sess of sessions) {
    const ex = sess.exerciseLogs.find(
      (e) => e.exercise_ref.id === exerciseId && e.exercise_ref.version === version
    );
    if (!ex) continue;
    // Busca el set log con mismo kind+order
    const set = ex.setLogs
      .slice()
      .reverse()
      .find((sl) => sl.kind === kind && sl.order === order);
    if (set) return { weight: set.weightInput, reps: set.reps };
  }
  return undefined;
}
