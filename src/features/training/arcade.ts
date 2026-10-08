import "./arcade.css";
import { GAME_INFO, type GameConfig } from "../class-games/content";
import { layoutCrossword, normalizeWord, shuffle, type CrossWord } from "../class-games/class-games";
import { celebrate } from "../shared/celebration";
import type { RetoGame } from "./games-catalog";

// ═══════════════════════════════════════════════════════════════════
// Juegos de obra · motor de Retos.
// Pantalla de inicio → juego con cronómetro, puntos y rachas → resultado
// con estrellas. Cada juego recibe un "motor" con lo común.
// ═══════════════════════════════════════════════════════════════════

export interface ArcadeResult { seconds: number; points: number; mistakes: number; stars: number }
export interface ArcadeOptions {
  game: RetoGame;
  board: number;
  earning: boolean;
  credits: number;
  /** Se llama al ganar; devuelve los créditos sumados (0 si no hubo). */
  onWin(result: ArcadeResult): Promise<number>;
  /** Abrir otro tablero desde la pantalla de resultado. */
  onAnother(): void;
  onClose(): void;
}

interface Engine {
  stage: HTMLElement;
  points(amount: number, at?: Element | null, label?: string): void;
  mistake(at?: Element | null, penalty?: number): void;
  progress(done: number, total: number): void;
  stat(label: string, value: string | number): void;
  win(): void;
  isOver(): boolean;
}
type GameRunner = (engine: Engine, cfg: GameConfig) => (() => void) | void;

const esc = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Tiempo objetivo y errores tolerados para 3 y 2 estrellas.
const PAR: Record<string, { seconds: number; e3: number; e2: number }> = {
  crucigrama: { seconds: 300, e3: 1, e2: 4 },
  sopa: { seconds: 180, e3: 2, e2: 6 },
  memorama: { seconds: 120, e3: 4, e2: 9 },
  ordenar: { seconds: 90, e3: 0, e2: 2 },
  ahorcado: { seconds: 180, e3: 3, e2: 7 },
  clasificar: { seconds: 75, e3: 0, e2: 2 }
};

const RULES: Record<string, string[]> = {
  crucigrama: ["Toca una pista o una casilla y escribe la palabra.", "Cada palabra correcta suma 100 puntos.", "Usa una pista si te atoras (resta 25)."],
  sopa: ["Arrastra sobre las letras, o toca la primera y la última.", "Las palabras van en horizontal, vertical o diagonal.", "Cada palabra suma 100 puntos."],
  memorama: ["Voltea dos cartas: une cada término con su definición.", "Aciertos seguidos hacen racha y dan puntos extra.", "Menos movimientos, más estrellas."],
  ordenar: ["Arrastra los pasos o usa las flechas.", "Comprueba cuando creas que el orden es correcto.", "Acertar al primer intento da 3 estrellas."],
  ahorcado: ["Adivina 3 términos técnicos letra por letra.", "Cada error derriba un bloque de la estructura.", "Si caen los 6 bloques, pasas al siguiente término."],
  clasificar: ["Lleva cada tarjeta a su categoría.", "Toca la categoría o arrastra la tarjeta hasta ella.", "Aciertos seguidos hacen racha."]
};

