// Service Worker para notificações em segundo plano da Agenda Digital
// Mantém notificações ativas mesmo com a aba minimizada ou em background.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Recebe mensagem do app para exibir notificação
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SHOW_NOTIFICATION") {
    const { title, body, tag, url } = data.payload || {};
    self.registration.showNotification(title || "Agenda Digital", {
      body: body || "",
      tag: tag || "agenda-evento",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      requireInteraction: false,
      data: { url: url || "/" },
    });
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ("focus" in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
