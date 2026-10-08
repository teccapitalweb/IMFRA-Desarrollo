// ═══════════════════════════════════════════════════════════════════
// Registro de visitas · panel VIP, acceso y sitio público
//
// Envía una señal por minuto mientras la página está visible con el tiempo
// real transcurrido. Un identificador aleatorio del navegador cuenta
// visitantes únicos; en el panel, la sesión iniciada identifica al miembro.
// No usa cookies de terceros ni guarda la IP.
// ═══════════════════════════════════════════════════════════════════

declare global {
  interface Window {
    WEBHOOK_URL?: string;
    __currentUser?: { getIdToken(): Promise<string> };
  }
}

const API = "https://imfra-backend-production.up.railway.app";
const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.hostname.endsWith(".localhost");
const IDLE_MS = 30 * 60 * 1000;

function randomId() {
  return (crypto.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`).toLowerCase();
}

function storageId(store: Storage, key: string) {
  try {
    let value = store.getItem(key);
    if (!value) { value = randomId(); store.setItem(key, value); }
    return value;
  } catch {
    return randomId();
  }
}

// Una sesión por pestaña; se renueva después de 30 minutos sin actividad.
function sessionId() {
  try {
    const last = Number(sessionStorage.getItem("imfra:sid-at") || 0);
    if (last && Date.now() - last > IDLE_MS) sessionStorage.removeItem("imfra:sid");
    sessionStorage.setItem("imfra:sid-at", String(Date.now()));
  } catch { /* sin almacenamiento */ }
  return storageId(sessionStorage, "imfra:sid");
}

const area = /vip-panel/.test(location.pathname) ? "panel" : /vip-auth/.test(location.pathname) ? "auth" : "web";
const section = () => (area === "panel" ? (location.hash || "#inicio").slice(1) : location.pathname.replace(/^\/|\.html$/g, "") || "inicio");

let visibleSince = document.visibilityState === "visible" ? performance.now() : 0;
let pending = 0;
let currentSection = section();

function collect() {
  if (visibleSince) {
    pending += (performance.now() - visibleSince) / 1000;
    visibleSince = document.visibilityState === "visible" ? performance.now() : 0;
  }
}

async function send(final = false) {
  collect();
  const delta = Math.round(pending);
  if (delta < 1 && !final) return;
  pending = 0;
  const body = JSON.stringify({ sid: sessionId(), vid: storageId(localStorage, "imfra:vid"), area, section: currentSection, delta });
  const url = `${window.WEBHOOK_URL || API}/analytics/beat`;
  try {
    let token = "";
    if (area === "panel" && !final) token = (await window.__currentUser?.getIdToken()) || "";
    if (final && !token && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: "text/plain" }));
      return;
    }
    await fetch(url, {
      method: "POST",
      keepalive: true,
      headers: token ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` } : { "Content-Type": "text/plain" },
      body
    });
  } catch { /* una señal perdida no afecta al usuario */ }
}

if (!LOCAL) {
  // Primera señal al abrir (cuenta la visita aunque dure poco).
  setTimeout(() => void send(), 4000);
  setInterval(() => { if (document.visibilityState === "visible") void send(); }, 60_000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void send(true);
    else visibleSince = performance.now();
  });
  window.addEventListener("pagehide", () => void send(true));
  // En el panel, el tiempo se atribuye a la sección donde ocurrió.
  window.addEventListener("hashchange", () => {
    if (area !== "panel") return;
    void send();
    currentSection = section();
  });
}

export {};
