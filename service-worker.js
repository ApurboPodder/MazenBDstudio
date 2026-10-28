const CACHE_NAME = "model-studio-pwa-v13";
const APP_FILES = [
  "./",
  "./index.html",
  "./model-studio.css",
  "./model-studio.js",
  "./three-studio.js",
  "./pwa.js",
  "./manifest.webmanifest",
  "./studio-projects.json",
  "./icons/eyewear-icon-192.png",
  "./icons/eyewear-icon-512.png",
  "./assets/Logo/Mazen%20Logo.png",
  "./assets/face/face%201.glb"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("model-studio-pwa-") && key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try { const response = await fetch(request); if (response.ok) await cache.put(request, response.clone()); return response; }
  catch (error) { const cached = await cache.match(request); if (cached) return cached; if (request.mode === "navigate") { const shell = await cache.match("./index.html"); if (shell) return shell; } throw error; }
}
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || /\.zip$/i.test(url.pathname)) return;
  if (request.mode === "navigate" || ["script", "style", "image", "font"].includes(request.destination) || /\.(json|glb)$/i.test(url.pathname)) event.respondWith(networkFirst(request));
});
