"use client";

/*
 * This app registers no service worker. Other apps on the same origin can
 * leave one behind (e.g. another project on localhost:3000 with a CacheFirst
 * rule for /_next/static/**), which then serves their stale CSS/JS here.
 *
 * Inline script on purpose: it ships with the HTML, which such a worker does
 * not cache, so it runs even when every JS chunk is served from a stale cache.
 * It unregisters foreign workers, clears their caches and reloads once.
 *
 * It only has to run in the server HTML. When a language switch renders the
 * other language's root layout in the browser, React would warn about a
 * script it never runs; there it's marked as a data block instead (same trick
 * as the theme script, see ThemeProvider).
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
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      // The type differs between the server HTML and the browser on purpose
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
