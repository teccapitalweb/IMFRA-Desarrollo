/* =========================================================
   Plantilla 09 · CURVA S DE AVANCE
   Por semana: avance programado y real (semanal y acumulado),
   costo programado y real (semanal y acumulado) y diferencias.
   Gráficas automáticas PROGRAMADO VS REAL (avance % y costo $).
   El "real" se deja vacío en semanas futuras: la curva real se
   detiene en la última semana capturada (semana de corte).
   ========================================================= */
(function () {
  var U = ImfraPlantillas.util, num = U.num;
  var T = 'semanas';
  function vacio(v) { return v === '' || v == null || String(v).trim() === ''; }
  function acum(k, sem) { return function (r, o, d, c, prev) { var base = prev ? num(prev[k]) : 0; return base + num(r[sem]); }; }
  function acumReal(k, sem, memo) {
    return function (r, o, d, c, prev) {
      var base = prev ? num(prev[memo]) : 0;
      if (vacio(r[sem])) { o[memo] = base; return null; }
      var v = base + num(r[sem]); o[memo] = v; return v;
    };
  }
  function difNull(a, b) { return function (r, o) { return o[a] === null ? null : o[a] - o[b]; }; }

  /* Semana de corte = última fila con avance real capturado */
  function corte(c) {
    var rows = c.data.tablas[T] || [], f = c.comp.t[T].f, last = null;
    rows.forEach(function (r) { if (f[r.id] && f[r.id].realAcum !== null && f[r.id].realAcum !== undefined) last = r; });
    return last ? { r: last, o: f[last.id] } : null;
  }
  function enCorte(k, div) { return function (c) { var x = corte(c); return x ? num(x.o[k]) / (div || 1) : 0; }; }
  function lk(clave, col, div) { return function (X) { var a = X.rango(T, clave), b = X.rango(T, col); return 'IFERROR(LOOKUP(2,1/(' + a + '<>""),' + b + ')' + (div ? '/' + div : '') + ',0)'; }; }

  var PROG = [2, 3, 4, 6, 7, 8, 9, 10, 10, 9, 8, 7, 6, 5, 4, 2];
  var REAL = [2, 3, 3.5, 5.5, 6.5, 7, 8, 8.5, 8, 7.5];
  var FAC = [1.00, 1.02, 1.04, 1.03, 1.05, 1.02, 1.04, 1.06, 1.03, 1.05];
  var PRES = 1041008.5;
  function finSemana(inicioISO, i) {
    var p = inicioISO.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2] + 6 + 7 * i);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }).replace('.', '');
  }
  function ejemplo() {
    return PROG.map(function (pg, i) {
      var r = { id: U.nid(), _t: 'c', sem: 'S' + (i + 1), fecha: finSemana('2026-07-20', i), progSem: pg, realSem: '', cpSem: Math.round(pg / 100 * PRES * 100) / 100, crSem: '' };
      if (i < REAL.length) { r.realSem = REAL[i]; r.crSem = Math.round(REAL[i] / 100 * PRES * FAC[i] * 100) / 100; }
      return r;
    });
  }
  function blanco() {
    var out = []; for (var i = 0; i < 12; i++) out.push({ id: U.nid(), _t: 'c', sem: 'S' + (i + 1), fecha: '', progSem: '', realSem: '', cpSem: '', crSem: '' });
    return out;
  }
  function serie(c, k) { var f = c.comp.t[T].f; return (c.data.tablas[T] || []).map(function (r) { var v = f[r.id] ? f[r.id][k] : null; return v === undefined ? null : v; }); }
  function labels(d) { return (d.tablas[T] || []).map(function (r, i) { return r.sem || ('S' + (i + 1)); }); }
  function ctxDe(data, comp) { return { data: data, comp: comp }; }

  function diagnostico(c) {
    var x = corte(c); if (!x) return 'Captura el avance real de al menos una semana para generar el diagnóstico.';
    var p = num(x.o.progAcum), r = num(x.o.realAcum), d = r - p, cp = num(x.o.cpAcum), cr = x.o.crAcum === null ? null : num(x.o.crAcum);
    var t = 'Al corte de ' + (x.r.sem || 'la última semana') + (x.r.fecha ? ' (' + x.r.fecha + ')' : '') + ' el avance real es de ' + U.fmtNum(r, 1) + '% contra ' + U.fmtNum(p, 1) + '% programado';
    t += Math.abs(d) < 0.05 ? ': la obra va en programa.' : d < 0 ? ': ' + U.fmtNum(-d, 1) + ' puntos de atraso.' : ': ' + U.fmtNum(d, 1) + ' puntos de adelanto.';
    if (cr !== null) {
      var ev = r / 100 * c.tot(T, 'cpSem'), cpi = cr ? ev / cr : 0;
      t += ' Se han ejercido ' + U.fmtMoney(cr) + ' contra ' + U.fmtMoney(cp) + ' programados; el valor ganado es ' + U.fmtMoney(ev) + ' (CPI ' + U.fmtNum(cpi, 2) + ')' + (cpi && cpi < 0.97 ? ', lo que indica sobrecosto.' : cpi > 1.03 ? ', por debajo del costo previsto.' : '.');
    }
    if (d < 0) {
      var rows = c.data.tablas[T] || [], i = rows.indexOf(x.r), rest = rows.slice(i + 1), falta = 100 - r;
      if (rest.length) t += ' Para terminar en plazo se requiere un promedio de ' + U.fmtNum(falta / rest.length, 1) + '% semanal en las ' + rest.length + ' semanas restantes.';
    }
    return t;
  }

  ImfraPlantillas.registrar({
    id: 'curva-s',
    version: 1,
    hoja: 'Curva S',
    secciones: [
      { tipo: 'campos', titulo: 'Datos del programa', campos: [
        { k: 'obra', l: 'Obra', w: 2 },
        { k: 'contrato', l: 'No. de contrato' },
        { k: 'fecha', l: 'Fecha del reporte', t: 'date' },
        { k: 'contratista', l: 'Contratista', w: 2 },
        { k: 'inicio', l: 'Inicio de obra', t: 'date' },
        { k: 'termino', l: 'Término programado', t: 'date' },
        { k: 'responsable', l: 'Elaboró', w: 2 },
        { k: 'reviso', l: 'Revisó', w: 2 }
      ]},
      { tipo: 'tabla', key: T, titulo: 'Programa semanal', totalLabel: 'Totales', filaLabel: 'Semana',
        filaNueva: function () { return { sem: '', fecha: '', progSem: '', realSem: '', cpSem: '', crSem: '' }; },
        columnas: [
          { k: 'sem', l: 'Semana', t: 'text', ancho: 72, xlsAncho: 9 },
          { k: 'fecha', l: 'Fin de semana', t: 'text', ancho: 92, xlsAncho: 11 },
          { k: 'progSem', l: 'Avance programado semanal (%)', t: 'num', dec: 1, total: true, ancho: 106, xlsAncho: 12 },
          { k: 'realSem', l: 'Avance real semanal (%)', t: 'num', dec: 1, total: true, ancho: 100, xlsAncho: 12 },
          { k: 'progAcum', l: 'Programado acumulado (%)', t: 'num', dec: 1, ancho: 104, xlsAncho: 12, calc: acum('progAcum', 'progSem'), formula: 'N({^progAcum})+{progSem}' },
          { k: 'realAcum', l: 'Real acumulado (%)', t: 'num', dec: 1, ancho: 96, xlsAncho: 12, calc: acumReal('realAcum', 'realSem', '_lr'), formula: 'IF({realSem}="","",N({^realAcum})+{realSem})' },
          { k: 'difAv', l: 'Diferencia (puntos)', t: 'num', dec: 1, ancho: 92, xlsAncho: 11, calc: difNull('realAcum', 'progAcum'), formula: 'IF({realAcum}="","",{realAcum}-{progAcum})' },
          { k: 'cpSem', l: 'Costo programado semanal', t: 'money', total: true, ancho: 124, xlsAncho: 15 },
          { k: 'crSem', l: 'Costo real semanal', t: 'money', total: true, ancho: 124, xlsAncho: 15 },
          { k: 'cpAcum', l: 'Costo programado acumulado', t: 'money', ancho: 130, xlsAncho: 16, calc: acum('cpAcum', 'cpSem'), formula: 'N({^cpAcum})+{cpSem}' },
          { k: 'crAcum', l: 'Costo real acumulado', t: 'money', ancho: 130, xlsAncho: 16, calc: acumReal('crAcum', 'crSem', '_lc'), formula: 'IF({crSem}="","",N({^crAcum})+{crSem})' },
          { k: 'difCosto', l: 'Diferencia de costo (real − prog.)', t: 'money', ancho: 130, xlsAncho: 16, calc: difNull('crAcum', 'cpAcum'), formula: 'IF({crAcum}="","",{crAcum}-{cpAcum})' }
        ]
      },
      { tipo: 'grafico', key: 'gAvance', titulo: 'Curva S · Avance físico acumulado — Programado vs Real',
        datos: function (d, comp) { var c = ctxDe(d, comp); return { labels: labels(d), fmt: 'pct100', series: [{ nombre: 'Programado', rol: 'prog', valores: serie(c, 'progAcum') }, { nombre: 'Real', rol: 'real', valores: serie(c, 'realAcum') }] }; } },
      { tipo: 'grafico', key: 'gCosto', titulo: 'Curva S · Costo acumulado — Programado vs Real',
        datos: function (d, comp) { var c = ctxDe(d, comp); return { labels: labels(d), fmt: 'money', series: [{ nombre: 'Programado', rol: 'prog', valores: serie(c, 'cpAcum') }, { nombre: 'Real', rol: 'real', valores: serie(c, 'crAcum') }] }; } },
      { tipo: 'resumen', titulo: 'Situación al corte', vista: 'kpis', items: [
        { id: 'semCorte', l: 'Semana de corte', t: 'texto', calc: function (c) { var x = corte(c); return x ? (x.r.sem || '') + (x.r.fecha ? ' · ' + x.r.fecha : '') : 'Sin avance real'; } },
        { id: 'progC', l: 'Avance programado al corte', t: 'pct', calc: enCorte('progAcum', 100), xls: lk('realAcum', 'progAcum', 100) },
        { id: 'realC', l: 'Avance real al corte', t: 'pct', calc: enCorte('realAcum', 100), xls: lk('realAcum', 'realAcum', 100) },
        { id: 'difC', l: 'Diferencia (puntos)', t: 'num', dec: 1, calc: function (c) { return (c.v('realC') - c.v('progC')) * 100; }, xls: function (X) { return '(' + X.id('realC') + '-' + X.id('progC') + ')*100'; } },
        { id: 'spi', l: 'Índice de programa SPI', t: 'num', dec: 2, calc: function (c) { return c.v('progC') ? c.v('realC') / c.v('progC') : 0; }, xls: function (X) { return 'IFERROR(' + X.id('realC') + '/' + X.id('progC') + ',0)'; } },
        { id: 'presT', l: 'Costo total programado', t: 'money', calc: function (c) { return c.tot(T, 'cpSem'); }, xls: function (X) { return X.total(T, 'cpSem'); } },
        { id: 'cpC', l: 'Costo programado al corte', t: 'money', calc: enCorte('cpAcum'), xls: lk('realAcum', 'cpAcum') },
        { id: 'crC', l: 'Costo real al corte', t: 'money', calc: function (c) { var x = corte(c); return x && x.o.crAcum !== null ? num(x.o.crAcum) : 0; }, xls: lk('realAcum', 'crAcum') },
        { id: 'ev', l: 'Valor ganado', t: 'money', calc: function (c) { return c.v('realC') * c.v('presT'); }, xls: function (X) { return X.id('realC') + '*' + X.id('presT'); } },
        { id: 'cpi', l: 'Índice de costo CPI', t: 'num', dec: 2, calc: function (c) { return c.v('crC') ? c.v('ev') / c.v('crC') : 0; }, xls: function (X) { return 'IFERROR(' + X.id('ev') + '/' + X.id('crC') + ',0)'; } }
      ]},
      { tipo: 'resumen', titulo: 'Diagnóstico', items: [
        { id: 'diag', l: 'Lectura de la curva', t: 'texto', calc: diagnostico }
      ]},
      { tipo: 'campos', titulo: 'Notas', campos: [
        { k: 'notas', l: 'Causas de desviación y acciones', t: 'textarea' }
      ]}
    ],
    firmas: [{ l: 'Elaboró', k: 'responsable' }, { l: 'Revisó', k: 'reviso' }, { l: 'Vo. Bo. cliente', k: 'vobo' }],
    nuevo: function (ej) {
      return {
        campos: ej ? {
          obra: 'Casa habitación de 2 niveles, 3 recámaras', contrato: 'CTO-2026-018', fecha: '2026-09-27', contratista: 'Constructora del Valle',
          inicio: '2026-07-20', termino: '2026-11-08', responsable: 'Ing. Carlos Méndez Ruiz', reviso: '',
          notas: 'El atraso se concentra en estructura por el suministro de acero (S8–S10). Se programó turno extendido y segundo proveedor para recuperar en S11–S13.'
        } : { fecha: U.hoyISO() },
        params: {},
        tablas: { semanas: ej ? ejemplo() : blanco() }
      };
    }
  });
})();
