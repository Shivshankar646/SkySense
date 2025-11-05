const CACHE_NAME = 'skysense-v1';
const URLS = ['/', '/index.html'];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS)));
});

self.addEventListener('fetch', (ev) => {
  ev.respondWith(
    caches.match(ev.request).then((resp) => resp || fetch(ev.request))
  );
});
