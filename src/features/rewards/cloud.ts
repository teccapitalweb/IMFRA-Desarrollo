import { currentUserId, firestore, isDemoMode } from "../shared/firestore";
import { awardCreditForCorrect, loadCredits } from "../credits/credits";

export function isRewardsDemo() {
  return isDemoMode();
}

export async function loadRewardBalance(): Promise<number | null> {
  try {
    return (await loadCredits()).balance;
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

export async function submitQuizAttempt(questionId: string, correct: boolean, selected: number) {
  const fs = firestore();
  const uid = currentUserId();
  const day = new Date().toISOString().slice(0, 10);
  if (!isRewardsDemo() && uid && fs?.db && fs.doc && fs.setDoc && fs.serverTimestamp) {
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
  return correct ? awardCreditForCorrect(`${day}:${questionId}`, "quiz", selected) : loadCredits();
}