const ICONS = {
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></svg>`,
  star: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2 6.4 20.2l1.1-6.3L2.9 9.5l6.3-.9z"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  bulb: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></svg>`,
  grip: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>`,
  coin: `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="#e8930c"/><circle cx="20" cy="20" r="15" fill="#ffc83d"/><circle cx="20" cy="20" r="11.5" fill="none" stroke="#c9780a" stroke-width="1.6" stroke-dasharray="2 2.2"/><path d="M24.4 15.6a6.2 6.2 0 1 0 0 8.8" fill="none" stroke="#8a4f05" stroke-width="3" stroke-linecap="round"/></svg>`
};

let active: HTMLElement | null = null;

export function openArcade(options: ArcadeOptions) {
  active?.remove();
  const { game, board } = options;
  const tablero = game.tableros[board];
  const info = GAME_INFO[game.tipo];
  const par = PAR[game.tipo];
  const overlay = document.createElement("div");
  overlay.className = "ar-overlay";
  overlay.style.setProperty("--g", game.color);
  overlay.innerHTML = `<section class="ar-modal" role="dialog" aria-modal="true" aria-labelledby="ar-title">
    <header class="ar-head">
      <span class="ar-head__icon" aria-hidden="true">${info.icono}</span>
      <div class="ar-head__title"><small>${options.earning ? "Tablero del día" : "Práctica"} · ${esc(tablero.titulo)}</small><h2 id="ar-title">${esc(game.titulo)}</h2></div>
      <div class="ar-hud" hidden>
        <span class="ar-chip" title="Tiempo">${ICONS.clock}<b data-time>0:00</b></span>
        <span class="ar-chip ar-chip--pts" title="Puntos">${ICONS.star}<b data-pts>0</b></span>
        <span class="ar-chip ar-chip--extra" data-extra hidden><small data-extra-label></small><b data-extra-value></b></span>
      </div>
      <button type="button" class="ar-close" aria-label="Cerrar">${ICONS.close}</button>
    </header>
    <div class="ar-bar"><i data-bar></i></div>
    <div class="ar-body" data-body></div>
  </section>`;
  document.body.appendChild(overlay);
  active = overlay;
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  const body = overlay.querySelector<HTMLElement>("[data-body]")!;
  const hud = overlay.querySelector<HTMLElement>(".ar-hud")!;
  let timer = 0;
  let cleanup: (() => void) | void;
  let closed = false;

  const close = () => {
    if (closed) return;
    closed = true;
    clearInterval(timer);
    cleanup?.();
    document.removeEventListener("keydown", onKey, true);
    overlay.classList.remove("is-open");
    document.body.style.overflow = previousOverflow;
    setTimeout(() => { overlay.remove(); if (active === overlay) active = null; }, 220);
    options.onClose();
  };
  const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); close(); } };
  document.addEventListener("keydown", onKey, true);
  overlay.querySelector(".ar-close")!.addEventListener("click", close);

  // ── Pantalla de inicio ──
  body.innerHTML = `<div class="ar-intro">
    <span class="ar-intro__icon" aria-hidden="true">${info.icono}</span>
    <span class="ar-intro__kicker">${options.earning ? "Tablero del día" : "Modo práctica"}</span>
    <h3>${esc(tablero.titulo)}</h3>
    <ul class="ar-intro__rules">${RULES[game.tipo].map((rule, i) => `<li><b>${i + 1}</b>${esc(rule)}</li>`).join("")}</ul>
    <div class="ar-intro__reward ${options.earning ? "" : "is-practice"}">${options.earning ? `${ICONS.coin}<span>Gánalo y suma <b>+${options.credits} créditos</b></span>` : `<span>Ya ganaste los créditos de hoy en este juego. Mañana hay un tablero nuevo.</span>`}</div>
    <button type="button" class="ar-btn ar-btn--primary" data-start>Empezar ${ICONS.arrow}</button>
  </div>`;
  body.querySelector("[data-start]")!.addEventListener("click", start);
  requestAnimationFrame(() => overlay.classList.add("is-open"));
  setTimeout(() => overlay.classList.add("is-open"), 60);
  (body.querySelector("[data-start]") as HTMLButtonElement).focus({ preventScroll: true });

  function start() {
    let seconds = 0;
    let points = 0;
    let mistakes = 0;
    let over = false;
    hud.hidden = false;
    body.innerHTML = `<div class="ar-stage ar-stage--${game.tipo}" data-stage></div>`;
    const stage = body.querySelector<HTMLElement>("[data-stage]")!;
    const timeEl = overlay.querySelector<HTMLElement>("[data-time]")!;
    const ptsEl = overlay.querySelector<HTMLElement>("[data-pts]")!;
    timer = window.setInterval(() => { seconds += 1; timeEl.textContent = clock(seconds); }, 1000);

    const pop = (text: string, at: Element | null | undefined, tone: "good" | "bad" | "combo") => {
      const rect = (at || stage).getBoundingClientRect();
      const el = document.createElement("span");
      el.className = `ar-pop ar-pop--${tone}`;
      el.textContent = text;
      el.style.left = `${rect.left + rect.width / 2}px`;
      el.style.top = `${rect.top + Math.min(rect.height / 2, 60)}px`;
      overlay.appendChild(el);
      setTimeout(() => el.remove(), 1100);
    };
    const bump = (el: HTMLElement) => { el.classList.remove("is-bump"); void el.offsetWidth; el.classList.add("is-bump"); };

    const engine: Engine = {
      stage,
      points(amount, at, label) {
        points = Math.max(0, points + amount);
        ptsEl.textContent = String(points);
        bump(ptsEl.parentElement!);
        pop(label || `+${amount}`, at, label ? "combo" : "good");
      },
      mistake(at, penalty = 10) {
        mistakes += 1;
        if (penalty) { points = Math.max(0, points - penalty); ptsEl.textContent = String(points); }
        if (at) pop(penalty ? `−${penalty}` : "✕", at, "bad");
        const modal = overlay.querySelector<HTMLElement>(".ar-modal")!;
        modal.classList.remove("is-hurt"); void modal.offsetWidth; modal.classList.add("is-hurt");
      },
      progress(done, total) {
        overlay.querySelector<HTMLElement>("[data-bar]")!.style.width = `${total ? Math.round(done / total * 100) : 0}%`;
      },
      stat(label, value) {
        const chip = overlay.querySelector<HTMLElement>("[data-extra]")!;
        chip.hidden = false;
        chip.querySelector("[data-extra-label]")!.textContent = label;
        chip.querySelector("[data-extra-value]")!.textContent = String(value);
      },
      win() {
        if (over) return;
        over = true;
        clearInterval(timer);
        const bonus = Math.max(0, par.seconds - seconds) * 2;
        const stars = mistakes <= par.e3 && seconds <= par.seconds ? 3 : mistakes <= par.e2 && seconds <= par.seconds * 2 ? 2 : 1;
        celebrate(stars === 3 ? "big" : "normal");
        void wait(reducedMotion() ? 200 : 1100).then(() => {
          if (!closed) results({ seconds, points: points + bonus, mistakes, stars }, bonus);
        });
      },
      isOver: () => over
    };
    cleanup = RUNNERS[game.tipo](engine, tablero.config);
  }

  function results(result: ArcadeResult, bonus: number) {
    cleanup?.();
    cleanup = undefined;
    overlay.querySelector<HTMLElement>("[data-pts]")!.textContent = String(result.points);
    const titles = ["", "¡Tablero resuelto!", "¡Muy bien hecho!", "¡Excelente!"];
    body.innerHTML = `<div class="ar-result">
      <div class="ar-stars" aria-label="${result.stars} de 3 estrellas">${[1, 2, 3].map((n) => `<span class="${n <= result.stars ? "is-on" : ""}" style="--d:${n * 180}ms">${ICONS.star}</span>`).join("")}</div>
      <h3>${titles[result.stars]}</h3>
      <p>${esc(game.titulo)} · ${esc(tablero.titulo)}</p>
      <div class="ar-result__stats">
        <div><span>Tiempo</span><b>${clock(result.seconds)}</b></div>
        <div><span>Puntos</span><b>${result.points}</b>${bonus ? `<small>+${bonus} por rapidez</small>` : ""}</div>
        <div><span>Errores</span><b>${result.mistakes}</b></div>
      </div>
      <div class="ar-result__reward" data-reward>${options.earning ? `<span class="ar-spin"></span>Sumando tus créditos…` : "Modo práctica · sin créditos"}</div>
      <div class="ar-result__actions">
        <button type="button" class="ar-btn" data-another>Jugar otro tablero</button>
        <button type="button" class="ar-btn ar-btn--primary" data-exit>Volver a Retos</button>
      </div>
    </div>`;
    body.querySelector("[data-exit]")!.addEventListener("click", close);
    body.querySelector("[data-another]")!.addEventListener("click", () => { close(); options.onAnother(); });
    const reward = body.querySelector<HTMLElement>("[data-reward]")!;
    void options.onWin(result).then((credits) => {
      if (!options.earning) return;
      reward.classList.add(credits > 0 ? "is-earned" : "is-plain");
      reward.innerHTML = credits > 0 ? `${ICONS.coin}<span><b>+${credits} créditos</b> sumados a tu saldo</span>` : "Los créditos de hoy de este juego ya estaban sumados.";
    }).catch(() => {
      reward.classList.add("is-plain");
      reward.textContent = "No pudimos sumar los créditos. Revisa tu conexión e inténtalo más tarde.";
    });
  }
}

// ─────────────────────────── Crucigrama ───────────────────────────
function runCrucigrama(engine: Engine, cfg: GameConfig) {
  if (cfg.tipo !== "crucigrama") return;
  const words: CrossWord[] = layoutCrossword(cfg.entradas);
  const rows = Math.max(...words.map((w) => w.r + (w.dir === "v" ? w.word.length : 1)));
  const cols = Math.max(...words.map((w) => w.c + (w.dir === "h" ? w.word.length : 1)));
  const cellsOf = (w: CrossWord) => Array.from({ length: w.word.length }, (_, k) => `${w.r + (w.dir === "v" ? k : 0)},${w.c + (w.dir === "h" ? k : 0)}`);
  const solution = new Map<string, string>();
  const numbers = new Map<string, number>();
  words.forEach((w) => { cellsOf(w).forEach((k, i) => solution.set(k, w.word[i])); numbers.set(`${w.r},${w.c}`, w.num); });
  const ordered = words.map((w, i) => ({ w, i })).sort((a, b) => (a.w.dir === b.w.dir ? a.w.num - b.w.num : a.w.dir === "h" ? -1 : 1));
  let grid = "";
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const k = `${r},${c}`;
    grid += solution.has(k)
      ? `<label class="ar-cw__cell" data-cell="${k}">${numbers.has(k) ? `<small>${numbers.get(k)}</small>` : ""}<input data-k="${k}" autocomplete="off" autocapitalize="characters" spellcheck="false" inputmode="text" aria-label="Casilla"></label>`
      : `<span class="ar-cw__void"></span>`;
  }
  const clueList = (dir: "h" | "v") => ordered.filter(({ w }) => w.dir === dir)
    .map(({ w, i }) => `<li data-clue="${i}"><b>${w.num}</b><span>${esc(w.clue)}</span><em>${w.word.length}</em></li>`).join("");
  engine.stage.innerHTML = `<div class="ar-cw">
    <div class="ar-cw__bar">
      <button type="button" class="ar-icon-btn" data-step="-1" aria-label="Pista anterior">‹</button>
      <div class="ar-cw__current"><span data-cur-tag></span><p data-cur-text></p></div>
      <button type="button" class="ar-icon-btn" data-step="1" aria-label="Siguiente pista">›</button>
    </div>
    <div class="ar-cw__main">
      <div class="ar-cw__board"><div class="ar-cw__grid" style="--cols:${cols};--rows:${rows}">${grid}</div></div>
      <aside class="ar-cw__list">
        <span class="ar-label">Horizontales</span><ol>${clueList("h")}</ol>
        <span class="ar-label">Verticales</span><ol>${clueList("v")}</ol>
      </aside>
    </div>
    <div class="ar-tools"><button type="button" class="ar-btn ar-btn--soft" data-hint>${ICONS.bulb}Pista · <b data-hints>3</b></button></div>
  </div>`;
  const stage = engine.stage;
  const input = (k: string) => stage.querySelector<HTMLInputElement>(`input[data-k="${k}"]`)!;
  const solved = new Set<number>();
  const wrongShown = new Map<number, string>();
  let active = ordered[0].i;
  let hints = 3;
  engine.progress(0, words.length);
  engine.stat("Palabras", `0/${words.length}`);

  const highlight = () => {
    stage.querySelectorAll(".is-active,.is-current").forEach((el) => el.classList.remove("is-active", "is-current"));
    cellsOf(words[active]).forEach((k) => input(k).parentElement!.classList.add("is-active"));
    const li = stage.querySelector(`[data-clue="${active}"]`);
    li?.classList.add("is-current");
    li?.scrollIntoView({ block: "nearest" });
    const w = words[active];
    stage.querySelector("[data-cur-tag]")!.textContent = `${w.num} · ${w.dir === "h" ? "Horizontal" : "Vertical"} · ${w.word.length} letras`;
    stage.querySelector("[data-cur-text]")!.textContent = w.clue;
  };
  const focusWord = (i: number) => {
    active = i;
    const cells = cellsOf(words[i]);
    const target = cells.find((k) => input(k).value !== solution.get(k)) || cells[0];
    input(target).focus({ preventScroll: true });
    highlight();
  };
  const nextUnsolved = (from: number, step = 1) => {
    const idx = ordered.findIndex((o) => o.i === from);
    for (let n = 1; n <= ordered.length; n++) {
      const cand = ordered[(idx + step * n + ordered.length * 2) % ordered.length].i;
      if (!solved.has(cand)) return cand;
    }
    return from;
  };
  const evaluate = () => {
    words.forEach((w, i) => {
      if (solved.has(i)) return;
      const cells = cellsOf(w);
      const typed = cells.map((k) => input(k).value).join("");
      if (typed.length < w.word.length) { wrongShown.delete(i); return; }
      if (typed === w.word) {
        solved.add(i);
        cells.forEach((k, n) => {
          const cell = input(k).parentElement!;
          cell.style.setProperty("--n", String(n));
          cell.classList.add("is-solved");
          input(k).readOnly = true;
        });
        stage.querySelector(`[data-clue="${i}"]`)?.classList.add("is-solved");
        engine.points(100, input(cells[Math.floor(cells.length / 2)]));
        return;
      }
      if (wrongShown.get(i) === typed) return;
      wrongShown.set(i, typed);
      cells.forEach((k) => {
        const cell = input(k).parentElement!;
        cell.classList.remove("is-wrong"); void cell.offsetWidth; cell.classList.add("is-wrong");
      });
      engine.mistake(input(cells[Math.floor(cells.length / 2)]), 10);
    });
    engine.progress(solved.size, words.length);
    engine.stat("Palabras", `${solved.size}/${words.length}`);
    if (solved.size === words.length) { engine.win(); return true; }
    if (solved.has(active)) { focusWord(nextUnsolved(active)); }
    return false;
  };
  const wordsAt = (k: string) => words.map((w, i) => ({ w, i })).filter(({ w }) => cellsOf(w).includes(k));

  stage.querySelectorAll<HTMLInputElement>("input[data-k]").forEach((el) => {
    el.addEventListener("focus", () => {
      const options = wordsAt(el.dataset.k!);
      if (!options.some((o) => o.i === active)) active = (options.find((o) => !solved.has(o.i)) || options[0]).i;
      highlight();
      el.select();
    });
    el.addEventListener("click", () => {
      const options = wordsAt(el.dataset.k!).filter((o) => !solved.has(o.i));
      if (options.length > 1 && document.activeElement === el) { active = options.find((o) => o.i !== active)?.i ?? active; highlight(); }
    });
    el.addEventListener("input", () => {
      // Teclados con autocompletado o al pegar pueden traer varias letras: se reparten.
      let letters = normalizeWord(el.value);
      const previous = el.dataset.prev || "";
      if (letters.length > 1 && previous && letters.startsWith(previous)) letters = letters.slice(previous.length);
      if (letters.length > 1 && previous && letters.endsWith(previous)) letters = letters.slice(0, -previous.length);
      el.value = letters.slice(0, 1);
      el.dataset.prev = el.value;
      if (!el.value) return;
      const list = cellsOf(words[active]);
      const pos = list.indexOf(el.dataset.k!);
      // Cada letra va a su casilla; las casillas ya resueltas conservan la suya.
      const following = list.slice(pos + 1);
      let last = el;
      [...letters.slice(1)].forEach((letter, n) => {
        const target = following[n] ? input(following[n]) : null;
        if (!target || target.readOnly) return;
        target.value = letter;
        target.dataset.prev = letter;
        last = target;
      });
      [el, last].forEach((item) => {
        const cell = item.parentElement!;
        cell.classList.remove("is-typed"); void cell.offsetWidth; cell.classList.add("is-typed");
      });
      if (evaluate()) return;
      if (solved.has(active)) return;
      const next = list.slice(list.indexOf(last.dataset.k!) + 1).find((k) => !input(k).readOnly);
      if (next) input(next).focus({ preventScroll: true });
    });
    el.addEventListener("keydown", (event) => {
      const list = cellsOf(words[active]);
      const pos = list.indexOf(el.dataset.k!);
      if (event.key === "Backspace" && !el.value) {
        const prev = list.slice(0, pos).reverse().find((k) => !input(k).readOnly);
        if (prev) { event.preventDefault(); input(prev).value = ""; input(prev).dataset.prev = ""; input(prev).focus({ preventScroll: true }); }
      } else if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        focusWord(nextUnsolved(active, event.shiftKey ? -1 : 1));
      }
    });
  });
  stage.querySelectorAll<HTMLElement>("[data-clue]").forEach((li) => li.addEventListener("click", () => focusWord(Number(li.dataset.clue))));
  stage.querySelectorAll<HTMLElement>("[data-step]").forEach((btn) => btn.addEventListener("click", () => focusWord(nextUnsolved(active, Number(btn.dataset.step)))));
  stage.querySelector<HTMLButtonElement>("[data-hint]")!.addEventListener("click", (event) => {
    if (hints <= 0 || engine.isOver()) return;
    const target = !solved.has(active) ? active : nextUnsolved(active);
    const k = cellsOf(words[target]).find((key) => input(key).value !== solution.get(key));
    if (!k) return;
    const el = input(k);
    el.value = solution.get(k)!; el.dataset.prev = el.value;
    el.readOnly = true;
    el.parentElement!.classList.add("is-revealed");
    hints -= 1;
    stage.querySelector("[data-hints]")!.textContent = String(hints);
    if (hints <= 0) (event.currentTarget as HTMLButtonElement).disabled = true;
    engine.points(-25, el, "−25 pista");
    active = target;
    if (!evaluate()) focusWord(active);
  });
  highlight();
  requestAnimationFrame(() => focusWord(active));
}

// ─────────────────────────── Sopa de letras ───────────────────────────
const MARKERS = ["#f59d1a", "#2f6fdd", "#13906f", "#7a5ad6", "#d0475b", "#0e9fb3", "#a8740a", "#c2410c", "#4d7c0f"];

function runSopa(engine: Engine, cfg: GameConfig) {
  if (cfg.tipo !== "sopa") return;
  const words = cfg.palabras.map(normalizeWord).filter((w) => w.length >= 2).slice(0, 9);
  const dirs = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [1, -1]];
  const letters = "ABCDEFGHIJLMNOPRSTUVZ";
  let size = Math.max(10, Math.max(...words.map((w) => w.length)) + 1);
  let grid: string[][] = [];
  build: for (let attempt = 0; attempt < 40; attempt++) {
    grid = Array.from({ length: size }, () => Array(size).fill(""));
    for (const word of [...words].sort((a, b) => b.length - a.length)) {
      let ok = false;
      for (let t = 0; t < 400 && !ok; t++) {
        const [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)];
        const r0 = Math.floor(Math.random() * size), c0 = Math.floor(Math.random() * size);
        const cells: [number, number][] = [];
        for (let k = 0; k < word.length; k++) {
          const r = r0 + dr * k, c = c0 + dc * k;
          if (r < 0 || c < 0 || r >= size || c >= size || (grid[r][c] && grid[r][c] !== word[k])) break;
          cells.push([r, c]);
        }
        if (cells.length !== word.length) continue;
        cells.forEach(([r, c], k) => { grid[r][c] = word[k]; });
        ok = true;
      }
      if (!ok) { if (attempt % 8 === 7) size = Math.min(13, size + 1); continue build; }
    }
    break;
  }
  grid = grid.map((row) => row.map((ch) => ch || letters[Math.floor(Math.random() * letters.length)]));

  engine.stage.innerHTML = `<div class="ar-ws">
    <ul class="ar-ws__words">${words.map((w) => `<li data-word="${w}"><i></i>${w}</li>`).join("")}</ul>
    <div class="ar-ws__board" style="--n:${size}">
      <svg class="ar-ws__lines" viewBox="0 0 ${size} ${size}" preserveAspectRatio="none" aria-hidden="true"><g data-found></g><line data-sel class="ar-ws__sel" x1="0" y1="0" x2="0" y2="0"/></svg>
      <div class="ar-ws__grid">${grid.map((row, r) => row.map((ch, c) => `<span class="ar-ws__cell" data-r="${r}" data-c="${c}">${ch}</span>`).join("")).join("")}</div>
    </div>
  </div>`;
  const stage = engine.stage;
  const gridEl = stage.querySelector<HTMLElement>(".ar-ws__grid")!;
  const sel = stage.querySelector<SVGLineElement>("[data-sel]")!;
  const foundLayer = stage.querySelector<SVGGElement>("[data-found]")!;
  const found = new Set<string>();
  let start: [number, number] | null = null;
  let tapStart: [number, number] | null = null;
  let moved = false;
  engine.progress(0, words.length);
  engine.stat("Palabras", `0/${words.length}`);

  const posOf = (x: number, y: number): [number, number] | null => {
    const rect = gridEl.getBoundingClientRect();
    const c = Math.floor((x - rect.left) / rect.width * size), r = Math.floor((y - rect.top) / rect.height * size);
    return r >= 0 && c >= 0 && r < size && c < size ? [r, c] : null;
  };
  const snap = (a: [number, number], b: [number, number]): [number, number] => {
    const dr = b[0] - a[0], dc = b[1] - a[1];
    if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) return b;
    // Ajusta a la dirección válida más cercana (horizontal, vertical o diagonal).
    const len = Math.max(Math.abs(dr), Math.abs(dc));
    const angle = Math.atan2(dr, dc);
    const step = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
    const r = a[0] + Math.round(Math.sin(step)) * len, c = a[1] + Math.round(Math.cos(step)) * len;
    return [Math.max(0, Math.min(size - 1, r)), Math.max(0, Math.min(size - 1, c))];
  };
  const drawSel = (a: [number, number] | null, b: [number, number] | null) => {
    if (!a || !b) { sel.style.opacity = "0"; return; }
    sel.style.opacity = "1";
    sel.setAttribute("x1", String(a[1] + 0.5)); sel.setAttribute("y1", String(a[0] + 0.5));
    sel.setAttribute("x2", String(b[1] + 0.5)); sel.setAttribute("y2", String(b[0] + 0.5));
  };
  const evaluate = (a: [number, number], b: [number, number]) => {
    drawSel(null, null);
    const dr = Math.sign(b[0] - a[0]), dc = Math.sign(b[1] - a[1]);
    const len = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) + 1;
    if (len < 2) return;
    const cells = Array.from({ length: len }, (_, k) => [a[0] + dr * k, a[1] + dc * k] as [number, number]);
    const text = cells.map(([r, c]) => grid[r][c]).join("");
    const reversed = [...text].reverse().join("");
    const word = words.find((w) => !found.has(w) && (w === text || w === reversed));
    const mid = gridEl.querySelector(`[data-r="${cells[Math.floor(len / 2)][0]}"][data-c="${cells[Math.floor(len / 2)][1]}"]`);
    if (!word) {
      gridEl.classList.remove("ar-shake"); void gridEl.offsetWidth; gridEl.classList.add("ar-shake");
      if (len >= 3) engine.mistake(mid, 0);
      return;
    }
    found.add(word);
    const color = MARKERS[(found.size - 1) % MARKERS.length];
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(a[1] + 0.5)); line.setAttribute("y1", String(a[0] + 0.5));
    line.setAttribute("x2", String(b[1] + 0.5)); line.setAttribute("y2", String(b[0] + 0.5));
    line.setAttribute("class", "ar-ws__found");
    line.style.stroke = color;
    foundLayer.appendChild(line);
    cells.forEach(([r, c], n) => {
      const cell = gridEl.querySelector<HTMLElement>(`[data-r="${r}"][data-c="${c}"]`)!;
      cell.style.setProperty("--n", String(n));
      cell.classList.remove("is-found"); void cell.offsetWidth; cell.classList.add("is-found");
    });
    const chip = stage.querySelector<HTMLElement>(`[data-word="${word}"]`)!;
    chip.style.setProperty("--m", color);
    chip.classList.add("is-found");
    engine.points(100, mid);
    engine.progress(found.size, words.length);
    engine.stat("Palabras", `${found.size}/${words.length}`);
    if (found.size === words.length) engine.win();
  };

  gridEl.addEventListener("pointerdown", (event) => {
    if (engine.isOver()) return;
    const pos = posOf(event.clientX, event.clientY);
    if (!pos) return;
    event.preventDefault();
    gridEl.setPointerCapture(event.pointerId);
    start = pos; moved = false;
    drawSel(tapStart || pos, pos);
  });
  gridEl.addEventListener("pointermove", (event) => {
    if (!start) return;
    const pos = posOf(event.clientX, event.clientY);
    if (!pos) return;
    if (pos[0] !== start[0] || pos[1] !== start[1]) { moved = true; tapStart = null; }
    if (moved) drawSel(start, snap(start, pos));
  });
  gridEl.addEventListener("pointerup", (event) => {
    if (!start) return;
    const from = start;
    start = null;
    const pos = posOf(event.clientX, event.clientY) || from;
    if (moved) { evaluate(from, snap(from, pos)); return; }
    if (!tapStart) { tapStart = from; drawSel(from, from); return; }
    const first = tapStart;
    tapStart = null;
    evaluate(first, snap(first, from));
  });
  gridEl.addEventListener("pointercancel", () => { start = null; drawSel(tapStart, tapStart); });
}

// ─────────────────────────── Memorama ───────────────────────────
function runMemorama(engine: Engine, cfg: GameConfig) {
  if (cfg.tipo !== "memorama") return;
  const pairs = cfg.pares.slice(0, 8);
  const cards = shuffle(pairs.flatMap((p, i) => [{ pair: i, text: p.termino, kind: "term" }, { pair: i, text: p.definicion, kind: "def" }]));
  engine.stage.innerHTML = `<div class="ar-mm" style="--count:${cards.length}">${cards.map((card, i) => `<button type="button" class="ar-mm__card" data-i="${i}" style="--i:${i}" aria-label="Carta ${i + 1}">
    <span class="ar-mm__inner">
      <span class="ar-mm__back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17h18M5 17v-2.2a7 7 0 0 1 14 0V17"/><path d="M10 8.3V6.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.8"/></svg><small>IMFRA</small></span>
      <span class="ar-mm__front ar-mm__front--${card.kind}"><em>${card.kind === "term" ? "Término" : "Definición"}</em><span>${esc(card.text)}</span></span>
    </span></button>`).join("")}</div>`;
  const matched = new Set<number>();
  let open: number[] = [];
  let busy = false;
  let moves = 0;
  let combo = 0;
  engine.progress(0, pairs.length);
  engine.stat("Movimientos", 0);
  const cardEl = (i: number) => engine.stage.querySelector<HTMLElement>(`[data-i="${i}"]`)!;
  engine.stage.querySelector(".ar-mm")!.addEventListener("click", (event) => {
    const btn = (event.target as Element).closest<HTMLElement>("[data-i]");
    if (!btn || busy || engine.isOver()) return;
    const i = Number(btn.dataset.i);
    if (open.includes(i) || matched.has(cards[i].pair)) return;
    btn.classList.add("is-open");
    open.push(i);
    if (open.length < 2) return;
    moves += 1;
    engine.stat("Movimientos", moves);
    const [a, b] = open;
    if (cards[a].pair === cards[b].pair && cards[a].kind !== cards[b].kind) {
      matched.add(cards[a].pair);
      combo += 1;
      open.forEach((idx) => cardEl(idx).classList.add("is-matched"));
      open = [];
      engine.points(100, cardEl(b));
      if (combo >= 2) setTimeout(() => engine.points(50 * (combo - 1), cardEl(a), `¡Racha x${combo}! +${50 * (combo - 1)}`), 260);
      engine.progress(matched.size, pairs.length);
      if (matched.size === pairs.length) engine.win();
      return;
    }
    combo = 0;
    busy = true;
    open.forEach((idx) => cardEl(idx).classList.add("is-wrong"));
    engine.mistake(null, 0);
    setTimeout(() => {
      open.forEach((idx) => cardEl(idx).classList.remove("is-open", "is-wrong"));
      open = [];
      busy = false;
    }, 950);
  });
}

// ─────────────────────────── Ordena el proceso ───────────────────────────
function runOrdenar(engine: Engine, cfg: GameConfig) {
  if (cfg.tipo !== "ordenar") return;
  const correct = cfg.pasos.slice();
  let order = shuffle(correct);
  for (let t = 0; t < 10 && order.every((s, i) => s === correct[i]); t++) order = shuffle(correct);
  let attempts = 0;
  let marks = false;
  engine.stage.innerHTML = `<div class="ar-ord"><p class="ar-question">${esc(cfg.pregunta)}</p><ol class="ar-ord__list"></ol>
    <div class="ar-tools"><button type="button" class="ar-btn ar-btn--primary" data-check>Comprobar orden</button></div></div>`;
  const list = engine.stage.querySelector<HTMLElement>(".ar-ord__list")!;
  engine.progress(0, correct.length);
  engine.stat("Intentos", 0);

  const render = () => {
    list.innerHTML = order.map((step, i) => `<li class="ar-ord__item ${marks ? (step === correct[i] ? "is-ok" : "is-bad") : ""}" data-idx="${i}">
      <span class="ar-ord__grip" aria-hidden="true">${ICONS.grip}</span><b>${i + 1}</b><span class="ar-ord__text">${esc(step)}</span>
      <span class="ar-ord__moves"><button type="button" data-move="${i}" data-dir="-1" aria-label="Subir" ${i === 0 ? "disabled" : ""}>▲</button><button type="button" data-move="${i}" data-dir="1" aria-label="Bajar" ${i === order.length - 1 ? "disabled" : ""}>▼</button></span>
    </li>`).join("");
  };
  // Animación FLIP: cada paso se desliza a su nueva posición.
  const reorder = (next: string[]) => {
    const before = new Map<string, number>();
    list.querySelectorAll<HTMLElement>(".ar-ord__item").forEach((el, i) => before.set(order[i], el.getBoundingClientRect().top));
    order = next;
    marks = false;
    render();
    if (reducedMotion()) return;
    list.querySelectorAll<HTMLElement>(".ar-ord__item").forEach((el, i) => {
      const delta = (before.get(order[i]) ?? 0) - el.getBoundingClientRect().top;
      if (!delta) return;
      el.animate([{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }], { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)" });
    });
  };
  list.addEventListener("click", (event) => {
    const btn = (event.target as Element).closest<HTMLElement>("[data-move]");
    if (!btn || engine.isOver()) return;
    const i = Number(btn.dataset.move), j = i + Number(btn.dataset.dir);
    if (j < 0 || j >= order.length) return;
    const next = order.slice();
    [next[i], next[j]] = [next[j], next[i]];
    reorder(next);
  });

  // Arrastrar y soltar con el dedo o el mouse.
  let drag: { el: HTMLElement; from: number; startY: number; rects: DOMRect[]; to: number } | null = null;
  list.addEventListener("pointerdown", (event) => {
    if (engine.isOver() || (event.target as Element).closest("button")) return;
    const el = (event.target as Element).closest<HTMLElement>(".ar-ord__item");
    if (!el) return;
    event.preventDefault();
    const items = [...list.querySelectorAll<HTMLElement>(".ar-ord__item")];
    drag = { el, from: Number(el.dataset.idx), startY: event.clientY, rects: items.map((it) => it.getBoundingClientRect()), to: Number(el.dataset.idx) };
    el.setPointerCapture(event.pointerId);
    el.classList.add("is-dragging");
    list.classList.add("is-sorting");
  });
  list.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const dy = event.clientY - drag.startY;
    drag.el.style.transform = `translateY(${dy}px) scale(1.02)`;
    const center = drag.rects[drag.from].top + drag.rects[drag.from].height / 2 + dy;
    let to = drag.rects.findIndex((r) => center < r.top + r.height / 2);
    if (to === -1) to = drag.rects.length - 1;
    drag.to = to;
    const h = drag.rects[drag.from].height + 8;
    list.querySelectorAll<HTMLElement>(".ar-ord__item").forEach((it, i) => {
      if (it === drag!.el) return;
      const shift = drag!.from < to && i > drag!.from && i <= to ? -h : drag!.from > to && i >= to && i < drag!.from ? h : 0;
      it.style.transform = shift ? `translateY(${shift}px)` : "";
    });
  });
  const endDrag = () => {
    if (!drag) return;
    const { from, to } = drag;
    drag = null;
    list.classList.remove("is-sorting");
    list.querySelectorAll<HTMLElement>(".ar-ord__item").forEach((it) => { it.style.transform = ""; it.classList.remove("is-dragging"); });
    if (from === to) return;
    const next = order.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    order = next;
    marks = false;
    render();
  };
  list.addEventListener("pointerup", endDrag);
  list.addEventListener("pointercancel", endDrag);

  engine.stage.querySelector<HTMLButtonElement>("[data-check]")!.addEventListener("click", (event) => {
    if (engine.isOver()) return;
    attempts += 1;
    engine.stat("Intentos", attempts);
    const ok = order.filter((step, i) => step === correct[i]).length;
    marks = true;
    render();
    engine.progress(ok, correct.length);
    if (ok === correct.length) {
      (event.currentTarget as HTMLButtonElement).disabled = true;
      list.querySelectorAll<HTMLElement>(".ar-ord__item").forEach((el, i) => el.style.setProperty("--n", String(i)));
      list.classList.add("is-done");
      engine.points(attempts === 1 ? 600 : 400, list, attempts === 1 ? "¡A la primera! +600" : undefined);
      engine.win();
      return;
    }
    engine.mistake(event.currentTarget as Element, 50);
  });
  render();
}

// ─────────────────────────── Adivina la palabra ───────────────────────────
function runAhorcado(engine: Engine, cfg: GameConfig) {
  if (cfg.tipo !== "ahorcado") return;
  const MAX = 6;
  const queue = shuffle(cfg.palabras);
  const goal = queue.length;
  let solvedCount = 0;
  let guessed = new Set<string>();
  let errors = 0;
  let current = queue[0];
  let word = normalizeWord(current.palabra);
  let locked = false;
  const rows = ["QWERTYUIOP", "ASDFGHJKLÑ", "ZXCVBNM"];
  engine.stage.innerHTML = `<div class="ar-hm">
    <div class="ar-hm__top">
      <div class="ar-hm__tower" aria-hidden="true">${Array.from({ length: MAX }, (_, i) => `<i data-block="${MAX - 1 - i}"></i>`).join("")}<span class="ar-hm__base"></span></div>
      <div class="ar-hm__info"><span class="ar-label" data-round></span><p class="ar-hm__clue" data-clue></p><span class="ar-hm__lives" data-lives></span></div>
    </div>
    <div class="ar-hm__word" data-word></div>
    <div class="ar-hm__msg" data-msg hidden></div>
    <div class="ar-hm__keys">${rows.map((row) => `<div>${row.split("").map((l) => `<button type="button" data-key="${l}">${l}</button>`).join("")}</div>`).join("")}</div>
  </div>`;
  const stage = engine.stage;
  engine.progress(0, goal);
  engine.stat("Términos", `0/${goal}`);

  const drawWord = (reveal = false) => {
    stage.querySelector("[data-word]")!.innerHTML = [...word].map((l) => `<span class="${guessed.has(l) ? "is-shown" : reveal ? "is-missed" : ""}">${guessed.has(l) || reveal ? l : ""}</span>`).join("");
  };
  const drawTower = () => {
    stage.querySelectorAll<HTMLElement>("[data-block]").forEach((el) => {
      const index = Number(el.dataset.block);
      el.classList.toggle("is-fallen", index >= MAX - errors);
    });
    stage.querySelector("[data-lives]")!.textContent = `${MAX - errors} de ${MAX} bloques en pie`;
  };
  const setup = () => {
    word = normalizeWord(current.palabra);
    guessed = new Set();
    errors = 0;
    locked = false;
    stage.querySelector("[data-round]")!.textContent = `Término ${Math.min(solvedCount + 1, goal)} de ${goal}`;
    stage.querySelector("[data-clue]")!.textContent = current.pista;
    stage.querySelector<HTMLElement>("[data-msg]")!.hidden = true;
    stage.querySelectorAll<HTMLButtonElement>("[data-key]").forEach((b) => { b.disabled = false; b.className = ""; });
    stage.querySelectorAll<HTMLElement>("[data-block]").forEach((el) => el.classList.remove("is-fallen"));
    drawWord();
    drawTower();
  };
  const nextWord = (won: boolean) => {
    if (won) solvedCount += 1;
    queue.push(queue.shift()!);
    if (solvedCount >= goal) { engine.win(); return; }
    current = queue[0];
    setup();
  };
  const press = (letter: string) => {
    if (locked || engine.isOver() || guessed.has(letter)) return;
    const btn = stage.querySelector<HTMLButtonElement>(`[data-key="${letter}"]`);
    if (!btn || btn.disabled) return;
    btn.disabled = true;
    guessed.add(letter);
    if (word.includes(letter)) {
      btn.classList.add("is-hit");
      drawWord();
      const hits = [...word].filter((l) => l === letter).length;
      engine.points(15 * hits, stage.querySelector("[data-word]"));
      if ([...word].every((l) => guessed.has(l))) {
        locked = true;
        engine.points(100, stage.querySelector("[data-word]"), `¡${word}! +100`);
        engine.progress(solvedCount + 1, goal);
        engine.stat("Términos", `${solvedCount + 1}/${goal}`);
        stage.querySelector("[data-word]")!.classList.add("is-solved");
        setTimeout(() => { stage.querySelector("[data-word]")!.classList.remove("is-solved"); nextWord(true); }, 1100);
      }
      return;
    }
    btn.classList.add("is-miss");
    errors += 1;
    drawTower();
    engine.mistake(btn, 0);
    if (errors >= MAX) {
      locked = true;
      drawWord(true);
      const msg = stage.querySelector<HTMLElement>("[data-msg]")!;
      msg.hidden = false;
      msg.innerHTML = `La estructura cayó. La palabra era <b>${word}</b>. <button type="button" class="ar-btn ar-btn--soft" data-skip>Siguiente término</button>`;
      msg.querySelector("[data-skip]")!.addEventListener("click", () => nextWord(false));
    }
  };
  stage.querySelector(".ar-hm__keys")!.addEventListener("click", (event) => {
    const btn = (event.target as Element).closest<HTMLButtonElement>("[data-key]");
    if (btn) press(btn.dataset.key!);
  });
  const onKey = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const letter = normalizeWord(event.key);
    if (letter.length === 1) press(letter);
  };
  document.addEventListener("keydown", onKey);
  setup();
  return () => document.removeEventListener("keydown", onKey);
}

// ─────────────────────────── Clasifica ───────────────────────────
function runClasificar(engine: Engine, cfg: GameConfig) {
  if (cfg.tipo !== "clasificar") return;
  const deck = shuffle(cfg.elementos);
  const total = deck.length;
  let index = 0;
  let combo = 0;
  let busy = false;
  const counts = cfg.categorias.map(() => 0);
  engine.stage.innerHTML = `<div class="ar-cl">
    <p class="ar-question">${esc(cfg.pregunta)}</p>
    <div class="ar-cl__deck"><span class="ar-cl__left" data-left></span><div class="ar-cl__card" data-card></div><small>Toca la categoría o arrastra la tarjeta</small></div>
    <div class="ar-cl__bins" style="--cols:${cfg.categorias.length}">${cfg.categorias.map((cat, i) => `<button type="button" class="ar-cl__bin" data-cat="${i}" style="--b:${MARKERS[[1, 2, 3][i] ?? i]}"><strong>${esc(cat)}</strong><b data-count>0</b></button>`).join("")}</div>
  </div>`;
  const stage = engine.stage;
  const card = stage.querySelector<HTMLElement>("[data-card]")!;
  engine.progress(0, total);
  engine.stat("Tarjetas", `0/${total}`);

  const show = () => {
    stage.querySelector("[data-left]")!.textContent = `${index + 1} de ${total}`;
    card.textContent = deck[index].texto;
    card.style.transform = "";
    card.classList.remove("is-flying", "is-in");
    void card.offsetWidth;
    card.classList.add("is-in");
  };
  const choose = (cat: number) => {
    if (busy || engine.isOver() || index >= total) return;
    const item = deck[index];
    const bin = stage.querySelector<HTMLElement>(`[data-cat="${cat}"]`)!;
    if (item.categoria !== cat) {
      combo = 0;
      card.style.transform = "";
      card.classList.remove("ar-shake"); void card.offsetWidth; card.classList.add("ar-shake");
      bin.classList.remove("is-bad"); void bin.offsetWidth; bin.classList.add("is-bad");
      engine.mistake(bin, 20);
      return;
    }
    busy = true;
    combo += 1;
    counts[cat] += 1;
    const from = card.getBoundingClientRect(), to = bin.getBoundingClientRect();
    card.classList.add("is-flying");
    card.style.transform = `translate(${to.left + to.width / 2 - (from.left + from.width / 2)}px, ${to.top + to.height / 2 - (from.top + from.height / 2)}px) scale(.25)`;
    bin.classList.remove("is-good"); void bin.offsetWidth; bin.classList.add("is-good");
    bin.querySelector("[data-count]")!.textContent = String(counts[cat]);
    engine.points(100, bin);
    if (combo >= 3) setTimeout(() => engine.points(25 * combo, bin, `¡Racha x${combo}! +${25 * combo}`), 220);
    index += 1;
    engine.progress(index, total);
    engine.stat("Tarjetas", `${index}/${total}`);
    setTimeout(() => {
      busy = false;
      if (index >= total) { card.classList.add("is-gone"); engine.win(); return; }
      show();
    }, reducedMotion() ? 60 : 380);
  };
  stage.querySelectorAll<HTMLElement>("[data-cat]").forEach((bin) => bin.addEventListener("click", () => choose(Number(bin.dataset.cat))));

  let drag: { x: number; y: number; moved: boolean } | null = null;
  card.addEventListener("pointerdown", (event) => {
    if (busy || engine.isOver()) return;
    event.preventDefault();
    card.setPointerCapture(event.pointerId);
    drag = { x: event.clientX, y: event.clientY, moved: false };
    card.classList.add("is-dragging");
  });
  card.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
    card.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx / 30}deg)`;
    const over = binAt(event.clientX, event.clientY);
    stage.querySelectorAll(".ar-cl__bin").forEach((b) => b.classList.toggle("is-over", b === over));
  });
  const binAt = (x: number, y: number) => [...stage.querySelectorAll<HTMLElement>(".ar-cl__bin")].find((b) => {
    const r = b.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top - 20 && y <= r.bottom;
  }) || null;
  const drop = (event: PointerEvent) => {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    card.classList.remove("is-dragging");
    stage.querySelectorAll(".ar-cl__bin").forEach((b) => b.classList.remove("is-over"));
    const bin = moved ? binAt(event.clientX, event.clientY) : null;
    if (bin) choose(Number(bin.dataset.cat));
    else card.style.transform = "";
  };
  card.addEventListener("pointerup", drop);
  card.addEventListener("pointercancel", drop);
  show();
}

const RUNNERS: Record<string, GameRunner> = {
  crucigrama: runCrucigrama,
  sopa: runSopa,
  memorama: runMemorama,
  ordenar: runOrdenar,
  ahorcado: runAhorcado,
  clasificar: runClasificar
};
