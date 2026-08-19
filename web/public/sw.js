self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "KonkosYuk", {
      body: data.message || "Anda memiliki notifikasi baru.",
      icon: data.icon || "/logo.png",
      data: { url: data.url || "/notifications" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(
    event.notification.data?.url || "/notifications",
    self.location.origin,
  ).href;
  event.waitUntil(clients.openWindow(url));
});
