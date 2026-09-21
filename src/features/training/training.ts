import "./training.css";
import { flashcards, trainingCases, type TrainingCase } from "./catalog";
import { rewardQuestions } from "../rewards/catalog";
import { loadTrainingProgress, mergeTrainingProgress, syncTrainingProgress } from "./cloud";

interface CaseResult { score: number; completedAt: string }
interface CardResult { confidence: number; lastReviewed: string; rewardDate?: string }
interface TrainingState {
  xp: number;
  cases: Record<string, CaseResult>;
  cards: Record<string, CardResult>;
  days: string[];
}

declare global {
  interface Window {
    IMFRATraining: { mount(container: HTMLElement): void };
    UserState?: { uid?: string; email?: string; modo?: string };
  }
}

type View = "hub" | "cases" | "case" | "flashcards";
const today = () => new Date().toISOString().slice(0, 10);
const emptyState = (): TrainingState => ({ xp: 0, cases: {}, cards: {}, days: [] });

function accountId() {
  const demo = window.UserState?.modo === "demo" || new URLSearchParams(location.search).get("modo") === "demo";
  return demo ? "demo-preview-v1" : (window.UserState?.uid || window.UserState?.email || "guest");
}

function stateKey() { return `imfra:v2:training:${accountId()}`; }
function readState(): TrainingState {
  try {
    const value = JSON.parse(localStorage.getItem(stateKey()) || "null") as Partial<TrainingState> | null;
    if (value) return { ...emptyState(), ...value, cases: value.cases || {}, cards: value.cards || {}, days: value.days || [] };
  } catch {}
  return emptyState();
}
function saveState(state: TrainingState) { localStorage.setItem(stateKey(), JSON.stringify(state)); }
function esc(value: string) { return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] || char); }
function icon(name: string) { return `<svg class="ic"><use href="#${name}"/></svg>`; }

function registerDay(state: TrainingState) {
  if (!state.days.includes(today())) state.days.push(today());
  state.days = state.days.slice(-90);
}

