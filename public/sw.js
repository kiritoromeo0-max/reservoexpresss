// ReservoExpress service worker
// Caches the app shell so the app is usable offline / installable.

const CACHE_NAME = "reservoexpress-v1";
const APP_SHELL = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Strategy:
//  - Navigation requests (HTML): network-first, fallback to cached "/".
//  - Static assets (JS/CSS/fonts/images from same origin): stale-while-revalidate.
//  - API requests: network-only (always fresh data).
//  - Map tiles (openstreetmap): cache-first for offline map use.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // API calls: network only
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Map tiles: cache-first
  if (url.hostname.endsWith("tile.openstreetmap.org")) {
    event.respondWith(
      caches.open(CACHE_NAME + "-tiles").then((cache) =>
        cache.match(req).then(
          (cached) =>
            cached ||
            fetch(req).then((res) => {
              cache.put(req, res.clone()).catch(() => {});
              return res;
            })
        )
      )
    );
    return;
  }

  // Navigations: network-first with offline fallback
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put("/", copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("/").then((r) => r || caches.match(req)))
    );
    return;
  }

  // Same-origin static assets: stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(req).then((cached) => {
          const network = fetch(req)
            .then((res) => {
              cache.put(req, res.clone()).catch(() => {});
              return res;
            })
            .catch(() => cached);
          return cached || network;
        })
      )
    );
    return;
  }

  // Cross-origin (fonts, images): try network, fallback to cache
  event.respondWith(
    caches.open(CACHE_NAME + "-xorigin").then((cache) =>
      cache.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            cache.put(req, res.clone()).catch(() => {});
            return res;
          })
      )
    )
  );
});
