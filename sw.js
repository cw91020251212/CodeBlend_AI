/* CodeBlend AI - Service Worker (GitHub Pages / 靜態站點)
   注意：本專案依賴多個 CDN（Tailwind / FontAwesome / Google Fonts / js-beautify）。
   離線時未必能完整載入外部資源；此 SW 主要用於讓網站可安裝、並快取本地檔案。 */

const CACHE_NAME = 'codeblend-ai-v2';

// 只快取同源（同一個網站）嘅本地檔案
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 只處理同源請求，避免快取 CDN（跨域）
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          // 只快取成功回應
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
