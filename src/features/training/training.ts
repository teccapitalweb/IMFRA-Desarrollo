import "./training.css";
import { flashcards, trainingCases, type TrainingCase } from "./catalog";
import { rewardQuestions, rewardCatalog } from "../rewards/catalog";
import { loadTrainingProgress, mergeTrainingProgress, syncTrainingProgress } from "./cloud";
import { loadLeague, syncLeagueProfile, type LeagueEntry, type LeagueSnapshot } from "./league";

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
    UserState?: { uid?: string; email?: string; modo?: string; photoURL?: string; displayName?: string };
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
function safePhoto(value?: string) { return /^https:\/\//i.test(value || "") ? value || "" : ""; }
function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase() || "IM"; }
function avatar(entry: LeagueEntry) {
  const photo = safePhoto(entry.photoURL);
  return photo ? `<img src="${esc(photo)}" alt="" referrerpolicy="no-referrer">` : `<span>${esc(initials(entry.name))}</span>`;
}

function isDemoTraining() {
  return window.UserState?.modo === "invitado" || window.UserState?.modo === "demo" || new URLSearchParams(location.search).get("modo") === "demo";
}

function demoLeague(): LeagueSnapshot {
  const entries: LeagueEntry[] = [
    { uid: "demo-1", name: "Mariana Rodríguez", photoURL: "", courses: 2, classes: 14, xp: 920, rank: 1 },
    { uid: "demo-2", name: "Carlos Hernández", photoURL: "", courses: 1, classes: 16, xp: 760, rank: 2 },
    { uid: "demo-3", name: "Andrea Salgado", photoURL: "", courses: 1, classes: 11, xp: 610, rank: 3 },
    { uid: "demo-preview", name: "Tu perfil", photoURL: "", courses: 0, classes: 4, xp: 140, rank: 4 }
  ];
  return { entries, current: entries[3], participants: entries.length };
}

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

function rewardsSnapshot() {
  const demo = window.UserState?.modo === "demo" || new URLSearchParams(location.search).get("modo") === "demo";
  const account = demo ? "demo-preview-v7" : (window.UserState?.uid || window.UserState?.email || "guest");
  try {
    const state = JSON.parse(localStorage.getItem(`imfra:v2:rewards:${account}`) || "null");
    return { points: Number(state?.points) || 0 };
  } catch { return { points: 0 }; }
}

function chipIcon(rewardId: string) {
  if (rewardId === "imdac-control-obra-30d") return "assets/icons/chip-imdac.png";
  if (rewardId === "software-presupuestos-7d") return "assets/icons/chip-presupuestos.png";
  if (rewardId === "pack-plantillas-pro") return "assets/icons/chip-plantillas.png";
  return "assets/icons/chip-catalogo.png";
}

