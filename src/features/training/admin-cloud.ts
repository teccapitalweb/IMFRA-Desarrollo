interface AdminFirestoreFacade {
  db: unknown;
  collection: (...args: unknown[]) => unknown;
  addDoc: (ref: unknown, data: Record<string, unknown>) => Promise<{ id: string }>;
  serverTimestamp: () => unknown;
}

declare global {
  interface Window {
    _fb?: AdminFirestoreFacade;
    __ADMIN_LOCAL_DEMO__?: boolean;
    __currentAdmin?: { uid?: string; email?: string; displayName?: string };
  }
}

export function isAdminDemo() {
  return Boolean(window.__ADMIN_LOCAL_DEMO__) || new URLSearchParams(location.search).get("modo") === "demo";
}

export async function saveTrainingDraft(input: { type: string; title: string; area: string }) {
  if (isAdminDemo()) return { id: crypto.randomUUID(), remote: false };
  const fs = window._fb;
  const admin = window.__currentAdmin;
  if (!fs?.db || !fs.collection || !fs.addDoc || !fs.serverTimestamp || !admin?.uid) {
    throw new Error("No hay una sesión administrativa segura disponible.");
  }
  const result = await fs.addDoc(fs.collection(fs.db, "training_drafts"), {
    ...input,
    status: "draft",
    createdAt: fs.serverTimestamp(),
    createdBy: admin.uid,
    createdByEmail: admin.email || ""
  });
  return { id: result.id, remote: true };
}
