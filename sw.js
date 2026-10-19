const C = 'mnemosyne-20261019a'; // cambia il nome ad ogni deploy

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/master.css',
  './js/app.js',
  './js/browse.js',
  './js/cards.js',
  './js/computed.js',
  './js/constants.js',
  './js/dashboard.js',
  './js/decks.js',
  './js/firebase-sync.js',
  './js/import-export.js',
  './js/mnemonic.js',
  './js/nav.js',
  './js/pomodoro.js',
  './js/scheduler.js',
  './js/state.js',
  './js/stats.js',
  './js/study.js',
  './js/theme.js',
  './js/ui-utils.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(C)
      .then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // solo GET same-origin: Firebase, Google Fonts ecc. passano direttamente
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(C).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
