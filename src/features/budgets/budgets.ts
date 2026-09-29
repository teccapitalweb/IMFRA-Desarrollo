import './budgets.css';
import * as api from './api';
import { calculateApu, calculateWorkspace, cloneWorkspace, conceptUnitPrice, evaluateGenerator, explosion, money, n, quantity } from './calculations';
import { BASE_SUPPLIES, CATEGORY_LABELS, CONCEPT_LIBRARY, PROJECT_TYPES, UNITS, apuFromLibrary, emptyApu, templateWorkspace } from './catalog';
import type { ApuItem, BudgetConcept, BudgetProject, BudgetTab, BudgetVersion, BudgetWorkspace, Generator, ProjectPayload, Supply, SupplyCategory } from './types';

declare global {
  interface Window {
    IMFRABudgets: { mount(container: HTMLElement): void };
    navigateToSection?: (section: string, options?: { reemplazar?: boolean }) => void;
    Toast?: { success(title: string, message?: string): void; error(title: string, message?: string): void; info(title: string, message?: string): void };
  }
}

const REWARD_ID = 'software-presupuestos';
const CATEGORIES = Object.keys(CATEGORY_LABELS) as SupplyCategory[];
const REPORTS = [
  ['budget', 'Presupuesto general', 'Partidas, conceptos, cantidades, precios e importe total.'],
  ['catalog', 'Catálogo de conceptos', 'Catálogo limpio para licitación o revisión.'],
  ['apu', 'Análisis de precios unitarios', 'Integración detallada de cada precio unitario.'],
  ['explosion', 'Explosión de insumos', 'Cantidades consolidadas para compras y contratación.'],
  ['sections', 'Resumen por partidas', 'Participación e importe de cada capítulo.'],
  ['materials', 'Materiales', 'Requerimientos de materiales y su importe.'],
  ['labor', 'Mano de obra', 'Recursos humanos derivados de los APU.'],
  ['equipment', 'Maquinaria y equipo', 'Equipos, herramientas y maquinaria requeridos.'],
  ['generators', 'Números generadores', 'Memoria de cálculo y cantidades aplicadas.'],
  ['financial', 'Resumen financiero', 'Costo directo, indirectos, utilidad, IVA y total.']
] as const;

type ModalState = { type: string; data?: Record<string, any> } | null;
type SaveState = 'saved' | 'saving' | 'error';

const esc = (value: unknown) => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] || char);
const attr = esc;
const uid = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const icon = (name: string) => `<svg class="ic" aria-hidden="true"><use href="#${name}"/></svg>`;
const today = () => new Date().toISOString().slice(0, 10);
const stateLabel = (state: BudgetProject['state']) => ({ draft: 'Borrador', review: 'En revisión', approved: 'Aprobado', closed: 'Cerrado' })[state];
const dateLabel = (value?: string | null) => {
  if (!value) return '—';
  const localValue = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value;
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(localValue));
};
const field = (name: string, label: string, value: unknown, options: { type?: string; required?: boolean; wide?: boolean; placeholder?: string; step?: string } = {}) => `<label class="bu-field ${options.wide ? 'bu-field--wide' : ''}"><span>${esc(label)}</span><input name="${attr(name)}" type="${options.type || 'text'}" value="${attr(value)}" ${options.required ? 'required' : ''} ${options.placeholder ? `placeholder="${attr(options.placeholder)}"` : ''} ${options.step ? `step="${options.step}"` : ''}></label>`;
const selectField = (name: string, label: string, value: string, values: Array<string | [string, string]>, wide = false) => `<label class="bu-field ${wide ? 'bu-field--wide' : ''}"><span>${esc(label)}</span><select name="${attr(name)}">${values.map(entry => { const [optionValue, optionLabel] = Array.isArray(entry) ? entry : [entry, entry]; return `<option value="${attr(optionValue)}" ${value === optionValue ? 'selected' : ''}>${esc(optionLabel)}</option>`; }).join('')}</select></label>`;

class BudgetApplication {
  root!: HTMLElement;
  projects: BudgetProject[] = [];
  active: ProjectPayload | null = null;
  tab: BudgetTab = 'summary';
  modal: ModalState = null;
  filter = '';
  stateFilter = 'all';
  globalQuery = '';
  supplyFilter: SupplyCategory | 'all' = 'all';
  explosionSection = '';
  activeConceptId = '';
  versions: BudgetVersion[] = [];
  history: BudgetWorkspace[] = [];
  future: BudgetWorkspace[] = [];
  saveState: SaveState = 'saved';
  saveMessage = 'Guardado';
  saveTimer = 0;
  renderTimer = 0;
  draggedConcept = '';
  importRows: Array<Record<string, unknown>> = [];

  async mount(container: HTMLElement) {
    this.root = container;
    this.active = null;
    this.modal = null;
    this.renderLoading('Comprobando tu acceso…');
    try {
      if (!(await api.hasAccess())) {
        this.root.innerHTML = `<div class="budget-app"><div class="bu-access"><span class="bu-access__icon">${icon('i-lock')}</span><h2>Software de presupuestos</h2><p>Desbloquéalo con 350 Créditos IMFRA desde Retos para empezar a crear proyectos.</p><button class="bu-button bu-button--accent" data-action="go-rewards">Ir a Recompensas IMFRA</button></div></div>`;
        this.bind();
        window.Toast?.info('Acceso protegido', 'Desbloquea Software de presupuestos con tus créditos IMFRA para utilizar esta herramienta.');
        window.setTimeout(() => {
          if (location.hash === '#presupuestos') window.navigateToSection?.('entrenamiento');
        }, 1200);
        return;
      }
      this.renderLoading('Preparando tus proyectos…');
      this.projects = await api.listProjects();
      this.render();
    } catch (error) {
      this.renderError(error instanceof Error ? error.message : 'No pudimos iniciar el software.');
    }
  }

  renderLoading(message: string) {
    this.root.innerHTML = `<div class="budget-app"><div class="bu-loading"><span class="bu-spinner"></span><strong>${esc(message)}</strong><small>IMFRA · Presupuestos de obra</small></div></div>`;
  }

  renderError(message: string) {
    this.root.innerHTML = `<div class="budget-app"><div class="bu-access"><span class="bu-access__icon">${icon('i-alert-circle')}</span><h2>No pudimos abrir el módulo</h2><p>${esc(message)}</p><button class="bu-button bu-button--accent" data-action="retry">Intentar de nuevo</button></div></div>`;
    this.bind();
  }

  render() {
    this.root.innerHTML = `<div class="budget-app">${this.active ? this.renderWorkspace() : this.renderProjects()}${this.renderModal()}</div>`;
    this.bind();
  }

  renderProjects() {
    const query = this.filter.trim().toLowerCase();
    const filtered = this.projects.filter(project => (!query || `${project.name} ${project.client} ${project.location}`.toLowerCase().includes(query)) && (this.stateFilter === 'all' || project.state === this.stateFilter));
    return `
      <div class="bu-module-nav">
        <button class="bu-module-back" type="button" data-action="exit-software" aria-label="Volver a Retos">${icon('i-arrow-left')}<span>Volver a Retos</span></button>
        <span class="bu-module-status"><i></i> Software desbloqueado</span>
      </div>
      <section class="bu-hero">
        <div class="bu-hero__copy"><span class="bu-kicker">Software profesional IMFRA</span><h1>Presupuestos de obra</h1><p>Gestiona proyectos, costos, precios unitarios, insumos y presupuestos desde un solo lugar.</p></div>
        <div class="bu-hero__actions"><button class="bu-button bu-button--dark" data-action="new-project">${icon('i-plus')} Nuevo proyecto</button></div>
      </section>
      <div class="bu-toolbar">
        <div class="bu-toolbar__group" style="flex:1"><label class="bu-search">${icon('i-search')}<input data-project-filter value="${attr(this.filter)}" placeholder="Buscar proyecto, cliente o ubicación…"></label><select class="bu-select" data-state-filter><option value="all">Todos los estados</option>${(['draft','review','approved','closed'] as const).map(state => `<option value="${state}" ${this.stateFilter === state ? 'selected' : ''}>${stateLabel(state)}</option>`).join('')}</select></div>
        <span class="bu-count">${filtered.length} proyecto${filtered.length === 1 ? '' : 's'}</span>
      </div>
      ${filtered.length ? `<div class="bu-projects">${filtered.map(project => this.renderProjectCard(project)).join('')}</div>` : `<section class="bu-panel bu-empty"><span class="bu-empty__icon">${icon('i-folder')}</span><h3>No encontramos proyectos</h3><p>Ajusta los filtros o crea un nuevo presupuesto para comenzar.</p><button class="bu-button bu-button--accent" data-action="new-project">Nuevo proyecto</button></section>`}`;
  }

  renderProjectCard(project: BudgetProject) {
    return `<article class="bu-project" data-project="${attr(project.id)}">
      <div class="bu-project__top"><span class="bu-project__mark">${esc(project.name.slice(0, 2).toUpperCase())}</span><div><span class="bu-status bu-status--${project.state}">${stateLabel(project.state)}</span><h3>${esc(project.name)}</h3><span class="bu-project__client">${esc(project.client || 'Sin cliente')} · ${esc(project.location || 'Ubicación pendiente')}</span></div></div>
      <div class="bu-project__actions">
        <button class="bu-icon-button" data-action="open-project" data-id="${attr(project.id)}" title="Abrir">${icon('i-arrow-right')}</button>
        <button class="bu-icon-button" data-action="rename-project" data-id="${attr(project.id)}" title="Renombrar">${icon('i-edit')}</button>
        <button class="bu-icon-button" data-action="duplicate-project" data-id="${attr(project.id)}" title="Duplicar">${icon('i-copy')}</button>
        <button class="bu-icon-button" data-action="archive-project" data-id="${attr(project.id)}" title="Archivar">${icon('i-archive')}</button>
        <button class="bu-icon-button" data-action="delete-project" data-id="${attr(project.id)}" title="Eliminar">${icon('i-trash')}</button>
      </div>
      <div class="bu-project__meta"><div><span>Importe</span><strong>${money(project.amount, project.currency)}</strong></div><div><span>Conceptos</span><strong>${project.conceptCount}</strong></div><div><span>Fecha</span><strong>${dateLabel(project.date)}</strong></div><div><span>Última modificación</span><strong>${dateLabel(project.updatedAt)}</strong></div></div>
    </article>`;
  }