function streak(days: string[]) {
  const set = new Set(days);
  const cursor = new Date();
  if (!set.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (set.has(cursor.toISOString().slice(0, 10))) { count += 1; cursor.setDate(cursor.getDate() - 1); }
  return count;
}

function weekStart() {
  const date = new Date();
  const day = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

function quizProgressToday() {
  const demo = window.UserState?.modo === "demo" || new URLSearchParams(location.search).get("modo") === "demo";
  const account = demo ? "demo-preview-v7" : (window.UserState?.uid || window.UserState?.email || "guest");
  try {
    const state = JSON.parse(localStorage.getItem(`imfra:v2:rewards:${account}`) || "null");
    return Object.keys(state?.answered || {}).filter((key) => key.startsWith(`${today()}:`)).length;
  } catch { return 0; }
}

function level(xp: number) {
  const levels = [
    { name: "Auxiliar técnico", start: 0, next: 120 },
    { name: "Supervisor en formación", start: 120, next: 300 },
    { name: "Residente competente", start: 300, next: 620 },
    { name: "Coordinador técnico", start: 620, next: 1100 },
    { name: "Líder de obra", start: 1100, next: 1100 }
  ];
  return [...levels].reverse().find((item) => xp >= item.start) || levels[0];
}

function mount(container: HTMLElement) {
  let state = readState();
  let view: View = "hub";
  let selectedCase: TrainingCase | null = null;
  let caseStep = 0;
  let caseScore = 0;
  let caseAnswer: number | null = null;
  let caseFinished = false;
  let deck = [...flashcards];
  let cardIndex = 0;
  let cardFlipped = false;
  let cardArea = "Todas";
  const persistState = () => { saveState(state); void syncTrainingProgress(state); };

  const goTo = (selector = ".tr-page") => requestAnimationFrame(() => container.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block: "start" }));

  function missionData() {
    const start = weekStart().getTime();
    const casesThisWeek = Object.values(state.cases).filter((item) => new Date(item.completedAt).getTime() >= start).length;
    const cardsThisWeek = Object.values(state.cards).filter((item) => new Date(item.lastReviewed).getTime() >= start).length;
    const quiz = quizProgressToday();
    return [
      { label: "Completa el programa técnico", detail: `${Math.min(quiz, 12)} de 12 desafíos hoy`, value: Math.min(quiz, 12), goal: 12, href: "#recompensas" },
      { label: "Resuelve casos de obra", detail: `${Math.min(casesThisWeek, 2)} de 2 esta semana`, value: Math.min(casesThisWeek, 2), goal: 2, action: "cases" },
      { label: "Activa tu memoria", detail: `${Math.min(cardsThisWeek, 8)} de 8 tarjetas esta semana`, value: Math.min(cardsThisWeek, 8), goal: 8, action: "flashcards" }
    ];
  }

  function shell(content: string) {
    const current = level(state.xp);
    const pct = current.next === current.start ? 100 : Math.min(100, Math.round((state.xp - current.start) / (current.next - current.start) * 100));
    container.innerHTML = `<div class="tr-page fade-up">
      <header class="tr-hero">
        <div><span class="tr-kicker">Centro de Entrenamiento IMFRA</span><h1>Entrena el criterio que <em>la obra exige.</em></h1><p>Casos reales, memoria técnica y decisiones guiadas para convertir conocimiento en práctica profesional.</p></div>
        <div class="tr-hero__stats"><div><span>Racha</span><strong>${streak(state.days)} días</strong></div><div><span>XP formativo</span><strong>${state.xp}</strong></div></div>
      </header>
      <section class="tr-level"><div><span>Nivel profesional</span><strong>${current.name}</strong></div><div class="tr-level__bar"><span style="width:${pct}%"></span></div><b>${pct}%</b></section>
      ${content}
    </div>`;
    bind();
  }

  function renderHub() {
    view = "hub";
    const missions = missionData();
    const missionDone = missions.filter((item) => item.value >= item.goal).length;
    const completedCases = Object.keys(state.cases).length;
    const reviewedCards = Object.keys(state.cards).length;
    const achievements = [
      { label: "Primera inspección", detail: "Completa un caso", done: completedCases >= 1, icon: "i-clipboard-check" },
      { label: "Memoria activa", detail: "Repasa 8 tarjetas", done: reviewedCards >= 8, icon: "i-book" },
      { label: "Constancia", detail: "Alcanza una racha de 3 días", done: streak(state.days) >= 3, icon: "i-bolt" },
      { label: "Criterio integral", detail: "Resuelve los 6 casos", done: completedCases >= trainingCases.length, icon: "i-certificate" }
    ];
    shell(`<div class="tr-layout">
      <main class="tr-main">
        <div class="tr-section-head"><div><span>Entrenamiento aplicado</span><h2>Elige una modalidad</h2></div><small>${completedCases} casos · ${reviewedCards} tarjetas estudiadas</small></div>
        <div class="tr-modes">
          <article class="tr-mode tr-mode--quiz"><span class="tr-mode__index">01</span><div class="tr-mode__icon">${icon("i-bolt")}</div><span class="tr-tag">12 desafíos · 3 rondas</span><h3>Quiz Técnico</h3><p>Combina imágenes reales, cálculos, casos y conceptos. Genera Puntos IMFRA canjeables.</p><button class="btn btn--accent" data-training-action="quiz">Ir al quiz ${icon("i-arrow-right")}</button></article>
          <article class="tr-mode tr-mode--case"><span class="tr-mode__index">02</span><div class="tr-mode__icon">${icon("i-notebook")}</div><span class="tr-tag">${trainingCases.length} expedientes</span><h3>Casos de Obra</h3><p>Toma decisiones en situaciones encadenadas y recibe explicación técnica en cada paso.</p><button class="btn btn--accent" data-training-action="cases">Abrir expedientes ${icon("i-arrow-right")}</button></article>
          <article class="tr-mode tr-mode--flash"><span class="tr-mode__index">03</span><div class="tr-mode__icon">${icon("i-book")}</div><span class="tr-tag">${flashcards.length} conceptos</span><h3>Flashcards</h3><p>Refuerza vocabulario, procesos y control de obra con sesiones breves de memoria activa.</p><button class="btn btn--accent" data-training-action="flashcards">Iniciar repaso ${icon("i-arrow-right")}</button></article>
        </div>
        <section class="tr-achievements"><div class="tr-section-head"><div><span>Progreso verificable</span><h2>Insignias técnicas</h2></div></div><div class="tr-achievement-grid">${achievements.map((item) => `<article class="tr-achievement ${item.done ? "is-earned" : ""}"><div>${icon(item.icon)}</div><span>${item.done ? "Obtenida" : "Por desbloquear"}</span><strong>${item.label}</strong><small>${item.detail}</small></article>`).join("")}</div></section>
      </main>
      <aside class="tr-side">
        <section class="tr-mission"><div class="tr-mission__head"><div>${icon("i-trophy")}</div><span><small>Misión semanal</small><strong>${missionDone} de ${missions.length} completadas</strong></span></div><div class="tr-mission__progress"><span style="width:${Math.round(missionDone / missions.length * 100)}%"></span></div><ul>${missions.map((item) => `<li class="${item.value >= item.goal ? "is-done" : ""}"><b>${item.value >= item.goal ? "✓" : `${item.value}/${item.goal}`}</b><span><strong>${item.label}</strong><small>${item.detail}</small></span>${item.href ? `<a href="${item.href}" aria-label="Abrir ${item.label}">${icon("i-arrow-right")}</a>` : `<button data-training-action="${item.action}" aria-label="Abrir ${item.label}">${icon("i-arrow-right")}</button>`}</li>`).join("")}</ul></section>
        <section class="tr-standard"><span>Metodología</span><h3>Decidir, explicar, aplicar</h3><ol><li><b>01</b>Observa datos y restricciones.</li><li><b>02</b>Elige una actuación profesional.</li><li><b>03</b>Comprende la razón técnica.</li></ol><p>El XP formativo mide práctica. Los Puntos IMFRA canjeables se obtienen únicamente en actividades validadas.</p></section>
      </aside>
    </div>`);
  }

  function renderCases() {
    view = "cases";
    shell(`<button class="tr-back" data-training-action="hub">${icon("i-arrow-left")} Centro de entrenamiento</button>
      <div class="tr-section-head tr-section-head--page"><div><span>Simulador profesional</span><h2>Casos de Obra</h2><p>Decisiones encadenadas, consecuencias y explicación técnica.</p></div><small>${Object.keys(state.cases).length}/${trainingCases.length} resueltos</small></div>
      <div class="tr-case-grid">${trainingCases.map((item, index) => { const result = state.cases[item.id]; return `<article class="tr-case-card ${result ? "is-complete" : ""}"><div class="tr-case-card__top"><b>${String(index + 1).padStart(2, "0")}</b><span>${item.area}</span>${result ? `<em>✓ ${result.score}/${item.steps.length}</em>` : ""}</div><h3>${esc(item.title)}</h3><p>${esc(item.scenario)}</p><div class="tr-case-card__meta"><span>${item.difficulty}</span><span>${item.duration}</span><span>${item.steps.length} decisiones</span></div><button class="btn btn--ghost" data-case-id="${item.id}">${result ? "Revisar nuevamente" : "Abrir expediente"} ${icon("i-arrow-right")}</button></article>`; }).join("")}</div>`);
  }

  function renderCase() {
    if (!selectedCase) { renderCases(); return; }
    view = "case";
    const step = selectedCase.steps[caseStep];
    if (caseFinished) {
      const pct = Math.round(caseScore / selectedCase.steps.length * 100);
      shell(`<button class="tr-back" data-training-action="cases">${icon("i-arrow-left")} Casos de obra</button><section class="tr-case-result"><div class="tr-case-result__score"><strong>${pct}%</strong><span>${caseScore} de ${selectedCase.steps.length}</span></div><div><span class="tr-kicker">Expediente completado</span><h2>${esc(selectedCase.title)}</h2><p>${pct === 100 ? "Tomaste decisiones consistentes y trazables en todo el caso." : "El expediente quedó registrado. Revisa las explicaciones y vuelve a intentarlo para consolidar el criterio."}</p><div class="tr-case-result__actions"><button class="btn btn--accent" data-case-id="${selectedCase.id}">Repetir caso</button><button class="btn btn--ghost" data-training-action="cases">Elegir otro expediente</button></div></div></section>`);
      return;
    }
    shell(`<button class="tr-back" data-training-action="cases">${icon("i-arrow-left")} Expedientes</button>
      <section class="tr-case-run"><header><div><span class="tr-kicker">${esc(selectedCase.area)} · ${selectedCase.difficulty}</span><h2>${esc(selectedCase.title)}</h2></div><b>${caseStep + 1}/${selectedCase.steps.length}</b></header><div class="tr-case-run__bar"><span style="width:${(caseStep + 1) / selectedCase.steps.length * 100}%"></span></div><div class="tr-case-run__scenario"><span>Situación</span><p>${esc(selectedCase.scenario)}</p><small><b>Objetivo:</b> ${esc(selectedCase.objective)}</small></div><h3>${esc(step.prompt)}</h3><div class="tr-case-options">${step.options.map((option, index) => { const status = caseAnswer === null ? "" : index === step.correct ? " is-correct" : index === caseAnswer ? " is-wrong" : ""; return `<button ${caseAnswer === null ? "" : "disabled"} class="${status}" data-case-answer="${index}"><b>${String.fromCharCode(65 + index)}</b><span>${esc(option)}</span></button>`; }).join("")}</div>${caseAnswer !== null ? `<div class="tr-case-feedback ${caseAnswer === step.correct ? "is-correct" : ""}"><strong>${caseAnswer === step.correct ? "Decisión correcta" : "Decisión por revisar"}</strong><p>${esc(step.explanation)}</p><button class="btn btn--accent" data-case-next>${caseStep === selectedCase.steps.length - 1 ? "Cerrar expediente" : "Siguiente decisión"} ${icon("i-arrow-right")}</button></div>` : ""}</section>`);
  }

  function rebuildDeck() {
    deck = flashcards.filter((card) => cardArea === "Todas" || card.area === cardArea);
    cardIndex = 0;
    cardFlipped = false;
  }

  function renderFlashcards() {
    view = "flashcards";
    const card = deck[cardIndex] || flashcards[0];
    const areas = ["Todas", ...new Set(flashcards.map((item) => item.area))];
    const learned = deck.filter((item) => (state.cards[item.id]?.confidence || 0) >= 2).length;
    shell(`<button class="tr-back" data-training-action="hub">${icon("i-arrow-left")} Centro de entrenamiento</button>
      <div class="tr-section-head tr-section-head--page"><div><span>Memoria activa</span><h2>Flashcards de obra</h2><p>Intenta responder antes de revelar la explicación.</p></div><small>${learned}/${deck.length} dominadas</small></div>
      <div class="tr-filter">${areas.map((area) => `<button class="${area === cardArea ? "is-active" : ""}" data-card-area="${esc(area)}">${esc(area)}</button>`).join("")}</div>
      <section class="tr-flash-layout"><div class="tr-flash-progress"><span>${cardIndex + 1} / ${deck.length}</span><div><i style="width:${(cardIndex + 1) / deck.length * 100}%"></i></div><small>${esc(card.area)}</small></div><button class="tr-flashcard ${cardFlipped ? "is-flipped" : ""}" data-card-flip><span>${cardFlipped ? "Explicación" : "Concepto"}</span><strong>${esc(cardFlipped ? card.back : card.front)}</strong><small>${cardFlipped ? "¿Qué tan bien lo recordaste?" : "Toca la tarjeta para revelar"}</small></button>${cardFlipped ? `<div class="tr-flash-actions"><button data-card-rate="1"><span>Repasar</span><small>No lo recordé</small></button><button data-card-rate="2"><span>Entendido</span><small>Con algo de ayuda</small></button><button data-card-rate="3"><span>Dominado</span><small>Lo expliqué con claridad</small></button></div>` : `<button class="btn btn--accent tr-reveal" data-card-flip>Mostrar respuesta</button>`}</section>`);
  }

  function bind() {
    container.querySelectorAll<HTMLElement>("[data-training-action]").forEach((element) => element.addEventListener("click", () => {
      const action = element.dataset.trainingAction;
      if (action === "quiz") { location.hash = "recompensas"; return; }
      if (action === "hub") { renderHub(); goTo(); }
      if (action === "cases") { renderCases(); goTo(".tr-back"); }
      if (action === "flashcards") { rebuildDeck(); renderFlashcards(); goTo(".tr-back"); }
    }));
    container.querySelectorAll<HTMLButtonElement>("[data-case-id]").forEach((button) => button.addEventListener("click", () => {
      selectedCase = trainingCases.find((item) => item.id === button.dataset.caseId) || null;
      caseStep = 0; caseScore = 0; caseAnswer = null; caseFinished = false; renderCase(); goTo(".tr-case-run");
    }));
    container.querySelectorAll<HTMLButtonElement>("[data-case-answer]").forEach((button) => button.addEventListener("click", () => {
      if (!selectedCase || caseAnswer !== null) return;
      caseAnswer = Number(button.dataset.caseAnswer);
      if (caseAnswer === selectedCase.steps[caseStep].correct) caseScore += 1;
      renderCase();
    }));
    container.querySelector<HTMLButtonElement>("[data-case-next]")?.addEventListener("click", () => {
      if (!selectedCase) return;
      if (caseStep < selectedCase.steps.length - 1) { caseStep += 1; caseAnswer = null; renderCase(); }
      else {
        const previous = state.cases[selectedCase.id];
        if (!previous) state.xp += 45 + caseScore * 5;
        state.cases[selectedCase.id] = { score: Math.max(previous?.score || 0, caseScore), completedAt: new Date().toISOString() };
        registerDay(state); persistState(); caseFinished = true; renderCase();
      }
      goTo(caseFinished ? ".tr-case-result" : ".tr-case-run");
    });
    container.querySelectorAll<HTMLButtonElement>("[data-card-area]").forEach((button) => button.addEventListener("click", () => { cardArea = button.dataset.cardArea || "Todas"; rebuildDeck(); renderFlashcards(); }));
    container.querySelectorAll<HTMLButtonElement>("[data-card-flip]").forEach((button) => button.addEventListener("click", () => { cardFlipped = true; renderFlashcards(); }));
    container.querySelectorAll<HTMLButtonElement>("[data-card-rate]").forEach((button) => button.addEventListener("click", () => {
      const card = deck[cardIndex]; if (!card) return;
      const confidence = Number(button.dataset.cardRate);
      const previous = state.cards[card.id];
      const rewardDate = previous?.rewardDate;
      state.cards[card.id] = { confidence: Math.max(previous?.confidence || 0, confidence), lastReviewed: new Date().toISOString(), rewardDate: today() };
      if (rewardDate !== today()) state.xp += confidence;
      registerDay(state); persistState();
      cardIndex = (cardIndex + 1) % deck.length; cardFlipped = false; renderFlashcards();
    }));
  }

  const initialParams = new URLSearchParams(location.search);
  const initialView = initialParams.get("training");
  const initialCaseId = initialParams.get("case");
  if (initialCaseId) { selectedCase = trainingCases.find((item) => item.id === initialCaseId) || null; renderCase(); }
  else if (initialView === "cases") renderCases();
  else if (initialView === "flashcards") { rebuildDeck(); renderFlashcards(); }
  else renderHub();
  if (initialCaseId || initialView === "cases" || initialView === "flashcards") requestAnimationFrame(() => container.querySelector(initialCaseId ? ".tr-case-run" : ".tr-back")?.scrollIntoView({ behavior: "auto", block: "start" }));
  void loadTrainingProgress().then((remote) => {
    if (!remote) return;
    state = mergeTrainingProgress(state, remote);
    saveState(state);
    if (view === "cases") renderCases();
    else if (view === "case") renderCase();
    else if (view === "flashcards") renderFlashcards();
    else renderHub();
  });
}

window.IMFRATraining = { mount };
window.dispatchEvent(new CustomEvent("imfra:training-ready"));
