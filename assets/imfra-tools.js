/* ═══════════════════════════════════════════════════════════════════
   IMFRA · Herramientas Pro · v1
   Se carga después del panel (vip-panel.html) y usa sus globales:
   Toast, toolRequiereVIP, navigateToSection, jsPDF (CDN).
   Cada herramienta expone { mount(container) } en window.IMFRATools.
   ═══════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ─────────────────────────────── NÚCLEO ─────────────────────────────── */
const HT = {};
window.HT = HT;

HT.MARCA = 'IMFRA Desarrollo';
HT.SITIO = 'imfradesarrollo.com';
HT.PRIMARY = [245,157,26];
HT.DARK = [13,13,13];
HT.GRAY = [110,110,110];

/* Números */
HT.num = v => { const n = parseFloat(String(v ?? '').replace(/,/g,'.')); return Number.isFinite(n) ? n : 0; };
HT.fmt = (n, d=2) => (Number.isFinite(n) ? n : 0).toLocaleString('es-MX',{minimumFractionDigits:d, maximumFractionDigits:d});
HT.fmt0 = n => HT.fmt(n,0);
HT.money = n => '$' + HT.fmt(n,2);
HT.pct = (n,d=1) => HT.fmt(n,d) + '%';
HT.ceil = n => Math.ceil(n - 1e-9);
HT.clamp = (n,a,b) => Math.min(b, Math.max(a, n));

/* Texto */
HT.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
HT.today = () => new Date().toISOString().slice(0,10);
HT.fechaLarga = iso => {
  if (!iso) return '—';
  const d = new Date(iso + (iso.length===10 ? 'T12:00:00' : ''));
  return isNaN(d) ? iso : d.toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'});
};
HT.fechaCorta = iso => {
  if (!iso) return '—';
  const d = new Date(iso + (iso.length===10 ? 'T12:00:00' : ''));
  return isNaN(d) ? iso : d.toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'});
};
HT.folio = pref => 'IMFRA-' + pref + '-' + Math.floor(10000 + Math.random()*89999);
HT.uid = () => Math.random().toString(36).slice(2,9);

/* Persistencia */
HT.store = key => ({
  get(def){ try { const v = localStorage.getItem('imfra:tool:'+key); return v ? JSON.parse(v) : def; } catch(e){ return def; } },
  set(val){ try { localStorage.setItem('imfra:tool:'+key, JSON.stringify(val)); } catch(e){} },
  del(){ try { localStorage.removeItem('imfra:tool:'+key); } catch(e){} }
});

/* Toast / VIP / navegación (con fallback si el panel no expone la global) */
HT.toast = (type, t, m) => {
  let T = null;
  try { T = (typeof Toast !== 'undefined') ? Toast : window.Toast; } catch(e){ T = window.Toast; }
  if (T && typeof T[type]==='function') T[type](t, m||''); else console.log('[HT]', type, t, m||'');
};
HT.vip = nombre => (typeof window.toolRequiereVIP === 'function') ? window.toolRequiereVIP(nombre) : true;
HT.esVIP = () => (typeof window.toolEsVIP === 'function') ? window.toolEsVIP() : true;

/* Confirmación propia (modal ligero) */
HT.confirm = (titulo, desc, okTxt='Confirmar') => new Promise(res => {
  const m = document.createElement('div');
  m.className = 'ht-modal';
  m.innerHTML = `<div class="ht-modal__box" role="dialog" aria-modal="true">
    <h3 class="ht-modal__title">${HT.esc(titulo)}</h3>
    <p class="ht-modal__desc">${HT.esc(desc)}</p>
    <div class="ht-modal__acts">
      <button class="btn btn--ghost" data-no>Cancelar</button>
      <button class="btn btn--accent" data-ok>${HT.esc(okTxt)}</button>
    </div></div>`;
  const close = v => { m.remove(); res(v); };
  m.querySelector('[data-no]').addEventListener('click', () => close(false));
  m.querySelector('[data-ok]').addEventListener('click', () => close(true));
  m.addEventListener('click', e => { if (e.target === m) close(false); });
  document.body.appendChild(m);
  setTimeout(() => m.querySelector('[data-ok]').focus(), 30);
});

/* Íconos extra (se inyectan una sola vez en el sprite del panel) */
HT.icons = () => {
  if (document.getElementById('ht-icons')) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.id = 'ht-icons'; svg.setAttribute('style','display:none');
  const A = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  svg.innerHTML = `
  <symbol id="i-cube" ${A}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7L12 12l8.7-5"/><path d="M12 22V12"/></symbol>
  <symbol id="i-rebar" ${A}><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/><path d="M8 3v18"/><path d="M16 3v18"/></symbol>
  <symbol id="i-wall" ${A}><rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18"/><path d="M3 14h18"/><path d="M9 4v5"/><path d="M15 9v5"/><path d="M9 14v6"/></symbol>
  <symbol id="i-percent" ${A}><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></symbol>
  <symbol id="i-trend" ${A}><path d="M3 17l5-5 4 4 8-8"/><path d="M14 8h6v6"/></symbol>
  <symbol id="i-notebook" ${A}><path d="M4 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4z"/><path d="M4 9h3M4 14h3M4 19h3"/><path d="M11 8h5M11 12h5"/></symbol>
  <symbol id="i-ruler" ${A}><path d="M3 17.3L17.3 3l3.7 3.7L6.7 21z"/><path d="M14 6.3l1.5 1.5M11 9.3l1.5 1.5M8 12.3l1.5 1.5M5 15.3l1.5 1.5"/></symbol>
  <symbol id="i-plus" ${A}><path d="M12 5v14M5 12h14"/></symbol>
  <symbol id="i-refresh" ${A}><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></symbol>
  <symbol id="i-chevron" ${A}><path d="M6 9l6 6 6-6"/></symbol>
  <symbol id="i-sliders" ${A}><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></symbol>
  <symbol id="i-cloud" ${A}><path d="M17.5 19a4.5 4.5 0 0 0 .4-9A7 7 0 0 0 4.3 12.5 3.5 3.5 0 0 0 6 19z"/></symbol>
  <symbol id="i-hardhat" ${A}><path d="M2 18h20"/><path d="M4 18v-3a8 8 0 0 1 16 0v3"/><path d="M10 7V4h4v3"/></symbol>
  <symbol id="i-save" ${A}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></symbol>`;
  document.body.appendChild(svg);
};

/* ── Builders de UI (devuelven HTML) ── */
HT.ui = {
  input(o){
    const {id, label, value='', type='text', unit, placeholder='', step, min, max, hint, full, inputmode, attrs=''} = o;
    const isNum = type === 'number';
    const inp = `<input class="ht-input" id="${id}" type="${type}" value="${HT.esc(value)}" placeholder="${HT.esc(placeholder)}"
      ${step!=null?`step="${step}"`:''} ${min!=null?`min="${min}"`:''} ${max!=null?`max="${max}"`:''}
      ${inputmode?`inputmode="${inputmode}"`:(isNum?'inputmode="decimal"':'')} ${attrs}>`;
    return `<div class="ht-field ${full?'ht-field--full':''}">
      ${label?`<label class="ht-label" for="${id}">${label}</label>`:''}
      ${unit?`<div class="ht-inwrap">${inp}<span class="ht-unit">${unit}</span></div>`:inp}
      ${hint?`<div class="ht-hint">${hint}</div>`:''}
    </div>`;
  },
  select(o){
    const {id, label, options, value, hint, full} = o;
    return `<div class="ht-field ${full?'ht-field--full':''}">
      ${label?`<label class="ht-label" for="${id}">${label}</label>`:''}
      <select class="ht-select" id="${id}">${options.map(op => {
        const v = typeof op==='string'?op:op.v, t = typeof op==='string'?op:op.t;
        return `<option value="${HT.esc(v)}" ${String(v)===String(value)?'selected':''}>${HT.esc(t)}</option>`;
      }).join('')}</select>
      ${hint?`<div class="ht-hint">${hint}</div>`:''}
    </div>`;
  },
  textarea(o){
    const {id, label, value='', placeholder='', rows=3, hint, full=true} = o;
    return `<div class="ht-field ${full?'ht-field--full':''}">
      ${label?`<label class="ht-label" for="${id}">${label}</label>`:''}
      <textarea class="ht-textarea" id="${id}" rows="${rows}" placeholder="${HT.esc(placeholder)}">${HT.esc(value)}</textarea>
      ${hint?`<div class="ht-hint">${hint}</div>`:''}
    </div>`;
  },
  toggle(o){
    const {id, label, checked} = o;
    return `<label class="ht-toggle"><input type="checkbox" id="${id}" ${checked?'checked':''}><span class="ht-toggle__sw"></span><span class="ht-toggle__lbl">${label}</span></label>`;
  },
  seg(o){
    const {id, options, value, pill} = o;
    return `<div class="ht-seg ${pill?'ht-seg--pill':''}" id="${id}">${options.map(op =>
      `<div class="ht-seg__btn ${String(op.v)===String(value)?'is-active':''}" data-v="${HT.esc(op.v)}">${op.t}</div>`).join('')}</div>`;
  },
  kpi(o){
    const {lbl, val, unit, sub, cls=''} = o;
    return `<div class="ht-kpi ${cls}"><div class="ht-kpi__lbl">${lbl}</div><div class="ht-kpi__val">${val}${unit?`<small>${unit}</small>`:''}</div><div class="ht-kpi__sub">${sub||''}</div></div>`;
  },
  table(o){
    const {head, rows, numCols=[], totalRow, subRows=[]} = o;
    const th = head.map((h,i) => `<th class="${numCols.includes(i)?'num':''}">${h}</th>`).join('');
    const tr = rows.map((r,ri) => `<tr class="${subRows.includes(ri)?'is-sub':''}">${r.map((c,i) => `<td class="${numCols.includes(i)?'num':''}">${c}</td>`).join('')}</tr>`).join('');
    const tt = totalRow ? `<tr class="is-total">${totalRow.map((c,i) => `<td class="${numCols.includes(i)?'num':''}">${c}</td>`).join('')}</tr>` : '';
    return `<div class="ht-tablewrap"><table class="ht-table"><thead><tr>${th}</tr></thead><tbody>${tr}${tt}</tbody></table></div>`;
  },
  assump(o){
    const {id, title='Supuestos y factores', note, body, open=false} = o;
    return `<div class="ht-assump ${open?'is-open':''}" id="${id}">
      <div class="ht-assump__head" data-toggle>
        <div class="ht-assump__title"><svg class="ic"><use href="#i-sliders"/></svg>${title}</div>
        <svg class="ht-assump__chev"><use href="#i-chevron"/></svg>
      </div>
      <div class="ht-assump__body">${note?`<p class="ht-assump__note">${note}</p>`:''}${body}</div>
    </div>`;
  },
  note(txt, warn){ return `<div class="ht-note ${warn?'ht-note--warn':''}"><svg class="ic"><use href="#i-info"/></svg><div>${txt}</div></div>`; },
  empty(o){ const {icon='i-tools', title, desc} = o; return `<div class="ht-empty"><div class="ht-empty__ic"><svg class="ic"><use href="#${icon}"/></svg></div><h3>${title}</h3>${desc?`<p>${desc}</p>`:''}</div>`; },
  del(){ return `<button class="ht-row__del" data-del type="button" aria-label="Quitar"><svg class="ic"><use href="#i-trash"/></svg></button>`; },
  add(txt){ return `<button class="ht-add" type="button" data-add><svg class="ic"><use href="#i-plus"/></svg>${txt}</button>`; }
};

/* Binds comunes */
HT.bindAssump = root => root.querySelectorAll('.ht-assump [data-toggle]').forEach(h => h.addEventListener('click', () => h.closest('.ht-assump').classList.toggle('is-open')));
HT.bindSeg = (root, id, cb) => {
  const seg = root.querySelector('#'+id); if (!seg) return;
  seg.querySelectorAll('.ht-seg__btn').forEach(b => b.addEventListener('click', () => {
    seg.querySelectorAll('.ht-seg__btn').forEach(x => x.classList.remove('is-active'));
    b.classList.add('is-active'); cb(b.dataset.v);
  }));
};
HT.val = (root, id) => { const el = root.querySelector('#'+id); return el ? el.value : ''; };
HT.numv = (root, id) => HT.num(HT.val(root, id));
HT.debounce = (fn, ms=180) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

/* Cabecera estándar de la herramienta */
HT.shell = (container, o) => {
  const {icon, titulo, sub, acciones=[]} = o;
  container.innerHTML = `
    <div class="tool-section">
      <div class="tool-section__head">
        <div class="tool-section__title">
          <div class="tool-section__icon"><svg class="ic"><use href="#${icon}"/></svg></div>
          <div><h1>${titulo}</h1><p>${sub}</p></div>
        </div>
        <div class="tool-section__actions">${acciones.map(a =>
          `<button class="btn ${a.cls||'btn--ghost'} btn--sm" id="${a.id}">${a.txt}${a.icon?`<svg class="ic"><use href="#${a.icon}"/></svg>`:''}</button>`).join('')}</div>
      </div>
      <div class="ht" id="ht-root"></div>
    </div>`;
  return container.querySelector('#ht-root');
};

/* ── PDF ── */
HT._logo = null;
HT.cargarLogo = () => {
  if (HT._logo !== null) return Promise.resolve(HT._logo);
  return new Promise(res => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
          cv.getContext('2d').drawImage(img,0,0);
          HT._logo = { data: cv.toDataURL('image/png'), w: img.width, h: img.height };
        } catch(e){ HT._logo = false; }
        res(HT._logo);
      };
      img.onerror = () => { HT._logo = false; res(false); };
      img.src = 'logo-imfra.png?v=1';
    } catch(e){ HT._logo = false; res(false); }
  });
};

HT.pdf = {
  async nuevo(o){
    if (!window.jspdf || !window.jspdf.jsPDF) { HT.toast('error','Generador no disponible','Verifica tu conexión e intenta de nuevo.'); return null; }
    const {jsPDF} = window.jspdf;
    const pdf = new jsPDF({orientation:o.landscape?'landscape':'portrait', unit:'mm', format:'a4'});
    /* La fuente estándar (Helvetica WinAnsi) no dibuja ² ³ − ≈ → se sustituyen en todo texto */
    const san = s => String(s ?? '').replace(/³/g,'3').replace(/²/g,'2').replace(/−/g,'-').replace(/≈/g,'~').replace(/·/g,'\u00B7');
    const _text = pdf.text.bind(pdf); pdf.text = (t, ...a) => _text(Array.isArray(t)?t.map(san):san(t), ...a);
    const _split = pdf.splitTextToSize.bind(pdf); pdf.splitTextToSize = (t, ...a) => _split(san(t), ...a);
    const W = pdf.internal.pageSize.getWidth(), H = pdf.internal.pageSize.getHeight(), M = 14;
    const ctx = { pdf, W, H, M, y: M, folio:o.folio, titulo:o.titulo };
    const logo = await HT.cargarLogo();
    HT.pdf.header(ctx, o, logo);
    return ctx;
  },
  header(ctx, o, logo){
    const {pdf, W, M} = ctx;
    pdf.setFillColor(...HT.PRIMARY); pdf.rect(0,0,W,5,'F');
    pdf.setFillColor(...HT.DARK); pdf.rect(0,5,W,2.5,'F');
    let y = 16;
    if (logo && logo.data) {
      const h = 11, w = h * (logo.w/logo.h);
      try { pdf.addImage(logo.data,'PNG', M, y-4, Math.min(w,42), h); } catch(e){}
    }
    pdf.setFont(undefined,'bold'); pdf.setFontSize(9); pdf.setTextColor(...HT.DARK);
    pdf.text(HT.MARCA, W-M, y, {align:'right'});
    pdf.setFont(undefined,'normal'); pdf.setFontSize(7.5); pdf.setTextColor(...HT.GRAY);
    pdf.text('Herramientas Pro · Club VIP', W-M, y+4, {align:'right'});
    y += 16;
    pdf.setFont(undefined,'bold'); pdf.setFontSize(15); pdf.setTextColor(...HT.DARK);
    pdf.text(o.titulo, M, y);
    y += 6;
    pdf.setFont(undefined,'normal'); pdf.setFontSize(9); pdf.setTextColor(...HT.GRAY);
    if (o.sub) { pdf.text(o.sub, M, y); y += 4.5; }
    pdf.text(`Folio: ${o.folio}   ·   Generado: ${HT.fechaLarga(HT.today())}`, M, y);
    y += 3;
    pdf.setDrawColor(...HT.PRIMARY); pdf.setLineWidth(.6); pdf.line(M, y, W-M, y);
    ctx.y = y + 7;
  },
  salto(ctx, need=20){ if (ctx.y + need > ctx.H - 20) { ctx.pdf.addPage(); ctx.y = ctx.M + 4; } },
  seccion(ctx, txt){
    HT.pdf.salto(ctx, 14);
    const {pdf, M} = ctx;
    pdf.setFont(undefined,'bold'); pdf.setFontSize(10.5); pdf.setTextColor(...HT.DARK);
    pdf.text(txt.toUpperCase(), M, ctx.y);
    pdf.setDrawColor(230,225,215); pdf.setLineWidth(.3); pdf.line(M, ctx.y+1.5, ctx.W-M, ctx.y+1.5);
    pdf.setFont(undefined,'normal'); ctx.y += 7;
  },
  kv(ctx, pares, cols=2){
    const {pdf, M, W} = ctx; const colW = (W-2*M)/cols; let i = 0;
    pdf.setFontSize(8.5);
    pares.forEach(([l,v]) => {
      const x = M + (i%cols)*colW;
      if (i%cols===0) HT.pdf.salto(ctx, 8);
      pdf.setTextColor(...HT.GRAY); pdf.text(String(l)+':', x, ctx.y);
      const off = Math.max(28, pdf.getTextWidth(String(l)+':') + 3);
      pdf.setTextColor(...HT.DARK); pdf.setFont(undefined,'bold');
      const vv = pdf.splitTextToSize(String(v ?? '—'), colW-off-2);
      pdf.text(vv, x+off, ctx.y);
      pdf.setFont(undefined,'normal');
      i++; if (i%cols===0) ctx.y += 5.2;
    });
    if (i%cols!==0) ctx.y += 5.2;
    ctx.y += 2;
  },
  parrafo(ctx, txt, size=8.5, color){
    const {pdf, M, W} = ctx;
    pdf.setFontSize(size); pdf.setTextColor(...(color||[60,60,60]));
    const lines = pdf.splitTextToSize(String(txt), W-2*M);
    lines.forEach(l => { HT.pdf.salto(ctx, 5); pdf.text(l, M, ctx.y); ctx.y += size*0.48; });
    ctx.y += 2;
  },
  tabla(ctx, o){
    const {pdf, M, W, H} = ctx;
    const {head, body, widths, align=[], fontSize=8, total} = o;
    const totalW = W-2*M; const n = head.length;
    let ws = widths && widths.length===n ? widths.slice() : new Array(n).fill(1);
    const s = ws.reduce((a,b)=>a+b,0); ws = ws.map(w => w*totalW/s);
    const pad = 2.2;
    const row = (cells, tipo) => {
      pdf.setFontSize(fontSize);
      const wr = cells.map((c,i) => pdf.splitTextToSize(String(c ?? ''), ws[i]-2*pad));
      const lines = Math.max(1, ...wr.map(w=>w.length));
      const rh = lines*(fontSize*0.42) + pad*2;
      if (ctx.y + rh > H - 18) { pdf.addPage(); ctx.y = M + 4; if (tipo!=='head') row(head,'head'); }
      let x = M;
      cells.forEach((c,i) => {
        if (tipo==='head') { pdf.setFillColor(...HT.PRIMARY); pdf.rect(x, ctx.y, ws[i], rh, 'F'); }
        else if (tipo==='total') { pdf.setFillColor(253,243,231); pdf.rect(x, ctx.y, ws[i], rh, 'F'); pdf.setDrawColor(240,214,181); pdf.rect(x, ctx.y, ws[i], rh, 'S'); }
        else { pdf.setDrawColor(228,228,228); pdf.rect(x, ctx.y, ws[i], rh, 'S'); }
        pdf.setTextColor(...(tipo==='head'?[255,255,255]:HT.DARK));
        pdf.setFont(undefined, (tipo==='head'||tipo==='total')?'bold':'normal');
        const a = align[i] || 'left';
        const tx = a==='right' ? x+ws[i]-pad : a==='center' ? x+ws[i]/2 : x+pad;
        pdf.text(wr[i], tx, ctx.y+pad+fontSize*0.35, {align:a});
        x += ws[i];
      });
      pdf.setFont(undefined,'normal'); ctx.y += rh;
    };
    row(head,'head'); body.forEach(r => row(r,'body')); if (total) row(total,'total');
    ctx.y += 5;
  },
  firmas(ctx, nombres){
    HT.pdf.salto(ctx, 30);
    const {pdf, M, W} = ctx; const n = nombres.length; const cw = (W-2*M)/n; ctx.y += 16;
    nombres.forEach((nm,i) => {
      const x = M + i*cw + 6;
      pdf.setDrawColor(...HT.GRAY); pdf.setLineWidth(.3); pdf.line(x, ctx.y, x+cw-12, ctx.y);
      pdf.setFontSize(8); pdf.setTextColor(...HT.GRAY); pdf.text(nm, x+(cw-12)/2, ctx.y+4.5, {align:'center'});
    });
    ctx.y += 12;
  },
  guardar(ctx, nombre){
    const {pdf, W, H, M} = ctx;
    const n = pdf.internal.getNumberOfPages();
    for (let i=1;i<=n;i++){
      pdf.setPage(i);
      pdf.setDrawColor(235,235,235); pdf.setLineWidth(.3); pdf.line(M, H-12, W-M, H-12);
      pdf.setFontSize(6.5); pdf.setTextColor(165,165,165);
      pdf.text('Los resultados dependen de los datos y supuestos capturados por el usuario. Verifica con tu proyecto y normatividad aplicable.', W/2, H-9, {align:'center'});
      pdf.setFontSize(7); pdf.setTextColor(140,140,140);
      pdf.text(`${HT.MARCA}  ·  ${ctx.folio}`, M, H-5);
      pdf.text(`Página ${i} de ${n}`, W/2, H-5, {align:'center'});
      pdf.text(HT.SITIO, W-M, H-5, {align:'right'});
    }
    pdf.save(nombre);
    HT.toast('success','PDF descargado', ctx.folio);
  }
};

