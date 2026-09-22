import "./admin.css";
import { rewardCatalog, rewardQuestions } from "../rewards/catalog";
import { flashcards, trainingCases } from "./catalog";
import { isAdminDemo, saveTrainingDraft } from "./admin-cloud";

interface Draft { id: string; type: string; title: string; area: string; createdAt: string; remote?: boolean }
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
  let formError = "";
  let saving = false;

  function rows() {
    if (tab === "casos") return trainingCases.map((item) => ({ title: item.title, area: item.area, type: `${item.steps.length} decisiones`, status: "Publicado" }));
    if (tab === "flashcards") return flashcards.map((item) => ({ title: item.front, area: item.area, type: "Flashcard", status: "Publicado" }));
    if (tab === "recompensas") return rewardCatalog.map((item) => ({ title: item.name, area: item.category, type: `${item.points} puntos`, status: item.availability }));
    return rewardQuestions.map((item) => ({ title: item.question, area: item.area, type: item.type, status: "Publicado" }));
  }

  function render() {
    const data = rows();
    container.innerHTML = `<div class="ta-page fade-up">
      <header class="ta-hero" data-illus="entrenamiento"><div><span>Contenido de aprendizaje</span><h1>Retos y recompensas</h1><p>Administra preguntas, casos, tarjetas y premios.</p></div><button class="btn btn--primary" data-ta-new>${ico("i-plus")} Nueva actividad</button></header>
      <div class="ta-private">${ico("i-bolt")}<div><strong>${isAdminDemo() ? "Modo de prueba" : "Área protegida"}</strong><span>${isAdminDemo() ? "Los cambios se guardan solo en este navegador." : "Los cambios requieren aprobación antes de publicarse."}</span></div></div>
      <section class="ta-kpis"><article><span>Preguntas</span><strong>${rewardQuestions.length}</strong></article><article><span>Casos</span><strong>${trainingCases.length}</strong></article><article><span>Tarjetas</span><strong>${flashcards.length}</strong></article><article><span>Premios</span><strong>${rewardCatalog.length}</strong></article></section>
      <section class="ta-panel"><div class="ta-tabs">${[["preguntas","Preguntas"],["casos","Casos"],["flashcards","Flashcards"],["recompensas","Recompensas"]].map(([id,label]) => `<button class="${tab === id ? "is-active" : ""}" data-ta-tab="${id}">${label}</button>`).join("")}</div><div class="ta-toolbar"><label>${ico("i-search")}<input type="search" data-ta-search placeholder="Buscar por título o área"></label><span>${data.length} elementos publicados · ${drafts.length} borradores locales</span></div><div class="ta-table"><div class="ta-row ta-row--head"><span>Contenido</span><span>Área</span><span>Formato</span><span>Estado</span></div>${data.map((item) => `<article class="ta-row" data-ta-row="${esc(`${item.title} ${item.area}`.toLowerCase())}"><div><strong>${esc(item.title)}</strong><small>ID editorial · ${tab}</small></div><span>${esc(item.area)}</span><span>${esc(item.type)}</span><b>${esc(item.status)}</b></article>`).join("")}</div></section>
      <section class="ta-readiness"><div><span>Antes de publicar</span><h2>Revisión final</h2></div><ul><li class="is-done"><b>✓</b><span>Diseño y contenido</span></li><li class="is-done"><b>✓</b><span>Datos protegidos</span></li><li class="is-done"><b>✓</b><span>Puntos preparados</span></li><li><b>4</b><span>Entrega de licencias</span></li></ul></section>
      ${composer ? `<div class="ta-modal"><form data-ta-form><button type="button" data-ta-close aria-label="Cerrar">×</button><span>Nueva actividad</span><h2>Crear borrador editorial</h2><label>Tipo<select name="type" required><option>Pregunta</option><option>Caso de obra</option><option>Flashcard</option><option>Recompensa</option></select></label><label>Título<input name="title" required minlength="4" placeholder="Nombre o enunciado principal"></label><label>Área<input name="area" required placeholder="Ej. Supervisión de obra"></label><p>Este borrador no será visible para los usuarios hasta aprobarlo y publicarlo.</p>${formError ? `<p class="ta-form-error" role="alert">${esc(formError)}</p>` : ""}<div><button type="button" class="btn btn--ghost" data-ta-close>Cancelar</button><button class="btn btn--primary" type="submit" ${saving ? "disabled" : ""}>${saving ? "Guardando…" : "Guardar borrador"}</button></div></form></div>` : ""}
    </div>`;
    bind();
  }

  function bind() {
    container.querySelectorAll<HTMLButtonElement>("[data-ta-tab]").forEach((button) => button.addEventListener("click", () => { tab = button.dataset.taTab || "preguntas"; render(); }));
    container.querySelector<HTMLInputElement>("[data-ta-search]")?.addEventListener("input", (event) => { const q = (event.currentTarget as HTMLInputElement).value.toLowerCase().trim(); container.querySelectorAll<HTMLElement>("[data-ta-row]").forEach((row) => { row.hidden = !!q && !row.dataset.taRow?.includes(q); }); });
    container.querySelector<HTMLButtonElement>("[data-ta-new]")?.addEventListener("click", () => { composer = true; formError = ""; render(); });
    container.querySelectorAll<HTMLButtonElement>("[data-ta-close]").forEach((button) => button.addEventListener("click", () => { composer = false; render(); }));
    container.querySelector<HTMLFormElement>("[data-ta-form]")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget as HTMLFormElement);
      const input = { type: String(form.get("type")), title: String(form.get("title")).trim(), area: String(form.get("area")).trim() };
      saving = true; formError = ""; render();
      try {
        const result = await saveTrainingDraft(input);
        drafts.unshift({ id: result.id, ...input, createdAt: new Date().toISOString(), remote: result.remote });
        saveDrafts(drafts);
        composer = false;
      } catch (error) {
        formError = error instanceof Error ? error.message : "No fue posible guardar el borrador.";
      } finally {
        saving = false;
        render();
      }
    });
  }
  render();
}

window.IMFRATrainingAdmin = { mount };
window.dispatchEvent(new CustomEvent("imfra:training-admin-ready"));
