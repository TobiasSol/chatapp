// public/service-worker.js
self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open('chat-app-v1').then((cache) => {
        return cache.addAll([
          '/',
          '/admin',
          '/login',
          '/chat',
          '/icon.png',
          '/badge.png',
          '/manifest.json',
          // Weitere wichtige Assets
        ]);
      })
    );
  });
  
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== 'chat-app-v1') {
              return caches.delete(cacheName);
            }
          })
        );
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
    let notificationData = {};
    
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData = {
        title: 'Chat Benachrichtigung',
        message: event.data.text()
      };
    }
  
    const options = {
      body: notificationData.message || notificationData.body || 'Neue Nachricht',
      icon: '/icon.png',
      badge: '/badge.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '1',
        url: notificationData.url || '/'
      }
    };
  
    event.waitUntil(
      self.registration.showNotification(
        notificationData.title || 'Chat Benachrichtigung',
        options
      )
    );
  });
  
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
  
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      })
      .then((clientList) => {
        if (clientList.length > 0) {
          let client = clientList[0];
          for (let i = 0; i < clientList.length; i++) {
            if (clientList[i].focused) {
              client = clientList[i];
            }
          }
          return client.focus();
        }
        return clients.openWindow(event.notification.data.url || '/');
      })
    );
  });