/* Registro global */
const Tools = {};
window.IMFRATools = Tools;

/* ═══════════════════════════════════════════════════════════════════
   1 · VOLUMEN DE CONCRETO
   ═══════════════════════════════════════════════════════════════════ */
Tools.concreto = (function(){
  const st = HT.store('concreto');
  const TIPOS = {
    zapata:  {t:'Zapata aislada / corrida', dims:[['largo','Largo','m'],['ancho','Ancho','m'],['peralte','Peralte','m']], f:d=>d.largo*d.ancho*d.peralte},
    columna: {t:'Columna / castillo',       dims:[['b','Base','m'],['h','Altura sección','m'],['alt','Altura','m']], f:d=>d.b*d.h*d.alt},
    trabe:   {t:'Trabe / dala / cerramiento',dims:[['b','Base','m'],['h','Peralte','m'],['long','Longitud','m']], f:d=>d.b*d.h*d.long},
    losa:    {t:'Losa maciza / firme',       dims:[['largo','Largo','m'],['ancho','Ancho','m'],['esp','Espesor','m']], f:d=>d.largo*d.ancho*d.esp},
    muro:    {t:'Muro de concreto',          dims:[['largo','Largo','m'],['alt','Altura','m'],['esp','Espesor','m']], f:d=>d.largo*d.alt*d.esp},
    circular:{t:'Columna circular / pilote', dims:[['diam','Diámetro','m'],['alt','Altura','m']], f:d=>Math.PI*Math.pow(d.diam/2,2)*d.alt},
  };
  const FC = { 100:{cem:250,are:0.58,gra:0.75,agua:210}, 150:{cem:300,are:0.55,gra:0.73,agua:200}, 200:{cem:350,are:0.52,gra:0.72,agua:190}, 250:{cem:400,are:0.50,gra:0.70,agua:185}, 300:{cem:450,are:0.47,gra:0.68,agua:180} };
  const def = () => ({ folio:HT.folio('CON'), obra:'', elementos:[nuevoEl('zapata')], fc:'200', desp:5, camion:7, bulto:50, mat:{...FC[200]} });
  const nuevoEl = tipo => { const e = {id:HT.uid(), tipo, nombre:'', cant:1}; TIPOS[tipo].dims.forEach(([k]) => e[k]=''); return e; };
  let S = null, root = null;

  function calc(){
    const desp = 1 + HT.num(S.desp)/100;
    const filas = S.elementos.map(e => {
      const d = {}; TIPOS[e.tipo].dims.forEach(([k]) => d[k]=HT.num(e[k]));
      const unit = TIPOS[e.tipo].f(d); const cant = Math.max(0, HT.num(e.cant));
      return { ...e, unit, vol: unit*cant, cant };
    });
    const vol = filas.reduce((a,f)=>a+f.vol,0);
    const volDesp = vol*desp;
    const m = S.mat;
    return { filas, vol, volDesp,
      cemKg: volDesp*HT.num(m.cem), bultos: HT.ceil(volDesp*HT.num(m.cem)/HT.num(S.bulto||50)),
      arena: volDesp*HT.num(m.are), grava: volDesp*HT.num(m.gra), agua: volDesp*HT.num(m.agua),
      viajes: HT.ceil(volDesp/Math.max(0.5,HT.num(S.camion))) };
  }

  function render(){
    const R = calc();
    root.innerHTML = `
      <div class="ht-meta"><span class="ht-folio">${S.folio}</span><span class="ht-meta__txt">${R.filas.length} elemento${R.filas.length!==1?'s':''} · ${HT.fmt(R.vol,2)} m³</span></div>
      <div class="ht-card">
        <div class="ht-card__head"><div><h2 class="ht-card__title"><svg class="ic"><use href="#i-cube"/></svg>Elementos a colar</h2><p class="ht-card__sub">Captura cada elemento con sus medidas en metros. El volumen se calcula al instante.</p></div></div>
        <div class="ht-form" style="margin-bottom:14px">
          ${HT.ui.input({id:'c-obra',label:'Obra / frente',value:S.obra,placeholder:'Ej. Casa habitación · Lote 12',full:true})}
        </div>
        <div class="ht-rows" id="c-rows">${R.filas.map((e,i)=>filaHtml(e,i)).join('')}</div>
        <div style="margin-top:12px">${HT.ui.add('Agregar elemento')}</div>
      </div>
      <div class="ht-card ht-card--accent">
        <div class="ht-card__head"><div><h2 class="ht-card__title"><svg class="ic"><use href="#i-check-circle"/></svg>Resultado</h2><p class="ht-card__sub">Con ${HT.num(S.desp)}% de desperdicio · f'c ${S.fc} kg/cm²</p></div></div>
        <div class="ht-kpis">
          ${HT.ui.kpi({lbl:'Volumen neto',val:HT.fmt(R.vol,2),unit:'m³',cls:''})}
          ${HT.ui.kpi({lbl:'Volumen a pedir',val:HT.fmt(R.volDesp,2),unit:'m³',cls:'ht-kpi--primary',sub:'incluye desperdicio'})}
          ${HT.ui.kpi({lbl:'Viajes revolvedora',val:HT.fmt0(R.viajes),unit:'',sub:`camión de ${HT.fmt(HT.num(S.camion),1)} m³`})}
          ${HT.ui.kpi({lbl:'Cemento',val:HT.fmt0(R.bultos),unit:'bultos',sub:`${HT.fmt0(R.cemKg)} kg · bulto ${S.bulto} kg`})}
          ${HT.ui.kpi({lbl:'Arena',val:HT.fmt(R.arena,2),unit:'m³'})}
          ${HT.ui.kpi({lbl:'Grava',val:HT.fmt(R.grava,2),unit:'m³'})}
          ${HT.ui.kpi({lbl:'Agua',val:HT.fmt0(R.agua),unit:'L'})}
        </div>
        <div style="margin-top:14px">${HT.ui.table({head:['#','Elemento','Tipo','Medidas','Cant.','Unit. m³','Total m³'],numCols:[4,5,6],
          rows:R.filas.map((f,i)=>[i+1, HT.esc(f.nombre||'—'), TIPOS[f.tipo].t, medidas(f), HT.fmt0(f.cant), HT.fmt(f.unit,3), HT.fmt(f.vol,3)]),
          totalRow:['','Total','','','','',HT.fmt(R.vol,3)]})}</div>
      </div>
      ${HT.ui.assump({id:'c-asm',note:'Proporciones típicas por m³ para concreto hecho en obra. Ajústalas al diseño de mezcla de tu proveedor o laboratorio; el resultado se recalcula al instante.',body:`
        <div class="ht-form ht-form--3">
          ${HT.ui.select({id:'c-fc',label:"Resistencia f'c",options:Object.keys(FC).map(k=>({v:k,t:k+' kg/cm²'})),value:S.fc,hint:'Al cambiarla se cargan las proporciones típicas'})}
          ${HT.ui.input({id:'c-desp',label:'Desperdicio',type:'number',value:S.desp,unit:'%',step:'0.5',min:0,hint:'5% es lo usual en colados; 8-10% en piezas pequeñas'})}
          ${HT.ui.input({id:'c-camion',label:'Capacidad de revolvedora',type:'number',value:S.camion,unit:'m³',step:'0.5',min:0.5,hint:'7 m³ es la olla estándar'})}
          ${HT.ui.input({id:'c-cem',label:'Cemento por m³',type:'number',value:S.mat.cem,unit:'kg',step:'5',min:0})}
          ${HT.ui.input({id:'c-are',label:'Arena por m³',type:'number',value:S.mat.are,unit:'m³',step:'0.01',min:0})}
          ${HT.ui.input({id:'c-gra',label:'Grava por m³',type:'number',value:S.mat.gra,unit:'m³',step:'0.01',min:0})}
          ${HT.ui.input({id:'c-agua',label:'Agua por m³',type:'number',value:S.mat.agua,unit:'L',step:'5',min:0})}
          ${HT.ui.input({id:'c-bulto',label:'Peso del bulto',type:'number',value:S.bulto,unit:'kg',step:'1',min:1,hint:'50 kg en México (25 kg en presentación chica)'})}
        </div>`})}
      <div class="ht-actions">
        <button class="btn btn--ghost" id="c-nuevo"><svg class="ic"><use href="#i-refresh"/></svg>Nuevo cálculo</button>
        <button class="btn btn--accent" id="c-pdf"><svg class="ic"><use href="#i-download"/></svg>Descargar PDF</button>
      </div>`;
    bind();
  }
  const medidas = f => TIPOS[f.tipo].dims.map(([k,l,u]) => `${HT.fmt(HT.num(f[k]),2)}`).join(' × ') + ' m';
  function filaHtml(e,i){
    const T = TIPOS[e.tipo];
    return `<div class="ht-row" data-id="${e.id}" style="grid-template-columns:1.4fr 1.2fr repeat(${T.dims.length},1fr) .7fr 1.1fr auto">
      <span class="ht-row__num">ELEMENTO ${i+1}</span>
      ${HT.ui.input({id:'el-n-'+e.id,label:'Nombre',value:e.nombre,placeholder:'Ej. Z-1, C-3, Losa PB'})}
      ${HT.ui.select({id:'el-t-'+e.id,label:'Tipo',options:Object.entries(TIPOS).map(([v,o])=>({v,t:o.t})),value:e.tipo})}
      ${T.dims.map(([k,l,u]) => HT.ui.input({id:'el-'+k+'-'+e.id,label:l,type:'number',value:e[k],unit:u,step:'0.01',min:0,placeholder:'0.00'})).join('')}
      ${HT.ui.input({id:'el-c-'+e.id,label:'Cant.',type:'number',value:e.cant,step:'1',min:0,inputmode:'numeric'})}
      <div class="ht-row__out"><small>Total</small><b>${HT.fmt(e.vol,3)} m³</b></div>
      ${HT.ui.del()}
    </div>`;
  }
  function bind(){
    HT.bindAssump(root);
    root.querySelector('#c-obra').addEventListener('input', e => { S.obra = e.target.value; st.set(S); });
    root.querySelector('[data-add]').addEventListener('click', () => { S.elementos.push(nuevoEl((S.elementos[S.elementos.length-1]||{}).tipo||'zapata')); st.set(S); render(); root.querySelector('.ht-row:last-child input')?.focus(); });
    root.querySelectorAll('.ht-row').forEach(row => {
      const id = row.dataset.id; const e = S.elementos.find(x=>x.id===id);
      row.querySelector('[data-del]').addEventListener('click', async () => {
        if (S.elementos.length===1) { HT.toast('info','Necesitas al menos un elemento',''); return; }
        S.elementos = S.elementos.filter(x=>x.id!==id); st.set(S); render();
      });
      row.querySelector('#el-t-'+id).addEventListener('change', ev => { const n = nuevoEl(ev.target.value); n.id=id; n.nombre=e.nombre; n.cant=e.cant; S.elementos = S.elementos.map(x=>x.id===id?n:x); st.set(S); render(); });
      row.querySelectorAll('input').forEach(inp => inp.addEventListener('input', () => {
        const k = inp.id.replace('el-','').replace('-'+id,'');
        if (k==='n') e.nombre = inp.value; else if (k==='c') e.cant = inp.value; else e[k] = inp.value;
        st.set(S); actualizarSalida();
      }));
    });
    const asmMap = {'c-desp':['desp'],'c-camion':['camion'],'c-bulto':['bulto'],'c-cem':['mat','cem'],'c-are':['mat','are'],'c-gra':['mat','gra'],'c-agua':['mat','agua']};
    Object.entries(asmMap).forEach(([id,path]) => root.querySelector('#'+id).addEventListener('input', ev => { if (path.length===1) S[path[0]]=ev.target.value; else S[path[0]][path[1]]=ev.target.value; st.set(S); actualizarSalida(); }));
    root.querySelector('#c-fc').addEventListener('change', ev => { S.fc = ev.target.value; S.mat = {...FC[S.fc]}; st.set(S); render(); root.querySelector('#c-asm').classList.add('is-open'); });
    root.querySelector('#c-nuevo').addEventListener('click', async () => { if (await HT.confirm('¿Nuevo cálculo?','Se borrarán los elementos capturados y se generará un folio nuevo.','Sí, empezar de cero')) { S = def(); st.set(S); render(); HT.toast('info','Nuevo cálculo',S.folio); } });
    root.querySelector('#c-pdf').addEventListener('click', pdf);
  }
  /* Recalcula sin volver a pintar los inputs (no pierde el foco) */
  function actualizarSalida(){
    const R = calc();
    R.filas.forEach(f => { const o = root.querySelector(`.ht-row[data-id="${f.id}"] .ht-row__out b`); if (o) o.textContent = HT.fmt(f.vol,3)+' m³'; });
    const card = root.querySelectorAll('.ht-card')[1];
    if (!card) return;
    card.querySelector('.ht-card__sub').textContent = `Con ${HT.num(S.desp)}% de desperdicio · f'c ${S.fc} kg/cm²`;
    const k = card.querySelectorAll('.ht-kpi__val');
    const set = (i, v, u) => { if (k[i]) k[i].innerHTML = v + (u?`<small>${u}</small>`:''); };
    set(0,HT.fmt(R.vol,2),'m³'); set(1,HT.fmt(R.volDesp,2),'m³'); set(2,HT.fmt0(R.viajes),''); set(3,HT.fmt0(R.bultos),'bultos'); set(4,HT.fmt(R.arena,2),'m³'); set(5,HT.fmt(R.grava,2),'m³'); set(6,HT.fmt0(R.agua),'L');
    const subs = card.querySelectorAll('.ht-kpi__sub'); if (subs[1]) subs[1].textContent = `camión de ${HT.fmt(HT.num(S.camion),1)} m³`; if (subs[2]) subs[2].textContent = `${HT.fmt0(R.cemKg)} kg · bulto ${S.bulto} kg`;
    const tb = card.querySelector('tbody'); if (tb) tb.innerHTML = R.filas.map((f,i)=>`<tr><td>${i+1}</td><td>${HT.esc(f.nombre||'—')}</td><td>${TIPOS[f.tipo].t}</td><td>${medidas(f)}</td><td class="num">${HT.fmt0(f.cant)}</td><td class="num">${HT.fmt(f.unit,3)}</td><td class="num">${HT.fmt(f.vol,3)}</td></tr>`).join('') + `<tr class="is-total"><td></td><td>Total</td><td></td><td></td><td></td><td></td><td class="num">${HT.fmt(R.vol,3)}</td></tr>`;
    const meta = root.querySelector('.ht-meta__txt'); if (meta) meta.textContent = `${R.filas.length} elemento${R.filas.length!==1?'s':''} · ${HT.fmt(R.vol,2)} m³`;
  }
  async function pdf(){
    const R = calc();
    if (R.vol <= 0) { HT.toast('error','Sin volumen','Captura las medidas de al menos un elemento.'); return; }
    if (!HT.vip('la calculadora de concreto')) return;
    const ctx = await HT.pdf.nuevo({titulo:'Volumen de concreto y materiales', sub:S.obra?('Obra: '+S.obra):'', folio:S.folio});
    if (!ctx) return;
    HT.pdf.seccion(ctx,'Elementos');
    HT.pdf.tabla(ctx,{head:['#','Elemento','Tipo','Medidas (m)','Cant.','Unit. m³','Total m³'],widths:[.5,1.6,1.8,1.9,.7,.9,.9],align:['center','left','left','left','right','right','right'],
      body:R.filas.map((f,i)=>[i+1,f.nombre||'—',TIPOS[f.tipo].t,medidas(f),HT.fmt0(f.cant),HT.fmt(f.unit,3),HT.fmt(f.vol,3)]),
      total:['','TOTAL','','','','',HT.fmt(R.vol,3)]});
    HT.pdf.seccion(ctx,'Resultado');
    HT.pdf.kv(ctx,[['Volumen neto',HT.fmt(R.vol,2)+' m³'],['Desperdicio',HT.num(S.desp)+' %'],['Volumen a pedir',HT.fmt(R.volDesp,2)+' m³'],['Viajes revolvedora',HT.fmt0(R.viajes)+' (olla de '+HT.fmt(HT.num(S.camion),1)+' m³)']]);
    HT.pdf.seccion(ctx,"Materiales para concreto hecho en obra · f'c "+S.fc+' kg/cm²');
    HT.pdf.tabla(ctx,{head:['Material','Por m³','Total'],widths:[1.4,1,1],align:['left','right','right'],body:[
      ['Cemento',HT.fmt0(HT.num(S.mat.cem))+' kg',HT.fmt0(R.cemKg)+' kg  ·  '+HT.fmt0(R.bultos)+' bultos de '+S.bulto+' kg'],
      ['Arena',HT.fmt(HT.num(S.mat.are),2)+' m³',HT.fmt(R.arena,2)+' m³'],
      ['Grava',HT.fmt(HT.num(S.mat.gra),2)+' m³',HT.fmt(R.grava,2)+' m³'],
      ['Agua',HT.fmt0(HT.num(S.mat.agua))+' L',HT.fmt0(R.agua)+' L']]});
    HT.pdf.parrafo(ctx,'Nota: las proporciones son valores típicos para concreto hecho en obra y deben ajustarse al diseño de mezcla del proveedor o laboratorio. Los volúmenes incluyen el porcentaje de desperdicio indicado.',7.5,HT.GRAY);
    HT.pdf.guardar(ctx,'concreto-'+S.folio+'.pdf');
  }
  function mount(container){
    HT.icons();
    S = st.get(null) || def();
    if (!S.folio) S.folio = HT.folio('CON');
    root = HT.shell(container,{icon:'i-cube',titulo:'Volumen de concreto',sub:'m³ por elemento, cemento, arena, grava y viajes de revolvedora'});
    render();
  }
  return { mount };
})();


/* ═══════════════════════════════════════════════════════════════════
   2 · CUANTIFICACIÓN DE ACERO DE REFUERZO
   ═══════════════════════════════════════════════════════════════════ */
