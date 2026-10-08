import { celebrateRedemption } from "../shared/celebration";

export interface CreditRedemption {
  id: string;
  rewardId: string;
  type: string;
  points: number;
  status: string;
  createdAt?: string | null;
  validUntil?: string | null;
}

export interface CreditNotification {
  id: string;
  kind: "gift" | "purchase";
  amount: number;
  balanceAfter: number;
  note?: string;
  createdAt?: string | null;
  readAt?: string | null;
}

export interface MembershipBenefitStatus {
  mode: "membership_anniversary";
  activeMembership: boolean;
  memberSince?: string | null;
  eligibleAt?: string | null;
  eligible: boolean;
  used: boolean;
  durationDays: number;
}

export interface CreditSnapshot {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  /** Créditos de regalo que recibió la cuenta al entrar por primera vez. */
  welcomeCredits: number;
  redemptions: CreditRedemption[];
  benefits: Record<string, MembershipBenefitStatus>;
  notifications: CreditNotification[];
  challengeAccess: ChallengeAccess;
}

export type ChallengeMode = "quiz" | "inspector" | "flashcards" | "juegos";
export interface ChallengeAccess {
  vip: boolean;
  status: "vip" | "available" | "active" | "used";
  mode: ChallengeMode | null;
  expiresAt: string | null;
}

interface DemoRewardState {
  points?: number;
  creditUnlocks?: string[];
  creditRedemptions?: CreditRedemption[];
  creditEvents?: string[];
  [key: string]: unknown;
}

declare global {
  interface Window {
    IMFRACredits: {
      hydrate(force?: boolean): Promise<CreditSnapshot>;
      snapshot(): CreditSnapshot;
      getBalance(): number;
      isLoaded(): boolean;
      isUnlocked(rewardId: string): boolean;
      canEarn(): boolean;
      challengeAccess(): ChallengeAccess;
      startChallenge(mode: ChallengeMode): Promise<ChallengeAccess>;
      completeChallenge(mode: ChallengeMode): Promise<ChallengeAccess>;
      redeem(rewardId: string): Promise<CreditSnapshot>;
      awardCorrect(activityId: string, source: "quiz" | "inspector", selected: number): Promise<CreditSnapshot>;
      markNotificationsRead(ids: string[]): Promise<void>;
    };
    WEBHOOK_URL?: string;
    __currentUser?: { getIdToken(): Promise<string> };
    UserState?: { uid?: string; email?: string; modo?: string; photoURL?: string; displayName?: string };
  }
}

const DEMO_COSTS: Record<string, number> = {
  "tool-concreto": 120,
  "tool-acero": 180,
  "tool-muros": 200,
  "tool-retenciones": 220,
  "tool-curvas": 240,
  "tool-checklist": 260,
  "tool-bitacora": 280,
  "tool-generadores": 300,
  "material-1": 120,
  "material-2": 175,
  "material-3": 190,
  "material-4": 205,
  "material-5": 220,
  "material-6": 240,
  "material-7": 260,
  "book-hidrologia-basica": 800,
  "book-advanced-mechanics": 800,
  "book-advanced-strength": 800,
  "book-resistencia-materiales": 800,
  "software-presupuestos": 1200,
  "imdac-control-obra-30d": 0,
  "pack-plantillas-pro": 450
};
const EMPTY_ACCESS: ChallengeAccess = { vip: false, status: "available", mode: null, expiresAt: null };
const EMPTY: CreditSnapshot = { balance: 0, lifetimeEarned: 0, lifetimeSpent: 0, welcomeCredits: 0, redemptions: [], benefits: {}, notifications: [], challengeAccess: EMPTY_ACCESS };
let current: CreditSnapshot = { ...EMPTY };
let loaded = false;
let loading: Promise<CreditSnapshot> | null = null;
let identity = "";
let displayedNotifications = new Set<string>();
let pollTimer = 0;

function isDemo() {
  return window.UserState?.modo === "demo" || new URLSearchParams(location.search).get("modo") === "demo";
}

