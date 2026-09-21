import { currentUserId, firestore, isDemoMode } from "../shared/firestore";

export function isRewardsDemo() {
  return isDemoMode();
}

export async function loadRewardBalance(): Promise<number | null> {
  const fs = firestore();
  const uid = currentUserId();
  if (isRewardsDemo() || !uid || !fs?.db || !fs.doc || !fs.getDoc) return null;
  try {
    const snapshot = await fs.getDoc(fs.doc(fs.db, "reward_accounts", uid));
    if (!snapshot.exists()) return 0;
    return Math.max(0, Number(snapshot.data().balance) || 0);
  } catch (error) {
    console.warn("[rewards] No se pudo leer el saldo autoritativo", error);
    return null;
  }
}

export async function submitRewardRequest(rewardId: string) {
  const fs = firestore();
  const uid = currentUserId();
  if (isRewardsDemo()) return { id: crypto.randomUUID(), demo: true };
  if (!uid || !fs?.db || !fs.doc || !fs.setDoc || !fs.serverTimestamp) throw new Error("No hay una sesión segura disponible para solicitar el canje.");
  const requestKey = `${uid}:${rewardId}:${new Date().toISOString().slice(0, 10)}`;
  const requestId = requestKey.replace(/[^a-zA-Z0-9_-]/g, "_");
  await fs.setDoc(fs.doc(fs.db, "reward_requests", requestId), {
    uid,
    rewardId,
    requestKey,
    status: "pending",
    createdAt: fs.serverTimestamp(),
    source: "web"
  });
  return { id: requestId, demo: false };
}

export async function submitQuizAttempt(questionId: string, correct: boolean) {
  const fs = firestore();
  const uid = currentUserId();
  if (isRewardsDemo() || !uid || !fs?.db || !fs.doc || !fs.setDoc || !fs.serverTimestamp) return;
  const day = new Date().toISOString().slice(0, 10);
  const attemptId = `${uid}_${day}_${questionId}`.replace(/[^a-zA-Z0-9_-]/g, "_");
  await fs.setDoc(fs.doc(fs.db, "training_attempts", attemptId), {
    uid,
    activityId: `${day}:${questionId}`,
    activityType: "quiz",
    score: correct ? 1 : 0,
    total: 1,
    completedAt: fs.serverTimestamp(),
    version: 1
  });
}
