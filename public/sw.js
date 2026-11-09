/* Pettalopo Mobile PWA service worker.
 * Scoped to the GitHub Pages project path; never caches Firebase/API responses.
 */
const CACHE_PREFIX = "pettalopo-pwa-";
const CACHE_VERSION = "v1";
const APP_BASE = new URL("./", self.registration.scope);
const PRECACHE_URLS = [
  APP_BASE.href,
  new URL("manifest.webmanifest", APP_BASE).href,
  new URL("assets/pettalopo-logo.png", APP_BASE).href
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_PREFIX + CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_PREFIX + CACHE_VERSION)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_PREFIX + CACHE_VERSION).then((cache) => cache.put(APP_BASE.href, copy));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_PREFIX + CACHE_VERSION);
          return (await cache.match(request)) || (await cache.match(APP_BASE.href));
        })
    );
    return;
  }

  // Cache only browser-loaded static resources. API/data fetches are left untouched.
  if (["script", "style", "image", "font", "worker"].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_PREFIX + CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  }
});