  renderWorkspace() {
    const { project, workspace } = this.active!;
    const globalResults = this.globalResults();
    return `
      <div class="bu-workspace-head">
        <button class="bu-back" data-action="back-projects" aria-label="Volver a proyectos">${icon('i-arrow-left')}</button>
        <div class="bu-workspace-title"><h1>${esc(project.name)}</h1><div><span>${esc(project.client || 'Sin cliente')}</span><span>·</span><span class="bu-status bu-status--${project.state}">${stateLabel(project.state)}</span><span>·</span><span>Versión de trabajo ${this.active!.revision}</span></div></div>
        <div class="bu-toolbar__group">
          <span class="bu-save-state is-${this.saveState}">${esc(this.saveMessage)}</span>
          <button class="bu-icon-button" data-action="undo" ${this.history.length ? '' : 'disabled'} title="Deshacer">${icon('i-undo')}</button>
          <button class="bu-icon-button" data-action="redo" ${this.future.length ? '' : 'disabled'} title="Rehacer">${icon('i-redo')}</button>
          <label class="bu-search bu-search--global">${icon('i-search')}<input data-global-search value="${attr(this.globalQuery)}" placeholder="Buscar clave, concepto o insumo…">${this.globalQuery ? `<div class="bu-global-results">${globalResults.length ? globalResults.slice(0, 9).map(result => `<button class="bu-search-result" data-action="global-result" data-kind="${result.kind}" data-id="${attr(result.id)}"><b>${result.kind === 'concept' ? 'CON' : result.kind === 'supply' ? 'INS' : 'PAR'}</b><span><strong>${esc(result.label)}</strong><small>${esc(result.meta)}</small></span></button>`).join('') : '<div class="bu-toast-note">Sin coincidencias.</div>'}</div>` : ''}</label>
        </div>
      </div>
      <nav class="bu-tabs" aria-label="Módulos del proyecto">${this.renderTabs()}</nav>
      ${this.renderActiveTab()}`;
  }

  renderTabs() {
    const tabs: Array<[BudgetTab,string,string]> = [
      ['summary','Resumen','i-chart-bar'],['budget','Presupuesto','i-news'],['apu','APU','i-calculator'],['supplies','Insumos','i-cube'],['generators','Generadores','i-ruler'],['explosion','Explosión de insumos','i-layers'],['reports','Reportes','i-download'],['settings','Configuración','i-settings']
    ];
    return tabs.map(([id,label,ico]) => `<button class="bu-tab ${this.tab === id ? 'is-active' : ''}" data-action="tab" data-tab="${id}">${icon(ico)}${label}</button>`).join('');
  }

  renderActiveTab() {
    switch (this.tab) {
      case 'budget': return this.renderBudget();
      case 'apu': return this.renderApu();
      case 'supplies': return this.renderSupplies();
      case 'generators': return this.renderGenerators();
      case 'explosion': return this.renderExplosion();
      case 'reports': return this.renderReports();
      case 'settings': return this.renderSettings();
      default: return this.renderSummary();
    }
  }

  renderSummary() {
    const { project, workspace } = this.active!;
    const totals = calculateWorkspace(workspace, project.vat);
    const apuCategoryTotals = { materials: 0, labor: 0, equipment: 0 };
    for (const concept of workspace.concepts) {
      const apu = calculateApu(concept.apu);
      apuCategoryTotals.materials += apu.byCategory.materials * concept.quantity;
      apuCategoryTotals.labor += apu.byCategory.labor * concept.quantity;
      apuCategoryTotals.equipment += (apu.byCategory.equipment + apu.byCategory.machinery + apu.byCategory.tools) * concept.quantity;
    }
    const chart = [
      ['Materiales', apuCategoryTotals.materials, '#f59d1a'],['Mano de obra', apuCategoryTotals.labor, '#3b82f6'],['Equipo', apuCategoryTotals.equipment, '#8b5cf6'],['Indirectos', totals.indirects, '#159a6e']
    ] as const;
    const max = Math.max(...chart.map(item => item[1]), 1);
    const recent = [...workspace.concepts].sort((a,b) => b.order - a.order).slice(0,5);
    return `<div class="bu-kpis">
      ${[['Presupuesto total',totals.total,'total'],['Costo directo',totals.direct,''],['Indirectos',totals.indirects,''],['Utilidad',totals.utility,''],['IVA',totals.vat,''],['Total final',totals.total,'total']].map(([label,value,kind]) => `<article class="bu-kpi ${kind ? 'bu-kpi--total' : ''}"><span>${label}</span><strong>${money(Number(value),project.currency)}</strong></article>`).join('')}
    </div><div class="bu-summary-grid">
      <section class="bu-panel"><header class="bu-panel__head"><div><h2>Distribución de costos</h2><p>Composición calculada desde los análisis de precios unitarios.</p></div></header><div class="bu-panel__body bu-cost-chart">${chart.map(([label,value,color]) => `<div class="bu-cost-row"><span>${label}</span><i style="--chart-color:${color}"><b style="width:${Math.min(100,value/max*100)}%"></b></i><strong>${money(value,project.currency)}</strong></div>`).join('')}</div></section>
      <section class="bu-panel"><header class="bu-panel__head"><div><h2>Estado del proyecto</h2><p>${workspace.sections.length} partidas · ${workspace.concepts.length} conceptos</p></div><span class="bu-status bu-status--${project.state}">${stateLabel(project.state)}</span></header><div class="bu-panel__body bu-recent">${recent.length ? recent.map(concept => `<div class="bu-recent__item"><b>${esc(concept.key)}</b><span><strong>${esc(concept.description)}</strong><small>${quantity(concept.quantity)} ${esc(concept.unit)}</small></span><strong>${money(concept.quantity*conceptUnitPrice(concept),project.currency)}</strong></div>`).join('') : '<div class="bu-empty" style="min-height:170px"><p>Agrega conceptos para ver actividad reciente.</p></div>'}</div></section>
    </div>`;
  }

  renderBudget() {
    const { project, workspace } = this.active!;
    const totals = calculateWorkspace(workspace, project.vat);
    const sections = [...workspace.sections].sort((a,b) => a.order-b.order);
    return `<section class="bu-panel">
      <header class="bu-panel__head"><div><h2>Presupuesto editable</h2><p>Organiza partidas, subpartidas y conceptos. Los importes se calculan automáticamente.</p></div><div class="bu-toolbar__group"><button class="bu-button bu-button--small" data-action="import-excel">${icon('i-upload')} Importar Excel</button><button class="bu-button bu-button--small" data-action="concept-library">${icon('i-search')} Biblioteca</button><button class="bu-button bu-button--small" data-action="add-section">${icon('i-plus')} Partida</button><button class="bu-button bu-button--accent bu-button--small" data-action="add-concept" ${sections.length ? '' : 'disabled'}>${icon('i-plus')} Concepto</button></div></header>
      ${sections.length ? `<div class="bu-table-wrap"><table class="bu-table"><thead><tr><th style="width:105px">Clave</th><th>Concepto</th><th style="width:75px">Unidad</th><th class="is-number" style="width:105px">Cantidad</th><th class="is-number" style="width:130px">Precio unitario</th><th class="is-number" style="width:140px">Importe</th><th style="width:135px;text-align:right">Acciones</th></tr></thead><tbody>${sections.filter(section=>!section.parentId).map(section => this.renderBudgetSection(section.id, totals.sectionTotals)).join('')}<tr class="bu-total-row"><td colspan="5" style="text-align:right">TOTAL GENERAL</td><td class="is-number">${money(totals.total,project.currency)}</td><td></td></tr></tbody></table></div>` : `<div class="bu-empty"><span class="bu-empty__icon">${icon('i-layers')}</span><h3>Crea la estructura del presupuesto</h3><p>Empieza con una partida o usa una plantilla profesional desde Configuración.</p><button class="bu-button bu-button--accent" data-action="add-section">Crear primera partida</button></div>`}
    </section>`;
  }

  renderBudgetSection(sectionId: string, totals: Record<string,number>, child = false): string {
    const workspace = this.active!.workspace;
    const section = workspace.sections.find(item => item.id === sectionId)!;
    const concepts = workspace.concepts.filter(item => item.sectionId === sectionId).sort((a,b)=>a.order-b.order);
    const children = workspace.sections.filter(item => item.parentId === sectionId).sort((a,b)=>a.order-b.order);
    const childrenTotal = children.reduce((sum,item)=>sum+(totals[item.id]||0),0);
    const subtotal = (totals[section.id] || 0) + childrenTotal;
    return `<tr class="bu-section-row ${child ? 'bu-subsection-row' : ''}" data-drop-section="${attr(section.id)}"><td colspan="4"><span class="bu-section-row__title"><b>${esc(section.key)}</b>${esc(section.name)}</span></td><td class="is-number">Subtotal</td><td class="is-number">${money(subtotal,this.active!.project.currency)}</td><td><div class="bu-table__actions"><button class="bu-icon-button" data-action="add-concept-section" data-id="${attr(section.id)}" title="Agregar concepto">${icon('i-plus')}</button>${!child ? `<button class="bu-icon-button" data-action="add-subsection" data-id="${attr(section.id)}" title="Agregar subpartida">${icon('i-layers')}</button>` : ''}<button class="bu-icon-button" data-action="edit-section" data-id="${attr(section.id)}" title="Editar">${icon('i-edit')}</button><button class="bu-icon-button" data-action="delete-section" data-id="${attr(section.id)}" title="Eliminar">${icon('i-trash')}</button></div></td></tr>
      ${concepts.map(concept => this.renderConceptRow(concept)).join('')}${children.map(item => this.renderBudgetSection(item.id,totals,true)).join('')}`;
  }

