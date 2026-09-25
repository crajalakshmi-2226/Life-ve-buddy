// LifeBuddy PWA Service Worker
const CACHE_NAME = 'lifebuddy-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Initial cache failed to add all assets:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Handle HTML navigations - network first with offline cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return caches.match('/');
        })
    );
    return;
  }

  // Handle static assets - cache first, fallback to network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      }).catch(() => {
        // Fallback or ignore
        return cachedResponse;
      });
    })
  );
});

// ==========================================
// SYSTEM-LEVEL NOTIFICATIONS & PUSH EVENTS
// ==========================================

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    const notificationOptions = {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: false,
      tag: options?.tag || `lifebuddy-${Date.now()}`,
      renotify: true,
      data: options?.data || { url: '/' },
      actions: [
        { action: 'open', title: 'Open LifeBuddy' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      ...options
    };

    event.waitUntil(self.registration.showNotification(title, notificationOptions));
  } else if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle real Web Push Events (FCM / Web Push Protocol)
// Wakes up service worker when browser/tab is in background or closed
self.addEventListener('push', (event) => {
  let data = {
    title: 'LifeBuddy Alert',
    body: 'You have a scheduled academic reminder.',
    url: '/',
    tag: 'lifebuddy-bg-push',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png'
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (_e) {
      data.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: data.body || '',
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    vibrate: data.vibrate || [200, 100, 200, 100, 200],
    tag: data.tag || 'lifebuddy-notification',
    renotify: true,
    requireInteraction: false,
    data: {
      url: data.url || (data.data && data.data.url) || '/',
      timestamp: Date.now()
    },
    actions: [
      { action: 'open', title: 'Open LifeBuddy' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  // On Android Chrome, event.waitUntil with showNotification is MANDATORY
  event.waitUntil(
    self.registration.showNotification(data.title || 'LifeBuddy Reminder', notificationOptions)
  );
});

// Open or focus the application window when the user taps a notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // If user tapped "Dismiss" action, do nothing further
  if (event.action === 'dismiss') {
    return;
  }

  const targetPath = (event.notification.data && event.notification.data.url) || '/';
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. Check if there is an existing LifeBuddy tab open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          // Send notification navigation event to the active tab
          client.postMessage({
            type: 'NOTIFICATION_NAVIGATE',
            url: targetPath
          });

          if ('focus' in client) {
            client.focus();
          }

          // If different page route, navigate
          if ('navigate' in client && client.url !== targetUrl) {
            return client.navigate(targetUrl);
          }
          return;
        }
      }

      // 2. If app/tab was completely closed, open a fresh window to the target route
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

