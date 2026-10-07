import "./coin-chest.css";

// ═══════════════════════════════════════════════════════════════════
// Cofre de créditos: aviso central y breve al ganar Créditos IMFRA.
// El cofre se abre, caen monedas dentro, el número sube y desaparece solo.
// ═══════════════════════════════════════════════════════════════════

export interface CoinChestOptions {
  amount: number;
  /** Saldo total después de sumar; si se omite no se muestra. */
  total?: number;
  title?: string;
  /** Milisegundos visibles antes de desvanecerse. */
  duration?: number;
}

declare global {
  interface Window {
    IMFRACoinChest: { show(options: CoinChestOptions): void };
  }
}

const COIN = `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="#e8930c"/><circle cx="20" cy="20" r="15.5" fill="url(#cc-coin)"/><circle cx="20" cy="20" r="12" fill="none" stroke="#c9780a" stroke-width="1.6" stroke-dasharray="2 2.2"/><path d="M24.6 15.4a6.4 6.4 0 1 0 0 9.2" fill="none" stroke="#8a4f05" stroke-width="3" stroke-linecap="round"/><ellipse cx="14" cy="12" rx="4" ry="2" fill="#fff" opacity=".55" transform="rotate(-30 14 12)"/></svg>`;

const CHEST = `<svg class="cc-chest" viewBox="0 0 200 170" aria-hidden="true">
  <defs>
    <linearGradient id="cc-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a5a22"/><stop offset="1" stop-color="#5f3410"/></linearGradient>
    <linearGradient id="cc-wood-lid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b56d2c"/><stop offset="1" stop-color="#7a4417"/></linearGradient>
    <linearGradient id="cc-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset=".55" stop-color="#f5b52a"/><stop offset="1" stop-color="#c9820e"/></linearGradient>
    <radialGradient id="cc-coin" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff2b8"/><stop offset=".45" stop-color="#ffc83d"/><stop offset="1" stop-color="#f09a12"/></radialGradient>
    <radialGradient id="cc-inner" cx=".5" cy=".2" r=".9"><stop offset="0" stop-color="#ffd76a"/><stop offset=".5" stop-color="#d98a12"/><stop offset="1" stop-color="#5f3410"/></radialGradient>
  </defs>
  <ellipse cx="100" cy="160" rx="78" ry="8" fill="rgba(0,0,0,.22)"/>
  <!-- interior visible al abrir -->
  <path d="M30 70h140v18H30z" fill="url(#cc-inner)"/>
  <g class="cc-pile">
    <ellipse cx="70" cy="80" rx="13" ry="5" fill="#f5b52a" stroke="#b9770b" stroke-width="1.5"/>
    <ellipse cx="96" cy="76" rx="13" ry="5" fill="#ffd36a" stroke="#b9770b" stroke-width="1.5"/>
    <ellipse cx="122" cy="80" rx="13" ry="5" fill="#f5b52a" stroke="#b9770b" stroke-width="1.5"/>
    <ellipse cx="108" cy="70" rx="12" ry="4.5" fill="#ffe08a" stroke="#b9770b" stroke-width="1.5"/>
    <ellipse cx="82" cy="71" rx="12" ry="4.5" fill="#ffd36a" stroke="#b9770b" stroke-width="1.5"/>
    <ellipse cx="96" cy="64" rx="11" ry="4" fill="#fff0b0" stroke="#b9770b" stroke-width="1.5"/>
  </g>
  <!-- cuerpo -->
  <rect x="26" y="82" width="148" height="74" rx="10" fill="url(#cc-wood)"/>
  <path d="M26 104h148M26 130h148" stroke="#4a2709" stroke-width="2" opacity=".55"/>
  <rect x="26" y="82" width="16" height="74" rx="4" fill="url(#cc-gold)"/>
  <rect x="158" y="82" width="16" height="74" rx="4" fill="url(#cc-gold)"/>
  <rect x="84" y="94" width="32" height="34" rx="7" fill="url(#cc-gold)" stroke="#8a560a" stroke-width="2"/>
  <circle cx="100" cy="108" r="5" fill="#5a3306"/><path d="M100 110v9" stroke="#5a3306" stroke-width="4" stroke-linecap="round"/>
  <!-- tapa -->
  <g class="cc-lid">
    <path d="M26 84V62c0-26 32-40 74-40s74 14 74 40v22z" fill="url(#cc-wood-lid)"/>
    <path d="M26 84V62c0-26 32-40 74-40s74 14 74 40v22" fill="none" stroke="#4a2709" stroke-width="2" opacity=".5"/>
    <path d="M42 84V52c0-14 2-20 6-24M158 84V52c0-14-2-20-6-24" stroke="url(#cc-gold)" stroke-width="14" fill="none"/>
    <rect x="22" y="78" width="156" height="10" rx="4" fill="url(#cc-gold)"/>
  </g>
</svg>`;

let active: HTMLElement | null = null;

function show(options: CoinChestOptions) {
  const amount = Math.max(0, Math.round(Number(options.amount) || 0));
  if (!amount) return;
  active?.remove();
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const coins = Math.min(8, Math.max(3, Math.ceil(amount / 2)));
  const total = Number.isFinite(Number(options.total)) ? Math.max(0, Number(options.total)) : null;

  const pop = document.createElement("div");
  pop.className = "cc-overlay";
  pop.setAttribute("role", "status");
  pop.setAttribute("aria-live", "polite");
  pop.innerHTML = `<div class="cc-card">
    <div class="cc-stage">
      <div class="cc-rays" aria-hidden="true"></div>
      ${Array.from({ length: coins }, (_, i) => `<span class="cc-coin" style="--i:${i};--x:${(i % 2 ? 1 : -1) * (8 + (i * 7) % 26)}px">${COIN}</span>`).join("")}
      ${CHEST}
      ${Array.from({ length: 6 }, (_, i) => `<i class="cc-spark" style="--a:${i * 60}deg"></i>`).join("")}
    </div>
    <span class="cc-kicker">${options.title ? options.title.replace(/[<>&]/g, "") : "¡Créditos ganados!"}</span>
    <strong class="cc-amount">+<b data-cc-count>${reduce ? amount : 0}</b> créditos</strong>
    ${total !== null ? `<span class="cc-total">Se sumaron a tu saldo · Total <b>${total.toLocaleString("es-MX")}</b></span>` : `<span class="cc-total">Se sumaron a tu saldo</span>`}
  </div>`;
  document.body.appendChild(pop);
  active = pop;
  requestAnimationFrame(() => pop.classList.add("is-open"));

  // El número sube a medida que caen las monedas.
  if (!reduce) {
    const counter = pop.querySelector<HTMLElement>("[data-cc-count]")!;
    const start = performance.now() + 650;
    const length = 260 * coins;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / length));
      counter.textContent = String(Math.round(amount * t));
      if (t < 1 && pop.isConnected) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const close = () => {
    if (!pop.isConnected || pop.classList.contains("is-closing")) return;
    pop.classList.add("is-closing");
    setTimeout(() => { pop.remove(); if (active === pop) active = null; }, 380);
  };
  pop.addEventListener("click", close);
  setTimeout(close, options.duration ?? 3400);
}

window.IMFRACoinChest = { show };