  renderConceptRow(concept: BudgetConcept) {
    const unitPrice = conceptUnitPrice(concept);
    return `<tr draggable="true" data-drag-concept="${attr(concept.id)}" data-drop-concept="${attr(concept.id)}"><td><span class="bu-drag">⋮⋮</span> <input class="bu-inline-input" data-concept-field="key" data-id="${attr(concept.id)}" value="${attr(concept.key)}"></td><td><input class="bu-inline-input" data-concept-field="description" data-id="${attr(concept.id)}" value="${attr(concept.description)}"></td><td><input class="bu-inline-input" data-concept-field="unit" data-id="${attr(concept.id)}" value="${attr(concept.unit)}"></td><td><input class="bu-inline-input bu-inline-input--number" data-concept-field="quantity" data-id="${attr(concept.id)}" type="number" min="0" step="0.0001" value="${concept.quantity}"></td><td><input class="bu-inline-input bu-inline-input--number" data-concept-field="unitPrice" data-id="${attr(concept.id)}" type="number" min="0" step="0.0001" value="${unitPrice}" ${concept.apu.items.length ? 'disabled title="Calculado desde APU"' : ''}></td><td class="is-number"><strong>${money(concept.quantity*unitPrice,this.active!.project.currency)}</strong></td><td><div class="bu-table__actions"><button class="bu-icon-button" data-action="open-apu" data-id="${attr(concept.id)}" title="Abrir APU">${icon('i-calculator')}</button><button class="bu-icon-button" data-action="duplicate-concept" data-id="${attr(concept.id)}" title="Duplicar">${icon('i-copy')}</button><button class="bu-icon-button" data-action="move-concept" data-id="${attr(concept.id)}" title="Mover">${icon('i-arrow-right')}</button><button class="bu-icon-button" data-action="delete-concept" data-id="${attr(concept.id)}" title="Eliminar">${icon('i-trash')}</button></div></td></tr>`;
  }

  renderApu() {
    const workspace = this.active!.workspace;
    if (!workspace.concepts.length) return `<section class="bu-panel bu-empty"><span class="bu-empty__icon">${icon('i-calculator')}</span><h3>Aún no hay conceptos</h3><p>Crea un concepto en Presupuesto para integrar su análisis de precio unitario.</p><button class="bu-button bu-button--accent" data-action="tab" data-tab="budget">Ir a Presupuesto</button></section>`;
    const concept = workspace.concepts.find(item=>item.id===this.activeConceptId) || workspace.concepts[0];
    this.activeConceptId = concept.id;
    const result = calculateApu(concept.apu);
    return `<div class="bu-split"><section class="bu-panel"><header class="bu-panel__head"><div><h3>Conceptos</h3><p>Selecciona uno para editar su APU.</p></div></header><div class="bu-side-list">${workspace.concepts.map(item=>`<button class="bu-side-item ${item.id===concept.id?'is-active':''}" data-action="select-concept" data-id="${attr(item.id)}"><strong>${esc(item.description)}</strong><small>${esc(item.key)} · ${esc(item.unit)}</small></button>`).join('')}</div></section>
      <section class="bu-panel"><div class="bu-apu-identity"><div><span class="bu-kicker">Análisis de precio unitario</span><h2>${esc(concept.description)}</h2><small>${esc(concept.key)} · Unidad ${esc(concept.unit)}</small></div><strong>${money(result.unitPrice,this.active!.project.currency)}</strong></div>
      ${CATEGORIES.map(category => this.renderApuGroup(concept,category)).join('')}
      <div class="bu-percentages">${(['indirects','financing','utility','additional'] as const).map(key=>`<label class="bu-field"><span>${({indirects:'Indirectos',financing:'Financiamiento',utility:'Utilidad',additional:'Cargos adicionales'})[key]} %</span><input type="number" min="0" max="100" step="0.0001" data-apu-percent="${key}" data-id="${attr(concept.id)}" value="${concept.apu[key]}"></label>`).join('')}</div>
      <div class="bu-apu-total">${[['Materiales',result.byCategory.materials],['Mano de obra',result.byCategory.labor],['Equipo',result.byCategory.equipment+result.byCategory.machinery],['Costo directo',result.direct],['Precio unitario final',result.unitPrice]].map(([label,value])=>`<div><span>${label}</span><strong>${money(Number(value),this.active!.project.currency)}</strong></div>`).join('')}</div></section></div>`;
  }

  renderApuGroup(concept: BudgetConcept, category: SupplyCategory) {
    const items = concept.apu.items.filter(item=>item.category===category);
    return `<section class="bu-apu-group"><div class="bu-apu-group__head"><h3>${CATEGORY_LABELS[category]}</h3><button class="bu-button bu-button--small" data-action="add-apu-item" data-concept="${attr(concept.id)}" data-category="${category}">${icon('i-plus')} Agregar</button></div>${items.length?`<div class="bu-table-wrap"><table class="bu-table" style="min-width:650px"><thead><tr><th>Clave</th><th>Descripción</th><th>Unidad</th><th class="is-number">Cantidad</th><th class="is-number">Precio</th><th class="is-number">Importe</th><th></th></tr></thead><tbody>${items.map(item=>`<tr><td>${esc(item.key)}</td><td>${esc(item.description)}</td><td>${esc(item.unit)}</td><td><input class="bu-inline-input bu-inline-input--number" type="number" step="0.0001" min="0" data-apu-item-field="quantity" data-concept="${attr(concept.id)}" data-id="${attr(item.id)}" value="${item.quantity}"></td><td><input class="bu-inline-input bu-inline-input--number" type="number" step="0.0001" min="0" data-apu-item-field="price" data-concept="${attr(concept.id)}" data-id="${attr(item.id)}" value="${item.price}"></td><td class="is-number">${money(item.quantity*item.price,this.active!.project.currency)}</td><td><button class="bu-icon-button" data-action="delete-apu-item" data-concept="${attr(concept.id)}" data-id="${attr(item.id)}">${icon('i-trash')}</button></td></tr>`).join('')}</tbody></table></div>`:`<div class="bu-toast-note">Sin insumos de ${CATEGORY_LABELS[category].toLowerCase()}.</div>`}</section>`;
  }

  renderSupplies() {
    const supplies = this.active!.workspace.supplies.filter(item=>this.supplyFilter==='all'||item.category===this.supplyFilter);
    return `<section class="bu-panel"><header class="bu-panel__head"><div><h2>Biblioteca de insumos</h2><p>Recursos reutilizables para cualquier análisis del proyecto.</p></div><div class="bu-toolbar__group"><select class="bu-select" data-supply-filter><option value="all">Todas las categorías</option>${CATEGORIES.map(category=>`<option value="${category}" ${this.supplyFilter===category?'selected':''}>${CATEGORY_LABELS[category]}</option>`).join('')}</select><button class="bu-button" data-action="load-base-supplies">${icon('i-layers')} Catálogo base</button><button class="bu-button bu-button--accent" data-action="add-supply">${icon('i-plus')} Nuevo insumo</button></div></header><div class="bu-panel__body">${supplies.length?`<div class="bu-card-grid">${supplies.map(supply=>this.renderSupplyCard(supply)).join('')}</div>`:`<div class="bu-empty"><span class="bu-empty__icon">${icon('i-cube')}</span><h3>Sin insumos en esta categoría</h3><p>Agrega uno manualmente o carga el catálogo base IMFRA.</p></div>`}</div></section>`;
  }

  renderSupplyCard(supply: Supply) {
    return `<article class="bu-resource-card"><div class="bu-resource-card__top"><span class="bu-resource-card__icon">${esc(supply.key.slice(0,3))}</span><div class="bu-resource-card__actions"><button class="bu-icon-button" data-action="edit-supply" data-id="${attr(supply.id)}">${icon('i-edit')}</button><button class="bu-icon-button" data-action="duplicate-supply" data-id="${attr(supply.id)}">${icon('i-copy')}</button><button class="bu-icon-button" data-action="delete-supply" data-id="${attr(supply.id)}">${icon('i-trash')}</button></div></div><div><h3>${esc(supply.name)}</h3><p>${esc(CATEGORY_LABELS[supply.category])} · ${esc(supply.supplier||'Sin proveedor')}</p></div><strong class="bu-resource-card__price">${money(supply.price,this.active!.project.currency)} / ${esc(supply.unit)}</strong><div class="bu-resource-card__meta"><span>${esc(supply.key)}</span><span>Actualizado ${dateLabel(supply.updatedDate)}</span></div></article>`;
  }

  renderGenerators() {
    const { workspace } = this.active!;
    return `<section class="bu-panel"><header class="bu-panel__head"><div><h2>Números generadores</h2><p>Documenta mediciones, usa fórmulas y aplica el resultado al concepto.</p></div><button class="bu-button bu-button--accent" data-action="add-generator" ${workspace.concepts.length?'':'disabled'}>${icon('i-plus')} Nuevo generador</button></header>${workspace.generators.length?`<div>${workspace.generators.map(generator=>this.renderGenerator(generator)).join('')}</div>`:`<div class="bu-empty"><span class="bu-empty__icon">${icon('i-ruler')}</span><h3>Sin generadores</h3><p>Agrega un generador y relaciónalo con un concepto del presupuesto.</p></div>`}</section>`;
  }

  renderGenerator(generator: Generator) {
    const result = evaluateGenerator(generator);
    const concept = this.active!.workspace.concepts.find(item=>item.id===generator.conceptId);
    const numField=(key:keyof Generator,label:string,value:number)=>`<label class="bu-field"><span>${label}</span><input type="number" step="0.0001" data-generator-field="${key}" data-id="${attr(generator.id)}" value="${value}"></label>`;
    const textField=(key:keyof Generator,label:string,value:string,wide=false)=>`<label class="bu-field ${wide?'bu-field--wide':''}"><span>${label}</span><input data-generator-field="${key}" data-id="${attr(generator.id)}" value="${attr(value)}"></label>`;
    return `<article class="bu-generator">
      <div class="bu-generator__identity">
        <label class="bu-field"><span>Concepto</span><select data-generator-field="conceptId" data-id="${attr(generator.id)}">${this.active!.workspace.concepts.map(item=>`<option value="${attr(item.id)}" ${item.id===generator.conceptId?'selected':''}>${esc(item.key)} · ${esc(item.description)}</option>`).join('')}</select></label>
        ${textField('location','Ubicación',generator.location)}${textField('axis','Eje',generator.axis)}${textField('section','Tramo',generator.section)}${textField('description','Descripción de la medición',generator.description,true)}
      </div>
      <div class="bu-generator__measurements">${numField('length','Largo',generator.length)}${numField('width','Ancho',generator.width)}${numField('height','Alto',generator.height)}${numField('pieces','N.º de piezas',generator.pieces)}${numField('factor','Factor',generator.factor)}<label class="bu-field bu-generator__formula"><span>Fórmula</span><input data-generator-field="formula" data-id="${attr(generator.id)}" value="${attr(generator.formula)}"></label><div class="bu-generator__result"><span>Cantidad generada</span><strong>${quantity(result)} ${esc(concept?.unit||'')}</strong><button class="bu-button bu-button--accent bu-button--small" data-action="apply-generator" data-id="${attr(generator.id)}">Aplicar al concepto</button></div><button class="bu-icon-button bu-generator__delete" data-action="delete-generator" data-id="${attr(generator.id)}" title="Eliminar generador">${icon('i-trash')}</button></div>
    </article>`;
  }

