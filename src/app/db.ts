import Dexie, { Table } from "dexie";
import { Exercise, Session } from "./types";

export class GymDB extends Dexie {
  exercises!: Table<Exercise, [string, number]>; // pk compuesta: [exercise_id, version]
  sessions!: Table<Session, string>;
  constructor() {
    super("gymdb");
    this.version(1).stores({
      exercises: "[exercise_id+version], exercise_id, version, name",
      sessions: "&session_id, date"
    });
  }
}
export const db = new GymDB();
