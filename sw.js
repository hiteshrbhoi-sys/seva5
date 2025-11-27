// sw.js - Service Worker for Push Notifications
const CACHE_NAME = 'seva-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker: Installed');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Clearing old cache');
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

// 🔔 PUSH NOTIFICATION HANDLER - WhatsApp-style
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received:', event);
  
 let notificationData = {
    title: 'Seva',
    body: 'You have a new notification',
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'%3E%3Crect fill='%23FF6B3D' width='192' height='192' rx='48'/%3E%3Ctext x='96' y='130' font-size='100' text-anchor='middle' fill='white'%3E❤️%3C/text%3E%3C/svg%3E",
    badge: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 72'%3E%3Ccircle fill='%23FF6B3D' cx='36' cy='36' r='36'/%3E%3Ctext x='36' y='50' font-size='40' text-anchor='middle' fill='white'%3E❤️%3C/text%3E%3C/svg%3E",
    tag: 'seva-notification',
    requireInteraction: true,
    data: { url: '/' }
  };
  if (event.data) {
    try {
      const data = event.data.json();
   notificationData = {
        title: data.title || 'Seva',
        body: data.body || 'New notification',
        icon: data.icon || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'%3E%3Crect fill='%23FF6B3D' width='192' height='192' rx='48'/%3E%3Ctext x='96' y='130' font-size='100' text-anchor='middle' fill='white'%3E❤️%3C/text%3E%3C/svg%3E",
        badge: data.badge || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 72'%3E%3Ccircle fill='%23FF6B3D' cx='36' cy='36' r='36'/%3E%3Ctext x='36' y='50' font-size='40' text-anchor='middle' fill='white'%3E❤️%3C/text%3E%3C/svg%3E",
        tag: data.tag || 'seva-notification',
        requireInteraction: data.requireInteraction !== false,
        vibrate: [200, 100, 200], // Vibration pattern
        data: {
          url: data.url || '/',
          donationId: data.donationId,
          userId: data.userId
        },
        actions: data.actions || [
          { action: 'open', title: '👁️ View' },
          { action: 'close', title: '✖️ Close' }
        ]
      };
    } catch (error) {
      console.error('❌ Error parsing push notification data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  
  if (event.action === 'close') {
    console.log('User dismissed notification');
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUntracked: true })
      .then((clientList) => {
        // Check if app is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if not already open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('🔕 Notification closed:', event.notification.tag);
});