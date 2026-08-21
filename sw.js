const CACHE_NAME = 'carnet-v2';
const urlsToCache = [
  './',             
  './index.html',    
  './style.css',
  './app.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

/* ============================================================
   GESTION DES NOTIFICATIONS
   ============================================================ */

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  if (event.action === 'fermer') { return; }

  var tag = event.notification.tag || '';
  var estRessenti = tag.indexOf('rappel-sommeil') === 0 || tag.indexOf('rappel-fatigue') === 0 || tag.indexOf('rappel-stress') === 0;
  var urlCible = estRessenti ? './?action=ressenti' : './';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client) {
          client.postMessage({ action: estRessenti ? 'aller-ressenti' : 'ouvrir' });
          return client.focus();
        }
      }
      if (clients.openWindow) { return clients.openWindow(urlCible); }
    })
  );
});
