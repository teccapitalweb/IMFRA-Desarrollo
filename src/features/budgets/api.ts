import { calculateWorkspace, cloneWorkspace } from './calculations';
import { BASE_SUPPLIES, emptyApu, houseTemplate } from './catalog';
import type { BudgetProject, BudgetVersion, BudgetWorkspace, ProjectPayload } from './types';

declare global {
  interface Window {
    WEBHOOK_URL?: string;
    __currentUser?: { getIdToken(): Promise<string> };
    UserState?: { uid?: string; email?: string; modo?: string; photoURL?: string; displayName?: string };
  }
}

const isDemo = () => window.UserState?.modo === 'demo' || new URLSearchParams(location.search).get('modo') === 'demo';
const apiUrl = (path: string) => `${window.WEBHOOK_URL || 'https://imfra-backend-production.up.railway.app'}${path}`;
const demoKey = () => `imfra:v2:budget-demo:${window.UserState?.uid || window.UserState?.email || 'preview'}`;
const clone = <T>(value: T): T => structuredClone(value);

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await window.__currentUser?.getIdToken?.();
  if (!token) throw new Error('Inicia sesión para usar el Software profesional de presupuestos.');
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = Object.assign(new Error(data.error || 'No pudimos completar la operación.'), { status: response.status, code: data.code, revision: data.revision });
    throw error;
  }
  return data as T;
}

function initialDemo() {
  const workspace = houseTemplate();
  workspace.sections = workspace.sections.filter((_, index) => [0, 1, 2, 3, 7].includes(index));
  workspace.supplies = clone(BASE_SUPPLIES.slice(0, 6));
  const section = (index: number) => workspace.sections[index]?.id || workspace.sections[0].id;
  workspace.concepts = [
    { id: crypto.randomUUID(), sectionId: section(0), key: 'PRE-001', description: 'Limpieza y trazo del terreno', unit: 'm²', quantity: 350, unitPrice: 18.5, order: 0, apu: emptyApu() },
    { id: crypto.randomUUID(), sectionId: section(1), key: 'CIM-001', description: 'Excavación en cepas por medios manuales', unit: 'm³', quantity: 42, unitPrice: 285, order: 1, apu: emptyApu() },
    { id: crypto.randomUUID(), sectionId: section(2), key: 'EST-001', description: "Concreto f'c=250 kg/cm² en elementos estructurales", unit: 'm³', quantity: 28, unitPrice: 0, order: 2, apu: {
      items: workspace.supplies.slice(0, 3).map((supply, index) => ({ id: crypto.randomUUID(), supplyId: supply.id, category: supply.category, key: supply.key, description: supply.name, unit: supply.unit, quantity: [7, .55, .7][index], price: supply.price })),
      indirects: 10, financing: 2, utility: 8, additional: 0
    } },
    { id: crypto.randomUUID(), sectionId: section(3), key: 'ALB-001', description: 'Muro de block hueco de 15 cm', unit: 'm²', quantity: 185, unitPrice: 680, order: 3, apu: emptyApu() },
    { id: crypto.randomUUID(), sectionId: section(4), key: 'ACA-001', description: 'Aplanado fino en muros', unit: 'm²', quantity: 310, unitPrice: 195, order: 4, apu: emptyApu() }
  ];
  workspace.indirectCosts = { office: 6, field: 4, financing: 2, utility: 8, additional: 0 };
  const now = new Date().toISOString();
  const project: BudgetProject = {
    id: 'casa-habitacion-demo', name: 'CASA HABITACIÓN DEMO', client: 'Proyecto demostrativo', location: 'México', manager: 'Equipo IMFRA', date: now.slice(0, 10), currency: 'MXN', vat: 16,
    description: 'Proyecto precargado para conocer el flujo profesional de presupuestos IMFRA.', type: 'Casa habitación', state: 'draft', amount: 0, conceptCount: workspace.concepts.length, sectionCount: workspace.sections.length, revision: 1, createdAt: now, updatedAt: now
  };
  project.amount = calculateWorkspace(workspace, project.vat).total;
  return { projects: [project], workspaces: { [project.id]: workspace }, versions: {} as Record<string, BudgetVersion[]> };
}

type DemoData = ReturnType<typeof initialDemo>;
function readDemo(): DemoData {
  try { return JSON.parse(localStorage.getItem(demoKey()) || 'null') || initialDemo(); }
  catch { return initialDemo(); }
}
function writeDemo(data: DemoData) { localStorage.setItem(demoKey(), JSON.stringify(data)); }

export async function hasAccess() {
  if (isDemo()) {
    await window.IMFRACredits?.hydrate();
    return window.IMFRACredits?.isUnlocked('software-presupuestos') === true;
  }
  return (await request<{ unlocked: boolean }>('/budgets/access')).unlocked;
}

export async function listProjects() {
  if (isDemo()) return clone(readDemo().projects.filter(project => !project.archived));
  return (await request<{ projects: BudgetProject[] }>('/budgets/projects')).projects;
}

