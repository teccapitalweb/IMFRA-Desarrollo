import "./admin-metrics.css";

// ═══════════════════════════════════════════════════════════════════
// Admin · Métricas de visitas (panel VIP y sitio público)
// ═══════════════════════════════════════════════════════════════════

interface Card { visitantes: number; panel: number; web: number; sesiones: number; minutos: number; promedioMin: number }
interface Metrics {
  ok: boolean;
  dias: number;
  generado: string;
  tarjetas: { hoy: Card; semana: Card; mes: Card };
  enLinea: number;
  porDia: { dia: string; panel: number; web: number; minutos: number }[];
  porHora: number[];
  secciones: { seccion: string; minutos: number; sesiones: number }[];
  usuarios: { uid: string; nombre: string; email: string; foto: string; vip: boolean; eliminado: boolean; sesiones: number; minutos: number; diasActivos: number; ultimaVisita: string }[];
}
interface MountOptions { getToken: () => Promise<string>; api: string }

declare global {
  interface Window {
    IMFRAMetricsAdmin: { mount(container: HTMLElement, options: MountOptions): void };
  }
}

const SECCIONES: Record<string, string> = {
  inicio: "Inicio", cursos: "Mis cursos", curso: "Detalle de curso", clase: "Clases (video y juego)", webinars: "Clases en vivo",
  pdfs: "Materiales y premios", libros: "Libros", libro: "Lector de libros", logros: "Mis logros", entrenamiento: "Retos",
  recompensas: "Recompensas", certificados: "Certificados", herramientas: "Herramientas", foro: "Foro VIP", directorio: "Directorio VIP",
  canal: "Canal WhatsApp", suscripcion: "Suscripción", perfil: "Perfil", plantillas: "Plantillas", presupuestos: "Presupuestos", referidos: "Referidos"
};
const seccionNombre = (s: string) => SECCIONES[s] || (s.startsWith("tool-") ? `Herramienta · ${s.slice(5)}` : s.charAt(0).toUpperCase() + s.slice(1));

const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
const num = (n: number) => Number(n || 0).toLocaleString("es-MX");
function duracion(min: number) {
  const m = Math.round(min || 0);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}
