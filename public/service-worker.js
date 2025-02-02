// public/service-worker.js
self.addEventListener('push', function(event) {
    const options = {
      body: event.data.text(),
      icon: '/icon.png',
      badge: '/badge.png',
      vibrate: [100, 50, 100]
    };
  
    event.waitUntil(
      self.registration.showNotification('Chat Nachricht', options)
    );
  });