// Офлайн-кеш оболонки застосунку. При зміні файлів — підняти VERSION.
const VERSION = 'mm-v14';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css?v=14', 'js/app.js?v=14',
  'js/model.js', 'js/store.js', 'js/library.js', 'js/themes.js', 'js/fx.js', 'js/firebase-config.js', 'audio/voice/index.js',
  'icons/icon.svg', 'assets/cele-kitty.mp4', 'assets/cele-kitty.jpg', 'icons/apple-touch-icon.png', 'icons/icon-192.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// свої файли: спершу мережа (щоб оновлення приходили одразу), без мережі — кеш
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then(res => { // завжди перепитувати сервер, щоб оновлення приходили одразу
      if (res.status === 200) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: e.request.mode === 'navigate' }).then(r => r || caches.match('index.html')))
  );
});
