/**
 * Quantum OS - Background Web Push Service Worker (Faz 5.5)
 * Tarayıcı arka plandayken veya kapalıyken anlık bildirimleri yakalar ve görüntüler.
 */

self.addEventListener('push', function (event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || "Yeni bir premium ilan portföye eklendi!",
      icon: data.icon || "/logo.png",
      badge: "/logo.png",
      vibrate: [100, 50, 100],
      data: {
        url: data.url || "/"
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "Kaynak Gayrimenkul", options)
    );
  } catch (err) {
    console.error("Push Event Error:", err);
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      // Eğer site zaten açıksa oraya odaklan, yoksa yeni sekme aç
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