  renderExplosion() {
    const rows = explosion(this.active!.workspace,this.explosionSection);
    const total = rows.reduce((sum,row)=>sum+row.amount,0);
    return `<section class="bu-panel"><header class="bu-panel__head"><div><h2>Explosión de insumos</h2><p>Consolidación automática de todos los APU del presupuesto.</p></div><select class="bu-select" data-explosion-section><option value="">Todas las partidas</option>${this.active!.workspace.sections.map(section=>`<option value="${attr(section.id)}" ${this.explosionSection===section.id?'selected':''}>${esc(section.key)} · ${esc(section.name)}</option>`).join('')}</select></header>${rows.length?`<div class="bu-table-wrap"><table class="bu-table"><thead><tr><th>Clave</th><th>Insumo</th><th>Categoría</th><th>Unidad</th><th class="is-number">Cantidad total</th><th class="is-number">Precio unitario</th><th class="is-number">Importe total</th></tr></thead><tbody>${rows.map(row=>`<tr><td>${esc(row.key)}</td><td>${esc(row.name)}</td><td>${esc(CATEGORY_LABELS[row.category])}</td><td>${esc(row.unit)}</td><td class="is-number">${quantity(row.quantity)}</td><td class="is-number">${money(row.price,this.active!.project.currency)}</td><td class="is-number"><strong>${money(row.amount,this.active!.project.currency)}</strong></td></tr>`).join('')}<tr class="bu-total-row"><td colspan="6" style="text-align:right">TOTAL INSUMOS</td><td class="is-number">${money(total,this.active!.project.currency)}</td></tr></tbody></table></div>`:`<div class="bu-empty"><span class="bu-empty__icon">${icon('i-layers')}</span><h3>Aún no hay insumos por explotar</h3><p>Integra APU en tus conceptos y esta vista consolidará sus cantidades.</p><button class="bu-button bu-button--accent" data-action="tab" data-tab="apu">Ir a APU</button></div>`}</section>`;
  }

  renderReports() {
    return `<section class="bu-panel"><header class="bu-panel__head"><div><h2>Centro de reportes</h2><p>Vista previa, PDF profesional, Excel e impresión.</p></div><button class="bu-button" data-action="export-excel">${icon('i-download')} Exportar presupuesto Excel</button></header><div class="bu-panel__body bu-report-grid">${REPORTS.map(([id,title,description])=>`<article class="bu-report"><span class="bu-report__icon">${icon(id==='financial'?'i-chart-bar':id==='generators'?'i-ruler':'i-news')}</span><h3>${title}</h3><p>${description}</p><div class="bu-report__actions"><button class="bu-button bu-button--small" data-action="preview-report" data-report="${id}">Ver</button><button class="bu-button bu-button--small" data-action="pdf-report" data-report="${id}">PDF</button><button class="bu-button bu-button--small" data-action="excel-report" data-report="${id}">Excel</button><button class="bu-button bu-button--small" data-action="print-report" data-report="${id}">Imprimir</button></div></article>`).join('')}</div></section>`;
  }

  renderSettings() {
    const { project, workspace } = this.active!;
    return `<div class="bu-settings"><section class="bu-panel"><header class="bu-panel__head"><div><h2>Configuración del proyecto</h2><p>Datos generales, estado, moneda e impuestos.</p></div></header><form class="bu-panel__body bu-form-grid" data-form="project-settings">${field('name','Nombre del proyecto',project.name,{required:true,wide:true})}${field('client','Cliente',project.client)}${field('location','Ubicación',project.location)}${field('manager','Responsable',project.manager)}${field('date','Fecha',project.date,{type:'date'})}${selectField('currency','Moneda',project.currency,['MXN','USD'])}${field('vat','IVA %',project.vat,{type:'number',step:'0.0001'})}${selectField('type','Tipo de obra',project.type,PROJECT_TYPES)}${selectField('state','Estado',project.state,[['draft','Borrador'],['review','En revisión'],['approved','Aprobado'],['closed','Cerrado']])}<label class="bu-field bu-field--wide"><span>Descripción</span><textarea name="description">${esc(project.description)}</textarea></label><button class="bu-button bu-button--accent bu-field--wide" type="submit">Actualizar proyecto</button></form></section>
      <div style="display:grid;gap:14px"><section class="bu-panel"><header class="bu-panel__head"><div><h2>Costos indirectos</h2><p>Se aplican secuencialmente sobre el costo directo.</p></div></header><div class="bu-panel__body bu-indirects">${([['office','Oficina central'],['field','Indirectos de campo'],['financing','Financiamiento'],['utility','Utilidad'],['additional','Cargos adicionales']] as const).map(([key,label])=>`<label class="bu-field"><span>${label} %</span><input type="number" min="0" max="100" step="0.0001" data-indirect-field="${key}" value="${workspace.indirectCosts[key]}"></label>`).join('')}</div></section>
      <section class="bu-panel"><header class="bu-panel__head"><div><h2>Versiones históricas</h2><p>Crea cortes inmutables sin sobrescribir el historial.</p></div><button class="bu-button bu-button--small" data-action="create-version">${icon('i-plus')} Nueva versión</button></header><div class="bu-panel__body bu-version-list">${this.versions.length?this.versions.map(version=>`<div class="bu-version"><span><strong>${esc(version.name)}</strong><small>${dateLabel(version.createdAt)}${version.note?` · ${esc(version.note)}`:''}</small></span><button class="bu-button bu-button--small" data-action="view-version" data-id="${attr(version.id)}">Consultar</button></div>`).join(''):'<div class="bu-toast-note">Aún no hay versiones guardadas.</div>'}</div></section></div></div>`;
  }

  globalResults() {
    if (!this.active || !this.globalQuery.trim()) return [];
    const query = this.globalQuery.trim().toLowerCase();
    return [
      ...this.active.workspace.sections.filter(item=>`${item.key} ${item.name}`.toLowerCase().includes(query)).map(item=>({kind:'section',id:item.id,label:item.name,meta:item.key})),
      ...this.active.workspace.concepts.filter(item=>`${item.key} ${item.description}`.toLowerCase().includes(query)).map(item=>({kind:'concept',id:item.id,label:item.description,meta:item.key})),
      ...this.active.workspace.supplies.filter(item=>`${item.key} ${item.name}`.toLowerCase().includes(query)).map(item=>({kind:'supply',id:item.id,label:item.name,meta:item.key}))
    ];
  }

