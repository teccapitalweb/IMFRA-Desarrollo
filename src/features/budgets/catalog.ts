import type { Apu, BudgetWorkspace, Supply, SupplyCategory } from './types';

const today = () => new Date().toISOString().slice(0, 10);
const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const emptyApu = (): Apu => ({ items: [], indirects: 0, financing: 0, utility: 0, additional: 0 });

export const PROJECT_TYPES = ['Casa habitación', 'Edificación', 'Nave industrial', 'Urbanización', 'Carreteras', 'Obra hidráulica', 'Obra eléctrica', 'Obra civil', 'Remodelación', 'Otro'];
export const UNITS = ['pza', 'm', 'm²', 'm³', 'kg', 't', 'l', 'saco', 'jor', 'h', 'lote'];
export const CATEGORY_LABELS: Record<SupplyCategory, string> = {
  materials: 'Materiales', labor: 'Mano de obra', machinery: 'Maquinaria', equipment: 'Equipo', tools: 'Herramienta', auxiliaries: 'Auxiliares'
};

export function emptyWorkspace(): BudgetWorkspace {
  return { schemaVersion: 1, sections: [], concepts: [], supplies: [], generators: [], indirectCosts: { office: 0, field: 0, financing: 0, utility: 0, additional: 0 }, notes: '' };
}

export function houseTemplate(): BudgetWorkspace {
  const workspace = emptyWorkspace();
  const names = ['Preliminares', 'Cimentación', 'Estructura', 'Albañilería', 'Instalación hidráulica', 'Instalación sanitaria', 'Instalación eléctrica', 'Acabados', 'Carpintería', 'Limpieza'];
  workspace.sections = names.map((name, index) => ({ id: id('section'), parentId: '', key: String(index + 1).padStart(2, '0'), name, order: index }));
  return workspace;
}

export function templateWorkspace(template: string): BudgetWorkspace {
  if (template === 'house') return houseTemplate();
  const groups: Record<string, string[]> = {
    industrial: ['Preliminares', 'Terracerías', 'Cimentación', 'Estructura metálica', 'Cubierta', 'Pisos industriales', 'Instalaciones', 'Obra exterior', 'Cierre de obra'],
    urbanization: ['Preliminares', 'Movimiento de tierras', 'Red hidráulica', 'Drenaje sanitario', 'Drenaje pluvial', 'Pavimentos', 'Alumbrado', 'Señalización', 'Jardinería'],
    remodeling: ['Protecciones', 'Demoliciones', 'Obra civil', 'Instalaciones', 'Acabados', 'Carpintería', 'Limpieza y entrega'],
    civil: ['Preliminares', 'Terracerías', 'Cimentaciones', 'Estructuras', 'Albañilería', 'Instalaciones', 'Acabados', 'Obras complementarias']
  };
  const workspace = emptyWorkspace();
  workspace.sections = (groups[template] || []).map((name, index) => ({ id: id('section'), parentId: '', key: String(index + 1).padStart(2, '0'), name, order: index }));
  return workspace;
}

const librarySupply = (key: string, name: string, category: SupplyCategory, unit: string, price: number): Supply => ({ id: id('supply'), key, name, category, unit, price, supplier: 'Precio de referencia IMFRA', updatedDate: today(), notes: 'Verifica el precio para tu ciudad y fecha de presupuesto.' });

export const BASE_SUPPLIES: Supply[] = [
  librarySupply('CEM-001', 'Cemento CPC 30R', 'materials', 'saco', 245),
  librarySupply('ARE-001', 'Arena media', 'materials', 'm³', 480),
  librarySupply('GRA-001', 'Grava 3/4"', 'materials', 'm³', 620),
  librarySupply('BLO-015', 'Block hueco 15 × 20 × 40 cm', 'materials', 'pza', 19.8),
  librarySupply('ACE-3/8', 'Varilla corrugada 3/8"', 'materials', 'kg', 24.5),
  librarySupply('MO-ALB', 'Cuadrilla de albañilería', 'labor', 'jor', 1450),
  librarySupply('MO-FIE', 'Fierrero + ayudante', 'labor', 'jor', 1720),
  librarySupply('EQ-REV', 'Revolvedora de un saco', 'equipment', 'h', 185),
  librarySupply('EQ-VIB', 'Vibrador para concreto', 'equipment', 'h', 95)
];

export interface LibraryConcept { name: string; unit: string; key: string; apu: Array<{ supplyKey: string; quantity: number }>; }
export const CONCEPT_LIBRARY: LibraryConcept[] = [
  { key: 'MUR-012', name: 'Muro de block de 12 cm', unit: 'm²', apu: [{ supplyKey: 'BLO-015', quantity: 12.5 }, { supplyKey: 'CEM-001', quantity: .12 }, { supplyKey: 'ARE-001', quantity: .025 }, { supplyKey: 'MO-ALB', quantity: .12 }] },
  { key: 'MUR-015', name: 'Muro de block de 15 cm', unit: 'm²', apu: [{ supplyKey: 'BLO-015', quantity: 12.5 }, { supplyKey: 'CEM-001', quantity: .14 }, { supplyKey: 'ARE-001', quantity: .03 }, { supplyKey: 'MO-ALB', quantity: .14 }] },
  { key: 'MUR-020', name: 'Muro de block de 20 cm', unit: 'm²', apu: [{ supplyKey: 'BLO-015', quantity: 12.5 }, { supplyKey: 'CEM-001', quantity: .16 }, { supplyKey: 'ARE-001', quantity: .035 }, { supplyKey: 'MO-ALB', quantity: .16 }] },
  { key: 'CON-250', name: "Concreto f'c=250 kg/cm² hecho en obra", unit: 'm³', apu: [{ supplyKey: 'CEM-001', quantity: 7 }, { supplyKey: 'ARE-001', quantity: .55 }, { supplyKey: 'GRA-001', quantity: .7 }, { supplyKey: 'MO-ALB', quantity: .18 }, { supplyKey: 'EQ-REV', quantity: 1.1 }, { supplyKey: 'EQ-VIB', quantity: .3 }] },
  { key: 'ACE-HAB', name: 'Acero de refuerzo habilitado y colocado', unit: 'kg', apu: [{ supplyKey: 'ACE-3/8', quantity: 1.05 }, { supplyKey: 'MO-FIE', quantity: .012 }] }
];

export function apuFromLibrary(item: LibraryConcept, supplies: Supply[]) {
  return {
    items: item.apu.map(entry => {
      const supply = supplies.find(candidate => candidate.key === entry.supplyKey) || BASE_SUPPLIES.find(candidate => candidate.key === entry.supplyKey)!;
      return { id: id('apu-item'), supplyId: supply.id, category: supply.category, key: supply.key, description: supply.name, unit: supply.unit, quantity: entry.quantity, price: supply.price };
    }),
    indirects: 0, financing: 0, utility: 0, additional: 0
  } satisfies Apu;
}

export { emptyApu };
