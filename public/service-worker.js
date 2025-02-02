// public/service-worker.js
self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open('chat-app-v1').then((cache) => {
        return cache.addAll([
          '/',
          '/admin',
          '/login',
          '/chat',
          // Weitere wichtige Assets
        ]);
      })
    );
  });
  
  self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  });
  
  self.addEventListener('push', (event) => {
    const options = {
      body: event.data.text(),
      icon: '/icon.png',
      badge: '/badge.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '1'
      }
    };
  
    event.waitUntil(
      self.registration.showNotification('Chat Benachrichtigung', options)
    );
  });