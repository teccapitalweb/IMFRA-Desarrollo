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
  answered: Record<string, { correct: boolean; earned: number; answeredAt: string; selected?: number }>;
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
  const account = isDemo ? "demo-preview-v6" : (window.UserState?.uid || window.UserState?.email || "guest");
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

function dailyQuiz(): RewardQuestion[] {
  const seed = [...dateKey()].reduce((total, char) => total + char.charCodeAt(0), 0);
  const formats: RewardQuestion["type"][] = ["visual", "measurement", "case", "concept"];
  return formats.map((type, index) => {
    const candidates = rewardQuestions.filter((question) => question.type === type);
    return candidates[(seed + index) % candidates.length];
  });
}

const answerKey = (questionId: string) => `${dateKey()}:${questionId}`;

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

function questionTypeLabel(type: RewardQuestion["type"]) {
  return ({ concept: "Conocimiento", case: "Caso de obra", measurement: "Cálculo", visual: "Identificación visual" })[type];
}

function renderQuestionDiagram(question: RewardQuestion) {
  if (question.visual === "slab-plan") {
    return `<div class="rw-tech-diagram" aria-label="Planta y sección de una losa rectangular">
      <svg viewBox="0 0 520 210" role="img">
        <defs><pattern id="rw-grid" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M18 0H0V18" fill="none" stroke="currentColor" stroke-opacity=".08"/></pattern></defs>
        <rect width="520" height="210" fill="url(#rw-grid)"/>
        <g fill="none" stroke="currentColor" stroke-width="2"><rect x="76" y="38" width="284" height="118" rx="3"/><path d="M76 174v18m284-18v18M76 184h284M64 38H45m19 118H45M54 38v118"/><path d="m83 180-7 4 7 4m270-8 7 4-7 4M50 45l4-7 4 7m-8 104 4 7 4-7"/></g>
        <g fill="currentColor" font-family="JetBrains Mono,monospace" font-size="13"><text x="190" y="202">4.20 m</text><text x="18" y="102" transform="rotate(-90 18 102)">3.60 m</text><text x="384" y="74">ESPESOR</text><text x="384" y="98" font-size="25" font-weight="700">12 cm</text><text x="384" y="126" fill="#f59d1a">+ 5% desperdicio</text></g>
        <g stroke="#f59d1a" stroke-width="2"><path d="M360 91h18"/><circle cx="360" cy="91" r="4" fill="#f59d1a"/></g>
      </svg></div>`;
  }
  if (question.visual === "curve-s") {
    return `<div class="rw-tech-diagram" aria-label="Curva S de avance programado y ejecutado">
      <svg viewBox="0 0 520 210" role="img">
        <g stroke="currentColor" stroke-opacity=".1"><path d="M58 35v135h420M58 136h420M58 102h420M58 68h420"/></g>
        <path d="M58 169C135 165 166 147 218 116S318 48 472 38" fill="none" stroke="#7b8fff" stroke-width="4"/>
        <path d="M58 169C137 166 170 154 222 132S326 76 472 59" fill="none" stroke="#f59d1a" stroke-width="4" stroke-dasharray="8 7"/>
        <path d="M302 82v23" stroke="currentColor" stroke-opacity=".45" stroke-dasharray="3 3"/><circle cx="302" cy="82" r="5" fill="#7b8fff"/><circle cx="302" cy="105" r="5" fill="#f59d1a"/>
        <g fill="currentColor" font-family="JetBrains Mono,monospace" font-size="12"><text x="316" y="80">48% programado</text><text x="316" y="111">39% ejecutado</text><text x="56" y="193">SEMANA 1</text><text x="421" y="193">SEMANA 12</text></g>
      </svg></div>`;
  }
  return "";
}

