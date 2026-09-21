import "./rewards.css";
import { rewardCatalog, rewardQuestions, type RewardQuestion } from "./catalog";

interface RewardState {
  points: number;
  answered: Record<string, { correct: boolean; earned: number; answeredAt: string }>;
  redemptions: Array<{ id: string; rewardId: string; points: number; createdAt: string }>;
}

declare global {
  interface Window {
    IMFRARewards: { mount(container: HTMLElement): void };
    UserState?: { uid?: string; email?: string; modo?: string };
  }
}

const defaultState = (): RewardState => ({ points: 0, answered: {}, redemptions: [] });
const dateKey = () => new Date().toISOString().slice(0, 10);

function accountKey() {
  const isDemo = window.UserState?.modo === "demo" || new URLSearchParams(location.search).get("modo") === "demo";
  const account = isDemo ? "demo-preview-v2" : (window.UserState?.uid || window.UserState?.email || "guest");
  return `imfra:v2:rewards:${account}`;
}

function readState(): RewardState {
  try {
    const saved = JSON.parse(localStorage.getItem(accountKey()) || "null") as Partial<RewardState> | null;
    if (saved) return { ...defaultState(), ...saved, answered: saved.answered || {}, redemptions: saved.redemptions || [] };
  } catch {}
  const initial = defaultState();
  if (window.UserState?.modo === "demo" || new URLSearchParams(location.search).get("modo") === "demo") initial.points = 620;
  return initial;
}

function saveState(state: RewardState) {
  localStorage.setItem(accountKey(), JSON.stringify(state));
}

function dailyQuestion(): RewardQuestion {
  const seed = [...dateKey()].reduce((total, char) => total + char.charCodeAt(0), 0);
  return rewardQuestions[seed % rewardQuestions.length];
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character] || character);
}

function level(points: number) {
  if (points >= 2400) return { name: "Director de Obra", next: 2400, start: 2400 };
  if (points >= 1200) return { name: "Superintendente", next: 2400, start: 1200 };
  if (points >= 600) return { name: "Residente", next: 1200, start: 600 };
  if (points >= 200) return { name: "Oficial", next: 600, start: 200 };
  return { name: "Peón", next: 200, start: 0 };
}

