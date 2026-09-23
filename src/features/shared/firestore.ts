export interface FirestoreSnapshot {
  exists(): boolean;
  data(): Record<string, unknown>;
}

export interface FirestoreFacade {
  db: unknown;
  collection: (...args: unknown[]) => unknown;
  doc: (...args: unknown[]) => unknown;
  getDoc: (ref: unknown) => Promise<FirestoreSnapshot>;
  setDoc: (ref: unknown, data: Record<string, unknown>, options?: { merge: boolean }) => Promise<void>;
  addDoc: (ref: unknown, data: Record<string, unknown>) => Promise<{ id: string }>;
  serverTimestamp: () => unknown;
}

declare global {
  interface Window {
    __fs?: FirestoreFacade;
    UserState?: { uid?: string; email?: string; modo?: string; photoURL?: string; displayName?: string };
  }
}

export function firestore() {
  return window.__fs;
}

export function currentUserId() {
  return window.UserState?.uid || "";
}

export function isDemoMode() {
  return window.UserState?.modo === "demo" || new URLSearchParams(location.search).get("modo") === "demo";
}
