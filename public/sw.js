self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}
  const title = data.title || "Descanso terminado";
  const body  = data.body  || "Siguiente serie lista.";
  const options = {
    body,
    // badge: "/icons/icon-192.png",
    // icon: "/icons/icon-192.png",
    // Android puede respetar vibración:
    vibrate: [150, 70, 150]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
