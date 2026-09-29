/* =========================================================
   IMFRA · Pack de Plantillas Profesionales — motor v1.0
   - Canje con créditos (transacción, sin doble cobro)
   - Catálogo de 9 plantillas disponibles + "Mis plantillas"
   - Editor con filas (partida/subpartida/concepto), cálculos,
     autoguardado, copia, Excel (con fórmulas), PDF e impresión
   Cada plantilla vive en su propio archivo y se registra con
   ImfraPlantillas.registrar({...}).
   ========================================================= */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';
  var PRODUCTO = 'pack-plantillas';

  var DEF_CFG = {
    precio: 450,
    coleccionUsuarios: 'usuarios',
    campoCreditos: 'creditos',
    campoDesbloqueo: 'recompensas.packPlantillas',
    subcoleccionPlantillas: 'misPlantillas',
    rutaTransacciones: null, // function(uid){ return 'usuarios/'+uid+'/transacciones'; }
    marca: 'IMFRA Desarrollo',
    libs: {
      exceljs: 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js',
      jspdf: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
      autotable: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'
    }
  };

  /* ---------------- Catálogo (9 disponibles + bitácora próxima) ---------------- */
  var CATALOGO = [
    { id: 'casa-habitacion', nombre: 'Presupuesto de Casa Habitación', cat: 'PRESUPUESTOS', icon: 'casa',
      desc: 'Catálogo por partidas, subpartidas y conceptos con importes, IVA, total con letra y costo por m².' },
    { id: 'remodelacion', nombre: 'Presupuesto de Remodelación', cat: 'PRESUPUESTOS', icon: 'remodel',
      desc: 'Por zona intervenida y especialidad: demoliciones, albañilería, instalaciones y acabados.' },
    { id: 'nave-industrial', nombre: 'Presupuesto de Nave Industrial', cat: 'PRESUPUESTOS', icon: 'nave',
      desc: 'Preliminares, cimentación, estructura metálica, cubierta, pisos industriales e instalaciones.' },
    { id: 'apu', nombre: 'Análisis de Precios Unitarios', cat: 'COSTOS', icon: 'calc',
      desc: 'Materiales, mano de obra, equipo, herramienta y auxiliares con rendimientos, indirectos y utilidad.' },
    { id: 'explosion-insumos', nombre: 'Explosión de Insumos', cat: 'COSTOS', icon: 'capas',
      desc: 'Insumos por material, mano de obra y maquinaria con claves, proveedores e importes.' },
    { id: 'generadores', nombre: 'Números Generadores', cat: 'CONTROL DE OBRA', icon: 'regla',
      desc: 'Cuantificación por eje y tramo con largo, ancho, alto, piezas y factor con fórmula automática.' },
    { id: 'estimaciones', nombre: 'Estimaciones de Obra', cat: 'CONTROL DE OBRA', icon: 'recibo',
      desc: 'Contratado, ejecutado y acumulado con retenciones, amortización de anticipo, IVA y neto a pagar.' },
    { id: 'fisico-financiero', nombre: 'Control Físico-Financiero', cat: 'CONTROL DE OBRA', icon: 'semaforo',
      desc: 'Avance programado contra real por partida con variación y semáforo automático.' },
    { id: 'curva-s', nombre: 'Curva S de Avance', cat: 'REPORTES', icon: 'curva',
      desc: 'Avance y costo programado contra real por semana con gráfica automática.' },
    { id: 'bitacora', nombre: 'Bitácora y Reporte Semanal', cat: 'REPORTES', icon: 'bitacora',
      desc: 'Clima, personal, maquinaria, actividades, incidencias, acuerdos y evidencia fotográfica.' }
  ];
  var CATEGORIAS = ['TODAS', 'PRESUPUESTOS', 'COSTOS', 'CONTROL DE OBRA', 'REPORTES'];
  var REGISTRO = {};

  /* ---------------- Iconos (SVG de trazo fino) ---------------- */
  var P = 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
  var ICONS = {
    casa: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    remodel: '<path d="M14 4l6 6-9 9H5v-6z"/><path d="M12 6l6 6"/><path d="M4 21h16"/>',
    nave: '<path d="M2 20h20"/><path d="M4 20V9l8-5 8 5v11"/><path d="M8 20v-6h8v6"/><path d="M4 9h16"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8"/><path d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15v3M8 18h.01M12 18h.01"/>',
    capas: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    regla: '<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
    recibo: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    semaforo: '<rect x="8" y="2" width="8" height="20" rx="3"/><circle cx="12" cy="7" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="17" r="1.6"/>',
    curva: '<path d="M3 3v18h18"/><path d="M6 17c4 0 5-10 12-11"/>',
    bitacora: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v3h6V3"/><path d="M9 11h6M9 15h4"/>',
    abrir: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    bajar: '<path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/>',
    copia: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    lapiz: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
    basura: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
    mas: '<path d="M12 5v14M5 12h14"/>',
    puntos: '<circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/>',
    arriba: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    abajo: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    atras: '<path d="M15 5l-7 7 7 7"/>',
    siguiente: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    candado: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    abierto: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>',
    excel: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 8l6 8M15 8l-6 8"/>',
    pdf: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
    print: '<path d="M7 9V3h10v6"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
    buscar: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
    numeros: '<path d="M5 6h3M5 12h3M5 18h3"/><path d="M11 6h8M11 12h8M11 18h8"/>',
    alerta: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
    moneda: '<circle cx="12" cy="12" r="8"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6.5v11"/>'
  };
  function ico(n, cls) { return '<svg viewBox="0 0 24 24" ' + P + (cls ? ' class="' + cls + '"' : '') + '>' + (ICONS[n] || '') + '</svg>'; }

  /* ---------------- Utilidades ---------------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(v) {
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    if (v == null || v === '') return 0;
    var n = parseFloat(String(v).replace(/[$,\s%]/g, ''));
    return isFinite(n) ? n : 0;
  }
  var NF = {};
  function nf(d) { return NF[d] || (NF[d] = new Intl.NumberFormat('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d })); }
  function fmtMoney(n) { n = num(n); return (n < 0 ? '-$' : '$') + nf(2).format(Math.abs(n)); }
  function fmtNum(n, d) { return nf(d == null ? 2 : d).format(num(n)); }
  function fmtPct(n, d) { return nf(d == null ? 2 : d).format(num(n) * 100) + '%'; }
  function fmtFecha(ms, corta) {
    if (!ms) return '—';
    if (ms && typeof ms.toMillis === 'function') ms = ms.toMillis();
    var d = new Date(ms);
    return corta ? d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
      : d.toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function nid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function getPath(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, o); }
  function setPath(o, p, v) { var ks = p.split('.'); var a = o; for (var i = 0; i < ks.length - 1; i++) { if (a[ks[i]] == null || typeof a[ks[i]] !== 'object') a[ks[i]] = {}; a = a[ks[i]]; } a[ks[ks.length - 1]] = v; }
  function slug(s) { return String(s || 'plantilla').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_').slice(0, 80) || 'plantilla'; }
  function hoyISO() { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
  function fechaLarga(iso) { if (!iso) return ''; var p = String(iso).split('-'); if (p.length !== 3) return iso; var d = new Date(+p[0], +p[1] - 1, +p[2]); return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }); }

  /* Importe con letra (pesos mexicanos) */
  var UN = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE', 'VEINTIÚN', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
  var DEC = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  var CEN = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
  function c999(n) { if (!n) return ''; if (n === 100) return 'CIEN'; var c = Math.floor(n / 100), r = n % 100, s = CEN[c]; if (r) s += (s ? ' ' : '') + (r < 30 ? UN[r] : DEC[Math.floor(r / 10)] + (r % 10 ? ' Y ' + UN[r % 10] : '')); return s; }
  function letras(n) {
    var mill = Math.floor(n / 1e6), resto = n % 1e6, miles = Math.floor(resto / 1000), u = resto % 1000, s = '';
    if (mill) s = mill === 1 ? 'UN MILLÓN' : letras(mill) + ' MILLONES';
    if (miles) s += (s ? ' ' : '') + (miles === 1 ? 'MIL' : c999(miles) + ' MIL');
    if (u) s += (s ? ' ' : '') + c999(u);
    if (mill && !miles && !u) s += ' DE';
    return s;
  }
  function numeroALetras(v) {
    v = Math.round(num(v) * 100) / 100; var neg = v < 0; v = Math.abs(v);
    var ent = Math.floor(v), cen = Math.round((v - ent) * 100);
    var t = ent === 0 ? 'CERO PESOS' : ent === 1 ? 'UN PESO' : letras(ent) + ' PESOS';
    return (neg ? 'MENOS ' : '') + '(' + t + ' ' + String(cen).padStart(2, '0') + '/100 M.N.)';
  }

  var _scripts = {};
  function cargarScript(url) {
    if (_scripts[url]) return _scripts[url];
    _scripts[url] = new Promise(function (ok, ko) {
      var s = document.createElement('script'); s.src = url; s.async = true;
      s.onload = ok; s.onerror = function () { delete _scripts[url]; ko(new Error('No se pudo cargar ' + url)); };
      document.head.appendChild(s);
    });
    return _scripts[url];
  }
  function descargarBlob(blob, nombre) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  /* =========================================================
     Adaptadores de datos (Firestore compat / modular / local)
     ========================================================= */
  function fsCompat(db, fb) {
    var FV = (fb || global.firebase).firestore.FieldValue;
    function rd(s) { return s.exists ? s.data() : null; }
    return {
      get: function (p) { return db.doc(p).get().then(rd); },
      set: function (p, d, m) { return db.doc(p).set(d, m ? { merge: true } : {}); },
      update: function (p, d) { return db.doc(p).update(d); },
      del: function (p) { return db.doc(p).delete(); },
      list: function (p) { return db.collection(p).get().then(function (q) { return q.docs.map(function (x) { var o = x.data(); o.id = x.id; return o; }); }); },
      newId: function (p) { return db.collection(p).doc().id; },
      ts: function () { return FV.serverTimestamp(); },
      tx: function (fn) {
        return db.runTransaction(function (t) {
          return fn({
            get: function (p) { return t.get(db.doc(p)).then(rd); },
            update: function (p, d) { t.update(db.doc(p), d); },
            set: function (p, d) { t.set(db.doc(p), d); }
          });
        });
      }
    };
  }
  /* m = { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, runTransaction, serverTimestamp } */
  function fsModular(db, m) {
    function rd(s) { return s.exists() ? s.data() : null; }
    function D(p) { return m.doc(db, p); }
    return {
      get: function (p) { return m.getDoc(D(p)).then(rd); },
      set: function (p, d, mg) { return m.setDoc(D(p), d, mg ? { merge: true } : {}); },
      update: function (p, d) { return m.updateDoc(D(p), d); },
      del: function (p) { return m.deleteDoc(D(p)); },
      list: function (p) { return m.getDocs(m.collection(db, p)).then(function (q) { return q.docs.map(function (x) { var o = x.data(); o.id = x.id; return o; }); }); },
      newId: function (p) { return m.doc(m.collection(db, p)).id; },
      ts: function () { return m.serverTimestamp(); },
      tx: function (fn) {
        return m.runTransaction(db, function (t) {
          return fn({
            get: function (p) { return t.get(D(p)).then(rd); },
            update: function (p, d) { t.update(D(p), d); },
            set: function (p, d) { t.set(D(p), d); }
          });
        });
      }
    };
  }
  /* Modo local (demo / pruebas): guarda en localStorage */
  function fsLocal(prefijo) {
    prefijo = prefijo || 'ipk-demo:';
    var chain = Promise.resolve();
    function k(p) { return prefijo + p; }
    function rd(p) { try { return JSON.parse(localStorage.getItem(k(p))); } catch (e) { return null; } }
    function wr(p, d) { localStorage.setItem(k(p), JSON.stringify(d)); }
    function upd(p, d) { var o = rd(p); if (!o) throw new Error('not-found'); Object.keys(d).forEach(function (x) { setPath(o, x, d[x]); }); wr(p, o); }
    var api = {
      get: function (p) { return Promise.resolve(rd(p)); },
      set: function (p, d, m) { var o = m ? Object.assign(rd(p) || {}, d) : d; wr(p, o); return Promise.resolve(); },
      update: function (p, d) { try { upd(p, d); return Promise.resolve(); } catch (e) { return Promise.reject(e); } },
      del: function (p) { localStorage.removeItem(k(p)); return Promise.resolve(); },
      list: function (p) {
        var pre = k(p) + '/', out = [];
        for (var i = 0; i < localStorage.length; i++) {
          var key = localStorage.key(i);
          if (key.indexOf(pre) === 0 && key.slice(pre.length).indexOf('/') < 0) { var o = rd(key.slice(prefijo.length)); if (o) { o.id = key.slice(pre.length); out.push(o); } }
        }
        return Promise.resolve(out);
      },
      newId: function () { return nid(); },
      ts: function () { return Date.now(); },
      tx: function (fn) {
        var run = chain.then(function () {
          return fn({ get: function (p) { return Promise.resolve(rd(p)); }, update: upd, set: function (p, d) { wr(p, d); } });
        });
        chain = run.catch(function () { });
        return run;
      }
    };
    return api;
  }

  /* ---------------- Store: créditos + documentos ---------------- */
  function Store(fsx, uid, cfg, hooks) {
    this.fs = fsx; this.uid = uid; this.cfg = cfg; this.hooks = hooks || {};
    this.userPath = cfg.coleccionUsuarios + '/' + uid;
    this.docsPath = this.userPath + '/' + cfg.subcoleccionPlantillas;
    this.txPath = cfg.rutaTransacciones ? cfg.rutaTransacciones(uid) : this.userPath + '/transacciones';
  }
  Store.prototype.estado = function () {
    if (this.hooks.estado) return this.hooks.estado();
    var c = this.cfg;
    return this.fs.get(this.userPath).then(function (u) {
      u = u || {};
      var d = getPath(u, c.campoDesbloqueo);
      return { saldo: num(getPath(u, c.campoCreditos)), desbloqueado: !!(d && (d === true || d.desbloqueado)) };
    });
  };
  /* Canje atómico: lee saldo y desbloqueo DENTRO de la transacción.
     Si ya estaba desbloqueado no cobra. El registro de transacción
     usa un ID fijo por usuario+producto (idempotente). */
  Store.prototype.canjear = function () {
    if (this.hooks.canjear) return this.hooks.canjear(this.cfg.precio);
    var self = this, c = this.cfg, precio = c.precio;
    var txDoc = this.txPath + '/canje_' + PRODUCTO;
    return this.fs.tx(function (t) {
      return t.get(self.userPath).then(function (u) {
        if (!u) { var e0 = new Error('Usuario no encontrado'); e0.code = 'NO_USER'; throw e0; }
        var d = getPath(u, c.campoDesbloqueo);
        var saldo = num(getPath(u, c.campoCreditos));
        if (d && (d === true || d.desbloqueado)) return { ok: true, yaTenia: true, saldo: saldo };
        if (saldo < precio) { var e = new Error('Saldo insuficiente'); e.code = 'SALDO'; e.saldo = saldo; throw e; }
        var up = {};
        up[c.campoCreditos] = saldo - precio;
        up[c.campoDesbloqueo] = { desbloqueado: true, producto: PRODUCTO, costo: precio, fecha: self.fs.ts() };
        t.update(self.userPath, up);
        t.set(txDoc, {
          uid: self.uid, tipo: 'canje', producto: PRODUCTO, concepto: 'Pack de Plantillas Profesionales',
          creditos: -precio, saldoAnterior: saldo, saldoNuevo: saldo - precio, fecha: self.fs.ts(), fechaMs: Date.now()
        });
        return { ok: true, yaTenia: false, saldo: saldo - precio };
      });
    });
  };
  Store.prototype.listar = function () {
    return this.fs.list(this.docsPath).then(function (arr) {
      return arr.map(function (d) { return { id: d.id, nombre: d.nombre, tipo: d.tipo, creado: d.creado, modificado: d.modificado }; })
        .sort(function (a, b) { return (b.modificado || 0) - (a.modificado || 0); });
    });
  };
  Store.prototype.obtener = function (id) { return this.fs.get(this.docsPath + '/' + id).then(function (d) { if (d) d.id = id; return d; }); };
  Store.prototype.crear = function (nombre, tipo, data, version) {
    var id = this.fs.newId(this.docsPath), now = Date.now();
    var doc = { nombre: nombre, tipo: tipo, version: version || 1, creado: now, modificado: now, data: data };
    return this.fs.set(this.docsPath + '/' + id, doc).then(function () { doc.id = id; return doc; });
  };
  Store.prototype.guardar = function (id, cambios) {
    cambios.modificado = Date.now();
    return this.fs.update(this.docsPath + '/' + id, cambios).then(function () { return cambios.modificado; });
  };
  Store.prototype.eliminar = function (id) { return this.fs.del(this.docsPath + '/' + id); };
  Store.prototype.duplicar = function (id, nombre) {
    var self = this;
    return this.obtener(id).then(function (d) { if (!d) throw new Error('No existe'); return self.crear(nombre, d.tipo, d.data, d.version); });
  };

  /* =========================================================
     Cálculo genérico
     ========================================================= */
  function secciones(def, tipo) { return def.secciones.filter(function (s) { return s.tipo === tipo; }); }
  function sumCols(s) { return s.niveles ? s.niveles.sumar : s.columnas.filter(function (c) { return c.total; }).map(function (c) { return c.k; }); }
  function calcular(def, data) {
    var comp = { t: {}, r: {} };
    secciones(def, 'tabla').forEach(function (s) {
      var rows = (data.tablas && data.tablas[s.key]) || [], out = {}, tot = {}, sc = sumCols(s), Pp = null, Ss = null, prevO = null;
      sc.forEach(function (k) { tot[k] = 0; });
      rows.forEach(function (r) {
        var o = {};
        if (!s.niveles || r._t === 'c' || !r._t) {
          s.columnas.forEach(function (c) { if (c.calc) o[c.k] = c.calc(r, o, data, comp, prevO); });
          prevO = o;
          sc.forEach(function (k) {
            var v = num(o[k] != null ? o[k] : r[k]);
            tot[k] += v; if (Pp) Pp[k] += v; if (Ss) Ss[k] += v;
          });
        } else if (r._t === 'p') { Pp = o; Ss = null; sc.forEach(function (k) { o[k] = 0; }); }
        else { Ss = o; sc.forEach(function (k) { o[k] = 0; }); }
        out[r.id] = o;
      });
      s.columnas.forEach(function (c) {
        if (c.pctDe) rows.forEach(function (r) { var o = out[r.id]; o[c.k] = tot[c.pctDe] ? num(o[c.pctDe]) / tot[c.pctDe] : 0; });
      });
      comp.t[s.key] = { f: out, tot: tot };
    });
    var res = comp.r;
    var ctx = {
      data: data, comp: comp,
      v: function (id) { return num(res[id]); },
      p: function (k) { return num(data.params && data.params[k]); },
      campo: function (k) { return data.campos ? data.campos[k] : ''; },
      tot: function (tabla, col) { return num(comp.t[tabla] && comp.t[tabla].tot[col]); }
    };
    secciones(def, 'resumen').forEach(function (s) { s.items.forEach(function (it) { res[it.id] = it.calc(ctx); }); });
    return comp;
  }
  function fmtTxt(c, v) { if (v === null) return ''; return c.t === 'money' ? fmtMoney(v) : c.t === 'pct' ? fmtPct(v) : fmtNum(v, c.dec); }
  function fmtTipo(t, v, dec) {
    if (v === null) return '';
    if (t === 'money') return fmtMoney(v);
    if (t === 'pct') return fmtPct(v);
    if (t === 'num') return fmtNum(v, dec);
    if (t === 'letra' || t === 'texto') return esc(v);
    if (t === 'semaforo') return v ? '<span class="ipk-sem ' + semCls(v) + '">' + esc(v) + '</span>' : '';
    return esc(v);
  }
  function semCls(v) { v = String(v || '').toUpperCase(); return /ATRAS|ROJO|CR[IÍ]T/.test(v) ? 'is-rojo' : /ATENC|AMARILL|RIESGO/.test(v) ? 'is-amarillo' : v ? 'is-verde' : ''; }
  var SEM_RGB = { 'is-verde': [209, 250, 229, 22, 101, 52], 'is-amarillo': [254, 243, 199, 146, 64, 14], 'is-rojo': [254, 226, 226, 185, 28, 28] };

  /* Operaciones de filas con niveles */
  function bloque(rows, i) {
    var t = rows[i]._t || 'c', j = i + 1;
    if (t === 'p') { while (j < rows.length && rows[j]._t !== 'p') j++; }
    else if (t === 's') { while (j < rows.length && rows[j]._t !== 's' && rows[j]._t !== 'p') j++; }
    return [i, j]; // [ini, fin)
  }
  function renumerar(rows) {
    var p = 0, s = 0, c = 0, pp = '', ss = '';
    var hayP = rows.some(function (r) { return r._t === 'p'; });
    rows.forEach(function (r) {
      if (r._t === 'p') { p++; s = 0; c = 0; pp = String(p).padStart(2, '0'); ss = ''; r.clave = pp; }
      else if (r._t === 's') { s++; c = 0; ss = pp ? pp + '.' + String(s).padStart(2, '0') : String(s).padStart(2, '0'); r.clave = ss; }
      else { c++; var base = ss || pp; r.clave = (base ? base + '.' : (hayP ? '' : '')) + String(c).padStart(3, '0'); }
    });
  }

  /* =========================================================
     Gráficas de línea (SVG): Programado vs Real
     spec = { labels:[], fmt:'pct100'|'money', series:[{ nombre, valores:[n|null], rol:'prog'|'real' }] }
     ========================================================= */
  var CH = { W: 960, H: 340, l: 70, r: 150, t: 22, b: 46 };
  var TEMAS = {
    claro: { ink: '#16181D', mut: '#6B7079', grid: '#E7E7EA', surf: '#FFFFFF', prog: '#2F6BDB', real: '#C26D00' },
    oscuro: { ink: '#F1F2F4', mut: '#9AA0AB', grid: '#2B2F37', surf: '#17191E', prog: '#5B8FF0', real: '#CF7F0C' }
  };
  function fmtEje(fmt, v, corto) {
    if (fmt === 'pct100') return fmtNum(v, corto ? 0 : 1) + '%';
    if (fmt === 'money') { if (!corto) return fmtMoney(v); var a = Math.abs(v); return '$' + (a >= 1e6 ? fmtNum(v / 1e6, 1) + ' M' : a >= 1e3 ? fmtNum(v / 1e3, 0) + ' k' : fmtNum(v, 0)); }
    return fmtNum(v, 1);
  }
  function niceMax(v) { if (v <= 0) return 1; var e = Math.pow(10, Math.floor(Math.log10(v))), f = v / e, st = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]; for (var i = 0; i < st.length; i++) if (f <= st[i] + 1e-9) return st[i] * e; return 10 * e; }
  function geom(spec) {
    var n = spec.labels.length, vals = [];
    spec.series.forEach(function (s) { s.valores.forEach(function (v) { if (v !== null && v !== undefined) vals.push(num(v)); }); });
    var max = spec.fmt === 'pct100' ? Math.max(100, niceMax(Math.max.apply(null, vals.concat([0])))) : niceMax(Math.max.apply(null, vals.concat([0])));
    var pw = CH.W - CH.l - CH.r, ph = CH.H - CH.t - CH.b;
    return { n: n, max: max, pw: pw, ph: ph,
      x: function (i) { return CH.l + (n <= 1 ? pw / 2 : i * pw / (n - 1)); },
      y: function (v) { return CH.t + ph - (num(v) / max) * ph; } };
  }
  function svgChart(spec, tema) {
    var T = TEMAS[tema] || TEMAS.claro, g = geom(spec), h = [];
    if (!g.n) return '<svg viewBox="0 0 ' + CH.W + ' ' + CH.H + '" xmlns="http://www.w3.org/2000/svg"><text x="' + CH.W / 2 + '" y="' + CH.H / 2 + '" text-anchor="middle" fill="' + T.mut + '" font-size="14" font-family="Helvetica,Arial,sans-serif">Agrega semanas para ver la curva</text></svg>';
    h.push('<svg viewBox="0 0 ' + CH.W + ' ' + CH.H + '" xmlns="http://www.w3.org/2000/svg" font-family="Helvetica,Arial,sans-serif" role="img">');
    h.push('<rect width="' + CH.W + '" height="' + CH.H + '" fill="' + T.surf + '"/>');
    for (var k = 0; k <= 5; k++) {
      var v = g.max * k / 5, yy = g.y(v);
      h.push('<line x1="' + CH.l + '" x2="' + (CH.l + g.pw) + '" y1="' + yy + '" y2="' + yy + '" stroke="' + T.grid + '" stroke-width="1"/>');
      h.push('<text x="' + (CH.l - 10) + '" y="' + (yy + 4) + '" text-anchor="end" font-size="12" fill="' + T.mut + '">' + esc(fmtEje(spec.fmt, v, true)) + '</text>');
    }
    var paso = Math.max(1, Math.ceil(g.n / 14));
    spec.labels.forEach(function (lb, i) { if (i % paso === 0 || i === g.n - 1) h.push('<text x="' + g.x(i) + '" y="' + (CH.H - CH.b + 20) + '" text-anchor="middle" font-size="12" fill="' + T.mut + '">' + esc(lb) + '</text>'); });
    h.push('<line x1="' + CH.l + '" x2="' + (CH.l + g.pw) + '" y1="' + g.y(0) + '" y2="' + g.y(0) + '" stroke="' + T.mut + '" stroke-width="1"/>');
    var etiquetas = [];
    spec.series.forEach(function (s) {
      var col = T[s.rol] || T.real, segs = [], cur = [];
      s.valores.forEach(function (v, i) { if (v === null || v === undefined || v === '') { if (cur.length) segs.push(cur); cur = []; } else cur.push([g.x(i), g.y(v), i]); });
      if (cur.length) segs.push(cur);
      segs.forEach(function (sg) {
        var d = sg.map(function (p, j) { return (j ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
        if (s.rol === 'real' && sg.length > 1) h.push('<path d="' + d + ' L' + sg[sg.length - 1][0].toFixed(1) + ' ' + g.y(0) + ' L' + sg[0][0].toFixed(1) + ' ' + g.y(0) + ' Z" fill="' + col + '" fill-opacity="0.10"/>');
        h.push('<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"' + (s.rol === 'prog' ? ' stroke-dasharray="7 5"' : '') + '/>');
        sg.forEach(function (p) { h.push('<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="4" fill="' + col + '" stroke="' + T.surf + '" stroke-width="2"/>'); });
      });
      var ult = null; for (var q = s.valores.length - 1; q >= 0; q--) if (s.valores[q] !== null && s.valores[q] !== undefined && s.valores[q] !== '') { ult = q; break; }
      if (ult !== null) etiquetas.push({ x: g.x(ult), y: g.y(s.valores[ult]), txt: s.nombre + ' ' + fmtEje(spec.fmt, s.valores[ult], spec.fmt === 'money'), col: col });
    });
    etiquetas.sort(function (a, b) { return a.y - b.y; });
    for (var e = 1; e < etiquetas.length; e++) if (etiquetas[e].y - etiquetas[e - 1].y < 18) etiquetas[e].y = etiquetas[e - 1].y + 18;
    etiquetas.forEach(function (et) {
      var lx = Math.min(et.x + 12, CH.W - CH.r + 8);
      h.push('<circle cx="' + (lx + 4) + '" cy="' + (et.y - 4) + '" r="4" fill="' + et.col + '"/>');
      h.push('<text x="' + (lx + 13) + '" y="' + et.y + '" font-size="12" font-weight="700" fill="' + T.ink + '">' + esc(et.txt) + '</text>');
    });
    h.push('<line class="ipk-cross" x1="0" x2="0" y1="' + CH.t + '" y2="' + (CH.t + g.ph) + '" stroke="' + T.mut + '" stroke-width="1" stroke-dasharray="3 3" style="display:none"/>');
    h.push('</svg>');
    return h.join('');
  }
  function svgAPng(svg, w, h, jpg) {
    return new Promise(function (ok) {
      try {
        var img = new Image(), url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        img.onload = function () { var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h); ok(jpg ? c.toDataURL('image/jpeg', 0.9) : c.toDataURL('image/png')); };
        img.onerror = function () { ok(null); }; img.src = url;
      } catch (e) { ok(null); }
    });
  }
  function imagenesGraficas(def, data, comp, jpg) {
    var gs = secciones(def, 'grafico');
    return Promise.all(gs.map(function (s) { return svgAPng(svgChart(s.datos(data, comp), 'claro'), CH.W * 2, CH.H * 2, jpg); }))
      .then(function (arr) { var m = {}; gs.forEach(function (s, i) { m[s.key] = arr[i]; }); return m; });
  }
  function leyendaHTML(spec, tema) {
    var T = TEMAS[tema] || TEMAS.claro;
    return spec.series.map(function (s) { var c = T[s.rol] || T.real; return '<span class="ipk-leg"><svg viewBox="0 0 26 10" width="26" height="10"><line x1="1" y1="5" x2="25" y2="5" stroke="' + c + '" stroke-width="2.5"' + (s.rol === 'prog' ? ' stroke-dasharray="5 4"' : '') + '/><circle cx="13" cy="5" r="3.5" fill="' + c + '"/></svg>' + esc(s.nombre) + '</span>'; }).join('');
  }

  /* =========================================================
     Exportación a EXCEL (fórmulas vivas)
     ========================================================= */
  var XL_MONEY = '"$"#,##0.00;[Red]-"$"#,##0.00';
  function colL(n) { var s = ''; n++; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
  function xlFmt(t, dec) { return t === 'money' ? XL_MONEY : t === 'pct' ? '0.00%' : t === 'num' ? (dec === 0 ? '#,##0' : '#,##0.' + '0'.repeat(dec == null ? 2 : dec)) : null; }

  function exportarExcel(def, doc, cfg) {
    var IMGS = {};
    return cargarScript(cfg.libs.exceljs).then(function () { return imagenesGraficas(def, doc.data, calcular(def, doc.data)).then(function (m) { IMGS = m; }); }).then(function () {
      var ExcelJS = global.ExcelJS, data = doc.data, comp = calcular(def, data);
      var wb = new ExcelJS.Workbook(); wb.creator = cfg.marca; wb.created = new Date();
      var tablaPrin = secciones(def, 'tabla')[0];
      var cols = tablaPrin.columnas, NC = cols.length, last = colL(NC - 1);
      var ws = wb.addWorksheet(def.hoja || 'Plantilla', {
        views: [{ showGridLines: false }],
        pageSetup: { paperSize: 1, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.6, header: 0.2, footer: 0.3 } },
        headerFooter: { oddFooter: '&L&8' + (doc.nombre || '').replace(/&/g, '&&') + '&R&8Página &P de &N' }
      });
      cols.forEach(function (c, i) { ws.getColumn(i + 1).width = c.xlsAncho || Math.max(8, Math.round((c.ancho || 100) / 7)); });
      var HID = NC + 1; ws.getColumn(HID).hidden = true; ws.getColumn(HID).width = 3;
      var thin = { style: 'thin', color: { argb: 'FFD9D9DE' } };
      var border = { top: thin, left: thin, bottom: thin, right: thin };
      var F_ORANGE = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDA311' } };
      var F_INK = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111214' } };
      var F_P = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF1DA' } };
      var F_S = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F4' } };
      var F_L = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F7F8' } };
      var row = 1, campoRef = {};

      // Encabezado con logo
      ws.getRow(1).height = 26; ws.getRow(2).height = 20; ws.getRow(3).height = 18;
      if (cfg.logo) {
        try { var img = wb.addImage({ base64: cfg.logo, extension: 'png' }); ws.addImage(img, { tl: { col: 0.15, row: 0.25 }, ext: { width: 190, height: 55 } }); } catch (e) { }
      }
      var tc = Math.min(2, NC - 1);
      ws.mergeCells(colL(tc) + '1:' + last + '1'); ws.getCell(colL(tc) + '1').value = def.nombre.toUpperCase();
      ws.getCell(colL(tc) + '1').font = { bold: true, size: 15, color: { argb: 'FF111214' } }; ws.getCell(colL(tc) + '1').alignment = { horizontal: 'right', vertical: 'middle' };
      ws.mergeCells(colL(tc) + '2:' + last + '2'); ws.getCell(colL(tc) + '2').value = doc.nombre || '';
      ws.getCell(colL(tc) + '2').font = { bold: true, size: 11, color: { argb: 'FFD98200' } }; ws.getCell(colL(tc) + '2').alignment = { horizontal: 'right' };
      ws.mergeCells(colL(tc) + '3:' + last + '3'); ws.getCell(colL(tc) + '3').value = cfg.marca + ' · Generado el ' + fmtFecha(Date.now());
      ws.getCell(colL(tc) + '3').font = { size: 9, color: { argb: 'FF6B7079' } }; ws.getCell(colL(tc) + '3').alignment = { horizontal: 'right' };
      row = 4;
      for (var cI = 1; cI <= NC; cI++) ws.getCell(row, cI).border = { bottom: { style: 'medium', color: { argb: 'FFFDA311' } } };
      row += 2;

      function tituloSec(t) {
        ws.mergeCells(row, 1, row, NC); var c = ws.getCell(row, 1); c.value = t.toUpperCase();
        c.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } }; c.fill = F_INK; c.alignment = { vertical: 'middle', indent: 1 };
        ws.getRow(row).height = 20; row++;
      }
      // mitad para campos a dos columnas
      var mid = Math.ceil(NC / 2);
      function campos(s) {
        tituloSec(s.titulo);
        var lista = s.campos.slice(), i = 0;
        while (i < lista.length) {
          var a = lista[i];
          var full = a.t === 'textarea' || a.w === 4;
          var slots = full ? [[a, 1, NC]] : [[a, 1, mid]];
          if (!full && lista[i + 1] && !(lista[i + 1].t === 'textarea' || lista[i + 1].w === 4)) { slots.push([lista[i + 1], mid + 1, NC]); i += 2; } else i++;
          slots.forEach(function (sl) {
            var f = sl[0], c0 = sl[1], c1 = sl[2], v = data.campos ? data.campos[f.k] : '';
            var lab = ws.getCell(row, c0); lab.value = f.l; lab.font = { bold: true, size: 9, color: { argb: 'FF6B7079' } }; lab.fill = F_L; lab.border = border; lab.alignment = { vertical: 'top', wrapText: true };
            if (c1 > c0 + 1) ws.mergeCells(row, c0 + 1, row, c1);
            var vc = ws.getCell(row, c0 + 1);
            if (f.t === 'number') { vc.value = num(v); vc.numFmt = f.dec === 0 ? '#,##0' : '#,##0.00'; vc.alignment = { horizontal: 'left' }; }
            else if (f.t === 'date') vc.value = fechaLarga(v);
            else vc.value = v == null ? '' : String(v);
            vc.font = { size: 10 }; vc.border = border; if (f.t === 'textarea') { vc.alignment = { wrapText: true, vertical: 'top' }; }
            for (var z = c0 + 1; z <= c1; z++) ws.getCell(row, z).border = border;
            campoRef[f.k] = '$' + colL(c0) + '$' + row;
          });
          if (full && a.t === 'textarea') ws.getRow(row).height = Math.min(160, 16 * Math.max(2, String((data.campos || {})[a.k] || '').split('\n').length + 1));
          row++;
        }
        row++;
      }
      var totRef = {}, resRef = {}, paramRef = {}, filaRef = {}, colRef = {};
      function tabla(s) {
        var rows = (data.tablas && data.tablas[s.key]) || [], cc = s.columnas, out = comp.t[s.key].f, sc = sumCols(s);
        tituloSec(s.titulo);
        var hr = row;
        cc.forEach(function (c, i) {
          var h = ws.getCell(row, i + 1); h.value = c.l.toUpperCase(); h.font = { bold: true, size: 9, color: { argb: 'FF111214' } };
          h.fill = F_ORANGE; h.border = border; h.alignment = { horizontal: c.t === 'money' || c.t === 'num' || c.t === 'pct' ? 'right' : 'left', vertical: 'middle', wrapText: true };
        });
        ws.getRow(row).height = 22; row++;
        var r0 = row, rN = row + rows.length - 1, totalRow = rN + 1;
        var idx = {}; cc.forEach(function (c, i) { idx[c.k] = i; });
        var textoI = s.niveles ? idx[s.niveles.texto] : -1;
        var firstSum = s.niveles ? Math.min.apply(null, sc.map(function (k) { return idx[k]; })) : -1;
        var firstSumAll = sc.length ? Math.min.apply(null, sc.map(function (k) { return idx[k]; })) : cc.length - 1;
        var H = colL(HID - 1);
        filaRef[s.key] = rows.map(function (r, ri) { return { r: r, R: r0 + ri }; });
        colRef[s.key] = {}; cc.forEach(function (c, i) { colRef[s.key][c.k] = colL(i); });
        rows.forEach(function (r, ri) {
          var R = r0 + ri, t = s.niveles ? (r._t || 'c') : 'c', o = out[r.id] || {};
          ws.getCell(R, HID).value = t.toUpperCase();
          if (t === 'c') {
            cc.forEach(function (c, i) {
              var cell = ws.getCell(R, i + 1);
              if (c.pctDe) { cell.value = { formula: 'IFERROR(' + colL(idx[c.pctDe]) + R + '/' + colL(idx[c.pctDe]) + totalRow + ',0)', result: o[c.k] }; }
              else if (c.formula) {
                var f = c.formula.replace(/\{@(\w+)\}/g, function (_, k) { return campoRef[k] || '0'; })
                  .replace(/\{#(\w+)\.(\w+)\}/g, function (_, t, k) { return totRef[t + '.' + k] || '0'; })
                  .replace(/\{\^(\w+)\}/g, function (_, k) { return ri > 0 && idx[k] != null ? colL(idx[k]) + (R - 1) : '0'; })
                  .replace(/\{(\w+)\}/g, function (_, k) { return idx[k] != null ? colL(idx[k]) + R : '0'; });
                cell.value = { formula: f, result: c.t === 'semaforo' ? (o[c.k] || '') : o[c.k] === null ? '' : num(o[c.k]) };
                if (c.t === 'semaforo') { cell.font = { bold: true, size: 9 }; }
              } else if (c.calc) cell.value = num(o[c.k]);
              else if (c.t === 'money' || c.t === 'num' || c.t === 'pct') cell.value = r[c.k] === '' || r[c.k] == null ? null : num(r[c.k]);
              else cell.value = r[c.k] == null ? '' : String(r[c.k]);
              var fm = xlFmt(c.t, c.dec); if (fm) cell.numFmt = fm;
              cell.border = border; cell.font = { size: 9.5 };
              cell.alignment = { vertical: 'top', wrapText: c.t === 'textarea' || c.t === 'text', horizontal: fm ? 'right' : (c.t === 'unidad' ? 'center' : 'left') };
            });
          } else {
            var fin = bloque(rows, ri)[1], a = R + 1, b = r0 + fin - 1;
            cc.forEach(function (c, i) {
              var cell = ws.getCell(R, i + 1);
              if (i < textoI) cell.value = r[c.k] == null ? '' : String(r[c.k]);
              else if (i === textoI) cell.value = String(r[c.k] || '').toUpperCase();
              else if (sc.indexOf(c.k) >= 0) {
                cell.value = b >= a ? { formula: 'SUMIF(' + H + a + ':' + H + b + ',"C",' + colL(i) + a + ':' + colL(i) + b + ')', result: num(o[c.k]) } : 0;
                cell.numFmt = xlFmt(c.t, c.dec) || XL_MONEY;
              } else if (c.pctDe) { cell.value = { formula: 'IFERROR(' + colL(idx[c.pctDe]) + R + '/' + colL(idx[c.pctDe]) + totalRow + ',0)', result: o[c.k] }; cell.numFmt = '0.00%'; }
              cell.fill = t === 'p' ? F_P : F_S; cell.border = border;
              cell.font = { bold: true, size: t === 'p' ? 10 : 9.5, color: { argb: t === 'p' && sc.indexOf(c.k) >= 0 ? 'FFB86E00' : 'FF111214' } };
              cell.alignment = { vertical: 'middle', horizontal: sc.indexOf(c.k) >= 0 || c.pctDe ? 'right' : 'left', wrapText: i === textoI };
            });
            if (firstSum - 1 > textoI) ws.mergeCells(R, textoI + 1, R, firstSum);
          }
        });
        cc.forEach(function (c, i) {
          if (c.t !== 'semaforo' || !rows.length) return;
          var ref = colL(i) + r0 + ':' + colL(i) + rN;
          var mk = function (txt, bg, fg) { return { type: 'containsText', operator: 'containsText', text: txt, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: bg } }, font: { color: { argb: fg }, bold: true } } }; };
          ws.addConditionalFormatting({ ref: ref, rules: [mk('ATRASADO', 'FFFEE2E2', 'FFB91C1C'), mk('ATENCI', 'FFFEF3C7', 'FF92400E'), mk('EN TIEMPO', 'FFD1FAE5', 'FF166534')] });
          for (var q = r0; q <= rN; q++) ws.getCell(q, i + 1).alignment = { horizontal: 'center', vertical: 'middle' };
        });
        // fila total
        if (s.sinTotal) { if (tablaPrin === s) { ws.views = [{ state: 'frozen', ySplit: hr, showGridLines: false }]; ws.pageSetup.printTitlesRow = hr + ':' + hr; } row = rN + 2; return; }
        var labEnd = Math.max(1, firstSumAll);
        ws.mergeCells(totalRow, 1, totalRow, labEnd);
        var lt = ws.getCell(totalRow, 1); lt.value = (s.totalLabel || 'TOTAL').toUpperCase(); lt.alignment = { horizontal: 'right', vertical: 'middle' };
        for (var z = 1; z <= Math.max(cc.length, 1); z++) { var zc = ws.getCell(totalRow, z); zc.fill = F_INK; zc.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }; zc.border = border; }
        sc.forEach(function (k) {
          var ci = idx[k], L = colL(ci), cell = ws.getCell(totalRow, ci + 1);
          cell.value = rows.length ? { formula: 'SUMIF(' + H + r0 + ':' + H + rN + ',"C",' + L + r0 + ':' + L + rN + ')', result: comp.t[s.key].tot[k] } : 0;
          cell.numFmt = XL_MONEY; cell.font = { bold: true, color: { argb: 'FFFDA311' }, size: 10.5 }; cell.alignment = { horizontal: 'right' };
          totRef[s.key + '.' + k] = '$' + L + '$' + totalRow;
        });
        cc.forEach(function (c, i) { if (c.pctDe) { var pc = ws.getCell(totalRow, i + 1); pc.value = rows.length ? 1 : 0; pc.numFmt = '0.00%'; pc.alignment = { horizontal: 'right' }; } });
        ws.getRow(totalRow).height = 20;
        if (tablaPrin === s) ws.views = [{ state: 'frozen', ySplit: hr, showGridLines: false }];
        if (tablaPrin === s) ws.pageSetup.printTitlesRow = hr + ':' + hr;
        row = totalRow + 2;
      }
      function resumen(s) {
        tituloSec(s.titulo || 'Resumen');
        var vi = NC, pi = NC - 1; // columnas de valor y parámetro
        var R = {
          total: function (t, c) { return totRef[t + '.' + c] || '0'; },
          id: function (x) { return resRef[x] || '0'; },
          param: function (k) { return paramRef[k] || '0'; },
          data: data,
          campo: function (k) { return campoRef[k] || '0'; },
          rango: function (t, col) {
            var L = colRef[t] && colRef[t][col], lst = filaRef[t] || [];
            return L && lst.length ? L + lst[0].R + ':' + L + lst[lst.length - 1].R : '0';
          },
          filas: function (t, col, pred) {
            var L = colRef[t] && colRef[t][col], lst = (filaRef[t] || []).filter(function (x) { return pred(x.r); });
            if (!L || !lst.length) return '0';
            return 'SUM(' + lst.map(function (x) { return L + x.R; }).join(',') + ')';
          }
        };
        s.items.forEach(function (it) {
          if (it.kpi) return;
          var big = it.destacado;
          if (it.t === 'letra' || it.t === 'texto') {
            ws.mergeCells(row, 1, row, NC); var c = ws.getCell(row, 1);
            c.value = (it.l ? it.l + ': ' : '') + comp.r[it.id]; c.font = { bold: true, size: 9.5 }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF1DA' } };
            c.alignment = { wrapText: true, vertical: 'middle', indent: 1 }; ws.getRow(row).height = 22; row++; return;
          }
          ws.mergeCells(row, 1, row, pi - 1);
          var l = ws.getCell(row, 1); l.value = it.l; l.alignment = { horizontal: 'right', vertical: 'middle' };
          l.font = { bold: true, size: big ? 11.5 : 10, color: { argb: 'FF111214' } };
          if (it.param) {
            var pc = ws.getCell(row, pi); pc.value = num(data.params[it.param.k]) / (it.param.suf === '%' ? 100 : 1);
            pc.numFmt = it.param.suf === '%' ? '0.00%' : '#,##0.00'; pc.alignment = { horizontal: 'right' }; pc.font = { color: { argb: 'FF2563EB' }, bold: true };
            pc.border = border; paramRef[it.param.k] = '$' + colL(pi - 1) + '$' + row;
          }
          var vc = ws.getCell(row, vi); resRef[it.id] = '$' + colL(vi - 1) + '$' + row;
          var f = it.xls ? it.xls(R) : null;
          vc.value = f ? { formula: f, result: comp.r[it.id] } : num(comp.r[it.id]);
          vc.numFmt = it.t === 'pct' ? '0.00%' : it.t === 'num' ? (xlFmt('num', it.dec)) : XL_MONEY;
          vc.font = { bold: true, size: big ? 12 : 10, color: { argb: big ? 'FFB86E00' : 'FF111214' } };
          vc.border = big ? { top: { style: 'medium', color: { argb: 'FF111214' } }, bottom: { style: 'double', color: { argb: 'FF111214' } } } : { bottom: thin };
          if (big) ws.getRow(row).height = 22;
          row++;
        });
        row++;
      }

      function grafico(s) {
        tituloSec(s.titulo);
        if (IMGS[s.key]) {
          var im = wb.addImage({ base64: IMGS[s.key], extension: 'png' });
          ws.addImage(im, { tl: { col: 0, row: row - 1 + 0.3 }, ext: { width: 900, height: 319 } });
          row += 17;
        } else { ws.getCell(row, 1).value = 'Gráfica disponible en la plataforma y en el PDF.'; row += 2; }
      }
      def.secciones.forEach(function (s) {
        if (s.tipo === 'campos') campos(s);
        else if (s.tipo === 'tabla') tabla(s);
        else if (s.tipo === 'resumen') resumen(s);
        else if (s.tipo === 'grafico') grafico(s);
      });
      // Firmas
      if (def.firmas && def.firmas.length) {
        row += 2;
        var n = def.firmas.length, span = Math.floor(NC / n) || 1;
        def.firmas.forEach(function (f, i) {
          var c0 = i * span + 1, c1 = i === n - 1 ? NC : c0 + span - 1;
          if (c1 > c0) { ws.mergeCells(row, c0, row, c1); ws.mergeCells(row + 1, c0, row + 1, c1); }
          var a = ws.getCell(row, c0); a.value = (data.campos && data.campos[f.k]) || ''; a.alignment = { horizontal: 'center' }; a.font = { size: 10, bold: true };
          for (var z = c0; z <= c1; z++) ws.getCell(row, z).border = { top: { style: 'thin', color: { argb: 'FF111214' } } };
          var b = ws.getCell(row + 1, c0); b.value = f.l.toUpperCase(); b.alignment = { horizontal: 'center' }; b.font = { size: 8.5, color: { argb: 'FF6B7079' }, bold: true };
        });
        ws.getRow(row - 1).height = 34;
      }
      return wb.xlsx.writeBuffer().then(function (buf) {
        descargarBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), slug(doc.nombre) + '.xlsx');
      });
    });
  }

  /* =========================================================
     Exportación a PDF (jsPDF + autoTable)
     ========================================================= */
  function exportarPDF(def, doc, cfg) {
    var IMGS = {};
    return cargarScript(cfg.libs.jspdf).then(function () { return cargarScript(cfg.libs.autotable); }).then(function () { return imagenesGraficas(def, doc.data, calcular(def, doc.data), true).then(function (m) { IMGS = m; }); }).then(function () {
      var jsPDF = global.jspdf.jsPDF, data = doc.data, comp = calcular(def, data);
      var pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
      var W = pdf.internal.pageSize.getWidth(), Hh = pdf.internal.pageSize.getHeight(), M = 36;
      var ORANGE = [253, 163, 17], INK = [17, 18, 20], MUT = [107, 112, 121];
      function header() {
        if (cfg.logo) { try { pdf.addImage(cfg.logo, 'PNG', M, 18, 118, 34); } catch (e) { } }
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13); pdf.setTextColor.apply(pdf, INK);
        pdf.text(T(def.nombre.toUpperCase()), W - M, 32, { align: 'right' });
        pdf.setFontSize(9.5); pdf.setTextColor(184, 110, 0); pdf.text(T(doc.nombre), W - M, 46, { align: 'right' });
        pdf.setDrawColor.apply(pdf, ORANGE); pdf.setLineWidth(2); pdf.line(M, 60, W - M, 60);
      }
      function footer(n) {
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor.apply(pdf, MUT);
        pdf.text(T(cfg.marca + ' · ' + def.nombre + ' · ' + fmtFecha(Date.now())), M, Hh - 18);
        pdf.text('Página ' + n + ' de {total}', W - M, Hh - 18, { align: 'right' });
      }
      var y = 72;
      var T = function (x) { return String(x == null ? '' : x).replace(/²/g, '2').replace(/³/g, '3').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[−–]/g, '-').replace(/[·•]/g, '·'); };
      var base = { didParseCell: function (d) { d.cell.text = d.cell.text.map(T); }, margin: { left: M, right: M, top: 72, bottom: 34 }, styles: { font: 'helvetica', fontSize: 8, cellPadding: 4, lineColor: [225, 225, 230], lineWidth: 0.5, textColor: INK, overflow: 'linebreak' }, didDrawPage: function () { header(); footer(pdf.internal.getNumberOfPages()); } };
      function tit(t) {
        if (y > Hh - 90) { pdf.addPage(); y = 72; }
        pdf.autoTable(Object.assign({}, base, { startY: y, body: [[{ content: t.toUpperCase(), styles: { fillColor: INK, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 } }]], theme: 'plain' }));
        y = pdf.lastAutoTable.finalY;
      }
      def.secciones.forEach(function (s) {
        if (s.tipo === 'campos') {
          tit(s.titulo);
          var body = [], fila = [];
          s.campos.forEach(function (f) {
            var v = data.campos ? data.campos[f.k] : '';
            v = f.t === 'date' ? fechaLarga(v) : f.t === 'number' ? (v === '' || v == null ? '' : fmtNum(v, f.dec)) : (v || '');
            if (f.t === 'textarea' || f.w === 4) {
              if (fila.length) { while (fila.length < 4) fila.push(''); body.push(fila); fila = []; }
              body.push([{ content: f.l, styles: { fontStyle: 'bold', textColor: MUT, fillColor: [247, 247, 248] } }, { content: v, colSpan: 3 }]);
              return;
            }
            fila.push({ content: f.l, styles: { fontStyle: 'bold', textColor: MUT, fillColor: [247, 247, 248] } }, v);
            if (fila.length === 4) { body.push(fila); fila = []; }
          });
          if (fila.length) { while (fila.length < 4) fila.push(''); body.push(fila); }
          pdf.autoTable(Object.assign({}, base, { startY: y, body: body, theme: 'grid', columnStyles: { 0: { cellWidth: 120 }, 2: { cellWidth: 120 } } }));
          y = pdf.lastAutoTable.finalY + 12;
        } else if (s.tipo === 'tabla') {
          tit(s.titulo);
          var rows = (data.tablas && data.tablas[s.key]) || [], cc = s.columnas, out = comp.t[s.key].f, sc = sumCols(s);
          var idx = {}; cc.forEach(function (c, i) { idx[c.k] = i; });
          var textoI = s.niveles ? idx[s.niveles.texto] : -1;
          var firstSum = s.niveles ? Math.min.apply(null, sc.map(function (k) { return idx[k]; })) : -1;
          var head = [cc.map(function (c) { return { content: c.l.toUpperCase(), styles: { halign: c.t === 'money' || c.t === 'num' || c.t === 'pct' ? 'right' : 'left' } }; })];
          var body2 = rows.map(function (r) {
            var t = s.niveles ? (r._t || 'c') : 'c', o = out[r.id] || {};
            if (t === 'c') return cc.map(function (c) {
              var v = c.calc || c.pctDe ? o[c.k] : r[c.k];
              var isN = c.t === 'money' || c.t === 'num' || c.t === 'pct';
              var txt = isN ? (v === '' || v == null ? '' : (c.t === 'money' ? fmtMoney(v) : c.t === 'pct' ? fmtPct(v) : fmtNum(v, c.dec))) : String(v == null ? '' : v);
              if (c.t === 'semaforo') { var sr = SEM_RGB[semCls(v)]; return { content: String(v || ''), styles: sr ? { halign: 'center', fontStyle: 'bold', fillColor: sr.slice(0, 3), textColor: sr.slice(3) } : { halign: 'center' } }; }
              return { content: txt, styles: { halign: isN ? 'right' : (c.t === 'unidad' ? 'center' : 'left') } };
            });
            var fill = t === 'p' ? [255, 241, 218] : [242, 242, 244], cells = [];
            cc.forEach(function (c, i) {
              if (i < textoI) cells.push({ content: String(r[c.k] || ''), styles: { fillColor: fill, fontStyle: 'bold' } });
              else if (i === textoI) cells.push({ content: String(r[c.k] || '').toUpperCase(), colSpan: Math.max(1, firstSum - textoI), styles: { fillColor: fill, fontStyle: 'bold' } });
              else if (i > textoI && i < firstSum) { /* cubierta por colSpan */ }
              else if (sc.indexOf(c.k) >= 0) cells.push({ content: fmtTxt(c, o[c.k]), styles: { fillColor: fill, fontStyle: 'bold', halign: 'right', textColor: t === 'p' ? [184, 110, 0] : INK } });
              else if (c.pctDe) cells.push({ content: fmtPct(o[c.k]), styles: { fillColor: fill, fontStyle: 'bold', halign: 'right' } });
              else cells.push({ content: '', styles: { fillColor: fill } });
            });
            return cells;
          });
          var foot = [];
          var fcells = [], labSpan = sc.length ? Math.min.apply(null, sc.map(function (k) { return idx[k]; })) : cc.length - 1;
          fcells.push({ content: (s.totalLabel || 'TOTAL').toUpperCase(), colSpan: labSpan, styles: { halign: 'right' } });
          cc.forEach(function (c, i) {
            if (i < labSpan) return;
            if (sc.indexOf(c.k) >= 0) fcells.push({ content: fmtTxt(c, comp.t[s.key].tot[c.k]), styles: { halign: 'right', textColor: ORANGE } });
            else if (c.pctDe) fcells.push({ content: rows.length ? '100.00%' : '0.00%', styles: { halign: 'right' } });
            else fcells.push('');
          });
          if (!s.sinTotal) foot.push(fcells);
          var colStyles = {}; var totalW = W - 2 * M, sumA = cc.reduce(function (a, c) { return a + (c.ancho || 100); }, 0);
          cc.forEach(function (c, i) { colStyles[i] = { cellWidth: totalW * (c.ancho || 100) / sumA }; });
          pdf.autoTable(Object.assign({}, base, {
            startY: y, head: head, body: body2, foot: foot, theme: 'grid', showFoot: 'lastPage',
            headStyles: { fillColor: ORANGE, textColor: INK, fontStyle: 'bold', fontSize: 7.5 },
            footStyles: { fillColor: INK, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
            columnStyles: colStyles
          }));
          y = pdf.lastAutoTable.finalY + 12;
        } else if (s.tipo === 'grafico') {
          var gw = W - 2 * M, gh = gw * CH.H / CH.W;
          if (y + gh + 30 > Hh - 40) { pdf.addPage(); y = 72; }
          tit(s.titulo);
          if (IMGS[s.key]) { try { pdf.addImage(IMGS[s.key], 'JPEG', M, y + 6, gw, gh); } catch (e) { } }
          y += gh + 18;
        } else if (s.tipo === 'resumen') {
          var rb = [], letra = [];
          s.items.forEach(function (it) {
            if (it.kpi) return;
            if (it.t === 'letra' || it.t === 'texto') { letra.push((it.l ? it.l + ': ' : '') + comp.r[it.id]); return; }
            var lab = it.l + (it.param ? ' (' + fmtNum(data.params[it.param.k]) + (it.param.suf || '') + ')' : '');
            var v = comp.r[it.id], txt = it.t === 'pct' ? fmtPct(v) : it.t === 'num' ? fmtNum(v, it.dec) : fmtMoney(v);
            var st = it.destacado ? { fontStyle: 'bold', fontSize: 11, textColor: [184, 110, 0] } : { fontStyle: 'bold' };
            rb.push([{ content: lab, styles: { halign: 'right', fontStyle: it.destacado ? 'bold' : 'normal', fontSize: it.destacado ? 11 : 8.5 } }, { content: txt, styles: Object.assign({ halign: 'right' }, st) }]);
          });
          if (y > Hh - 60 - rb.length * 18) { pdf.addPage(); y = 72; }
          pdf.autoTable(Object.assign({}, base, { startY: y, body: rb, theme: 'plain', margin: Object.assign({}, base.margin, { left: W - M - 330 }), columnStyles: { 0: { cellWidth: 200 }, 1: { cellWidth: 130 } } }));
          y = pdf.lastAutoTable.finalY + 6;
          letra.forEach(function (t) {
            pdf.autoTable(Object.assign({}, base, { startY: y, body: [[{ content: t, styles: { fillColor: [255, 241, 218], fontStyle: 'bold' } }]], theme: 'plain' }));
            y = pdf.lastAutoTable.finalY + 12;
          });
        }
      });
      if (def.firmas && def.firmas.length) {
        if (y > Hh - 110) { pdf.addPage(); y = 72; }
        y += 48; var n = def.firmas.length, w = (W - 2 * M) / n;
        def.firmas.forEach(function (f, i) {
          var x0 = M + i * w + 20, x1 = M + (i + 1) * w - 20, cx = (x0 + x1) / 2;
          pdf.setDrawColor.apply(pdf, INK); pdf.setLineWidth(0.7); pdf.line(x0, y, x1, y);
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5); pdf.setTextColor.apply(pdf, INK);
          pdf.text(T((data.campos && data.campos[f.k]) || ''), cx, y + 12, { align: 'center' });
          pdf.setFontSize(7.5); pdf.setTextColor.apply(pdf, MUT); pdf.text(T(f.l.toUpperCase()), cx, y + 23, { align: 'center' });
        });
      }
      if (typeof pdf.putTotalPages === 'function') pdf.putTotalPages('{total}');
      pdf.save(slug(doc.nombre) + '.pdf');
    });
  }

  /* =========================================================
     Impresión (HTML limpio en iframe)
     ========================================================= */
  function htmlImpresion(def, doc, cfg) {
    var data = doc.data, comp = calcular(def, data), h = [];
    h.push('<!doctype html><html><head><meta charset="utf-8"><title>' + esc(doc.nombre) + '</title><style>' +
      '@page{size:letter landscape;margin:12mm}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}body{font-family:Helvetica,Arial,sans-serif;color:#111214;font-size:10px;margin:0}' +
      '.hd{display:flex;justify-content:space-between;align-items:center;border-bottom:2.5px solid #FDA311;padding-bottom:8px;margin-bottom:10px}.hd img{height:42px}.hd h1{margin:0;font-size:15px;text-align:right}.hd h2{margin:2px 0 0;font-size:11px;color:#B86E00;text-align:right}' +
      '.st{background:#111214;color:#fff;font-weight:700;font-size:9.5px;letter-spacing:.08em;padding:5px 8px;margin:12px 0 0}' +
      'table{width:100%;border-collapse:collapse}td,th{border:1px solid #E1E1E6;padding:4px 6px;vertical-align:top}th{background:#FDA311;font-size:8.5px;text-transform:uppercase;text-align:left}' +
      '.l{background:#F7F7F8;color:#6B7079;font-weight:700;width:14%}.n{text-align:right;white-space:nowrap}.p td{background:#FFF1DA;font-weight:700}.s td{background:#F2F2F4;font-weight:700}' +
      'tfoot td{background:#111214;color:#fff;font-weight:700}tfoot .n{color:#FDA311}thead{display:table-header-group}tr{page-break-inside:avoid}' +
      '.res{width:340px;margin:10px 0 0 auto}.res td{border:0;border-bottom:1px dashed #ddd}.res .big td{font-size:13px;font-weight:800;color:#B86E00;border-bottom:0}' +
      '.letra{background:#FFF1DA;padding:7px 9px;font-weight:700;margin-top:8px}.firmas{display:flex;gap:40px;margin-top:60px}.firmas div{flex:1;border-top:1px solid #111;text-align:center;padding-top:4px;font-weight:700}.firmas small{display:block;color:#6B7079;font-size:8px;letter-spacing:.08em}' +
      '</style></head><body>');
    h.push('<div class="hd">' + (cfg.logo ? '<img src="' + cfg.logo + '">' : '<b>' + esc(cfg.marca) + '</b>') + '<div><h1>' + esc(def.nombre.toUpperCase()) + '</h1><h2>' + esc(doc.nombre) + '</h2></div></div>');
    def.secciones.forEach(function (s) {
      if (s.tipo === 'grafico') {
        var sp = s.datos(data, comp);
        h.push('<div class="st">' + esc(s.titulo.toUpperCase()) + '</div><div style="page-break-inside:avoid;margin-top:6px">' + svgChart(sp, 'claro').replace('<svg ', '<svg style="width:100%;height:auto" ') + '</div>');
        return;
      }
      if (s.tipo === 'campos') {
        h.push('<div class="st">' + esc(s.titulo.toUpperCase()) + '</div><table>');
        var fila = [];
        s.campos.forEach(function (f) {
          var v = data.campos ? data.campos[f.k] : ''; v = f.t === 'date' ? fechaLarga(v) : f.t === 'number' ? (v === '' || v == null ? '' : fmtNum(v, f.dec)) : (v || '');
          if (f.t === 'textarea' || f.w === 4) { if (fila.length) { h.push('<tr>' + fila.join('') + '<td></td><td></td></tr>'); fila = []; } h.push('<tr><td class="l">' + esc(f.l) + '</td><td colspan="3" style="white-space:pre-wrap">' + esc(v) + '</td></tr>'); return; }
          fila.push('<td class="l">' + esc(f.l) + '</td><td>' + esc(v) + '</td>');
          if (fila.length === 2) { h.push('<tr>' + fila.join('') + '</tr>'); fila = []; }
        });
        if (fila.length) h.push('<tr>' + fila.join('') + '<td></td><td></td></tr>');
        h.push('</table>');
      } else if (s.tipo === 'tabla') {
        var rows = (data.tablas && data.tablas[s.key]) || [], cc = s.columnas, out = comp.t[s.key].f, sc = sumCols(s);
        var idx = {}; cc.forEach(function (c, i) { idx[c.k] = i; });
        var textoI = s.niveles ? idx[s.niveles.texto] : -1, firstSum = s.niveles ? Math.min.apply(null, sc.map(function (k) { return idx[k]; })) : -1;
        h.push('<div class="st">' + esc(s.titulo.toUpperCase()) + '</div><table><thead><tr>' + cc.map(function (c) { return '<th' + (c.t === 'money' || c.t === 'num' || c.t === 'pct' ? ' class="n"' : '') + ' style="width:' + (c.ancho || 100) + 'px">' + esc(c.l) + '</th>'; }).join('') + '</tr></thead><tbody>');
        rows.forEach(function (r) {
          var t = s.niveles ? (r._t || 'c') : 'c', o = out[r.id] || {};
          if (t === 'c') {
            h.push('<tr>' + cc.map(function (c) { var v = c.calc || c.pctDe ? o[c.k] : r[c.k]; var isN = c.t === 'money' || c.t === 'num' || c.t === 'pct'; if (c.t === 'semaforo') { var sr = SEM_RGB[semCls(v)]; return '<td style="text-align:center;font-weight:700' + (sr ? ';background:rgb(' + sr.slice(0, 3).join(',') + ');color:rgb(' + sr.slice(3).join(',') + ')' : '') + '">' + esc(v || '') + '</td>'; } return '<td' + (isN ? ' class="n"' : '') + '>' + (isN ? (v === '' || v == null ? '' : c.t === 'money' ? fmtMoney(v) : c.t === 'pct' ? fmtPct(v) : fmtNum(v, c.dec)) : esc(v)) + '</td>'; }).join('') + '</tr>');
          } else {
            var tds = '';
            cc.forEach(function (c, i) {
              if (i < textoI) tds += '<td>' + esc(r[c.k]) + '</td>';
              else if (i === textoI) tds += '<td colspan="' + Math.max(1, firstSum - textoI) + '">' + esc(String(r[c.k] || '').toUpperCase()) + '</td>';
              else if (i < firstSum) { }
              else if (sc.indexOf(c.k) >= 0) tds += '<td class="n">' + fmtTxt(c, o[c.k]) + '</td>';
              else if (c.pctDe) tds += '<td class="n">' + fmtPct(o[c.k]) + '</td>';
              else tds += '<td></td>';
            });
            h.push('<tr class="' + t + '">' + tds + '</tr>');
          }
        });
        var labSpan = sc.length ? Math.min.apply(null, sc.map(function (k) { return idx[k]; })) : cc.length - 1, ft = '<td colspan="' + labSpan + '" class="n">' + esc((s.totalLabel || 'TOTAL').toUpperCase()) + '</td>';
        cc.forEach(function (c, i) { if (i < labSpan) return; ft += sc.indexOf(c.k) >= 0 ? '<td class="n">' + fmtTxt(c, comp.t[s.key].tot[c.k]) + '</td>' : c.pctDe ? '<td class="n">100.00%</td>' : '<td></td>'; });
        h.push(s.sinTotal ? '</tbody></table>' : '</tbody><tfoot><tr>' + ft + '</tr></tfoot></table>');
      } else if (s.tipo === 'resumen') {
        var letras2 = [];
        h.push('<table class="res">');
        s.items.forEach(function (it) {
          if (it.kpi) return;
          if (it.t === 'letra' || it.t === 'texto') { letras2.push((it.l ? it.l + ': ' : '') + comp.r[it.id]); return; }
          var v = comp.r[it.id], txt = it.t === 'pct' ? fmtPct(v) : it.t === 'num' ? fmtNum(v, it.dec) : fmtMoney(v);
          h.push('<tr' + (it.destacado ? ' class="big"' : '') + '><td class="n">' + esc(it.l) + (it.param ? ' (' + fmtNum(data.params[it.param.k]) + (it.param.suf || '') + ')' : '') + '</td><td class="n"><b>' + txt + '</b></td></tr>');
        });
        h.push('</table>');
        letras2.forEach(function (t) { h.push('<div class="letra">' + esc(t) + '</div>'); });
      }
    });
    if (def.firmas && def.firmas.length) h.push('<div class="firmas">' + def.firmas.map(function (f) { return '<div>' + esc((data.campos && data.campos[f.k]) || '&nbsp;') + '<small>' + esc(f.l.toUpperCase()) + '</small></div>'; }).join('') + '</div>');
    h.push('</body></html>');
    return h.join('');
  }
  function imprimir(def, doc, cfg) {
    var f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(f);
    var d = f.contentWindow.document; d.open(); d.write(htmlImpresion(def, doc, cfg)); d.close();
    var go = function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { } setTimeout(function () { f.remove(); }, 60000); };
    var im = d.images[0]; if (im && !im.complete) { im.onload = go; im.onerror = go; } else setTimeout(go, 150);
  }

  /* =========================================================
     APP (UI)
     ========================================================= */
  function App(opts) {
    opts = opts || {};
    this.opts = opts;
    this.cfg = Object.assign({}, DEF_CFG, opts.config || {});
    this.cfg.libs = Object.assign({}, DEF_CFG.libs, (opts.config || {}).libs || {});
    this.cfg.logo = this.cfg.logo || global.IMFRA_PLANTILLAS_LOGO || null;
    this.root = typeof opts.mount === 'string' ? document.querySelector(opts.mount) : opts.mount;
    if (!this.root) throw new Error('ImfraPlantillas: no existe el contenedor mount');
    this.root.classList.add('ipk');
    var fsx = opts.fs || (opts.firestoreModular ? fsModular(opts.db, opts.firestoreModular) : (opts.db ? fsCompat(opts.db, opts.firebase) : fsLocal()));
    this.store = new Store(fsx, opts.uid || 'demo', this.cfg, opts.creditos);
    this.estado = { saldo: 0, desbloqueado: false };
    this.vista = 'cargando'; this.tab = 'catalogo'; this.filtro = 'TODAS'; this.busca = ''; this.filtroTipo = '';
    this.misDocs = []; this.doc = null; this.def = null; this.comp = null;
    this._tarjetas = [];
    this._saveChain = Promise.resolve();
    var self = this;
    this.root.addEventListener('click', function (e) { self._click(e); });
    this.root.addEventListener('input', function (e) { self._input(e); });
    this.root.addEventListener('change', function (e) { self._change(e); });
    this._onKey = function (e) { if (e.key === 'Escape') { self._cerrarMenu(); } };
    document.addEventListener('keydown', this._onKey);
    this._onVis = function () { if (document.visibilityState === 'hidden') self._flush(); };
    document.addEventListener('visibilitychange', this._onVis);
    global.addEventListener('beforeunload', function (e) { if (self._pendiente) { self._flush(); e.preventDefault(); e.returnValue = ''; } });
    if (global.MutationObserver) {
      var mo = new MutationObserver(function () { if (self.vista === 'editor' && self.def && secciones(self.def, 'grafico').length) self._graficas(); });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
      if (document.body) mo.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    }
    this._toasts = document.createElement('div'); this._toasts.className = 'ipk ipk-toasts'; document.body.appendChild(this._toasts);
  }

  App.prototype.iniciar = function () {
    var self = this;
    this._html('<div class="ipk-loading"><span class="ipk-spin"></span> Cargando…</div>');
    return this.store.estado().then(function (st) {
      self.estado = st; self._syncTarjetas();
      if (st.desbloqueado) return self.irInicio();
      self.vista = 'lock'; self._render();
    }).catch(function (e) { console.error(e); self._html('<div class="ipk-empty">' + ico('alerta', '') + '<b>No se pudo cargar el pack</b>' + esc(e.message || '') + '</div>'); });
  };
  App.prototype.abrir = function () { if (this.opts.mostrar) this.opts.mostrar(); return this.iniciar(); };
  App.prototype._html = function (h) { this.root.innerHTML = h; };
  App.prototype._crumb = function (extra) {
    return '<div class="ipk-crumb"><button data-act="volver-panel">Retos</button><span>›</span><button data-act="volver-panel">Recompensas IMFRA</button><span>›</span>' +
      (extra ? '<button data-act="inicio">Pack de plantillas</button><span>›</span><b>' + esc(extra) + '</b>' : '<b>Pack de plantillas profesionales</b>') + '</div>';
  };
  App.prototype._render = function () {
    if (this.vista === 'lock') return this._renderLock();
    if (this.vista === 'ok') return this._renderOk();
    if (this.vista === 'inicio') return this._renderInicio();
    if (this.vista === 'editor') return this._renderEditor();
  };

  /* ---------- Bloqueado / canje ---------- */
  App.prototype._renderLock = function () {
    var p = this.cfg.precio, s = this.estado.saldo, falta = Math.max(0, p - s), pct = Math.min(100, s / p * 100);
    var disponibles = CATALOGO.filter(function (c) { return !!REGISTRO[c.id]; });
    var lista = disponibles.map(function (c) { return '<div class="ipk-li"><span class="ipk-ico">' + ico(c.icon) + '</span>' + esc(c.nombre) + '</div>'; }).join('');
    this._html(this._crumb() +
      '<div class="ipk-hero"><span class="ipk-eyebrow">' + ico('candado') + ' Recompensas IMFRA</span><h1>PACK DE PLANTILLAS PROFESIONALES</h1><p>Formatos técnicos listos para ayudarte a presupuestar, controlar y documentar tus obras.</p></div>' +
      '<div class="ipk-lock"><div class="ipk-box"><h2>' + disponibles.length + ' plantillas editables disponibles</h2><p class="ipk-sub">Se abren dentro de tu panel, calculan solas y se guardan en tu cuenta. La plantilla de Bitácora se incorporará próximamente al mismo pack.</p><div class="ipk-list">' + lista + '</div>' +
      '<div class="ipk-feats">' +
      '<div class="ipk-feat">' + ico('check') + '<div><b>Edición en línea</b>Agrega, duplica y elimina filas con cálculos automáticos.</div></div>' +
      '<div class="ipk-feat">' + ico('check') + '<div><b>Autoguardado</b>Tu trabajo se guarda solo mientras capturas.</div></div>' +
      '<div class="ipk-feat">' + ico('check') + '<div><b>Excel, PDF e impresión</b>Excel con fórmulas vivas y PDF listo para entregar.</div></div>' +
      '<div class="ipk-feat">' + ico('check') + '<div><b>Mis plantillas</b>Una copia por proyecto: abre, duplica y renombra.</div></div>' +
      '</div></div>' +
      '<div class="ipk-box ipk-price"><span class="ipk-eyebrow">Canje único · acceso permanente</span><div class="ipk-amt">' + fmtNum(p, 0) + '<small>créditos</small></div>' +
      '<div class="ipk-bal"><div class="ipk-bal-row"><span>Tu saldo</span><b data-saldo>' + fmtNum(s, 0) + ' créditos</b></div><div class="ipk-bar' + (falta ? '' : ' is-full') + '"><i style="width:' + pct + '%"></i></div></div>' +
      (falta ? '<button class="ipk-btn ipk-btn-lg ipk-btn-block" disabled>' + ico('candado') + ' Canjear por ' + fmtNum(p, 0) + ' créditos</button><div class="ipk-lack">Te faltan ' + fmtNum(falta, 0) + ' créditos. Completa retos para ganar más.</div>'
        : '<button class="ipk-btn ipk-btn-lg ipk-btn-block" data-act="canjear">' + ico('abierto') + ' Canjear por ' + fmtNum(p, 0) + ' créditos</button>') +
      '<div class="ipk-note">Se descuenta una sola vez. Si ya lo canjeaste, nunca se vuelve a cobrar.</div></div></div>');
  };
  App.prototype._canjear = function () {
    if (this._canjeando) return;
    var self = this, p = this.cfg.precio, s = this.estado.saldo;
    this._modal({
      titulo: 'Confirmar canje',
      cuerpo: '<p>Vas a canjear <b>' + fmtNum(p, 0) + ' créditos</b> por el Pack de Plantillas Profesionales.</p>' +
        '<div class="ipk-bal"><div class="ipk-bal-row"><span>Saldo actual</span><b>' + fmtNum(s, 0) + '</b></div><div class="ipk-bal-row" style="margin-top:6px"><span>Saldo después del canje</span><b>' + fmtNum(s - p, 0) + '</b></div></div>',
      acciones: [{ l: 'Cancelar', v: null, cls: 'ipk-btn-ghost' }, { l: 'Canjear ahora', v: 'ok' }]
    }).then(function (r) {
      if (r !== 'ok') return;
      self._canjeando = true;
      var btn = self.root.querySelector('[data-act="canjear"]');
      if (btn) { btn.disabled = true; btn.innerHTML = '<span class="ipk-spin"></span> Procesando canje…'; }
      return self.store.canjear().then(function (res) {
        self.estado = { saldo: res.saldo, desbloqueado: true };
        self._syncTarjetas();
        if (self.opts.onSaldo) try { self.opts.onSaldo(res.saldo); } catch (e) { }
        if (self.opts.onCanje && !res.yaTenia) try { self.opts.onCanje(res); } catch (e) { }
        self.vista = 'ok'; self._yaTenia = res.yaTenia; self._render();
      }).catch(function (e) {
        if (e.code === 'SALDO') { self.estado.saldo = e.saldo; self._toast('Saldo insuficiente para canjear', 'bad'); }
        else self._toast('No se pudo completar el canje. Intenta de nuevo.', 'bad');
        console.error(e); self._renderLock();
      }).then(function () { self._canjeando = false; });
    });
  };
  App.prototype._renderOk = function () {
    this._html(this._crumb() + '<div class="ipk-box ipk-success" style="max-width:520px;margin:30px auto"><div class="ipk-okring">' + ico('check') + '</div>' +
      '<span class="ipk-pill ipk-pill-ok">DESBLOQUEADO</span><h2 style="margin:12px 0 6px;font-size:21px">¡Pack de plantillas desbloqueado!</h2>' +
      '<p class="ipk-sub">' + (this._yaTenia ? 'Este pack ya estaba en tu cuenta; no se cobraron créditos.' : 'Se descontaron ' + fmtNum(this.cfg.precio, 0) + ' créditos. Tu saldo es de ' + fmtNum(this.estado.saldo, 0) + ' créditos.') + ' El acceso es permanente.</p>' +
      '<button class="ipk-btn ipk-btn-lg" data-act="inicio">' + ico('abrir') + ' Abrir pack</button></div>');
  };

  /* ---------- Inicio (catálogo + mis plantillas) ---------- */
  App.prototype.irInicio = function (tab) {
    var self = this;
    this._flush();
    this.vista = 'inicio'; if (tab) this.tab = tab; this.doc = null;
    return this.store.listar().then(function (l) { self.misDocs = l; self._render(); })
      .catch(function (e) { console.error(e); self.misDocs = []; self._render(); });
  };
  App.prototype._renderInicio = function () {
    var self = this;
    var h = this._crumb() +
      '<div class="ipk-hero"><span class="ipk-pill ipk-pill-ok">' + ico('check') + ' DESBLOQUEADO</span><h1>PACK DE PLANTILLAS PROFESIONALES</h1><p>Formatos técnicos listos para ayudarte a presupuestar, controlar y documentar tus obras.</p></div>' +
      '<div class="ipk-tabs"><button class="ipk-tab' + (this.tab === 'catalogo' ? ' is-on' : '') + '" data-act="tab" data-v="catalogo">Plantillas <span class="ipk-count">' + Object.keys(REGISTRO).length + '</span></button>' +
      '<button class="ipk-tab' + (this.tab === 'mis' ? ' is-on' : '') + '" data-act="tab" data-v="mis">Mis plantillas <span class="ipk-count">' + this.misDocs.length + '</span></button></div>';
    if (this.tab === 'catalogo') {
      h += '<div class="ipk-chips">' + CATEGORIAS.map(function (c) { return '<button class="ipk-chip' + (self.filtro === c ? ' is-on' : '') + '" data-act="filtro" data-v="' + c + '">' + c + '</button>'; }).join('') + '</div>';
      h += '<div class="ipk-grid">' + CATALOGO.filter(function (c) { return self.filtro === 'TODAS' || c.cat === self.filtro; }).map(function (c) {
        var ok = !!REGISTRO[c.id], n = CATALOGO.indexOf(c) + 1;
        return '<article class="ipk-card' + (ok ? '' : ' is-soon') + '"><div class="ipk-card-top"><span class="ipk-ico">' + ico(c.icon) + '</span><span class="ipk-cat" data-cat="' + c.cat + '">' + c.cat + '</span></div>' +
          '<span class="ipk-num">PLANTILLA ' + String(n).padStart(2, '0') + '</span><h3>' + esc(c.nombre) + '</h3><p>' + esc(c.desc) + '</p>' +
          '<div class="ipk-card-actions">' + (ok ? '<button class="ipk-btn ipk-btn-sm" data-act="abrir-tpl" data-id="' + c.id + '">' + ico('abrir') + ' Abrir</button><button class="ipk-btn ipk-btn-sm ipk-btn-ghost" data-act="descargar-tpl" data-id="' + c.id + '">' + ico('bajar') + ' Descargar</button>'
            : '<button class="ipk-btn ipk-btn-sm ipk-btn-ghost" disabled>En preparación</button>') + '</div></article>';
      }).join('') + '</div>';
    } else h += this._htmlMis();
    this._html(h);
  };
  App.prototype._htmlMis = function () {
    var self = this, q = this.busca.toLowerCase();
    var tipos = CATALOGO.filter(function (c) { return self.misDocs.some(function (d) { return d.tipo === c.id; }); });
    var lista = this.misDocs.filter(function (d) { return (!q || String(d.nombre).toLowerCase().indexOf(q) >= 0) && (!self.filtroTipo || d.tipo === self.filtroTipo); });
    var h = '<div class="ipk-toolbar"><label class="ipk-search">' + ico('buscar') + '<input class="ipk-input" data-in="busca" placeholder="Buscar por nombre…" value="' + esc(this.busca) + '"></label>' +
      '<select class="ipk-input" data-in="filtroTipo"><option value="">Todos los tipos</option>' + tipos.map(function (c) { return '<option value="' + c.id + '"' + (self.filtroTipo === c.id ? ' selected' : '') + '>' + esc(c.nombre) + '</option>'; }).join('') + '</select></div>';
    if (!this.misDocs.length) return h + '<div class="ipk-docs"><div class="ipk-empty"><span class="ipk-ico">' + ico('bitacora') + '</span><b>Aún no tienes plantillas guardadas</b>Abre una plantilla del catálogo y se creará aquí tu primera copia.<div style="margin-top:14px"><button class="ipk-btn ipk-btn-sm" data-act="tab" data-v="catalogo">Ver plantillas</button></div></div></div>';
    h += '<div class="ipk-docs"><div class="ipk-doc is-head"><span>Nombre</span><span>Tipo de plantilla</span><span>Creación</span><span>Última modificación</span><span></span></div>';
    if (!lista.length) h += '<div class="ipk-empty">Sin resultados para tu búsqueda.</div>';
    lista.forEach(function (d) {
      var c = cat(d.tipo) || { icon: 'bitacora', nombre: d.tipo };
      h += '<div class="ipk-doc" data-doc="' + d.id + '"><div class="ipk-doc-name"><span class="ipk-ico">' + ico(c.icon) + '</span><button data-act="abrir-doc" data-id="' + d.id + '" title="Abrir">' + esc(d.nombre) + '</button></div>' +
        '<span class="ipk-doc-meta" data-l="Tipo">' + esc(c.nombre) + '</span><span class="ipk-doc-meta" data-l="Creada">' + fmtFecha(d.creado, true) + '</span><span class="ipk-doc-meta" data-l="Modificada">' + fmtFecha(d.modificado) + '</span>' +
        '<div class="ipk-doc-acts"><button class="ipk-ib" title="Abrir" data-act="abrir-doc" data-id="' + d.id + '">' + ico('abrir') + '</button><button class="ipk-ib" title="Duplicar" data-act="dup-doc" data-id="' + d.id + '">' + ico('copia') + '</button>' +
        '<button class="ipk-ib" title="Renombrar" data-act="ren-doc" data-id="' + d.id + '">' + ico('lapiz') + '</button><button class="ipk-ib is-bad" title="Eliminar" data-act="del-doc" data-id="' + d.id + '">' + ico('basura') + '</button></div></div>';
    });
    return h + '</div>';
  };
  function cat(id) { for (var i = 0; i < CATALOGO.length; i++) if (CATALOGO[i].id === id) return CATALOGO[i]; return null; }

  /* Abrir plantilla desde el catálogo → crea documento en Mis plantillas */
  App.prototype._abrirPlantilla = function (id) {
    var self = this, def = REGISTRO[id], c = cat(id); if (!def) return;
    var previos = this.misDocs.filter(function (d) { return d.tipo === id; }).slice(0, 3);
    var rec = previos.length ? '<div class="ipk-recent"><span>O CONTINÚA UNO EXISTENTE</span>' + previos.map(function (d) { return '<button data-modal-v="doc:' + d.id + '"><span>' + esc(d.nombre) + '</span><small>' + fmtFecha(d.modificado, true) + '</small></button>'; }).join('') + '</div>' : '';
    this._modal({
      titulo: 'Nuevo: ' + c.nombre,
      cuerpo: '<p>Se guardará en <b>Mis plantillas</b> y podrás volver a abrirlo cuando quieras.</p>' +
        '<label class="ipk-f"><span>Nombre del documento</span><input class="ipk-input" name="nombre" value="' + esc(c.nombre.replace(/^Presupuesto de /, 'Presupuesto ') + ' — ') + '" placeholder="Ej. ' + esc(c.nombre) + ' — Proyecto López"></label>' +
        '<label class="ipk-radio"><input type="radio" name="modo" value="ejemplo" checked><span><b>Con datos de ejemplo</b><small>Conceptos y precios de referencia para que ajustes a tu obra.</small></span></label>' +
        '<label class="ipk-radio"><input type="radio" name="modo" value="blanco"><span><b>Solo estructura</b><small>Partidas listas y conceptos vacíos para capturar desde cero.</small></span></label>' + rec,
      acciones: [{ l: 'Cancelar', v: null, cls: 'ipk-btn-ghost' }, { l: 'Crear y abrir', v: 'ok' }],
      foco: 'nombre'
    }).then(function (r) {
      if (!r) return;
      if (typeof r === 'string' && r.indexOf('doc:') === 0) return self.abrirDoc(r.slice(4));
      var nombre = (r.form.nombre || '').trim().replace(/—\s*$/, '').trim() || c.nombre;
      var data = def.nuevo(r.form.modo === 'ejemplo');
      return self.store.crear(nombre, id, data, def.version).then(function (doc) {
        self.misDocs.unshift({ id: doc.id, nombre: doc.nombre, tipo: id, creado: doc.creado, modificado: doc.modificado });
        self._abrirEditor(doc);
      }).catch(function (e) { console.error(e); self._toast('No se pudo crear el documento', 'bad'); });
    });
  };
  App.prototype._descargarPlantilla = function (id) {
    var def = REGISTRO[id], c = cat(id), self = this; if (!def) return;
    var doc = { nombre: c.nombre + ' (formato)', tipo: id, data: def.nuevo(true) };
    this._toast('Preparando Excel…');
    exportarExcel(def, doc, this.cfg).then(function () { self._toast('Descarga lista', 'ok'); }).catch(function (e) { console.error(e); self._toast('No se pudo generar el Excel', 'bad'); });
  };
  App.prototype.abrirDoc = function (id) {
    var self = this;
    this._html('<div class="ipk-loading"><span class="ipk-spin"></span> Abriendo…</div>');
    return this.store.obtener(id).then(function (d) {
      if (!d) { self._toast('El documento ya no existe', 'bad'); return self.irInicio('mis'); }
      if (!REGISTRO[d.tipo]) { self._toast('Esta plantilla aún no está disponible', 'bad'); return self.irInicio('mis'); }
      self._abrirEditor(d);
    });
  };

  /* ---------- Editor ---------- */
  App.prototype._abrirEditor = function (doc) {
    this.doc = doc; this.def = REGISTRO[doc.tipo];
    var d = doc.data || (doc.data = {});
    d.campos = d.campos || {}; d.tablas = d.tablas || {}; d.params = d.params || {};
    this.def.secciones.forEach(function (s) { if (s.tipo === 'tabla' && !d.tablas[s.key]) d.tablas[s.key] = []; });
    this.vista = 'editor'; this._render();
    var root = this.root; if (root.scrollIntoView) try { root.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) { }
  };
  App.prototype._renderEditor = function () {
    var self = this, def = this.def, doc = this.doc, c = cat(doc.tipo);
    this.comp = calcular(def, doc.data);
    var h = this._crumb(c.nombre) +
      '<div class="ipk-ed-top"><button class="ipk-ib" data-act="inicio-mis" title="Volver a Mis plantillas">' + ico('atras') + '</button>' +
      '<div class="ipk-ed-title"><span class="ipk-ico" style="width:38px;height:38px">' + ico(c.icon) + '</span><div style="flex:1;min-width:0"><input data-in="nombreDoc" value="' + esc(doc.nombre) + '" aria-label="Nombre del documento"><div class="ipk-ed-type">' + esc(c.nombre) + ' · <span data-mod>Modificado ' + fmtFecha(doc.modificado) + '</span></div></div></div>' +
      '<span class="ipk-save is-saved" data-save>' + ico('check') + ' Guardado</span>' +
      '<div class="ipk-ed-acts">' + (def.acciones || []).map(function (a, i) { return '<button class="ipk-btn ipk-btn-sm ipk-btn-ok" data-act="accion" data-i="' + i + '">' + ico(a.icon || 'mas') + ' ' + esc(a.l) + '</button>'; }).join('') +
      '<button class="ipk-btn ipk-btn-sm ipk-btn-ghost" data-act="copia">' + ico('copia') + ' Crear copia</button>' +
      '<button class="ipk-btn ipk-btn-sm ipk-btn-ghost" data-act="imprimir">' + ico('print') + ' Imprimir</button>' +
      '<button class="ipk-btn ipk-btn-sm ipk-btn-dark" data-act="pdf">' + ico('pdf') + ' Exportar PDF</button>' +
      '<button class="ipk-btn ipk-btn-sm" data-act="excel">' + ico('excel') + ' Exportar Excel</button></div></div>';
    def.secciones.forEach(function (s, si) {
      if (s.tipo === 'campos') h += self._htmlCampos(s);
      else if (s.tipo === 'tabla') h += self._htmlTabla(s);
      else if (s.tipo === 'resumen') h += self._htmlResumen(s);
      else if (s.tipo === 'grafico') h += '<section class="ipk-sec" data-graf="' + s.key + '"><div class="ipk-sec-h"><h3>' + esc(s.titulo) + '</h3><div class="ipk-legs"></div></div><div class="ipk-sec-b"><div class="ipk-chart"><div class="ipk-chart-svg"></div><div class="ipk-tip" hidden></div></div></div></section>';
    });
    this._html(h);
    this._autoGrow(this.root);
    this._graficas();
  };
  App.prototype._tema = function () {
    var r = this.root;
    if (r.classList.contains('ipk-dark') || (r.closest && r.closest('.dark,.dark-mode,.theme-dark,[data-theme="dark"],[data-theme="night"]'))) return 'oscuro';
    return getComputedStyle(r).getPropertyValue('--ipk-card').trim().toUpperCase() === '#17191E' ? 'oscuro' : 'claro';
  };
  App.prototype._graficas = function () {
    var self = this, tema = this._tema();
    secciones(this.def, 'grafico').forEach(function (s) {
      var sec = self.root.querySelector('[data-graf="' + s.key + '"]'); if (!sec) return;
      var spec = s.datos(self.doc.data, self.comp);
      sec.querySelector('.ipk-chart-svg').innerHTML = svgChart(spec, tema);
      sec.querySelector('.ipk-legs').innerHTML = leyendaHTML(spec, tema);
      var box = sec.querySelector('.ipk-chart');
      box._spec = spec;
      if (!box._hover) {
        box._hover = true;
        box.addEventListener('mousemove', function (ev) {
          var sp = box._spec, svg = box.querySelector('svg'), tip = box.querySelector('.ipk-tip'); if (!sp || !sp.labels.length || !svg) return;
          var rc = svg.getBoundingClientRect(), k = rc.width / CH.W, g = geom(sp);
          var xv = (ev.clientX - rc.left) / k, i = Math.round((xv - CH.l) / (g.n > 1 ? g.pw / (g.n - 1) : 1));
          if (xv < CH.l - 20 || xv > CH.l + g.pw + 20) { tip.hidden = true; svg.querySelector('.ipk-cross').style.display = 'none'; return; }
          i = Math.max(0, Math.min(g.n - 1, i));
          var cx = svg.querySelector('.ipk-cross'); cx.setAttribute('x1', g.x(i)); cx.setAttribute('x2', g.x(i)); cx.style.display = '';
          var T = TEMAS[self._tema()], filas = sp.series.map(function (s) { var v = s.valores[i]; return '<div><i style="background:' + (T[s.rol] || T.real) + '"></i>' + esc(s.nombre) + '<b>' + (v === null || v === undefined || v === '' ? '—' : esc(fmtEje(sp.fmt, v))) + '</b></div>'; }).join('');
          var a = sp.series[0] && sp.series[0].valores[i], b = sp.series[1] && sp.series[1].valores[i];
          if (a != null && b != null && a !== '' && b !== '') filas += '<div class="ipk-tip-d">Diferencia<b>' + (sp.fmt === 'pct100' ? fmtNum(b - a, 1) + ' pts' : fmtMoney(b - a)) + '</b></div>';
          tip.innerHTML = '<strong>' + esc(sp.labels[i]) + '</strong>' + filas; tip.hidden = false;
          var bx = box.getBoundingClientRect(), px = g.x(i) * k + (rc.left - bx.left);
          tip.style.left = Math.min(Math.max(8, px + 14), bx.width - tip.offsetWidth - 8) + 'px'; tip.style.top = '12px';
        });
        box.addEventListener('mouseleave', function () { var t = box.querySelector('.ipk-tip'), c = box.querySelector('.ipk-cross'); if (t) t.hidden = true; if (c) c.style.display = 'none'; });
      }
    });
  };
  App.prototype._htmlCampos = function (s) {
    var d = this.doc.data.campos;
    return '<section class="ipk-sec"><div class="ipk-sec-h"><h3>' + esc(s.titulo) + '</h3></div><div class="ipk-sec-b"><div class="ipk-fields">' +
      s.campos.map(function (f) {
        var v = d[f.k] == null ? '' : d[f.k], w = f.t === 'textarea' ? ' w-4' : f.w ? ' w-' + f.w : '';
        var inp = f.t === 'textarea' ? '<textarea class="ipk-input" data-campo="' + f.k + '" rows="' + Math.max(3, String(v).split('\n').length + 1) + '" placeholder="' + esc(f.ph || '') + '">' + esc(v) + '</textarea>'
          : f.t === 'select' ? '<select class="ipk-input" data-campo="' + f.k + '">' + f.op.map(function (o) { return '<option' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>'
            : '<input class="ipk-input" data-campo="' + f.k + '" type="' + (f.t === 'date' ? 'date' : 'text') + '"' + (f.t === 'number' ? ' inputmode="decimal"' : '') + ' value="' + esc(v) + '" placeholder="' + esc(f.ph || '') + '">';
        return '<label class="ipk-f' + w + '"><span>' + esc(f.l) + '</span>' + inp + '</label>';
      }).join('') + '</div></div></section>';
  };
  var UNIDADES = ['m', 'm2', 'm3', 'ml', 'kg', 'ton', 'pza', 'jgo', 'lote', 'sal', 'lt', 'viaje', 'jor', 'hr', 'día', 'sem', 'mes', '%', 'pto'];
  App.prototype._htmlTabla = function (s) {
    var self = this, rows = this.doc.data.tablas[s.key];
    var hn = s.niveles;
    var h = '<section class="ipk-sec" data-tabla="' + s.key + '"><div class="ipk-sec-h"><h3>' + esc(s.titulo) + '</h3><div class="ipk-tb">' +
      (hn && !s.sinRenumerar ? '<button class="ipk-btn ipk-btn-sm ipk-btn-ghost" data-act="renum" title="Reasigna claves 01, 01.01, 01.01.001">' + ico('numeros') + ' Renumerar claves</button>' : '') + '</div></div>' +
      '<div class="ipk-tw"><table class="ipk-t" style="min-width:' + (74 + s.columnas.reduce(function (a, c) { return a + (c.ancho || 100); }, 0)) + 'px"><colgroup><col style="width:74px">' + s.columnas.map(function (c) { return '<col style="width:' + (c.ancho || 100) + 'px">'; }).join('') + '</colgroup>' +
      '<thead><tr><th></th>' + s.columnas.map(function (c) { return '<th' + (c.t === 'money' || c.t === 'num' || c.t === 'pct' ? ' class="is-n"' : '') + '>' + esc(c.l) + '</th>'; }).join('') + '</tr></thead><tbody>';
    rows.forEach(function (r) { h += self._htmlFila(s, r); });
    var sc = sumCols(s), idx = {}; s.columnas.forEach(function (c, i) { idx[c.k] = i; });
    var firstSum = sc.length ? Math.min.apply(null, sc.map(function (k) { return idx[k]; })) : s.columnas.length;
    if (s.sinTotal) h += '</tbody></table>';
    else {
      h += '</tbody><tfoot><tr><td colspan="' + (firstSum + 1) + '" style="text-align:right">' + esc((s.totalLabel || 'Total').toUpperCase()) + '</td>';
      s.columnas.forEach(function (c, i) {
        if (i < firstSum) return;
        h += sc.indexOf(c.k) >= 0 ? '<td class="calc" data-tot="' + s.key + ':' + c.k + '">' + fmtTipo(c.t, self.comp.t[s.key].tot[c.k], c.dec) + '</td>' : c.pctDe ? '<td class="calc">100.00%</td>' : '<td></td>';
      });
      h += '</tr></tfoot></table>';
    }
    if (!rows.length) h += '<div class="ipk-empty" style="padding:26px">Sin filas. Usa los botones de abajo para empezar.</div>';
    h += '</div><div class="ipk-addrow">' + (hn ? '<button class="ipk-btn ipk-btn-sm ipk-btn-dark" data-act="add" data-t="p">' + ico('mas') + ' ' + esc(s.partidaLabel || 'Partida') + '</button><button class="ipk-btn ipk-btn-sm ipk-btn-ghost" data-act="add" data-t="s">' + ico('mas') + ' ' + esc(s.subLabel || 'Subpartida') + '</button>' : '') +
      '<button class="ipk-btn ipk-btn-sm" data-act="add" data-t="c">' + ico('mas') + ' ' + esc(s.filaLabel || 'Concepto') + '</button></div></section>';
    return h;
  };
  App.prototype._htmlFila = function (s, r) {
    var self = this, t = s.niveles ? (r._t || 'c') : 'c', o = this.comp.t[s.key].f[r.id] || {};
    var acts = '<td class="c-act"><button class="ipk-ib" data-act="row-menu" title="Más opciones">' + ico('puntos') + '</button><button class="ipk-ib" data-act="row-dup" title="Duplicar">' + ico('copia') + '</button></td>';
    if (t === 'c') {
      return '<tr class="r-c" data-row="' + r.id + '">' + acts + s.columnas.map(function (c) {
        if (c.calc || c.pctDe) return '<td class="calc' + (num(o[c.k]) < -0.00001 ? ' is-neg' : '') + '"' + (c.t === 'semaforo' ? ' style="text-align:center"' : '') + ' data-c="' + r.id + ':' + c.k + '">' + fmtTipo(c.t, o[c.k], c.dec) + '</td>';
        var v = r[c.k] == null ? '' : r[c.k];
        if (c.t === 'textarea') return '<td><textarea class="ipk-in" rows="1" data-k="' + c.k + '" placeholder="' + esc(c.ph || '') + '">' + esc(v) + '</textarea></td>';
        var isN = c.t === 'money' || c.t === 'num' || c.t === 'pct';
        return '<td><input class="ipk-in' + (isN ? ' is-n' : '') + '" data-k="' + c.k + '" value="' + esc(v) + '"' + (isN ? ' inputmode="decimal"' : '') + (c.t === 'unidad' ? ' list="ipk-unidades" style="text-align:center"' : '') + ' placeholder="' + esc(c.ph || '') + '"></td>';
      }).join('') + '</tr>';
    }
    var sc = sumCols(s), idx = {}; s.columnas.forEach(function (c, i) { idx[c.k] = i; });
    var textoI = idx[s.niveles.texto], firstSum = Math.min.apply(null, sc.map(function (k) { return idx[k]; }));
    var h = '<tr class="r-' + t + '" data-row="' + r.id + '">' + acts;
    s.columnas.forEach(function (c, i) {
      if (i < textoI) h += '<td><input class="ipk-in" data-k="' + c.k + '" value="' + esc(r[c.k] || '') + '"></td>';
      else if (i === textoI) h += '<td colspan="' + Math.max(1, firstSum - textoI) + '"><input class="ipk-in" data-k="' + c.k + '" value="' + esc(r[c.k] || '') + '" placeholder="' + (t === 'p' ? 'Nombre de la partida' : 'Nombre de la subpartida') + '"></td>';
      else if (i < firstSum) { }
      else if (sc.indexOf(c.k) >= 0 || c.pctDe) h += '<td class="calc" data-c="' + r.id + ':' + c.k + '">' + fmtTipo(c.t, o[c.k], c.dec) + '</td>';
      else h += '<td></td>';
    });
    return h + '</tr>';
  };
  App.prototype._htmlResumen = function (s) {
    var self = this, d = this.doc.data, rr = this.comp.r, filas = '', extra = '';
    if (s.vista === 'kpis') {
      return '<section class="ipk-sec"><div class="ipk-sec-h"><h3>' + esc(s.titulo) + '</h3></div><div class="ipk-sec-b"><div class="ipk-kpis is-wide">' +
        s.items.map(function (it) { return '<div class="ipk-kpi"><span>' + esc(it.l) + '</span><b data-r="' + it.id + '">' + fmtTipo(it.t, rr[it.id], it.dec) + '</b>' + (it.pct ? '<small data-rp="' + it.id + '">' + fmtPct(it.pct(self._ctx())) + ' del costo directo</small><i class="ipk-kbar"><em data-rb="' + it.id + '" style="width:' + Math.min(100, it.pct(self._ctx()) * 100) + '%"></em></i>' : '') + '</div>'; }).join('') +
        '</div></div></section>';
    }
    s.items.forEach(function (it) {
      if (it.t === 'letra' || it.t === 'texto') { extra += '<div class="ipk-letra"><span>' + esc((it.l || '').toUpperCase()) + '</span><b data-r="' + it.id + '">' + esc(rr[it.id]) + '</b></div>'; return; }
      if (it.kpi) return;
      filas += '<tr' + (it.destacado ? ' class="is-big"' : '') + '><td>' + esc(it.l) + (it.param ? '<span class="ipk-param"><input data-param="' + it.param.k + '" value="' + esc(d.params[it.param.k] == null ? '' : d.params[it.param.k]) + '" inputmode="decimal">' + esc(it.param.suf || '') + '</span>' : '') + '</td><td data-r="' + it.id + '">' + fmtTipo(it.t, rr[it.id], it.dec) + '</td></tr>';
    });
    var kpis = s.items.filter(function (it) { return it.kpi; }).map(function (it) { return '<div class="ipk-kpi"><span>' + esc(it.l) + '</span><b data-r="' + it.id + '">' + fmtTipo(it.t, rr[it.id], it.dec) + '</b></div>'; }).join('');
    return '<section class="ipk-sec"><div class="ipk-sec-h"><h3>' + esc(s.titulo || 'Resumen') + '</h3></div><div class="ipk-sec-b"><div class="ipk-res"' + (filas ? '' : ' style="grid-template-columns:1fr"') + '><div>' + (kpis ? '<div class="ipk-kpis' + (filas ? '' : ' is-wide') + '">' + kpis + '</div>' : '') + (extra ? '<div style="margin-top:12px">' + extra + '</div>' : '') + '</div><table class="ipk-res-t">' + filas + '</table></div></div></section>';
  };
  App.prototype._ctx = function () {
    var d = this.doc.data, comp = this.comp;
    return { data: d, comp: comp, v: function (id) { return num(comp.r[id]); }, p: function (k) { return num(d.params && d.params[k]); }, campo: function (k) { return d.campos ? d.campos[k] : ''; }, tot: function (t, c) { return num(comp.t[t] && comp.t[t].tot[c]); } };
  };
  App.prototype._autoGrow = function (scope) {
    var list = scope.querySelectorAll('textarea.ipk-in');
    for (var i = 0; i < list.length; i++) { list[i].style.height = 'auto'; list[i].style.height = list[i].scrollHeight + 'px'; }
    if (!document.getElementById('ipk-unidades')) {
      var dl = document.createElement('datalist'); dl.id = 'ipk-unidades';
      dl.innerHTML = UNIDADES.map(function (u) { return '<option value="' + u + '">'; }).join(''); document.body.appendChild(dl);
    }
  };
  /* Actualiza solo celdas calculadas (sin perder el foco) */
  App.prototype._refrescarCalculos = function () {
    var self = this, def = this.def; this.comp = calcular(def, this.doc.data);
    def.secciones.forEach(function (s) {
      if (s.tipo !== 'tabla') return;
      var out = self.comp.t[s.key].f;
      var cols = {}; s.columnas.forEach(function (c) { cols[c.k] = c; });
      var cells = self.root.querySelectorAll('[data-tabla="' + s.key + '"] [data-c]');
      for (var i = 0; i < cells.length; i++) { var p = cells[i].getAttribute('data-c').split(':'); var c = cols[p[1]]; if (out[p[0]]) { var vv = out[p[0]][p[1]]; if (c.t === 'semaforo') cells[i].innerHTML = fmtTipo(c.t, vv); else cells[i].textContent = fmtTipo(c.t, vv, c.dec).replace(/&amp;/g, '&'); cells[i].classList.toggle('is-neg', num(vv) < -0.00001); } }
      var tt = self.root.querySelectorAll('[data-tot^="' + s.key + ':"]');
      for (var j = 0; j < tt.length; j++) { var k = tt[j].getAttribute('data-tot').split(':')[1]; tt[j].textContent = fmtTipo(cols[k].t, self.comp.t[s.key].tot[k], cols[k].dec); }
    });
    this._graficas();
    secciones(def, 'resumen').forEach(function (s) {
      s.items.forEach(function (it) {
        var el = self.root.querySelector('[data-r="' + it.id + '"]'); if (el) el.textContent = it.t === 'letra' || it.t === 'texto' ? self.comp.r[it.id] : fmtTipo(it.t, self.comp.r[it.id], it.dec);
        if (it.pct) { var v = it.pct(self._ctx()), a = self.root.querySelector('[data-rp="' + it.id + '"]'), b = self.root.querySelector('[data-rb="' + it.id + '"]'); if (a) a.textContent = fmtPct(v) + ' del costo directo'; if (b) b.style.width = Math.min(100, v * 100) + '%'; }
      });
    });
  };

  /* ---------- Autoguardado ---------- */
  App.prototype._estadoGuardado = function (st) {
    var el = this.root.querySelector('[data-save]'); if (!el) return;
    el.className = 'ipk-save is-' + st;
    el.innerHTML = st === 'saving' ? '<span class="ipk-dot"></span> Guardando…' : st === 'saved' ? ico('check') + ' Guardado' : st === 'error' ? ico('alerta') + ' Sin guardar · reintentando' : '<span class="ipk-dot"></span> Cambios sin guardar';
  };
  App.prototype._programarGuardado = function () {
    var self = this; this._pendiente = true; this._estadoGuardado('saving');
    clearTimeout(this._tSave); this._tSave = setTimeout(function () { self._flush(); }, 800);
  };
  App.prototype._flush = function () {
    clearTimeout(this._tSave);
    if (!this._pendiente || !this.doc) return this._saveChain;
    var self = this, doc = this.doc, payload = { nombre: doc.nombre, data: clone(doc.data) };
    this._pendiente = false;
    this._saveChain = this._saveChain.then(function () {
      return self.store.guardar(doc.id, payload).then(function (ms) {
        doc.modificado = ms;
        var m = self.misDocs.filter(function (x) { return x.id === doc.id; })[0]; if (m) { m.modificado = ms; m.nombre = doc.nombre; }
        if (self.doc === doc && !self._pendiente) { self._estadoGuardado('saved'); var md = self.root.querySelector('[data-mod]'); if (md) md.textContent = 'Modificado ' + fmtFecha(ms); }
      }).catch(function (e) {
        console.error(e); if (self.doc === doc) { self._estadoGuardado('error'); self._pendiente = true; clearTimeout(self._tSave); self._tSave = setTimeout(function () { self._flush(); }, 4000); }
      });
    });
    return this._saveChain;
  };

  /* ---------- Operaciones de filas ---------- */
  App.prototype._tablaDe = function (el) { var sec = el.closest('[data-tabla]'); if (!sec) return null; var k = sec.getAttribute('data-tabla'); return this.def.secciones.filter(function (s) { return s.key === k; })[0]; };
  App.prototype._nuevaFila = function (s, t) { var r = { id: nid(), _t: t }; if (s.filaNueva) Object.assign(r, s.filaNueva(t)); return r; };
  App.prototype._opFila = function (s, op, rowId, extra) {
    this._matarDeshacer();
    var rows = this.doc.data.tablas[s.key], i = -1;
    for (var x = 0; x < rows.length; x++) if (rows[x].id === rowId) { i = x; break; }
    var focusId = null, self = this;
    if (op === 'add') {
      var t = extra; var nr = this._nuevaFila(s, t); var at;
      if (i < 0) at = rows.length;
      else if (t === 'c') at = i + 1;
      else if (t === 's') at = rows[i]._t === 'p' ? i + 1 : (function () { var j = i; while (j >= 0 && rows[j]._t !== 's' && rows[j]._t !== 'p') j--; return j >= 0 && rows[j]._t === 's' ? bloque(rows, j)[1] : i + 1; })();
      else { var j = i; while (j >= 0 && rows[j]._t !== 'p') j--; at = j >= 0 ? bloque(rows, j)[1] : rows.length; }
      rows.splice(at, 0, nr); focusId = nr.id;
    } else if (op === 'dup') {
      var b = s.niveles ? bloque(rows, i) : [i, i + 1];
      var copia = rows.slice(b[0], b[1]).map(function (r) { var c = clone(r); c.id = nid(); return c; });
      Array.prototype.splice.apply(rows, [b[1], 0].concat(copia)); focusId = copia[0].id;
      this._toast(copia.length > 1 ? 'Bloque duplicado (' + copia.length + ' filas)' : 'Fila duplicada', 'ok');
    } else if (op === 'up' || op === 'down') {
      var bb = s.niveles ? bloque(rows, i) : [i, i + 1], t2 = rows[i]._t || 'c', blk;
      if (op === 'up') {
        if (bb[0] === 0) return;
        var k = bb[0] - 1;
        if (t2 !== 'c') { while (k >= 0 && rows[k]._t !== t2) { if (t2 === 's' && rows[k]._t === 'p') return; k--; } if (k < 0) return; }
        blk = rows.splice(bb[0], bb[1] - bb[0]); Array.prototype.splice.apply(rows, [k, 0].concat(blk));
      } else {
        if (bb[1] >= rows.length) return;
        if (t2 === 'c') { blk = rows.splice(i, 1); rows.splice(i + 1, 0, blk[0]); }
        else { if (rows[bb[1]]._t !== t2) return; var nb = bloque(rows, bb[1]); blk = rows.splice(bb[0], bb[1] - bb[0]); Array.prototype.splice.apply(rows, [nb[1] - blk.length, 0].concat(blk)); }
      }
      focusId = rowId;
    } else if (op === 'del') {
      var bd = s.niveles ? bloque(rows, i) : [i, i + 1], n = bd[1] - bd[0];
      var go = function () {
        var antes = clone(rows); rows.splice(bd[0], n);
        self._renderEditorConservando(); self._programarGuardado();
        self._toast(n > 1 ? n + ' filas eliminadas' : 'Fila eliminada', '', function () { self.doc.data.tablas[s.key] = antes; self._renderEditorConservando(); self._programarGuardado(); });
      };
      if (n > 1) return this._modal({ titulo: 'Eliminar ' + (rows[i]._t === 'p' ? 'partida' : 'subpartida'), cuerpo: '<p>Se eliminará <b>' + esc(rows[i].concepto || rows[i][s.niveles.texto] || 'este bloque') + '</b> junto con sus ' + (n - 1) + ' fila(s).</p>', acciones: [{ l: 'Cancelar', v: null, cls: 'ipk-btn-ghost' }, { l: 'Eliminar', v: 'ok', cls: 'ipk-btn-danger' }] }).then(function (r) { if (r === 'ok') go(); });
      return go();
    }
    this._renderEditorConservando(focusId);
    this._programarGuardado();
  };
  App.prototype._renderEditorConservando = function (focusId) {
    var y = global.scrollY, tw = this.root.querySelectorAll('.ipk-tw'), sc = [];
    for (var i = 0; i < tw.length; i++) sc.push([tw[i].scrollTop, tw[i].scrollLeft]);
    var st = this.root.querySelector('[data-save]'); var cls = st ? st.className : '';
    this._renderEditor();
    var tw2 = this.root.querySelectorAll('.ipk-tw'); for (var j = 0; j < tw2.length && j < sc.length; j++) { tw2[j].scrollTop = sc[j][0]; tw2[j].scrollLeft = sc[j][1]; }
    global.scrollTo(0, y);
    if (cls) { var st2 = this.root.querySelector('[data-save]'); if (st2 && this._pendiente) this._estadoGuardado('saving'); }
    if (focusId) { var tr = this.root.querySelector('[data-row="' + focusId + '"]'); if (tr) { var inp = tr.querySelector('textarea.ipk-in,input.ipk-in[data-k="concepto"],input.ipk-in'); var tgt = tr.querySelector('[data-k="' + (this._tablaDe(tr).niveles ? this._tablaDe(tr).niveles.texto : '') + '"]') || inp; if (tgt) { tgt.focus({ preventScroll: true }); } tr.scrollIntoView({ block: 'nearest' }); } }
  };

  /* ---------- Menú de fila ---------- */
  App.prototype._menuFila = function (btn) {
    this._cerrarMenu();
    var tr = btn.closest('[data-row]'), s = this._tablaDe(btn), id = tr.getAttribute('data-row'), self = this;
    var m = document.createElement('div'); m.className = 'ipk ipk-menu';
    var t = (this.doc.data.tablas[s.key].filter(function (r) { return r.id === id; })[0] || {})._t || 'c';
    var it = [['add:c', 'mas', 'Insertar ' + (s.filaLabel || 'concepto').toLowerCase() + ' debajo']];
    if (s.niveles) { it.push(['add:s', 'mas', 'Insertar ' + (s.subLabel || 'subpartida').toLowerCase()]); it.push(['add:p', 'mas', 'Insertar ' + (s.partidaLabel || 'partida').toLowerCase() + ' nueva']); }
    it.push(['hr']); it.push(['dup', 'copia', t === 'c' ? 'Duplicar fila' : 'Duplicar ' + (t === 'p' ? 'partida completa' : 'subpartida completa')]);
    it.push(['up', 'arriba', 'Mover arriba']); it.push(['down', 'abajo', 'Mover abajo']); it.push(['hr']);
    it.push(['del', 'basura', t === 'c' ? 'Eliminar fila' : 'Eliminar ' + (t === 'p' ? 'partida' : 'subpartida'), 'is-bad']);
    m.innerHTML = it.map(function (x) { return x[0] === 'hr' ? '<hr>' : '<button data-op="' + x[0] + '"' + (x[3] ? ' class="' + x[3] + '"' : '') + '>' + ico(x[1]) + esc(x[2]) + '</button>'; }).join('');
    if (this.root.closest && (this.root.closest('.dark,[data-theme="dark"],[data-theme="night"],.dark-mode') || this.root.classList.contains('ipk-dark'))) m.classList.add('ipk-dark');
    document.body.appendChild(m);
    var r = btn.getBoundingClientRect(), mh = m.offsetHeight, mw = m.offsetWidth;
    var top = r.bottom + 4; if (top + mh > global.innerHeight - 8) top = Math.max(8, r.top - mh - 4);
    m.style.top = top + 'px'; m.style.left = Math.min(r.left, global.innerWidth - mw - 8) + 'px';
    m.addEventListener('click', function (e) {
      var b = e.target.closest('[data-op]'); if (!b) return;
      var op = b.getAttribute('data-op'); self._cerrarMenu();
      if (op.indexOf('add:') === 0) self._opFila(s, 'add', id, op.slice(4)); else self._opFila(s, op, id);
    });
    this._menu = m;
    setTimeout(function () { self._outside = function (e) { if (self._menu && !self._menu.contains(e.target)) self._cerrarMenu(); }; document.addEventListener('mousedown', self._outside); document.addEventListener('scroll', self._outsideS = function () { self._cerrarMenu(); }, true); }, 0);
  };
  App.prototype._cerrarMenu = function () {
    if (this._menu) { this._menu.remove(); this._menu = null; }
    if (this._outside) { document.removeEventListener('mousedown', this._outside); this._outside = null; }
    if (this._outsideS) { document.removeEventListener('scroll', this._outsideS, true); this._outsideS = null; }
  };

  /* ---------- Eventos ---------- */
  App.prototype._click = function (e) {
    var b = e.target.closest('[data-act]'); if (!b || !this.root.contains(b) || b.disabled) return;
    var a = b.getAttribute('data-act'), id = b.getAttribute('data-id'), self = this;
    switch (a) {
      case 'volver-panel': this._flush(); if (this.opts.onVolver) this.opts.onVolver(); break;
      case 'canjear': this._canjear(); break;
      case 'inicio': this.irInicio('catalogo'); break;
      case 'inicio-mis': this.irInicio('mis'); break;
      case 'tab': this.tab = b.getAttribute('data-v'); this._renderInicio(); break;
      case 'filtro': this.filtro = b.getAttribute('data-v'); this._renderInicio(); break;
      case 'abrir-tpl': this._abrirPlantilla(id); break;
      case 'descargar-tpl': this._descargarPlantilla(id); break;
      case 'abrir-doc': this.abrirDoc(id); break;
      case 'dup-doc': this._dupDoc(id); break;
      case 'ren-doc': this._renDoc(id); break;
      case 'del-doc': this._delDoc(id); break;
      case 'row-menu': e.stopPropagation(); this._menuFila(b); break;
      case 'row-dup': var s = this._tablaDe(b); this._opFila(s, 'dup', b.closest('[data-row]').getAttribute('data-row')); break;
      case 'add': var s2 = this._tablaDe(b); this._opFila(s2, 'add', null, b.getAttribute('data-t')); break;
      case 'renum': var s3 = this._tablaDe(b); renumerar(this.doc.data.tablas[s3.key]); this._renderEditorConservando(); this._programarGuardado(); this._toast('Claves renumeradas', 'ok'); break;
      case 'copia': this._crearCopia(); break;
      case 'accion': this._accion(+b.getAttribute('data-i')); break;
      case 'excel': this._exportar('excel', b); break;
      case 'pdf': this._exportar('pdf', b); break;
      case 'imprimir': this._flush(); imprimir(this.def, this.doc, this.cfg); break;
    }
  };
  App.prototype._input = function (e) {
    var t = e.target;
    if (t.hasAttribute('data-in')) {
      var k = t.getAttribute('data-in');
      if (k === 'busca') { this.busca = t.value; var pos = t.selectionStart; this._renderInicio(); var n = this.root.querySelector('[data-in="busca"]'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }
      else if (k === 'nombreDoc' && this.doc) { this.doc.nombre = t.value; this._programarGuardado(); }
      return;
    }
    if (!this.doc || this.vista !== 'editor') return;
    if (t.hasAttribute('data-campo')) { this.doc.data.campos[t.getAttribute('data-campo')] = t.value; this._refrescarCalculos(); this._programarGuardado(); return; }
    if (t.hasAttribute('data-param')) { this.doc.data.params[t.getAttribute('data-param')] = t.value; this._refrescarCalculos(); this._programarGuardado(); return; }
    if (t.hasAttribute('data-k')) {
      var tr = t.closest('[data-row]'), s = this._tablaDe(t); if (!tr || !s) return;
      var id = tr.getAttribute('data-row'), rows = this.doc.data.tablas[s.key];
      for (var i = 0; i < rows.length; i++) if (rows[i].id === id) { rows[i][t.getAttribute('data-k')] = t.value; break; }
      this._matarDeshacer();
      if (t.tagName === 'TEXTAREA') { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }
      this._refrescarCalculos(); this._programarGuardado();
    }
  };
  App.prototype._change = function (e) {
    var t = e.target;
    if (t.getAttribute('data-in') === 'filtroTipo') { this.filtroTipo = t.value; this._renderInicio(); }
    else if (t.tagName === 'SELECT' && t.hasAttribute('data-campo') && this.doc) { this.doc.data.campos[t.getAttribute('data-campo')] = t.value; this._refrescarCalculos(); this._programarGuardado(); }
    else if (t.getAttribute('data-in') === 'nombreDoc' && this.doc && !t.value.trim()) { t.value = this.doc.nombre = cat(this.doc.tipo).nombre; this._programarGuardado(); }
  };
  App.prototype._exportar = function (tipo, btn) {
    var self = this, html = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="ipk-spin"></span> Generando…';
    this._flush();
    var p = tipo === 'excel' ? exportarExcel(this.def, this.doc, this.cfg) : exportarPDF(this.def, this.doc, this.cfg);
    p.then(function () { self._toast(tipo === 'excel' ? 'Excel descargado' : 'PDF descargado', 'ok'); })
      .catch(function (e) { console.error(e); self._toast('No se pudo generar el archivo. Revisa tu conexión.', 'bad'); })
      .then(function () { btn.disabled = false; btn.innerHTML = html; });
  };

  /* Acción propia de la plantilla: genera un documento nuevo a partir del actual */
  App.prototype._accion = function (i) {
    var self = this, a = this.def.acciones[i], doc = this.doc; if (!a) return;
    var res = a.run(clone(doc.data), doc);
    this._modal({ titulo: a.l, cuerpo: '<p>' + esc(a.desc || 'Se creará un documento nuevo; el actual no se modifica.') + '</p><label class="ipk-f"><span>Nombre del nuevo documento</span><input class="ipk-input" name="nombre" value="' + esc(res.nombre) + '"></label>', acciones: [{ l: 'Cancelar', v: null, cls: 'ipk-btn-ghost' }, { l: 'Crear', v: 'ok' }], foco: 'nombre' })
      .then(function (r) {
        if (!r) return; var nombre = (r.form.nombre || '').trim() || res.nombre;
        return self._flush().then(function () { return self.store.crear(nombre, doc.tipo, res.data, doc.version); }).then(function (nd) {
          self.misDocs.unshift({ id: nd.id, nombre: nd.nombre, tipo: nd.tipo, creado: nd.creado, modificado: nd.modificado });
          self._abrirEditor(nd); self._toast(a.ok || 'Documento creado', 'ok');
        });
      }).catch(function (e) { console.error(e); self._toast('No se pudo crear el documento', 'bad'); });
  };

  /* ---------- Mis plantillas: acciones ---------- */
  App.prototype._crearCopia = function () {
    var self = this, doc = this.doc;
    this._modal({ titulo: 'Crear copia', cuerpo: '<p>Se crea un documento nuevo con todo lo capturado. El original no se modifica.</p><label class="ipk-f"><span>Nombre de la copia</span><input class="ipk-input" name="nombre" value="' + esc(doc.nombre + ' (copia)') + '"></label>', acciones: [{ l: 'Cancelar', v: null, cls: 'ipk-btn-ghost' }, { l: 'Crear copia', v: 'ok' }], foco: 'nombre' })
      .then(function (r) {
        if (!r) return; var nombre = (r.form.nombre || '').trim() || doc.nombre + ' (copia)';
        return self._flush().then(function () { return self.store.crear(nombre, doc.tipo, clone(doc.data), doc.version); }).then(function (nd) {
          self.misDocs.unshift({ id: nd.id, nombre: nd.nombre, tipo: nd.tipo, creado: nd.creado, modificado: nd.modificado });
          self._abrirEditor(nd); self._toast('Copia creada. Ahora estás editando la copia.', 'ok');
        });
      }).catch(function (e) { console.error(e); self._toast('No se pudo crear la copia', 'bad'); });
  };
  App.prototype._dupDoc = function (id) {
    var self = this, d = this.misDocs.filter(function (x) { return x.id === id; })[0]; if (!d) return;
    this.store.duplicar(id, d.nombre + ' (copia)').then(function (nd) {
      self.misDocs.unshift({ id: nd.id, nombre: nd.nombre, tipo: nd.tipo, creado: nd.creado, modificado: nd.modificado });
      self._renderInicio(); self._toast('Plantilla duplicada', 'ok');
    }).catch(function (e) { console.error(e); self._toast('No se pudo duplicar', 'bad'); });
  };
  App.prototype._renDoc = function (id) {
    var self = this, d = this.misDocs.filter(function (x) { return x.id === id; })[0]; if (!d) return;
    this._modal({ titulo: 'Renombrar', cuerpo: '<label class="ipk-f"><span>Nuevo nombre</span><input class="ipk-input" name="nombre" value="' + esc(d.nombre) + '"></label>', acciones: [{ l: 'Cancelar', v: null, cls: 'ipk-btn-ghost' }, { l: 'Guardar', v: 'ok' }], foco: 'nombre' })
      .then(function (r) {
        if (!r) return; var n = (r.form.nombre || '').trim(); if (!n || n === d.nombre) return;
        return self.store.guardar(id, { nombre: n }).then(function (ms) { d.nombre = n; d.modificado = ms; self._renderInicio(); self._toast('Nombre actualizado', 'ok'); });
      }).catch(function (e) { console.error(e); self._toast('No se pudo renombrar', 'bad'); });
  };
  App.prototype._delDoc = function (id) {
    var self = this, d = this.misDocs.filter(function (x) { return x.id === id; })[0]; if (!d) return;
    this._modal({ titulo: 'Eliminar plantilla', cuerpo: '<p>¿Eliminar <b>' + esc(d.nombre) + '</b>? Esta acción no se puede deshacer.</p>', acciones: [{ l: 'Cancelar', v: null, cls: 'ipk-btn-ghost' }, { l: 'Eliminar', v: 'ok', cls: 'ipk-btn-danger' }] })
      .then(function (r) {
        if (r !== 'ok') return;
        return self.store.eliminar(id).then(function () { self.misDocs = self.misDocs.filter(function (x) { return x.id !== id; }); self._renderInicio(); self._toast('Plantilla eliminada', 'ok'); });
      }).catch(function (e) { console.error(e); self._toast('No se pudo eliminar', 'bad'); });
  };

  /* ---------- Modal y toast ---------- */
  App.prototype._modal = function (o) {
    var self = this;
    return new Promise(function (res) {
      var ov = document.createElement('div'); ov.className = 'ipk ipk-ov';
      if (self.root.closest && self.root.closest('.dark,[data-theme="dark"],[data-theme="night"],.dark-mode')) ov.classList.add('ipk-dark');
      ov.innerHTML = '<form class="ipk-modal" novalidate><h3>' + esc(o.titulo) + '</h3>' + (o.cuerpo || '') + '<div class="ipk-modal-acts">' +
        o.acciones.map(function (a, i) { return '<button type="' + (a.v ? 'submit' : 'button') + '" class="ipk-btn ' + (a.cls || '') + '" data-i="' + i + '">' + esc(a.l) + '</button>'; }).join('') + '</div></form>';
      document.body.appendChild(ov);
      var f = ov.querySelector('form');
      function fin(v) { ov.remove(); document.removeEventListener('keydown', k); res(v); }
      function k(e) { if (e.key === 'Escape') fin(null); }
      document.addEventListener('keydown', k);
      ov.addEventListener('mousedown', function (e) { if (e.target === ov) fin(null); });
      f.addEventListener('click', function (e) {
        var mv = e.target.closest('[data-modal-v]'); if (mv) { e.preventDefault(); return fin(mv.getAttribute('data-modal-v')); }
        var b = e.target.closest('[data-i]'); if (b && b.type === 'button') { e.preventDefault(); fin(o.acciones[+b.getAttribute('data-i')].v); }
      });
      f.addEventListener('submit', function (e) {
        e.preventDefault(); var form = {};
        Array.prototype.forEach.call(f.elements, function (el) { if (!el.name) return; if (el.type === 'radio') { if (el.checked) form[el.name] = el.value; } else form[el.name] = el.value; });
        var sub = o.acciones.filter(function (a) { return a.v; })[0];
        fin(Object.keys(form).length ? { v: sub.v, form: form } : sub.v);
      });
      setTimeout(function () { var el = o.foco ? f.querySelector('[name="' + o.foco + '"]') : f.querySelector('[type="submit"]'); if (el) { el.focus(); if (el.select && o.foco) { var L = el.value.length; el.setSelectionRange(L, L); } } }, 30);
    });
  };
  App.prototype._matarDeshacer = function () { if (this._undoT) { this._undoT.remove(); this._undoT = null; } };
  App.prototype._toast = function (msg, tipo, undo) {
    var t = document.createElement('div'); t.className = 'ipk-toast' + (tipo ? ' is-' + tipo : '');
    t.innerHTML = (tipo === 'ok' ? ico('check') : tipo === 'bad' ? ico('alerta') : '') + '<span>' + esc(msg) + '</span>' + (undo ? '<button>Deshacer</button>' : '');
    if (undo) { this._matarDeshacer(); this._undoT = t; t.querySelector('button').onclick = function () { t.remove(); undo(); }; }
    this._toasts.appendChild(t); setTimeout(function () { t.remove(); }, undo ? 6000 : 3200);
  };

  /* ---------- Tarjeta existente en "Recompensas IMFRA" ---------- */
  App.prototype.conectarTarjeta = function (card, opciones) {
    if (typeof card === 'string') card = document.querySelector(card);
    if (!card) return;
    opciones = opciones || {};
    var btn = opciones.boton ? card.querySelector(opciones.boton) : (card.querySelector('button, a.btn, .btn') || card);
    var self = this;
    this._tarjetas.push({ card: card, btn: btn });
    // captura: evita que el canje genérico de la tarjeta cobre por su cuenta
    btn.addEventListener('click', function (e) { e.preventDefault(); e.stopImmediatePropagation(); self.abrir(); }, true);
    this._syncTarjetas();
  };
  App.prototype._syncTarjetas = function () {
    var st = this.estado, p = this.cfg.precio;
    this._tarjetas.forEach(function (t) {
      t.card.setAttribute('data-ipk-estado', st.desbloqueado ? 'desbloqueado' : 'bloqueado');
      if (t.btn && t.btn !== t.card) t.btn.textContent = st.desbloqueado ? 'Abrir pack' : 'Canjear · ' + p + ' créditos';
    });
  };
  App.prototype.refrescarEstado = function () { var self = this; return this.store.estado().then(function (s) { self.estado = s; self._syncTarjetas(); return s; }); };

  /* =========================================================
     API pública
     ========================================================= */
  global.ImfraPlantillas = {
    version: VERSION,
    catalogo: CATALOGO,
    registrar: function (def) {
      var c = cat(def.id); if (!c) { console.warn('Plantilla no reconocida', def.id); return; }
      def.nombre = def.nombre || c.nombre; REGISTRO[def.id] = def;
    },
    init: function (opts) { var app = new App(opts); if (opts.autoIniciar !== false) app.iniciar(); return app; },
    util: { num: num, fmtMoney: fmtMoney, fmtNum: fmtNum, fmtPct: fmtPct, numeroALetras: numeroALetras, nid: nid, calcular: calcular, hoyISO: hoyISO, renumerar: renumerar },
    adaptadores: { compat: fsCompat, modular: fsModular, local: fsLocal },
    _export: { excel: exportarExcel, pdf: exportarPDF, html: htmlImpresion }
  };
})(window);