function renderOptionVisual(kind: NonNullable<RewardQuestion["optionVisuals"]>[number]) {
  const base = `viewBox="0 0 180 104" role="img" aria-hidden="true"`;
  if (kind === "honeycomb") return `<svg ${base}><rect width="180" height="104" rx="8" fill="#a6a39c"/><g fill="#55534e">${[[25,26,9],[48,20,6],[74,34,10],[105,21,7],[139,31,11],[33,63,11],[63,75,7],[96,63,12],[128,76,8],[155,60,10]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g><g fill="#d2c7b1"><circle cx="20" cy="82" r="7"/><circle cx="116" cy="48" r="6"/><circle cx="152" cy="88" r="5"/></g></svg>`;
  if (kind === "crack") return `<svg ${base}><rect width="180" height="104" rx="8" fill="#aaa7a0"/><path d="M88 0 78 23l14 13-18 20 9 15-19 33" fill="none" stroke="#373737" stroke-width="4"/><path d="m80 48-24-9m20 28 22 8" stroke="#4a4a4a" stroke-width="2"/></svg>`;
  if (kind === "efflorescence") return `<svg ${base}><rect width="180" height="104" rx="8" fill="#8d8b86"/><g fill="none" stroke="#f1eee5" stroke-width="8" opacity=".86"><path d="M20 15c17 14 16 29 6 48s2 29 13 37M77 4c-8 23 15 35 5 58S87 93 99 103M143 8c13 21-5 31 3 50s-3 29-9 42"/></g></svg>`;
  if (kind === "corrosion") return `<svg ${base}><rect width="180" height="104" rx="8" fill="#a7a49e"/><path d="M0 68c38-18 61 13 93-5s58 7 87-8v49H0z" fill="#7d7770"/><path d="M8 72 172 49" stroke="#7e351d" stroke-width="12"/><path d="M8 72 172 49" stroke="#d66e32" stroke-width="4" stroke-dasharray="8 5"/><path d="m38 67 4 18m54-26 3 20m52-28 5 18" stroke="#5b291b" stroke-width="3"/></svg>`;
  if (kind === "beam") return `<svg ${base}><rect x="17" y="20" width="146" height="64" rx="3" fill="#d9dce2" stroke="#596275" stroke-width="2"/><g fill="none" stroke="#f59d1a" stroke-width="2">${[32,57,82,107,132,148].map(x=>`<rect x="${x}" y="27" width="13" height="50" rx="2"/>`).join("")}</g><g fill="#3c4658"><circle cx="28" cy="33" r="4"/><circle cx="152" cy="33" r="4"/><circle cx="28" cy="71" r="4"/><circle cx="152" cy="71" r="4"/></g></svg>`;
  if (kind === "column") return `<svg ${base}><rect x="70" y="7" width="40" height="90" fill="#d9dce2" stroke="#596275" stroke-width="2"/><g fill="none" stroke="#f59d1a" stroke-width="2">${[17,35,53,71].map(y=>`<rect x="76" y="${y}" width="28" height="10"/>`).join("")}</g><path d="M78 7v90m24-90v90" stroke="#3c4658" stroke-width="4"/></svg>`;
  if (kind === "slab") return `<svg ${base}><rect x="10" y="42" width="160" height="28" rx="2" fill="#d9dce2" stroke="#596275" stroke-width="2"/><g stroke="#f59d1a" stroke-width="2">${[24,48,72,96,120,144].map(x=>`<path d="M${x} 46v20"/>`).join("")}<path d="M16 52h148M16 62h148"/></g></svg>`;
  return `<svg ${base}><path d="M78 8h24v33h24l31 48H23l31-48h24z" fill="#d9dce2" stroke="#596275" stroke-width="2"/><g stroke="#f59d1a" stroke-width="2"><path d="M38 78h104M48 64h84"/>${[52,77,102,127].map(x=>`<path d="M${x} 57v26"/>`).join("")}</g></svg>`;
}

