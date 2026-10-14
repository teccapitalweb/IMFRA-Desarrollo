import "./class-games.css";
import { GAME_INFO, juegoDeClase, type GameConfig, type GameType } from "./content";
import { planSvg } from "./plans";
import { celebrate } from "../shared/celebration";
import "../shared/coin-chest";

// ═══════════════════════════════════════════════════════════════════
// Mini juegos de clase · uno distinto por clase.
// Al ganarlo, el panel marca la clase como vista y desbloquea la siguiente.
// ═══════════════════════════════════════════════════════════════════

export interface PlayOptions {
  cursoId: string;
  cursoTitulo: string;
  claseIndex: number;
  claseNumero: number;
  claseTitulo: string;
  portada?: string;
  /** true cuando la clase ya estaba vista: el juego es solo práctica. */
  practica?: boolean;
  /** Créditos IMFRA que se ganan al completarlo por primera vez (0 = no se menciona). */
  creditos?: number;
  /** Juego fuera de una clase (Retos): tablero, encabezado y aviso propios. */
  config?: GameConfig;
  kicker?: string;
  nota?: string;
  onWin?: () => void;
}

interface GameContext {
  progress(done: number, total: number): void;
  win(message?: string): void;
  feedback(message: string, tone?: "ok" | "error" | "info"): void;
  help(label: string, action: () => void): void;
  cover: string;
}

declare global {
  interface Window {
    IMFRAClassGames: {
      describe(cursoTitulo: string, claseIndex: number): { tipo: GameType; nombre: string; instruccion: string; icono: string };
      play(options: PlayOptions): Promise<boolean>;
      hasWon(cursoId: string, claseNumero: number): boolean;
    };
    UserState?: { uid?: string; email?: string; modo?: string; photoURL?: string; displayName?: string };
    IMFRALearningSync?: { syncNow(): Promise<unknown>; schedule(): void };
  }
}

const esc = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

export function shuffle<T>(items: T[]): T[] {
  const list = items.slice();
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/** Mezcla asegurando que el resultado no quede ya resuelto. */
function shuffleUnsolved<T>(items: T[]): T[] {
  if (items.length < 2) return items.slice();
  let list = shuffle(items);
  for (let tries = 0; tries < 10 && list.every((item, i) => item === items[i]); tries++) list = shuffle(items);
  return list;
}

export const normalizeWord = (word: string) => word.toUpperCase()
  .replace(/Ñ/g, "\u0000").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\u0000/g, "Ñ")
  .replace(/[^A-ZÑ]/g, "");

function accountKey() {
  const state = window.UserState;
  return String(state?.uid || state?.email || "guest").toLowerCase();
}
const winKey = (cursoId: string, num: number) => `imfra:v2:class-game:${accountKey()}:${cursoId}:${num}`;

function hasWon(cursoId: string, num: number) {
  try { return Boolean(localStorage.getItem(winKey(cursoId, num))); } catch { return false; }
}

// ─────────────────────────── Sopa de letras ───────────────────────────
function gameSopa(stage: HTMLElement, cfg: Extract<GameConfig, { tipo: "sopa" }>, ctx: GameContext) {
  const words = cfg.palabras.map(normalizeWord).filter((w) => w.length >= 2).slice(0, 5);
  const dirs = [[0, 1], [1, 0], [1, 1], [-1, 1]];
  const letters = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
  let size = Math.max(10, Math.max(...words.map((w) => w.length)) + 1);
  let grid: string[][] = [];
  const placed = new Map<string, [number, number][]>();

  build: for (let attempt = 0; attempt < 30; attempt++) {
    grid = Array.from({ length: size }, () => Array(size).fill(""));
    placed.clear();
    for (const word of [...words].sort((a, b) => b.length - a.length)) {
      let ok = false;
      for (let t = 0; t < 300 && !ok; t++) {
        const [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)];
        const r0 = Math.floor(Math.random() * size);
        const c0 = Math.floor(Math.random() * size);
        const cells: [number, number][] = [];
        for (let k = 0; k < word.length; k++) {
          const r = r0 + dr * k, c = c0 + dc * k;
          if (r < 0 || c < 0 || r >= size || c >= size) break;
          if (grid[r][c] && grid[r][c] !== word[k]) break;
          cells.push([r, c]);
        }
        if (cells.length !== word.length) continue;
        cells.forEach(([r, c], k) => { grid[r][c] = word[k]; });
        placed.set(word, cells);
        ok = true;
      }
      if (!ok) { if (attempt % 5 === 4) size = Math.min(15, size + 1); continue build; }
    }
    break;
  }
  // Respaldo determinista: aun si el generador aleatorio no logra acomodarlas,
  // ninguna palabra queda fuera del tablero ni puede bloquear el avance.
  if (placed.size !== words.length) {
    size = Math.max(size, words.length * 2 - 1);
    grid = Array.from({ length: size }, () => Array(size).fill(""));
    placed.clear();
    words.forEach((word, index) => {
      const cells = [...word].map((letter, column) => {
        const row = index * 2;
        grid[row][column] = letter;
        return [row, column] as [number, number];
      });
      placed.set(word, cells);
    });
  }
  grid = grid.map((row) => row.map((ch) => ch || letters[Math.floor(Math.random() * letters.length)]));

  const found = new Set<string>();
  stage.innerHTML = `<div class="cg-sopa">
    <div class="cg-sopa__grid" style="--n:${size}">${grid.map((row, r) => row.map((ch, c) => `<button type="button" class="cg-sopa__cell" data-r="${r}" data-c="${c}">${ch}</button>`).join("")).join("")}</div>
    <div class="cg-sopa__side"><span class="cg-label">Palabras a encontrar</span><ul class="cg-sopa__words">${words.map((w) => `<li data-word="${w}">${w}</li>`).join("")}</ul>
    <p class="cg-hint"><b>Arrastra</b> desde la primera hasta la última letra, o <b>toca</b> la primera letra y luego la última.</p></div>
  </div>`;
  ctx.progress(0, words.length);
  const gridEl = stage.querySelector<HTMLElement>(".cg-sopa__grid")!;
  const cellAt = (r: number, c: number) => gridEl.querySelector<HTMLElement>(`[data-r="${r}"][data-c="${c}"]`);
  let start: [number, number] | null = null;
  let tapStart: [number, number] | null = null;
  let moved = false;

  const lineCells = (a: [number, number], b: [number, number]): [number, number][] | null => {
    const dr = Math.sign(b[0] - a[0]), dc = Math.sign(b[1] - a[1]);
    const lr = Math.abs(b[0] - a[0]), lc = Math.abs(b[1] - a[1]);
    if (!(lr === 0 || lc === 0 || lr === lc)) return null;
    const len = Math.max(lr, lc) + 1;
    return Array.from({ length: len }, (_, k) => [a[0] + dr * k, a[1] + dc * k] as [number, number]);
  };
  const clearSel = () => gridEl.querySelectorAll(".is-sel,.is-start").forEach((el) => el.classList.remove("is-sel", "is-start"));
  const paint = (cells: [number, number][] | null) => { clearSel(); cells?.forEach(([r, c]) => cellAt(r, c)?.classList.add("is-sel")); };
  const posOf = (el: Element | null): [number, number] | null => {
    const cell = el?.closest<HTMLElement>(".cg-sopa__cell");
    return cell ? [Number(cell.dataset.r), Number(cell.dataset.c)] : null;
  };
  const evaluate = (cells: [number, number][] | null) => {
    clearSel();
    if (!cells || cells.length < 2) return;
    const text = cells.map(([r, c]) => grid[r][c]).join("");
    const reversed = [...text].reverse().join("");
    const word = words.find((w) => !found.has(w) && (w === text || w === reversed));
    if (!word) { gridEl.classList.add("cg-shake"); setTimeout(() => gridEl.classList.remove("cg-shake"), 360); return; }
    found.add(word);
    cells.forEach(([r, c]) => cellAt(r, c)?.classList.add("is-found"));
    stage.querySelector(`[data-word="${word}"]`)?.classList.add("is-found");
    ctx.progress(found.size, words.length);
    if (found.size === words.length) ctx.win("¡Encontraste todas las palabras!");
  };

  ctx.help("Encontrar una palabra", () => {
    const word = words.find((item) => !found.has(item));
    if (!word) return;
    const cells = placed.get(word);
    if (!cells) return;
    found.add(word);
    cells.forEach(([r, c]) => cellAt(r, c)?.classList.add("is-found"));
    stage.querySelector(`[data-word="${word}"]`)?.classList.add("is-found");
    ctx.feedback(`Te ayudamos con ${word}. ¡Vamos por la siguiente!`, "ok");
    ctx.progress(found.size, words.length);
    if (found.size === words.length) ctx.win("¡Encontraste todas las palabras!");
  });

  gridEl.addEventListener("pointerdown", (event) => {
    const pos = posOf(event.target as Element);
    if (!pos) return;
    event.preventDefault();
    start = pos; moved = false;
    paint([pos]);
  });
  gridEl.addEventListener("pointermove", (event) => {
    if (!start) return;
    const pos = posOf(document.elementFromPoint(event.clientX, event.clientY));
    if (!pos) return;
    if (pos[0] !== start[0] || pos[1] !== start[1]) moved = true;
    paint(lineCells(start, pos));
  });
  const finish = (event: PointerEvent) => {
    if (!start) return;
    const pos = posOf(document.elementFromPoint(event.clientX, event.clientY)) || start;
    const from = start;
    start = null;
    if (moved) { tapStart = null; evaluate(lineCells(from, pos)); return; }
    // Modo toque: primera letra y luego la última.
    if (!tapStart) { tapStart = from; clearSel(); cellAt(from[0], from[1])?.classList.add("is-start"); return; }
    const first = tapStart;
    tapStart = null;
    evaluate(lineCells(first, from));
  };
  gridEl.addEventListener("pointerup", finish);
  gridEl.addEventListener("pointercancel", () => { start = null; clearSel(); });
}

