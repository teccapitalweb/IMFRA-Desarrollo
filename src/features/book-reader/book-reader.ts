import "./book-reader.css";
import {
  GlobalWorkerOptions,
  getDocument,
  type PDFDocumentProxy,
  type RenderTask
} from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerUrl;

interface BookReaderOptions {
  id: string;
  title: string;
  url: string;
  downloadUrl: string;
  pages?: number;
}

interface MountedReader {
  destroy(): void;
}

declare global {
  interface Window {
    IMFRABookReader: {
      mount(container: HTMLElement, options: BookReaderOptions): MountedReader;
    };
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character] || character);
}

function accountId() {
  return window.UserState?.uid || window.UserState?.email || "guest";
}

function pageKey(id: string) {
  return `imfra:v2:book-page:${accountId()}:${id}`;
}

function readSavedPage(id: string) {
  const page = Number(localStorage.getItem(pageKey(id)) || 1);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function icon(path: string) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

function mount(container: HTMLElement, options: BookReaderOptions): MountedReader {
  const safeTitle = escapeHtml(options.title || "Libro IMFRA");
  const safeDownloadUrl = escapeHtml(options.downloadUrl || options.url);
  let documentProxy: PDFDocumentProxy | null = null;
  let renderTask: RenderTask | null = null;
  let currentPage = Math.max(1, readSavedPage(options.id));
  let totalPages = Math.max(0, Number(options.pages) || 0);
  let zoom = 1;
  let resizeTimer = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let destroyed = false;
  const isGoogleDrive = /(^|\.)googleusercontent\.com$|(^|\.)google\.com$/i.test(new URL(options.url, location.href).hostname);

  container.innerHTML = `<div class="imfra-pdf-reader" tabindex="0" aria-label="Lector de ${safeTitle}">
    <div class="imfra-pdf-reader__viewport" data-pdf-viewport>
      <button class="imfra-pdf-reader__edge imfra-pdf-reader__edge--prev" type="button" data-pdf-prev aria-label="Página anterior">${icon('<polyline points="15 18 9 12 15 6"/>')}</button>
      <div class="imfra-pdf-reader__paper" data-pdf-paper>
        <canvas data-pdf-canvas aria-label="Página del libro"></canvas>
      </div>
      <button class="imfra-pdf-reader__edge imfra-pdf-reader__edge--next" type="button" data-pdf-next aria-label="Página siguiente">${icon('<polyline points="9 18 15 12 9 6"/>')}</button>
      <div class="imfra-pdf-reader__status" data-pdf-status><span class="imfra-pdf-reader__spinner"></span><strong>Preparando el libro</strong><small>Esto puede tardar unos segundos la primera vez.</small></div>
    </div>
    <div class="imfra-pdf-reader__toolbar" aria-label="Controles del lector">
      <button type="button" data-pdf-prev aria-label="Página anterior">${icon('<polyline points="15 18 9 12 15 6"/>')}</button>
      <label class="imfra-pdf-reader__page"><span class="sr-only">Página actual</span><input data-pdf-page type="number" min="1" value="${currentPage}" inputmode="numeric"><span>de <b data-pdf-total>${totalPages || "—"}</b></span></label>
      <button type="button" data-pdf-next aria-label="Página siguiente">${icon('<polyline points="9 18 15 12 9 6"/>')}</button>
      <span class="imfra-pdf-reader__divider"></span>
      <button type="button" data-pdf-zoom-out aria-label="Alejar">${icon('<line x1="5" y1="12" x2="19" y2="12"/>')}</button>
      <output data-pdf-zoom>100%</output>
      <button type="button" data-pdf-zoom-in aria-label="Acercar">${icon('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>')}</button>
      <button class="imfra-pdf-reader__fit" type="button" data-pdf-fit>Ajustar</button>
      <span class="imfra-pdf-reader__hint">Usa ← → para avanzar</span>
    </div>
    <button class="imfra-pdf-reader__progress" type="button" data-pdf-progress aria-label="Progreso del libro"><i></i></button>
    <div class="imfra-pdf-reader__error" data-pdf-error hidden>
      <strong>${isGoogleDrive ? "Este título aún necesita migrarse al lector de IMFRA." : "No pudimos cargar este libro dentro del lector."}</strong>
      <span>${isGoogleDrive ? "Mientras se completa la migración desde Drive, puedes abrir el archivo original." : "Comprueba tu conexión o abre el archivo original."}</span>
      <a href="${safeDownloadUrl}" target="_blank" rel="noopener">Abrir archivo original</a>
    </div>
  </div>`;

  const canvas = container.querySelector<HTMLCanvasElement>("[data-pdf-canvas]")!;
  const paper = container.querySelector<HTMLElement>("[data-pdf-paper]")!;
  const viewport = container.querySelector<HTMLElement>("[data-pdf-viewport]")!;
  const status = container.querySelector<HTMLElement>("[data-pdf-status]")!;
  const error = container.querySelector<HTMLElement>("[data-pdf-error]")!;
  const pageInput = container.querySelector<HTMLInputElement>("[data-pdf-page]")!;
  const totalOutput = container.querySelector<HTMLElement>("[data-pdf-total]")!;
  const zoomOutput = container.querySelector<HTMLOutputElement>("[data-pdf-zoom]")!;
  const progress = container.querySelector<HTMLElement>("[data-pdf-progress] i")!;

  function updateControls() {
    pageInput.value = String(currentPage);
    pageInput.max = String(totalPages || 1);
    totalOutput.textContent = totalPages ? String(totalPages) : "—";
    zoomOutput.textContent = `${Math.round(zoom * 100)}%`;
    progress.style.width = totalPages ? `${Math.max(0, Math.min(100, currentPage / totalPages * 100))}%` : "0%";
    container.querySelectorAll<HTMLButtonElement>("[data-pdf-prev]").forEach((button) => { button.disabled = currentPage <= 1; });
    container.querySelectorAll<HTMLButtonElement>("[data-pdf-next]").forEach((button) => { button.disabled = !totalPages || currentPage >= totalPages; });
  }

  async function renderPage() {
    if (!documentProxy || destroyed) return;
    renderTask?.cancel();
    status.hidden = false;
    status.classList.remove("is-error");
    try {
      const page = await documentProxy.getPage(currentPage);
      if (destroyed) return;
      const base = page.getViewport({ scale: 1 });
      const availableWidth = Math.max(260, viewport.clientWidth - (window.innerWidth < 600 ? 24 : 94));
      const availableHeight = Math.max(300, viewport.clientHeight - 34);
      const fitScale = Math.min(availableWidth / base.width, availableHeight / base.height);
      const cssScale = Math.max(.25, fitScale * zoom);
      const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
      const renderViewport = page.getViewport({ scale: cssScale * pixelRatio });
      canvas.width = Math.floor(renderViewport.width);
      canvas.height = Math.floor(renderViewport.height);
      canvas.style.width = `${Math.floor(renderViewport.width / pixelRatio)}px`;
      canvas.style.height = `${Math.floor(renderViewport.height / pixelRatio)}px`;
      paper.style.width = canvas.style.width;
      paper.style.height = canvas.style.height;
      renderTask = page.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport: renderViewport });
      await renderTask.promise;
      status.hidden = true;
      error.hidden = true;
      localStorage.setItem(pageKey(options.id), String(currentPage));
      updateControls();
      container.closest(".book-reader")?.classList.add("is-ready");
    } catch (reason) {
      if (reason instanceof Error && reason.name === "RenderingCancelledException") return;
      console.error("[book-reader] No se pudo renderizar la página", reason);
      status.hidden = true;
      error.hidden = false;
    }
  }

  function goTo(page: number) {
    if (!documentProxy || !totalPages) return;
    const nextPage = Math.max(1, Math.min(totalPages, Math.floor(page) || 1));
    if (nextPage === currentPage && !status.hidden) return;
    currentPage = nextPage;
    updateControls();
    void renderPage();
  }

  function setZoom(value: number) {
    zoom = Math.max(.7, Math.min(2.6, Math.round(value * 10) / 10));
    updateControls();
    void renderPage();
  }

  const abort = new AbortController();
  const listenerOptions = { signal: abort.signal };
  container.querySelectorAll("[data-pdf-prev]").forEach((button) => button.addEventListener("click", () => goTo(currentPage - 1), listenerOptions));
  container.querySelectorAll("[data-pdf-next]").forEach((button) => button.addEventListener("click", () => goTo(currentPage + 1), listenerOptions));
  container.querySelector("[data-pdf-zoom-out]")?.addEventListener("click", () => setZoom(zoom - .2), listenerOptions);
  container.querySelector("[data-pdf-zoom-in]")?.addEventListener("click", () => setZoom(zoom + .2), listenerOptions);
  container.querySelector("[data-pdf-fit]")?.addEventListener("click", () => setZoom(1), listenerOptions);
  pageInput.addEventListener("change", () => goTo(Number(pageInput.value)), listenerOptions);
  pageInput.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); goTo(Number(pageInput.value)); pageInput.blur(); } }, listenerOptions);
  container.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLInputElement) return;
    if (event.key === "ArrowLeft") { event.preventDefault(); goTo(currentPage - 1); }
    if (event.key === "ArrowRight") { event.preventDefault(); goTo(currentPage + 1); }
    if (event.key === "Home") { event.preventDefault(); goTo(1); }
    if (event.key === "End") { event.preventDefault(); goTo(totalPages); }
    if (event.key === "+" || event.key === "=") { event.preventDefault(); setZoom(zoom + .2); }
    if (event.key === "-") { event.preventDefault(); setZoom(zoom - .2); }
  }, listenerOptions);
  viewport.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1) return;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }, { signal: abort.signal, passive: true });
  viewport.addEventListener("touchend", (event) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) goTo(currentPage + (deltaX < 0 ? 1 : -1));
  }, { signal: abort.signal, passive: true });
  const resizeObserver = new ResizeObserver(() => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => { if (documentProxy) void renderPage(); }, 180);
  });
  resizeObserver.observe(viewport);

  updateControls();
  // Google Drive no acepta la preflight que PDF.js genera al pedir rangos desde
  // otro origen. La descarga simple sí expone CORS, así que se carga el archivo
  // completo. Cuando los libros migren a Bunny podremos reactivar los rangos.
  const loadingTask = getDocument(isGoogleDrive ? {
    url: options.url,
    disableRange: true,
    disableStream: true,
    disableAutoFetch: true
  } : {
    url: options.url,
    rangeChunkSize: 262144
  });
  void loadingTask.promise.then((pdf) => {
    if (destroyed) { void pdf.cleanup(); return; }
    documentProxy = pdf;
    totalPages = pdf.numPages;
    currentPage = Math.min(currentPage, totalPages);
    updateControls();
    void renderPage();
  }).catch((reason) => {
    const detail = reason instanceof Error
      ? `${reason.name}: ${reason.message} ${JSON.stringify(Object.fromEntries(Object.entries(reason)))}`
      : String(reason);
    console.error(`[book-reader] No se pudo abrir el PDF · ${detail}`);
    status.hidden = true;
    error.hidden = false;
  });

  return {
    destroy() {
      destroyed = true;
      abort.abort();
      resizeObserver.disconnect();
      window.clearTimeout(resizeTimer);
      renderTask?.cancel();
      void loadingTask.destroy();
      void documentProxy?.cleanup();
    }
  };
}

window.IMFRABookReader = { mount };
window.dispatchEvent(new CustomEvent("imfra:book-reader-ready"));
