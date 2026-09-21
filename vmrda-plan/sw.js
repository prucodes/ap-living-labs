/* Offline for the VMR Plan Reader.
 *
 * The reader's readers are on phones, often on a patchy connection, sometimes
 * standing on the land they are asking about. The page is one HTML file and a
 * pile of static assets, so it can work offline honestly: what you have looked
 * at once, you keep.
 *
 * Rules, in order of how much they matter:
 *   index.html     network first. A stale plan reader is worse than a slow one,
 *                  because the numbers and the wording are the product.
 *   tiles          cache first, capped. 8,134 tiles exist and nobody needs all
 *                  of them; you keep the ones you actually looked at.
 *   everything else stale while revalidate, so the sheet, the places and the
 *                  schedule open instantly and refresh behind you.
 *
 * Nothing here is written by the page and nothing leaves the device.
 */
const BUILD = "84aea29b69";
const SHELL_CACHE = "vmr-shell-" + BUILD;
const TILE_CACHE = "vmr-tiles-v1";
const ASSET_CACHE = "vmr-assets-" + BUILD;
const TILE_CAP = 1400;

/* Small, and needed before anything can be answered. The sheet images and the
 * traced polygons are deliberately not here: they are megabytes each, and the
 * runtime cache picks them up the moment they are actually used. */
const SHELL = ["./", "./index.html", "./places.json", "./rules.json",
               "./tanks_all.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL_CACHE)
    .then((c) => c.addAll(SHELL))
    .then(() => self.skipWaiting())
    .catch(() => self.skipWaiting()));     /* a failed precache must not block */
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((k) => k.startsWith("vmr-") && k !== SHELL_CACHE &&
                       k !== ASSET_CACHE && k !== TILE_CACHE)
        .map((k) => caches.delete(k))
  )).then(() => self.clients.claim()));
});

async function trim(cache, cap) {
  const keys = await cache.keys();
  if (keys.length <= cap) return;
  /* keys() is insertion ordered, so the front is the oldest thing kept. */
  for (let i = 0; i < keys.length - cap; i++) await cache.delete(keys[i]);
}

async function tileFirst(req) {
  const cache = await caches.open(TILE_CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) { await cache.put(req, res.clone()); trim(cache, TILE_CAP); }
  return res;
}

async function freshFirst(req) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const res = await fetch(req, { cache: "no-cache" });
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req) || await cache.match("./index.html");
    if (hit) return hit;
    throw err;
  }
}

async function cacheThenUpdate(req) {
  const cache = await caches.open(ASSET_CACHE);
  const hit = await cache.match(req);
  const net = fetch(req).then((res) => {
    if (res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => hit);
  return hit || net;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;          /* never touch anyone else's */
  if (req.mode === "navigate" || url.pathname.endsWith("/index.html")) {
    e.respondWith(freshFirst(req));
  } else if (url.pathname.includes("/t/")) {
    e.respondWith(tileFirst(req));
  } else {
    e.respondWith(cacheThenUpdate(req));
  }
});