// ─────────────────────────── Crucigrama ───────────────────────────
export interface CrossWord { word: string; clue: string; r: number; c: number; dir: "h" | "v"; num: number }

// Prueba varias combinaciones y conserva la más compacta y mejor conectada.
export function layoutCrossword(entries: { palabra: string; pista: string }[]): CrossWord[] {
  const items = entries.map((e) => ({ word: normalizeWord(e.palabra), clue: e.pista })).filter((e) => e.word.length >= 2)
    .sort((a, b) => b.word.length - a.word.length);
  let best: { placed: CrossWord[]; score: number } | null = null;
  for (let attempt = 0; attempt < 60; attempt++) {
    const order = attempt === 0 ? items : [items[0], ...shuffle(items.slice(1))];
    const result = tryCrossword(order);
    const rows = Math.max(...result.placed.map((w) => w.r + (w.dir === "v" ? w.word.length : 1)));
    const cols = Math.max(...result.placed.map((w) => w.c + (w.dir === "h" ? w.word.length : 1)));
    const score = result.isolated * 10000 + rows * cols + Math.abs(rows - cols) * 4;
    if (!best || score < best.score) best = { placed: result.placed, score };
  }
  return best!.placed;
}

function tryCrossword(items: { word: string; clue: string }[]): { placed: CrossWord[]; isolated: number } {
  let isolated = 0;
  const cells = new Map<string, string>();
  const placed: CrossWord[] = [];
  const key = (r: number, c: number) => `${r},${c}`;
  const fits = (word: string, r: number, c: number, dir: "h" | "v") => {
    const dr = dir === "v" ? 1 : 0, dc = dir === "h" ? 1 : 0;
    if (cells.has(key(r - dr, c - dc)) || cells.has(key(r + dr * word.length, c + dc * word.length))) return -1;
    let crossings = 0;
    for (let k = 0; k < word.length; k++) {
      const rr = r + dr * k, cc = c + dc * k;
      const existing = cells.get(key(rr, cc));
      if (existing) { if (existing !== word[k]) return -1; crossings++; continue; }
      // Sin letras pegadas a los lados que formen palabras falsas.
      if (cells.has(key(rr + dc, cc + dr)) || cells.has(key(rr - dc, cc - dr))) return -1;
    }
    return crossings;
  };
  const put = (item: { word: string; clue: string }, r: number, c: number, dir: "h" | "v") => {
    for (let k = 0; k < item.word.length; k++) cells.set(key(r + (dir === "v" ? k : 0), c + (dir === "h" ? k : 0)), item.word[k]);
    placed.push({ word: item.word, clue: item.clue, r, c, dir, num: 0 });
  };
  items.forEach((item, index) => {
    if (index === 0) { put(item, 0, 0, "h"); return; }
    let best: { r: number; c: number; dir: "h" | "v"; score: number } | null = null;
    for (const p of placed) {
      for (let i = 0; i < item.word.length; i++) {
        for (let j = 0; j < p.word.length; j++) {
          if (item.word[i] !== p.word[j]) continue;
          const dir: "h" | "v" = p.dir === "h" ? "v" : "h";
          const r = p.dir === "h" ? p.r - i : p.r + j;
          const c = p.dir === "h" ? p.c + j : p.c - i;
          const score = fits(item.word, r, c, dir);
          if (score > 0 && (!best || score > best.score)) best = { r, c, dir, score };
        }
      }
    }
    if (best) { put(item, best.r, best.c, best.dir); return; }
    // Sin cruce posible: se coloca aparte, debajo del resto.
    isolated += 1;
    const maxR = Math.max(...[...cells.keys()].map((k) => Number(k.split(",")[0])));
    const minC = Math.min(...[...cells.keys()].map((k) => Number(k.split(",")[1])));
    put(item, maxR + 2, minC, "h");
  });
  const minR = Math.min(...placed.map((p) => p.r)), minC = Math.min(...placed.map((p) => p.c));
  placed.forEach((p) => { p.r -= minR; p.c -= minC; });
  const starts = [...new Set(placed.map((p) => `${p.r},${p.c}`))]
    .sort((a, b) => { const [ar, ac] = a.split(",").map(Number); const [br, bc] = b.split(",").map(Number); return ar - br || ac - bc; });
  placed.forEach((p) => { p.num = starts.indexOf(`${p.r},${p.c}`) + 1; });
  return { placed, isolated };
}

