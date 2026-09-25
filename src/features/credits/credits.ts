export interface CreditRedemption {
  id: string;
  rewardId: string;
  type: string;
  points: number;
  status: string;
  createdAt?: string | null;
}

export interface CreditSnapshot {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  redemptions: CreditRedemption[];
}

interface DemoRewardState {
  points?: number;
  creditUnlocks?: string[];
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
      redeem(rewardId: string): Promise<CreditSnapshot>;
      awardCorrect(activityId: string, source: "quiz" | "inspector", selected: number): Promise<CreditSnapshot>;
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
  "material-1": 160,
  "material-2": 175,
  "material-3": 190,
  "material-4": 205,
  "material-5": 220,
  "material-6": 240,
  "material-7": 260,
  "book-advanced-mechanics": 220,
  "book-advanced-strength": 200,
  "book-resistencia-materiales": 150
};
const EMPTY: CreditSnapshot = { balance: 0, lifetimeEarned: 0, lifetimeSpent: 0, redemptions: [] };
let current: CreditSnapshot = { ...EMPTY };
let loaded = false;
let loading: Promise<CreditSnapshot> | null = null;
let identity = "";

function isDemo() {
  return window.UserState?.modo === "demo" || new URLSearchParams(location.search).get("modo") === "demo";
}

function currentIdentity() {
  return isDemo() ? "demo-preview-v8" : (window.UserState?.uid || window.UserState?.email || "guest");
}

function demoStorageKey() {
  return `imfra:v2:rewards:${currentIdentity()}`;
}

function readDemoState(): DemoRewardState {
  try {
    return JSON.parse(localStorage.getItem(demoStorageKey()) || "null") || { points: 120 };
  } catch {
    return { points: 120 };
  }
}

function demoSnapshot() {
  const saved = readDemoState();
  const unlocks = Array.isArray(saved.creditUnlocks) ? [...new Set(saved.creditUnlocks.map(String))] : [];
  return {
    balance: Math.max(0, Number(saved.points ?? 120) || 0),
    lifetimeEarned: 120,
    lifetimeSpent: 0,
    redemptions: unlocks.map((rewardId) => ({
      id: `demo-${rewardId}`,
      rewardId,
      type: rewardId.startsWith("tool-") ? "tool" : rewardId.startsWith("material-") ? "material" : "book",
      points: DEMO_COSTS[rewardId] || 0,
      status: "active"
    }))
  } satisfies CreditSnapshot;
}

function writeDemo(snapshot: CreditSnapshot, eventIds?: string[]) {
  const saved = readDemoState();
  saved.points = snapshot.balance;
  saved.creditUnlocks = snapshot.redemptions.filter((item) => item.status === "active").map((item) => item.rewardId);
  if (eventIds) saved.creditEvents = eventIds;
  localStorage.setItem(demoStorageKey(), JSON.stringify(saved));
}

function publish(snapshot: CreditSnapshot) {
  current = {
    balance: Math.max(0, Number(snapshot.balance) || 0),
    lifetimeEarned: Math.max(0, Number(snapshot.lifetimeEarned) || 0),
    lifetimeSpent: Math.max(0, Number(snapshot.lifetimeSpent) || 0),
    redemptions: Array.isArray(snapshot.redemptions) ? snapshot.redemptions : []
  };
  loaded = true;
  window.dispatchEvent(new CustomEvent("imfra:credits-changed", { detail: current }));
  return current;
}

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
  }
  if (!force && loaded) return current;
  if (!force && loading) return loading;
  loading = (async () => {
    if (isDemo()) return publish(demoSnapshot());
    if (nextIdentity === "guest" || window.UserState?.modo === "invitado") return publish({ ...EMPTY });
    const response = await fetch(apiUrl("/credits/me"), { headers: { Authorization: `Bearer ${await token()}` } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "No pudimos cargar tus Créditos IMFRA.");
    return publish(data as CreditSnapshot);
  })().finally(() => { loading = null; });
  return loading;
}

export async function redeemCreditReward(rewardId: string): Promise<CreditSnapshot> {
  await loadCredits();
  if (current.redemptions.some((item) => item.rewardId === rewardId && item.status === "active")) return current;
  if (isDemo()) {
    const cost = DEMO_COSTS[rewardId];
    if (!cost) throw new Error("Este recurso todavía no está disponible para canje.");
    if (current.balance < cost) throw new Error(`Te faltan ${cost - current.balance} créditos.`);
    const firstToolRedemption = rewardId.startsWith("tool-") && !current.redemptions.some((item) => item.type === "tool");
    const next = {
      ...current,
      balance: current.balance - cost,
      lifetimeSpent: current.lifetimeSpent + cost,
      redemptions: [...current.redemptions, {
        id: `demo-${rewardId}`,
        rewardId,
        type: rewardId.startsWith("tool-") ? "tool" : rewardId.startsWith("material-") ? "material" : "book",
        points: cost,
        status: "active",
        createdAt: new Date().toISOString()
      }]
    };
    writeDemo(next);
    const published = publish(next);
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
  if (data.firstToolRedemption === true) {
    window.dispatchEvent(new CustomEvent("imfra:first-tool-redemption", { detail: { rewardId } }));
  }
  return snapshot;
}

export async function awardCreditForCorrect(activityId: string, source: "quiz" | "inspector", selected: number): Promise<CreditSnapshot> {
  await loadCredits();
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

window.IMFRACredits = {
  hydrate: loadCredits,
  snapshot: () => current,
  getBalance: () => current.balance,
  isLoaded: () => loaded,
  isUnlocked: (rewardId: string) => current.redemptions.some((item) => item.rewardId === rewardId && item.status === "active"),
  redeem: redeemCreditReward,
  awardCorrect: awardCreditForCorrect
};
window.dispatchEvent(new CustomEvent("imfra:credits-ready"));
