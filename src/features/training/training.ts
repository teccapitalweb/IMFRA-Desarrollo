import "./training.css";
import { flashcards, trainingCases, type TrainingCase } from "./catalog";
import { rewardQuestions, rewardCatalog } from "../rewards/catalog";
import { loadTrainingProgress, mergeTrainingProgress, syncTrainingProgress } from "./cloud";
import { loadLeague, syncLeagueProfile, type LeagueEntry, type LeaguePeriod, type LeagueSnapshot } from "./league";
import { celebrate } from "../shared/celebration";
import { GAME_INFO } from "../class-games/content";
import "../shared/coin-chest";
import { openArcade, type ArcadeResult } from "./arcade";
import { GAME_CREDITS, boardOfTheDay, retoGames, type RetoGame } from "./games-catalog";
import { awardCreditForCorrect, awardGameCredit, completeChallengeAttempt, getChallengeAccess, showChallengeBlocked, startChallengeAttempt, type ChallengeMode } from "../credits/credits";

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
    __showPaywallModal?: (options?: { title?: string; sub?: string; cta?: string }) => void;
  }
}

type View = "hub" | "cases" | "case" | "flashcards" | "games";
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

function gamesKey() { return `imfra:v2:retos-juegos:${accountId()}`; }
function gamesWonToday(): Record<string, number[]> {
  try {
    const saved = JSON.parse(localStorage.getItem(gamesKey()) || "null") as { day?: string; won?: Record<string, number[]> } | null;
    return saved?.day === today() ? saved.won || {} : {};
  } catch { return {}; }
}
function markGameWon(tipo: string, board: number) {
  const won = gamesWonToday();
  won[tipo] = [...new Set([...(won[tipo] || []), board])];
  try { localStorage.setItem(gamesKey(), JSON.stringify({ day: today(), won })); } catch { /* sin almacenamiento */ }
}

function bestKey() { return `imfra:v2:retos-juegos-best:${accountId()}`; }
function readBest(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(bestKey()) || "{}") || {}; } catch { return {}; }
}
function saveBest(id: string, stars: number) {
  const best = readBest();
  if ((best[id] || 0) >= stars) return;
  best[id] = stars;
  try { localStorage.setItem(bestKey(), JSON.stringify(best)); } catch { /* sin almacenamiento */ }
}

// Mini ilustraciones de cada juego (HTML y CSS, sin imágenes).
const GAME_ART: Record<string, string> = {
  crucigrama: `<div class="ga-cw">${"L|OBRA|S|A".split("|").map((row) => row.padEnd(4, "·").split("").map((ch) => ch === "·" ? "<i></i>" : `<b>${ch}</b>`).join("")).join("")}</div>`,
  memorama: `<div class="ga-mm"><i></i><b>Losa</b><i></i></div>`,
  sopa: `<div class="ga-ws">${"KTRAZ|CBMOP|GRAVA|LUNEX|NIVEL".split("|").join("").split("").map((ch) => `<b>${ch}</b>`).join("")}<span class="ga-ws__mark"></span></div>`,
  ordenar: `<div class="ga-ord"><span><b>1</b><i></i></span><span><b>2</b><i></i></span><span class="is-lift"><b>3</b><i></i></span></div>`,
  ahorcado: `<div class="ga-hm"><span>L</span><span></span><span>S</span><span>A</span></div>`,
  clasificar: `<div class="ga-cl"><em>Casco</em><span></span><span></span></div>`
};

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
  if (window.IMFRACredits?.isLoaded()) return { points: window.IMFRACredits.getBalance() };
  const demo = window.UserState?.modo === "demo" || new URLSearchParams(location.search).get("modo") === "demo";
  const account = demo ? "demo-preview-v7" : (window.UserState?.uid || window.UserState?.email || "guest");
  try {
    const state = JSON.parse(localStorage.getItem(`imfra:v2:rewards:${account}`) || "null");
    return { points: Number(state?.points) || 0 };
  } catch { return { points: 0 }; }
}