function gameCrucigrama(stage: HTMLElement, cfg: Extract<GameConfig, { tipo: "crucigrama" }>, ctx: GameContext) {
  const words = layoutCrossword(cfg.entradas.slice(0, 4));
  const rows = Math.max(...words.map((w) => w.r + (w.dir === "v" ? w.word.length : 1)));
  const cols = Math.max(...words.map((w) => w.c + (w.dir === "h" ? w.word.length : 1)));
  const solution = new Map<string, string>();
  const numbers = new Map<string, number>();
  const cellsOf = (w: CrossWord) => Array.from({ length: w.word.length }, (_, k) => `${w.r + (w.dir === "v" ? k : 0)},${w.c + (w.dir === "h" ? k : 0)}`);
  words.forEach((w) => { cellsOf(w).forEach((k, i) => solution.set(k, w.word[i])); numbers.set(`${w.r},${w.c}`, w.num); });
  let html = "";
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const k = `${r},${c}`;
    html += solution.has(k)
      ? `<label class="cg-cross__cell">${numbers.has(k) ? `<small>${numbers.get(k)}</small>` : ""}<input data-k="${k}" maxlength="1" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Casilla"></label>`
      : `<span class="cg-cross__void"></span>`;
  }
  const clueList = (dir: "h" | "v") => words.filter((w) => w.dir === dir).sort((a, b) => a.num - b.num)
    .map((w) => `<li data-clue="${words.indexOf(w)}"><b>${w.num}</b><span>${esc(w.clue)}</span><em>${w.word.length}</em></li>`).join("");
  stage.innerHTML = `<div class="cg-cross${cfg.imagen ? " has-photo" : ""}">
    ${cfg.imagen ? `<figure class="cg-cross__photo"><img src="${esc(cfg.imagen)}" alt="" decoding="async"></figure>` : ""}
    <div class="cg-cross__board"><div class="cg-cross__grid" style="--cols:${cols}">${html}</div></div>
    <div class="cg-cross__clues">
      ${words.some((w) => w.dir === "h") ? `<span class="cg-label">Horizontales</span><ol>${clueList("h")}</ol>` : ""}
      ${words.some((w) => w.dir === "v") ? `<span class="cg-label">Verticales</span><ol>${clueList("v")}</ol>` : ""}
    </div>
  </div>`;
  const input = (k: string) => stage.querySelector<HTMLInputElement>(`input[data-k="${k}"]`);
  let active = 0;
  const solved = new Set<number>();
  ctx.progress(0, words.length);

  const paintLetter = (el: HTMLInputElement) => {
    const correct = Boolean(el.value) && el.value === solution.get(el.dataset.k!);
    el.parentElement?.classList.toggle("is-letter-correct", correct);
  };

  const highlight = () => {
    stage.querySelectorAll(".is-active").forEach((el) => el.classList.remove("is-active"));
    cellsOf(words[active]).forEach((k) => input(k)?.parentElement?.classList.add("is-active"));
    stage.querySelector(`[data-clue="${active}"]`)?.classList.add("is-active");
  };
  const check = () => {
    words.forEach((w, i) => {
      if (solved.has(i)) return;
      if (cellsOf(w).every((k) => input(k)?.value === solution.get(k))) {
        solved.add(i);
        cellsOf(w).forEach((k) => input(k)?.parentElement?.classList.add("is-solved"));
        stage.querySelector(`[data-clue="${i}"]`)?.classList.add("is-solved");
      }
    });
    ctx.progress(solved.size, words.length);
    if (solved.size === words.length) {
      stage.querySelectorAll<HTMLInputElement>("input").forEach((el) => { el.readOnly = true; });
      ctx.win("¡Crucigrama resuelto!");
    }
  };
  const wordsAt = (k: string) => words.map((w, i) => ({ w, i })).filter(({ w }) => cellsOf(w).includes(k));

  stage.querySelectorAll<HTMLInputElement>("input").forEach((el) => {
    el.addEventListener("focus", () => {
      const options = wordsAt(el.dataset.k!);
      if (!options.some((o) => o.i === active)) active = options[0].i;
      highlight();
    });
    el.addEventListener("click", () => {
      const options = wordsAt(el.dataset.k!);
      if (options.length > 1) { active = options.find((o) => o.i !== active)?.i ?? active; highlight(); }
    });
    el.addEventListener("input", () => {
      el.value = normalizeWord(el.value).slice(-1);
      paintLetter(el);
      check();
      if (!el.value) return;
      const list = cellsOf(words[active]);
      const next = list[list.indexOf(el.dataset.k!) + 1];
      if (next) input(next)?.focus();
    });
    el.addEventListener("keydown", (event) => {
      if (event.key !== "Backspace" || el.value) return;
      const list = cellsOf(words[active]);
      const prev = list[list.indexOf(el.dataset.k!) - 1];
      if (prev) { event.preventDefault(); const p = input(prev); if (p) { p.value = ""; paintLetter(p); p.focus(); } }
    });
  });
  stage.querySelectorAll<HTMLElement>("[data-clue]").forEach((li) => li.addEventListener("click", () => {
    active = Number(li.dataset.clue);
    const firstEmpty = cellsOf(words[active]).find((k) => input(k)?.value !== solution.get(k)) || cellsOf(words[active])[0];
    input(firstEmpty)?.focus();
    highlight();
  }));
  ctx.help("Regalarme una letra", () => {
    const target = words[active] && !solved.has(active) ? words[active] : words.find((_, i) => !solved.has(i));
    if (!target) return;
    const k = cellsOf(target).find((key) => input(key)?.value !== solution.get(key));
    if (!k) return;
    const el = input(k)!;
    el.value = solution.get(k)!;
    el.parentElement?.classList.add("is-revealed");
    paintLetter(el);
    ctx.feedback("Letra correcta colocada. Puedes pedir todas las que necesites.", "ok");
    check();
  });
  highlight();
}

// ─────────────────────────── Rompecabezas ───────────────────────────
function gameRompecabezas(stage: HTMLElement, cfg: Extract<GameConfig, { tipo: "rompecabezas" }>, ctx: GameContext) {
  const side = 3;
  const total = side * side;
  const solved = Array.from({ length: total }, (_, i) => i);
  let order = shuffleUnsolved(solved);
  let selected: number | null = null;
  let done = false;
  const source = cfg.imagen || ctx.cover;
  const image = source ? `url('${source.replace(/'/g, "%27")}')` : "linear-gradient(135deg,#f59d1a,#5c3a0e)";
  stage.innerHTML = `<div class="cg-puzzle">
    <div class="cg-puzzle__board" style="--side:${side}"></div>
    <div class="cg-puzzle__side"><span class="cg-label">Imagen de referencia</span><div class="cg-puzzle__preview" style="background-image:${image}"></div>
    <p class="cg-hint">Toca una pieza y luego otra para intercambiarlas. Las piezas que ya están en su lugar se marcan en verde.</p></div>
  </div>`;
  const board = stage.querySelector<HTMLElement>(".cg-puzzle__board")!;
  const render = () => {
    board.innerHTML = order.map((piece, slot) => {
      const x = (piece % side) / (side - 1) * 100;
      const y = Math.floor(piece / side) / (side - 1) * 100;
      return `<button type="button" class="cg-puzzle__piece ${piece === slot ? "is-placed" : ""} ${selected === slot ? "is-selected" : ""}" data-slot="${slot}" style="background-image:${image};background-size:${side * 100}% ${side * 100}%;background-position:${x}% ${y}%" aria-label="Pieza ${slot + 1}"></button>`;
    }).join("");
    const placed = order.filter((piece, slot) => piece === slot).length;
    ctx.progress(placed, total);
  };
  const finishIfReady = () => {
    if (!order.every((piece, i) => piece === i)) return false;
    done = true;
    board.classList.add("is-complete");
    ctx.win(cfg.mensaje || "¡Imagen completa!");
    return true;
  };
  ctx.help("Colocar una pieza", () => {
    if (done) return;
    const slot = order.findIndex((piece, i) => piece !== i);
    if (slot < 0) return;
    const source = order.indexOf(slot);
    [order[slot], order[source]] = [order[source], order[slot]];
    selected = null;
    order = order.slice();
    render();
    ctx.feedback("Pieza colocada. Las correctas tienen borde verde.", "ok");
    finishIfReady();
  });
  board.addEventListener("click", (event) => {
    if (done) return;
    const btn = (event.target as Element).closest<HTMLElement>("[data-slot]");
    if (!btn) return;
    const slot = Number(btn.dataset.slot);
    if (selected === null) { selected = slot; render(); return; }
    if (selected !== slot) { [order[selected], order[slot]] = [order[slot], order[selected]]; order = order.slice(); }
    selected = null;
    render();
    finishIfReady();
  });
  render();
}

