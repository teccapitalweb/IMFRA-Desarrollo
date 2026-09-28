export type ProjectState = 'draft' | 'review' | 'approved' | 'closed';
export type SupplyCategory = 'materials' | 'labor' | 'machinery' | 'equipment' | 'tools' | 'auxiliaries';

export interface BudgetProject {
  id: string;
  name: string;
  client: string;
  location: string;
  manager: string;
  date: string;
  currency: 'MXN' | 'USD';
  vat: number;
  description: string;
  type: string;
  state: ProjectState;
  amount: number;
  conceptCount: number;
  sectionCount: number;
  revision: number;
  archived?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface BudgetSection {
  id: string;
  parentId: string;
  key: string;
  name: string;
  order: number;
}

export interface ApuItem {
  id: string;
  supplyId: string;
  category: SupplyCategory;
  key: string;
  description: string;
  unit: string;
  quantity: number;
  price: number;
}

export interface Apu {
  items: ApuItem[];
  indirects: number;
  financing: number;
  utility: number;
  additional: number;
}

export interface BudgetConcept {
  id: string;
  sectionId: string;
  key: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  order: number;
  apu: Apu;
}

export interface Supply {
  id: string;
  key: string;
  name: string;
  category: SupplyCategory;
  unit: string;
  price: number;
  supplier: string;
  updatedDate: string;
  notes: string;
}

export interface Generator {
  id: string;
  conceptId: string;
  location: string;
  axis: string;
  section: string;
  description: string;
  length: number;
  width: number;
  height: number;
  pieces: number;
  factor: number;
  formula: string;
  result: number;
}

export interface IndirectCosts {
  office: number;
  field: number;
  financing: number;
  utility: number;
  additional: number;
}

export interface BudgetWorkspace {
  schemaVersion: number;
  sections: BudgetSection[];
  concepts: BudgetConcept[];
  supplies: Supply[];
  generators: Generator[];
  indirectCosts: IndirectCosts;
  notes: string;
}

export interface BudgetTotals {
  direct: number;
  indirects: number;
  financing: number;
  utility: number;
  additional: number;
  subtotal: number;
  vat: number;
  total: number;
  sectionTotals: Record<string, number>;
}

export interface ProjectPayload {
  project: BudgetProject;
  workspace: BudgetWorkspace;
  totals: BudgetTotals;
  revision: number;
}

export interface BudgetVersion {
  id: string;
  name: string;
  note?: string;
  sourceRevision?: number;
  createdAt: string;
  totals?: BudgetTotals;
  workspace?: BudgetWorkspace;
}

export type BudgetTab = 'summary' | 'budget' | 'apu' | 'supplies' | 'generators' | 'explosion' | 'reports' | 'settings';

export interface ExplosionRow {
  key: string;
  name: string;
  category: SupplyCategory;
  unit: string;
  quantity: number;
  price: number;
  amount: number;
}