function mount(container: HTMLElement) {
  let state = readState();
  const question = dailyQuestion();

  const render = () => {
    const answered = state.answered[question.id];
    const currentLevel = level(state.points);
    const progress = currentLevel.next === currentLevel.start
      ? 100
      : Math.min(100, Math.round(((state.points - currentLevel.start) / (currentLevel.next - currentLevel.start)) * 100));

    container.innerHTML = `
      <div class="rw-page fade-up">
        <section class="rw-hero">
          <div class="rw-hero__copy">
            <span class="rw-eyebrow">Programa piloto · IMFRA v2</span>
            <h1>Aprende, suma puntos y obtén <em>recompensas profesionales.</em></h1>
            <p>Resuelve retos de ingeniería y convierte tu constancia en acceso a software y recursos para obra.</p>
          </div>
          <div class="rw-balance" aria-label="Saldo de Puntos IMFRA">
            <span>Tu saldo</span>
            <strong>${state.points.toLocaleString("es-MX")}</strong>
            <small>Puntos IMFRA</small>
          </div>
        </section>

        <div class="rw-private-note">
          <svg class="ic"><use href="#i-shield-check"/></svg>
          <div><strong>Vista privada de desarrollo</strong><span>Los canjes están simulados. Ninguna licencia ni beneficio real se entrega todavía.</span></div>
        </div>

        <section class="rw-level-card">
          <div class="rw-level-card__head"><div><span>Nivel actual</span><strong>${currentLevel.name}</strong></div><b>${progress}%</b></div>
          <div class="rw-progress"><span style="width:${progress}%"></span></div>
          <small>${currentLevel.next > state.points ? `${currentLevel.next - state.points} puntos para el siguiente nivel` : "Nivel máximo alcanzado"}</small>
        </section>

        <div class="rw-grid">
          <section class="rw-quiz">
            <div class="rw-section-head"><div><span class="rw-eyebrow">Reto del día · hasta 30 puntos</span><h2>Pregunta técnica</h2></div><span class="rw-area">${escapeHtml(question.area)}</span></div>
            <p class="rw-question">${escapeHtml(question.question)}</p>
            <div class="rw-options">
              ${question.options.map((option, index) => {
                const status = answered ? (index === question.correct ? " is-correct" : "") : "";
                return `<button type="button" class="rw-option${status}" data-answer="${index}" ${answered ? "disabled" : ""}><span>${String.fromCharCode(65 + index)}</span>${escapeHtml(option)}</button>`;
              }).join("")}
            </div>
            ${answered ? `<div class="rw-feedback ${answered.correct ? "is-success" : "is-learning"}"><strong>${answered.correct ? `Correcto · +${answered.earned} puntos` : `Sigue aprendiendo · +${answered.earned} puntos`}</strong><p>${escapeHtml(question.explanation)}</p><small>Vuelve mañana para encontrar una pregunta diferente.</small></div>` : ""}
          </section>

          <aside class="rw-how">
            <span class="rw-eyebrow">Cómo acumular</span>
            <h2>Tu actividad tiene valor</h2>
            <ul>
              <li><b>+30</b><span>Respuesta correcta del reto diario</span></li>
              <li><b>+10</b><span>Participar aunque necesites repasar</span></li>
              <li><b>+50</b><span>Completar un curso</span></li>
              <li><b>+20</b><span>Aprobar una evaluación</span></li>
            </ul>
            <p>Antes de publicar, los puntos de cursos y evaluaciones se validarán en el servidor.</p>
          </aside>
        </div>

        <section class="rw-catalog">
          <div class="rw-section-head"><div><span class="rw-eyebrow">Catálogo piloto</span><h2>Recompensas disponibles</h2></div><span class="rw-catalog__count">${rewardCatalog.length} beneficios</span></div>
          <div class="rw-rewards">
            ${rewardCatalog.map((reward) => {
              const canRedeem = state.points >= reward.points;
              return `<article class="rw-reward" style="--reward-accent:${reward.accent}">
                <div class="rw-reward__icon"><svg class="ic"><use href="${reward.category === "Software" ? "#i-tools" : "#i-book"}"/></svg></div>
                <span class="rw-reward__type">${reward.category}</span>
                <h3>${escapeHtml(reward.name)}</h3>
                <p>${escapeHtml(reward.description)}</p>
                <div class="rw-reward__meta"><strong>${reward.points.toLocaleString("es-MX")} puntos</strong><span>${reward.availability}</span></div>
                <button type="button" class="btn ${canRedeem ? "btn--accent" : "btn--ghost"} rw-redeem" data-redeem="${reward.id}" ${canRedeem ? "" : "disabled"}>${canRedeem ? "Simular canje" : `Te faltan ${(reward.points - state.points).toLocaleString("es-MX")}`}</button>
              </article>`;
            }).join("")}
          </div>
        </section>

        ${state.redemptions.length ? `<section class="rw-history"><div class="rw-section-head"><div><span class="rw-eyebrow">Actividad privada</span><h2>Canjes simulados</h2></div></div>${state.redemptions.map((entry) => {
          const reward = rewardCatalog.find((item) => item.id === entry.rewardId);
          return `<div class="rw-history__row"><span><svg class="ic"><use href="#i-check-circle"/></svg>${escapeHtml(reward?.name || entry.rewardId)}</span><b>−${entry.points} puntos</b></div>`;
        }).join("")}</section>` : ""}
      </div>`;

    container.querySelectorAll<HTMLButtonElement>("[data-answer]").forEach((button) => {
      button.addEventListener("click", () => {
        if (state.answered[question.id]) return;
        const correct = Number(button.dataset.answer) === question.correct;
        const earned = correct ? 30 : 10;
        state.points += earned;
        state.answered[question.id] = { correct, earned, answeredAt: new Date().toISOString() };
        saveState(state);
        render();
      });
    });

    container.querySelectorAll<HTMLButtonElement>("[data-redeem]").forEach((button) => {
      button.addEventListener("click", () => {
        const reward = rewardCatalog.find((item) => item.id === button.dataset.redeem);
        if (!reward || state.points < reward.points) return;
        state.points -= reward.points;
        state.redemptions.unshift({ id: crypto.randomUUID(), rewardId: reward.id, points: reward.points, createdAt: new Date().toISOString() });
        saveState(state);
        render();
      });
    });
  };

  render();
}

window.IMFRARewards = { mount };