// ─────────────────────────── Señala en el plano ───────────────────────────
function gamePlano(stage: HTMLElement, cfg: Extract<GameConfig, { tipo: "plano" }>, ctx: GameContext) {
  const rounds = cfg.rondas.slice(0, 3);
  let round = 0;
  let locked = false;
  let mistakes = 0;
  stage.innerHTML = `<div class="cg-planogame">
    <p class="cg-planogame__q" data-question></p>
    <div class="cg-planogame__map${cfg.plano === "obra" ? " is-photo" : ""}">${planSvg(cfg.plano)}</div>
  </div>`;
  const question = stage.querySelector<HTMLElement>("[data-question]")!;
  const svg = stage.querySelector<HTMLElement>(".cg-planogame__map")!;
  const showHelp = () => {
    const current = rounds[round];
    if (!current) return;
    svg.querySelectorAll(".is-hint").forEach((el) => el.classList.remove("is-hint"));
    const zone = svg.querySelector<HTMLElement>(`[data-zone="${current.zona}"]`);
    zone?.classList.add("is-hint");
    if (zone?.dataset.idx) svg.querySelector(`[data-label-idx="${zone.dataset.idx}"]`)?.classList.add("is-visible");
    ctx.feedback("La zona correcta está brillando. Tócala para continuar.", "info");
  };
  const showRound = () => {
    mistakes = 0;
    svg.querySelectorAll(".is-hint").forEach((el) => el.classList.remove("is-hint"));
    question.innerHTML = `<span>Situación ${round + 1} de ${rounds.length}</span>${esc(rounds[round].pregunta)}`;
    ctx.progress(round, rounds.length);
  };
  const completeRound = (zone: HTMLElement | SVGElement, assisted = false) => {
    if (locked) return;
    const current = rounds[round];
    locked = true;
    svg.querySelectorAll(".is-correct-now").forEach((el) => el.classList.remove("is-correct-now"));
    zone.classList.add("is-correct", "is-correct-now");
    svg.querySelector(`[data-label-idx="${zone.dataset.idx}"]`)?.classList.add("is-visible");
    round += 1;
    ctx.progress(round, rounds.length);
    ctx.feedback(assisted ? `Resuelto con ayuda. ${current.explicacion}` : current.explicacion, "ok");
    if (round >= rounds.length) { ctx.win("¡Ubicaste todo correctamente en el plano!"); return; }
    setTimeout(() => { locked = false; showRound(); }, assisted ? 650 : 1100);
  };
  ctx.help("Resolver esta situación", () => {
    const current = rounds[round];
    if (!current || locked) return;
    showHelp();
    const zone = svg.querySelector<HTMLElement>(`[data-zone="${current.zona}"]`);
    if (zone) completeRound(zone, true);
  });
  svg.addEventListener("click", (event) => {
    if (locked) return;
    const zone = (event.target as Element).closest<HTMLElement>("[data-zone]");
    if (!zone) return;
    const current = rounds[round];
    if (zone.dataset.zone !== current.zona) {
      zone.classList.remove("is-wrong");
      void zone.getBoundingClientRect();
      zone.classList.add("is-wrong");
      ctx.feedback("Ese no es el lugar correcto. Observa el plano e inténtalo de nuevo.", "error");
      mistakes += 1;
      if (mistakes >= 2) showHelp();
      return;
    }
    completeRound(zone);
  });
  showRound();
}

// ─────────────────────────── Memorama ───────────────────────────
const PAIR_COLORS = ["#f59d1a", "#2f8fdd", "#14a37f", "#8b62d9", "#e2577b", "#d9a400", "#1fa8b8", "#e46b2e"];

function gameMemorama(stage: HTMLElement, cfg: Extract<GameConfig, { tipo: "memorama" }>, ctx: GameContext) {
  const pairs = cfg.pares.slice(0, 4);
  const cards = shuffle(pairs.flatMap((p, i) => [{ pair: i, text: p.termino, kind: "term" }, { pair: i, text: p.definicion, kind: "def" }]));
  const matched = new Set<number>();
  let open: number[] = [];
  let busy = false;
  let found = 0;
  stage.innerHTML = `<div class="cg-memo">${cards.map((card, i) => `<button type="button" class="cg-memo__card cg-memo__card--${card.kind}" data-i="${i}" aria-label="Carta ${i + 1}">
    <span class="cg-memo__inner">
      <span class="cg-memo__back"><span class="cg-memo__emblem"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17h18M5 17v-2.2a7 7 0 0 1 14 0V17"/><path d="M10 8.3V6.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.8M8.5 10.5v3M15.5 10.5v3"/></svg></span><small>IMFRA</small></span>
      <span class="cg-memo__front"><span class="cg-memo__tag">${card.kind === "term" ? "Término" : "Definición"}</span><span class="cg-memo__text">${esc(card.text)}</span><span class="cg-memo__pair" aria-hidden="true"></span></span>
    </span></button>`).join("")}</div>`;
  ctx.progress(0, pairs.length);
  const cardEl = (i: number) => stage.querySelector<HTMLElement>(`[data-i="${i}"]`);
  const completePair = (pair: number) => {
    if (matched.has(pair)) return;
    matched.add(pair);
    found += 1;
    const color = PAIR_COLORS[(found - 1) % PAIR_COLORS.length];
    cards.forEach((card, idx) => {
      if (card.pair !== pair) return;
      const el = cardEl(idx);
      if (!el) return;
      el.style.setProperty("--pair", color);
      el.querySelector(".cg-memo__pair")!.textContent = `✓ ${found}`;
      el.classList.add("is-open", "is-matched");
    });
    ctx.progress(matched.size, pairs.length);
    if (matched.size === pairs.length) ctx.win("¡Encontraste todas las parejas!");
  };
  ctx.help("Encontrar una pareja", () => {
    if (busy) return;
    open.forEach((idx) => cardEl(idx)?.classList.remove("is-open", "is-wrong"));
    open = [];
    const pair = pairs.findIndex((_, i) => !matched.has(i));
    if (pair < 0) return;
    completePair(pair);
    ctx.feedback("Pareja encontrada. Puedes pedir otra cuando quieras.", "ok");
  });
  stage.querySelector(".cg-memo")!.addEventListener("click", (event) => {
    const btn = (event.target as Element).closest<HTMLElement>("[data-i]");
    if (!btn || busy) return;
    const i = Number(btn.dataset.i);
    if (open.includes(i) || matched.has(cards[i].pair)) return;
    btn.classList.add("is-open");
    open.push(i);
    if (open.length < 2) return;
    const [a, b] = open;
    if (cards[a].pair === cards[b].pair && cards[a].kind !== cards[b].kind) {
      completePair(cards[a].pair);
      open = [];
      return;
    }
    busy = true;
    open.forEach((idx) => cardEl(idx)?.classList.add("is-wrong"));
    setTimeout(() => {
      open.forEach((idx) => cardEl(idx)?.classList.remove("is-open", "is-wrong"));
      open = [];
      busy = false;
    }, 1000);
  });
}

