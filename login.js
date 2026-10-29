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

const languageKey = "studio-language";
const translations = {
  en: { language:"Language", eyebrow:"MAZEN · PRIVATE VIEWER", title:"Model Studio", prompt:"Enter the studio password to view projects.", password:"Password", signIn:"Sign in", signingIn:"Signing in…", incorrect:"The password is incorrect.", unavailable:"Login is not configured on the server. Contact the site administrator.", failed:"Sign in failed. Please try again.", network:"Could not sign in. Check your connection and try again." },
  zh: { language:"语言", eyebrow:"MAZEN · 私人查看器", title:"模型工作室", prompt:"输入工作室密码以查看项目。", password:"密码", signIn:"登录", signingIn:"正在登录…", incorrect:"密码不正确。", unavailable:"服务器尚未配置登录。请联系网站管理员。", failed:"登录失败，请重试。", network:"无法登录。请检查网络连接后重试。" },
  fr: { language:"Langue", eyebrow:"MAZEN · VISIONNEUSE PRIVÉE", title:"Studio modèle", prompt:"Saisissez le mot de passe du studio pour voir les projets.", password:"Mot de passe", signIn:"Se connecter", signingIn:"Connexion…", incorrect:"Le mot de passe est incorrect.", unavailable:"La connexion n’est pas configurée sur le serveur. Contactez l’administrateur du site.", failed:"Échec de la connexion. Veuillez réessayer.", network:"Connexion impossible. Vérifiez votre connexion Internet et réessayez." },
  de: { language:"Sprache", eyebrow:"MAZEN · PRIVATER MODELLBETRACHTER", title:"Modellstudio", prompt:"Geben Sie das Studio-Passwort ein, um Projekte anzusehen.", password:"Passwort", signIn:"Anmelden", signingIn:"Anmeldung läuft…", incorrect:"Das Passwort ist falsch.", unavailable:"Die Anmeldung ist auf dem Server nicht eingerichtet. Wenden Sie sich an den Website-Administrator.", failed:"Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.", network:"Anmeldung nicht möglich. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut." }
};
const languageSelect = document.getElementById("languageSelect");
const form = document.getElementById("loginForm");
const passwordInput = document.getElementById("password");
const button = document.getElementById("submitButton");
const errorMessage = document.getElementById("loginError");
let language = translations[localStorage.getItem(languageKey)] ? localStorage.getItem(languageKey) : "en";
let submitting = false;
function tr(key) { return translations[language][key]; }
function applyLanguage() {
  document.documentElement.lang = language;
  document.querySelectorAll("[data-i18n]").forEach((element) => { element.textContent = tr(element.dataset.i18n); });
  languageSelect.value = language;
  languageSelect.setAttribute("aria-label", tr("language"));
  document.title = tr("signIn") + " · " + tr("title");
  if (submitting) button.textContent = tr("signingIn");
}
languageSelect.addEventListener("change", () => {
  language = translations[languageSelect.value] ? languageSelect.value : "en";
  localStorage.setItem(languageKey, language);
  applyLanguage();
  errorMessage.textContent = "";
});
applyLanguage();

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
  submitting = true;
  button.disabled = true;
  button.textContent = tr("signingIn");
  try {
    const response = await fetch("/api/model-studio-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", password: passwordInput.value }),
    });
    if (!response.ok) {
      errorMessage.textContent = response.status === 401 ? tr("incorrect") : response.status === 503 ? tr("unavailable") : tr("failed");
      passwordInput.select();
      return;
    }
    location.replace(getReturnPath());
  } catch {
    errorMessage.textContent = tr("network");
    passwordInput.select();
  } finally {
    submitting = false;
    button.disabled = false;
    button.textContent = tr("signIn");
  }
});