function mount(container: HTMLElement) {
  let state = readState();
  let pendingRewardId: string | null = null;
  const quizQuestions = dailyQuiz();
  const firstUnanswered = quizQuestions.find((question) => !state.answered[answerKey(question.id)]);
  let activeQuestionId = firstUnanswered?.id || quizQuestions.at(-1)?.id || quizQuestions[0].id;
  let showQuizSummary = !firstUnanswered;

  const render = () => {
    const question = quizQuestions.find((item) => item.id === activeQuestionId) || quizQuestions[0];
    const answered = state.answered[answerKey(question.id)];
    const quizAnswers = quizQuestions.map((item) => state.answered[answerKey(item.id)]).filter(Boolean);
    const completedCount = quizAnswers.length;
    const correctCount = quizAnswers.filter((answer) => answer.correct).length;
    const quizPoints = quizAnswers.reduce((total, answer) => total + answer.earned, 0);
    const quizProgress = Math.round((completedCount / quizQuestions.length) * 100);
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
          <section class="rw-quiz rw-quiz--pro">
            <div class="rw-quiz__masthead">
              <div><span class="rw-eyebrow">Quiz Técnico IMFRA · 4 desafíos</span><h2>Decisiones que ocurren en obra</h2></div>
              <div class="rw-quiz__counter"><strong>${completedCount}</strong><span>/ ${quizQuestions.length}</span></div>
            </div>
            <div class="rw-quiz__progress"><span style="width:${quizProgress}%"></span></div>
            ${showQuizSummary ? `<div class="rw-quiz-summary">
              <div class="rw-quiz-summary__score"><strong>${Math.round((correctCount / quizQuestions.length) * 100)}%</strong><span>Precisión técnica</span></div>
              <div class="rw-quiz-summary__copy"><span class="rw-eyebrow">Reto completado</span><h3>${correctCount >= 3 ? "Buen criterio de obra" : "La práctica fortalece el criterio"}</h3><p>Respondiste correctamente ${correctCount} de ${quizQuestions.length} desafíos y sumaste <strong>${quizPoints} Puntos IMFRA</strong>.</p><small>Mañana encontrarás una nueva combinación de casos y ejercicios.</small></div>
            </div>` : `<div class="rw-question-stage">
              <div class="rw-question-meta"><span>${questionTypeLabel(question.type)}</span><span>${question.difficulty}</span><span>${escapeHtml(question.area)}</span></div>
              ${question.context ? `<div class="rw-case-context"><b>Caso</b><p>${escapeHtml(question.context)}</p></div>` : ""}
              ${renderQuestionDiagram(question)}
              <h3 class="rw-question">${escapeHtml(question.question)}</h3>
              <div class="rw-options ${question.optionVisuals ? "is-visual" : ""}">
                ${question.options.map((option, index) => {
                  const status = answered
                    ? index === question.correct
                      ? " is-correct"
                      : answered.selected === index ? " is-wrong" : ""
                    : "";
                  return `<button type="button" class="rw-option${question.optionVisuals ? " has-visual" : ""}${status}" data-answer="${index}" data-question="${question.id}" ${answered ? "disabled" : ""}>
                    ${question.optionVisuals ? `<div class="rw-option__visual">${renderOptionVisual(question.optionVisuals[index])}</div>` : ""}
                    <b class="rw-option__letter">${String.fromCharCode(65 + index)}</b><div class="rw-option__text">${escapeHtml(option)}</div>
                  </button>`;
                }).join("")}
              </div>
              ${answered ? `<div class="rw-feedback ${answered.correct ? "is-success" : "is-learning"}"><strong>${answered.correct ? `Correcto · +${answered.earned} puntos` : `Respuesta registrada · +${answered.earned} puntos`}</strong><p>${escapeHtml(question.explanation)}</p><button type="button" class="btn btn--ghost rw-next-question" data-next-question>${completedCount === quizQuestions.length ? "Ver resultado" : "Siguiente desafío"} <span aria-hidden="true">→</span></button></div>` : ""}
            </div>`}
          </section>

          <aside class="rw-how">
            <span class="rw-eyebrow">Entrenamiento aplicado</span>
            <h2>Más que preguntas</h2>
            <p class="rw-how__intro">Cada sesión mezcla formatos para evaluar criterio, lectura técnica y toma de decisiones.</p>
            <ul>
              <li><b>01</b><span>Casos reales de supervisión</span></li>
              <li><b>02</b><span>Planos, medidas y cálculos</span></li>
              <li><b>03</b><span>Identificación mediante imágenes</span></li>
              <li><b>04</b><span>Explicación técnica de cada respuesta</span></li>
            </ul>
            <div class="rw-how__points"><span>Sesión diaria</span><strong>Hasta 120 pts</strong><small>30 por acierto · 10 por participación</small></div>
            <p>Antes de publicar, los intentos y puntos se validarán en el servidor.</p>
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
        const answeredQuestion = quizQuestions.find((item) => item.id === button.dataset.question);
        if (!answeredQuestion) return;
        const key = answerKey(answeredQuestion.id);
        if (state.answered[key]) return;
        const selected = Number(button.dataset.answer);
        const correct = selected === answeredQuestion.correct;
        const earned = correct ? 30 : 10;
        state.points += earned;
        state.answered[key] = { correct, earned, selected, answeredAt: new Date().toISOString() };
        saveState(state);
        render();
      });
    });

    container.querySelector<HTMLButtonElement>("[data-next-question]")?.addEventListener("click", () => {
      const nextQuestion = quizQuestions.find((item) => !state.answered[answerKey(item.id)]);
      if (nextQuestion) activeQuestionId = nextQuestion.id;
      else showQuizSummary = true;
      render();
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