function chipIcon(rewardId: string) {
  if (rewardId === "imdac-control-obra-30d") return "assets/icons/chip-imdac.png";
  if (rewardId === "software-presupuestos") return "assets/icons/chip-presupuestos.png";
  if (rewardId === "pack-plantillas-pro") return "assets/icons/chip-plantillas.png";
  return "assets/icons/chip-catalogo.png";
}

function flashcardImage(cardId: string) {
  const numeric = Number(cardId.replace(/\D/g, "")) || 1;
  return `assets/flashcards/f${String(((numeric - 1) % 18) + 1).padStart(2, "0")}.jpg`;
}

const tileArt = {
  quiz: `<img src="assets/retos/quiz-tecnico.png" alt="" loading="lazy">`,
  case: `<img src="assets/retos/casos-obra.png" alt="" loading="lazy">`,
  flash: `<img src="assets/retos/tarjetas.png" alt="" loading="lazy">`,
  games: `<img src="assets/retos/juegos.svg" alt="" loading="lazy">`
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
  let leaguePeriod: LeaguePeriod = "mes";
  const leagueCache = new Map<LeaguePeriod, LeagueSnapshot | null>();
  let league: LeagueSnapshot | null = demoMode ? demoLeague() : null;
  let leagueLoaded = demoMode;
  const refreshLeague = (period: LeaguePeriod = leaguePeriod) => {
    if (demoMode) return;
    leaguePeriod = period;
    const cached = leagueCache.get(period);
    if (cached !== undefined) { league = cached; leagueLoaded = true; }
    else leagueLoaded = false;
    if (view === "hub") paintLeague();
    void loadLeague(period).then((snapshot) => {
      leagueCache.set(period, snapshot);
      if (leaguePeriod !== period) return;
      league = snapshot;
      leagueLoaded = true;
      if (view === "hub") paintLeague();
    });
  };
  // Repinta solo la clasificación, sin mover el resto de la página.
  const paintLeague = () => {
    const section = container.querySelector(".tr-league");
    if (!section) return;
    section.outerHTML = renderLeague();
    bindLeague();
  };
  const bindLeague = () => {
    container.querySelectorAll<HTMLButtonElement>("[data-league-period]").forEach((button) => button.addEventListener("click", () => {
      const period = button.dataset.leaguePeriod as LeaguePeriod;
      if (period === leaguePeriod) return;
      if (demoMode) { leaguePeriod = period; paintLeague(); return; }
      refreshLeague(period);
    }));
  };
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
  const trialCardsReviewed = new Set<string>();
  let flashTrialCompleted = false;
  const pendingAwards = new Set<Promise<unknown>>();
  const persistState = () => { saveState(state); void syncTrainingProgress(state); };

  let challengeStarting = false;
  async function ensureChallenge(mode: ChallengeMode) {
    if (challengeStarting) return false;
    challengeStarting = true;
    container.setAttribute("aria-busy", "true");
    try {
      await startChallengeAttempt(mode);
      return true;
    } catch (error) {
      console.warn("[training] Acceso al reto bloqueado", error);
      showChallengeBlocked(error);
      return false;
    } finally {
      challengeStarting = false;
      container.removeAttribute("aria-busy");
    }
  }

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
    const streakDays = streak(state.days);
    container.innerHTML = `<div class="tr-page fade-up">
      <header class="tr-hero">
        <div><span class="tr-kicker">Retos IMFRA</span><h1>Practica para <em>la obra real.</em></h1><p>Quiz, casos, tarjetas y juegos de obra.</p></div>
        <div class="tr-hero__stats"><div><span>Racha</span><strong>${streakDays} día${streakDays === 1 ? "" : "s"}</strong></div><div><span>XP formativo</span><strong>${state.xp}</strong></div></div>
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
    const gamesWon = gamesWonToday();
    const gamesDone = retoGames.filter((game) => gamesWon[game.tipo]?.length).length;
    const rewards = rewardsSnapshot();
    const rewardChips = [...rewardCatalog].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)).slice(0, 3);
    const access = getChallengeAccess();
    const accessNote = access.status === "available"
      ? "Tu primera partida es gratis y sí puede darte Créditos IMFRA. Después necesitarás ser VIP."
      : access.status === "active"
        ? "Tu partida gratuita está activa. Los aciertos de esta partida sí suman Créditos IMFRA."
        : access.status === "used"
          ? "Ya utilizaste tu partida gratuita. Hazte VIP para seguir jugando y ganando créditos."
          : `Cada respuesta correcta suma 25 Créditos IMFRA y cada juego ganado, ${GAME_CREDITS} al día.`;
    const achievements = [
      { label: "Primera inspección", detail: "Completa un caso", done: completedCases >= 1, icon: "assets/icons/badge-inspeccion.png" },
      { label: "Memoria activa", detail: "Repasa 8 tarjetas", done: reviewedCards >= 8, icon: "assets/icons/badge-memoria.png" },
      { label: "Constancia", detail: "Alcanza una racha de 3 días", done: streak(state.days) >= 3, icon: "assets/icons/badge-constancia.png" },
      { label: "Criterio integral", detail: `Resuelve los ${trainingCases.length} casos`, done: completedCases >= trainingCases.length, icon: "assets/icons/badge-criterio.png" }
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
          <article class="tr-tile tr-tile--games" data-training-action="games">
            <div class="tr-tile__body">
              <span class="tr-tile__icon">${icon("i-trophy")}</span>
              <h3>Juegos de Obra</h3>
              <p>Juega y gana créditos</p>
              <span class="tr-tile__stat">${gamesDone}/${retoGames.length} ganados hoy · +${GAME_CREDITS} c/u</span>
              <button class="btn tr-tile__cta">Jugar ${icon("i-arrow-right")}</button>
            </div>
            <div class="tr-tile__art">${tileArt.games}</div>
          </article>
        </div>
        ${renderLeague()}
        <p class="tr-rewards__note tr-rewards__note--solo">${icon("i-shield-check")}<span>${accessNote} Canjea tus créditos en <button type="button" class="tr-link" data-go-premios>Materiales y premios</button>.</span></p>
        <section class="tr-achievements"><div class="tr-section-head"><div><span>Progreso verificable</span><h2>Insignias técnicas</h2></div></div><div class="tr-achievement-grid">${achievements.map((item) => `<article class="tr-achievement ${item.done ? "is-earned" : ""}"><img src="${item.icon}" alt="" loading="lazy"><span>${item.done ? "Obtenida" : "Por desbloquear"}</span><strong>${item.label}</strong></article>`).join("")}</div></section>
      </main>
      <aside class="tr-side">
        <section class="tr-credit-vault" aria-label="Mis Créditos IMFRA">
          <div class="tr-credit-vault__art" aria-hidden="true"><span class="tr-credit-vault__glow"></span><span class="tr-credit-vault__gem">◆</span><i></i><i></i><i></i></div>
          <div class="tr-credit-vault__copy"><span>Mi cartera IMFRA</span><strong>${rewards.points.toLocaleString("es-MX")} <small>créditos</small></strong><p>Tu saldo para desbloquear materiales, libros y herramientas.</p></div>
          <button type="button" data-go-premios>Ver premios ${icon("i-arrow-right")}</button>
        </section>
        <section class="tr-mission"><div class="tr-mission__head"><div>${icon("i-trophy")}</div><span><small>Misión semanal</small><strong>${missionDone} de ${missions.length} completadas</strong></span></div><div class="tr-mission__progress"><span style="width:${Math.round(missionDone / missions.length * 100)}%"></span></div><ul>${missions.map((item) => `<li class="${item.value >= item.goal ? "is-done" : ""}" data-training-action="${item.action}"><b>${item.value >= item.goal ? "✓" : `${item.value}/${item.goal}`}</b><span><strong>${item.label}</strong></span><button aria-label="Abrir ${item.label}">${icon("i-arrow-right")}</button></li>`).join("")}</ul></section>
        <section class="tr-standard"><span>Metodología</span><h3>Decidir, explicar, aplicar</h3><ol><li><b>01</b>Observa datos y restricciones.</li><li><b>02</b>Elige una actuación profesional.</li><li><b>03</b>Comprende la razón técnica.</li></ol><p>${accessNote}</p></section>
      </aside>
    </div>`);
  }

  function renderGamesPage() {
    view = "games";
    const won = gamesWonToday();
    const best = readBest();
    const done = retoGames.filter((game) => won[game.tipo]?.length).length;
    const stars = (n: number) => `<span class="tr-gcard__stars" aria-label="${n} de 3 estrellas">${[1, 2, 3].map((i) => `<i class="${i <= n ? "is-on" : ""}">★</i>`).join("")}</span>`;
    shell(`<button class="tr-back" data-training-action="hub"><span style="display:inline-flex;transform:rotate(180deg)">${icon("i-arrow-right")}</span> Centro de entrenamiento</button>
      <div class="tr-section-head tr-section-head--page"><div><span>Juegos de obra</span><h2>Juega y gana créditos</h2><p>Un tablero nuevo cada día en cada juego. Gánalo y suma +${GAME_CREDITS} créditos.</p></div><small>${done}/${retoGames.length} ganados hoy</small></div>
      <div class="tr-gcards">${retoGames.map((game) => {
        const isDone = Boolean(won[game.tipo]?.length);
        const board = boardOfTheDay(game);
        const top = Math.max(0, ...game.tableros.map((_, i) => best[`${game.tipo}:${i}`] || 0));
        return `<article class="tr-gcard ${isDone ? "is-done" : ""}" style="--g:${game.color}" data-game="${game.tipo}" tabindex="0" role="button" aria-label="Jugar ${esc(game.titulo)}">
          <div class="tr-gcard__art">${GAME_ART[game.tipo]}</div>
          <div class="tr-gcard__body">
            <div class="tr-gcard__top"><span class="tr-gcard__icon">${GAME_INFO[game.tipo].icono}</span>${top ? stars(top) : ""}</div>
            <h3>${esc(game.titulo)}</h3>
            <p>${esc(game.descripcion)}</p>
            <span class="tr-gcard__board">Hoy: ${esc(game.tableros[board].titulo)}</span>
            <div class="tr-gcard__foot"><span class="tr-gcard__reward">${isDone ? "✓ Ganado hoy" : `+${GAME_CREDITS} créditos`}</span><span class="tr-gcard__play">${isDone ? "Practicar" : "Jugar"} ${icon("i-arrow-right")}</span></div>
          </div>
        </article>`;
      }).join("")}</div>`);
  }

  async function playGame(game: RetoGame, forcedBoard?: number) {
    if (!(await ensureChallenge("juegos"))) return;
    const wonBoards = gamesWonToday()[game.tipo] || [];
    const earning = wonBoards.length === 0;
    // Primero el tablero del día; ya ganado, se practica con los demás.
    const start = boardOfTheDay(game);
    const board = forcedBoard ?? (earning ? start : (start + wonBoards.length) % game.tableros.length);
    openArcade({
      game,
      board,
      earning,
      credits: GAME_CREDITS,
      onWin: async (result: ArcadeResult) => {
        markGameWon(game.tipo, board);
        saveBest(`${game.tipo}:${board}`, result.stars);
        if (!earning) return 0;
        state.xp += 20;
        registerDay(state); persistState();
        try {
          const credits = await awardGameCredit(game.tipo, board, GAME_CREDITS);
          if (credits > 0) leagueCache.clear();
          if (credits > 0) window.IMFRACoinChest?.show({ amount: credits, total: window.IMFRACredits?.getBalance(), title: "¡Juego ganado!" });
          return credits;
        } finally {
          await completeChallengeAttempt("juegos").catch((error) => console.warn("[training] No se pudo cerrar la partida gratuita", error));
        }
      },
      onAnother: () => { void playGame(game, (board + 1) % game.tableros.length); },
      onClose: () => {
        if (!container.isConnected) return;
        if (view === "games") renderGamesPage();
        else if (view === "hub") renderHub();
        if (!leagueCache.has(leaguePeriod)) refreshLeague();
      }
    });
  }

  function renderLeague() {
    const periods: [LeaguePeriod, string][] = [["semana", "Semana"], ["mes", "Mes"], ["total", "Histórico"]];
    const notes: Record<LeaguePeriod, string> = {
      semana: "Se reinicia cada lunes: todos empiezan desde cero.",
      mes: "Se reinicia el día 1 de cada mes.",
      total: "Todo tu avance desde que llegaste a IMFRA."
    };
    const empty: Record<LeaguePeriod, string> = { semana: "esta semana", mes: "este mes", total: "todavía" };
    const tabs = `<div class="tr-league-tabs" role="tablist" aria-label="Periodo">${periods.map(([id, label]) => `<button type="button" role="tab" aria-selected="${id === leaguePeriod}" class="${id === leaguePeriod ? "is-active" : ""}" data-league-period="${id}">${label}</button>`).join("")}</div>`;
    const head = `<div class="tr-section-head"><div><span>Avance verificado</span><h2>Clasificación del club</h2></div>${tabs}</div>
      <p class="tr-league__intro">${notes[leaguePeriod]} Clase completada <b>+10</b> · curso terminado <b>+300</b> · acierto en retos <b>+10</b> · juego ganado <b>+30</b>.</p>`;
    const frame = (content: string, modifier = "") => `<section class="tr-league ${modifier}"><div class="tr-league__surface">${content}</div></section>`;
    if (!leagueLoaded) return frame(`${head}<div class="tr-league__skeleton"></div>`, "tr-league--loading");
    if (!league?.entries?.length) return frame(`${head}<p class="tr-league__empty">Aún nadie suma puntos ${empty[leaguePeriod]}. Completa una clase o gana un juego de obra y aparece aquí primero.</p>`);
    const me = window.UserState?.uid;
    const podium = league.entries.slice(0, 3);
    const rows = league.entries.slice(3, 10);
    const row = (entry: LeagueEntry) => `<article class="tr-league-row ${entry.uid === me ? "is-you" : ""}"><b>${entry.rank ? `#${entry.rank}` : "–"}</b><div class="tr-league-avatar">${avatar(entry)}</div><div class="tr-league-person"><strong>${esc(entry.name)}${entry.uid === me ? " <em>Tú</em>" : ""}</strong><span>${entry.courses ? `${entry.courses} curso${entry.courses === 1 ? "" : "s"} completado${entry.courses === 1 ? "" : "s"}` : "Profesional en formación"}</span></div><span>${entry.classes}<small>clases</small></span><strong>${entry.xp}<small>XP</small></strong></article>`;
    const current = league.current;
    const you = !current || league.entries.some((entry) => entry.uid === current.uid) ? ""
      : current.rank ? `<div class="tr-league-you"><span>Tu posición · de ${league.participants}</span>${row(current)}</div>`
        : `<div class="tr-league-you"><span>Tu posición</span><p>Aún no sumas puntos ${empty[leaguePeriod]}. Completa una clase o gana un juego para entrar.</p></div>`;
    return frame(`${head}
      <div class="tr-podium">${podium.map((entry) => `<article class="tr-podium-card tr-podium-card--${entry.rank} ${entry.uid === me ? "is-you" : ""}"><span class="tr-podium-rank">#${entry.rank}</span><div class="tr-podium-avatar">${avatar(entry)}</div><strong>${esc(entry.name)}</strong><small>${entry.courses} curso${entry.courses === 1 ? "" : "s"} · ${entry.classes} clase${entry.classes === 1 ? "" : "s"}</small><b>${entry.xp} XP</b></article>`).join("")}</div>
      <div class="tr-league-table">${rows.map(row).join("")}</div>
      ${you}
      <p class="tr-league__privacy">${icon("i-shield-check")} Puntos validados por el servidor. Solo mostramos nombre, foto y avance; nunca datos de contacto.</p>
    `);
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
            <div class="tr-fc-face tr-fc-front" style="background-image:linear-gradient(180deg,rgba(8,8,8,.12) 0%,rgba(8,8,8,.32) 42%,rgba(6,6,6,.95) 100%),url('${flashcardImage(card.id)}')">
              <div class="tr-fc-top"><span class="tr-fc-cat">${esc(card.area)}</span><span class="tr-fc-progress">${cardIndex + 1} de ${deck.length}</span></div>
              <div class="tr-fc-main"><h3 class="tr-fc-term">${esc(card.front)}</h3><p class="tr-fc-hint">${hint}</p><button class="btn tr-fc-cta" data-card-flip>Mostrar respuesta ${icon("i-arrow-right")}</button></div>
            </div>
            <div class="tr-fc-face tr-fc-back" style="background-image:linear-gradient(180deg,rgba(6,6,6,.2) 0%,rgba(6,6,6,.55) 30%,rgba(6,6,6,.97) 62%),url('${flashcardImage(card.id)}')">
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
    bindLeague();
    container.querySelectorAll<HTMLButtonElement>("[data-go-premios]").forEach((button) => button.addEventListener("click", () => window.navigateToSection?.("pdfs")));
    container.querySelectorAll<HTMLElement>("[data-game]").forEach((card) => {
      const open = () => { const game = retoGames.find((item) => item.tipo === card.dataset.game); if (game) void playGame(game); };
      card.addEventListener("click", open);
      card.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); } });
    });
    container.querySelectorAll<HTMLElement>("[data-training-action]").forEach((element) => element.addEventListener("click", async () => {
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
      if (action === "games") { renderGamesPage(); goTo(".tr-back"); }
      if (action === "flashcards") {
        if (!(await ensureChallenge("flashcards"))) return;
        rebuildDeck(); renderFlashcards(); goTo(".tr-back");
      }
    }));
    container.querySelectorAll<HTMLButtonElement>("[data-case-id]").forEach((button) => button.addEventListener("click", async () => {
      if (!(await ensureChallenge("inspector"))) return;
      selectedCase = trainingCases.find((item) => item.id === button.dataset.caseId) || null;
      caseStep = 0; caseScore = 0; caseAnswer = null; caseFinished = false; renderCase(); goTo(".tr-case-run");
    }));
    container.querySelectorAll<HTMLButtonElement>("[data-case-answer]").forEach((button) => button.addEventListener("click", () => {
      if (!selectedCase || caseAnswer !== null) return;
      caseAnswer = Number(button.dataset.caseAnswer);
      if (caseAnswer === selectedCase.steps[caseStep].correct) {
        caseScore += 1;
        let award: Promise<unknown>;
        award = awardCreditForCorrect(`inspector:${selectedCase.id}:${caseStep}`, "inspector", caseAnswer)
          .catch((error) => console.warn("[training] Crédito pendiente de sincronización", error))
          .finally(() => pendingAwards.delete(award));
        pendingAwards.add(award);
        celebrate("subtle");
      }
      renderCase();
    }));
    container.querySelector<HTMLButtonElement>("[data-case-next]")?.addEventListener("click", async (event) => {
      if (!selectedCase) return;
      if (caseStep < selectedCase.steps.length - 1) { caseStep += 1; caseAnswer = null; renderCase(); }
      else {
        (event.currentTarget as HTMLButtonElement).disabled = true;
        await Promise.allSettled([...pendingAwards]);
        const previous = state.cases[selectedCase.id];
        if (!previous) state.xp += 45 + caseScore * 5;
        state.cases[selectedCase.id] = { score: Math.max(previous?.score || 0, caseScore), completedAt: new Date().toISOString() };
        registerDay(state); persistState(); caseFinished = true;
        await completeChallengeAttempt("inspector").catch((error) => console.warn("[training] No se pudo cerrar la partida gratuita", error));
        renderCase();
        celebrate(caseScore === selectedCase.steps.length ? "big" : "normal");
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
      trialCardsReviewed.add(card.id);
      if (!flashTrialCompleted && trialCardsReviewed.size >= 8) {
        flashTrialCompleted = true;
        void completeChallengeAttempt("flashcards").then((access) => {
          if (access.status === "vip" || !container.isConnected) return;
          // El turno gratuito de tarjetas termina aquí: volvemos al centro e invitamos a VIP.
          renderHub(); goTo();
          showChallengeBlocked(null);
        }).catch((error) => {
          flashTrialCompleted = false;
          console.warn("[training] No se pudo cerrar el repaso gratuito", error);
        });
      }
      if (confidence === 3 && (previous?.confidence || 0) < 3) celebrate("subtle");
      cardIndex = (cardIndex + 1) % deck.length; cardFlipped = false; renderFlashcards();
    }));
  }

  const initialParams = new URLSearchParams(location.search);
  const initialView = initialParams.get("training");
  const initialCaseId = initialParams.get("case");
  if (initialCaseId) {
    renderHub();
    void ensureChallenge("inspector").then((allowed) => {
      if (!allowed) return;
      selectedCase = trainingCases.find((item) => item.id === initialCaseId) || null;
      renderCase();
      goTo(".tr-case-run");
    });
  }
  else if (initialView === "cases") renderCases();
  else if (initialView === "games") renderGamesPage();
  else if (initialView === "flashcards") {
    renderHub();
    void ensureChallenge("flashcards").then((allowed) => {
      if (!allowed) return;
      rebuildDeck(); renderFlashcards(); goTo(".tr-back");
    });
  }
  else renderHub();
  const onCreditsChanged = () => {
    if (!container.isConnected) {
      window.removeEventListener("imfra:credits-changed", onCreditsChanged);
      return;
    }
    if (view === "hub") renderHub();
    else if (view === "games") renderGamesPage();
  };
  window.addEventListener("imfra:credits-changed", onCreditsChanged);
  void window.IMFRACredits?.hydrate().then(() => { if (view === "hub") renderHub(); })
    .catch((error) => console.warn("[training] No se pudo cargar el saldo", error));
  if (initialView === "cases") requestAnimationFrame(() => container.querySelector(".tr-back")?.scrollIntoView({ behavior: "auto", block: "start" }));
  void loadTrainingProgress().then((remote) => {
    if (!remote) return;
    state = mergeTrainingProgress(state, remote);
    saveState(state);
    if (view === "cases") renderCases();
    else if (view === "case") renderCase();
    else if (view === "flashcards") renderFlashcards();
    else if (view === "games") renderGamesPage();
    else renderHub();
  });
  if (!demoMode) {
    void syncLeagueProfile()
      .catch((error) => console.warn("[training] No se pudo sincronizar el perfil de aprendizaje", error))
      .then(() => loadLeague(leaguePeriod))
      .then((snapshot) => {
        leagueCache.set(leaguePeriod, snapshot);
        league = snapshot;
        leagueLoaded = true;
        if (view === "hub") paintLeague();
      });
  }
}

window.IMFRATraining = { mount };
window.dispatchEvent(new CustomEvent("imfra:training-ready"));
