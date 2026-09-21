import "./admin.css";
import { rewardCatalog, rewardQuestions } from "../rewards/catalog";
import { flashcards, trainingCases } from "./catalog";

interface Draft { id: string; type: string; title: string; area: string; createdAt: string }
declare global { interface Window { IMFRATrainingAdmin: { mount(container: HTMLElement): void } } }

const DRAFT_KEY = "imfra:v2:training-admin:drafts";
const readDrafts = (): Draft[] => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "[]"); } catch { return []; } };
const saveDrafts = (drafts: Draft[]) => localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
const esc = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] || char);
const ico = (name: string) => `<svg class="ic"><use href="#${name}"/></svg>`;

function mount(container: HTMLElement) {
  let tab = "preguntas";
  let drafts = readDrafts();
  let composer = false;

  function rows() {
    if (tab === "casos") return trainingCases.map((item) => ({ title: item.title, area: item.area, type: `${item.steps.length} decisiones`, status: "Publicado" }));
    if (tab === "flashcards") return flashcards.map((item) => ({ title: item.front, area: item.area, type: "Flashcard", status: "Publicado" }));
    if (tab === "recompensas") return rewardCatalog.map((item) => ({ title: item.name, area: item.category, type: `${item.points} puntos`, status: item.availability }));
    return rewardQuestions.map((item) => ({ title: item.question, area: item.area, type: item.type, status: "Publicado" }));
  }

  function render() {
    const data = rows();
    container.innerHTML = `<div class="ta-page fade-up">
      <header class="ta-hero"><div><span>Administración académica</span><h1>Retos y recompensas</h1><p>Control editorial para preguntas, casos, tarjetas técnicas y beneficios del programa IMFRA.</p></div><button class="btn btn--primary" data-ta-new>${ico("i-plus")} Nueva actividad</button></header>
      <div class="ta-private">${ico("i-bolt")}<div><strong>Entorno privado</strong><span>Los borradores creados aquí se guardan solo en este navegador. La publicación real requerirá el flujo de servidor y permisos administrativos.</span></div></div>
      <section class="ta-kpis"><article><span>Preguntas</span><strong>${rewardQuestions.length}</strong><small>Banco multimodal</small></article><article><span>Casos</span><strong>${trainingCases.length}</strong><small>${trainingCases.reduce((total, item) => total + item.steps.length, 0)} decisiones</small></article><article><span>Flashcards</span><strong>${flashcards.length}</strong><small>${new Set(flashcards.map((item) => item.area)).size} áreas</small></article><article><span>Recompensas</span><strong>${rewardCatalog.length}</strong><small>Catálogo piloto</small></article></section>
      <section class="ta-panel"><div class="ta-tabs">${[["preguntas","Preguntas"],["casos","Casos"],["flashcards","Flashcards"],["recompensas","Recompensas"]].map(([id,label]) => `<button class="${tab === id ? "is-active" : ""}" data-ta-tab="${id}">${label}</button>`).join("")}</div><div class="ta-toolbar"><label>${ico("i-search")}<input type="search" data-ta-search placeholder="Buscar por título o área"></label><span>${data.length} elementos publicados · ${drafts.length} borradores locales</span></div><div class="ta-table"><div class="ta-row ta-row--head"><span>Contenido</span><span>Área</span><span>Formato</span><span>Estado</span></div>${data.map((item) => `<article class="ta-row" data-ta-row="${esc(`${item.title} ${item.area}`.toLowerCase())}"><div><strong>${esc(item.title)}</strong><small>ID editorial · ${tab}</small></div><span>${esc(item.area)}</span><span>${esc(item.type)}</span><b>${esc(item.status)}</b></article>`).join("")}</div></section>
      <section class="ta-readiness"><div><span>Preparación para publicar</span><h2>Controles necesarios antes de producción</h2></div><ul><li class="is-done"><b>✓</b><span>Experiencia y contenido inicial</span></li><li><b>2</b><span>Persistencia en Firestore</span></li><li><b>3</b><span>Libro mayor de puntos</span></li><li><b>4</b><span>Aprobación y entrega de licencias</span></li></ul></section>
      ${composer ? `<div class="ta-modal"><form data-ta-form><button type="button" data-ta-close aria-label="Cerrar">×</button><span>Nueva actividad</span><h2>Crear borrador editorial</h2><label>Tipo<select name="type" required><option>Pregunta</option><option>Caso de obra</option><option>Flashcard</option><option>Recompensa</option></select></label><label>Título<input name="title" required minlength="4" placeholder="Nombre o enunciado principal"></label><label>Área<input name="area" required placeholder="Ej. Supervisión de obra"></label><p>Este borrador no será visible para los usuarios hasta conectarlo con el backend y aprobar su publicación.</p><div><button type="button" class="btn btn--ghost" data-ta-close>Cancelar</button><button class="btn btn--primary" type="submit">Guardar borrador</button></div></form></div>` : ""}
    </div>`;
    bind();
  }

  function bind() {
    container.querySelectorAll<HTMLButtonElement>("[data-ta-tab]").forEach((button) => button.addEventListener("click", () => { tab = button.dataset.taTab || "preguntas"; render(); }));
    container.querySelector<HTMLInputElement>("[data-ta-search]")?.addEventListener("input", (event) => { const q = (event.currentTarget as HTMLInputElement).value.toLowerCase().trim(); container.querySelectorAll<HTMLElement>("[data-ta-row]").forEach((row) => { row.hidden = !!q && !row.dataset.taRow?.includes(q); }); });
    container.querySelector<HTMLButtonElement>("[data-ta-new]")?.addEventListener("click", () => { composer = true; render(); });
    container.querySelectorAll<HTMLButtonElement>("[data-ta-close]").forEach((button) => button.addEventListener("click", () => { composer = false; render(); }));
    container.querySelector<HTMLFormElement>("[data-ta-form]")?.addEventListener("submit", (event) => { event.preventDefault(); const form = new FormData(event.currentTarget as HTMLFormElement); drafts.unshift({ id: crypto.randomUUID(), type: String(form.get("type")), title: String(form.get("title")).trim(), area: String(form.get("area")).trim(), createdAt: new Date().toISOString() }); saveDrafts(drafts); composer = false; render(); });
  }
  render();
}

window.IMFRATrainingAdmin = { mount };
window.dispatchEvent(new CustomEvent("imfra:training-admin-ready"));