Tools.acero = (function(){
  const st = HT.store('acero');
  /* Catálogo de varilla (NMX-C-407): número, diámetro mm, peso kg/m */
  const VAR = {
    '2':  {n:'#2 (1/4")',   d:6.35,  kg:0.248},
    '2.5':{n:'#2.5 (5/16")',d:7.94,  kg:0.384},
    '3':  {n:'#3 (3/8")',   d:9.53,  kg:0.560},
    '4':  {n:'#4 (1/2")',   d:12.70, kg:0.994},
    '5':  {n:'#5 (5/8")',   d:15.88, kg:1.552},
    '6':  {n:'#6 (3/4")',   d:19.05, kg:2.235},
    '7':  {n:'#7 (7/8")',   d:22.22, kg:3.042},
    '8':  {n:'#8 (1")',     d:25.40, kg:3.973},
    '10': {n:'#10 (1 1/4")',d:31.75, kg:6.225},
    '12': {n:'#12 (1 1/2")',d:38.10, kg:8.938}
  };
  const OPT_VAR = Object.entries(VAR).map(([v,o])=>({v,t:o.n}));
  const nuevoEl = () => ({id:HT.uid(), nombre:'', cant:1, cal:'4', nvar:4, long:'', ganchos:2, trasl:0, est:true, calEst:'2.5', sep:15, b:'', h:'', rec:3, longEst:''});
  const def = () => ({folio:HT.folio('ACE'), obra:'', elementos:[nuevoEl()], desp:5, fGancho:12, fTrasl:40, gEst:10, largoVar:12});
  let S=null, root=null;

  /* Cálculo por elemento */
  function calcEl(e){
    const v = VAR[e.cal] || VAR['4']; const d = v.d/1000; // m
    const long = HT.num(e.long), nvar = Math.max(0,HT.num(e.nvar)), cant = Math.max(0,HT.num(e.cant));
    const lGancho = HT.num(S.fGancho)*d, lTrasl = HT.num(S.fTrasl)*d;
    const lVar = long + HT.num(e.ganchos)*lGancho + HT.num(e.trasl)*lTrasl;   // m por varilla
    const mlLong = lVar*nvar*cant;                                            // ml longitudinal
    const kgLong = mlLong*v.kg;
    let nEst=0, lEst=0, mlEst=0, kgEst=0, vE=null;
    if (e.est) {
      vE = VAR[e.calEst] || VAR['2.5']; const dE = vE.d/1000;
      const b = HT.num(e.b)/100, h = HT.num(e.h)/100, rec = HT.num(e.rec)/100;
      const lz = HT.num(e.longEst)||long;               // longitud a estribar (default = longitud del elemento)
      const sep = Math.max(0.01, HT.num(e.sep)/100);
      const lados = Math.max(0,(b-2*rec)) + Math.max(0,(h-2*rec));
      lEst = 2*lados + 2*HT.num(S.gEst)*dE;             // perímetro + 2 ganchos
      nEst = (lz>0 && sep>0) ? Math.floor(lz/sep)+1 : 0;
      mlEst = lEst*nEst*cant; kgEst = mlEst*vE.kg;
    }
    return {lVar, mlLong, kgLong, nEst, lEst, mlEst, kgEst, kg:kgLong+kgEst, v, vE};
  }
  function calc(){
    const desp = 1+HT.num(S.desp)/100; const L = Math.max(1,HT.num(S.largoVar));
    const filas = S.elementos.map(e => ({...e, r:calcEl(e)}));
    const porCal = {};
    filas.forEach(f => {
      const add = (cal, ml, kg) => { if (!porCal[cal]) porCal[cal]={ml:0,kg:0}; porCal[cal].ml+=ml; porCal[cal].kg+=kg; };
      add(f.cal, f.r.mlLong, f.r.kgLong); if (f.est) add(f.calEst, f.r.mlEst, f.r.kgEst);
    });
    const resumen = Object.entries(porCal).filter(([,o])=>o.ml>0).map(([cal,o]) => ({cal, n:VAR[cal].n, ml:o.ml, kg:o.kg, kgDesp:o.kg*desp, piezas:HT.ceil(o.ml*desp/L)}));
    const kg = filas.reduce((a,f)=>a+f.r.kg,0);
    return {filas, resumen, kg, kgDesp:kg*desp, piezas:resumen.reduce((a,r)=>a+r.piezas,0)};
  }

  function render(){
    const R = calc();
    root.innerHTML = `
      <div class="ht-meta"><span class="ht-folio">${S.folio}</span><span class="ht-meta__txt">${R.filas.length} elemento${R.filas.length!==1?'s':''} · ${HT.fmt(R.kg,1)} kg</span></div>
      <div class="ht-card">
        <div class="ht-card__head"><div><h2 class="ht-card__title"><svg class="ic"><use href="#i-rebar"/></svg>Elementos armados</h2><p class="ht-card__sub">Acero longitudinal por elemento y, si aplica, estribos. Ganchos y traslapes se calculan en función del diámetro.</p></div></div>
        <div class="ht-form" style="margin-bottom:14px">${HT.ui.input({id:'a-obra',label:'Obra / frente',value:S.obra,placeholder:'Ej. Nave industrial · Eje A-D',full:true})}</div>
        <div class="ht-rows" id="a-rows">${R.filas.map((e,i)=>filaHtml(e,i)).join('')}</div>
        <div style="margin-top:12px">${HT.ui.add('Agregar elemento')}</div>
      </div>
      <div class="ht-card ht-card--accent">
        <div class="ht-card__head"><div><h2 class="ht-card__title"><svg class="ic"><use href="#i-check-circle"/></svg>Resultado</h2><p class="ht-card__sub">Con ${HT.num(S.desp)}% de desperdicio · varilla comercial de ${HT.num(S.largoVar)} m</p></div></div>
        <div class="ht-kpis">
          ${HT.ui.kpi({lbl:'Acero neto',val:HT.fmt(R.kg,1),unit:'kg'})}
          ${HT.ui.kpi({lbl:'Acero a comprar',val:HT.fmt(R.kgDesp,1),unit:'kg',cls:'ht-kpi--primary',sub:HT.fmt(R.kgDesp/1000,3)+' ton · incluye desperdicio'})}
          ${HT.ui.kpi({lbl:'Piezas de '+HT.num(S.largoVar)+' m',val:HT.fmt0(R.piezas),unit:'pzas',sub:'suma de todos los calibres'})}
        </div>
        <div style="margin-top:14px">
          <div class="ht-label" style="margin-bottom:8px">Resumen por calibre</div>
          ${HT.ui.table({head:['Calibre','Metros lineales','kg neto','kg a comprar','Piezas de '+HT.num(S.largoVar)+' m'],numCols:[1,2,3,4],
            rows:R.resumen.map(r=>[r.n,HT.fmt(r.ml,2),HT.fmt(r.kg,1),HT.fmt(r.kgDesp,1),HT.fmt0(r.piezas)]),
            totalRow:['Total',HT.fmt(R.resumen.reduce((a,r)=>a+r.ml,0),2),HT.fmt(R.kg,1),HT.fmt(R.kgDesp,1),HT.fmt0(R.piezas)]})}
        </div>
        <div style="margin-top:14px">
          <div class="ht-label" style="margin-bottom:8px">Detalle por elemento</div>
          ${HT.ui.table({head:['Elemento','Cant.','Longitudinal','Estribos','kg long.','kg estribos','kg total'],numCols:[1,4,5,6],
            rows:R.filas.map(f=>[HT.esc(f.nombre||'—'),HT.fmt0(HT.num(f.cant)),`${HT.fmt0(HT.num(f.nvar))} × ${f.r.v.n} · ${HT.fmt(f.r.lVar,2)} m c/u`, f.est?`${HT.fmt0(f.r.nEst)} × ${f.r.vE.n} · ${HT.fmt(f.r.lEst,2)} m c/u`:'—', HT.fmt(f.r.kgLong,1), HT.fmt(f.r.kgEst,1), HT.fmt(f.r.kg,1)]),
            totalRow:['Total','','','','','',HT.fmt(R.kg,1)]})}
        </div>
      </div>
      ${HT.ui.assump({id:'a-asm',note:'Factores expresados en diámetros (d). Los valores por defecto siguen la práctica común en México; ajústalos a tu proyecto estructural.',body:`
        <div class="ht-form ht-form--3">
          ${HT.ui.input({id:'a-desp',label:'Desperdicio',type:'number',value:S.desp,unit:'%',step:'0.5',min:0,hint:'3-5% en armados simples; 7-10% con muchos cortes'})}
          ${HT.ui.input({id:'a-fgancho',label:'Longitud de gancho',type:'number',value:S.fGancho,unit:'× d',step:'1',min:0,hint:'12d para gancho a 90°; 6d en gancho a 180° (mín. 7.5 cm)'})}
          ${HT.ui.input({id:'a-ftrasl',label:'Longitud de traslape',type:'number',value:S.fTrasl,unit:'× d',step:'1',min:0,hint:'40d es lo común; verifica con tu proyecto (NTC)'})}
          ${HT.ui.input({id:'a-gest',label:'Gancho de estribo',type:'number',value:S.gEst,unit:'× d',step:'1',min:0,hint:'10d por gancho (mín. 7.5 cm)'})}
          ${HT.ui.input({id:'a-largo',label:'Largo comercial de varilla',type:'number',value:S.largoVar,unit:'m',step:'0.5',min:1,hint:'12 m estándar; hay 9 m en algunas ferreterías'})}
        </div>`})}
      <div class="ht-actions">
        <button class="btn btn--ghost" id="a-nuevo"><svg class="ic"><use href="#i-refresh"/></svg>Nuevo cálculo</button>
        <button class="btn btn--accent" id="a-pdf"><svg class="ic"><use href="#i-download"/></svg>Descargar PDF</button>
      </div>`;
    bind();
  }
  function filaHtml(e,i){
    return `<div class="ht-row ht-row--stack" data-id="${e.id}">
      <span class="ht-row__num">ELEMENTO ${i+1}</span>
      <div class="ht-form ht-form--4">
        ${HT.ui.input({id:'ae-nombre-'+e.id,label:'Nombre',value:e.nombre,placeholder:'Ej. Trabe T-1, Columna C-2'})}
        ${HT.ui.input({id:'ae-cant-'+e.id,label:'Elementos iguales',type:'number',value:e.cant,step:'1',min:0,inputmode:'numeric'})}
        ${HT.ui.select({id:'ae-cal-'+e.id,label:'Calibre longitudinal',options:OPT_VAR,value:e.cal})}
        ${HT.ui.input({id:'ae-nvar-'+e.id,label:'Varillas por elemento',type:'number',value:e.nvar,step:'1',min:0,inputmode:'numeric'})}
        ${HT.ui.input({id:'ae-long-'+e.id,label:'Longitud de varilla',type:'number',value:e.long,unit:'m',step:'0.01',min:0,placeholder:'0.00'})}
        ${HT.ui.input({id:'ae-ganchos-'+e.id,label:'Ganchos por varilla',type:'number',value:e.ganchos,step:'1',min:0,max:2,inputmode:'numeric',hint:'0, 1 ó 2'})}
        ${HT.ui.input({id:'ae-trasl-'+e.id,label:'Traslapes por varilla',type:'number',value:e.trasl,step:'1',min:0,inputmode:'numeric'})}
        <div class="ht-field" style="justify-content:flex-end">${HT.ui.toggle({id:'ae-est-'+e.id,label:'Lleva estribos',checked:e.est})}</div>
      </div>
      <div class="ht-form ht-form--4" data-estribos style="${e.est?'':'display:none'}">
        ${HT.ui.select({id:'ae-calEst-'+e.id,label:'Calibre de estribo',options:OPT_VAR,value:e.calEst})}
        ${HT.ui.input({id:'ae-sep-'+e.id,label:'Separación',type:'number',value:e.sep,unit:'cm',step:'1',min:1})}
        ${HT.ui.input({id:'ae-b-'+e.id,label:'Base de sección',type:'number',value:e.b,unit:'cm',step:'1',min:0,placeholder:'0'})}
        ${HT.ui.input({id:'ae-h-'+e.id,label:'Peralte de sección',type:'number',value:e.h,unit:'cm',step:'1',min:0,placeholder:'0'})}
        ${HT.ui.input({id:'ae-rec-'+e.id,label:'Recubrimiento',type:'number',value:e.rec,unit:'cm',step:'0.5',min:0})}
        ${HT.ui.input({id:'ae-longEst-'+e.id,label:'Longitud a estribar',type:'number',value:e.longEst,unit:'m',step:'0.01',min:0,placeholder:'= longitud'})}
      </div>
      <div class="ht-row__out"><small>Este elemento</small><b>${HT.fmt(e.r.kg,1)} kg <span class="ht-muted" style="font-weight:500;font-size:11px">· ${HT.fmt(e.r.kgLong,1)} long. + ${HT.fmt(e.r.kgEst,1)} estribos</span></b></div>
      ${HT.ui.del()}
    </div>`;
  }
  function bind(){
    HT.bindAssump(root);
    root.querySelector('#a-obra').addEventListener('input', ev => { S.obra = ev.target.value; st.set(S); });
    root.querySelector('[data-add]').addEventListener('click', () => { S.elementos.push(nuevoEl()); st.set(S); render(); });
    root.querySelectorAll('.ht-row').forEach(row => {
      const id = row.dataset.id; const e = S.elementos.find(x=>x.id===id);
      row.querySelector('[data-del]').addEventListener('click', () => { if (S.elementos.length===1) { HT.toast('info','Necesitas al menos un elemento',''); return; } S.elementos = S.elementos.filter(x=>x.id!==id); st.set(S); render(); });
      row.querySelectorAll('input:not([type=checkbox]), select').forEach(inp => inp.addEventListener(inp.tagName==='SELECT'?'change':'input', () => {
        const k = inp.id.slice(3, inp.id.length - id.length - 1); e[k] = inp.value; st.set(S); actualizar();
      }));
      row.querySelector('#ae-est-'+id).addEventListener('change', ev => { e.est = ev.target.checked; row.querySelector('[data-estribos]').style.display = e.est?'':'none'; st.set(S); actualizar(); });
    });
    [['a-desp','desp'],['a-fgancho','fGancho'],['a-ftrasl','fTrasl'],['a-gest','gEst'],['a-largo','largoVar']].forEach(([id,k]) => root.querySelector('#'+id).addEventListener('input', ev => { S[k]=ev.target.value; st.set(S); actualizar(); }));
    root.querySelector('#a-nuevo').addEventListener('click', async () => { if (await HT.confirm('¿Nuevo cálculo?','Se borrarán los elementos capturados y se generará un folio nuevo.','Sí, empezar de cero')) { S=def(); st.set(S); render(); HT.toast('info','Nuevo cálculo',S.folio); } });
    root.querySelector('#a-pdf').addEventListener('click', pdf);
  }
  /* Repinta solo salidas (conserva el foco en el input) */
  function actualizar(){
    const R = calc();
    R.filas.forEach(f => { const o = root.querySelector(`.ht-row[data-id="${f.id}"] .ht-row__out b`); if (o) o.innerHTML = `${HT.fmt(f.r.kg,1)} kg <span class="ht-muted" style="font-weight:500;font-size:11px">· ${HT.fmt(f.r.kgLong,1)} long. + ${HT.fmt(f.r.kgEst,1)} estribos</span>`; });
    const card = root.querySelectorAll('.ht-card')[1]; if (!card) return;
    card.querySelector('.ht-card__sub').textContent = `Con ${HT.num(S.desp)}% de desperdicio · varilla comercial de ${HT.num(S.largoVar)} m`;
    const k = card.querySelectorAll('.ht-kpi'); 
    if (k[0]) k[0].querySelector('.ht-kpi__val').innerHTML = HT.fmt(R.kg,1)+'<small>kg</small>';
    if (k[1]) { k[1].querySelector('.ht-kpi__val').innerHTML = HT.fmt(R.kgDesp,1)+'<small>kg</small>'; k[1].querySelector('.ht-kpi__sub').textContent = HT.fmt(R.kgDesp/1000,3)+' ton · incluye desperdicio'; }
    if (k[2]) { k[2].querySelector('.ht-kpi__lbl').textContent = 'Piezas de '+HT.num(S.largoVar)+' m'; k[2].querySelector('.ht-kpi__val').innerHTML = HT.fmt0(R.piezas)+'<small>pzas</small>'; }
    const tbs = card.querySelectorAll('tbody');
    if (tbs[0]) tbs[0].innerHTML = R.resumen.map(r=>`<tr><td>${r.n}</td><td class="num">${HT.fmt(r.ml,2)}</td><td class="num">${HT.fmt(r.kg,1)}</td><td class="num">${HT.fmt(r.kgDesp,1)}</td><td class="num">${HT.fmt0(r.piezas)}</td></tr>`).join('') + `<tr class="is-total"><td>Total</td><td class="num">${HT.fmt(R.resumen.reduce((a,r)=>a+r.ml,0),2)}</td><td class="num">${HT.fmt(R.kg,1)}</td><td class="num">${HT.fmt(R.kgDesp,1)}</td><td class="num">${HT.fmt0(R.piezas)}</td></tr>`;
    if (tbs[1]) tbs[1].innerHTML = R.filas.map(f=>`<tr><td>${HT.esc(f.nombre||'—')}</td><td class="num">${HT.fmt0(HT.num(f.cant))}</td><td>${HT.fmt0(HT.num(f.nvar))} × ${f.r.v.n} · ${HT.fmt(f.r.lVar,2)} m c/u</td><td>${f.est?`${HT.fmt0(f.r.nEst)} × ${f.r.vE.n} · ${HT.fmt(f.r.lEst,2)} m c/u`:'—'}</td><td class="num">${HT.fmt(f.r.kgLong,1)}</td><td class="num">${HT.fmt(f.r.kgEst,1)}</td><td class="num">${HT.fmt(f.r.kg,1)}</td></tr>`).join('') + `<tr class="is-total"><td>Total</td><td></td><td></td><td></td><td></td><td></td><td class="num">${HT.fmt(R.kg,1)}</td></tr>`;
    const meta = root.querySelector('.ht-meta__txt'); if (meta) meta.textContent = `${R.filas.length} elemento${R.filas.length!==1?'s':''} · ${HT.fmt(R.kg,1)} kg`;
  }
  async function pdf(){
    const R = calc();
    if (R.kg<=0) { HT.toast('error','Sin acero','Captura la longitud y cantidad de al menos un elemento.'); return; }
    if (!HT.vip('la cuantificación de acero')) return;
    const ctx = await HT.pdf.nuevo({titulo:'Cuantificación de acero de refuerzo', sub:S.obra?('Obra: '+S.obra):'', folio:S.folio, landscape:true});
    if (!ctx) return;
    HT.pdf.seccion(ctx,'Resumen por calibre');
    HT.pdf.tabla(ctx,{head:['Calibre','Metros lineales','kg neto','kg a comprar (+'+HT.num(S.desp)+'%)','Piezas de '+HT.num(S.largoVar)+' m'],widths:[1.2,1,1,1.2,1],align:['left','right','right','right','right'],
      body:R.resumen.map(r=>[r.n,HT.fmt(r.ml,2),HT.fmt(r.kg,1),HT.fmt(r.kgDesp,1),HT.fmt0(r.piezas)]),
      total:['TOTAL',HT.fmt(R.resumen.reduce((a,r)=>a+r.ml,0),2),HT.fmt(R.kg,1),HT.fmt(R.kgDesp,1),HT.fmt0(R.piezas)]});
    HT.pdf.seccion(ctx,'Detalle por elemento');
    HT.pdf.tabla(ctx,{head:['Elemento','Cant.','Longitudinal','Long. por varilla','Estribos','kg long.','kg estribos','kg total'],widths:[1.4,.6,1.6,1,1.8,.8,.8,.8],align:['left','right','left','right','left','right','right','right'],
      body:R.filas.map(f=>[f.nombre||'—',HT.fmt0(HT.num(f.cant)),`${HT.fmt0(HT.num(f.nvar))} × ${f.r.v.n}`,HT.fmt(f.r.lVar,2)+' m',f.est?`${HT.fmt0(f.r.nEst)} × ${f.r.vE.n} · ${HT.fmt(f.r.lEst,2)} m c/u @ ${HT.num(f.sep)} cm`:'—',HT.fmt(f.r.kgLong,1),HT.fmt(f.r.kgEst,1),HT.fmt(f.r.kg,1)]),
      total:['TOTAL','','','','','','',HT.fmt(R.kg,1)]});
    HT.pdf.seccion(ctx,'Factores utilizados');
    HT.pdf.kv(ctx,[['Desperdicio',HT.num(S.desp)+' %'],['Gancho',HT.num(S.fGancho)+' d'],['Traslape',HT.num(S.fTrasl)+' d'],['Gancho de estribo',HT.num(S.gEst)+' d'],['Varilla comercial',HT.num(S.largoVar)+' m'],['Pesos','NMX-C-407 (kg/m nominal)']],3);
    HT.pdf.parrafo(ctx,'Nota: la longitud por varilla = longitud + ganchos + traslapes. El estribo = perímetro interior (sección menos recubrimientos) + dos ganchos. Verifica longitudes de desarrollo y traslape con el proyecto estructural vigente.',7.5,HT.GRAY);
    HT.pdf.guardar(ctx,'acero-'+S.folio+'.pdf');
  }
  function mount(container){
    HT.icons(); S = st.get(null) || def(); if (!S.folio) S.folio = HT.folio('ACE');
    root = HT.shell(container,{icon:'i-rebar',titulo:'Cuantificación de acero',sub:'kg por elemento, piezas de varilla a comprar y resumen por calibre'});
    render();
  }
  return { mount };
})();

/* ═══════════════════════════════════════════════════════════════════
   3 · MUROS Y ALBAÑILERÍA
   ═══════════════════════════════════════════════════════════════════ */
