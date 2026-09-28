import type { Apu, BudgetConcept, BudgetTotals, BudgetWorkspace, ExplosionRow, Generator, SupplyCategory } from './types';

export const round4 = (value: number) => Math.round((Number(value) || 0) * 10000) / 10000;
export const n = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
export const pct = (value: unknown) => Math.min(100, Math.max(0, n(value)));

export function calculateApu(apu: Apu) {
  const categories: SupplyCategory[] = ['materials', 'labor', 'machinery', 'equipment', 'tools', 'auxiliaries'];
  const byCategory = Object.fromEntries(categories.map(category => [category, 0])) as Record<SupplyCategory, number>;
  for (const item of apu.items || []) byCategory[item.category] = round4(byCategory[item.category] + n(item.quantity) * n(item.price));
  const direct = round4(Object.values(byCategory).reduce((sum, value) => sum + value, 0));
  let running = direct;
  const indirects = round4(running * pct(apu.indirects) / 100); running = round4(running + indirects);
  const financing = round4(running * pct(apu.financing) / 100); running = round4(running + financing);
  const utility = round4(running * pct(apu.utility) / 100); running = round4(running + utility);
  const additional = round4(running * pct(apu.additional) / 100); running = round4(running + additional);
  return { byCategory, direct, indirects, financing, utility, additional, unitPrice: running };
}

export function conceptUnitPrice(concept: BudgetConcept) {
  return concept.apu?.items?.length ? calculateApu(concept.apu).unitPrice : round4(n(concept.unitPrice));
}

export function calculateWorkspace(workspace: BudgetWorkspace, vat = 16): BudgetTotals {
  const sectionTotals = Object.fromEntries(workspace.sections.map(section => [section.id, 0])) as Record<string, number>;
  let direct = 0;
  for (const concept of workspace.concepts) {
    const amount = round4(n(concept.quantity) * conceptUnitPrice(concept));
    direct = round4(direct + amount);
    sectionTotals[concept.sectionId] = round4((sectionTotals[concept.sectionId] || 0) + amount);
  }
  const costs = workspace.indirectCosts;
  const indirects = round4(direct * (pct(costs.office) + pct(costs.field)) / 100);
  const financing = round4((direct + indirects) * pct(costs.financing) / 100);
  const utility = round4((direct + indirects + financing) * pct(costs.utility) / 100);
  const additional = round4((direct + indirects + financing + utility) * pct(costs.additional) / 100);
  const subtotal = round4(direct + indirects + financing + utility + additional);
  const vatAmount = round4(subtotal * pct(vat) / 100);
  return { direct, indirects, financing, utility, additional, subtotal, vat: vatAmount, total: round4(subtotal + vatAmount), sectionTotals };
}

export function evaluateGenerator(generator: Generator) {
  const values: Record<string, number> = {
    length: n(generator.length), width: n(generator.width, 1), height: n(generator.height, 1),
    pieces: n(generator.pieces, 1), factor: n(generator.factor, 1), largo: n(generator.length),
    ancho: n(generator.width, 1), alto: n(generator.height, 1), piezas: n(generator.pieces, 1)
  };
  const expression = String(generator.formula || 'length*width*height*pieces*factor').toLowerCase().replace(/,/g, '.');
  if (!/^[a-z0-9_+\-*/().\s]+$/.test(expression)) return 0;
  const replaced = expression.replace(/[a-z_]+/g, token => Object.hasOwn(values, token) ? String(values[token]) : '0');
  try {
    // La expresión ya está limitada a números y operadores aritméticos.
    const value = Function(`"use strict";return (${replaced})`)();
    return Math.max(0, round4(n(value)));
  } catch { return 0; }
}

export function explosion(workspace: BudgetWorkspace, sectionId = ''): ExplosionRow[] {
  const result = new Map<string, ExplosionRow>();
  const concepts = workspace.concepts.filter(concept => !sectionId || concept.sectionId === sectionId);
  for (const concept of concepts) {
    for (const item of concept.apu?.items || []) {
      const identity = item.supplyId || `${item.category}:${item.key}:${item.description}`;
      const quantity = round4(n(item.quantity) * n(concept.quantity));
      const current = result.get(identity) || { key: item.key, name: item.description, category: item.category, unit: item.unit, quantity: 0, price: n(item.price), amount: 0 };
      current.quantity = round4(current.quantity + quantity);
      current.amount = round4(current.quantity * current.price);
      result.set(identity, current);
    }
  }
  return [...result.values()].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

export function cloneWorkspace(workspace: BudgetWorkspace): BudgetWorkspace {
  return structuredClone(workspace);
}

export function money(value: number, currency = 'MXN') {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n(value));
}

export const quantity = (value: number) => new Intl.NumberFormat('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 4 }).format(n(value));
