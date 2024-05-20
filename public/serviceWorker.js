/**
 * This is our service worker for push notifications
 */

self.addEventListener("install", (event) => {
  console.log("Service Worker installing.");
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating.");
});

self.addEventListener("push", (event) => {
  console.log("Push received.");

  let notificationData = {};

  if (event.data) {
    notificationData = event.data.json();
  }

  const title = notificationData.title || "Default Title";
  const options = {
    body: notificationData.body || "Default body",
    icon: notificationData.icon || "default-icon.png",
    badge: notificationData.badge || "default-badge.png",
    data: notificationData.data || {},
    actions: notificationData.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  console.log("Notification click received.");
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});

self.addEventListener("notificationclose", (event) => {
  console.log("Notification was closed.", event.notification);
});
