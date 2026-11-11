const CACHE_NAME = 'carnet-v9-ipad-sync';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './style-composants.css',
  './style-effroi-wasteland.css',
  './style-historique-fenetres.css',
  './theme-western.css',
  './theme-steampunk.css',
  './theme-hivernal.css',
  './theme-flibuste.css',
  './style-final.css',
  './theme-automnal.css',
  './utils.js',
  './notifications.js',
  './exercices.js',
  './nutrition.js',
  './core.js',
  './etirement-echauffement.js',
  './bibliotheque.js',
  './nutrition-ui.js',
  './agenda.js',
  './seance.js',
  './reglages.js',
  './historique.js',
  './themes.js',
  './main.js',
  './theme-pirate.js',
  './sync-ipad.js',
  './nav.js',
  './manifest.json',

  /* Polices */
  './fonts/metrim.woff2',

  /* Sons */
  './sons/classique.mp3',
  './sons/douce.mp3',
  './sons/alarme.mp3',
  './sons/automnal1.mp3',
  './sons/automnal2.mp3',
  './sons/automnal3.mp3',
  './sons/automnal4.mp3',
  './sons/automnal5.mp3',
  './sons/automnal6.mp3',
  './sons/automnal7.mp3',
  './sons/effroi1.mp3',
  './sons/effroi2.mp3',
  './sons/effroi3.mp3',
  './sons/effroi4.mp3',
  './sons/effroi5.mp3',
  './sons/effroi6.mp3',
  './sons/effroi7.mp3',
  './sons/effroi8.mp3',
  './sons/hivernal1.mp3',
  './sons/paindepice1.mp3',
  './sons/paindepice2.mp3',
  './sons/paindepice3.mp3',
  './sons/paindepice4.mp3',
  './sons/paindepice5.mp3',
  './sons/paindepice6.mp3',
  './sons/paindepice7.mp3',
  './sons/paindepice8.mp3',
  './sons/paindepice9.mp3',
  './sons/estival1.mp3',
  './sons/estival2.mp3',
  './sons/cyberpunk1.mp3',
  './sons/cyberpunk2.mp3',
  './sons/cyberpunk3.mp3',
  './sons/cyberpunk4.mp3',
  './sons/cyberpunk5.mp3',
  './sons/cyberpunk6.mp3',
  './sons/cyberpunk7.mp3',
  './sons/cyberpunk8.mp3',
  './sons/cyberpunk9.mp3',
  './sons/cyberpunk10.mp3',
  './sons/pirate1.mp3',
  './sons/pirate2.mp3',
  './sons/pirate3.mp3',
  './sons/western1.mp3',
  './sons/western2.mp3',
  './sons/western3.mp3',
  './sons/wasteland1.mp3',
  './sons/wasteland2.mp3',
  './sons/wasteland3.mp3',
  './sons/wasteland4.mp3',
  './sons/wasteland5.mp3',
  './sons/wasteland6.mp3',
  './sons/wasteland7.mp3',
  './sons/wasteland8.mp3',
  './sons/wasteland9.mp3',
  './sons/wasteland10.mp3',
  './sons/wasteland11.mp3',
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