Tools.muros = (function(){
  const st = HT.store('muros');
  /* Piezas: largo × alto × espesor (cm), junta típica (cm), rendimiento m²/jornal de cuadrilla (oficial + ayudante) */
  const PIEZAS = {
    block15: {t:'Block hueco 15×20×40',   L:40,H:20,E:15,j:1.5,rend:10},
    block12: {t:'Block hueco 12×20×40',   L:40,H:20,E:12,j:1.5,rend:10},
    block20: {t:'Block hueco 20×20×40',   L:40,H:20,E:20,j:1.5,rend:9},
    tabique: {t:'Tabique rojo recocido 7×14×28 (a soga)', L:28,H:7,E:14,j:1.0,rend:6},
    tabicon: {t:'Tabicón 10×14×28',       L:28,H:10,E:14,j:1.0,rend:7},
    extruido:{t:'Tabique extruido 12×12×24 (6 huecos)', L:24,H:12,E:12,j:1.0,rend:8},
    custom:  {t:'Otra pieza (captura medidas)', L:30,H:15,E:12,j:1.0,rend:8}
  };
  /* Mortero cemento-arena por m³: cemento kg, arena m³ */
  const MORT = { '1:3':{cem:445,are:1.05}, '1:4':{cem:340,are:1.10}, '1:5':{cem:280,are:1.15}, '1:6':{cem:240,are:1.18} };
  const nuevoMuro = () => ({id:HT.uid(), nombre:'', largo:'', alto:'', cant:1});
  const nuevoVano = () => ({id:HT.uid(), nombre:'', ancho:'', alto:'', cant:1});
  const def = () => ({folio:HT.folio('MUR'), obra:'', pieza:'block15', pz:{...PIEZAS.block15}, muros:[nuevoMuro()], vanos:[], mezcla:'1:4', mort:{...MORT['1:4']}, despPz:5, despMort:10, bulto:50});
  let S=null, root=null;

  function calc(){
    const p = S.pz; const L=HT.num(p.L)/100, H=HT.num(p.H)/100, E=HT.num(p.E)/100, j=HT.num(p.j)/100;
    const muros = S.muros.map(m => ({...m, area: HT.num(m.largo)*HT.num(m.alto)*Math.max(0,HT.num(m.cant))}));
    const vanos = S.vanos.map(v => ({...v, area: HT.num(v.ancho)*HT.num(v.alto)*Math.max(0,HT.num(v.cant))}));
    const areaBruta = muros.reduce((a,m)=>a+m.area,0);
    const areaVanos = vanos.reduce((a,v)=>a+v.area,0);
    const areaNeta = Math.max(0, areaBruta-areaVanos);
    const pzM2 = (L>0&&H>0) ? 1/((L+j)*(H+j)) : 0;          // piezas por m²
    const juntasM2 = Math.max(0, 1 - pzM2*L*H);              // m² de junta por m² de muro
    const mortM2 = juntasM2*E;                                // m³ de mortero por m²
    const piezas = HT.ceil(areaNeta*pzM2*(1+HT.num(S.despPz)/100));
    const mortero = areaNeta*mortM2*(1+HT.num(S.despMort)/100);
    const cemKg = mortero*HT.num(S.mort.cem), bultos = HT.ceil(cemKg/Math.max(1,HT.num(S.bulto)));
    const arena = mortero*HT.num(S.mort.are);
    const jornales = HT.num(p.rend)>0 ? areaNeta/HT.num(p.rend) : 0;
    return {muros, vanos, areaBruta, areaVanos, areaNeta, pzM2, mortM2, piezas, mortero, cemKg, bultos, arena, jornales};
  }
  function render(){
    const R = calc(); const p = S.pz;
    root.innerHTML = `
      <div class="ht-meta"><span class="ht-folio">${S.folio}</span><span class="ht-meta__txt">${HT.fmt(R.areaNeta,2)} m² netos</span></div>
      <div class="ht-card">
        <div class="ht-card__head"><div><h2 class="ht-card__title"><svg class="ic"><use href="#i-wall"/></svg>Pieza y muros</h2><p class="ht-card__sub">Elige la pieza, captura los muros y descuenta puertas y ventanas.</p></div></div>
        <div class="ht-form" style="margin-bottom:14px">
          ${HT.ui.input({id:'m-obra',label:'Obra / frente',value:S.obra,placeholder:'Ej. Casa habitación · Planta baja'})}
          ${HT.ui.select({id:'m-pieza',label:'Tipo de pieza',options:Object.entries(PIEZAS).map(([v,o])=>({v,t:o.t})),value:S.pieza})}
        </div>
        <div class="ht-form ht-form--4" style="margin-bottom:6px">
          ${HT.ui.input({id:'m-L',label:'Largo pieza',type:'number',value:p.L,unit:'cm',step:'0.5',min:1})}
          ${HT.ui.input({id:'m-H',label:'Alto pieza',type:'number',value:p.H,unit:'cm',step:'0.5',min:1})}
          ${HT.ui.input({id:'m-E',label:'Espesor de muro',type:'number',value:p.E,unit:'cm',step:'0.5',min:1})}
          ${HT.ui.input({id:'m-j',label:'Junta',type:'number',value:p.j,unit:'cm',step:'0.1',min:0})}
        </div>
        <div class="ht-hint" style="margin-bottom:16px">Con estas medidas: <b class="ht-mono">${HT.fmt(R.pzM2,1)} pz/m²</b> y <b class="ht-mono">${HT.fmt(R.mortM2*1000,1)} L</b> de mortero por m².</div>
        <div class="ht-label" style="margin-bottom:8px">Muros</div>
        <div class="ht-rows">${R.muros.map((m,i)=>`<div class="ht-row" data-mid="${m.id}" style="grid-template-columns:1.6fr 1fr 1fr .7fr 1.1fr auto">
            <span class="ht-row__num">MURO ${i+1}</span>
            ${HT.ui.input({id:'mu-nombre-'+m.id,label:'Nombre / eje',value:m.nombre,placeholder:'Ej. Eje A, Fachada'})}
            ${HT.ui.input({id:'mu-largo-'+m.id,label:'Largo',type:'number',value:m.largo,unit:'m',step:'0.01',min:0,placeholder:'0.00'})}
            ${HT.ui.input({id:'mu-alto-'+m.id,label:'Alto',type:'number',value:m.alto,unit:'m',step:'0.01',min:0,placeholder:'0.00'})}
            ${HT.ui.input({id:'mu-cant-'+m.id,label:'Cant.',type:'number',value:m.cant,step:'1',min:0,inputmode:'numeric'})}
            <div class="ht-row__out"><small>Área</small><b>${HT.fmt(m.area,2)} m²</b></div>
            ${HT.ui.del()}
          </div>`).join('')}</div>
        <div style="margin:10px 0 18px">${HT.ui.add('Agregar muro')}</div>
        <div class="ht-label" style="margin-bottom:8px">Vanos a descontar <small>(puertas y ventanas)</small></div>
        <div class="ht-rows" id="m-vanos">${R.vanos.length?R.vanos.map((v,i)=>`<div class="ht-row" data-vid="${v.id}" style="grid-template-columns:1.6fr 1fr 1fr .7fr 1.1fr auto">
            <span class="ht-row__num">VANO ${i+1}</span>
            ${HT.ui.input({id:'va-nombre-'+v.id,label:'Tipo',value:v.nombre,placeholder:'Ej. Puerta, Ventana'})}
            ${HT.ui.input({id:'va-ancho-'+v.id,label:'Ancho',type:'number',value:v.ancho,unit:'m',step:'0.01',min:0,placeholder:'0.00'})}
            ${HT.ui.input({id:'va-alto-'+v.id,label:'Alto',type:'number',value:v.alto,unit:'m',step:'0.01',min:0,placeholder:'0.00'})}
            ${HT.ui.input({id:'va-cant-'+v.id,label:'Cant.',type:'number',value:v.cant,step:'1',min:0,inputmode:'numeric'})}
            <div class="ht-row__out"><small>Área</small><b>${HT.fmt(v.area,2)} m²</b></div>
            ${HT.ui.del()}
          </div>`).join(''):'<div class="ht-hint">Sin vanos. Si el muro tiene puertas o ventanas, agrégalas para no comprar de más.</div>'}</div>
        <div style="margin-top:10px"><button class="ht-add" type="button" data-addvano><svg class="ic"><use href="#i-plus"/></svg>Agregar vano</button></div>
      </div>
      <div class="ht-card ht-card--accent">
        <div class="ht-card__head"><div><h2 class="ht-card__title"><svg class="ic"><use href="#i-check-circle"/></svg>Resultado</h2><p class="ht-card__sub">${HT.esc(PIEZAS[S.pieza].t)} · mortero ${S.mezcla} · ${HT.num(S.despPz)}% desp. pieza · ${HT.num(S.despMort)}% desp. mortero</p></div></div>
        <div class="ht-kpis">
          ${HT.ui.kpi({lbl:'Área neta',val:HT.fmt(R.areaNeta,2),unit:'m²',sub:`${HT.fmt(R.areaBruta,2)} bruta − ${HT.fmt(R.areaVanos,2)} vanos`})}
          ${HT.ui.kpi({lbl:'Piezas a comprar',val:HT.fmt0(R.piezas),unit:'pzas',cls:'ht-kpi--primary',sub:`${HT.fmt(R.pzM2,1)} pz/m² + desperdicio`})}
          ${HT.ui.kpi({lbl:'Mortero',val:HT.fmt(R.mortero,2),unit:'m³',sub:'incluye desperdicio'})}
          ${HT.ui.kpi({lbl:'Cemento',val:HT.fmt0(R.bultos),unit:'bultos',sub:`${HT.fmt0(R.cemKg)} kg`})}
          ${HT.ui.kpi({lbl:'Arena',val:HT.fmt(R.arena,2),unit:'m³'})}
          ${HT.ui.kpi({lbl:'Mano de obra',val:HT.fmt(R.jornales,1),unit:'jornales',sub:`cuadrilla a ${HT.num(p.rend)} m²/día`})}
        </div>
      </div>
      ${HT.ui.assump({id:'m-asm',note:'Los rendimientos y proporciones son valores típicos. La cuadrilla considerada es 1 oficial + 1 ayudante por jornal de 8 h.',body:`
        <div class="ht-form ht-form--3">
          ${HT.ui.select({id:'m-mezcla',label:'Proporción de mortero (cemento:arena)',options:Object.keys(MORT).map(k=>({v:k,t:k})),value:S.mezcla})}
          ${HT.ui.input({id:'m-cem',label:'Cemento por m³ de mortero',type:'number',value:S.mort.cem,unit:'kg',step:'5',min:0})}
          ${HT.ui.input({id:'m-are',label:'Arena por m³ de mortero',type:'number',value:S.mort.are,unit:'m³',step:'0.01',min:0})}
          ${HT.ui.input({id:'m-desppz',label:'Desperdicio de piezas',type:'number',value:S.despPz,unit:'%',step:'0.5',min:0,hint:'5% block; 7-10% tabique'})}
          ${HT.ui.input({id:'m-despmort',label:'Desperdicio de mortero',type:'number',value:S.despMort,unit:'%',step:'1',min:0})}
          ${HT.ui.input({id:'m-rend',label:'Rendimiento de cuadrilla',type:'number',value:p.rend,unit:'m²/día',step:'0.5',min:0})}
          ${HT.ui.input({id:'m-bulto',label:'Peso del bulto',type:'number',value:S.bulto,unit:'kg',step:'1',min:1})}
        </div>`})}
      <div class="ht-actions">
        <button class="btn btn--ghost" id="m-nuevo"><svg class="ic"><use href="#i-refresh"/></svg>Nuevo cálculo</button>
        <button class="btn btn--accent" id="m-pdf"><svg class="ic"><use href="#i-download"/></svg>Descargar PDF</button>
      </div>`;
    bind();
  }
  function bind(){
    HT.bindAssump(root);
    const upd = () => { st.set(S); render(); };
    root.querySelector('#m-obra').addEventListener('input', ev => { S.obra=ev.target.value; st.set(S); });
    root.querySelector('#m-pieza').addEventListener('change', ev => { S.pieza=ev.target.value; S.pz={...PIEZAS[S.pieza]}; upd(); });
    ['L','H','E','j'].forEach(k => root.querySelector('#m-'+k).addEventListener('change', ev => { S.pz[k]=ev.target.value; upd(); }));
    root.querySelector('[data-add]').addEventListener('click', () => { S.muros.push(nuevoMuro()); upd(); });
    root.querySelector('[data-addvano]').addEventListener('click', () => { S.vanos.push(nuevoVano()); upd(); });
    const bindRows = (sel, arr, pref) => root.querySelectorAll(sel).forEach(row => {
      const id = row.dataset.mid || row.dataset.vid; const o = arr.find(x=>x.id===id);
      row.querySelector('[data-del]').addEventListener('click', () => { if (arr===S.muros && arr.length===1) { HT.toast('info','Necesitas al menos un muro',''); return; } const i = arr.findIndex(x=>x.id===id); arr.splice(i,1); upd(); });
      row.querySelectorAll('input').forEach(inp => inp.addEventListener('input', () => { o[inp.id.slice(pref.length, inp.id.length-id.length-1)] = inp.value; st.set(S); actualizar(); }));
    });
    bindRows('.ht-row[data-mid]', S.muros, 'mu-'); bindRows('.ht-row[data-vid]', S.vanos, 'va-');
    root.querySelector('#m-mezcla').addEventListener('change', ev => { S.mezcla=ev.target.value; S.mort={...MORT[S.mezcla]}; upd(); root.querySelector('#m-asm').classList.add('is-open'); });
    [['m-cem',['mort','cem']],['m-are',['mort','are']],['m-desppz',['despPz']],['m-despmort',['despMort']],['m-rend',['pz','rend']],['m-bulto',['bulto']]].forEach(([id,path]) => root.querySelector('#'+id).addEventListener('input', ev => { if (path.length===1) S[path[0]]=ev.target.value; else S[path[0]][path[1]]=ev.target.value; st.set(S); actualizar(); }));
    root.querySelector('#m-nuevo').addEventListener('click', async () => { if (await HT.confirm('¿Nuevo cálculo?','Se borrarán muros y vanos capturados.','Sí, empezar de cero')) { S=def(); st.set(S); render(); HT.toast('info','Nuevo cálculo',S.folio); } });
    root.querySelector('#m-pdf').addEventListener('click', pdf);
  }
  function actualizar(){
    const R = calc();
    R.muros.forEach(m => { const o = root.querySelector(`.ht-row[data-mid="${m.id}"] .ht-row__out b`); if (o) o.textContent = HT.fmt(m.area,2)+' m²'; });
    R.vanos.forEach(v => { const o = root.querySelector(`.ht-row[data-vid="${v.id}"] .ht-row__out b`); if (o) o.textContent = HT.fmt(v.area,2)+' m²'; });
    const card = root.querySelectorAll('.ht-card')[1]; if (!card) return;
    const p = S.pz;
    card.querySelector('.ht-card__sub').textContent = `${PIEZAS[S.pieza].t} · mortero ${S.mezcla} · ${HT.num(S.despPz)}% desp. pieza · ${HT.num(S.despMort)}% desp. mortero`;
    const k = card.querySelectorAll('.ht-kpi'); const set = (i,v,u,s) => { if (!k[i]) return; k[i].querySelector('.ht-kpi__val').innerHTML = v+(u?`<small>${u}</small>`:''); const ss = k[i].querySelector('.ht-kpi__sub'); if (ss && s!=null) ss.textContent = s; };
    set(0,HT.fmt(R.areaNeta,2),'m²',`${HT.fmt(R.areaBruta,2)} bruta − ${HT.fmt(R.areaVanos,2)} vanos`); set(1,HT.fmt0(R.piezas),'pzas',`${HT.fmt(R.pzM2,1)} pz/m² + desperdicio`); set(2,HT.fmt(R.mortero,2),'m³'); set(3,HT.fmt0(R.bultos),'bultos',`${HT.fmt0(R.cemKg)} kg`); set(4,HT.fmt(R.arena,2),'m³'); set(5,HT.fmt(R.jornales,1),'jornales',`cuadrilla a ${HT.num(p.rend)} m²/día`);
    const meta = root.querySelector('.ht-meta__txt'); if (meta) meta.textContent = `${HT.fmt(R.areaNeta,2)} m² netos`;
  }
  async function pdf(){
    const R = calc();
    if (R.areaNeta<=0) { HT.toast('error','Sin área','Captura largo y alto de al menos un muro.'); return; }
    if (!HT.vip('la calculadora de muros')) return;
    const ctx = await HT.pdf.nuevo({titulo:'Muros y albañilería · piezas, mortero y mano de obra', sub:S.obra?('Obra: '+S.obra):'', folio:S.folio});
    if (!ctx) return;
    HT.pdf.seccion(ctx,'Pieza');
    HT.pdf.kv(ctx,[['Tipo',PIEZAS[S.pieza].t],['Medidas',`${HT.num(S.pz.L)} × ${HT.num(S.pz.H)} cm · espesor ${HT.num(S.pz.E)} cm · junta ${HT.num(S.pz.j)} cm`],['Piezas por m²',HT.fmt(R.pzM2,2)],['Mortero por m²',HT.fmt(R.mortM2*1000,1)+' L']]);
    HT.pdf.seccion(ctx,'Muros');
    HT.pdf.tabla(ctx,{head:['#','Muro / eje','Largo (m)','Alto (m)','Cant.','Área (m²)'],widths:[.5,2.2,1,1,.7,1],align:['center','left','right','right','right','right'],
      body:R.muros.map((m,i)=>[i+1,m.nombre||'—',HT.fmt(HT.num(m.largo),2),HT.fmt(HT.num(m.alto),2),HT.fmt0(HT.num(m.cant)),HT.fmt(m.area,2)]), total:['','ÁREA BRUTA','','','',HT.fmt(R.areaBruta,2)]});
    if (R.vanos.length) { HT.pdf.seccion(ctx,'Vanos descontados');
      HT.pdf.tabla(ctx,{head:['#','Vano','Ancho (m)','Alto (m)','Cant.','Área (m²)'],widths:[.5,2.2,1,1,.7,1],align:['center','left','right','right','right','right'],
        body:R.vanos.map((v,i)=>[i+1,v.nombre||'—',HT.fmt(HT.num(v.ancho),2),HT.fmt(HT.num(v.alto),2),HT.fmt0(HT.num(v.cant)),HT.fmt(v.area,2)]), total:['','TOTAL VANOS','','','',HT.fmt(R.areaVanos,2)]}); }
    HT.pdf.seccion(ctx,'Resultado');
    HT.pdf.tabla(ctx,{head:['Concepto','Cantidad','Detalle'],widths:[1.2,1,2],align:['left','right','left'],body:[
      ['Área neta de muro',HT.fmt(R.areaNeta,2)+' m²',`${HT.fmt(R.areaBruta,2)} m² bruta − ${HT.fmt(R.areaVanos,2)} m² de vanos`],
      ['Piezas a comprar',HT.fmt0(R.piezas)+' pzas',`${HT.fmt(R.pzM2,2)} pz/m² + ${HT.num(S.despPz)}% desperdicio`],
      ['Mortero '+S.mezcla,HT.fmt(R.mortero,2)+' m³',`+ ${HT.num(S.despMort)}% desperdicio`],
      ['Cemento',HT.fmt0(R.bultos)+' bultos',`${HT.fmt0(R.cemKg)} kg · bulto de ${HT.num(S.bulto)} kg`],
      ['Arena',HT.fmt(R.arena,2)+' m³',''],
      ['Mano de obra',HT.fmt(R.jornales,1)+' jornales',`cuadrilla (oficial + ayudante) a ${HT.num(S.pz.rend)} m²/día`]]});
    HT.pdf.parrafo(ctx,'Nota: no incluye castillos, dalas, cerramientos ni aplanados. Los rendimientos varían con la altura del muro, el clima y la experiencia de la cuadrilla.',7.5,HT.GRAY);
    HT.pdf.guardar(ctx,'muros-'+S.folio+'.pdf');
  }
  function mount(container){
    HT.icons(); S = st.get(null) || def(); if (!S.folio) S.folio = HT.folio('MUR');
    root = HT.shell(container,{icon:'i-wall',titulo:'Muros y albañilería',sub:'Piezas, mortero, cemento, arena y jornales por m² de muro'});
    render();
  }
  return { mount };
})();

/* ═══════════════════════════════════════════════════════════════════
   4 · RETENCIONES EN ESTIMACIONES (OBRA PÚBLICA)
   ═══════════════════════════════════════════════════════════════════ */
