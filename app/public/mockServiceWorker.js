// Minimal stub to avoid 404 during development when MSW is not configured.
// If you later integrate MSW, replace this file with the actual worker.
self.addEventListener("install", () => self.skipWaiting && self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil && event.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", () => {});