const tileArt = {
  quiz: `<img src="assets/retos/quiz-tecnico.png" alt="" loading="lazy">`,
  case: `<img src="assets/retos/casos-obra.png" alt="" loading="lazy">`,
  flash: `<img src="assets/retos/tarjetas.png" alt="" loading="lazy">`
};

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
  const demoMode = isDemoTraining();
  let league: LeagueSnapshot | null = demoMode ? demoLeague() : null;
  let leagueLoaded = demoMode;
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
      { label: "Completa el quiz técnico", detail: `${Math.min(quiz, 12)} de 12 respuestas hoy`, value: Math.min(quiz, 12), goal: 12, action: "quiz" },
      { label: "Resuelve casos de obra", detail: `${Math.min(casesThisWeek, 2)} de 2 esta semana`, value: Math.min(casesThisWeek, 2), goal: 2, action: "cases" },
      { label: "Activa tu memoria", detail: `${Math.min(cardsThisWeek, 8)} de 8 tarjetas esta semana`, value: Math.min(cardsThisWeek, 8), goal: 8, action: "flashcards" }
    ];
  }

  function shell(content: string) {
    const current = level(state.xp);
    const pct = current.next === current.start ? 100 : Math.min(100, Math.round((state.xp - current.start) / (current.next - current.start) * 100));
    container.innerHTML = `<div class="tr-page fade-up">
      <header class="tr-hero">
        <div><span class="tr-kicker">Retos IMFRA</span><h1>Practica para <em>la obra real.</em></h1><p>Quiz, casos, tarjetas y recompensas.</p></div>
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
    const rewards = rewardsSnapshot();
    const rewardChips = [...rewardCatalog].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)).slice(0, 3);
    const achievements = [
      { label: "Primera inspección", detail: "Completa un caso", done: completedCases >= 1, icon: "assets/icons/badge-inspeccion.png" },
      { label: "Memoria activa", detail: "Repasa 8 tarjetas", done: reviewedCards >= 8, icon: "assets/icons/badge-memoria.png" },
      { label: "Constancia", detail: "Alcanza una racha de 3 días", done: streak(state.days) >= 3, icon: "assets/icons/badge-constancia.png" },
      { label: "Criterio integral", detail: "Resuelve los 6 casos", done: completedCases >= trainingCases.length, icon: "assets/icons/badge-criterio.png" }
    ];
    shell(`<div class="tr-layout">
      <main class="tr-main">
        <div class="tr-section-head"><div><span>Entrenamiento aplicado</span><h2>Elige una modalidad</h2></div><small>${completedCases} casos · ${reviewedCards} tarjetas estudiadas</small></div>
        <div class="tr-modes">
          <article class="tr-tile tr-tile--quiz" data-training-action="quiz">
            <div class="tr-tile__body">
              <span class="tr-tile__icon">${icon("i-bolt")}</span>
              <h3>Reto de Obra</h3>
              <p>Decide con criterio técnico</p>
              <span class="tr-tile__stat">3 rondas · 12 decisiones</span>
              <button class="btn tr-tile__cta">Comenzar ${icon("i-arrow-right")}</button>
            </div>
            <div class="tr-tile__art">${tileArt.quiz}</div>
          </article>
          <article class="tr-tile tr-tile--case" data-training-action="cases">
            <div class="tr-tile__body">
              <span class="tr-tile__icon">${icon("i-briefcase")}</span>
              <h3>Inspector de Obra</h3>
              <p>Analiza expedientes reales</p>
              <span class="tr-tile__stat">${completedCases}/${trainingCases.length} casos resueltos</span>
              <button class="btn tr-tile__cta">Abrir expedientes ${icon("i-arrow-right")}</button>
            </div>
            <div class="tr-tile__art">${tileArt.case}</div>
          </article>
          <article class="tr-tile tr-tile--flash" data-training-action="flashcards">
            <div class="tr-tile__body">
              <span class="tr-tile__icon">${icon("i-book")}</span>
              <h3>Flashcards Técnicas</h3>
              <p>Domina conceptos de campo</p>
              <span class="tr-tile__stat">${reviewedCards}/${flashcards.length} dominadas</span>
              <button class="btn tr-tile__cta">Repasar ${icon("i-arrow-right")}</button>
            </div>
            <div class="tr-tile__art">${tileArt.flash}</div>
          </article>
        </div>
        ${renderLeague()}
        <section class="tr-rewards">
          <div class="tr-section-head"><div><span>Recompensas IMFRA</span><h2>Cambia tus puntos por herramientas reales</h2></div><div class="tr-rewards__balance"><span>Tu saldo</span><strong>${rewards.points.toLocaleString("es-MX")}</strong></div></div>
          <div class="tr-rewards__row">${rewardChips.map((reward) => `<button class="tr-chip" data-training-action="rewards" style="--mode:${reward.accent}"><img class="tr-chip__icon" src="${chipIcon(reward.id)}" alt="" loading="lazy"><div><strong>${esc(reward.name)}</strong><small>${reward.points.toLocaleString("es-MX")} pts</small></div></button>`).join("")}
            <button class="tr-chip tr-chip--more" data-training-action="rewards"><img class="tr-chip__icon" src="assets/icons/chip-catalogo.png" alt="" loading="lazy"><div><strong>Ver catálogo</strong><small>${rewardCatalog.length} beneficios</small></div></button>
          </div>
        </section>
        <section class="tr-achievements"><div class="tr-section-head"><div><span>Progreso verificable</span><h2>Insignias técnicas</h2></div></div><div class="tr-achievement-grid">${achievements.map((item) => `<article class="tr-achievement ${item.done ? "is-earned" : ""}"><img src="${item.icon}" alt="" loading="lazy"><span>${item.done ? "Obtenida" : "Por desbloquear"}</span><strong>${item.label}</strong></article>`).join("")}</div></section>
      </main>
      <aside class="tr-side">
        <section class="tr-mission"><div class="tr-mission__head"><div>${icon("i-trophy")}</div><span><small>Misión semanal</small><strong>${missionDone} de ${missions.length} completadas</strong></span></div><div class="tr-mission__progress"><span style="width:${Math.round(missionDone / missions.length * 100)}%"></span></div><ul>${missions.map((item) => `<li class="${item.value >= item.goal ? "is-done" : ""}" data-training-action="${item.action}"><b>${item.value >= item.goal ? "✓" : `${item.value}/${item.goal}`}</b><span><strong>${item.label}</strong></span><button aria-label="Abrir ${item.label}">${icon("i-arrow-right")}</button></li>`).join("")}</ul></section>
        <section class="tr-standard"><span>Metodología</span><h3>Decidir, explicar, aplicar</h3><ol><li><b>01</b>Observa datos y restricciones.</li><li><b>02</b>Elige una actuación profesional.</li><li><b>03</b>Comprende la razón técnica.</li></ol><p>El XP formativo mide práctica. Los Puntos IMFRA canjeables se obtienen únicamente en actividades validadas.</p></section>
      </aside>
    </div>`);
  }

  function renderLeague() {
    if (!leagueLoaded) return `<section class="tr-league tr-league--loading"><div class="tr-section-head"><div><span>Avance verificado</span><h2>Clasificación del club</h2></div><span class="tr-league__verified">${icon("i-shield-check")} Datos de cursos</span></div><p>Estamos reuniendo el avance de la comunidad…</p><div class="tr-league__skeleton"></div></section>`;
    if (!league?.entries?.length) return `<section class="tr-league"><div class="tr-section-head"><div><span>Avance verificado</span><h2>Clasificación del club</h2></div><span class="tr-league__verified">${icon("i-shield-check")} Datos de cursos</span></div><p class="tr-league__intro">La clasificación aparecerá cuando los miembros sincronicen su primer avance.</p></section>`;
    const podium = league.entries.slice(0, 3);
    const rows = league.entries.slice(3, 10);
    const row = (entry: LeagueEntry) => `<article class="tr-league-row ${entry.uid === window.UserState?.uid ? "is-you" : ""}"><b>${entry.rank}</b><div class="tr-league-avatar">${avatar(entry)}</div><div class="tr-league-person"><strong>${esc(entry.name)}${entry.uid === window.UserState?.uid ? " <em>Tú</em>" : ""}</strong><span>${entry.courses ? `${entry.courses} curso${entry.courses === 1 ? "" : "s"} completado${entry.courses === 1 ? "" : "s"}` : "Profesional en formación"}</span></div><span>${entry.classes}<small>clases</small></span><strong>${entry.xp}<small>XP</small></strong></article>`;
    return `<section class="tr-league">
      <div class="tr-section-head"><div><span>Avance verificado</span><h2>Clasificación del club</h2></div><span class="tr-league__verified">${icon("i-shield-check")} Datos de cursos</span></div>
      <p class="tr-league__intro">Aquí se reconoce a quienes convierten la constancia en resultados. Las clases y cursos terminados valen más que una visita.</p>
      <div class="tr-podium">${podium.map((entry) => `<article class="tr-podium-card tr-podium-card--${entry.rank} ${entry.uid === window.UserState?.uid ? "is-you" : ""}"><span class="tr-podium-rank">#${entry.rank}</span><div class="tr-podium-avatar">${avatar(entry)}</div><strong>${esc(entry.name)}</strong><small>${entry.courses} cursos · ${entry.classes} clases</small><b>${entry.xp} XP</b></article>`).join("")}</div>
      <div class="tr-league-table">${rows.map(row).join("")}</div>
      ${league.current && league.current.rank > 10 ? `<div class="tr-league-you"><span>Tu posición actual</span>${row(league.current)}</div>` : ""}
      <p class="tr-league__privacy">${icon("i-shield-check")} Solo mostramos nombre, foto y avance de aprendizaje. Nunca datos de contacto.</p>
    </section>`;
  }

  function renderCases() {
    view = "cases";
    shell(`<button class="tr-back" data-training-action="hub"><span style="display:inline-flex;transform:rotate(180deg)">${icon("i-arrow-right")}</span> Centro de entrenamiento</button>
      <div class="tr-section-head tr-section-head--page"><div><span>Simulador profesional</span><h2>Casos de Obra</h2><p>Decisiones encadenadas, consecuencias y explicación técnica.</p></div><small>${Object.keys(state.cases).length}/${trainingCases.length} resueltos</small></div>
      <div class="tr-case-grid">${trainingCases.map((item, index) => { const result = state.cases[item.id]; return `<article class="tr-case-card ${result ? "is-complete" : ""}"><div class="tr-case-card__top"><b>${String(index + 1).padStart(2, "0")}</b><span>${item.area}</span>${result ? `<em>✓ ${result.score}/${item.steps.length}</em>` : ""}</div><h3>${esc(item.title)}</h3><p>${esc(item.scenario)}</p><div class="tr-case-card__meta"><span>${item.difficulty}</span><span>${item.duration}</span><span>${item.steps.length} decisiones</span></div><button class="btn btn--ghost" data-case-id="${item.id}">${result ? "Revisar nuevamente" : "Abrir expediente"} ${icon("i-arrow-right")}</button></article>`; }).join("")}</div>`);
  }

  function renderCase() {
    if (!selectedCase) { renderCases(); return; }
    view = "case";
    const step = selectedCase.steps[caseStep];
    if (caseFinished) {
      const pct = Math.round(caseScore / selectedCase.steps.length * 100);
      shell(`<button class="tr-back" data-training-action="cases"><span style="display:inline-flex;transform:rotate(180deg)">${icon("i-arrow-right")}</span> Casos de obra</button><section class="tr-case-result"><div class="tr-case-result__score"><strong>${pct}%</strong><span>${caseScore} de ${selectedCase.steps.length}</span></div><div><span class="tr-kicker">Expediente completado</span><h2>${esc(selectedCase.title)}</h2><p>${pct === 100 ? "Tomaste decisiones consistentes y trazables en todo el caso." : "El expediente quedó registrado. Revisa las explicaciones y vuelve a intentarlo para consolidar el criterio."}</p><div class="tr-case-result__actions"><button class="btn btn--accent" data-case-id="${selectedCase.id}">Repetir caso</button><button class="btn btn--ghost" data-training-action="cases">Elegir otro expediente</button></div></div></section>`);
      return;
    }
    shell(`<button class="tr-back" data-training-action="cases"><span style="display:inline-flex;transform:rotate(180deg)">${icon("i-arrow-right")}</span> Expedientes</button>
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
    const hints = ["Identifica este término", "Pon a prueba tu memoria técnica", "Reconoce este concepto"];
    const hint = hints[cardIndex % hints.length];
    const tip = card.id === "f13"
      ? `<div class="tr-fc-tip"><span>Clave rápida</span><ol><li><b>1</b>Eliminar</li><li><b>2</b>Sustituir</li><li><b>3</b>Ingeniería</li><li><b>4</b>Administrativos</li><li><b>5</b>EPP</li></ol></div>`
      : "";
    shell(`<button class="tr-back" data-training-action="hub"><span style="display:inline-flex;transform:rotate(180deg)">${icon("i-arrow-right")}</span> Centro de entrenamiento</button>
      <div class="tr-section-head tr-section-head--page"><div><span>Repaso rápido</span><h2>Tarjetas técnicas</h2></div><small>${learned}/${deck.length} dominadas</small></div>
      <div class="tr-filter">${areas.map((area) => `<button class="${area === cardArea ? "is-active" : ""}" data-card-area="${esc(area)}">${esc(area)}</button>`).join("")}</div>
      <section class="tr-flash-layout">
        <article class="tr-flashcard ${cardFlipped ? "is-flipped" : ""}">
          <div class="tr-fc-inner">
            <div class="tr-fc-face tr-fc-front" style="background-image:linear-gradient(180deg,rgba(8,8,8,.12) 0%,rgba(8,8,8,.32) 42%,rgba(6,6,6,.95) 100%),url('assets/flashcards/${card.id}.jpg')">
              <div class="tr-fc-top"><span class="tr-fc-cat">${esc(card.area)}</span><span class="tr-fc-progress">${cardIndex + 1} de ${deck.length}</span></div>
              <div class="tr-fc-main"><h3 class="tr-fc-term">${esc(card.front)}</h3><p class="tr-fc-hint">${hint}</p><button class="btn tr-fc-cta" data-card-flip>Mostrar respuesta ${icon("i-arrow-right")}</button></div>
            </div>
            <div class="tr-fc-face tr-fc-back" style="background-image:linear-gradient(180deg,rgba(6,6,6,.2) 0%,rgba(6,6,6,.55) 30%,rgba(6,6,6,.97) 62%),url('assets/flashcards/${card.id}.jpg')">
              <span class="tr-fc-badge">Respuesta</span>
              <h4 class="tr-fc-back-term">${esc(card.front)}</h4>
              <p class="tr-fc-def">${esc(card.back)}</p>
              ${tip}
              <div class="tr-flash-actions"><button data-card-rate="1"><span>↻</span>Repasar</button><button data-card-rate="2"><span>☺</span>Entendido</button><button data-card-rate="3"><span>♕</span>Dominado</button></div>
            </div>
          </div>
        </article>
      </section>`);
  }

  function bind() {
    container.querySelectorAll<HTMLElement>("[data-training-action]").forEach((element) => element.addEventListener("click", () => {
      const action = element.dataset.trainingAction;
      if (action === "quiz") {
        if (window.IMFRARewards) window.IMFRARewards.mountQuiz(container);
        else window.addEventListener("imfra:rewards-ready", () => window.IMFRARewards?.mountQuiz(container), { once: true });
        return;
      }
      if (action === "rewards") {
        if (window.IMFRARewards) window.IMFRARewards.mount(container);
        else window.addEventListener("imfra:rewards-ready", () => window.IMFRARewards?.mount(container), { once: true });
        return;
      }
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
  if (!demoMode) {
    void syncLeagueProfile()
      .catch((error) => console.warn("[training] No se pudo sincronizar el perfil de aprendizaje", error))
      .then(() => loadLeague())
      .then((snapshot) => {
        league = snapshot;
        leagueLoaded = true;
        if (view === "hub") renderHub();
      });
  }
}

window.IMFRATraining = { mount };
window.dispatchEvent(new CustomEvent("imfra:training-ready"));
