import "./material-rewards.css";
import { celebrate } from "../shared/celebration";
import { currentUserId, firestore, isDemoMode } from "../shared/firestore";

export interface MaterialRewardItem {
  archivo: string;
  titulo: string;
  url: string;
  rewardOrder: number;
  esRecompensa: true;
}

interface MaterialRewardState {
  unlockedCount: number;
  eventIds: string[];
  updatedAt: string;
}

declare global {
  interface Window {
    IMFRA_MATERIALS_CATALOG?: Array<Record<string, unknown>>;
    memberData?: Record<string, unknown> | null;
    IMFRAMaterialRewards: {
      getUnlockedCount(): number;
      getTotal(): number;
      isUnlocked(order: number): boolean;
      awardCorrect(eventId: string, source: string): MaterialRewardItem | null;
    };
  }
}

function accountId() {
  return currentUserId() || window.UserState?.email || "guest";
}

function stateKey() {
  return `imfra:v2:material-rewards:${accountId()}`;
}

function rewardCatalog(): MaterialRewardItem[] {
  return (window.IMFRA_MATERIALS_CATALOG || [])
    .filter((item) => item.esRecompensa === true && Number(item.rewardOrder) > 0)
    .map((item) => ({
      archivo: String(item.archivo || ""),
      titulo: String(item.titulo || "Material IMFRA"),
      url: String(item.url || ""),
      rewardOrder: Number(item.rewardOrder),
      esRecompensa: true as const
    }))
    .sort((a, b) => a.rewardOrder - b.rewardOrder);
}

function emptyState(): MaterialRewardState {
  return { unlockedCount: 0, eventIds: [], updatedAt: "" };
}

function normalize(value: Partial<MaterialRewardState> | null | undefined): MaterialRewardState {
  const total = rewardCatalog().length || 7;
  const eventIds = Array.isArray(value?.eventIds) ? [...new Set(value.eventIds.map(String))].slice(-80) : [];
  return {
    unlockedCount: Math.max(0, Math.min(total, Number(value?.unlockedCount) || 0)),
    eventIds,
    updatedAt: String(value?.updatedAt || "")
  };
}

function readState(): MaterialRewardState {
  let local = emptyState();
  try { local = normalize(JSON.parse(localStorage.getItem(stateKey()) || "null")); } catch {}
  const remote = normalize((window.memberData?.materialRewards || null) as Partial<MaterialRewardState> | null);
  return {
    unlockedCount: Math.max(local.unlockedCount, remote.unlockedCount),
    eventIds: [...new Set([...local.eventIds, ...remote.eventIds])].slice(-80),
    updatedAt: local.updatedAt > remote.updatedAt ? local.updatedAt : remote.updatedAt
  };
}

function saveState(state: MaterialRewardState) {
  try { localStorage.setItem(stateKey(), JSON.stringify(state)); } catch {}
  if (window.memberData) window.memberData.materialRewards = state;

  const fs = firestore();
  const uid = currentUserId();
  if (isDemoMode() || !uid || !fs?.db || !fs.doc || !fs.setDoc || !fs.serverTimestamp) return;
  void fs.setDoc(fs.doc(fs.db, "miembros", uid), {
    materialRewards: {
      unlockedCount: state.unlockedCount,
      eventIds: state.eventIds,
      updatedAt: state.updatedAt,
      syncedAt: fs.serverTimestamp()
    }
  }, { merge: true }).catch((error) => console.warn("[material-rewards] Sincronización pendiente", error));
}

function closeUnlock() {
  document.querySelector(".mr-unlock-backdrop")?.remove();
}

function showUnlock(item: MaterialRewardItem, unlockedCount: number, total: number, source: string) {
  closeUnlock();
  const backdrop = document.createElement("div");
  backdrop.className = "mr-unlock-backdrop";
  backdrop.innerHTML = `<section class="mr-unlock" role="dialog" aria-modal="true" aria-labelledby="mr-unlock-title">
    <div class="mr-unlock__top"><span class="mr-unlock__icon"><svg class="ic"><use href="#i-download"/></svg></span></div>
    <div class="mr-unlock__body">
      <span class="mr-unlock__eyebrow">${source} · recompensa ${unlockedCount} de ${total}</span>
      <h2 id="mr-unlock-title">¡Nuevo archivo desbloqueado!</h2>
      <div class="mr-unlock__file">${escapeHtml(item.titulo)}</div>
      <p>Tu respuesta correcta abrió este recurso. Ya puedes verlo y descargarlo desde <strong>PDFs y material</strong>.</p>
      <div class="mr-unlock__progress"><div><i style="width:${Math.round(unlockedCount / total * 100)}%"></i></div><span>${unlockedCount} de ${total} herramientas desbloqueadas</span></div>
      <div class="mr-unlock__actions"><button class="btn btn--ghost" type="button" data-mr-close>Seguir practicando</button><button class="btn btn--accent" type="button" data-mr-open>Ver mi archivo <span aria-hidden="true">→</span></button></div>
    </div>
  </section>`;
  backdrop.addEventListener("click", (event) => { if (event.target === backdrop) closeUnlock(); });
  backdrop.querySelector("[data-mr-close]")?.addEventListener("click", closeUnlock);
  backdrop.querySelector("[data-mr-open]")?.addEventListener("click", () => {
    closeUnlock();
    if (typeof (window as unknown as { navigateToSection?: (section: string) => void }).navigateToSection === "function") {
      (window as unknown as { navigateToSection: (section: string) => void }).navigateToSection("pdfs");
    } else {
      location.hash = "pdfs";
    }
  });
  document.body.appendChild(backdrop);
  celebrate("big");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character] || character);
}

export function getUnlockedMaterialCount() {
  return readState().unlockedCount;
}

export function isMaterialRewardUnlocked(order: number) {
  return Number(order) > 0 && getUnlockedMaterialCount() >= Number(order);
}

export function awardMaterialForCorrect(eventId: string, source: string): MaterialRewardItem | null {
  const catalog = rewardCatalog();
  if (!eventId || !catalog.length) return null;
  const state = readState();
  if (state.eventIds.includes(eventId) || state.unlockedCount >= catalog.length) return null;

  state.eventIds.push(eventId);
  state.unlockedCount += 1;
  state.updatedAt = new Date().toISOString();
  saveState(state);

  const item = catalog[state.unlockedCount - 1];
  if (item) showUnlock(item, state.unlockedCount, catalog.length, source);
  window.dispatchEvent(new CustomEvent("imfra:material-reward-unlocked", { detail: { item, unlockedCount: state.unlockedCount } }));
  return item || null;
}

window.IMFRAMaterialRewards = {
  getUnlockedCount: getUnlockedMaterialCount,
  getTotal: () => rewardCatalog().length,
  isUnlocked: isMaterialRewardUnlocked,
  awardCorrect: awardMaterialForCorrect
};
