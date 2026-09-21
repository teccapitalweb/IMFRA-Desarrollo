import { currentUserId, firestore, isDemoMode } from "../shared/firestore";

export interface SyncTrainingState {
  xp: number;
  cases: Record<string, { score: number; completedAt: string }>;
  cards: Record<string, { confidence: number; lastReviewed: string; rewardDate?: string }>;
  days: string[];
}

export function isTrainingDemo() {
  return isDemoMode();
}

export async function loadTrainingProgress(): Promise<SyncTrainingState | null> {
  const fs = firestore();
  const uid = currentUserId();
  if (isTrainingDemo() || !uid || !fs?.db || !fs.doc || !fs.getDoc) return null;
  try {
    const snapshot = await fs.getDoc(fs.doc(fs.db, "training_progress", uid));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return {
      xp: Number(data.xpFormativo) || 0,
      cases: (data.cases || {}) as SyncTrainingState["cases"],
      cards: (data.cards || {}) as SyncTrainingState["cards"],
      days: Array.isArray(data.days) ? data.days.map(String).slice(-90) : []
    };
  } catch (error) {
    console.warn("[training] No se pudo cargar el progreso remoto", error);
    return null;
  }
}

export async function syncTrainingProgress(state: SyncTrainingState) {
  const fs = firestore();
  const uid = currentUserId();
  if (isTrainingDemo() || !uid || !fs?.db || !fs.doc || !fs.setDoc || !fs.serverTimestamp) return;
  try {
    await fs.setDoc(fs.doc(fs.db, "training_progress", uid), {
      uid,
      xpFormativo: Math.max(0, Math.min(100000, Math.round(state.xp))),
      cases: state.cases,
      cards: state.cards,
      days: [...new Set(state.days)].slice(-90),
      version: 1,
      updatedAt: fs.serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.warn("[training] Progreso conservado localmente; sincronización pendiente", error);
  }
}

export function mergeTrainingProgress(local: SyncTrainingState, remote: SyncTrainingState): SyncTrainingState {
  const cases = { ...local.cases };
  Object.entries(remote.cases).forEach(([id, value]) => {
    const current = cases[id];
    if (!current || value.score > current.score || value.completedAt > current.completedAt) cases[id] = value;
  });
  const cards = { ...local.cards };
  Object.entries(remote.cards).forEach(([id, value]) => {
    const current = cards[id];
    if (!current || value.confidence > current.confidence || value.lastReviewed > current.lastReviewed) cards[id] = value;
  });
  return {
    xp: Math.max(local.xp, remote.xp),
    cases,
    cards,
    days: [...new Set([...local.days, ...remote.days])].sort().slice(-90)
  };
}
