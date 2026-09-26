/*
 * This app registers no service worker. Other apps on the same origin can
 * leave one behind (e.g. another project on localhost:3000 with a CacheFirst
 * rule for /_next/static/**), which then serves their stale CSS/JS here.
 *
 * Inline script on purpose: it ships with the HTML, which such a worker does
 * not cache, so it runs even when every JS chunk is served from a stale cache.
 * It unregisters foreign workers, clears their caches and reloads once.
 */
const script = `(() => {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    if (registrations.length === 0) return;
    Promise.all(registrations.map((registration) => registration.unregister()))
      .then(() => ("caches" in window ? caches.keys() : []))
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .finally(() => location.reload());
  });
})();`;

export function ServiceWorkerCleanup() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