/** VIP, administrador o una partida gratuita activa pueden ganar créditos en Retos. */
export function hasVipAccess() {
  const state = window.UserState as (typeof window.UserState & { plan?: string; isAdmin?: boolean }) | undefined;
  return state?.modo === "vip" || state?.plan === "admin" || state?.isAdmin === true;
}

export function canEarnChallengeCredits() {
  return isDemo() || hasVipAccess() || current.challengeAccess.status === "active";
}

export function getChallengeAccess() { return current.challengeAccess; }

function currentIdentity() {
  return isDemo() ? "demo-preview-v10" : (window.UserState?.uid || window.UserState?.email || "guest");
}

function demoStorageKey() {
  return `imfra:v2:rewards:${currentIdentity()}`;
}

function readDemoState(): DemoRewardState {
  try {
    return JSON.parse(localStorage.getItem(demoStorageKey()) || "null") || { points: 620 };
  } catch {
    return { points: 620 };
  }
}

function demoSnapshot() {
  const saved = readDemoState();
  const unlocks = Array.isArray(saved.creditUnlocks) ? [...new Set(saved.creditUnlocks.map(String))] : [];
  const storedRedemptions = Array.isArray(saved.creditRedemptions) ? saved.creditRedemptions : [];
  const redemptions = storedRedemptions.length ? storedRedemptions : unlocks.map((rewardId) => ({
    id: `demo-${rewardId}`,
    rewardId,
    type: rewardType(rewardId),
    points: DEMO_COSTS[rewardId] || 0,
    status: "active"
  }));
  return {
    balance: Math.max(0, Number(saved.points ?? 620) || 0),
    lifetimeEarned: 620,
    lifetimeSpent: redemptions.reduce((total, item) => total + Math.max(0, Number(item.points) || 0), 0),
    welcomeCredits: 200,
    redemptions,
    benefits: {
      "imdac-control-obra-30d": {
        mode: "membership_anniversary",
        activeMembership: true,
        memberSince: new Date(Date.now() - 370 * 86400000).toISOString(),
        eligibleAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        eligible: !redemptions.some((item) => item.rewardId === "imdac-control-obra-30d"),
        used: redemptions.some((item) => item.rewardId === "imdac-control-obra-30d"),
        durationDays: 30
      }
    },
    notifications: [],
    challengeAccess: { vip: true, status: "vip", mode: null, expiresAt: null }
  } satisfies CreditSnapshot;
}

function rewardType(rewardId: string) {
  if (rewardId === "software-presupuestos" || rewardId === "imdac-control-obra-30d") return "software";
  if (rewardId === "pack-plantillas-pro") return "resource";
  if (rewardId.startsWith("tool-")) return "tool";
  if (rewardId.startsWith("material-")) return "material";
  return "book";
}

function writeDemo(snapshot: CreditSnapshot, eventIds?: string[]) {
  const saved = readDemoState();
  saved.points = snapshot.balance;
  saved.creditUnlocks = snapshot.redemptions.filter((item) => item.status === "active").map((item) => item.rewardId);
  saved.creditRedemptions = snapshot.redemptions;
  if (eventIds) saved.creditEvents = eventIds;
  localStorage.setItem(demoStorageKey(), JSON.stringify(saved));
}

function popupStorageKey() {
  return `imfra:credit-popups:${identity}`;
}

function restoreDisplayedNotifications() {
  try {
    const stored = JSON.parse(localStorage.getItem(popupStorageKey()) || "[]");
    displayedNotifications = new Set(Array.isArray(stored) ? stored.map(String) : []);
  } catch {
    displayedNotifications = new Set();
  }
}

function notifyPrivateMovements(notifications: CreditNotification[]) {
  const pending = notifications.filter((item) => !item.readAt && !displayedNotifications.has(item.id));
  pending.reverse().forEach((notification) => {
    displayedNotifications.add(notification.id);
    window.dispatchEvent(new CustomEvent("imfra:credit-notification", { detail: notification }));
  });
  if (!pending.length) return;
  try {
    localStorage.setItem(popupStorageKey(), JSON.stringify([...displayedNotifications].slice(-100)));
  } catch {}
}