// ─────────────────────────── Ordena el proceso ───────────────────────────
function gameOrdenar(stage: HTMLElement, cfg: Extract<GameConfig, { tipo: "ordenar" }>, ctx: GameContext) {
  const correct = cfg.pasos.slice(0, 5);
  let order = shuffleUnsolved(correct);
  let done = false;
  stage.innerHTML = `<div class="cg-order"><p class="cg-order__q">${esc(cfg.pregunta)}</p><ol class="cg-order__list"></ol>
    <button type="button" class="cg-primary" data-check>Comprobar orden</button></div>`;
  const list = stage.querySelector<HTMLElement>(".cg-order__list")!;
  const render = (marks = false) => {
    list.innerHTML = order.map((step, i) => `<li class="${marks ? (step === correct[i] ? "is-ok" : "is-bad") : ""}">
      <b>${i + 1}</b><span>${esc(step)}</span>
      <span class="cg-order__moves"><button type="button" data-move="${i}" data-dir="-1" aria-label="Subir" ${i === 0 || done ? "disabled" : ""}>▲</button><button type="button" data-move="${i}" data-dir="1" aria-label="Bajar" ${i === order.length - 1 || done ? "disabled" : ""}>▼</button></span>
    </li>`).join("");
  };
  const finishIfReady = () => {
    if (!order.every((step, i) => step === correct[i])) return false;
    done = true;
    render(true);
    stage.querySelector<HTMLButtonElement>("[data-check]")!.disabled = true;
    ctx.progress(correct.length, correct.length);
    ctx.win("¡Orden correcto!");
    return true;
  };
  ctx.help("Acomodar un paso", () => {
    if (done) return;
    const target = order.findIndex((step, i) => step !== correct[i]);
    if (target < 0) return;
    const source = order.indexOf(correct[target]);
    const [step] = order.splice(source, 1);
    order.splice(target, 0, step);
    order = order.slice();
    render(true);
    const ok = order.filter((item, i) => item === correct[i]).length;
    ctx.progress(ok, correct.length);
    ctx.feedback("Colocamos el siguiente paso. Los verdes ya están bien.", "ok");
    finishIfReady();
  });
  ctx.progress(0, correct.length);
  list.addEventListener("click", (event) => {
    const btn = (event.target as Element).closest<HTMLElement>("[data-move]");
    if (!btn || done) return;
    const i = Number(btn.dataset.move), j = i + Number(btn.dataset.dir);
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    order = order.slice();
    render();
  });
  stage.querySelector<HTMLButtonElement>("[data-check]")!.addEventListener("click", () => {
    const ok = order.filter((step, i) => step === correct[i]).length;
    ctx.progress(ok, correct.length);
    if (ok === correct.length) {
      finishIfReady();
      return;
    }
    render(true);
    ctx.feedback(`${ok} de ${correct.length} pasos están en su lugar. Mueve los marcados en rojo y vuelve a comprobar.`, "error");
  });
  render();
}

// ─────────────────────────── Clasifica ───────────────────────────
function gameClasificar(stage: HTMLElement, cfg: Extract<GameConfig, { tipo: "clasificar" }>, ctx: GameContext) {
  const items = shuffle(cfg.elementos.slice(0, 5).map((e, i) => ({ ...e, id: i })));
  const placed = new Set<number>();
  let selected: number | null = items[0]?.id ?? null;
  stage.innerHTML = `<div class="cg-sort">
    <p class="cg-order__q">${esc(cfg.pregunta)}</p>
    <div class="cg-sort__pool"></div>
    <div class="cg-sort__cols" style="--cols:${cfg.categorias.length}">${cfg.categorias.map((cat, i) => `<button type="button" class="cg-sort__col" data-cat="${i}"><strong>${esc(cat)}</strong><ul></ul></button>`).join("")}</div>
    <p class="cg-hint">Toca un elemento y después la categoría a la que pertenece.</p>
  </div>`;
  const pool = stage.querySelector<HTMLElement>(".cg-sort__pool")!;
  const renderPool = () => {
    const left = items.filter((it) => !placed.has(it.id));
    if (selected !== null && placed.has(selected)) selected = left[0]?.id ?? null;
    pool.innerHTML = left.map((it) => `<button type="button" class="cg-chip ${selected === it.id ? "is-selected" : ""}" data-item="${it.id}">${esc(it.texto)}</button>`).join("");
  };
  const place = (item: typeof items[number], assisted = false) => {
    const col = stage.querySelector<HTMLElement>(`[data-cat="${item.categoria}"]`)!;
    stage.querySelectorAll(".cg-sort__col.is-hint").forEach((el) => el.classList.remove("is-hint"));
    placed.add(item.id);
    col.querySelector("ul")!.insertAdjacentHTML("beforeend", `<li>${esc(item.texto)}</li>`);
    ctx.feedback(assisted ? `Te ayudamos: va en ${cfg.categorias[item.categoria]}.` : "¡Correcto!", "ok");
    ctx.progress(placed.size, items.length);
    renderPool();
    if (placed.size === items.length) ctx.win("¡Todo quedó bien clasificado!");
  };
  ctx.help("Clasificar uno", () => {
    if (selected === null) return;
    const item = items.find((it) => it.id === selected);
    if (item) place(item, true);
  });
  ctx.progress(0, items.length);
  pool.addEventListener("click", (event) => {
    const btn = (event.target as Element).closest<HTMLElement>("[data-item]");
    if (!btn) return;
    selected = Number(btn.dataset.item);
    renderPool();
  });
  stage.querySelectorAll<HTMLElement>("[data-cat]").forEach((col) => col.addEventListener("click", () => {
    if (selected === null) return;
    const item = items.find((it) => it.id === selected)!;
    if (item.categoria !== Number(col.dataset.cat)) {
      col.classList.remove("cg-shake"); void col.offsetWidth; col.classList.add("cg-shake");
      ctx.feedback(`“${item.texto}” no va en ${cfg.categorias[Number(col.dataset.cat)]}. Piénsalo de nuevo.`, "error");
      stage.querySelector(`[data-cat="${item.categoria}"]`)?.classList.add("is-hint");
      return;
    }
    place(item);
  }));
  renderPool();
}

// ─────────────────────────── Adivina la palabra ───────────────────────────
function gameAhorcado(stage: HTMLElement, cfg: Extract<GameConfig, { tipo: "ahorcado" }>, ctx: GameContext) {
  const MAX_ERRORS = 6;
  const pool = shuffle(cfg.palabras);
  let turn = 0;
  const start = () => {
    const entry = pool[turn % pool.length];
    const word = normalizeWord(entry.palabra);
    const guessed = new Set<string>();
    let errors = 0;
    let over = false;
    stage.innerHTML = `<div class="cg-hang">
      <div class="cg-hang__meter" aria-label="Errores"><span class="cg-label">Errores</span><div>${Array.from({ length: MAX_ERRORS }, (_, i) => `<i data-err="${i}"></i>`).join("")}</div></div>
      <p class="cg-hang__clue"><span>Pista</span>${esc(entry.pista)}</p>
      <div class="cg-hang__word"></div>
      <div class="cg-hang__keys">${"ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("").map((l) => `<button type="button" data-key="${l}">${l}</button>`).join("")}</div>
    </div>`;
    const wordEl = stage.querySelector<HTMLElement>(".cg-hang__word")!;
    const draw = () => {
      wordEl.innerHTML = [...word].map((l) => `<span class="${guessed.has(l) ? "is-shown" : ""}">${guessed.has(l) ? l : ""}</span>`).join("");
      stage.querySelectorAll<HTMLElement>("[data-err]").forEach((el) => el.classList.toggle("is-on", Number(el.dataset.err) < errors));
      const unique = new Set(word);
      ctx.progress([...unique].filter((l) => guessed.has(l)).length, unique.size);
    };
    const revealLetter = () => {
      if (over) return;
      const letter = [...word].find((item) => !guessed.has(item));
      if (!letter) return;
      guessed.add(letter);
      const key = stage.querySelector<HTMLButtonElement>(`[data-key="${letter}"]`);
      if (key) { key.disabled = true; key.classList.add("is-hit"); }
      draw();
      ctx.feedback(`Pista divertida: revelamos la letra ${letter}.`, "ok");
      if ([...word].every((item) => guessed.has(item))) { over = true; ctx.win(`¡Correcto! La palabra es ${word}.`); }
    };
    ctx.help("Regalarme una letra", revealLetter);
    stage.querySelector(".cg-hang__keys")!.addEventListener("click", (event) => {
      const btn = (event.target as Element).closest<HTMLButtonElement>("[data-key]");
      if (!btn || over || btn.disabled) return;
      const letter = btn.dataset.key!;
      btn.disabled = true;
      guessed.add(letter);
      if (word.includes(letter)) btn.classList.add("is-hit");
      else { btn.classList.add("is-miss"); errors += 1; }
      draw();
      if ([...word].every((l) => guessed.has(l))) { over = true; ctx.win(`¡Correcto! La palabra es ${word}.`); return; }
      if (errors >= MAX_ERRORS) {
        errors = Math.ceil(MAX_ERRORS / 2);
        ctx.feedback("No pasa nada: te regalamos una letra y puedes seguir jugando.", "info");
        revealLetter();
      }
    });
    draw();
  };
  start();
}