export async function createProject(input: Partial<BudgetProject> & { template?: string }) {
  if (!isDemo()) return (await request<{ project: BudgetProject }>('/budgets/projects', { method: 'POST', body: JSON.stringify(input) })).project;
  const data = readDemo();
  const id = `project-${crypto.randomUUID()}`;
  const workspace = input.template === 'house' ? houseTemplate() : input.template === 'demo' ? initialDemo().workspaces['casa-habitacion-demo'] : houseTemplate();
  if (input.template !== 'house' && input.template !== 'demo') workspace.sections = [];
  const now = new Date().toISOString();
  const project: BudgetProject = { id, name: input.name || 'Proyecto sin nombre', client: input.client || '', location: input.location || '', manager: input.manager || '', date: input.date || now.slice(0, 10), currency: input.currency || 'MXN', vat: Number(input.vat ?? 16), description: input.description || '', type: input.type || 'Otro', state: input.state || 'draft', amount: 0, conceptCount: workspace.concepts.length, sectionCount: workspace.sections.length, revision: 1, createdAt: now, updatedAt: now };
  data.projects.unshift(project); data.workspaces[id] = clone(workspace); writeDemo(data); return clone(project);
}

export async function getProject(projectId: string): Promise<ProjectPayload> {
  if (!isDemo()) return request(`/budgets/projects/${encodeURIComponent(projectId)}`);
  const data = readDemo(); const project = data.projects.find(item => item.id === projectId); const workspace = data.workspaces[projectId];
  if (!project || !workspace) throw new Error('Proyecto no encontrado');
  return { project: clone(project), workspace: clone(workspace), totals: calculateWorkspace(workspace, project.vat), revision: project.revision };
}

export async function updateProject(projectId: string, changes: Partial<BudgetProject>) {
  if (!isDemo()) return (await request<{ project: BudgetProject }>(`/budgets/projects/${encodeURIComponent(projectId)}`, { method: 'PATCH', body: JSON.stringify(changes) })).project;
  const data = readDemo(); const project = data.projects.find(item => item.id === projectId); if (!project) throw new Error('Proyecto no encontrado');
  Object.assign(project, changes, { updatedAt: new Date().toISOString() }); writeDemo(data); return clone(project);
}

export async function saveWorkspace(projectId: string, workspace: BudgetWorkspace, expectedRevision: number) {
  if (!isDemo()) return request<{ revision: number; savedAt: string }>(`/budgets/projects/${encodeURIComponent(projectId)}/workspace`, { method: 'PUT', body: JSON.stringify({ workspace, expectedRevision }) });
  const data = readDemo(); const project = data.projects.find(item => item.id === projectId); if (!project) throw new Error('Proyecto no encontrado');
  data.workspaces[projectId] = clone(workspace); project.revision += 1; project.updatedAt = new Date().toISOString(); project.amount = calculateWorkspace(workspace, project.vat).total; project.conceptCount = workspace.concepts.length; project.sectionCount = workspace.sections.length; writeDemo(data);
  return { revision: project.revision, savedAt: project.updatedAt };
}

export async function duplicateProject(projectId: string) {
  if (!isDemo()) return (await request<{ project: BudgetProject }>(`/budgets/projects/${encodeURIComponent(projectId)}/duplicate`, { method: 'POST' })).project;
  const source = await getProject(projectId);
  return createProject({ ...source.project, name: `${source.project.name} · Copia`, state: 'draft', template: 'blank' }).then(project => {
    const data = readDemo();
    data.workspaces[project.id] = clone(source.workspace);
    const stored = data.projects.find(item => item.id === project.id)!;
    stored.amount = calculateWorkspace(source.workspace, stored.vat).total;
    stored.conceptCount = source.workspace.concepts.length;
    stored.sectionCount = source.workspace.sections.length;
    stored.updatedAt = new Date().toISOString();
    writeDemo(data);
    return clone(stored);
  });
}

export async function archiveProject(projectId: string) {
  if (!isDemo()) return request(`/budgets/projects/${encodeURIComponent(projectId)}/archive`, { method: 'POST', body: JSON.stringify({ archived: true }) });
  await updateProject(projectId, { archived: true }); return { archived: true };
}

export async function deleteProject(projectId: string) {
  if (!isDemo()) return request(`/budgets/projects/${encodeURIComponent(projectId)}`, { method: 'DELETE' });
  const data = readDemo(); data.projects = data.projects.filter(project => project.id !== projectId); delete data.workspaces[projectId]; delete data.versions[projectId]; writeDemo(data); return { deleted: true };
}

export async function listVersions(projectId: string) {
  if (!isDemo()) return (await request<{ versions: BudgetVersion[] }>(`/budgets/projects/${encodeURIComponent(projectId)}/versions`)).versions;
  return clone(readDemo().versions[projectId] || []);
}

export async function createVersion(projectId: string, name: string, note: string, workspace: BudgetWorkspace) {
  if (!isDemo()) return (await request<{ version: BudgetVersion }>(`/budgets/projects/${encodeURIComponent(projectId)}/versions`, { method: 'POST', body: JSON.stringify({ name, note, workspace }) })).version;
  const data = readDemo(); const version: BudgetVersion = { id: crypto.randomUUID(), name, note, createdAt: new Date().toISOString(), workspace: clone(workspace) }; data.versions[projectId] ||= []; data.versions[projectId].unshift(version); writeDemo(data); return clone(version);
}

export async function getVersion(projectId: string, versionId: string) {
  if (!isDemo()) return (await request<{ version: BudgetVersion }>(`/budgets/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}`)).version;
  const version = (readDemo().versions[projectId] || []).find(item => item.id === versionId); if (!version) throw new Error('Versión no encontrada'); return clone(version);
}

export async function registerReport(projectId: string, type: string, format: string) {
  if (isDemo()) return { registered: true };
  return request(`/budgets/projects/${encodeURIComponent(projectId)}/reports`, { method: 'POST', body: JSON.stringify({ type, format }) });
}
