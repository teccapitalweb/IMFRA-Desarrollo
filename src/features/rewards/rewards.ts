import "./rewards.css";
import { rewardCatalog, rewardQuestions, type RewardItem, type RewardQuestion } from "./catalog";

interface Redemption {
  id: string;
  rewardId: string;
  points: number;
  createdAt: string;
  validUntil?: string;
  status?: "active" | "pending";
}

interface RewardState {
  points: number;
  answered: Record<string, { correct: boolean; earned: number; answeredAt: string }>;
  redemptions: Redemption[];
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
  const account = isDemo ? "demo-preview-v4" : (window.UserState?.uid || window.UserState?.email || "guest");
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function activeRedemption(state: RewardState, rewardId: string) {
  return state.redemptions.find((entry) => entry.rewardId === rewardId && (!entry.validUntil || new Date(entry.validUntil) > new Date()));
}

function rewardIcon(reward: RewardItem) {
  return reward.category === "Software" ? "#i-tools" : "#i-book";
}

function mount(container: HTMLElement) {
  let state = readState();
  let pendingRewardId: string | null = null;
  const question = dailyQuestion();

  const render = () => {
    const answered = state.answered[question.id];
    const currentLevel = level(state.points);
    const progress = currentLevel.next === currentLevel.start
      ? 100
      : Math.min(100, Math.round(((state.points - currentLevel.start) / (currentLevel.next - currentLevel.start)) * 100));
    const featuredReward = rewardCatalog.find((reward) => reward.featured);
    const featuredAccess = featuredReward ? activeRedemption(state, featuredReward.id) : undefined;
    const pendingReward = rewardCatalog.find((reward) => reward.id === pendingRewardId);

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
          <div><strong>Vista privada de desarrollo</strong><span>Este flujo funciona como prototipo, pero todavía no genera una licencia real ni modifica el sistema de IMDAC.</span></div>
        </div>

        ${featuredReward ? `<section class="rw-featured ${featuredAccess ? "is-active" : ""}" style="--reward-accent:${featuredReward.accent}">
          <div class="rw-featured__main">
            <div class="rw-featured__topline">
              <span class="rw-product-mark">IM<span>DAC</span></span>
              <span class="rw-status"><i></i>${featuredAccess ? "Acceso activo" : "Recompensa destacada"}</span>
            </div>
            <span class="rw-eyebrow">Software profesional para construcción</span>
            <h2>${escapeHtml(featuredReward.name)}</h2>
            <p>${escapeHtml(featuredReward.description)}</p>
            <div class="rw-featured__facts">
              <div><span>Duración</span><strong>${featuredReward.durationDays} días</strong></div>
              <div><span>Inversión</span><strong>${featuredReward.points.toLocaleString("es-MX")} pts</strong></div>
              <div><span>Proveedor</span><strong>${escapeHtml(featuredReward.brand || "IMDAC")}</strong></div>
            </div>
          </div>
          <div class="rw-featured__side">
            ${featuredAccess ? `<div class="rw-access-ready">
              <span class="rw-access-ready__icon"><svg class="ic"><use href="#i-check-circle"/></svg></span>
              <div><span>Beneficio activado</span><strong>Tu acceso está listo</strong><small>${featuredAccess.validUntil ? `Válido hasta el ${formatDate(featuredAccess.validUntil)}` : "Acceso piloto registrado"}</small></div>
              <a class="btn btn--accent rw-access-button" href="${featuredReward.accessUrl}" target="_blank" rel="noopener noreferrer">Entrar a IMDAC <span aria-hidden="true">↗</span></a>
            </div>` : `<div class="rw-feature-list">
              <span>Incluye</span>
              <ul>${(featuredReward.features || []).map((feature) => `<li><svg class="ic"><use href="#i-check-circle"/></svg>${escapeHtml(feature)}</li>`).join("")}</ul>
              <button type="button" class="btn btn--accent rw-featured__cta" data-redeem="${featuredReward.id}" ${state.points >= featuredReward.points ? "" : "disabled"}>${state.points >= featuredReward.points ? `Canjear por ${featuredReward.points} puntos` : `Te faltan ${(featuredReward.points - state.points).toLocaleString("es-MX")} puntos`}</button>
              <small>Se solicitará confirmación antes de descontar tus puntos.</small>
            </div>`}
          </div>
        </section>` : ""}

        <section class="rw-redemption-flow">
          <div class="rw-redemption-flow__intro"><span class="rw-eyebrow">Así funciona el beneficio</span><h2>Del aprendizaje a una herramienta real</h2></div>
          <ol>
            <li><b>01</b><div><strong>Acumulas</strong><span>Participa en cursos, evaluaciones y retos técnicos.</span></div></li>
            <li><b>02</b><div><strong>Canjeas</strong><span>Confirmas el uso de tus puntos y activas el beneficio.</span></div></li>
            <li><b>03</b><div><strong>Accedes</strong><span>IMFRA genera tu acceso y te dirige al software IMDAC.</span></div></li>
          </ol>
        </section>

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
          <div class="rw-section-head"><div><span class="rw-eyebrow">Catálogo piloto</span><h2>Más recompensas</h2></div><span class="rw-catalog__count">${rewardCatalog.filter((reward) => !reward.featured).length} beneficios adicionales</span></div>
          <div class="rw-rewards">
            ${rewardCatalog.filter((reward) => !reward.featured).map((reward) => {
              const canRedeem = state.points >= reward.points;
              const redeemed = activeRedemption(state, reward.id);
              return `<article class="rw-reward" style="--reward-accent:${reward.accent}">
                <div class="rw-reward__icon"><svg class="ic"><use href="${rewardIcon(reward)}"/></svg></div>
                <span class="rw-reward__type">${reward.category}</span>
                <h3>${escapeHtml(reward.name)}</h3>
                <p>${escapeHtml(reward.description)}</p>
                <div class="rw-reward__meta"><strong>${reward.points.toLocaleString("es-MX")} puntos</strong><span>${reward.availability}</span></div>
                <button type="button" class="btn ${canRedeem && !redeemed ? "btn--accent" : "btn--ghost"} rw-redeem" data-redeem="${reward.id}" ${canRedeem && !redeemed ? "" : "disabled"}>${redeemed ? "Beneficio canjeado" : canRedeem ? "Canjear beneficio" : `Te faltan ${(reward.points - state.points).toLocaleString("es-MX")}`}</button>
              </article>`;
            }).join("")}
          </div>
        </section>

        ${state.redemptions.length ? `<section class="rw-history"><div class="rw-section-head"><div><span class="rw-eyebrow">Tu actividad</span><h2>Historial de beneficios</h2></div></div>${state.redemptions.map((entry) => {
          const reward = rewardCatalog.find((item) => item.id === entry.rewardId);
          return `<div class="rw-history__row"><span><svg class="ic"><use href="#i-check-circle"/></svg><span><strong>${escapeHtml(reward?.name || entry.rewardId)}</strong><small>${formatDate(entry.createdAt)} · ${entry.status === "active" ? "Acceso activado" : "Canje registrado"}</small></span></span><b>−${entry.points} puntos</b></div>`;
        }).join("")}</section>` : ""}
      </div>

      ${pendingReward ? `<div class="rw-dialog-backdrop" data-close-dialog>
          <section class="rw-dialog" role="dialog" aria-modal="true" aria-labelledby="rw-dialog-title">
            <button type="button" class="rw-dialog__close" data-close-dialog aria-label="Cerrar">×</button>
            <span class="rw-dialog__icon"><svg class="ic"><use href="${rewardIcon(pendingReward)}"/></svg></span>
            <span class="rw-eyebrow">Confirmar beneficio</span>
            <h2 id="rw-dialog-title">${escapeHtml(pendingReward.name)}</h2>
            <p>Se descontarán <strong>${pendingReward.points.toLocaleString("es-MX")} puntos</strong> de tu saldo. ${pendingReward.durationDays ? `El acceso tendrá una vigencia de ${pendingReward.durationDays} días.` : "El beneficio quedará registrado en tu cuenta."}</p>
            <div class="rw-dialog__balance"><span>Saldo actual <b>${state.points.toLocaleString("es-MX")}</b></span><i>→</i><span>Saldo restante <b>${(state.points - pendingReward.points).toLocaleString("es-MX")}</b></span></div>
            <div class="rw-dialog__note"><svg class="ic"><use href="#i-shield-check"/></svg><span>En esta vista privada la activación es una simulación segura. No se enviarán datos ni se creará una cuenta externa.</span></div>
            <div class="rw-dialog__actions"><button type="button" class="btn btn--ghost" data-close-dialog>Cancelar</button><button type="button" class="btn btn--accent" data-confirm-redeem="${pendingReward.id}">Confirmar canje</button></div>
          </section>
        </div>` : ""}`;

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
        if (!reward || state.points < reward.points || activeRedemption(state, reward.id)) return;
        pendingRewardId = reward.id;
        render();
      });
    });

    container.querySelectorAll<HTMLElement>("[data-close-dialog]").forEach((element) => {
      element.addEventListener("click", (event) => {
        if (event.target !== element && element.classList.contains("rw-dialog-backdrop")) return;
        pendingRewardId = null;
        render();
      });
    });

    container.querySelectorAll<HTMLButtonElement>("[data-confirm-redeem]").forEach((button) => {
      button.addEventListener("click", () => {
        const reward = rewardCatalog.find((item) => item.id === button.dataset.confirmRedeem);
        if (!reward || state.points < reward.points || activeRedemption(state, reward.id)) return;
        const createdAt = new Date();
        const validUntil = reward.durationDays ? new Date(createdAt.getTime() + reward.durationDays * 86400000).toISOString() : undefined;
        state.points -= reward.points;
        state.redemptions.unshift({ id: crypto.randomUUID(), rewardId: reward.id, points: reward.points, createdAt: createdAt.toISOString(), validUntil, status: "active" });
        pendingRewardId = null;
        saveState(state);
        render();
      });
    });
  };

  render();
}

window.IMFRARewards = { mount };
window.dispatchEvent(new CustomEvent("imfra:rewards-ready"));