// ─────────────────────────── Completa la frase ───────────────────────────
function gameCompletar(stage: HTMLElement, cfg: Extract<GameConfig, { tipo: "completar" }>, ctx: GameContext) {
  const parts = cfg.texto.split(/\[([^\]]+)\]/);
  const answers = parts.filter((_, i) => i % 2 === 1);
  const bank = shuffle([...answers.map((text, i) => ({ text, id: `a${i}` })), ...cfg.distractores.map((text, i) => ({ text, id: `d${i}` }))]);
  const filled = new Set<number>();
  let target = 0;
  stage.innerHTML = `<div class="cg-fill">
    <p class="cg-fill__text">${parts.map((part, i) => i % 2 === 0 ? esc(part) : `<button type="button" class="cg-fill__blank" data-blank="${(i - 1) / 2}"><span>&nbsp;</span></button>`).join("")}</p>
    <div class="cg-fill__bank">${bank.map((w) => `<button type="button" class="cg-chip" data-word="${w.id}">${esc(w.text)}</button>`).join("")}</div>
    <p class="cg-hint">Toca un espacio y luego la palabra que va ahí. Si no eliges espacio, se llena el siguiente libre.</p>
  </div>`;
  const blanks = [...stage.querySelectorAll<HTMLElement>("[data-blank]")];
  const mark = () => blanks.forEach((b, i) => b.classList.toggle("is-target", i === target && !filled.has(i)));
  const fill = (index: number, assisted = false) => {
    const blank = blanks[index];
    if (!blank || filled.has(index)) return;
    stage.querySelectorAll(".cg-chip.is-hint").forEach((el) => el.classList.remove("is-hint"));
    filled.add(index);
    blank.classList.add("is-filled");
    blank.innerHTML = `<span>${esc(answers[index])}</span>`;
    const answer = bank.find((word) => word.id === `a${index}`);
    if (answer) stage.querySelector<HTMLButtonElement>(`[data-word="${answer.id}"]`)!.disabled = true;
    ctx.feedback(assisted ? "Palabra colocada. Sigue con la siguiente." : "¡Bien!", "ok");
    ctx.progress(filled.size, answers.length);
    const next = blanks.findIndex((_, i) => !filled.has(i));
    if (next === -1) { ctx.win("¡Frase completa!"); mark(); return; }
    target = next;
    mark();
  };
  ctx.help("Completar un espacio", () => fill(target, true));
  ctx.progress(0, answers.length);
  blanks.forEach((blank, i) => blank.addEventListener("click", () => { if (!filled.has(i)) { target = i; mark(); } }));
  stage.querySelector(".cg-fill__bank")!.addEventListener("click", (event) => {
    const chip = (event.target as Element).closest<HTMLButtonElement>("[data-word]");
    if (!chip || chip.disabled) return;
    const word = bank.find((w) => w.id === chip.dataset.word)!;
    const blank = blanks[target];
    if (!blank || filled.has(target)) return;
    if (normalizeWord(word.text) !== normalizeWord(answers[target])) {
      blank.classList.remove("cg-shake"); void blank.offsetWidth; blank.classList.add("cg-shake");
      ctx.feedback(`“${word.text}” no completa bien esa parte. Prueba con otra palabra.`, "error");
      stage.querySelector(`[data-word="a${target}"]`)?.classList.add("is-hint");
      return;
    }
    fill(target);
  });
  mark();
}

// ─────────────────────────── Experiencias inmersivas ───────────────────────────
// Fotografías reales para el simulador (clases y Retos).
const SITE_PHOTOS: Record<"izaje" | "excavacion" | "colado" | "andamio", { src: string; alt: string }> = {
  izaje: { src: "./assets/juegos/imfra-sim-izaje.webp", alt: "Grúa elevando un paquete de varilla en la obra" },
  excavacion: { src: "./assets/juegos/imfra-sim-excavacion.webp", alt: "Excavación profunda con escalera de acceso" },
  colado: { src: "./assets/juegos/imfra-sim-colado.webp", alt: "Cimbra y armado de cimentación listos para colar" },
  andamio: { src: "./assets/juegos/imfra-sim-andamio.webp", alt: "Trabajadores en andamio sobre la estructura en construcción" }
};

/** Escena del simulador: fotografía real de obra. */
export function worksiteSceneSvg(kind: "izaje" | "excavacion" | "colado" | "andamio") {
  const photo = SITE_PHOTOS[kind];
  if (photo) return `<img class="site-scene site-photo" src="${photo.src}" alt="${esc(photo.alt)}" decoding="async">`;
  return worksiteSceneDrawing(kind);
}

