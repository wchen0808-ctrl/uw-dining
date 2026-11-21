// 网络优先：有网时总是拿最新的；没网或超时就用缓存。
const CACHE = "uw-dining-v14";
const SHELL = [
  "./", "index.html", "style.css?v=14", "app.js?v=14", "fx.js?v=14", "vendor/motion-14.9.0.js", "manifest.webmanifest",
  "icons/naiwa-chef.png", "icons/naiwa-c1.webp", "icons/naiwa-f2.webp", "icons/naiwa-g3.webp", "icons/naiwa-l4.webp", "icons/naiwa-r5.webp",
  "icons/food-drumstick.webp", "icons/food-broccoli.webp", "icons/food-dumpling.webp", "icons/food-egg.webp", "icons/food-strawberry.webp", "icons/food-chili.webp",
  "icons/icon.svg", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png",
  "data/halls.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function timeout(ms) { return new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)); }

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await Promise.race([fetch(req, { cache: "no-cache" }), timeout(6000)]);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === "navigate") {
        const shell = await cache.match("index.html");
        if (shell) return shell;
      }
      return new Response("offline", { status: 503, statusText: "Offline" });
    }
  })());
});
