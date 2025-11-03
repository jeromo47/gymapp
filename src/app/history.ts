import { db } from "@/app/db";
import type { Session, SetKind } from "@/app/types";

export async function saveSession(s: Session) {
  await db.sessions.put(s);
}

export async function getLastSetLike(
  id: string,
  version: number,
  kind: SetKind,
  order: number,
  before: string
) {
  const sessions = await db.sessions.orderBy("date").filter(x => x.date < before).reverse().toArray();
  for (const sess of sessions) {
    const ex = sess.exerciseLogs.find(e => e.exercise_ref.id === id && e.exercise_ref.version === version);
    if (!ex) continue;
    const set = ex.setLogs.find(s => s.kind === kind && s.order === order);
    if (set) return { weight: set.weightInput, reps: set.reps };
  }
  return undefined;
}
