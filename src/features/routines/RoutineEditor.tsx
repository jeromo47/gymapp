// src/features/routines/RoutineEditor.tsx
import { useEffect, useMemo, useState } from "react";
import type { RoutineTemplate, ExerciseTemplate, SetDef } from "@/app/routines";
import { loadTemplates, saveTemplatesAll } from "@/app/routines";

type Kind = "TOP" | "BOFF" | "SET";

export function RoutineEditor() {
  const [templates, setTemplates] = useState<RoutineTemplate[]>([]);
  const [name, setName] = useState<string>("");

  // cargar rutinas
  useEffect(() => {
    (async () => {
      const list = await loadTemplates();
      setTemplates(list);
      if (list[0]) setName(list[0].name);
    })();
  }, []);

  const current = useMemo(
    () => templates.find(t => t.name === name) ?? null,
    [templates, name]
  );

  const updateCurrent = (updater: (r: RoutineTemplate) => RoutineTemplate) => {
    setTemplates(prev => {
      const idx = prev.findIndex(t => t.name === name);
      if (idx < 0) return prev;
      const copy = [...prev];
      copy[idx] = updater(copy[idx]);
      void saveTemplatesAll(copy);
      return copy;
    });
  };

  const addRoutine = () => {
    const baseName = "Nueva rutina";
    let n = baseName;
    const names = new Set(templates.map(t => t.name));
    let i = 2;
    while (names.has(n)) { n = `${baseName} ${i++}`; }
    const newR: RoutineTemplate = { name: n, exercises: [] };
    const next = [...templates, newR];
    setTemplates(next);
    setName(n);
    void saveTemplatesAll(next);
  };

  const renameRoutine = (newName: string) => {
    if (!current) return;
    // cambiar solo el nombre manteniendo posición
    setTemplates(prev => {
      const idx = prev.findIndex(t => t.name === current.name);
      if (idx < 0) return prev;
      const copy = [...prev];
      copy[idx] = { ...copy[idx], name: newName };
      void saveTemplatesAll(copy);
      return copy;
    });
    setName(newName);
  };

  const deleteRoutine = () => {
    if (!current) return;
    const next = templates.filter(t => t.name !== current.name);
    setTemplates(next);
    setName(next[0]?.name ?? "");
    void saveTemplatesAll(next);
  };

  const addExercise = () => {
    if (!current) return;
    updateCurrent(r => ({
      ...r,
      exercises: [
        ...r.exercises,
        {
          id: crypto.randomUUID(), // ⟵ id estable (no depende del nombre)
          name: `Ejercicio ${r.exercises.length + 1}`,
          scheme: "3xSET 8–12",
          sets: [
            { kind: "SET", order: 1, repMin: 8, repMax: 12, presetWeight: 0 },
            { kind: "SET", order: 2, repMin: 8, repMax: 12, presetWeight: 0 },
            { kind: "SET", order: 3, repMin: 8, repMax: 12, presetWeight: 0 }
          ]
        }
      ]
    }));
  };

  const deleteExercise = (ex: ExerciseTemplate) => {
    if (!current) return;
    updateCurrent(r => ({
      ...r,
      exercises: r.exercises.filter(e => e !== ex)
    }));
  };

  const updateExercise = (ex: ExerciseTemplate, patch: Partial<ExerciseTemplate>) => {
    if (!current) return;
    updateCurrent(r => ({
      ...r,
      exercises: r.exercises.map(e => (e === ex ? { ...e, ...patch } : e))
    }));
  };

  const addSet = (ex: ExerciseTemplate) => {
    const nextOrder = (ex.sets[ex.sets.length - 1]?.order ?? 0) + 1;
    updateExercise(ex, {
      sets: [...ex.sets, { kind: "SET", order: nextOrder, repMin: 8, repMax: 12, presetWeight: 0 }]
    });
  };

  const deleteSet = (ex: ExerciseTemplate, idx: number) => {
    const sets = ex.sets.slice();
    sets.splice(idx, 1);
    // reordenar order
    sets.forEach((s, i) => (s.order = i + 1));
    updateExercise(ex, { sets });
  };

  const updateSet = (ex: ExerciseTemplate, idx: number, patch: Partial<SetDef>) => {
    const sets = ex.sets.slice();
    sets[idx] = { ...sets[idx], ...patch };
    updateExercise(ex, { sets });
  };

  return (
    <div className="container" style={{ paddingBottom: 120 }}>
      <header className="card glass" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div className="row" style={{ gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>Rutina</h2>
          <select
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              background: "rgba(255,255,255,.06)",
              color: "var(--text)",
              border: "1px solid var(--panel-border)",
              borderRadius: 10,
              padding: "8px 12px",
              fontSize: "1.2rem"
            }}
          >
            {templates.map(t => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>
          <button className="btn" onClick={addRoutine}>+ Nueva</button>
          {current && (
            <>
              <input
                value={current.name}
                onChange={(e) => renameRoutine(e.target.value)} // ⟵ NO cambia id
                className="input"
                style={{ minWidth: 220 }}
                placeholder="Nombre de la rutina"
              />
              <button className="btn" onClick={deleteRoutine}>🗑️ Borrar</button>
            </>
          )}
        </div>
      </header>

      {!current ? (
        <div className="card glass"><p className="muted">No hay rutina seleccionada.</p></div>
      ) : (
        <>
          <div className="card glass" style={{ marginBottom: 12 }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Ejercicios</h3>
              <button className="btn primary" onClick={addExercise}>+ Añadir ejercicio</button>
            </div>
          </div>

          {current.exercises.map((ex, ei) => (
            <div key={ex.id + "-" + ei} className="card glass" style={{ marginBottom: 12 }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                  <input
                    className="input"
                    value={ex.name}
                    onChange={(e) => updateExercise(ex, { name: e.target.value })} // ⟵ id NO se toca
                    placeholder="Nombre del ejercicio"
                    style={{ minWidth: 220 }}
                  />
                  <input
                    className="input"
                    value={ex.scheme}
                    onChange={(e) => updateExercise(ex, { scheme: e.target.value })}
                    placeholder="Esquema (ej. 1xTOP 6–9, 2xBOFF 12–15)"
                    style={{ minWidth: 280 }}
                  />
                </div>
                <button className="btn" onClick={() => deleteExercise(ex)}>🗑️</button>
              </div>

              <div style={{ marginTop: 8 }}>
                {ex.sets.map((s, si) => (
                  <div key={si} className="card set" style={{ marginBottom: 8 }}>
                    <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                        <select
                          className="input"
                          value={s.kind}
                          onChange={(e) => updateSet(ex, si, { kind: e.target.value as Kind })}
                        >
                          <option value="TOP">TOP</option>
                          <option value="BOFF">BOFF</option>
                          <option value="SET">SET</option>
                        </select>

                        <label className="input-label">Order
                          <input
                            className="input"
                            type="number"
                            value={s.order}
                            onChange={(e) => updateSet(ex, si, { order: clampInt(e.target.value, 1, 999) })}
                            style={{ width: 80 }}
                          />
                        </label>

                        <label className="input-label">Rep min
                          <input
                            className="input"
                            type="number"
                            value={s.repMin}
                            onChange={(e) => updateSet(ex, si, { repMin: clampInt(e.target.value, 1, 100) })}
                            style={{ width: 90 }}
                          />
                        </label>

                        <label className="input-label">Rep max
                          <input
                            className="input"
                            type="number"
                            value={s.repMax}
                            onChange={(e) => updateSet(ex, si, { repMax: clampInt(e.target.value, 1, 100) })}
                            style={{ width: 90 }}
                          />
                        </label>

                        <label className="input-label">Peso (kg)
                          <input
                            className="input"
                            type="number"
                            step="0.25"
                            value={s.presetWeight ?? 0}
                            onChange={(e) => updateSet(ex, si, { presetWeight: clampFloat(e.target.value, 0, 2000) })}
                            style={{ width: 120 }}
                          />
                        </label>
                      </div>

                      <button className="btn" onClick={() => deleteSet(ex, si)}>🗑️</button>
                    </div>
                  </div>
                ))}

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn" onClick={() => addSet(ex)}>+ Añadir serie</button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/* utils */
function clampInt(v: string, min: number, max: number) {
  const n = Math.max(min, Math.min(max, parseInt(v || "0", 10)));
  return Number.isFinite(n) ? n : min;
}
function clampFloat(v: string, min: number, max: number) {
  const n = Math.max(min, Math.min(max, parseFloat(v || "0")));
  return Number.isFinite(n) ? n : min;
}
