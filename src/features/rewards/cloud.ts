import { isDemoMode } from "../shared/firestore";
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

export async function submitQuizAttempt(questionId: string, correct: boolean, selected: number) {
  const day = new Date().toISOString().slice(0, 10);
  return correct ? awardCreditForCorrect(`${day}:${questionId}`, "quiz", selected) : loadCredits();
}
