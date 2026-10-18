// Offline-Fähigkeit: App-Shell und alle Höhlen vorab cachen, Schriften beim ersten Laden.
const VERSION = "hasenbau-v4";
const SHELL = [
  "./",
  "index.html",
  "css/style.css",
  "js/app.js",
  "content/index.json",
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

async function precache() {
  const cache = await caches.open(VERSION);
  await cache.addAll(SHELL);
  // Die Höhlen werden mitgecacht, damit auch künftige Tage offline funktionieren.
  const { hoehlen } = await (await cache.match("content/index.json")).json();
  await cache.addAll(hoehlen.map((id) => `content/hoehlen/${id}.json`));
}

self.addEventListener("install", (e) => {
  e.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Google Fonts: Cache zuerst, im Hintergrund auffrischen
  if (url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")) {
    e.respondWith(
      caches.open(VERSION).then(async (cache) => {
        const cached = await cache.match(request);
        const fresh = fetch(request).then((res) => {
          if (res.ok || res.type === "opaque") cache.put(request, res.clone());
          return res;
        }).catch(() => cached);
        return cached || fresh;
      })
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // Eigene Dateien: Netz zuerst (damit neue Höhlen ankommen), sonst Cache
  e.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(request, copy));
        }
        return res;
      })
      .catch(() => caches.match(request, { ignoreSearch: true }).then((r) => r || caches.match("index.html")))
  );
});