function publish(snapshot: CreditSnapshot) {
  const next: CreditSnapshot = {
    balance: Math.max(0, Number(snapshot.balance) || 0),
    lifetimeEarned: Math.max(0, Number(snapshot.lifetimeEarned) || 0),
    lifetimeSpent: Math.max(0, Number(snapshot.lifetimeSpent) || 0),
    welcomeCredits: Math.max(0, Number(snapshot.welcomeCredits) || 0),
    redemptions: Array.isArray(snapshot.redemptions) ? snapshot.redemptions : [],
    benefits: snapshot.benefits && typeof snapshot.benefits === "object" ? snapshot.benefits : {},
    notifications: Array.isArray(snapshot.notifications) ? snapshot.notifications : [],
    challengeAccess: snapshot.challengeAccess && typeof snapshot.challengeAccess === "object" ? snapshot.challengeAccess : (hasVipAccess() ? { vip: true, status: "vip", mode: null, expiresAt: null } : { ...EMPTY_ACCESS })
  };
  const changed = !loaded
    || current.balance !== next.balance
    || current.lifetimeEarned !== next.lifetimeEarned
    || current.lifetimeSpent !== next.lifetimeSpent
    || current.redemptions.map((item) => `${item.id}:${item.status}`).join("|") !== next.redemptions.map((item) => `${item.id}:${item.status}`).join("|")
    || JSON.stringify(current.benefits) !== JSON.stringify(next.benefits)
    || JSON.stringify(current.challengeAccess) !== JSON.stringify(next.challengeAccess);
  current = next;
  loaded = true;
  if (changed) window.dispatchEvent(new CustomEvent("imfra:credits-changed", { detail: current }));
  window.dispatchEvent(new CustomEvent("imfra:credit-notifications-sync", { detail: current.notifications }));
  notifyPrivateMovements(current.notifications);
  return current;
}

export class ChallengeAccessError extends Error {
  constructor(message: string, readonly code: "challenge_trial_used" | "challenge_trial_active" | "challenge_unavailable", readonly activeMode: ChallengeMode | null = null) {
    super(message);
  }
}

const CHALLENGE_MODE_LABELS: Record<ChallengeMode, string> = { quiz: "Quiz técnico", inspector: "Casos de obra", flashcards: "Tarjetas técnicas", juegos: "Juegos de obra" };

function setChallengeAccess(access: ChallengeAccess) {
  current = { ...current, challengeAccess: access };
  window.dispatchEvent(new CustomEvent("imfra:credits-changed", { detail: current }));
  return access;
}

function activeTrialFor(mode: ChallengeMode) {
  const access = current.challengeAccess;
  return access.status === "active" && access.mode === mode && (!access.expiresAt || new Date(access.expiresAt).getTime() > Date.now());
}

async function challengeRequest(path: "start" | "complete", mode: ChallengeMode): Promise<ChallengeAccess> {
  if (isDemo() || hasVipAccess()) return { vip: true, status: "vip", mode, expiresAt: null };
  await loadCredits();
  if (current.challengeAccess.status === "vip") return current.challengeAccess;
  // Evita una llamada de red en cada clic mientras la partida gratuita sigue activa.
  if (path === "start" && activeTrialFor(mode)) return current.challengeAccess;
  if (path === "start" && current.challengeAccess.status === "used") {
    throw new ChallengeAccessError("Tu partida gratuita ya fue utilizada.", "challenge_trial_used");
  }
  const response = await fetch(apiUrl(`/credits/challenge/${path}`), {
    method: "POST",
    cache: "no-store",
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ mode })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 403) {
      setChallengeAccess({ vip: false, status: "used", mode: null, expiresAt: null });
      throw new ChallengeAccessError(data.error || "Tu partida gratuita ya fue utilizada.", "challenge_trial_used");
    }
    if (response.status === 409) {
      const activeMode = current.challengeAccess.mode;
      throw new ChallengeAccessError(data.error || "Tu partida gratuita está activa en otra modalidad.", "challenge_trial_active", activeMode);
    }
    throw new ChallengeAccessError(data.error || "No pudimos validar tu acceso a Retos IMFRA.", "challenge_unavailable");
  }
  return setChallengeAccess(data as ChallengeAccess);
}