function worksiteSceneDrawing(kind: "izaje" | "excavacion" | "colado" | "andamio") {
  const accent = kind === "excavacion" ? "#ff8a34" : kind === "colado" ? "#45c6ef" : kind === "andamio" ? "#8b7cff" : "#ffc24b";
  const subject = kind === "izaje"
    ? `<g class="site-scene__crane"><path d="M86 202V45h14v157M93 55h184M158 55l-58 42M228 55l49 40"/><path d="M225 55v68"/><path class="site-scene__cable" d="M225 55v99"/><rect x="192" y="153" width="66" height="24" rx="4"/><path d="M198 177v18M252 177v18"/></g><path class="site-scene__danger" d="M164 197h124l-18 27h-88z"/><g class="site-scene__worker"><circle cx="132" cy="185" r="7"/><path d="M132 192v24M132 200l-12 10M132 200l13 9M132 216l-10 19M132 216l12 19"/></g>`
    : kind === "excavacion"
      ? `<path class="site-scene__pit" d="m76 161 93-47 129 57-94 54z"/><path class="site-scene__cut" d="m76 161 14 44 112 52 2-32zM204 225l94-54-10 45-86 41z"/><g class="site-scene__ladder"><path d="m214 151-31 83M226 157l-31 83"/>${[0,1,2,3,4,5].map((i)=>`<path d="m${211-i*5} ${163+i*13} 13 6"/>`).join("")}</g><path class="site-scene__danger" d="M58 151h122l-13 19H70z"/><circle cx="243" cy="124" r="8"/><path class="site-scene__worker" d="M243 132v27m0-18-15 9m15-9 14 8m-14 10-10 20m10-20 13 18"/>`
      : kind === "colado"
        ? `<path class="site-scene__slab" d="m78 166 126-65 118 58-127 68z"/><g class="site-scene__rebar">${[0,1,2,3,4].map((i)=>`<path d="m${105+i*28} 151 111 54"/>`).join("")}${[0,1,2,3].map((i)=>`<path d="m${126+i*31} 126-2 101"/>`).join("")}</g><path class="site-scene__hose" d="M292 84c-54 4-29 69-79 72-37 2-41 29-38 48"/><circle cx="291" cy="82" r="13"/><g class="site-scene__worker"><circle cx="130" cy="132" r="7"/><path d="M130 139v27m0-18-14 10m14-10 17 6m-17 12-10 19m10-19 15 18"/></g>`
        : `<path class="site-scene__wall" d="m101 76 124-26v168l-124 26z"/><g class="site-scene__scaffold"><path d="M72 221 91 79M175 224l18-166M65 121h132M60 168h132M55 215h132M80 82l111 133M193 61 65 215"/><path class="site-scene__deck" d="m61 164 135-30 4 14-141 31z"/></g><g class="site-scene__worker"><circle cx="130" cy="128" r="7"/><path d="M130 135v26m0-18-13 10m13-10 15 8m-15 10-9 20m9-20 14 18"/></g><path class="site-scene__danger" d="M51 225h155l-18 19H65z"/>`;
  return `<svg class="site-scene" viewBox="0 0 380 280" role="img" aria-label="Escena tridimensional de obra"><defs><linearGradient id="siteSky-${kind}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#17263c"/><stop offset="1" stop-color="#07101d"/></linearGradient><linearGradient id="siteFloor-${kind}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#24354a"/><stop offset="1" stop-color="#101a28"/></linearGradient></defs><rect width="380" height="280" rx="22" fill="url(#siteSky-${kind})"/><circle cx="305" cy="54" r="70" fill="${accent}" opacity=".08"/><path d="M0 220 191 123l189 94v63H0z" fill="url(#siteFloor-${kind})"/><g class="site-scene__grid"><path d="M0 245 241 123M48 280l241-123M144 280l191-96M380 244 137 123M334 280 94 160M242 280 48 183"/></g><g style="--scene-accent:${accent}">${subject}</g><g class="site-scene__hud"><path d="M24 48V25h23M333 25h23v23M24 232v23h23M356 232v23h-23"/><circle cx="190" cy="140" r="28"/><path d="M190 104v18M190 158v18M154 140h18M208 140h18"/></g></svg>`;
}

function gameInspeccion(stage: HTMLElement, cfg: Extract<GameConfig, { tipo: "inspeccion" }>, ctx: GameContext) {
  let index = 0;
  let busy = false;
  const render = () => {
    const scene = cfg.escenas[index];
    stage.innerHTML = `<div class="cg-immersive cg-inspect">
      <div class="cg-immersive__visual" data-tilt>
        <img src="${esc(scene.imagen)}" alt="Evidencia de ${esc(scene.titulo)}">
        <span class="cg-scanline" aria-hidden="true"></span><span class="cg-reticle" data-reticle style="--x:${scene.foco.x}%;--y:${scene.foco.y}%" aria-hidden="true"></span>
        <div class="cg-immersive__hud"><span>INSPECCIÓN ${String(index + 1).padStart(2, "0")}/${String(cfg.escenas.length).padStart(2, "0")}</span><b>● EN CAMPO</b></div>
        <span class="cg-immersive__tag">${esc(scene.etiqueta)}</span>
      </div>
      <div class="cg-immersive__panel"><span class="cg-kicker">Decisión profesional</span><h3>${esc(scene.titulo)}</h3><p>${esc(scene.pregunta)}</p>
        <div class="cg-decision">${scene.opciones.map((option, i) => `<button type="button" data-answer="${i}"><b>${String.fromCharCode(65 + i)}</b><span>${esc(option)}</span></button>`).join("")}</div>
      </div></div>`;
    ctx.progress(index, cfg.escenas.length);
    const visual = stage.querySelector<HTMLElement>("[data-tilt]")!;
    visual.addEventListener("pointermove", (event) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const rect = visual.getBoundingClientRect();
      visual.style.setProperty("--rx", `${((event.clientY - rect.top) / rect.height - .5) * -3}deg`);
      visual.style.setProperty("--ry", `${((event.clientX - rect.left) / rect.width - .5) * 4}deg`);
    });
    visual.addEventListener("pointerleave", () => { visual.style.setProperty("--rx", "0deg"); visual.style.setProperty("--ry", "0deg"); });
    const reveal = () => {
      stage.querySelector(`[data-answer="${scene.correcta}"]`)?.classList.add("is-hint");
      stage.querySelector("[data-reticle]")?.classList.add("is-visible");
      ctx.feedback("Pista activada: resaltamos la evidencia y la decisión más segura.", "info");
    };
    const choose = (answer: number, assisted = false) => {
      if (busy) return;
      const button = stage.querySelector<HTMLButtonElement>(`[data-answer="${answer}"]`);
      if (!button) return;
      if (answer !== scene.correcta) {
        button.classList.add("is-wrong");
        reveal();
        ctx.feedback("Esa acción podría ocultar el problema. Te marcamos la opción segura para que puedas continuar.", "error");
        return;
      }
      busy = true;
      button.classList.add("is-correct");
      ctx.feedback(assisted ? `Resuelto con ayuda. ${scene.explicacion}` : scene.explicacion, "ok");
      ctx.progress(index + 1, cfg.escenas.length);
      window.setTimeout(() => { index += 1; busy = false; if (index >= cfg.escenas.length) ctx.win("Inspección completada con criterio técnico."); else render(); }, 950);
    };
    ctx.help("Resolver esta decisión", () => { reveal(); choose(scene.correcta, true); });
    stage.querySelectorAll<HTMLButtonElement>("[data-answer]").forEach((button) => button.addEventListener("click", () => choose(Number(button.dataset.answer))));
  };
  render();
}

function gameSimulador(stage: HTMLElement, cfg: Extract<GameConfig, { tipo: "simulador" }>, ctx: GameContext) {
  let index = 0;
  let busy = false;
  const render = () => {
    const scene = cfg.escenas[index];
    stage.innerHTML = `<div class="cg-immersive cg-simulator">
      <div class="cg-immersive__visual cg-simulator__visual">${worksiteSceneSvg(scene.escena)}<div class="cg-immersive__hud"><span>SIMULACIÓN ${String(index + 1).padStart(2, "0")}/${String(cfg.escenas.length).padStart(2, "0")}</span><b>RIESGO · ${esc(scene.riesgo)}</b></div></div>
      <div class="cg-immersive__panel"><span class="cg-kicker">Toma el mando</span><h3>${esc(scene.titulo)}</h3><p>${esc(scene.pregunta)}</p>
        <div class="cg-decision">${scene.opciones.map((option, i) => `<button type="button" data-answer="${i}"><b>${String.fromCharCode(65 + i)}</b><span>${esc(option)}</span></button>`).join("")}</div>
      </div></div>`;
    ctx.progress(index, cfg.escenas.length);
    const reveal = () => { stage.querySelector(`[data-answer="${scene.correcta}"]`)?.classList.add("is-hint"); ctx.feedback("La guía de seguridad ya señaló la maniobra correcta.", "info"); };
    const choose = (answer: number, assisted = false) => {
      if (busy) return;
      const button = stage.querySelector<HTMLButtonElement>(`[data-answer="${answer}"]`);
      if (!button) return;
      if (answer !== scene.correcta) {
        button.classList.add("is-wrong"); reveal();
        ctx.feedback("Alto preventivo. No pierdes el avance: revisa la maniobra marcada y continúa.", "error");
        return;
      }
      busy = true; button.classList.add("is-correct"); stage.querySelector(".site-scene")?.classList.add("is-safe");
      ctx.feedback(assisted ? `Resuelto con ayuda. ${scene.explicacion}` : scene.explicacion, "ok"); ctx.progress(index + 1, cfg.escenas.length);
      window.setTimeout(() => { index += 1; busy = false; if (index >= cfg.escenas.length) ctx.win("Simulación terminada: obra segura y decisión trazable."); else render(); }, 950);
    };
    ctx.help("Resolver esta maniobra", () => { reveal(); choose(scene.correcta, true); });
    stage.querySelectorAll<HTMLButtonElement>("[data-answer]").forEach((button) => button.addEventListener("click", () => choose(Number(button.dataset.answer))));
  };
  render();
}

