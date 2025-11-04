// src/app/notify.ts
export async function ensureNotifyPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const p = await Notification.requestPermission();
  return p === "granted";
}

export function buzz(pattern: number | number[] = [180, 90, 180]) {
  try {
    // Android soporta vibración; iOS no.
    if ("vibrate" in navigator) (navigator as any).vibrate(pattern);
  } catch {}
}

export function notifyRestEnd() {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  new Notification("¡Descanso terminado!", {
    body: "Siguiente serie lista.",
    // icon: "/icons/icon-192.png", // si quieres
    // badge: "/icons/icon-192.png",
    silent: false
  });
}
