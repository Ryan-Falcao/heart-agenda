// Service worker para Web Push (chamado pelo navegador quando chega push do servidor)
// Mantém também handler para mensagens locais (compatibilidade com notification-sw.js)

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = { title: "Agenda Digital", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Agenda Digital";
  const options = {
    body: data.body || "",
    tag: data.tag || "agenda",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: { url: data.url || "/" },
    vibrate: [120, 60, 120],
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SHOW_NOTIFICATION") {
    const { title, body, tag, url } = data.payload || {};
    self.registration.showNotification(title || "Agenda Digital", {
      body: body || "",
      tag: tag || "agenda-evento",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
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
        if ("focus" in c) {
          c.focus();
          if ("navigate" in c) c.navigate(url);
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