// ─────────────────────────── Ventana del juego ───────────────────────────
const GAMES: { [K in GameType]: (stage: HTMLElement, cfg: Extract<GameConfig, { tipo: K }>, ctx: GameContext) => void } = {
  sopa: gameSopa,
  crucigrama: gameCrucigrama,
  rompecabezas: gameRompecabezas,
  plano: gamePlano,
  memorama: gameMemorama,
  ordenar: gameOrdenar,
  clasificar: gameClasificar,
  ahorcado: gameAhorcado,
  completar: gameCompletar,
  inspeccion: gameInspeccion,
  simulador: gameSimulador
};

let activeOverlay: HTMLElement | null = null;

function play(options: PlayOptions): Promise<boolean> {
  activeOverlay?.remove();
  const cfg = options.config || juegoDeClase(options.cursoTitulo, options.claseIndex);
  const info = GAME_INFO[cfg.tipo];
  const overlay = document.createElement("div");
  overlay.className = "cg-overlay";
  overlay.innerHTML = `<section class="cg-modal" role="dialog" aria-modal="true" aria-labelledby="cg-title">
    <header class="cg-head">
      <span class="cg-head__icon" aria-hidden="true">${info.icono}</span>
      <div class="cg-head__copy"><span class="cg-kicker">${esc(options.kicker || `Mini juego · Clase ${options.claseNumero}`)}</span><h2 id="cg-title">${info.nombre}</h2><p>${esc(options.claseTitulo)}</p></div>
      <span class="cg-head__status">${options.practica ? "Modo práctica" : "Reto de avance"}</span>
      <button type="button" class="cg-close" aria-label="Cerrar">×</button>
    </header>
    <div class="cg-body">
      <div class="cg-lead"><span>${esc(info.instruccion)} <small>Si te atoras, pulsa <b>Ayúdame</b> cuantas veces necesites: cada toque resuelve un paso y no hay penalización.</small></span><div class="cg-progress"><i data-bar></i></div><b data-count>0 / 0</b></div>
      <div class="cg-stage" data-stage></div>
      <p class="cg-feedback" data-feedback role="status" hidden></p>
    </div>
    <footer class="cg-foot">
      <span class="cg-foot__note"><i aria-hidden="true">✓</i><span>${options.nota !== undefined ? options.nota : options.practica ? "Modo práctica: esta clase ya está marcada como vista." : `Supera el reto para abrir la siguiente clase${options.creditos ? ` y recibir <b>+${options.creditos} créditos</b>` : ""}.`}</span></span>
      <span class="cg-foot__actions"><button type="button" class="cg-help" data-help hidden>Ayúdame</button><button type="button" class="cg-continue" data-continue disabled>${options.practica ? "Terminar" : "Abrir siguiente clase"} <span aria-hidden="true">→</span></button></span>
    </footer>
  </section>`;
  document.body.appendChild(overlay);
  activeOverlay = overlay;
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  const previousFocus = document.activeElement as HTMLElement | null;

  return new Promise<boolean>((resolve) => {
    let won = false;
    let settled = false;
    const feedbackEl = overlay.querySelector<HTMLElement>("[data-feedback]")!;
    const continueBtn = overlay.querySelector<HTMLButtonElement>("[data-continue]")!;
    const helpBtn = overlay.querySelector<HTMLButtonElement>("[data-help]")!;
    let helpAction: (() => void) | null = null;
    let feedbackTimer = 0;
    const close = (result: boolean) => {
      if (settled) return;
      settled = true;
      document.removeEventListener("keydown", onKey, true);
      overlay.classList.add("is-closing");
      document.body.style.overflow = previousOverflow;
      setTimeout(() => { overlay.remove(); if (activeOverlay === overlay) activeOverlay = null; previousFocus?.focus?.({ preventScroll: true }); }, 180);
      resolve(result);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); close(won); } };
    document.addEventListener("keydown", onKey, true);
    overlay.querySelector(".cg-close")!.addEventListener("click", () => close(won));
    continueBtn.addEventListener("click", () => close(won));

    const ctx: GameContext = {
      cover: options.portada || "",
      progress(done, total) {
        overlay.querySelector<HTMLElement>("[data-bar]")!.style.width = `${total ? Math.round(done / total * 100) : 0}%`;
        overlay.querySelector("[data-count]")!.textContent = `${done} / ${total}`;
      },
      feedback(message, tone = "info") {
        if (won && tone !== "ok") return;
        feedbackEl.hidden = false;
        feedbackEl.className = `cg-feedback cg-feedback--${tone}`;
        feedbackEl.textContent = message;
        clearTimeout(feedbackTimer);
        if (tone === "error") feedbackTimer = window.setTimeout(() => { feedbackEl.hidden = true; }, 3600);
      },
      help(label, action) {
        helpAction = action;
        helpBtn.hidden = false;
        helpBtn.textContent = `✦ ${label}`;
      },
      win(message) {
        if (won) return;
        won = true;
        try { localStorage.setItem(winKey(options.cursoId, options.claseNumero), new Date().toISOString()); } catch { /* sin almacenamiento */ }
        window.IMFRALearningSync?.schedule();
        overlay.querySelector(".cg-modal")!.classList.add("is-won");
        clearTimeout(feedbackTimer);
        const extra = feedbackEl.hidden || !feedbackEl.classList.contains("cg-feedback--ok") ? "" : ` ${feedbackEl.textContent}`;
        feedbackEl.hidden = false;
        feedbackEl.className = "cg-feedback cg-feedback--win";
        feedbackEl.textContent = `🏆 ${message || "¡Lo lograste!"}${extra}`;
        helpBtn.disabled = true;
        continueBtn.disabled = false;
        continueBtn.focus({ preventScroll: true });
        celebrate("big");
        // Cofre con monedas y créditos ganados, al momento de superar el reto.
        if (options.creditos && options.creditos > 0) {
          const amount = options.creditos;
          const balance = window.IMFRACredits?.getBalance?.();
          window.setTimeout(() => window.IMFRACoinChest?.show({ amount, total: typeof balance === "number" ? balance + amount : undefined, title: "¡Mini juego superado!" }), 700);
        }
        options.onWin?.();
      }
    };
    helpBtn.addEventListener("click", () => helpAction?.());
    const stage = overlay.querySelector<HTMLElement>("[data-stage]")!;
    (GAMES[cfg.tipo] as (stage: HTMLElement, cfg: GameConfig, ctx: GameContext) => void)(stage, cfg, ctx);
    requestAnimationFrame(() => overlay.classList.add("is-open"));
  });
}

window.IMFRAClassGames = {
  describe(cursoTitulo, claseIndex) {
    const cfg = juegoDeClase(cursoTitulo, claseIndex);
    return { tipo: cfg.tipo, ...GAME_INFO[cfg.tipo] };
  },
  play,
  hasWon
};
window.dispatchEvent(new CustomEvent("imfra:class-games-ready"));