Tools.retenciones = (function(){
  const st = HT.store('retenciones');
  const nuevaEst = n => ({id:HT.uid(), num:n, periodo:'', importe:''});
  const def = () => ({folio:HT.folio('EST'), obra:'', contratista:'', contrato:'', monto:'', anticipo:30, iva:16, r5:true, tasa5:0.5, r2:false, tasa2:0.2, fg:0, otras:0, ests:[nuevaEst(1)]});
  let S=null, root=null;

  function calcEst(e){
    const imp = Math.max(0,HT.num(e.importe));
    const amort = imp*HT.num(S.anticipo)/100;
    const sub = imp-amort;
    const iva = sub*HT.num(S.iva)/100;
    const totalFact = sub+iva;
    const r5 = S.r5 ? imp*HT.num(S.tasa5)/100 : 0;
    const r2 = S.r2 ? imp*HT.num(S.tasa2)/100 : 0;
    const fg = imp*HT.num(S.fg)/100;
    const otras = HT.num(S.otras);
    const neto = totalFact - r5 - r2 - fg - otras;
    return {imp, amort, sub, iva, totalFact, r5, r2, fg, otras, neto};
  }
  function calc(){
    const filas = S.ests.map(e => ({...e, r:calcEst(e)}));
    const sum = k => filas.reduce((a,f)=>a+f.r[k],0);
    const T = {imp:sum('imp'),amort:sum('amort'),sub:sum('sub'),iva:sum('iva'),totalFact:sum('totalFact'),r5:sum('r5'),r2:sum('r2'),fg:sum('fg'),otras:sum('otras'),neto:sum('neto')};
    const monto = HT.num(S.monto); const avance = monto>0 ? T.imp/monto*100 : 0;
    const antTotal = monto*HT.num(S.anticipo)/100; const antPend = Math.max(0, antTotal - T.amort);
    return {filas, T, monto, avance, antTotal, antPend};
  }
  function render(){
    const R = calc();
    root.innerHTML = `
      <div class="ht-meta"><span class="ht-folio">${S.folio}</span><span class="ht-meta__txt">${R.filas.length} estimación${R.filas.length!==1?'es':''} · neto ${HT.money(R.T.neto)}</span></div>
      <div class="ht-card">
        <div class="ht-card__head"><div><h2 class="ht-card__title"><svg class="ic"><use href="#i-percent"/></svg>Datos del contrato</h2><p class="ht-card__sub">Los porcentajes se aplican a todas las estimaciones capturadas abajo.</p></div></div>
        <div class="ht-form">
          ${HT.ui.input({id:'r-obra',label:'Obra',value:S.obra,placeholder:'Ej. Pavimentación calle Hidalgo'})}
          ${HT.ui.input({id:'r-contratista',label:'Contratista',value:S.contratista,placeholder:'Razón social'})}
          ${HT.ui.input({id:'r-contrato',label:'No. de contrato',value:S.contrato,placeholder:'Ej. MTP-OP-2026-014'})}
          ${HT.ui.input({id:'r-monto',label:'Monto del contrato (sin IVA)',type:'number',value:S.monto,unit:'MXN',step:'0.01',min:0,placeholder:'0.00',hint:'Opcional · para calcular % de avance y anticipo pendiente'})}
        </div>
        <div class="ht-form ht-form--4" style="margin-top:14px">
          ${HT.ui.input({id:'r-anticipo',label:'Anticipo otorgado',type:'number',value:S.anticipo,unit:'%',step:'1',min:0,max:100,hint:'Se amortiza proporcionalmente en cada estimación'})}
          ${HT.ui.input({id:'r-iva',label:'IVA',type:'number',value:S.iva,unit:'%',step:'1',min:0,hint:'16% general · 8% en franja fronteriza'})}
          ${HT.ui.input({id:'r-fg',label:'Fondo de garantía',type:'number',value:S.fg,unit:'%',step:'0.5',min:0,hint:'Solo si el contrato lo estipula (usualmente 0 o 5%)'})}
          ${HT.ui.input({id:'r-otras',label:'Otras deducciones',type:'number',value:S.otras,unit:'MXN',step:'0.01',min:0,hint:'Por estimación · sanciones, suministros, etc.'})}
        </div>
        <div class="ht-form" style="margin-top:14px">
          <div class="ht-field"><div class="ht-inline">${HT.ui.toggle({id:'r-r5',label:'Retención 5 al millar',checked:S.r5})}<div class="ht-inwrap" style="max-width:130px"><input class="ht-input" id="r-tasa5" type="number" step="0.1" min="0" value="${S.tasa5}" inputmode="decimal"><span class="ht-unit">%</span></div></div><div class="ht-hint">Inspección y vigilancia (art. 191 LFD) · obra pública federal y la mayoría de las estatales</div></div>
          <div class="ht-field"><div class="ht-inline">${HT.ui.toggle({id:'r-r2',label:'Retención 2 al millar',checked:S.r2})}<div class="ht-inwrap" style="max-width:130px"><input class="ht-input" id="r-tasa2" type="number" step="0.1" min="0" value="${S.tasa2}" inputmode="decimal"><span class="ht-unit">%</span></div></div><div class="ht-hint">Capacitación ICIC · aplica según entidad y contrato</div></div>
        </div>
      </div>
      <div class="ht-card">
        <div class="ht-card__head"><div><h2 class="ht-card__title"><svg class="ic"><use href="#i-clipboard-check"/></svg>Estimaciones</h2><p class="ht-card__sub">Importe de cada estimación antes de IVA y sin descontar el anticipo.</p></div></div>
        <div class="ht-rows">${R.filas.map((e,i)=>`<div class="ht-row" data-id="${e.id}" style="grid-template-columns:.6fr 1.6fr 1.3fr 1.4fr auto">
            <span class="ht-row__num">EST. ${e.num}</span>
            ${HT.ui.input({id:'es-num-'+e.id,label:'No.',type:'number',value:e.num,step:'1',min:1,inputmode:'numeric'})}
            ${HT.ui.input({id:'es-periodo-'+e.id,label:'Periodo',value:e.periodo,placeholder:'Ej. 01-15 mar 2026'})}
            ${HT.ui.input({id:'es-importe-'+e.id,label:'Importe (sin IVA)',type:'number',value:e.importe,unit:'MXN',step:'0.01',min:0,placeholder:'0.00'})}
            <div class="ht-row__out"><small>Neto a cobrar</small><b>${HT.money(e.r.neto)}</b></div>
            ${HT.ui.del()}
          </div>`).join('')}</div>
        <div style="margin-top:12px">${HT.ui.add('Agregar estimación')}</div>
      </div>
      <div class="ht-card ht-card--accent">
        <div class="ht-card__head"><div><h2 class="ht-card__title"><svg class="ic"><use href="#i-check-circle"/></svg>Resultado</h2><p class="ht-card__sub">Desglose por estimación y acumulado</p></div></div>
        <div class="ht-kpis">
          ${HT.ui.kpi({lbl:'Importe estimado',val:HT.money(R.T.imp),sub:R.monto>0?`${HT.pct(R.avance,1)} del contrato`:'acumulado'})}
          ${HT.ui.kpi({lbl:'Neto a cobrar',val:HT.money(R.T.neto),cls:'ht-kpi--primary',sub:'acumulado'})}
          ${HT.ui.kpi({lbl:'Amortizado',val:HT.money(R.T.amort),sub:R.monto>0?`pendiente ${HT.money(R.antPend)}`:`${HT.num(S.anticipo)}% del importe`})}
          ${HT.ui.kpi({lbl:'Retenciones',val:HT.money(R.T.r5+R.T.r2+R.T.fg+R.T.otras),sub:'5 al millar + 2 al millar + garantía + otras'})}
        </div>
        <div style="margin-top:14px">${HT.ui.table({head:['Est.','Importe','− Amortización','Subtotal','+ IVA','Total factura','− 5 al millar','− 2 al millar','− Garantía','− Otras','Neto'],numCols:[1,2,3,4,5,6,7,8,9,10],
          rows:R.filas.map(f=>[f.num,HT.money(f.r.imp),HT.money(f.r.amort),HT.money(f.r.sub),HT.money(f.r.iva),HT.money(f.r.totalFact),HT.money(f.r.r5),HT.money(f.r.r2),HT.money(f.r.fg),HT.money(f.r.otras),HT.money(f.r.neto)]),
          totalRow:['Total',HT.money(R.T.imp),HT.money(R.T.amort),HT.money(R.T.sub),HT.money(R.T.iva),HT.money(R.T.totalFact),HT.money(R.T.r5),HT.money(R.T.r2),HT.money(R.T.fg),HT.money(R.T.otras),HT.money(R.T.neto)]})}</div>
        <div style="margin-top:12px">${HT.ui.note('Criterio aplicado: la amortización del anticipo se descuenta del importe <b>antes</b> de calcular el IVA; las retenciones al millar se calculan sobre el importe de la estimación sin descontar la amortización. Si tu contrato o tu dependencia usa otro criterio, ajusta los porcentajes.')}</div>
      </div>
      <div class="ht-actions">
        <button class="btn btn--ghost" id="r-nuevo"><svg class="ic"><use href="#i-refresh"/></svg>Nuevo</button>
        <button class="btn btn--accent" id="r-pdf"><svg class="ic"><use href="#i-download"/></svg>Descargar PDF</button>
      </div>`;
    bind();
  }
  function bind(){
    const soft = (id,k) => root.querySelector('#'+id).addEventListener('input', ev => { S[k]=ev.target.value; st.set(S); actualizar(); });
    [['r-obra','obra'],['r-contratista','contratista'],['r-contrato','contrato'],['r-monto','monto'],['r-anticipo','anticipo'],['r-iva','iva'],['r-fg','fg'],['r-otras','otras'],['r-tasa5','tasa5'],['r-tasa2','tasa2']].forEach(([id,k])=>soft(id,k));
    root.querySelector('#r-r5').addEventListener('change', ev => { S.r5=ev.target.checked; st.set(S); actualizar(); });
    root.querySelector('#r-r2').addEventListener('change', ev => { S.r2=ev.target.checked; st.set(S); actualizar(); });
    root.querySelector('[data-add]').addEventListener('click', () => { S.ests.push(nuevaEst(S.ests.length+1)); st.set(S); render(); });
    root.querySelectorAll('.ht-row').forEach(row => {
      const id = row.dataset.id; const e = S.ests.find(x=>x.id===id);
      row.querySelector('[data-del]').addEventListener('click', () => { if (S.ests.length===1) { HT.toast('info','Necesitas al menos una estimación',''); return; } S.ests=S.ests.filter(x=>x.id!==id); st.set(S); render(); });
      row.querySelectorAll('input').forEach(inp => inp.addEventListener('input', () => { e[inp.id.slice(3, inp.id.length-id.length-1)] = inp.value; st.set(S); actualizar(); }));
    });
    root.querySelector('#r-nuevo').addEventListener('click', async () => { if (await HT.confirm('¿Empezar de nuevo?','Se borrarán las estimaciones capturadas.','Sí, empezar de cero')) { S=def(); st.set(S); render(); } });
    root.querySelector('#r-pdf').addEventListener('click', pdf);
  }
  function actualizar(){
    const R = calc();
    R.filas.forEach(f => { const o = root.querySelector(`.ht-row[data-id="${f.id}"] .ht-row__out b`); if (o) o.textContent = HT.money(f.r.neto); });
    const card = root.querySelectorAll('.ht-card')[2]; if (!card) return;
    const k = card.querySelectorAll('.ht-kpi'); const set=(i,v,s)=>{ if(!k[i])return; k[i].querySelector('.ht-kpi__val').textContent=v; const ss=k[i].querySelector('.ht-kpi__sub'); if(ss&&s!=null) ss.textContent=s; };
    set(0,HT.money(R.T.imp),R.monto>0?`${HT.pct(R.avance,1)} del contrato`:'acumulado'); set(1,HT.money(R.T.neto),'acumulado'); set(2,HT.money(R.T.amort),R.monto>0?`pendiente ${HT.money(R.antPend)}`:`${HT.num(S.anticipo)}% del importe`); set(3,HT.money(R.T.r5+R.T.r2+R.T.fg+R.T.otras));
    const tb = card.querySelector('tbody'); if (tb) tb.innerHTML = R.filas.map(f=>`<tr><td>${f.num}</td>${[f.r.imp,f.r.amort,f.r.sub,f.r.iva,f.r.totalFact,f.r.r5,f.r.r2,f.r.fg,f.r.otras,f.r.neto].map(v=>`<td class="num">${HT.money(v)}</td>`).join('')}</tr>`).join('') + `<tr class="is-total"><td>Total</td>${[R.T.imp,R.T.amort,R.T.sub,R.T.iva,R.T.totalFact,R.T.r5,R.T.r2,R.T.fg,R.T.otras,R.T.neto].map(v=>`<td class="num">${HT.money(v)}</td>`).join('')}</tr>`;
    const meta = root.querySelector('.ht-meta__txt'); if (meta) meta.textContent = `${R.filas.length} estimación${R.filas.length!==1?'es':''} · neto ${HT.money(R.T.neto)}`;
  }
  async function pdf(){
    const R = calc();
    if (R.T.imp<=0) { HT.toast('error','Sin importes','Captura el importe de al menos una estimación.'); return; }
    if (!HT.vip('el cálculo de retenciones')) return;
    const ctx = await HT.pdf.nuevo({titulo:'Estimaciones · amortización, IVA y retenciones', sub:S.obra?('Obra: '+S.obra):'', folio:S.folio, landscape:true});
    if (!ctx) return;
    HT.pdf.seccion(ctx,'Contrato');
    HT.pdf.kv(ctx,[['Contratista',S.contratista||'—'],['Contrato',S.contrato||'—'],['Monto (sin IVA)',R.monto>0?HT.money(R.monto):'—'],['Anticipo',HT.num(S.anticipo)+' %'],['IVA',HT.num(S.iva)+' %'],['5 al millar',S.r5?HT.num(S.tasa5)+' %':'no aplica'],['2 al millar',S.r2?HT.num(S.tasa2)+' %':'no aplica'],['Fondo de garantía',HT.num(S.fg)+' %'],['Otras deducciones',HT.money(HT.num(S.otras))+' por estimación']],3);
    HT.pdf.seccion(ctx,'Desglose por estimación');
    const m = v => HT.money(v);
    HT.pdf.tabla(ctx,{head:['Est.','Periodo','Importe','− Amortización','Subtotal','+ IVA','Total factura','− 5 al millar','− 2 al millar','− Garantía','− Otras','Neto a cobrar'],widths:[.5,1.3,1.1,1.1,1.1,1,1.1,1,1,1,.9,1.2],align:['center','left','right','right','right','right','right','right','right','right','right','right'],fontSize:7.2,
      body:R.filas.map(f=>[f.num,f.periodo||'—',m(f.r.imp),m(f.r.amort),m(f.r.sub),m(f.r.iva),m(f.r.totalFact),m(f.r.r5),m(f.r.r2),m(f.r.fg),m(f.r.otras),m(f.r.neto)]),
      total:['','TOTAL',m(R.T.imp),m(R.T.amort),m(R.T.sub),m(R.T.iva),m(R.T.totalFact),m(R.T.r5),m(R.T.r2),m(R.T.fg),m(R.T.otras),m(R.T.neto)]});
    if (R.monto>0) { HT.pdf.seccion(ctx,'Avance del contrato'); HT.pdf.kv(ctx,[['Estimado acumulado',m(R.T.imp)+' ('+HT.pct(R.avance,2)+')'],['Por estimar',m(Math.max(0,R.monto-R.T.imp))],['Anticipo total',m(R.antTotal)],['Anticipo amortizado',m(R.T.amort)],['Anticipo pendiente',m(R.antPend)]],3); }
    HT.pdf.parrafo(ctx,'Criterio: amortización = importe × % anticipo, descontada antes del IVA. Retenciones al millar y fondo de garantía calculados sobre el importe de la estimación sin descontar amortización. Verifica el criterio de tu dependencia contratante.',7.5,HT.GRAY);
    HT.pdf.guardar(ctx,'estimaciones-'+S.folio+'.pdf');
  }
  function mount(container){
    HT.icons(); S = st.get(null) || def(); if (!S.folio) S.folio = HT.folio('EST');
    root = HT.shell(container,{icon:'i-percent',titulo:'Retenciones en estimaciones',sub:'Amortización de anticipo, IVA, 5 y 2 al millar, garantía y neto a cobrar'});
    render();
  }
  return { mount };
})();

/* ═══════════════════════════════════════════════════════════════════
   5 · CURVA S · avance programado vs real
   ═══════════════════════════════════════════════════════════════════ */
