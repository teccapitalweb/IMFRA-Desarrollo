export interface FirestoreSnapshot {
  exists(): boolean;
  data(): Record<string, unknown>;
}

export interface FirestoreFacade {
  db: unknown;
  collection: (...args: unknown[]) => unknown;
  doc: (...args: unknown[]) => unknown;
  getDoc: (ref: unknown) => Promise<FirestoreSnapshot>;
  getDocs: (ref: unknown) => Promise<unknown>;
  setDoc: (ref: unknown, data: Record<string, unknown>, options?: { merge: boolean }) => Promise<void>;
  updateDoc: (ref: unknown, data: Record<string, unknown>) => Promise<void>;
  deleteDoc: (ref: unknown) => Promise<void>;
  addDoc: (ref: unknown, data: Record<string, unknown>) => Promise<{ id: string }>;
  runTransaction: (...args: unknown[]) => Promise<unknown>;
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