  renderModal() {
    if (!this.modal) return '';
    const close = `<button class="bu-close" data-action="close-modal" aria-label="Cerrar">×</button>`;
    const shell = (title:string,subtitle:string,body:string,footer:string,wide=false,modalIcon='i-calculator') => `<div class="bu-modal-backdrop" data-action="modal-backdrop"><section class="bu-modal ${wide?'bu-modal--wide':''}" role="dialog" aria-modal="true" aria-labelledby="bu-modal-title"><header class="bu-modal__head"><span class="bu-modal__mark">${icon(modalIcon)}</span><div class="bu-modal__heading"><span class="bu-modal__eyebrow">IMFRA · Presupuestos</span><h2 id="bu-modal-title">${esc(title)}</h2><p>${esc(subtitle)}</p></div>${close}</header>${body}${footer}</section></div>`;
    const data = this.modal.data || {};
    if (this.modal.type === 'new-project') return shell('Crear nuevo proyecto','Define los datos base. Podrás ajustarlos después desde Configuración.',`<form data-form="new-project" class="bu-project-form"><div class="bu-modal__body bu-new-project"><section class="bu-form-section"><header class="bu-form-section__head"><span>${icon('i-folder')}</span><div><strong>Información del proyecto</strong><small>Identifica la obra y a sus responsables.</small></div></header><div class="bu-form-grid">${field('name','Nombre del proyecto','',{required:true,wide:true,placeholder:'Ej. Residencia San Ángel'})}${field('client','Cliente','',{placeholder:'Nombre o razón social'})}${field('location','Ubicación','',{placeholder:'Ciudad, estado'})}${field('manager','Responsable',window.UserState?.displayName||'')}${field('date','Fecha',today(),{type:'date'})}</div></section><section class="bu-form-section"><header class="bu-form-section__head"><span>${icon('i-settings')}</span><div><strong>Configuración inicial</strong><small>Elige moneda, impuestos y una estructura de partida.</small></div></header><div class="bu-form-grid">${selectField('currency','Moneda','MXN',['MXN','USD'])}${field('vat','IVA %',16,{type:'number',step:'0.0001'})}${selectField('type','Tipo de obra','Casa habitación',PROJECT_TYPES)}${selectField('template','Crear desde plantilla','blank',[['blank','Proyecto en blanco'],['house','Casa habitación'],['industrial','Nave industrial'],['urbanization','Urbanización'],['remodeling','Remodelación'],['civil','Obra civil general']])}</div></section><label class="bu-field bu-field--wide bu-description-field"><span>Descripción del alcance</span><textarea name="description" placeholder="Describe brevemente el alcance general del proyecto"></textarea></label></div><footer class="bu-modal__foot"><span class="bu-modal__foot-note">Los cambios se guardarán automáticamente.</span><button type="button" class="bu-button" data-action="close-modal">Cancelar</button><button type="submit" class="bu-button bu-button--accent">${icon('i-plus')} Crear proyecto</button></footer></form>`,'',true,'i-plus');
    if (this.modal.type === 'rename') return shell('Renombrar proyecto','El contenido y las versiones no se modificarán.',`<form data-form="rename-project"><div class="bu-modal__body">${field('name','Nuevo nombre',data.name||'',{required:true,wide:true})}<input type="hidden" name="id" value="${attr(data.id)}"></div><footer class="bu-modal__foot"><button type="button" class="bu-button" data-action="close-modal">Cancelar</button><button class="bu-button bu-button--accent" type="submit">Guardar nombre</button></footer></form>`,'');
    if (this.modal.type === 'confirm') return shell(data.title||'Confirmar acción','Esta operación requiere confirmación.',`<div class="bu-modal__body"><div class="bu-confirm">${esc(data.message||'¿Deseas continuar?')}</div></div>`,`<footer class="bu-modal__foot"><button class="bu-button" data-action="close-modal">Cancelar</button><button class="bu-button bu-button--danger" data-action="confirm-action" data-confirm="${attr(data.action)}" data-id="${attr(data.id)}">${esc(data.confirmLabel||'Confirmar')}</button></footer>`);
    if (this.modal.type === 'section') { const section = data.section || {}; return shell(section.id?'Editar partida':'Nueva partida','Agrupa conceptos y controla subtotales.',`<form data-form="section"><div class="bu-modal__body bu-form-grid">${field('key','Clave',section.key||this.nextSectionKey(),{required:true})}${field('name','Nombre',section.name||'',{required:true})}<input type="hidden" name="id" value="${attr(section.id||'')}"><input type="hidden" name="parentId" value="${attr(data.parentId??section.parentId??'')}"></div><footer class="bu-modal__foot"><button type="button" class="bu-button" data-action="close-modal">Cancelar</button><button class="bu-button bu-button--accent" type="submit">Guardar partida</button></footer></form>`,''); }
    if (this.modal.type === 'concept') { const sections=this.active!.workspace.sections; return shell('Nuevo concepto','Captura la cantidad y el precio, o integra después un APU.',`<form data-form="concept"><div class="bu-modal__body bu-form-grid">${selectField('sectionId','Partida',data.sectionId||sections[0]?.id||'',sections.map(item=>[item.id,`${item.key} · ${item.name}`] as [string,string]))}${field('key','Clave',this.nextConceptKey(),{required:true})}${field('description','Concepto','',{required:true,wide:true})}${selectField('unit','Unidad','m²',UNITS)}${field('quantity','Cantidad',1,{type:'number',step:'0.0001'})}${field('unitPrice','Precio unitario',0,{type:'number',step:'0.0001'})}</div><footer class="bu-modal__foot"><button type="button" class="bu-button" data-action="close-modal">Cancelar</button><button class="bu-button bu-button--accent" type="submit">Crear concepto</button></footer></form>`,''); }
    if (this.modal.type === 'move-concept') { const concept=this.active!.workspace.concepts.find(item=>item.id===data.id)!; return shell('Mover concepto','Selecciona la partida de destino.',`<form data-form="move-concept"><div class="bu-modal__body">${selectField('sectionId','Partida',concept.sectionId,this.active!.workspace.sections.map(item=>[item.id,`${item.key} · ${item.name}`] as [string,string]),true)}<input type="hidden" name="id" value="${attr(concept.id)}"></div><footer class="bu-modal__foot"><button type="button" class="bu-button" data-action="close-modal">Cancelar</button><button class="bu-button bu-button--accent" type="submit">Mover</button></footer></form>`,''); }
    if (this.modal.type === 'supply') { const supply:Partial<Supply>=data.supply||{}; return shell(supply.id?'Editar insumo':'Nuevo insumo','Este recurso podrá reutilizarse en cualquier APU.',`<form data-form="supply"><div class="bu-modal__body bu-form-grid">${field('key','Clave',supply.key||'',{required:true})}${field('name','Nombre',supply.name||'',{required:true})}${selectField('category','Categoría',supply.category||'materials',CATEGORIES.map(item=>[item,CATEGORY_LABELS[item]] as [string,string]))}${selectField('unit','Unidad',supply.unit||'pza',UNITS)}${field('price','Precio',supply.price||0,{type:'number',step:'0.0001'})}${field('supplier','Proveedor',supply.supplier||'')}${field('updatedDate','Fecha de actualización',supply.updatedDate||today(),{type:'date'})}<label class="bu-field bu-field--wide"><span>Notas</span><textarea name="notes">${esc(supply.notes||'')}</textarea></label><input type="hidden" name="id" value="${attr(supply.id||'')}"></div><footer class="bu-modal__foot"><button type="button" class="bu-button" data-action="close-modal">Cancelar</button><button class="bu-button bu-button--accent" type="submit">Guardar insumo</button></footer></form>`,''); }
    if (this.modal.type === 'apu-item') { const supplies=this.active!.workspace.supplies.filter(item=>item.category===data.category); const options:Array<string|[string,string]>=[['','Captura manual'],...supplies.map(item=>[item.id,`${item.key} · ${item.name}`] as [string,string])]; return shell(`Agregar ${CATEGORY_LABELS[data.category as SupplyCategory]}`,'Selecciona un insumo existente o captura uno libre.',`<form data-form="apu-item"><div class="bu-modal__body bu-form-grid">${selectField('supplyId','Insumo de la biblioteca','',options,true)}${field('key','Clave','')}${field('description','Descripción','',{required:true})}${selectField('unit','Unidad','pza',UNITS)}${field('quantity','Cantidad',1,{type:'number',step:'0.0001'})}${field('price','Precio',0,{type:'number',step:'0.0001'})}<input type="hidden" name="conceptId" value="${attr(data.conceptId)}"><input type="hidden" name="category" value="${attr(data.category)}"></div><footer class="bu-modal__foot"><button type="button" class="bu-button" data-action="close-modal">Cancelar</button><button class="bu-button bu-button--accent" type="submit">Agregar al APU</button></footer></form>`,''); }
    if (this.modal.type === 'library') { const query=String(data.query||''); const results=CONCEPT_LIBRARY.filter(item=>!query||`${item.key} ${item.name}`.toLowerCase().includes(query.toLowerCase())); return shell('Biblioteca de conceptos','Agrega una copia editable con APU preconfigurado.',`<div class="bu-modal__body"><label class="bu-search" style="display:block;margin-bottom:14px">${icon('i-search')}<input data-library-search value="${attr(query)}" placeholder="Ej. Muro de block"></label><div class="bu-library-list">${results.map(item=>`<div class="bu-library-item"><span><strong>${esc(item.name)}</strong><small>${esc(item.key)} · ${esc(item.unit)} · ${item.apu.length} insumos</small></span><button class="bu-button bu-button--small" data-action="add-library-concept" data-key="${attr(item.key)}">Agregar</button></div>`).join('')}</div></div>`,`<footer class="bu-modal__foot"><button class="bu-button" data-action="close-modal">Cerrar</button></footer>`,true); }
    if (this.modal.type === 'version') return shell('Crear nueva versión','Guarda un corte inmutable del presupuesto actual.',`<form data-form="version"><div class="bu-modal__body bu-form-grid">${field('name','Nombre',`Versión ${this.versions.length+1}`,{required:true,wide:true})}${field('note','Nota','',{wide:true,placeholder:'Ej. Propuesta enviada al cliente'})}</div><footer class="bu-modal__foot"><button type="button" class="bu-button" data-action="close-modal">Cancelar</button><button class="bu-button bu-button--accent" type="submit">Guardar versión</button></footer></form>`,'');
    if (this.modal.type === 'version-view') { const version=data.version as BudgetVersion; return shell(version.name||'Versión histórica',`${dateLabel(version.createdAt)} · Solo lectura`,`<div class="bu-modal__body">${this.renderReportHtml('budget',version.workspace||this.active!.workspace)}</div>`,`<footer class="bu-modal__foot"><button class="bu-button" data-action="close-modal">Cerrar</button><button class="bu-button bu-button--accent" data-action="restore-version" data-id="${attr(version.id)}">Duplicar como nueva versión de trabajo</button></footer>`,true); }
    if (this.modal.type === 'report') return shell(REPORTS.find(item=>item[0]===data.report)?.[1]||'Reporte','Vista previa profesional IMFRA',`<div class="bu-modal__body">${this.renderReportHtml(data.report)}</div>`,`<footer class="bu-modal__foot"><button class="bu-button" data-action="close-modal">Cerrar</button><button class="bu-button" data-action="pdf-report" data-report="${attr(data.report)}">Descargar PDF</button><button class="bu-button bu-button--accent" data-action="print-report" data-report="${attr(data.report)}">Imprimir</button></footer>`,true);
    if (this.modal.type === 'import') return shell('Vista previa de importación',`${this.importRows.length} filas detectadas. Revisa antes de integrar.`,`<div class="bu-modal__body"><div class="bu-import-preview"><table class="bu-table"><thead><tr><th>Clave</th><th>Concepto</th><th>Unidad</th><th>Cantidad</th><th>Precio unitario</th></tr></thead><tbody>${this.importRows.slice(0,100).map(row=>`<tr><td>${esc(row.key)}</td><td>${esc(row.description)}</td><td>${esc(row.unit)}</td><td>${quantity(Number(row.quantity))}</td><td>${money(Number(row.unitPrice),this.active!.project.currency)}</td></tr>`).join('')}</tbody></table></div></div>`,`<footer class="bu-modal__foot"><button class="bu-button" data-action="close-modal">Cancelar</button><button class="bu-button bu-button--accent" data-action="confirm-import">Importar ${this.importRows.length} conceptos</button></footer>`,true);
    return '';
  }

  nextSectionKey() { return String(this.active!.workspace.sections.length+1).padStart(2,'0'); }
  nextConceptKey() { return `CON-${String(this.active!.workspace.concepts.length+1).padStart(3,'0')}`; }

  bind() {
    this.root.onclick = event => this.onClick(event);
    this.root.onchange = event => this.onChange(event);
    this.root.oninput = event => this.onInput(event);
    this.root.onsubmit = event => this.onSubmit(event);
    this.root.ondragstart = event => { const row=(event.target as HTMLElement).closest<HTMLElement>('[data-drag-concept]'); if(row){this.draggedConcept=row.dataset.dragConcept||'';row.classList.add('bu-dragging');} };
    this.root.ondragend = event => { (event.target as HTMLElement).closest('[data-drag-concept]')?.classList.remove('bu-dragging'); this.draggedConcept=''; };
    this.root.ondragover = event => { if((event.target as HTMLElement).closest('[data-drop-section],[data-drop-concept]')) event.preventDefault(); };
    this.root.ondrop = event => this.onDrop(event);
  }