Tools.curvas = (function(){
  const st = HT.store('curvas');
  const UNID = {semana:'Semana', quincena:'Quincena', mes:'Mes'};
  const def = () => ({folio:HT.folio('CRV'), obra:'', contratista:'', monto:'', unidad:'semana', n:12, modo:'pct', inicio:HT.today(), p:Array.from({length:12},()=>({prog:'',real:''}))});
  let S=null, root=null;

  function calc(){
    const monto = HT.num(S.monto); const esPct = S.modo==='pct';
    let pa=0, ra=0; let ultimoReal = -1;
    const filas = periodos().map((r,i) => {
      const prog = HT.num(r.prog), real = HT.num(r.real);
      const progPct = esPct ? prog : (monto>0 ? prog/monto*100 : 0);
      const realPct = esPct ? real : (monto>0 ? real/monto*100 : 0);
      const tieneReal = String(r.real).trim()!=='';
      if (tieneReal) ultimoReal = i;
      pa += progPct; ra += realPct;
      return {i, n:i+1, prog:progPct, real:realPct, pa, ra, tieneReal, progM: monto*progPct/100, realM: monto*realPct/100, paM: monto*pa/100, raM: monto*ra/100};
    });
    const corte = ultimoReal>=0 ? filas[ultimoReal] : null;
    const desv = corte ? corte.ra - corte.pa : 0;
    let estado = {t:'Sin avance real capturado', cls:'neutral'};
    if (corte) {
      if (desv >= -0.5) estado = {t:'Al día', cls:'ok'};
      else if (desv > -5) estado = {t:'Atraso leve', cls:'warn'};
      else if (desv > -15) estado = {t:'Atraso', cls:'warn'};
      else estado = {t:'Atraso crítico', cls:'bad'};
    }
    const totalProg = filas.length ? filas[filas.length-1].pa : 0;
    return {filas, corte, desv, estado, monto, totalProg};
  }
  /* Gráfica SVG (responsiva por viewBox) */
  function svg(R){
    const W=720, H=300, L=44, Rt=14, T=14, B=34; const n = R.filas.length;
    const x = i => L + (n>1 ? i*(W-L-Rt)/(n-1) : 0);
    const y = v => T + (H-T-B)*(1 - HT.clamp(v,0,100)/100);
    const grid = [0,25,50,75,100].map(v => `<line class="grid" x1="${L}" y1="${y(v)}" x2="${W-Rt}" y2="${y(v)}"/><text x="${L-6}" y="${y(v)+3.5}" text-anchor="end">${v}%</text>`).join('');
    const pts = arr => arr.map((v,i)=>`${x(i)},${y(v)}`).join(' ');
    const progPts = pts(R.filas.map(f=>f.pa));
    const realArr = R.filas.filter(f=>f.tieneReal).map(f=>f.ra); const realN = realArr.length;
    const realPts = realArr.map((v,i)=>`${x(i)},${y(v)}`).join(' ');
    const area = realN ? `M${x(0)},${y(0)} ` + realArr.map((v,i)=>`L${x(i)},${y(v)}`).join(' ') + ` L${x(realN-1)},${y(0)} Z` : '';
    const labels = R.filas.map((f,i) => (n<=16 || i%Math.ceil(n/12)===0 || i===n-1) ? `<text x="${x(i)}" y="${H-B+16}" text-anchor="middle">${UNID[S.unidad][0]}${f.n}</text>` : '').join('');
    const dots = realArr.map((v,i)=>`<circle class="p-real" cx="${x(i)}" cy="${y(v)}" r="3.5"/>`).join('') + R.filas.map((f,i)=>`<circle class="p-prog" cx="${x(i)}" cy="${y(f.pa)}" r="2.2"/>`).join('');
    return `<svg class="ht-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Curva S">
      ${grid}<line class="grid" x1="${L}" y1="${T}" x2="${L}" y2="${H-B}"/>
      ${area?`<path class="a-real" d="${area}"/>`:''}
      <polyline class="l-prog" points="${progPts}"/>
      ${realN?`<polyline class="l-real" points="${realPts}"/>`:''}
      ${dots}${labels}
    </svg>
    <div class="ht-legend"><span><i class="prog"></i>Programado acumulado</span><span><i class="real"></i>Real acumulado</span></div>`;
  }
  function render(){
    const R = calc(); const esPct = S.modo==='pct';
    root.innerHTML = `
      <div class="ht-meta"><span class="ht-folio">${S.folio}</span><span class="ht-meta__txt">${R.filas.length} ${UNID[S.unidad].toLowerCase()}s · programa ${HT.pct(R.totalProg,1)}</span></div>
      <div class="ht-card">
        <div class="ht-card__head"><div><h2 class="ht-card__title"><svg class="ic"><use href="#i-trend"/></svg>Programa de obra</h2><p class="ht-card__sub">Captura el avance de cada periodo (no el acumulado); la herramienta lo acumula y compara.</p></div></div>
        <div class="ht-form ht-form--3">
          ${HT.ui.input({id:'s-obra',label:'Obra',value:S.obra,placeholder:'Ej. Puente vehicular km 4+200'})}
          ${HT.ui.input({id:'s-contratista',label:'Contratista / residente',value:S.contratista,placeholder:'Opcional'})}
          ${HT.ui.input({id:'s-monto',label:'Monto del contrato',type:'number',value:S.monto,unit:'MXN',step:'0.01',min:0,placeholder:'0.00',hint:'Necesario si capturas en pesos'})}
          ${HT.ui.select({id:'s-unidad',label:'Periodo',options:Object.entries(UNID).map(([v,t])=>({v,t})),value:S.unidad})}
          ${HT.ui.input({id:'s-n',label:'Número de periodos',type:'number',value:S.n,step:'1',min:1,max:120,inputmode:'numeric'})}
          <div class="ht-field"><label class="ht-label">Capturar en</label>${HT.ui.seg({id:'s-modo',options:[{v:'pct',t:'% de avance'},{v:'mxn',t:'Pesos (MXN)'}],value:S.modo})}</div>
        </div>
      </div>
      <div class="ht-card">
        <div class="ht-card__head"><div><h2 class="ht-card__title"><svg class="ic"><use href="#i-calendar"/></svg>Avance por periodo</h2><p class="ht-card__sub">Deja vacío el <b>real</b> de los periodos que aún no ocurren. El acumulado se calcula solo.</p></div></div>
        <div class="ht-tablewrap"><table class="ht-table" id="s-tabla"><thead><tr><th>${UNID[S.unidad]}</th><th class="num">Programado ${esPct?'%':'MXN'}</th><th class="num">Real ${esPct?'%':'MXN'}</th><th class="num">Prog. acum.</th><th class="num">Real acum.</th><th class="num">Desviación</th></tr></thead>
          <tbody>${R.filas.map(f=>`<tr data-i="${f.i}">
            <td><b>${f.n}</b></td>
            <td class="num"><input class="ht-input" style="min-height:40px;padding:6px 10px;text-align:right;min-width:110px" type="number" step="0.01" min="0" inputmode="decimal" data-k="prog" value="${HT.esc(S.p[f.i].prog)}" placeholder="0"></td>
            <td class="num"><input class="ht-input" style="min-height:40px;padding:6px 10px;text-align:right;min-width:110px" type="number" step="0.01" min="0" inputmode="decimal" data-k="real" value="${HT.esc(S.p[f.i].real)}" placeholder="—"></td>
            <td class="num" data-pa>${HT.pct(f.pa,1)}</td><td class="num" data-ra>${f.tieneReal?HT.pct(f.ra,1):'<span class="muted">—</span>'}</td>
            <td class="num" data-dv>${f.tieneReal?`<span class="ht-chip ${f.ra-f.pa>=-0.5?'ht-chip--ok':(f.ra-f.pa>-5?'ht-chip--warn':'ht-chip--bad')}">${(f.ra-f.pa>=0?'+':'')+HT.pct(f.ra-f.pa,1)}</span>`:'<span class="muted">—</span>'}</td>
          </tr>`).join('')}</tbody></table></div>
        ${Math.abs(R.totalProg-100)>0.5 ? '<div style="margin-top:10px">'+HT.ui.note(`El programa acumulado suma <b>${HT.pct(R.totalProg,1)}</b>. Para una curva S completa debe llegar a 100% en el último periodo.`, true)+'</div>' : ''}
      </div>
      <div class="ht-card ht-card--accent">
        <div class="ht-card__head"><div><h2 class="ht-card__title"><svg class="ic"><use href="#i-check-circle"/></svg>Curva S</h2><p class="ht-card__sub">${R.corte?`Corte al periodo ${R.corte.n}`:'Captura avance real para ver el corte'}</p></div>
          <span class="ht-chip ht-chip--${R.estado.cls}">${R.estado.t}</span></div>
        <div class="ht-kpis">
          ${HT.ui.kpi({lbl:'Programado al corte',val:R.corte?HT.pct(R.corte.pa,1):'—',sub:R.corte&&R.monto>0?HT.money(R.corte.paM):''})}
          ${HT.ui.kpi({lbl:'Real al corte',val:R.corte?HT.pct(R.corte.ra,1):'—',cls:'ht-kpi--primary',sub:R.corte&&R.monto>0?HT.money(R.corte.raM):''})}
          ${HT.ui.kpi({lbl:'Desviación',val:R.corte?((R.desv>=0?'+':'')+HT.pct(R.desv,1)):'—',cls:R.corte?('ht-kpi--'+R.estado.cls):'',sub:R.corte&&R.monto>0?HT.money(R.monto*R.desv/100):'real − programado'})}
          ${HT.ui.kpi({lbl:'Por ejecutar',val:R.corte?HT.pct(100-R.corte.ra,1):HT.pct(100,0),sub:R.monto>0?HT.money(R.monto*(100-(R.corte?R.corte.ra:0))/100):''})}
        </div>
        <div style="margin-top:14px" id="s-chart">${svg(R)}</div>
      </div>
      <div class="ht-actions">
        <button class="btn btn--ghost" id="s-nuevo"><svg class="ic"><use href="#i-refresh"/></svg>Nuevo</button>
        <button class="btn btn--accent" id="s-pdf"><svg class="ic"><use href="#i-download"/></svg>Descargar PDF</button>
      </div>`;
    bind();
  }
  function ajustarN(){ const n = HT.clamp(Math.round(HT.num(S.n))||1,1,120); S.n=n; while (S.p.length<n) S.p.push({prog:'',real:''}); }
  const periodos = () => S.p.slice(0, HT.clamp(Math.round(HT.num(S.n))||1,1,120));
  function bind(){
    [['s-obra','obra'],['s-contratista','contratista'],['s-monto','monto']].forEach(([id,k]) => root.querySelector('#'+id).addEventListener('input', ev => { S[k]=ev.target.value; st.set(S); if (k==='monto') actualizar(); }));
    root.querySelector('#s-unidad').addEventListener('change', ev => { S.unidad=ev.target.value; st.set(S); render(); });
    root.querySelector('#s-n').addEventListener('change', ev => { S.n=ev.target.value; ajustarN(); st.set(S); render(); });
    HT.bindSeg(root,'s-modo', v => { S.modo=v; st.set(S); render(); });
    root.querySelectorAll('#s-tabla input').forEach(inp => inp.addEventListener('input', () => { const i = +inp.closest('tr').dataset.i; S.p[i][inp.dataset.k] = inp.value; st.set(S); actualizar(); }));
    root.querySelector('#s-nuevo').addEventListener('click', async () => { if (await HT.confirm('¿Nuevo programa?','Se borrará el avance capturado.','Sí, empezar de cero')) { S=def(); st.set(S); render(); } });
    root.querySelector('#s-pdf').addEventListener('click', pdf);
  }
  function actualizar(){
    const R = calc();
    R.filas.forEach(f => { const tr = root.querySelector(`#s-tabla tr[data-i="${f.i}"]`); if (!tr) return;
      tr.querySelector('[data-pa]').textContent = HT.pct(f.pa,1);
      tr.querySelector('[data-ra]').innerHTML = f.tieneReal?HT.pct(f.ra,1):'<span class="muted">—</span>';
      tr.querySelector('[data-dv]').innerHTML = f.tieneReal?`<span class="ht-chip ${f.ra-f.pa>=-0.5?'ht-chip--ok':(f.ra-f.pa>-5?'ht-chip--warn':'ht-chip--bad')}">${(f.ra-f.pa>=0?'+':'')+HT.pct(f.ra-f.pa,1)}</span>`:'<span class="muted">—</span>'; });
    const card = root.querySelectorAll('.ht-card')[2]; if (!card) return;
    card.querySelector('.ht-card__sub').textContent = R.corte?`Corte al periodo ${R.corte.n}`:'Captura avance real para ver el corte';
    const chip = card.querySelector('.ht-card__head .ht-chip'); chip.className = 'ht-chip ht-chip--'+R.estado.cls; chip.textContent = R.estado.t;
    const k = card.querySelectorAll('.ht-kpi'); const set=(i,v,s,cls)=>{ if(!k[i])return; k[i].querySelector('.ht-kpi__val').textContent=v; const ss=k[i].querySelector('.ht-kpi__sub'); if(ss) ss.textContent=s||''; if(cls!=null) k[i].className='ht-kpi '+cls; };
    set(0,R.corte?HT.pct(R.corte.pa,1):'—',R.corte&&R.monto>0?HT.money(R.corte.paM):''); set(1,R.corte?HT.pct(R.corte.ra,1):'—',R.corte&&R.monto>0?HT.money(R.corte.raM):'');
    set(2,R.corte?((R.desv>=0?'+':'')+HT.pct(R.desv,1)):'—',R.corte&&R.monto>0?HT.money(R.monto*R.desv/100):'real − programado',R.corte?('ht-kpi--'+R.estado.cls):'');
    set(3,R.corte?HT.pct(100-R.corte.ra,1):HT.pct(100,0),R.monto>0?HT.money(R.monto*(100-(R.corte?R.corte.ra:0))/100):'');
    root.querySelector('#s-chart').innerHTML = svg(R);
    const meta = root.querySelector('.ht-meta__txt'); if (meta) meta.textContent = `${R.filas.length} ${UNID[S.unidad].toLowerCase()}s · programa ${HT.pct(R.totalProg,1)}`;
    const nota = root.querySelectorAll('.ht-card')[1].querySelector('.ht-note'); const warn = Math.abs(R.totalProg-100)>0.5;
    if (nota && !warn) nota.parentElement.remove(); else if (!nota && warn) root.querySelectorAll('.ht-card')[1].insertAdjacentHTML('beforeend','<div style="margin-top:10px">'+HT.ui.note(`El programa acumulado suma <b>${HT.pct(R.totalProg,1)}</b>. Para una curva S completa debe llegar a 100% en el último periodo.`, true)+'</div>');
    else if (nota && warn) nota.querySelector('div').innerHTML = `El programa acumulado suma <b>${HT.pct(R.totalProg,1)}</b>. Para una curva S completa debe llegar a 100% en el último periodo.`;
  }
  /* Gráfica dibujada con primitivas de jsPDF (sin html2canvas) */
  function pdfChart(ctx, R){
    const {pdf, M, W} = ctx; const cw = W-2*M, ch = 70; HT.pdf.salto(ctx, ch+12);
    const x0 = M+12, y0 = ctx.y+ch-8, pw = cw-16, ph = ch-14; const n = R.filas.length;
    const X = i => x0 + (n>1 ? i*pw/(n-1) : 0), Y = v => y0 - ph*HT.clamp(v,0,100)/100;
    pdf.setDrawColor(225,225,225); pdf.setLineWidth(.2);
    [0,25,50,75,100].forEach(v => { pdf.line(x0, Y(v), x0+pw, Y(v)); pdf.setFontSize(6.5); pdf.setTextColor(...HT.GRAY); pdf.text(v+'%', x0-2, Y(v)+1, {align:'right'}); });
    pdf.setDrawColor(...HT.GRAY); pdf.setLineWidth(.5); pdf.setLineDashPattern([1.2,1],0);
    for (let i=1;i<n;i++) pdf.line(X(i-1),Y(R.filas[i-1].pa),X(i),Y(R.filas[i].pa));
    pdf.setLineDashPattern([],0);
    const reales = R.filas.filter(f=>f.tieneReal);
    pdf.setDrawColor(...HT.PRIMARY); pdf.setLineWidth(.9);
    for (let i=1;i<reales.length;i++) pdf.line(X(i-1),Y(reales[i-1].ra),X(i),Y(reales[i].ra));
    pdf.setFillColor(...HT.PRIMARY); reales.forEach((f,i) => pdf.circle(X(i),Y(f.ra),.9,'F'));
    pdf.setFontSize(6.5); pdf.setTextColor(...HT.GRAY);
    R.filas.forEach((f,i) => { if (n<=20 || i%Math.ceil(n/16)===0 || i===n-1) pdf.text(UNID[S.unidad][0]+f.n, X(i), y0+4, {align:'center'}); });
    pdf.setFontSize(7); pdf.setTextColor(...HT.GRAY); pdf.text('— — Programado acumulado', x0, ctx.y+ch+2); pdf.setTextColor(...HT.PRIMARY); pdf.text('——— Real acumulado', x0+42, ctx.y+ch+2);
    ctx.y += ch+8;
  }
  async function pdf(){
    const R = calc();
    if (R.totalProg<=0) { HT.toast('error','Sin programa','Captura el avance programado de al menos un periodo.'); return; }
    if (!HT.vip('la Curva S')) return;
    const ctx = await HT.pdf.nuevo({titulo:'Curva S · avance programado vs real', sub:S.obra?('Obra: '+S.obra):'', folio:S.folio});
    if (!ctx) return;
    HT.pdf.seccion(ctx,'Datos');
    HT.pdf.kv(ctx,[['Contratista / residente',S.contratista||'—'],['Monto del contrato',R.monto>0?HT.money(R.monto):'—'],['Periodos',`${R.filas.length} ${UNID[S.unidad].toLowerCase()}s`],['Corte',R.corte?`${UNID[S.unidad]} ${R.corte.n}`:'—'],['Estado',R.estado.t],['Desviación',R.corte?((R.desv>=0?'+':'')+HT.pct(R.desv,2)):'—']],3);
    HT.pdf.seccion(ctx,'Gráfica'); pdfChart(ctx,R);
    HT.pdf.seccion(ctx,'Tabla de avance');
    const hasM = R.monto>0;
    HT.pdf.tabla(ctx,{head:[UNID[S.unidad],'Prog. %','Real %','Prog. acum.','Real acum.','Desv.'].concat(hasM?['Prog. acum. $','Real acum. $']:[]),widths:[.7,.8,.8,.9,.9,.8].concat(hasM?[1.3,1.3]:[]),align:['center','right','right','right','right','right','right','right'],
      body:R.filas.map(f=>[f.n,HT.fmt(f.prog,2),f.tieneReal?HT.fmt(f.real,2):'—',HT.pct(f.pa,2),f.tieneReal?HT.pct(f.ra,2):'—',f.tieneReal?((f.ra-f.pa>=0?'+':'')+HT.pct(f.ra-f.pa,2)):'—'].concat(hasM?[HT.money(f.paM),f.tieneReal?HT.money(f.raM):'—']:[]))});
    HT.pdf.firmas(ctx,['Residente de obra','Supervisión']);
    HT.pdf.guardar(ctx,'curva-s-'+S.folio+'.pdf');
  }
  function mount(container){
    HT.icons(); S = st.get(null) || def(); if (!S.folio) S.folio = HT.folio('CRV'); ajustarN();
    root = HT.shell(container,{icon:'i-trend',titulo:'Curva S',sub:'Avance programado contra real, físico y financiero, con desviación por periodo'});
    render();
  }
  return { mount };
})();

/* ═══════════════════════════════════════════════════════════════════
   6 · CHECKLIST DE SUPERVISIÓN DE OBRA
   ═══════════════════════════════════════════════════════════════════ */
Tools.checklist = (function(){
  const st = HT.store('checklist');
  const ETAPAS = [
    {k:'preliminares', s:'Preliminares', t:'Preliminares y trazo', items:[
      'Limpieza y despalme del terreno conforme a proyecto',
      'Trazo y nivelación verificados contra planos (ejes y niveles)',
      'Bancos de nivel establecidos y protegidos',
      'Cerca perimetral, señalización y acceso controlado',
      'Instalaciones provisionales (agua, energía, sanitarios, bodega)',
      'Bitácora de obra abierta y planos vigentes disponibles en sitio']},
    {k:'cimentacion', s:'Cimentación', t:'Excavación y cimentación', items:[
      'Dimensiones y niveles de excavación conforme a planos',
      'Nivel de desplante verificado; terreno firme y sin agua',
      'Plantilla de concreto pobre colocada y nivelada',
      'Armado de zapatas: calibre, separación y recubrimiento conforme a proyecto',
      'Traslapes, anclajes y arranques de columnas/castillos en posición',
      'Limpieza de cimbra y acero antes del colado',
      'Muestreo de concreto (revenimiento y cilindros) registrado',
      'Curado del concreto iniciado dentro de las primeras horas']},
    {k:'estructura', s:'Estructura', t:'Estructura (columnas, trabes y losas)', items:[
      'Cimbra a plomo, nivel y escuadra; apuntalamiento suficiente',
      'Armado conforme a planos: calibres, número de varillas y estribos',
      'Separadores colocados; recubrimiento uniforme',
      'Instalaciones ahogadas (eléctrica, hidráulica) colocadas antes del colado',
      'Concreto vibrado sin segregación; juntas frías evitadas',
      'Tiempos de descimbrado respetados según elemento',
      'Curado de losas y trabes (mín. 7 días)',
      'Sin fisuras, oquedades ni acero expuesto tras descimbrar']},
    {k:'albanileria', s:'Albañilería', t:'Albañilería', items:[
      'Muros a plomo y a nivel; hiladas alineadas',
      'Juntas uniformes (1.0–1.5 cm) y bien llenas',
      'Castillos y dalas conforme a proyecto; anclajes de muro a estructura',
      'Cerramientos y dinteles sobre vanos con apoyo suficiente',
      'Refuerzo horizontal (escalerilla) donde lo pide el proyecto',
      'Piezas humedecidas antes de pegar (tabique) / secas (block)',
      'Preparaciones para instalaciones en muros realizadas']},
    {k:'hidrosanitaria', s:'Hidrosanitaria', t:'Instalación hidráulica y sanitaria', items:[
      'Trayectorias y diámetros conforme a proyecto',
      'Pendientes en tubería sanitaria (2% mínimo) verificadas',
      'Prueba de hermeticidad en sanitaria (agua o aire) aprobada',
      'Prueba de presión en hidráulica registrada (mín. 24 h)',
      'Registros y coladeras accesibles y a nivel de piso terminado',
      'Sin cruces con instalación eléctrica sin protección',
      'Tubería protegida antes del colado o rellenos']},
    {k:'electrica', s:'Eléctrica', t:'Instalación eléctrica', items:[
      'Tubería, cajas y registros conforme a proyecto',
      'Calibre de conductores y protecciones según cargas',
      'Sistema de tierra física instalado y probado',
      'Centro de carga identificado; circuitos rotulados',
      'Pruebas de continuidad y aislamiento registradas',
      'Salidas a la altura de proyecto y a plomo']},
    {k:'acabados', s:'Acabados', t:'Acabados', items:[
      'Aplanados a plomo y regla; sin fisuras ni desprendimientos',
      'Pisos a nivel; pendientes hacia coladeras donde aplica',
      'Impermeabilización de azotea con traslapes y chaflanes',
      'Carpintería y cancelería a escuadra, con sellado perimetral',
      'Pintura uniforme, sin fallas de cubrimiento',
      'Muebles y accesorios fijados y funcionando',
      'Limpieza final y retiro de escombro']},
    {k:'seguridad', s:'Seguridad', t:'Seguridad e higiene en obra', items:[
      'EPP en uso: casco, botas, chaleco y lentes según actividad',
      'Protección en bordes, huecos y vanos (barandales o tapas)',
      'Andamios estables, nivelados y con plataforma completa',
      'Extintor y botiquín disponibles y vigentes',
      'Orden y limpieza en áreas de trabajo y circulación',
      'Señalización de riesgos y rutas de evacuación',
      'Instalaciones eléctricas provisionales protegidas']}
  ];
  const def = () => ({folio:HT.folio('SUP'), obra:'', ubicacion:'', contratista:'', supervisor:'', fecha:HT.today(), etapa:'estructura', resp:{}, obs:{}, general:''});
  let S=null, root=null;

  const key = (ek,i) => ek+':'+i;
  function calcEtapa(ek){
    const e = ETAPAS.find(x=>x.k===ek); let ok=0,bad=0,na=0,pend=0;
    e.items.forEach((_,i)=>{ const r = S.resp[key(ek,i)]; if (r==='ok') ok++; else if (r==='bad') bad++; else if (r==='na') na++; else pend++; });
    const evaluados = ok+bad; const pct = evaluados>0 ? ok/evaluados*100 : 0;
    return {ok,bad,na,pend,evaluados,pct,total:e.items.length};
  }
  function calc(){
    const porEtapa = ETAPAS.map(e => ({...e, r:calcEtapa(e.k)}));
    const tot = porEtapa.reduce((a,e)=>({ok:a.ok+e.r.ok,bad:a.bad+e.r.bad,na:a.na+e.r.na,pend:a.pend+e.r.pend}),{ok:0,bad:0,na:0,pend:0});
    const evaluados = tot.ok+tot.bad; const pct = evaluados>0?tot.ok/evaluados*100:0;
    const hallazgos = []; porEtapa.forEach(e => e.items.forEach((it,i)=>{ if (S.resp[key(e.k,i)]==='bad') hallazgos.push({etapa:e.t, item:it, obs:S.obs[key(e.k,i)]||''}); }));
    return {porEtapa, tot, evaluados, pct, hallazgos};
  }
  function render(){
    const R = calc(); const E = ETAPAS.find(x=>x.k===S.etapa); const re = calcEtapa(S.etapa);
    root.innerHTML = `
      <div class="ht-meta"><span class="ht-folio">${S.folio}</span><span class="ht-meta__txt">${R.evaluados} revisados · ${R.hallazgos.length} hallazgo${R.hallazgos.length!==1?'s':''}</span></div>
      <div class="ht-card">
        <div class="ht-card__head"><div><h2 class="ht-card__title"><svg class="ic"><use href="#i-clipboard-check"/></svg>Datos de la visita</h2></div></div>
        <div class="ht-form ht-form--3">
          ${HT.ui.input({id:'k-obra',label:'Obra',value:S.obra,placeholder:'Nombre de la obra'})}
          ${HT.ui.input({id:'k-ubicacion',label:'Ubicación',value:S.ubicacion,placeholder:'Dirección o frente'})}
          ${HT.ui.input({id:'k-fecha',label:'Fecha',type:'date',value:S.fecha})}
          ${HT.ui.input({id:'k-contratista',label:'Contratista',value:S.contratista,placeholder:'Empresa o responsable'})}
          ${HT.ui.input({id:'k-supervisor',label:'Supervisor',value:S.supervisor,placeholder:'Quien realiza la revisión'})}
        </div>
      </div>
      <div class="ht-card">
        <div class="ht-card__head"><div><h2 class="ht-card__title"><svg class="ic"><use href="#i-hardhat"/></svg>Puntos de revisión</h2><p class="ht-card__sub">Marca cada punto como cumple, no cumple o no aplica. Anota observaciones en los que no cumplen.</p></div></div>
        <div class="ht-tabs" style="margin-bottom:14px">${ETAPAS.map(e => { const r = calcEtapa(e.k); return `<button class="ht-tab ${S.etapa===e.k?'is-active':''}" data-etapa="${e.k}">${e.s}${r.bad?`<span class="ht-tab__num" style="background:color-mix(in srgb,var(--danger) 16%,transparent);color:var(--danger)">${r.bad}</span>`:(r.evaluados?`<span class="ht-tab__num">${r.ok}/${r.total}</span>`:'')}</button>`; }).join('')}</div>
        <div class="ht-inline" style="justify-content:space-between;margin-bottom:12px">
          <div><b style="font-size:14px">${E.t}</b><div class="ht-hint">${re.ok} cumplen · ${re.bad} no cumplen · ${re.na} n/a · ${re.pend} pendientes</div></div>
          <div style="min-width:160px;flex:1;max-width:260px"><div class="ht-bar"><div class="ht-bar__fill ${re.pct>=90?'ht-bar__fill--ok':(re.pct<70&&re.evaluados?'ht-bar__fill--bad':'')}" style="width:${re.pct}%"></div></div><div class="ht-hint ht-right" style="margin-top:4px">${re.evaluados?HT.pct(re.pct,0)+' de cumplimiento':'sin evaluar'}</div></div>
        </div>
        <div class="ht-check">${E.items.map((it,i) => { const k = key(E.k,i); const r = S.resp[k]||''; return `<div class="ht-check__item" data-k="${k}">
            <div class="ht-check__txt">${i+1}. ${it}</div>
            <div class="ht-check__opts">
              <div class="ht-check__opt ${r==='ok'?'is-ok':''}" data-r="ok">Cumple</div>
              <div class="ht-check__opt ${r==='bad'?'is-bad':''}" data-r="bad">No cumple</div>
              <div class="ht-check__opt ${r==='na'?'is-na':''}" data-r="na">N/A</div>
            </div>
            <div class="ht-check__obs" style="${r==='bad'?'':'display:none'}"><input class="ht-input" type="text" data-obs placeholder="Observación / acción correctiva" value="${HT.esc(S.obs[k]||'')}"></div>
          </div>`; }).join('')}</div>
        <div class="ht-inline" style="margin-top:12px;justify-content:flex-end">
          <button class="btn btn--ghost btn--sm" data-todook>Marcar todos como cumple</button>
        </div>
      </div>
      <div class="ht-card ht-card--accent">
        <div class="ht-card__head"><div><h2 class="ht-card__title"><svg class="ic"><use href="#i-check-circle"/></svg>Resumen de la visita</h2></div>
          <span class="ht-chip ${R.evaluados?(R.pct>=90?'ht-chip--ok':(R.pct>=70?'ht-chip--warn':'ht-chip--bad')):'ht-chip--neutral'}">${R.evaluados?HT.pct(R.pct,0)+' cumplimiento':'Sin evaluar'}</span></div>
        <div class="ht-kpis">
          ${HT.ui.kpi({lbl:'Cumplen',val:HT.fmt0(R.tot.ok),cls:'ht-kpi--ok'})}
          ${HT.ui.kpi({lbl:'No cumplen',val:HT.fmt0(R.tot.bad),cls:R.tot.bad?'ht-kpi--bad':''})}
          ${HT.ui.kpi({lbl:'No aplican',val:HT.fmt0(R.tot.na)})}
          ${HT.ui.kpi({lbl:'Pendientes',val:HT.fmt0(R.tot.pend),sub:'puntos sin revisar'})}
        </div>
        <div style="margin-top:14px">${HT.ui.table({head:['Etapa','Cumple','No cumple','N/A','Pend.','Cumplimiento'],numCols:[1,2,3,4,5],rows:R.porEtapa.map(e=>[e.t,e.r.ok,e.r.bad,e.r.na,e.r.pend,e.r.evaluados?HT.pct(e.r.pct,0):'<span class="muted">—</span>'])})}</div>
        <div class="ht-form" style="margin-top:14px">${HT.ui.textarea({id:'k-general',label:'Observaciones generales',value:S.general,placeholder:'Acuerdos, instrucciones al contratista, fecha de siguiente visita…',rows:3})}</div>
      </div>
      <div class="ht-actions">
        <button class="btn btn--ghost" id="k-nuevo"><svg class="ic"><use href="#i-refresh"/></svg>Nueva visita</button>
        <button class="btn btn--accent" id="k-pdf"><svg class="ic"><use href="#i-download"/></svg>Descargar PDF</button>
      </div>`;
    bind();
  }
  function bind(){
    [['k-obra','obra'],['k-ubicacion','ubicacion'],['k-fecha','fecha'],['k-contratista','contratista'],['k-supervisor','supervisor'],['k-general','general']].forEach(([id,k]) => root.querySelector('#'+id).addEventListener('input', ev => { S[k]=ev.target.value; st.set(S); }));
    root.querySelectorAll('[data-etapa]').forEach(b => b.addEventListener('click', () => { S.etapa=b.dataset.etapa; st.set(S); render(); }));
    root.querySelectorAll('.ht-check__item').forEach(item => {
      const k = item.dataset.k;
      item.querySelectorAll('[data-r]').forEach(o => o.addEventListener('click', () => { S.resp[k] = (S.resp[k]===o.dataset.r) ? '' : o.dataset.r; st.set(S); render(); }));
      item.querySelector('[data-obs]').addEventListener('input', ev => { S.obs[k]=ev.target.value; st.set(S); });
    });
    root.querySelector('[data-todook]').addEventListener('click', () => { const E = ETAPAS.find(x=>x.k===S.etapa); E.items.forEach((_,i)=>{ if (!S.resp[key(E.k,i)]) S.resp[key(E.k,i)]='ok'; }); st.set(S); render(); });
    root.querySelector('#k-nuevo').addEventListener('click', async () => { if (await HT.confirm('¿Nueva visita?','Se borrarán las respuestas y observaciones. Los datos de la obra se conservan.','Sí, nueva visita')) { const d=def(); d.obra=S.obra; d.ubicacion=S.ubicacion; d.contratista=S.contratista; d.supervisor=S.supervisor; S=d; st.set(S); render(); HT.toast('info','Nueva visita',S.folio); } });
    root.querySelector('#k-pdf').addEventListener('click', pdf);
  }
  async function pdf(){
    const R = calc();
    if (!R.evaluados) { HT.toast('error','Sin revisión','Marca al menos un punto antes de generar el reporte.'); return; }
    if (!HT.vip('el checklist de supervisión')) return;
    const ctx = await HT.pdf.nuevo({titulo:'Reporte de supervisión de obra', sub:S.obra?('Obra: '+S.obra):'', folio:S.folio});
    if (!ctx) return;
    HT.pdf.seccion(ctx,'Datos de la visita');
    HT.pdf.kv(ctx,[['Fecha',HT.fechaLarga(S.fecha)],['Ubicación',S.ubicacion||'—'],['Contratista',S.contratista||'—'],['Supervisor',S.supervisor||'—'],['Cumplimiento general',HT.pct(R.pct,1)],['Puntos revisados',`${R.evaluados} (${R.tot.ok} cumplen · ${R.tot.bad} no cumplen · ${R.tot.na} n/a)`]]);
    HT.pdf.seccion(ctx,'Resumen por etapa');
    HT.pdf.tabla(ctx,{head:['Etapa','Cumple','No cumple','N/A','Pendiente','Cumplimiento'],widths:[2.4,.8,.9,.7,.9,1],align:['left','right','right','right','right','right'],
      body:R.porEtapa.filter(e=>e.r.evaluados||e.r.na).map(e=>[e.t,e.r.ok,e.r.bad,e.r.na,e.r.pend,e.r.evaluados?HT.pct(e.r.pct,0):'—'])});
    R.porEtapa.filter(e=>e.r.evaluados||e.r.na).forEach(e => {
      HT.pdf.seccion(ctx,e.t+' · '+(e.r.evaluados?HT.pct(e.r.pct,0):'—'));
      HT.pdf.tabla(ctx,{head:['#','Punto de revisión','Resultado','Observación'],widths:[.4,3.2,1,2.2],align:['center','left','center','left'],fontSize:7.5,
        body:e.items.map((it,i)=>{ const r=S.resp[key(e.k,i)]; return [i+1,it,r==='ok'?'CUMPLE':r==='bad'?'NO CUMPLE':r==='na'?'N/A':'—',S.obs[key(e.k,i)]||'']; })});
    });
    if (R.hallazgos.length) { HT.pdf.seccion(ctx,'Hallazgos y acciones correctivas ('+R.hallazgos.length+')');
      HT.pdf.tabla(ctx,{head:['#','Etapa','Punto','Observación / acción'],widths:[.4,1.4,2.6,2.4],align:['center','left','left','left'],fontSize:7.5,body:R.hallazgos.map((h,i)=>[i+1,h.etapa,h.item,h.obs||'Pendiente de definir'])}); }
    if (S.general.trim()) { HT.pdf.seccion(ctx,'Observaciones generales'); HT.pdf.parrafo(ctx,S.general,8.5); }
    HT.pdf.firmas(ctx,['Supervisor: '+(S.supervisor||''),'Contratista / residente: '+(S.contratista||'')]);
    HT.pdf.guardar(ctx,'supervision-'+S.folio+'.pdf');
  }
  function mount(container){
    HT.icons(); S = st.get(null) || def(); if (!S.folio) S.folio = HT.folio('SUP'); if (!S.resp) S.resp={}; if (!S.obs) S.obs={};
    root = HT.shell(container,{icon:'i-clipboard-check',titulo:'Checklist de supervisión',sub:'Revisión por etapa con hallazgos, acciones correctivas y firmas'});
    render();
  }
  return { mount };
})();

