/* 今日食咩？ sw.js v1.0 */
const CACHE = 'lunch-v1';
const IMG_CACHE = 'lunch-img-v1';
const CORE = ['./', './index.html', './manifest.json', './images.js', './logos.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE && k !== IMG_CACHE).map(k => caches.delete(k))
    )).then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // AI 食物相：runtime cache，睇過就有，offline 都出到
  if (url.hostname === 'image.pollinations.ai') {
    e.respondWith(
      caches.open(IMG_CACHE).then(c =>
        c.match(e.request).then(hit => {
          if (hit) return hit;
          return fetch(e.request).then(res => {
            if (res.ok) c.put(e.request, res.clone());
            return res;
          }).catch(()=>c.match(e.request));
        })
      )
    );
    return;
  }
  // 其他：cache first，跌返 network
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(()=>caches.match('./index.html')))
  );
});
