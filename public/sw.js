const CACHE = "council-cache-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Network-first, falling back to cache - gives an offline shell for the
// app's own pages and assets.
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  // Only handle this site's own files. Requests to other origins (notably
  // the Supabase API) are left alone, so user data is never written to the
  // cache and never served back stale.
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && res.type === "basic") {
          const copy = res.clone();
          caches
            .open(CACHE)
            .then((cache) => cache.put(request, copy))
            .catch(() => {});
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        // respondWith() must receive a Response. The old code passed
        // undefined here when nothing was cached, which is what caused
        // "Failed to convert value to 'Response'".
        return cached || Response.error();
      })
  );
});