function promedio(min: number) {
  if (!min) return "0 min";
  return min < 1 ? `${Math.round(min * 60)} s` : `${String(min).replace(".", ",")} min`;
}
const fechaCorta = (dia: string) => new Date(`${dia}T12:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
function hace(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 2) return "En línea";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "Ayer" : `Hace ${d} días`;
}

function mount(container: HTMLElement, options: MountOptions) {
  let dias = 30;
  let orden: "tiempo" | "visitas" = "tiempo";
  let vistaTabla = false;
  let data: Metrics | null = null;

  const tooltip = document.createElement("div");
  tooltip.className = "mx-tip";
  tooltip.hidden = true;
  window.addEventListener("scroll", () => { tooltip.hidden = true; }, { capture: true, passive: true });

  async function cargar() {
    container.querySelector<HTMLElement>("[data-mx-body]")?.classList.add("is-loading");
    try {
      const token = await options.getToken();
      const res = await fetch(`${options.api}/admin/metricas?dias=${dias}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || "No se pudieron cargar las métricas");
      data = json as Metrics;
      pintar();
    } catch (error) {
      const body = container.querySelector<HTMLElement>("[data-mx-body]");
      if (body) body.innerHTML = `<div class="mx-empty"><strong>No pudimos cargar las métricas</strong><p>${esc((error as Error).message)}</p><button type="button" class="mx-btn" data-mx-retry>Reintentar</button></div>`;
      container.querySelector("[data-mx-retry]")?.addEventListener("click", () => void cargar());
    }
  }

  function tarjeta(titulo: string, c: Card) {
    return `<article class="mx-card"><span class="mx-card__label">${titulo}</span><strong class="mx-card__value">${num(c.visitantes)}</strong>
      <span class="mx-card__sub">visitantes · ${num(c.sesiones)} visitas</span>
      <div class="mx-card__split"><span><i class="mx-dot mx-dot--panel"></i>Panel ${num(c.panel)}</span><span><i class="mx-dot mx-dot--web"></i>Web ${num(c.web)}</span></div></article>`;
  }

  function graficaDiaria(d: Metrics) {
    const max = Math.max(1, ...d.porDia.map((x) => x.panel + x.web));
    const tope = Math.max(4, Math.ceil(max / 4) * 4);
    const cada = d.porDia.length > 31 ? 7 : d.porDia.length > 10 ? 5 : 1;
    const barras = d.porDia.map((x, i) => {
      const total = x.panel + x.web;
      return `<div class="mx-col" data-tip="${esc(fechaCorta(x.dia))}|${x.panel}|${x.web}|${x.minutos}" tabindex="0" aria-label="${esc(fechaCorta(x.dia))}: ${x.panel} en panel, ${x.web} en web">
        <div class="mx-col__stack" style="height:${(total / tope) * 100}%">
          ${x.web ? `<span class="mx-seg mx-seg--web" style="flex:${x.web}"></span>` : ""}
          ${x.panel ? `<span class="mx-seg mx-seg--panel" style="flex:${x.panel}"></span>` : ""}
        </div>
        <span class="mx-col__x">${i % cada === 0 || i === d.porDia.length - 1 ? esc(fechaCorta(x.dia)) : ""}</span>
      </div>`;
    }).join("");
    const lineas = [1, 0.75, 0.5, 0.25].map((f) => `<div class="mx-grid__line" style="bottom:${f * 100}%"><span>${num(Math.round(tope * f))}</span></div>`).join("");
    const tabla = `<table class="mx-table mx-table--compact"><thead><tr><th>Día</th><th>Panel VIP</th><th>Página web</th><th>Tiempo</th></tr></thead><tbody>${d.porDia.slice().reverse().map((x) => `<tr><td>${esc(fechaCorta(x.dia))}</td><td>${num(x.panel)}</td><td>${num(x.web)}</td><td>${duracion(x.minutos)}</td></tr>`).join("")}</tbody></table>`;
    return `<section class="mx-panel">
      <header class="mx-panel__head"><div><span class="mx-kicker">Visitantes por día</span><h3>Últimos ${d.dias} días</h3></div>
        <div class="mx-legend"><span><i class="mx-dot mx-dot--panel"></i>Panel VIP</span><span><i class="mx-dot mx-dot--web"></i>Página web</span>
        <button type="button" class="mx-link" data-mx-tabla>${vistaTabla ? "Ver gráfica" : "Ver tabla"}</button></div></header>
      ${vistaTabla ? `<div class="mx-table-wrap">${tabla}</div>` : `<div class="mx-chart"><div class="mx-grid">${lineas}</div><div class="mx-cols">${barras}</div></div>`}
    </section>`;
  }

  function horas(d: Metrics) {
    const max = Math.max(1, ...d.porHora);
    const pico = d.porHora.indexOf(Math.max(...d.porHora));
    return `<section class="mx-panel">
      <header class="mx-panel__head"><div><span class="mx-kicker">Horas pico (hora de México)</span><h3>${Math.max(...d.porHora) ? `Más visitas a las ${pico}:00` : "Sin datos todavía"}</h3></div></header>
      <div class="mx-hours">${d.porHora.map((n, h) => `<div class="mx-hour" data-tip="${h}:00|${n}" tabindex="0" aria-label="${h}:00, ${n} visitas"><span style="height:${(n / max) * 100}%"></span><small>${h % 6 === 0 ? `${h}h` : ""}</small></div>`).join("")}</div>
    </section>`;
  }

  function secciones(d: Metrics) {
    const max = Math.max(1, ...d.secciones.map((s) => s.minutos));
    return `<section class="mx-panel">
      <header class="mx-panel__head"><div><span class="mx-kicker">Panel VIP</span><h3>Secciones más vistas</h3></div></header>
      ${d.secciones.length ? `<ol class="mx-rank">${d.secciones.map((s) => `<li><div class="mx-rank__top"><span>${esc(seccionNombre(s.seccion))}</span><b>${duracion(s.minutos)}</b></div><div class="mx-rank__bar"><i style="width:${Math.max(2, (s.minutos / max) * 100)}%"></i></div><small>${num(s.sesiones)} visitas</small></li>`).join("")}</ol>` : `<p class="mx-muted">Aún no hay visitas al panel en este periodo.</p>`}
    </section>`;
  }

  function usuarios(d: Metrics) {
    const lista = d.usuarios.slice().sort((a, b) => orden === "visitas" ? b.sesiones - a.sesiones || b.minutos - a.minutos : b.minutos - a.minutos || b.sesiones - a.sesiones);
    const fila = (u: Metrics["usuarios"][number], i: number) => {
      const nombre = u.nombre || u.email || (u.eliminado ? "Cuenta eliminada" : "Miembro sin nombre");
      const inicial = esc(nombre.trim().slice(0, 2).toUpperCase());
      const foto = /^https:\/\/[^\s"'<>]+$/i.test(u.foto) ? `<img src="${esc(u.foto)}" alt="" referrerpolicy="no-referrer" loading="lazy">` : `<span>${inicial}</span>`;
      return `<tr>
        <td class="mx-num">${i + 1}</td>
        <td><div class="mx-user"><span class="mx-avatar">${foto}</span><div><strong>${esc(nombre)}</strong>${u.email && u.nombre ? `<small>${esc(u.email)}</small>` : ""}</div></div></td>
        <td>${u.vip ? '<span class="mx-badge mx-badge--vip">★ VIP</span>' : u.eliminado ? '<span class="mx-badge">Eliminada</span>' : '<span class="mx-badge">Gratis</span>'}</td>
        <td class="mx-num">${num(u.sesiones)}</td>
        <td class="mx-num">${num(u.diasActivos)}</td>
        <td class="mx-num"><b>${duracion(u.minutos)}</b></td>
        <td class="mx-when">${esc(hace(u.ultimaVisita))}</td>
      </tr>`;
    };
    return `<section class="mx-panel">
      <header class="mx-panel__head"><div><span class="mx-kicker">Panel VIP · últimos ${d.dias} días</span><h3>Quiénes entran más</h3></div>
        <div class="mx-seg-ctrl" role="group" aria-label="Ordenar"><button type="button" data-mx-orden="tiempo" class="${orden === "tiempo" ? "is-active" : ""}">Por tiempo</button><button type="button" data-mx-orden="visitas" class="${orden === "visitas" ? "is-active" : ""}">Por visitas</button></div></header>
      ${lista.length ? `<div class="mx-table-wrap"><table class="mx-table"><thead><tr><th>#</th><th>Miembro</th><th>Plan</th><th>Visitas</th><th>Días activos</th><th>Tiempo total</th><th>Última visita</th></tr></thead><tbody>${lista.map(fila).join("")}</tbody></table></div>` : `<p class="mx-muted">Aún no hay miembros con visitas en este periodo.</p>`}
    </section>`;
  }

  function pintar() {
    const body = container.querySelector<HTMLElement>("[data-mx-body]");
    if (!body || !data) return;
    body.classList.remove("is-loading");
    tooltip.hidden = true;
    const d = data;
    const vacio = !d.tarjetas.mes.sesiones;
    body.innerHTML = `
      ${vacio ? `<div class="mx-note"><strong>Las métricas empiezan a registrarse desde hoy.</strong> Cada visita al panel y al sitio aparecerá aquí en cuanto ocurra.</div>` : ""}
      <div class="mx-cards">
        ${tarjeta("Hoy", d.tarjetas.hoy)}
        ${tarjeta("Últimos 7 días", d.tarjetas.semana)}
        ${tarjeta("Últimos 30 días", d.tarjetas.mes)}
        <article class="mx-card"><span class="mx-card__label">Tiempo por visita</span><strong class="mx-card__value">${promedio(d.tarjetas.mes.promedioMin)}</strong>
          <span class="mx-card__sub">promedio · 30 días</span><div class="mx-card__split"><span>Total ${duracion(d.tarjetas.mes.minutos)}</span></div></article>
      </div>
      ${graficaDiaria(d)}
      <div class="mx-two">${horas(d)}${secciones(d)}</div>
      ${usuarios(d)}
      <p class="mx-foot">Actualizado ${new Date(d.generado).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })} · No se cuentan las visitas de administradores ni de buscadores.</p>`;
    container.querySelector("[data-mx-live]")!.textContent = `${num(d.enLinea)} en línea ahora`;
    body.querySelector("[data-mx-tabla]")?.addEventListener("click", () => { vistaTabla = !vistaTabla; pintar(); });
    body.querySelectorAll<HTMLButtonElement>("[data-mx-orden]").forEach((b) => b.addEventListener("click", () => { orden = b.dataset.mxOrden as typeof orden; pintar(); }));
    enlazarTooltips(body);
  }

  function enlazarTooltips(scope: HTMLElement) {
    const mostrar = (el: HTMLElement) => {
      const p = (el.dataset.tip || "").split("|");
      tooltip.innerHTML = p.length === 4
        ? `<b>${esc(p[0])}</b><span><i class="mx-dot mx-dot--panel"></i>Panel VIP <strong>${num(+p[1])}</strong></span><span><i class="mx-dot mx-dot--web"></i>Página web <strong>${num(+p[2])}</strong></span><span>Tiempo <strong>${duracion(+p[3])}</strong></span>`
        : `<b>${esc(p[0])}</b><span>Visitas <strong>${num(+p[1])}</strong></span>`;
      tooltip.hidden = false;
      const r = el.getBoundingClientRect();
      const w = tooltip.offsetWidth;
      tooltip.style.left = `${Math.min(window.innerWidth - w - 8, Math.max(8, r.left + r.width / 2 - w / 2))}px`;
      tooltip.style.top = `${Math.max(8, r.top - tooltip.offsetHeight - 8)}px`;
    };
    scope.querySelectorAll<HTMLElement>("[data-tip]").forEach((el) => {
      el.addEventListener("mouseenter", () => mostrar(el));
      el.addEventListener("focus", () => mostrar(el));
      el.addEventListener("mouseleave", () => { tooltip.hidden = true; });
      el.addEventListener("blur", () => { tooltip.hidden = true; });
    });
  }

  container.innerHTML = `<div class="mx-page fade-up">
    <div class="sec-hero"><span class="sec-hero__eyebrow">Visitas</span><h1 class="sec-hero__title">Métricas</h1><p class="sec-hero__sub">Cuántas personas entran al panel VIP y a la página web, cuánto tiempo se quedan y quiénes entran más.</p></div>
    <div class="mx-toolbar">
      <div class="mx-seg-ctrl" role="group" aria-label="Periodo">${[7, 30, 90].map((n) => `<button type="button" data-mx-dias="${n}" class="${n === dias ? "is-active" : ""}">${n} días</button>`).join("")}</div>
      <span class="mx-live"><i></i><span data-mx-live>— en línea ahora</span></span>
      <button type="button" class="mx-btn" data-mx-refresh>Actualizar</button>
    </div>
    <div data-mx-body class="is-loading"><div class="mx-empty"><span class="mx-spin"></span>Cargando métricas…</div></div>
  </div>`;
  container.appendChild(tooltip);
  container.querySelectorAll<HTMLButtonElement>("[data-mx-dias]").forEach((b) => b.addEventListener("click", () => {
    dias = Number(b.dataset.mxDias);
    container.querySelectorAll("[data-mx-dias]").forEach((x) => x.classList.toggle("is-active", x === b));
    void cargar();
  }));
  container.querySelector("[data-mx-refresh]")?.addEventListener("click", () => void cargar());
  void cargar();
}

window.IMFRAMetricsAdmin = { mount };
window.dispatchEvent(new CustomEvent("imfra:metrics-admin-ready"));
