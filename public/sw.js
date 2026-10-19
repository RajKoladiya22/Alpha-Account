// Progressive Web App Service Worker for Alpha Steel Frames
// Secure static-only cache: Financial and authenticated data is NEVER cached.
const CACHE_NAME = "asf-pwa-static-v2";
const STATIC_ASSETS = [
  "/manifest.json",
  "/logo.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[PWA SW] Pre-caching static assets failed:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
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

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Strictly NEVER cache financial, accounting, user, or dynamic API endpoints
  if (
    event.request.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/quotes") ||
    url.pathname.startsWith("/contacts") ||
    url.pathname.startsWith("/settings") ||
    url.pathname.startsWith("/setup") ||
    url.pathname.startsWith("/portal")
  ) {
    return;
  }

  // Cache-first only for static assets, network-first for everything else
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