  async onClick(event: MouseEvent) {
    const target=(event.target as HTMLElement).closest<HTMLElement>('[data-action]'); if(!target)return;
    const action=target.dataset.action||''; const idValue=target.dataset.id||'';
    if(action==='modal-backdrop'&&event.target!==target)return;
    if(action==='retry') return void this.mount(this.root);
    if(action==='go-rewards'){window.navigateToSection?.('entrenamiento');return;}
    if(action==='exit-software'){window.navigateToSection?.('entrenamiento');return;}
    if(action==='new-project'){this.modal={type:'new-project'};this.render();return;}
    if(action==='close-modal'||action==='modal-backdrop'){this.modal=null;this.render();return;}
    if(action==='open-project') return void this.openProject(idValue);
    if(action==='back-projects'){await this.flushSave();this.active=null;this.globalQuery='';this.projects=await api.listProjects();this.render();return;}
    if(action==='rename-project'){const project=this.projects.find(item=>item.id===idValue);if(project){this.modal={type:'rename',data:{id:project.id,name:project.name}};this.render();}return;}
    if(action==='duplicate-project'){target.setAttribute('disabled','');try{const project=await api.duplicateProject(idValue);this.projects.unshift(project);window.Toast?.success('Proyecto duplicado',project.name);this.render();}catch(error){this.notifyError(error);}return;}
    if(action==='archive-project'){this.modal={type:'confirm',data:{action:'archive',id:idValue,title:'Archivar proyecto',message:'El proyecto dejará de aparecer en la lista activa. Sus datos y versiones se conservarán.',confirmLabel:'Archivar'}};this.render();return;}
    if(action==='delete-project'){this.modal={type:'confirm',data:{action:'delete',id:idValue,title:'Eliminar proyecto',message:'El proyecto dejará de estar disponible. Esta acción requiere confirmación.',confirmLabel:'Eliminar proyecto'}};this.render();return;}
    if(action==='confirm-action') return void this.confirmAction(target.dataset.confirm||'',idValue);
    if(action==='tab'){this.tab=(target.dataset.tab||'summary') as BudgetTab;if(this.tab==='settings')void this.loadVersions();this.render();return;}
    if(action==='undo')return this.undo(); if(action==='redo')return this.redo();
    if(action==='global-result'){this.globalQuery='';if(target.dataset.kind==='concept'){this.activeConceptId=idValue;this.tab='apu';}else if(target.dataset.kind==='supply'){this.tab='supplies';}else this.tab='budget';this.render();return;}
    if(action==='add-section'){this.modal={type:'section',data:{}};this.render();return;}
    if(action==='add-subsection'){this.modal={type:'section',data:{parentId:idValue}};this.render();return;}
    if(action==='edit-section'){const section=this.active!.workspace.sections.find(item=>item.id===idValue);if(section){this.modal={type:'section',data:{section}};this.render();}return;}
    if(action==='delete-section'){this.modal={type:'confirm',data:{action:'delete-section',id:idValue,title:'Eliminar partida',message:'También se eliminarán sus subpartidas y conceptos. Puedes deshacer inmediatamente después.',confirmLabel:'Eliminar partida'}};this.render();return;}
    if(action==='add-concept'||action==='add-concept-section'){this.modal={type:'concept',data:{sectionId:idValue||this.active!.workspace.sections[0]?.id}};this.render();return;}
    if(action==='duplicate-concept'){const concept=this.active!.workspace.concepts.find(item=>item.id===idValue);if(concept)this.mutate(workspace=>{const copy=structuredClone(concept);copy.id=uid('concept');copy.key=`${copy.key}-C`;copy.apu.items=copy.apu.items.map(item=>({...item,id:uid('apu-item')}));copy.order=workspace.concepts.length;workspace.concepts.push(copy);});return;}
    if(action==='move-concept'){this.modal={type:'move-concept',data:{id:idValue}};this.render();return;}
    if(action==='delete-concept')return this.mutate(workspace=>{workspace.concepts=workspace.concepts.filter(item=>item.id!==idValue);workspace.generators=workspace.generators.filter(item=>item.conceptId!==idValue);});
    if(action==='open-apu'){this.activeConceptId=idValue;this.tab='apu';this.render();return;}
    if(action==='select-concept'){this.activeConceptId=idValue;this.render();return;}
    if(action==='add-apu-item'){this.modal={type:'apu-item',data:{conceptId:target.dataset.concept,category:target.dataset.category}};this.render();return;}
    if(action==='delete-apu-item'){return this.mutate(workspace=>{const concept=workspace.concepts.find(item=>item.id===target.dataset.concept);if(concept)concept.apu.items=concept.apu.items.filter(item=>item.id!==idValue);});}
    if(action==='add-supply'){this.modal={type:'supply',data:{}};this.render();return;}
    if(action==='edit-supply'){const supply=this.active!.workspace.supplies.find(item=>item.id===idValue);if(supply){this.modal={type:'supply',data:{supply}};this.render();}return;}
    if(action==='duplicate-supply'){const supply=this.active!.workspace.supplies.find(item=>item.id===idValue);if(supply)this.mutate(workspace=>workspace.supplies.push({...structuredClone(supply),id:uid('supply'),key:`${supply.key}-C`,name:`${supply.name} · Copia`}));return;}
    if(action==='delete-supply')return this.mutate(workspace=>{workspace.supplies=workspace.supplies.filter(item=>item.id!==idValue);});
    if(action==='load-base-supplies')return this.mutate(workspace=>{for(const supply of BASE_SUPPLIES){if(!workspace.supplies.some(item=>item.key===supply.key))workspace.supplies.push({...structuredClone(supply),id:uid('supply')});}});
    if(action==='add-generator'){const first=this.active!.workspace.concepts[0];this.mutate(workspace=>workspace.generators.push({id:uid('generator'),conceptId:first.id,location:'',axis:'',section:'',description:'',length:0,width:1,height:1,pieces:1,factor:1,formula:'length*width*height*pieces*factor',result:0}));return;}
    if(action==='delete-generator')return this.mutate(workspace=>{workspace.generators=workspace.generators.filter(item=>item.id!==idValue);});
    if(action==='apply-generator'){const generator=this.active!.workspace.generators.find(item=>item.id===idValue);if(generator){const result=evaluateGenerator(generator);this.mutate(workspace=>{const current=workspace.generators.find(item=>item.id===idValue)!;current.result=result;const concept=workspace.concepts.find(item=>item.id===current.conceptId);if(concept)concept.quantity=result;});window.Toast?.success('Cantidad aplicada',`${quantity(result)} se actualizó en el concepto.`);}return;}
    if(action==='concept-library'){this.modal={type:'library',data:{query:''}};this.render();return;}
    if(action==='add-library-concept')return this.addLibraryConcept(target.dataset.key||'');
    if(action==='create-version'){this.modal={type:'version'};this.render();return;}
    if(action==='view-version')return void this.viewVersion(idValue);
    if(action==='restore-version'){const version=(this.modal?.data?.version as BudgetVersion|undefined);if(version?.workspace){this.mutate(workspace=>Object.assign(workspace,cloneWorkspace(version.workspace!)));this.modal=null;window.Toast?.success('Versión duplicada','El contenido histórico se copió a la versión de trabajo.');}return;}
    if(action==='import-excel'){this.openFilePicker();return;}
    if(action==='confirm-import'){this.confirmImport();return;}
    if(action==='export-excel'){void this.exportExcel('budget');return;}
    if(action==='preview-report'){this.modal={type:'report',data:{report:target.dataset.report}};this.render();void api.registerReport(this.active!.project.id,target.dataset.report||'budget','view');return;}
    if(action==='pdf-report'){void this.exportPdf(target.dataset.report||'budget');return;}
    if(action==='excel-report'){void this.exportExcel(target.dataset.report||'budget');return;}
    if(action==='print-report'){this.printReport(target.dataset.report||'budget');return;}
  }

  onInput(event: Event) {
    const target=event.target as HTMLInputElement;
    if(target.matches('[data-project-filter]')){this.filter=target.value;clearTimeout(this.renderTimer);this.renderTimer=window.setTimeout(()=>this.render(),180);return;}
    if(target.matches('[data-global-search]')){this.globalQuery=target.value;clearTimeout(this.renderTimer);this.renderTimer=window.setTimeout(()=>this.render(),160);return;}
    if(target.matches('[data-library-search]')){if(this.modal?.data)this.modal.data.query=target.value;clearTimeout(this.renderTimer);this.renderTimer=window.setTimeout(()=>this.render(),160);return;}
  }

  onChange(event: Event) {
    const target=event.target as HTMLInputElement|HTMLSelectElement;
    if(target.matches('[data-state-filter]')){this.stateFilter=target.value;this.render();return;}
    if(target.matches('[data-supply-filter]')){this.supplyFilter=target.value as any;this.render();return;}
    if(target.matches('[data-explosion-section]')){this.explosionSection=target.value;this.render();return;}
    const conceptField=target.dataset.conceptField as keyof BudgetConcept|undefined;
    if(conceptField){const idValue=target.dataset.id||'';this.mutate(workspace=>{const concept=workspace.concepts.find(item=>item.id===idValue);if(!concept)return;(concept as any)[conceptField]=['quantity','unitPrice','order'].includes(conceptField)?n(target.value):(target.value);});return;}
    const itemField=target.dataset.apuItemField as keyof ApuItem|undefined;
    if(itemField){const conceptId=target.dataset.concept||'';const itemId=target.dataset.id||'';this.mutate(workspace=>{const item=workspace.concepts.find(c=>c.id===conceptId)?.apu.items.find(i=>i.id===itemId);if(item)(item as any)[itemField]=n(target.value);});return;}
    const percent=target.dataset.apuPercent as 'indirects'|'financing'|'utility'|'additional'|undefined;
    if(percent){const idValue=target.dataset.id||'';this.mutate(workspace=>{const concept=workspace.concepts.find(item=>item.id===idValue);if(concept)concept.apu[percent]=n(target.value);});return;}
    const generatorField=target.dataset.generatorField as keyof Generator|undefined;
    if(generatorField){const idValue=target.dataset.id||'';this.mutate(workspace=>{const generator=workspace.generators.find(item=>item.id===idValue);if(generator)(generator as any)[generatorField]=['length','width','height','pieces','factor'].includes(generatorField)?n(target.value):target.value;});return;}
    const indirect=target.dataset.indirectField as keyof BudgetWorkspace['indirectCosts']|undefined;
    if(indirect){this.mutate(workspace=>{workspace.indirectCosts[indirect]=n(target.value);});return;}
    if(target.name==='supplyId'&&target.closest('[data-form="apu-item"]')){const supply=this.active!.workspace.supplies.find(item=>item.id===target.value);if(supply){const form=target.closest<HTMLFormElement>('form')!;for(const [name,value] of Object.entries({key:supply.key,description:supply.name,unit:supply.unit,price:supply.price})){const input=form.elements.namedItem(name) as HTMLInputElement|null;if(input)input.value=String(value);}}}
  }

