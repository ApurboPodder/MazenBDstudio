async function clearOfflineCopies() {
  const appPath = location.pathname.startsWith("/model-studio-standalone/") ? "/model-studio-standalone/" : "/";
  const expectedScope = new URL(appPath, location.origin).href;
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.filter((registration) => registration.scope === expectedScope).map((registration) => registration.unregister()));
  }
  if ("caches" in window) {
    for (const cacheName of await caches.keys()) {
      const cache = await caches.open(cacheName);
      for (const request of await cache.keys()) {
        const path = new URL(request.url).pathname;
        if (path.startsWith(appPath) || cacheName.startsWith("model-studio-pwa-")) await cache.delete(request);
      }
      if (cacheName.startsWith("model-studio-pwa-")) await caches.delete(cacheName);
    }
  }
}
clearOfflineCopies().catch((error) => console.warn("Could not clear old offline viewer files", error));

const form = document.getElementById("loginForm");
const passwordInput = document.getElementById("password");
const button = document.getElementById("submitButton");
const errorMessage = document.getElementById("loginError");

function getReturnPath() {
  const requested = new URLSearchParams(location.search).get("next") || "/";
  if (!requested.startsWith("/") || requested.startsWith("//")) return "/";
  const destination = new URL(requested, location.origin);
  if (location.pathname.startsWith("/model-studio-standalone/")) {
    return destination.pathname.startsWith("/model-studio-standalone/") ? destination.pathname + destination.search : "/model-studio-standalone/";
  }
  return destination.origin === location.origin ? destination.pathname + destination.search : "/";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorMessage.textContent = "";
  button.disabled = true;
  button.textContent = "Signing in…";
  try {
    const response = await fetch("/api/model-studio-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", password: passwordInput.value }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Sign in failed.");
    location.replace(getReturnPath());
  } catch (error) {
    errorMessage.textContent = error.message || "Could not sign in. Try again.";
    passwordInput.select();
  } finally {
    button.disabled = false;
    button.textContent = "Sign in";
  }
});