/* ═══════════════════════════════════════════════════════════════════
   7 · BITÁCORA DE OBRA
   ═══════════════════════════════════════════════════════════════════ */
Tools.bitacora = (function(){
  const st = HT.store('bitacora');
  const CLIMA = ['Soleado','Parcialmente nublado','Nublado','Lluvia ligera','Lluvia intensa','Viento fuerte'];
  const CATS = ['Oficial albañil','Ayudante general','Fierrero','Carpintero de obra negra','Operador de maquinaria','Electricista','Plomero','Soldador','Pintor / acabados','Cabo / sobrestante','Residente','Otro'];
  const entradaNueva = () => ({id:HT.uid(), folio:HT.folio('BIT'), fecha:HT.today(), clima:'Soleado', temp:'', inicio:'08:00', fin:'17:00', personal:[{cat:'Oficial albañil',cant:''},{cat:'Ayudante general',cant:''}], maq:[], actividades:'', materiales:'', incidencias:'', avanceDia:'', avanceAcum:''});
  const def = () => ({obra:'', contratista:'', residente:'', supervisor:'', ubicacion:'', contrato:'', entradas:[], vista:'lista', edit:null});
  let S=null, root=null;

  const totalPersonal = e => e.personal.reduce((a,p)=>a+Math.max(0,HT.num(p.cant)),0);
  const ordenadas = () => S.entradas.slice().sort((a,b)=> (b.fecha||'').localeCompare(a.fecha||''));

  function render(){
    root.innerHTML = `
      <div class="ht-card">
        <div class="ht-card__head"><div><h2 class="ht-card__title"><svg class="ic"><use href="#i-notebook"/></svg>Datos de la obra</h2><p class="ht-card__sub">Se guardan una vez y aparecen en todas las entradas.</p></div></div>
        <div class="ht-form ht-form--3">
          ${HT.ui.input({id:'b-obra',label:'Obra',value:S.obra,placeholder:'Nombre de la obra'})}
          ${HT.ui.input({id:'b-ubicacion',label:'Ubicación',value:S.ubicacion,placeholder:'Dirección'})}
          ${HT.ui.input({id:'b-contrato',label:'Contrato / expediente',value:S.contrato,placeholder:'Opcional'})}
          ${HT.ui.input({id:'b-contratista',label:'Contratista',value:S.contratista})}
          ${HT.ui.input({id:'b-residente',label:'Residente de obra',value:S.residente})}
          ${HT.ui.input({id:'b-supervisor',label:'Supervisor',value:S.supervisor})}
        </div>
      </div>
      <div id="b-main"></div>`;
    [['b-obra','obra'],['b-ubicacion','ubicacion'],['b-contrato','contrato'],['b-contratista','contratista'],['b-residente','residente'],['b-supervisor','supervisor']].forEach(([id,k]) => root.querySelector('#'+id).addEventListener('input', ev => { S[k]=ev.target.value; st.set(S); }));
    if (S.vista==='editar' && S.edit) renderEditor(); else renderLista();
  }
  function renderLista(){
    const main = root.querySelector('#b-main'); const lista = ordenadas();
    main.innerHTML = `
      <div class="ht-card">
        <div class="ht-card__head"><div><h2 class="ht-card__title"><svg class="ic"><use href="#i-calendar"/></svg>Entradas</h2><p class="ht-card__sub">${lista.length?`${lista.length} día${lista.length!==1?'s':''} registrado${lista.length!==1?'s':''}`:'Aún no hay entradas'}</p></div>
          <button class="btn btn--accent btn--sm" id="b-nueva"><svg class="ic"><use href="#i-plus"/></svg>Nueva entrada</button></div>
        ${lista.length ? `<div class="ht-hist">${lista.map(e => { const d = new Date(e.fecha+'T12:00:00'); return `<div class="ht-hist__item" data-id="${e.id}">
            <div class="ht-hist__date"><b>${isNaN(d)?'—':d.getDate()}</b>${isNaN(d)?'':d.toLocaleDateString('es-MX',{month:'short'}).replace('.','')}</div>
            <div class="ht-hist__body"><div class="ht-hist__title">${HT.esc((e.actividades||'').split('\n')[0]||'Sin actividades registradas')}</div><div class="ht-hist__sub">${e.clima}${e.temp?` · ${HT.num(e.temp)}°C`:''} · ${totalPersonal(e)} personas${e.avanceAcum!==''?` · ${HT.pct(HT.num(e.avanceAcum),1)} acum.`:''}${e.incidencias?' · ⚠ incidencia':''}</div></div>
            <div class="ht-hist__acts"><button class="ht-iconbtn" data-pdf title="PDF"><svg class="ic"><use href="#i-download"/></svg></button><button class="ht-iconbtn ht-iconbtn--danger" data-del title="Eliminar"><svg class="ic"><use href="#i-trash"/></svg></button></div>
          </div>`; }).join('')}</div>` : HT.ui.empty({icon:'i-notebook',title:'Sin entradas todavía',desc:'Registra el primer día de obra: clima, personal, maquinaria, actividades e incidencias. Cada entrada genera su PDF foliado.'})}
      </div>
      ${lista.length ? `<div class="ht-actions"><button class="btn btn--ghost" id="b-pdfall"><svg class="ic"><use href="#i-download"/></svg>PDF de toda la bitácora</button></div>` : ''}`;
    main.querySelector('#b-nueva').addEventListener('click', () => { S.edit = entradaNueva(); S.vista='editar'; st.set(S); render(); });
    main.querySelectorAll('.ht-hist__item').forEach(it => {
      const id = it.dataset.id; const e = S.entradas.find(x=>x.id===id);
      it.addEventListener('click', ev => { if (ev.target.closest('button')) return; S.edit = JSON.parse(JSON.stringify(e)); S.vista='editar'; st.set(S); render(); });
      it.querySelector('[data-pdf]').addEventListener('click', () => pdfEntrada(e));
      it.querySelector('[data-del]').addEventListener('click', async () => { if (await HT.confirm('¿Eliminar entrada?','Se borrará el registro del '+HT.fechaCorta(e.fecha)+'.','Eliminar')) { S.entradas = S.entradas.filter(x=>x.id!==id); st.set(S); render(); } });
    });
    main.querySelector('#b-pdfall')?.addEventListener('click', pdfTodo);
  }
  function renderEditor(){
    const main = root.querySelector('#b-main'); const e = S.edit;
    main.innerHTML = `
      <div class="ht-meta"><span class="ht-folio">${e.folio}</span><span class="ht-meta__txt">${HT.fechaLarga(e.fecha)}</span></div>
      <div class="ht-card">
        <div class="ht-card__head"><div><h2 class="ht-card__title"><svg class="ic"><use href="#i-cloud"/></svg>Jornada</h2></div></div>
        <div class="ht-form ht-form--4">
          ${HT.ui.input({id:'e-fecha',label:'Fecha',type:'date',value:e.fecha})}
          ${HT.ui.select({id:'e-clima',label:'Clima',options:CLIMA,value:e.clima})}
          ${HT.ui.input({id:'e-temp',label:'Temperatura',type:'number',value:e.temp,unit:'°C',step:'1'})}
          <div class="ht-field"><label class="ht-label">Horario</label><div class="ht-inline" style="flex-wrap:nowrap"><input class="ht-input" id="e-inicio" type="time" value="${e.inicio}"><span class="ht-muted">a</span><input class="ht-input" id="e-fin" type="time" value="${e.fin}"></div></div>
        </div>
      </div>
      <div class="ht-grid2">
        <div class="ht-card">
          <div class="ht-card__head"><div><h2 class="ht-card__title"><svg class="ic"><use href="#i-users"/></svg>Personal</h2><p class="ht-card__sub" id="e-ptotal">${totalPersonal(e)} personas en obra</p></div></div>
          <div class="ht-rows">${e.personal.map((p,i)=>`<div class="ht-row" data-pi="${i}" style="grid-template-columns:1.6fr .8fr auto">
              ${HT.ui.select({id:'ep-cat-'+i,label:'Categoría',options:CATS,value:p.cat})}
              ${HT.ui.input({id:'ep-cant-'+i,label:'Cant.',type:'number',value:p.cant,step:'1',min:0,inputmode:'numeric',placeholder:'0'})}
              ${HT.ui.del()}
            </div>`).join('')}</div>
          <div style="margin-top:10px"><button class="ht-add" type="button" data-addp><svg class="ic"><use href="#i-plus"/></svg>Agregar categoría</button></div>
        </div>
        <div class="ht-card">
          <div class="ht-card__head"><div><h2 class="ht-card__title"><svg class="ic"><use href="#i-tools"/></svg>Maquinaria y equipo</h2></div></div>
          <div class="ht-rows">${e.maq.length?e.maq.map((m,i)=>`<div class="ht-row" data-mi="${i}" style="grid-template-columns:1.6fr .8fr auto">
              ${HT.ui.input({id:'em-eq-'+i,label:'Equipo',value:m.eq,placeholder:'Ej. Retroexcavadora, Revolvedora'})}
              ${HT.ui.input({id:'em-h-'+i,label:'Horas',type:'number',value:m.h,unit:'h',step:'0.5',min:0,placeholder:'0'})}
              ${HT.ui.del()}
            </div>`).join(''):'<div class="ht-hint">Sin maquinaria registrada hoy.</div>'}</div>
          <div style="margin-top:10px"><button class="ht-add" type="button" data-addm><svg class="ic"><use href="#i-plus"/></svg>Agregar equipo</button></div>
        </div>
      </div>
      <div class="ht-card">
        <div class="ht-card__head"><div><h2 class="ht-card__title"><svg class="ic"><use href="#i-edit"/></svg>Registro del día</h2></div></div>
        <div class="ht-form">
          ${HT.ui.textarea({id:'e-act',label:'Actividades realizadas',value:e.actividades,rows:4,placeholder:'Una por línea. Ej.\nColado de losa eje 3-4\nArmado de trabes eje B'})}
          ${HT.ui.textarea({id:'e-mat',label:'Materiales recibidos',value:e.materiales,rows:3,placeholder:'Ej. 120 bultos cemento · 2 viajes de grava'})}
          ${HT.ui.textarea({id:'e-inc',label:'Incidencias / observaciones',value:e.incidencias,rows:3,placeholder:'Accidentes, suspensiones, instrucciones de supervisión, cambios…'})}
          ${HT.ui.input({id:'e-adia',label:'Avance físico del día',type:'number',value:e.avanceDia,unit:'%',step:'0.1',min:0})}
          ${HT.ui.input({id:'e-acum',label:'Avance físico acumulado',type:'number',value:e.avanceAcum,unit:'%',step:'0.1',min:0,max:100})}
        </div>
      </div>
      <div class="ht-actions">
        <button class="btn btn--ghost" id="e-cancel">Cancelar</button>
        <button class="btn btn--ghost" id="e-pdf"><svg class="ic"><use href="#i-download"/></svg>PDF</button>
        <button class="btn btn--accent" id="e-save"><svg class="ic"><use href="#i-save"/></svg>Guardar entrada</button>
      </div>`;
    const bindF = (id,k) => main.querySelector('#'+id).addEventListener('input', ev => { e[k]=ev.target.value; st.set(S); if (id==='e-fecha') main.querySelector('.ht-meta__txt').textContent = HT.fechaLarga(e.fecha); });
    [['e-fecha','fecha'],['e-temp','temp'],['e-inicio','inicio'],['e-fin','fin'],['e-act','actividades'],['e-mat','materiales'],['e-inc','incidencias'],['e-adia','avanceDia'],['e-acum','avanceAcum']].forEach(([id,k])=>bindF(id,k));
    main.querySelector('#e-clima').addEventListener('change', ev => { e.clima=ev.target.value; st.set(S); });
    main.querySelectorAll('[data-pi]').forEach(row => { const i=+row.dataset.pi;
      row.querySelector('select').addEventListener('change', ev => { e.personal[i].cat=ev.target.value; st.set(S); });
      row.querySelector('input').addEventListener('input', ev => { e.personal[i].cant=ev.target.value; st.set(S); main.querySelector('#e-ptotal').textContent = totalPersonal(e)+' personas en obra'; });
      row.querySelector('[data-del]').addEventListener('click', () => { e.personal.splice(i,1); st.set(S); renderEditor(); }); });
    main.querySelectorAll('[data-mi]').forEach(row => { const i=+row.dataset.mi;
      row.querySelectorAll('input').forEach(inp => inp.addEventListener('input', () => { e.maq[i][inp.id.startsWith('em-eq')?'eq':'h']=inp.value; st.set(S); }));
      row.querySelector('[data-del]').addEventListener('click', () => { e.maq.splice(i,1); st.set(S); renderEditor(); }); });
    main.querySelector('[data-addp]').addEventListener('click', () => { e.personal.push({cat:CATS[0],cant:''}); st.set(S); renderEditor(); });
    main.querySelector('[data-addm]').addEventListener('click', () => { e.maq.push({eq:'',h:''}); st.set(S); renderEditor(); });
    main.querySelector('#e-cancel').addEventListener('click', () => { S.edit=null; S.vista='lista'; st.set(S); render(); });
    main.querySelector('#e-save').addEventListener('click', () => {
      if (!e.fecha) { HT.toast('error','Falta la fecha',''); return; }
      const i = S.entradas.findIndex(x=>x.id===e.id); if (i>=0) S.entradas[i]=e; else S.entradas.push(e);
      S.edit=null; S.vista='lista'; st.set(S); render(); HT.toast('success','Entrada guardada',HT.fechaCorta(e.fecha)+' · '+e.folio);
    });
    main.querySelector('#e-pdf').addEventListener('click', () => pdfEntrada(e));
  }
  function seccionEntrada(ctx, e, conTitulo){
    if (conTitulo) { HT.pdf.salto(ctx, 24); ctx.pdf.setFillColor(...HT.PRIMARY); ctx.pdf.rect(ctx.M, ctx.y-4, 1.5, 7, 'F'); ctx.pdf.setFont(undefined,'bold'); ctx.pdf.setFontSize(11); ctx.pdf.setTextColor(...HT.DARK); ctx.pdf.text(HT.fechaLarga(e.fecha)+'   ·   '+e.folio, ctx.M+4, ctx.y); ctx.pdf.setFont(undefined,'normal'); ctx.y += 8; }
    HT.pdf.kv(ctx,[['Clima',e.clima+(e.temp!==''?` · ${HT.num(e.temp)} °C`:'')],['Horario',`${e.inicio||'—'} a ${e.fin||'—'}`],['Personal en obra',totalPersonal(e)+' personas'],['Avance del día',e.avanceDia!==''?HT.pct(HT.num(e.avanceDia),1):'—'],['Avance acumulado',e.avanceAcum!==''?HT.pct(HT.num(e.avanceAcum),1):'—']],3);
    const pers = e.personal.filter(p=>HT.num(p.cant)>0);
    if (pers.length) HT.pdf.tabla(ctx,{head:['Personal','Cantidad'],widths:[3,1],align:['left','right'],fontSize:7.5,body:pers.map(p=>[p.cat,HT.fmt0(HT.num(p.cant))]),total:['TOTAL',HT.fmt0(totalPersonal(e))]});
    const maq = e.maq.filter(m=>m.eq.trim());
    if (maq.length) HT.pdf.tabla(ctx,{head:['Maquinaria / equipo','Horas'],widths:[3,1],align:['left','right'],fontSize:7.5,body:maq.map(m=>[m.eq,m.h!==''?HT.fmt(HT.num(m.h),1):'—'])});
    const bloque = (t, txt) => { if (!String(txt||'').trim()) return; HT.pdf.salto(ctx,10); ctx.pdf.setFont(undefined,'bold'); ctx.pdf.setFontSize(8.5); ctx.pdf.setTextColor(...HT.DARK); ctx.pdf.text(t, ctx.M, ctx.y); ctx.pdf.setFont(undefined,'normal'); ctx.y += 4.5; HT.pdf.parrafo(ctx, txt, 8.5); };
    bloque('Actividades realizadas', e.actividades); bloque('Materiales recibidos', e.materiales); bloque('Incidencias / observaciones', e.incidencias);
  }
  const encabezadoObra = ctx => HT.pdf.kv(ctx,[['Obra',S.obra||'—'],['Ubicación',S.ubicacion||'—'],['Contratista',S.contratista||'—'],['Contrato',S.contrato||'—'],['Residente',S.residente||'—'],['Supervisor',S.supervisor||'—']],3);
  async function pdfEntrada(e){
    if (!HT.vip('la bitácora de obra')) return;
    const ctx = await HT.pdf.nuevo({titulo:'Bitácora de obra · '+HT.fechaLarga(e.fecha), sub:S.obra?('Obra: '+S.obra):'', folio:e.folio}); if (!ctx) return;
    HT.pdf.seccion(ctx,'Datos de la obra'); encabezadoObra(ctx);
    HT.pdf.seccion(ctx,'Registro del día'); seccionEntrada(ctx, e, false);
    HT.pdf.firmas(ctx,['Residente: '+(S.residente||''),'Supervisor: '+(S.supervisor||'')]);
    HT.pdf.guardar(ctx,'bitacora-'+e.fecha+'-'+e.folio+'.pdf');
  }
  async function pdfTodo(){
    if (!HT.vip('la bitácora de obra')) return;
    const lista = ordenadas().reverse(); if (!lista.length) return;
    const folio = HT.folio('BIT');
    const ctx = await HT.pdf.nuevo({titulo:'Bitácora de obra · '+HT.fechaCorta(lista[0].fecha)+' a '+HT.fechaCorta(lista[lista.length-1].fecha), sub:S.obra?('Obra: '+S.obra):'', folio}); if (!ctx) return;
    HT.pdf.seccion(ctx,'Datos de la obra'); encabezadoObra(ctx);
    HT.pdf.seccion(ctx,'Resumen del periodo · '+lista.length+' días');
    HT.pdf.tabla(ctx,{head:['Fecha','Clima','Personal','Actividad principal','Avance acum.'],widths:[1,1.2,.8,3,1],align:['left','left','right','left','right'],fontSize:7.5,body:lista.map(e=>[HT.fechaCorta(e.fecha),e.clima,HT.fmt0(totalPersonal(e)),(e.actividades||'').split('\n')[0]||'—',e.avanceAcum!==''?HT.pct(HT.num(e.avanceAcum),1):'—'])});
    lista.forEach(e => seccionEntrada(ctx, e, true));
    HT.pdf.firmas(ctx,['Residente: '+(S.residente||''),'Supervisor: '+(S.supervisor||'')]);
    HT.pdf.guardar(ctx,'bitacora-periodo-'+folio+'.pdf');
  }
  function mount(container){
    HT.icons(); S = st.get(null) || def(); if (!Array.isArray(S.entradas)) S.entradas=[];
    root = HT.shell(container,{icon:'i-notebook',titulo:'Bitácora de obra',sub:'Registro diario foliado: clima, personal, maquinaria, actividades e incidencias'});
    render();
  }
  return { mount };
})();