  async onSubmit(event: SubmitEvent) {
    const form=(event.target as HTMLElement).closest<HTMLFormElement>('form[data-form]');if(!form)return;event.preventDefault();
    const data=Object.fromEntries(new FormData(form).entries());const type=form.dataset.form;
    try {
      if(type==='new-project'){
        const template=String(data.template); const project=await api.createProject({name:String(data.name),client:String(data.client),location:String(data.location),manager:String(data.manager),date:String(data.date),currency:data.currency as 'MXN'|'USD',vat:n(data.vat),description:String(data.description),type:String(data.type),state:'draft',template:template==='house'?'house':'blank'});
        if(!['blank','house'].includes(template)){const payload=await api.getProject(project.id);payload.workspace=templateWorkspace(template);await api.saveWorkspace(project.id,payload.workspace,payload.revision);}
        this.modal=null;this.projects=await api.listProjects();window.Toast?.success('Proyecto creado',project.name);await this.openProject(project.id);return;
      }
      if(type==='rename-project'){const project=await api.updateProject(String(data.id),{name:String(data.name)});this.projects=this.projects.map(item=>item.id===project.id?project:item);this.modal=null;this.render();return;}
      if(type==='section'){this.mutate(workspace=>{const current=workspace.sections.find(item=>item.id===data.id);if(current){current.key=String(data.key);current.name=String(data.name);current.parentId=String(data.parentId);}else workspace.sections.push({id:uid('section'),parentId:String(data.parentId),key:String(data.key),name:String(data.name),order:workspace.sections.length});});this.modal=null;this.render();return;}
      if(type==='concept'){this.mutate(workspace=>workspace.concepts.push({id:uid('concept'),sectionId:String(data.sectionId),key:String(data.key),description:String(data.description),unit:String(data.unit),quantity:n(data.quantity),unitPrice:n(data.unitPrice),order:workspace.concepts.length,apu:emptyApu()}));this.modal=null;this.render();return;}
      if(type==='move-concept'){this.mutate(workspace=>{const concept=workspace.concepts.find(item=>item.id===data.id);if(concept)concept.sectionId=String(data.sectionId);});this.modal=null;this.render();return;}
      if(type==='supply'){const existing=this.active!.workspace.supplies.find(item=>item.id===data.id);const supply:Supply={id:existing?.id||uid('supply'),key:String(data.key),name:String(data.name),category:data.category as SupplyCategory,unit:String(data.unit),price:n(data.price),supplier:String(data.supplier),updatedDate:String(data.updatedDate),notes:String(data.notes)};this.mutate(workspace=>{const index=workspace.supplies.findIndex(item=>item.id===supply.id);if(index>=0)workspace.supplies[index]=supply;else workspace.supplies.push(supply);});this.modal=null;this.render();return;}
      if(type==='apu-item'){const supply=this.active!.workspace.supplies.find(item=>item.id===data.supplyId);const item:ApuItem={id:uid('apu-item'),supplyId:String(data.supplyId),category:data.category as SupplyCategory,key:supply?.key||String(data.key),description:supply?.name||String(data.description),unit:supply?.unit||String(data.unit),quantity:n(data.quantity),price:supply?.price??n(data.price)};this.mutate(workspace=>workspace.concepts.find(item=>item.id===data.conceptId)?.apu.items.push(item));this.modal=null;this.render();return;}
      if(type==='version'){const version=await api.createVersion(this.active!.project.id,String(data.name),String(data.note),this.active!.workspace);this.versions.unshift(version);this.modal=null;window.Toast?.success('Versión guardada',String(data.name));this.render();return;}
      if(type==='project-settings'){const project=await api.updateProject(this.active!.project.id,{name:String(data.name),client:String(data.client),location:String(data.location),manager:String(data.manager),date:String(data.date),currency:data.currency as 'MXN'|'USD',vat:n(data.vat),description:String(data.description),type:String(data.type),state:data.state as any});this.active!.project=project;this.scheduleSave();window.Toast?.success('Proyecto actualizado');this.render();return;}
    } catch(error){this.notifyError(error);}
  }

  onDrop(event: DragEvent) {
    if(!this.draggedConcept)return;event.preventDefault();const target=event.target as HTMLElement;const sectionId=target.closest<HTMLElement>('[data-drop-section]')?.dataset.dropSection;const beforeId=target.closest<HTMLElement>('[data-drop-concept]')?.dataset.dropConcept;
    this.mutate(workspace=>{const concept=workspace.concepts.find(item=>item.id===this.draggedConcept);if(!concept)return;if(sectionId)concept.sectionId=sectionId;if(beforeId){const before=workspace.concepts.find(item=>item.id===beforeId);if(before){concept.sectionId=before.sectionId;const ordered=workspace.concepts.filter(item=>item.sectionId===before.sectionId&&item.id!==concept.id).sort((a,b)=>a.order-b.order);ordered.splice(Math.max(0,ordered.findIndex(item=>item.id===before.id)),0,concept);ordered.forEach((item,index)=>item.order=index);}}});
  }

  mutate(callback:(workspace:BudgetWorkspace)=>void) {
    if(!this.active)return;this.history.push(cloneWorkspace(this.active.workspace));if(this.history.length>50)this.history.shift();this.future=[];callback(this.active.workspace);this.scheduleSave();this.render();
  }

  undo(){if(!this.active||!this.history.length)return;this.future.push(cloneWorkspace(this.active.workspace));this.active.workspace=this.history.pop()!;this.scheduleSave();this.render();}
  redo(){if(!this.active||!this.future.length)return;this.history.push(cloneWorkspace(this.active.workspace));this.active.workspace=this.future.pop()!;this.scheduleSave();this.render();}

  scheduleSave() {
    if(!this.active)return;this.saveState='saving';this.saveMessage='Guardando…';window.clearTimeout(this.saveTimer);this.saveTimer=window.setTimeout(()=>void this.persist(),750);
  }

  async persist() {
    if(!this.active)return;this.saveState='saving';this.saveMessage='Guardando…';this.updateSaveBadge();
    try { const result=await api.saveWorkspace(this.active.project.id,this.active.workspace,this.active.revision);this.active.revision=result.revision;this.active.project.revision=result.revision;const totals=calculateWorkspace(this.active.workspace,this.active.project.vat);this.active.project.amount=totals.total;this.active.project.conceptCount=this.active.workspace.concepts.length;this.active.project.sectionCount=this.active.workspace.sections.length;this.saveState='saved';this.saveMessage='✓ Guardado'; }
    catch(error:any){this.saveState='error';this.saveMessage=error?.code==='REVISION_CONFLICT'?'Conflicto de versión':'Error al guardar';this.notifyError(error);}
    this.updateSaveBadge();
  }

  async flushSave(){if(this.saveState==='saving'){window.clearTimeout(this.saveTimer);await this.persist();}}
  updateSaveBadge(){const badge=this.root.querySelector('.bu-save-state');if(badge){badge.className=`bu-save-state is-${this.saveState}`;badge.textContent=this.saveMessage;}}

  async openProject(idValue:string){this.renderLoading('Abriendo presupuesto…');try{this.active=await api.getProject(idValue);this.tab='summary';this.activeConceptId=this.active.workspace.concepts[0]?.id||'';this.history=[];this.future=[];this.versions=[];this.saveState='saved';this.saveMessage='✓ Guardado';this.render();}catch(error){this.notifyError(error);this.active=null;this.projects=await api.listProjects();this.render();}}
  async loadVersions(){if(!this.active)return;try{this.versions=await api.listVersions(this.active.project.id);this.render();}catch(error){this.notifyError(error);}}
  async viewVersion(idValue:string){try{const version=await api.getVersion(this.active!.project.id,idValue);this.modal={type:'version-view',data:{version}};this.render();}catch(error){this.notifyError(error);}}

  async confirmAction(action:string,idValue:string){try{if(action==='archive'){await api.archiveProject(idValue);this.projects=this.projects.filter(item=>item.id!==idValue);window.Toast?.success('Proyecto archivado');}if(action==='delete'){await api.deleteProject(idValue);this.projects=this.projects.filter(item=>item.id!==idValue);window.Toast?.success('Proyecto eliminado');}if(action==='delete-section'){this.mutate(workspace=>{const ids=new Set([idValue,...workspace.sections.filter(item=>item.parentId===idValue).map(item=>item.id)]);workspace.sections=workspace.sections.filter(item=>!ids.has(item.id));const conceptIds=new Set(workspace.concepts.filter(item=>ids.has(item.sectionId)).map(item=>item.id));workspace.concepts=workspace.concepts.filter(item=>!conceptIds.has(item.id));workspace.generators=workspace.generators.filter(item=>!conceptIds.has(item.conceptId));});}this.modal=null;this.render();}catch(error){this.notifyError(error);}}

  addLibraryConcept(key:string){const library=CONCEPT_LIBRARY.find(item=>item.key===key);if(!library||!this.active!.workspace.sections.length)return;this.mutate(workspace=>{for(const base of BASE_SUPPLIES){if(library.apu.some(item=>item.supplyKey===base.key)&&!workspace.supplies.some(item=>item.key===base.key))workspace.supplies.push({...structuredClone(base),id:uid('supply')});}const concept:BudgetConcept={id:uid('concept'),sectionId:workspace.sections[0].id,key:library.key,description:library.name,unit:library.unit,quantity:1,unitPrice:0,order:workspace.concepts.length,apu:apuFromLibrary(library,workspace.supplies)};workspace.concepts.push(concept);this.activeConceptId=concept.id;});this.modal=null;this.tab='apu';this.render();window.Toast?.success('Concepto agregado',library.name);}