/** Muestra el aviso adecuado cuando un usuario no VIP no puede abrir otra partida. */
export function showChallengeBlocked(error: unknown) {
  const reason = error instanceof ChallengeAccessError ? error : null;
  if (reason?.code === "challenge_trial_active") {
    const label = reason.activeMode ? CHALLENGE_MODE_LABELS[reason.activeMode] : "otra modalidad";
    window.__showPaywallModal?.({
      title: "Tu partida gratuita está en curso",
      sub: `Tu turno gratis ya comenzó en ${label}. Termínalo ahí o hazte VIP para jugar todas las modalidades sin límites y ganar créditos por cada acierto.`,
      cta: "Ver membresía VIP"
    });
    return;
  }
  if (reason?.code === "challenge_unavailable") {
    window.Toast?.error?.("Retos IMFRA", reason.message);
    return;
  }
  window.__showPaywallModal?.({
    title: "Tu partida gratuita ya terminó",
    sub: "Hazte VIP para seguir jugando en Retos IMFRA, practicar sin límites y ganar créditos por cada acierto.",
    cta: "Ver membresía VIP"
  });
}

export const startChallengeAttempt = (mode: ChallengeMode) => challengeRequest("start", mode);
export const completeChallengeAttempt = (mode: ChallengeMode) => challengeRequest("complete", mode);

async function token() {
  const value = await window.__currentUser?.getIdToken?.();
  if (!value) throw new Error("Inicia sesión para usar tus Créditos IMFRA.");
  return value;
}

function apiUrl(path: string) {
  return `${window.WEBHOOK_URL || "https://imfra-backend-production.up.railway.app"}${path}`;
}

export async function loadCredits(force = false): Promise<CreditSnapshot> {
  const nextIdentity = currentIdentity();
  if (nextIdentity !== identity) {
    identity = nextIdentity;
    loaded = false;
    loading = null;
    current = { ...EMPTY };
    restoreDisplayedNotifications();
  }
  if (!force && loaded) return current;
  if (!force && loading) return loading;
  loading = (async () => {
    if (isDemo()) return publish(demoSnapshot());
    if (nextIdentity === "guest" || window.UserState?.modo === "invitado") return publish({ ...EMPTY });
    const response = await fetch(apiUrl("/credits/me"), { cache: "no-store", headers: { Authorization: `Bearer ${await token()}` } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "No pudimos cargar tus Créditos IMFRA.");
    return publish(data as CreditSnapshot);
  })().finally(() => { loading = null; });
  return loading;
}

export async function markCreditNotificationsRead(ids: string[]) {
  const normalized = [...new Set(ids.map(String).filter(Boolean))].slice(0, 50);
  if (!normalized.length || isDemo()) return;
  const response = await fetch(apiUrl("/credits/notifications/read"), {
    method: "POST",
    cache: "no-store",
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ids: normalized })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "No pudimos actualizar tus notificaciones.");
  const readAt = new Date().toISOString();
  current = { ...current, notifications: current.notifications.map((item) => normalized.includes(item.id) ? { ...item, readAt } : item) };
}

async function pollCredits() {
  if (document.visibilityState === "hidden" || isDemo()) return;
  if (!window.__currentUser || window.UserState?.modo === "invitado" || currentIdentity() === "guest") return;
  try { await loadCredits(true); } catch (error) { console.warn("[credits] Sincronización pendiente", error); }
}

function startCreditPolling() {
  if (pollTimer) window.clearInterval(pollTimer);
  pollTimer = window.setInterval(pollCredits, 15000);
  window.setTimeout(pollCredits, 2500);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") void pollCredits(); });
  window.addEventListener("online", () => void pollCredits());
}

