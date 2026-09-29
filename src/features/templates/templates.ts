import { loadCredits, redeemCreditReward, type CreditSnapshot } from "../credits/credits";
import { currentUserId, firestore, isDemoMode } from "../shared/firestore";

const REWARD_ID = "pack-plantillas-pro";
const PACK_PRICE = 450;

interface PackState {
  saldo: number;
  desbloqueado: boolean;
}

interface PackApplication {
  estado?: PackState;
  vista?: string;
  iniciar(): Promise<unknown>;
  refrescarEstado(): Promise<PackState>;
}

interface ImfraPlantillasApi {
  init(options: Record<string, unknown>): PackApplication;
}

declare global {
  interface Window {
    ImfraPlantillas?: ImfraPlantillasApi;
    IMFRATemplates: { mount(container: HTMLElement): void };
    navigateToSection?: (section: string, options?: { reemplazar?: boolean }) => void;
  }
}

let application: PackApplication | null = null;
let themeObserver: MutationObserver | null = null;
let stylesheetReady: Promise<void> | null = null;

function ensureTemplateStyles() {
  if (stylesheetReady) return stylesheetReady;
  stylesheetReady = new Promise<void>((resolve) => {
    const existing = document.querySelector<HTMLLinkElement>("#imfra-templates-styles");
    if (existing) {
      if (existing.sheet) resolve();
      else {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => resolve(), { once: true });
      }
      return;
    }
    const link = document.createElement("link");
    link.id = "imfra-templates-styles";
    link.rel = "stylesheet";
    link.href = "assets/imfra-plantillas/imfra-plantillas.css?v=1.2.1";
    link.addEventListener("load", () => resolve(), { once: true });
    link.addEventListener("error", () => resolve(), { once: true });
    document.head.appendChild(link);
  });
  return stylesheetReady;
}

function hasPack(snapshot: CreditSnapshot) {
  return snapshot.redemptions.some((item) => item.rewardId === REWARD_ID && item.status === "active");
}

async function creditState(): Promise<PackState> {
  // Reutiliza el estado ya publicado. Forzar otra consulta aquí volvería a
  // emitir `imfra:credits-changed` mientras el propio módulo está montándose.
  const snapshot = await loadCredits();
  return { saldo: snapshot.balance, desbloqueado: hasPack(snapshot) };
}

async function redeemPack() {
  const before = await loadCredits();
  const yaTenia = hasPack(before);
  try {
    const after = await redeemCreditReward(REWARD_ID);
    return { ok: true, yaTenia, saldo: after.balance };
  } catch (cause) {
    const error = cause instanceof Error ? cause : new Error("No pudimos completar el canje.");
    const balance = (await loadCredits().catch(() => before)).balance;
    if (/saldo|créditos|faltan|necesitas/i.test(error.message)) {
      Object.assign(error, { code: "SALDO", saldo: balance });
    }
    throw error;
  }
}

function syncTheme(container: HTMLElement) {
  container.classList.toggle("ipk-dark", document.documentElement.getAttribute("data-theme") === "night");
}

function observeTheme(container: HTMLElement) {
  themeObserver?.disconnect();
  syncTheme(container);
  themeObserver = new MutationObserver(() => syncTheme(container));
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}

function renderUnavailable(container: HTMLElement, message: string) {
  container.innerHTML = `<div class="bu-access"><span class="bu-access__icon" aria-hidden="true">!</span><h2>Pack de plantillas no disponible</h2><p>${message}</p><button class="btn btn--ghost" type="button" data-template-back>Volver a Recompensas IMFRA</button></div>`;
  container.querySelector<HTMLButtonElement>("[data-template-back]")?.addEventListener("click", () => window.navigateToSection?.("recompensas"));
}

function createApplication(container: HTMLElement) {
  if (!window.ImfraPlantillas) {
    renderUnavailable(container, "No pudimos cargar el motor de plantillas. Actualiza la página e inténtalo nuevamente.");
    return null;
  }

  const uid = isDemoMode() ? "demo-preview-v10" : currentUserId();
  const options: Record<string, unknown> = {
    mount: container,
    uid,
    autoIniciar: false,
    config: {
      precio: PACK_PRICE,
      coleccionUsuarios: "usuarios",
      subcoleccionPlantillas: "misPlantillas",
      subcoleccionFotos: "misPlantillasFotos"
    },
    creditos: { estado: creditState, canjear: redeemPack },
    onVolver: () => window.navigateToSection?.("recompensas")
  };

  if (!isDemoMode()) {
    const fs = firestore();
    if (!uid || !fs?.db) {
      renderUnavailable(container, "Inicia sesión nuevamente para guardar tus plantillas en tu cuenta.");
      return null;
    }
    options.db = fs.db;
    options.firestoreModular = {
      doc: fs.doc,
      getDoc: fs.getDoc,
      setDoc: fs.setDoc,
      updateDoc: fs.updateDoc,
      deleteDoc: fs.deleteDoc,
      collection: fs.collection,
      getDocs: fs.getDocs,
      runTransaction: fs.runTransaction,
      serverTimestamp: fs.serverTimestamp
    };
  }

  return window.ImfraPlantillas.init(options);
}

function mount(container: HTMLElement) {
  // `navigateToSection` limpia las clases del módulo al salir. Como la
  // aplicación se conserva para no perder el documento activo, debemos
  // recuperar el scope visual cada vez que el usuario vuelve a Plantillas.
  container.classList.add("ipk");
  observeTheme(container);
  void ensureTemplateStyles().then(() => {
    if (!application) application = createApplication(container);
    if (!application) return;
    return application.iniciar();
  }).catch((error) => {
    console.error("[plantillas]", error);
    renderUnavailable(container, "No pudimos abrir tus plantillas en este momento.");
    window.Toast?.error("Pack de plantillas", "No pudimos cargar el módulo.");
  });
}

window.addEventListener("imfra:credits-changed", () => {
  if (!application || application.estado?.desbloqueado || location.hash !== "#plantillas") return;
  void application.iniciar();
});

window.IMFRATemplates = { mount };
window.dispatchEvent(new CustomEvent("imfra:templates-ready"));
