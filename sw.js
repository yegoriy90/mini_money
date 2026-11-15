// Офлайн-кеш оболонки застосунку. При зміні файлів — підняти VERSION.
const VERSION = 'mm-v29';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/fonts.css?v=29', 'css/app.css?v=29', 'css/candy.css?v=29', 'js/app.js?v=29', 'assets/fonts/nunito-cyrillic.woff2', 'assets/fonts/nunito-latin.woff2',
  'js/model.js', 'js/store.js', 'js/library.js', 'js/themes.js', 'js/fx.js', 'js/native.js', 'js/firebase-config.js', 'audio/voice/index.js',
  'icons/favicon.png', 'assets/cele-heroes.mp4', 'assets/cele-heroes.jpg', 'assets/heroes/flopi.webp', 'assets/heroes/monkey.webp', 'assets/heroes/flopi-avatar.webp', 'assets/heroes/monkey-avatar.webp', 'icons/apple-touch-icon.png', 'icons/icon-192.png',
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