export async function redeemCreditReward(rewardId: string): Promise<CreditSnapshot> {
  await loadCredits();
  if (current.redemptions.some((item) => item.rewardId === rewardId && item.status === "active")) return current;
  if (isDemo()) {
    const cost = DEMO_COSTS[rewardId];
    if (cost === undefined) throw new Error("Este recurso todavía no está disponible para canje.");
    const anniversaryBenefit = rewardId === "imdac-control-obra-30d";
    if (!anniversaryBenefit && current.balance < cost) throw new Error(`Te faltan ${cost - current.balance} créditos.`);
    const firstToolRedemption = rewardId.startsWith("tool-") && !current.redemptions.some((item) => item.type === "tool");
    const next = {
      ...current,
      balance: current.balance - cost,
      lifetimeSpent: current.lifetimeSpent + cost,
      redemptions: [...current.redemptions, {
        id: `demo-${rewardId}`,
        rewardId,
        type: rewardType(rewardId),
        points: cost,
        status: "active",
        createdAt: new Date().toISOString(),
        validUntil: rewardId === "imdac-control-obra-30d" ? new Date(Date.now() + 30 * 86400000).toISOString() : null
      }]
    };
    writeDemo(next);
    const published = publish(next);
    celebrateRedemption(rewardId, rewardType(rewardId));
    if (firstToolRedemption) window.dispatchEvent(new CustomEvent("imfra:first-tool-redemption", { detail: { rewardId } }));
    return published;
  }
  const response = await fetch(apiUrl("/credits/redeem"), {
    method: "POST",
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ rewardId })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "No pudimos completar el canje.");
  const snapshot = await loadCredits(true);
  if (data.alreadyUnlocked !== true) {
    celebrateRedemption(rewardId, data.redemption?.type || rewardType(rewardId));
  }
  if (data.firstToolRedemption === true) {
    window.dispatchEvent(new CustomEvent("imfra:first-tool-redemption", { detail: { rewardId } }));
  }
  return snapshot;
}

export async function awardCreditForCorrect(activityId: string, source: "quiz" | "inspector", selected: number): Promise<CreditSnapshot> {
  await loadCredits();
  if (!canEarnChallengeCredits()) return current;
  if (isDemo()) {
    const saved = readDemoState();
    const events = Array.isArray(saved.creditEvents) ? [...new Set(saved.creditEvents.map(String))] : [];
    if (events.includes(activityId)) return current;
    events.push(activityId);
    const next = { ...current, balance: current.balance + 25, lifetimeEarned: current.lifetimeEarned + 25 };
    writeDemo(next, events);
    return publish(next);
  }
  const response = await fetch(apiUrl("/credits/earn"), {
    method: "POST",
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ activityId, source, selected })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "No pudimos acreditar este acierto.");
  return loadCredits(true);
}

/** Gana un juego de obra: el primero de cada juego en el día suma créditos. Devuelve los créditos sumados. */
export async function awardGameCredit(game: string, board: number, amount: number): Promise<number> {
  await loadCredits();
  if (!canEarnChallengeCredits()) return 0;
  const day = new Date().toISOString().slice(0, 10);
  if (isDemo()) {
    const saved = readDemoState();
    const events = Array.isArray(saved.creditEvents) ? [...new Set(saved.creditEvents.map(String))] : [];
    const id = `juego:${day}:${game}`;
    if (events.includes(id)) return 0;
    events.push(id);
    const next = { ...current, balance: current.balance + amount, lifetimeEarned: current.lifetimeEarned + amount };
    writeDemo(next, events);
    publish(next);
    return amount;
  }
  const response = await fetch(apiUrl("/credits/game"), {
    method: "POST",
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ game, board })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "No pudimos acreditar este juego.");
  await loadCredits(true);
  return Number(data.credits) || 0;
}

window.IMFRACredits = {
  hydrate: loadCredits,
  snapshot: () => current,
  getBalance: () => current.balance,
  isLoaded: () => loaded,
  isUnlocked: (rewardId: string) => current.redemptions.some((item) => item.rewardId === rewardId && item.status === "active"),
  canEarn: canEarnChallengeCredits,
  challengeAccess: getChallengeAccess,
  startChallenge: startChallengeAttempt,
  completeChallenge: completeChallengeAttempt,
  redeem: redeemCreditReward,
  awardCorrect: awardCreditForCorrect,
  markNotificationsRead: markCreditNotificationsRead
};
window.dispatchEvent(new CustomEvent("imfra:credits-ready"));
startCreditPolling();
