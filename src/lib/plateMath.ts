export const barWeight = 20;
const disks = [25, 20, 15, 10, 5, 2.5, 1.25];

export function platePresentation(type: string, input?: number) {
  if (input == null) return { total: 0, perSide: "" };
  if (type === "barbell") {
    const total = barWeight + 2 * input;
    const per = (total - barWeight) / 2;
    return { total, perSide: breakdown(per) };
  }
  if (type === "dumbbell") return { total: 2 * input, perSide: "" };
  return { total: input, perSide: "" };
}
function breakdown(perSide: number) {
  let r = perSide, parts: string[] = [];
  for (const d of disks) {
    let c = 0;
    while (r + 1e-6 >= d) { r -= d; c++; }
    if (c) parts.push(`${c}×${d}`);
  }
  return parts.join(" · ") + " kg/lado";
}
