export type LiftCategory = "compound" | "isolation";

export type SetTarget = {
  repMin: number;
  repMax: number;
  kind: "TOP" | "BOFF" | "SET";
  liftCategory: LiftCategory;   // define por ejercicio
};

export type LastResult = {
  weight?: number;   // último de ESTA misma serie (kind+order)
  reps?: number;     // reps conseguidas
};

export type Recommendation = {
  action: "UP" | "HOLD" | "DOWN";
  suggestedWeight: number;   // kg propuestos
  deltaKg: number;
  reason: string;
  objective: string;
};

function roundToPlate(x: number, step = 1.25) {
  const r = Math.round(x / step) * step;
  return Math.max(0, +r.toFixed(2));
}

function pct(base: number, p: number) {
  return base * (1 + p / 100);
}

function stepFor(cat: LiftCategory) {
  return cat === "compound" ? 2.5 : 1.25;
}

/** Sugerencia sin RIR: solo en base a reps dentro/fuera del rango y último peso */
export function recommendNextLoad(
  target: SetTarget,
  last: LastResult | undefined,
  presetWeight?: number,
  sessionTopWeight?: number    // para BOFF: % del TOP de hoy
): Recommendation {
  const { repMin, repMax, kind, liftCategory } = target;
  const baseStep = stepFor(liftCategory);

  // Caso BOFF: si tenemos TOP del día, aplicar % fijo (92% por defecto)
  if (kind === "BOFF" && sessionTopWeight && sessionTopWeight > 0) {
    const raw = sessionTopWeight * 0.92;
    const w = roundToPlate(raw, 1.25);
    const ref = last?.weight ?? presetWeight ?? 0;
    const delta = +(w - ref).toFixed(2);
    return {
      action: delta > 0 ? "UP" : delta < 0 ? "DOWN" : "HOLD",
      suggestedWeight: w,
      deltaKg: delta,
      reason: "Backoff = 92% del TOP de hoy",
      objective: "objetivo: consolidar backoff"
    };
  }

  // Sin histórico: usar preset
  if (!last?.reps || !last?.weight) {
    const ref = presetWeight ?? 0;
    const w = roundToPlate(ref, 1.25);
    return {
      action: "HOLD",
      suggestedWeight: w,
      deltaKg: +(w - ref).toFixed(2),
      reason: "Sin histórico; usar preset",
      objective: `objetivo: entrar en ${repMin}–${repMax} reps`
    };
  }

  const reps = last.reps;
  const ref = last.weight;

  if (reps >= repMax) {
    // sube microcarga (más agresivo en compuestos)
    const raw = liftCategory === "compound" ? pct(ref, 2.5) : pct(ref, 1.25);
    const w = roundToPlate(raw, 1.25);
    return { action: "UP", suggestedWeight: w, deltaKg: +(w - ref).toFixed(2), reason: `Alcanzaste ≥${repMax} reps`, objective: "objetivo: subir microcarga" };
  }

  if (reps < repMin) {
    // baja un poco para entrar en rango
    const raw = liftCategory === "compound" ? pct(ref, -2.5) : pct(ref, -1.25);
    const w = roundToPlate(raw, 1.25);
    return { action: "DOWN", suggestedWeight: w, deltaKg: +(w - ref).toFixed(2), reason: `No alcanzaste ${repMin} reps`, objective: "objetivo: bajar para entrar en rango" };
  }

  // Dentro de rango, pero no en el máximo: mantén y busca +1 rep
  return {
    action: "HOLD",
    suggestedWeight: ref,
    deltaKg: 0,
    reason: `Dentro de ${repMin}–${repMax}`,
    objective: "objetivo: mantener y +1 rep"
  };
}