/* ═══════════════════════════════════════════════════════════════════
   8 · NÚMEROS GENERADORES
   ═══════════════════════════════════════════════════════════════════ */
Tools.generadores = (function(){
  const st = HT.store('generadores');
  /* Unidad → qué dimensiones aplican y cómo se calcula la cantidad */
  const UNID = {
    'pza': {t:'pza (pieza)',    dims:[],                                   f:r=>r.p},
    'm':   {t:'m (metro lineal)',dims:[['largo','Largo','m']],              f:r=>r.p*r.largo},
    'm2':  {t:'m² (metro cuadrado)',dims:[['largo','Largo','m'],['ancho','Ancho','m']], f:r=>r.p*r.largo*r.ancho},
    'm3':  {t:'m³ (metro cúbico)',dims:[['largo','Largo','m'],['ancho','Ancho','m'],['alto','Alto / esp.','m']], f:r=>r.p*r.largo*r.ancho*r.alto},
    'kg':  {t:'kg (kilogramo)', dims:[['largo','Largo','m'],['factor','kg/m','']], f:r=>r.p*r.largo*r.factor},
    'ton': {t:'ton (tonelada)', dims:[['largo','Largo','m'],['factor','kg/m','']], f:r=>r.p*r.largo*r.factor/1000},
    'lote':{t:'lote',           dims:[['factor','Factor','']],              f:r=>r.p*r.factor},
    'jor': {t:'jornal',         dims:[['factor','Jornales','']],            f:r=>r.p*r.factor}
  };
  const nuevaFila = () => ({id:HT.uid(), ubic:'', p:1, largo:'', ancho:'', alto:'', factor:1});
  const nuevoConcepto = () => ({id:HT.uid(), clave:'', desc:'', unidad:'m2', filas:[nuevaFila()]});
  const def = () => ({folio:HT.folio('GEN'), obra:'', contratista:'', estimacion:'', periodo:'', conceptos:[nuevoConcepto()], abierto:null});
  let S=null, root=null;

  const calcFila = (u, r) => { const d = {p:Math.max(0,HT.num(r.p)),largo:HT.num(r.largo),ancho:HT.num(r.ancho),alto:HT.num(r.alto),factor:HT.num(r.factor)}; return UNID[u].f(d); };
  function calc(){
    const conceptos = S.conceptos.map(c => { const filas = c.filas.map(r => ({...r, cant:calcFila(c.unidad,r)})); return {...c, filas, total:filas.reduce((a,r)=>a+r.cant,0)}; });
    return {conceptos};
  }
  const medidas = (u, r) => { const d = UNID[u].dims; if (!d.length) return '—'; return d.map(([k,l,un]) => HT.fmt(HT.num(r[k]),2)+(un?' '+un:'')).join(' × '); };
  const unidadCorta = u => UNID[u].t.split(' ')[0];

  function render(){
    const R = calc(); if (S.abierto===null && S.conceptos.length) S.abierto = S.conceptos[0].id;
    root.innerHTML = `
      <div class="ht-meta"><span class="ht-folio">${S.folio}</span><span class="ht-meta__txt">${R.conceptos.length} concepto${R.conceptos.length!==1?'s':''}</span></div>
      <div class="ht-card">
        <div class="ht-card__head"><div><h2 class="ht-card__title"><svg class="ic"><use href="#i-ruler"/></svg>Datos de la estimación</h2></div></div>
        <div class="ht-form ht-form--4">
          ${HT.ui.input({id:'g-obra',label:'Obra',value:S.obra,placeholder:'Nombre de la obra'})}
          ${HT.ui.input({id:'g-contratista',label:'Contratista',value:S.contratista})}
          ${HT.ui.input({id:'g-est',label:'Estimación No.',value:S.estimacion,placeholder:'Ej. 3'})}
          ${HT.ui.input({id:'g-periodo',label:'Periodo',value:S.periodo,placeholder:'Ej. 01 al 15 de marzo'})}
        </div>
      </div>
      <div class="ht-stack" id="g-conceptos">${R.conceptos.map((c,ci)=>conceptoHtml(c,ci)).join('')}</div>
      <div>${HT.ui.add('Agregar concepto')}</div>
      <div class="ht-card ht-card--accent">
        <div class="ht-card__head"><div><h2 class="ht-card__title"><svg class="ic"><use href="#i-check-circle"/></svg>Resumen</h2><p class="ht-card__sub">Cantidades totales por concepto para la estimación</p></div></div>
        ${HT.ui.table({head:['Clave','Concepto','Unidad','Cantidad'],numCols:[3],rows:R.conceptos.map(c=>[HT.esc(c.clave||'—'),HT.esc(c.desc||'Sin descripción'),unidadCorta(c.unidad),`<b>${HT.fmt(c.total,c.unidad==='pza'?0:2)}</b>`])})}
      </div>
      <div class="ht-actions">
        <button class="btn btn--ghost" id="g-nuevo"><svg class="ic"><use href="#i-refresh"/></svg>Nueva hoja</button>
        <button class="btn btn--accent" id="g-pdf"><svg class="ic"><use href="#i-download"/></svg>Descargar PDF</button>
      </div>`;
    bind();
  }
  function conceptoHtml(c, ci){
    const U = UNID[c.unidad]; const abierto = S.abierto===c.id;
    return `<div class="ht-card" data-cid="${c.id}">
      <div class="ht-card__head" style="margin-bottom:${abierto?'16px':'0'};cursor:pointer" data-head>
        <div style="min-width:0;flex:1"><h2 class="ht-card__title"><span class="ht-chip ht-chip--primary">${ci+1}</span><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${HT.esc(c.clave?c.clave+' · ':'')}${HT.esc(c.desc||'Concepto sin descripción')}</span></h2>
          <p class="ht-card__sub">${c.filas.length} renglón${c.filas.length!==1?'es':''} · <b class="ht-mono">${HT.fmt(c.total,c.unidad==='pza'?0:2)} ${unidadCorta(c.unidad)}</b></p></div>
        <div class="ht-inline"><button class="ht-iconbtn ht-iconbtn--danger" data-delc title="Eliminar concepto"><svg class="ic"><use href="#i-trash"/></svg></button><svg class="ht-assump__chev" style="${abierto?'transform:rotate(180deg)':''}"><use href="#i-chevron"/></svg></div>
      </div>
      <div data-body style="${abierto?'':'display:none'}">
        <div class="ht-form ht-form--4" style="margin-bottom:14px">
          ${HT.ui.input({id:'gc-clave-'+c.id,label:'Clave',value:c.clave,placeholder:'Ej. CIM-03'})}
          ${HT.ui.input({id:'gc-desc-'+c.id,label:'Descripción del concepto',value:c.desc,placeholder:'Ej. Muro de block 15 cm asentado con mortero 1:4',full:false})}
          ${HT.ui.select({id:'gc-unidad-'+c.id,label:'Unidad',options:Object.entries(UNID).map(([v,o])=>({v,t:o.t})),value:c.unidad})}
        </div>
        <div class="ht-rows">${c.filas.map((r,ri)=>`<div class="ht-row" data-rid="${r.id}" style="grid-template-columns:1.4fr .7fr${U.dims.map(()=>' 1fr').join('')} 1.1fr auto">
            <span class="ht-row__num">${ri+1}</span>
            ${HT.ui.input({id:'gr-ubic-'+r.id,label:'Ubicación / eje',value:r.ubic,placeholder:'Ej. Eje A-B, PB'})}
            ${HT.ui.input({id:'gr-p-'+r.id,label:'Piezas',type:'number',value:r.p,step:'1',min:0,inputmode:'numeric'})}
            ${U.dims.map(([k,l,un]) => HT.ui.input({id:'gr-'+k+'-'+r.id,label:l,type:'number',value:r[k],unit:un,step:'0.01',min:0,placeholder:'0.00'})).join('')}
            <div class="ht-row__out"><small>${unidadCorta(c.unidad)}</small><b>${HT.fmt(r.cant,c.unidad==='pza'?0:3)}</b></div>
            ${HT.ui.del()}
          </div>`).join('')}</div>
        <div class="ht-inline" style="margin-top:12px;justify-content:space-between">
          <button class="ht-add" type="button" data-addr style="width:auto"><svg class="ic"><use href="#i-plus"/></svg>Agregar renglón</button>
          <div class="ht-mono" style="font-size:14px"><span class="ht-muted">Total:</span> <b>${HT.fmt(c.total,c.unidad==='pza'?0:3)} ${unidadCorta(c.unidad)}</b></div>
        </div>
      </div>
    </div>`;
  }
  function bind(){
    [['g-obra','obra'],['g-contratista','contratista'],['g-est','estimacion'],['g-periodo','periodo']].forEach(([id,k]) => root.querySelector('#'+id).addEventListener('input', ev => { S[k]=ev.target.value; st.set(S); }));
    root.querySelector('[data-add]').addEventListener('click', () => { const c = nuevoConcepto(); S.conceptos.push(c); S.abierto=c.id; st.set(S); render(); root.querySelector(`[data-cid="${c.id}"] input`)?.focus(); });
    root.querySelectorAll('[data-cid]').forEach(card => {
      const cid = card.dataset.cid; const c = S.conceptos.find(x=>x.id===cid);
      card.querySelector('[data-head]').addEventListener('click', ev => { if (ev.target.closest('button')) return; S.abierto = S.abierto===cid ? null : cid; st.set(S); render(); });
      card.querySelector('[data-delc]').addEventListener('click', async () => { if (S.conceptos.length===1) { HT.toast('info','Necesitas al menos un concepto',''); return; } if (await HT.confirm('¿Eliminar concepto?','Se borrarán sus renglones.','Eliminar')) { S.conceptos=S.conceptos.filter(x=>x.id!==cid); st.set(S); render(); } });
      const body = card.querySelector('[data-body]'); if (!body || body.style.display==='none') return;
      card.querySelector('#gc-clave-'+cid).addEventListener('input', ev => { c.clave=ev.target.value; st.set(S); actualizar(); });
      card.querySelector('#gc-desc-'+cid).addEventListener('input', ev => { c.desc=ev.target.value; st.set(S); actualizar(); });
      card.querySelector('#gc-unidad-'+cid).addEventListener('change', ev => { c.unidad=ev.target.value; st.set(S); render(); });
      card.querySelector('[data-addr]').addEventListener('click', () => { c.filas.push(nuevaFila()); st.set(S); render(); });
      card.querySelectorAll('[data-rid]').forEach(row => { const rid=row.dataset.rid; const r=c.filas.find(x=>x.id===rid);
        row.querySelector('[data-del]').addEventListener('click', () => { if (c.filas.length===1) { HT.toast('info','Necesitas al menos un renglón',''); return; } c.filas=c.filas.filter(x=>x.id!==rid); st.set(S); render(); });
        row.querySelectorAll('input').forEach(inp => inp.addEventListener('input', () => { r[inp.id.slice(3, inp.id.length-rid.length-1)] = inp.value; st.set(S); actualizar(); })); });
    });
    root.querySelector('#g-nuevo').addEventListener('click', async () => { if (await HT.confirm('¿Nueva hoja?','Se borrarán los conceptos y renglones capturados.','Sí, empezar de cero')) { S=def(); st.set(S); render(); } });
    root.querySelector('#g-pdf').addEventListener('click', pdf);
  }
  function actualizar(){
    const R = calc();
    R.conceptos.forEach(c => { const card = root.querySelector(`[data-cid="${c.id}"]`); if (!card) return;
      c.filas.forEach(r => { const o = card.querySelector(`[data-rid="${r.id}"] .ht-row__out b`); if (o) o.textContent = HT.fmt(r.cant,c.unidad==='pza'?0:3); });
      const tot = card.querySelector('[data-body] .ht-mono b'); if (tot) tot.textContent = HT.fmt(c.total,c.unidad==='pza'?0:3)+' '+unidadCorta(c.unidad);
      const sub = card.querySelector('.ht-card__sub'); if (sub) sub.innerHTML = `${c.filas.length} renglón${c.filas.length!==1?'es':''} · <b class="ht-mono">${HT.fmt(c.total,c.unidad==='pza'?0:2)} ${unidadCorta(c.unidad)}</b>`;
      const ttl = card.querySelector('.ht-card__title span:last-child'); if (ttl) ttl.textContent = (c.clave?c.clave+' · ':'')+(c.desc||'Concepto sin descripción'); });
    const tb = root.querySelector('.ht-card--accent tbody'); if (tb) tb.innerHTML = R.conceptos.map(c=>`<tr><td>${HT.esc(c.clave||'—')}</td><td>${HT.esc(c.desc||'Sin descripción')}</td><td>${unidadCorta(c.unidad)}</td><td class="num"><b>${HT.fmt(c.total,c.unidad==='pza'?0:2)}</b></td></tr>`).join('');
  }
  async function pdf(){
    const R = calc(); const conDatos = R.conceptos.filter(c=>c.total>0);
    if (!conDatos.length) { HT.toast('error','Sin cantidades','Captura medidas en al menos un concepto.'); return; }
    if (!HT.vip('los números generadores')) return;
    const ctx = await HT.pdf.nuevo({titulo:'Números generadores'+(S.estimacion?' · Estimación '+S.estimacion:''), sub:S.obra?('Obra: '+S.obra):'', folio:S.folio}); if (!ctx) return;
    HT.pdf.seccion(ctx,'Datos');
    HT.pdf.kv(ctx,[['Contratista',S.contratista||'—'],['Estimación',S.estimacion||'—'],['Periodo',S.periodo||'—']],3);
    R.conceptos.forEach((c,ci) => {
      const U = UNID[c.unidad]; const dims = U.dims;
      HT.pdf.seccion(ctx, `${ci+1}. ${c.clave?c.clave+' · ':''}${c.desc||'Concepto sin descripción'}  (${unidadCorta(c.unidad)})`);
      HT.pdf.tabla(ctx,{head:['#','Ubicación / eje','Piezas'].concat(dims.map(d=>d[1])).concat(['Cantidad']),widths:[.4,2.2,.7].concat(dims.map(()=>.9)).concat([1]),align:['center','left','right'].concat(dims.map(()=>'right')).concat(['right']),fontSize:7.5,
        body:c.filas.map((r,i)=>[i+1,r.ubic||'—',HT.fmt0(HT.num(r.p))].concat(dims.map(([k])=>HT.fmt(HT.num(r[k]),2))).concat([HT.fmt(r.cant,c.unidad==='pza'?0:3)])),
        total:['','TOTAL','' ].concat(dims.map(()=>'')).concat([HT.fmt(c.total,c.unidad==='pza'?0:3)+' '+unidadCorta(c.unidad)])});
    });
    HT.pdf.seccion(ctx,'Resumen de cantidades');
    HT.pdf.tabla(ctx,{head:['Clave','Concepto','Unidad','Cantidad'],widths:[.9,3.4,.8,1],align:['left','left','center','right'],body:R.conceptos.map(c=>[c.clave||'—',c.desc||'Sin descripción',unidadCorta(c.unidad),HT.fmt(c.total,c.unidad==='pza'?0:2)])});
    HT.pdf.firmas(ctx,['Elaboró: '+(S.contratista||''),'Revisó (supervisión)']);
    HT.pdf.guardar(ctx,'generadores-'+S.folio+'.pdf');
  }
  function mount(container){
    HT.icons(); S = st.get(null) || def(); if (!S.folio) S.folio = HT.folio('GEN');
    root = HT.shell(container,{icon:'i-ruler',titulo:'Números generadores',sub:'Hoja de cuantificación por concepto: piezas × largo × ancho × alto, con resumen para estimación'});
    render();
  }
  return { mount };
})();

/* Metadatos para el panel (nav, orden, íconos) */
Tools.__meta = [
  {k:'concreto',    t:'Volumen de concreto',   icon:'i-cube'},
  {k:'acero',       t:'Cuantificación de acero',icon:'i-rebar'},
  {k:'muros',       t:'Muros y albañilería',   icon:'i-wall'},
  {k:'retenciones', t:'Retenciones en estimaciones', icon:'i-percent'},
  {k:'curvas',      t:'Curva S',               icon:'i-trend'},
  {k:'checklist',   t:'Checklist de supervisión', icon:'i-clipboard-check'},
  {k:'bitacora',    t:'Bitácora de obra',      icon:'i-notebook'},
  {k:'generadores', t:'Números generadores',   icon:'i-ruler'}
];

})();
