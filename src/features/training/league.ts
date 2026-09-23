export interface LeagueEntry {
  uid: string;
  name: string;
  photoURL: string;
  courses: number;
  classes: number;
  xp: number;
  rank: number;
}

export interface LeagueSnapshot {
  entries: LeagueEntry[];
  current: LeagueEntry | null;
  participants: number;
}

declare global {
  interface Window {
    WEBHOOK_URL?: string;
    __currentUser?: { getIdToken(): Promise<string> };
    IMFRAActivitySnapshot?: () => { completedCourses: number; viewedClasses: number };
  }
}

async function request(path: string, init: RequestInit = {}) {
  const token = await window.__currentUser?.getIdToken();
  if (!token || !window.WEBHOOK_URL) throw new Error("Sesión no disponible");
  const response = await fetch(`${window.WEBHOOK_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init.headers || {}) }
  });
  if (!response.ok) throw new Error(`Clasificación no disponible (${response.status})`);
  return response;
}

export async function syncLeagueProfile() {
  const activity = window.IMFRAActivitySnapshot?.() || { completedCourses: 0, viewedClasses: 0 };
  await request("/league/sync", { method: "POST", body: JSON.stringify(activity) });
}

export async function loadLeague(): Promise<LeagueSnapshot | null> {
  try {
    const response = await request("/league");
    return await response.json() as LeagueSnapshot;
  } catch (error) {
    console.warn("[training] No se pudo cargar la clasificación", error);
    return null;
  }
}