  openFilePicker(){const input=document.createElement('input');input.type='file';input.accept='.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';input.onchange=()=>{const file=input.files?.[0];if(file)void this.readExcel(file);};input.click();}
  async readExcel(file:File){try{const { Workbook }=await import('exceljs');const workbook=new Workbook();await workbook.xlsx.load(await file.arrayBuffer() as any);const sheet=workbook.worksheets[0];if(!sheet)throw new Error('El archivo no contiene hojas.');const headers:string[]=[];sheet.getRow(1).eachCell((cell,col)=>headers[col]=String(cell.value||'').trim().toLowerCase());const find=(aliases:string[])=>headers.findIndex(header=>aliases.some(alias=>header.includes(alias)));const indexes={key:find(['clave']),description:find(['concepto','descripción','descripcion']),unit:find(['unidad']),quantity:find(['cantidad']),unitPrice:find(['precio unitario','p.u','precio'])};if(indexes.description<0)throw new Error('No encontramos una columna Concepto o Descripción.');const rows:Array<Record<string,unknown>>=[];sheet.eachRow((row,rowNumber)=>{if(rowNumber===1)return;const description=String(row.getCell(indexes.description).value||'').trim();if(!description)return;rows.push({key:indexes.key>0?String(row.getCell(indexes.key).value||''):`IMP-${String(rows.length+1).padStart(3,'0')}`,description,unit:indexes.unit>0?String(row.getCell(indexes.unit).value||'pza'):'pza',quantity:indexes.quantity>0?n(row.getCell(indexes.quantity).value):0,unitPrice:indexes.unitPrice>0?n(row.getCell(indexes.unitPrice).value):0});});if(!rows.length)throw new Error('No encontramos conceptos para importar.');this.importRows=rows;this.modal={type:'import'};this.render();}catch(error){this.notifyError(error);}}
  confirmImport(){if(!this.importRows.length)return;if(!this.active!.workspace.sections.length){this.active!.workspace.sections.push({id:uid('section'),parentId:'',key:'01',name:'Importado desde Excel',order:0});}const sectionId=this.active!.workspace.sections[0].id;this.mutate(workspace=>{for(const [index,row] of this.importRows.entries())workspace.concepts.push({id:uid('concept'),sectionId,key:String(row.key),description:String(row.description),unit:String(row.unit),quantity:n(row.quantity),unitPrice:n(row.unitPrice),order:workspace.concepts.length+index,apu:emptyApu()});});const count=this.importRows.length;this.importRows=[];this.modal=null;this.render();window.Toast?.success('Importación completada',`${count} conceptos agregados.`);}

  reportRows(type:string,workspace=this.active!.workspace) {
    const project=this.active!.project;const totals=calculateWorkspace(workspace,project.vat);const exp=explosion(workspace);
    if(type==='sections')return workspace.sections.map(section=>[section.key,section.name,workspace.concepts.filter(concept=>concept.sectionId===section.id).length,totals.sectionTotals[section.id]||0]);
    if(type==='explosion'||['materials','labor','equipment'].includes(type))return exp.filter(row=>type==='explosion'||(type==='materials'&&row.category==='materials')||(type==='labor'&&row.category==='labor')||(type==='equipment'&&['equipment','machinery','tools'].includes(row.category))).map(row=>[row.key,row.name,row.unit,row.quantity,row.price,row.amount]);
    if(type==='generators')return workspace.generators.map(generator=>{const concept=workspace.concepts.find(item=>item.id===generator.conceptId);return[concept?.key||'',concept?.description||'',generator.location,generator.formula,evaluateGenerator(generator)];});
    if(type==='financial')return [['Costo directo','',totals.direct],['Indirectos','',totals.indirects],['Financiamiento','',totals.financing],['Utilidad','',totals.utility],['Cargos adicionales','',totals.additional],['IVA','',totals.vat],['TOTAL FINAL','',totals.total]];
    if(type==='apu')return workspace.concepts.flatMap(concept=>concept.apu.items.map(item=>[concept.key,concept.description,item.key,item.description,item.unit,item.quantity,item.price,item.quantity*item.price]));
    return workspace.concepts.map(concept=>[concept.key,concept.description,concept.unit,concept.quantity,conceptUnitPrice(concept),concept.quantity*conceptUnitPrice(concept)]);
  }

  reportHeaders(type:string){if(type==='sections')return['Clave','Partida','Conceptos','Importe'];if(type==='generators')return['Clave','Concepto','Ubicación','Fórmula','Cantidad'];if(type==='financial')return['Concepto','','Importe'];if(type==='apu')return['Concepto','Descripción','Insumo','Descripción de insumo','Unidad','Cantidad','Precio','Importe'];if(type==='explosion'||['materials','labor','equipment'].includes(type))return['Clave','Insumo','Unidad','Cantidad total','Precio unitario','Importe'];return['Clave','Concepto','Unidad','Cantidad','Precio unitario','Importe'];}

  renderReportHtml(type:string,workspace=this.active!.workspace){const project=this.active!.project;const rows=this.reportRows(type,workspace);const headers=this.reportHeaders(type);const title=REPORTS.find(item=>item[0]===type)?.[1]||'Presupuesto general';const total=calculateWorkspace(workspace,project.vat).total;const formatCell=(cell:unknown,index:number)=>typeof cell==='number'?(headers[index]?.toLowerCase().includes('cantidad')?quantity(cell):money(cell,project.currency)):esc(cell);return `<article class="bu-report-preview"><header class="bu-report-preview__head"><div><span>IMFRA DESARROLLO</span><h2>${esc(title)}</h2></div><strong>${esc(project.name)}</strong></header><div class="bu-report-preview__meta"><div><small>Proyecto</small><strong>${esc(project.name)}</strong></div><div><small>Cliente</small><strong>${esc(project.client||'—')}</strong></div><div><small>Fecha</small><strong>${dateLabel(project.date)}</strong></div><div><small>Responsable</small><strong>${esc(project.manager||'—')}</strong></div></div><table><thead><tr>${headers.map(header=>`<th>${esc(header)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map((cell,index)=>`<td class="${typeof cell==='number'?'num':''}">${formatCell(cell,index)}</td>`).join('')}</tr>`).join('')}</tbody></table><div class="bu-report-preview__total"><strong>Total del proyecto: ${money(total,project.currency)}</strong></div></article>`;}

  async exportExcel(type:string){try{const { Workbook }=await import('exceljs');const workbook=new Workbook();workbook.creator='IMFRA Desarrollo';workbook.created=new Date();const title=REPORTS.find(item=>item[0]===type)?.[1]||'Presupuesto';const sheet=workbook.addWorksheet(title.slice(0,31));const headers=this.reportHeaders(type);const rows=this.reportRows(type);sheet.addRow(['IMFRA DESARROLLO']);sheet.addRow([title]);sheet.addRow([`Proyecto: ${this.active!.project.name}`,`Cliente: ${this.active!.project.client}`,`Fecha: ${this.active!.project.date}`]);sheet.addRow([]);const headerRow=sheet.addRow(headers);headerRow.font={bold:true,color:{argb:'FFFFFFFF'}};headerRow.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF171717'}};for(const row of rows)sheet.addRow(row as any[]);sheet.columns.forEach(column=>{column.width=22;});sheet.getColumn(2).width=48;const buffer=await workbook.xlsx.writeBuffer();const blob=new Blob([buffer as BlobPart],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});this.download(blob,`${this.fileName()}-${type}.xlsx`);await api.registerReport(this.active!.project.id,type,'xlsx');window.Toast?.success('Excel generado','El archivo está listo.');}catch(error){this.notifyError(error);}}

  async exportPdf(type:string){try{const { jsPDF: JsPDF }=await import('jspdf');const pdf=new JsPDF({orientation:'landscape',unit:'mm',format:'a4'});const project=this.active!.project;const title=REPORTS.find(item=>item[0]===type)?.[1]||'Presupuesto general';const headers=this.reportHeaders(type);const rows=this.reportRows(type);pdf.setFillColor(20,20,20);pdf.rect(0,0,297,29,'F');pdf.setTextColor(245,157,26);pdf.setFontSize(9);pdf.text('IMFRA DESARROLLO',14,10);pdf.setTextColor(255,255,255);pdf.setFontSize(17);pdf.text(title,14,21);pdf.setFontSize(8);pdf.text(project.name,284,16,{align:'right'});pdf.setTextColor(55,55,55);pdf.text(`Cliente: ${project.client||'—'}   ·   Fecha: ${project.date}   ·   Responsable: ${project.manager||'—'}`,14,37);let y=45;const widths=Array(headers.length).fill(269/headers.length);const draw=(row:any[],header=false)=>{const lineHeight=7;if(y+lineHeight>195){pdf.addPage();y=15;}let x=14;row.forEach((cell,index)=>{if(header){pdf.setFillColor(35,35,35);pdf.rect(x,y,widths[index],lineHeight,'F');pdf.setTextColor(255,255,255);}else{pdf.setDrawColor(225,225,225);pdf.rect(x,y,widths[index],lineHeight,'S');pdf.setTextColor(45,45,45);}pdf.setFontSize(6.7);const quantityColumn=headers[index]?.toLowerCase().includes('cantidad');const value=typeof cell==='number'?(quantityColumn?quantity(cell):money(cell,project.currency)):String(cell??'');pdf.text(value.slice(0,52),x+2,y+4.6);x+=widths[index];});y+=lineHeight;};draw(headers,true);rows.forEach(row=>draw(row));pdf.setFontSize(10);pdf.setTextColor(20,20,20);pdf.text(`Total del proyecto: ${money(calculateWorkspace(this.active!.workspace,project.vat).total,project.currency)}`,284,Math.min(202,y+10),{align:'right'});pdf.save(`${this.fileName()}-${type}.pdf`);await api.registerReport(project.id,type,'pdf');window.Toast?.success('PDF generado','Reporte descargado correctamente.');}catch(error){this.notifyError(error);}}

  printReport(type:string){const preview=this.renderReportHtml(type);const popup=window.open('','_blank','width=1100,height=800');if(!popup){window.Toast?.error('Impresión bloqueada','Permite ventanas emergentes para imprimir.');return;}popup.document.write(`<!doctype html><html><head><title>IMFRA · Reporte</title><style>body{font-family:Arial;margin:24px;color:#222}header{display:flex;justify-content:space-between;border-bottom:3px solid #f59d1a;padding-bottom:14px}header span{color:#f59d1a;font-weight:bold}.bu-report-preview__meta{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0}.bu-report-preview__meta small,.bu-report-preview__meta strong{display:block}table{width:100%;border-collapse:collapse}th,td{padding:7px;border:1px solid #ddd;font-size:10px;text-align:left}th{background:#171717;color:white}.num{text-align:right}.bu-report-preview__total{text-align:right;padding:16px;font-size:14px}@media print{body{margin:0}}</style></head><body>${preview}<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}<\/script></body></html>`);popup.document.close();void api.registerReport(this.active!.project.id,type,'print');}
  download(blob:Blob,name:string){const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  fileName(){return this.active!.project.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70)||'presupuesto-imfra';}
  notifyError(error:unknown){const message=error instanceof Error?error.message:'No pudimos completar la operación.';window.Toast?.error('Software de presupuestos',message);console.error('[budgets]',error);}
}

let app: BudgetApplication | null = null;
window.IMFRABudgets = { mount(container: HTMLElement) { app = new BudgetApplication(); void app.mount(container); } };
window.dispatchEvent(new CustomEvent('imfra:budgets-ready'));
