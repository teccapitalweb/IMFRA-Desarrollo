/* =========================================================
   Plantilla 08 · CONTROL FÍSICO-FINANCIERO
   Por partida: presupuesto, avance físico programado y real (%),
   diferencia (puntos), variación %, semáforo automático, monto
   ejercido y avance financiero.
   Indicadores globales ponderados por presupuesto, índices de
   desempeño (SPI / CPI) y diagnóstico automático.
   ========================================================= */
(function () {
  var U = ImfraPlantillas.util, num = U.num;
  var T = 'partidas';

  function vacio(v) { return v === '' || v == null || String(v).trim() === ''; }
  function semaforo(r, o, d) {
    if (vacio(r.fisProg) && vacio(r.fisReal)) return '';
    var v = num(d.campos && d.campos.tolVerde), a = num(d.campos && d.campos.tolAmarillo);
    return o.dif >= -v ? 'EN TIEMPO' : o.dif >= -a ? 'ATENCIÓN' : 'ATRASADO';
  }
  function fila(a) { return { id: U.nid(), _t: 'c', clave: a[0], partida: a[1], presupuesto: a[2], fisProg: a[3], fisReal: a[4], ejercido: a[5], obs: a[6] || '' }; }
  var EJEMPLO = [
    ['01', 'Preliminares', 22278.5, 100, 100, 22278.5, 'Concluida'],
    ['02', 'Cimentación', 132918, 100, 100, 132918, 'Concluida'],
    ['03', 'Estructura', 297812, 70, 58, 180000, 'Retraso por suministro de acero; losa de entrepiso reprogramada'],
    ['04', 'Albañilería', 235685, 45, 40, 98000, 'Se reforzó la cuadrilla a partir de esta semana'],
    ['05', 'Instalación hidrosanitaria', 52730, 30, 20, 12500, 'Pendiente de liberar ranuras en planta alta'],
    ['06', 'Instalación eléctrica', 40410, 25, 25, 9000, ''],
    ['07', 'Acabados', 181950, 10, 0, 0, 'Inicio condicionado a terminar aplanados'],
    ['08', 'Cancelería, carpintería y herrería', 72850, 0, 0, 0, 'Fabricación en taller programada'],
    ['09', 'Limpieza y entrega', 4375, 0, 0, 0, '']
  ];

  /* sumatorias ponderadas */
  function sum(c, fn) { var t = 0; (c.data.tablas[T] || []).forEach(function (r) { t += fn(r); }); return t; }
  function pres(c) { return c.tot(T, 'presupuesto'); }
  function pond(k) { return function (c) { var p = pres(c); return p ? sum(c, function (r) { return num(r.presupuesto) * num(r[k]); }) / p / 100 : 0; }; }
  function pondX(k) { return function (X) { return 'IFERROR(SUMPRODUCT(' + X.rango(T, 'presupuesto') + ',' + X.rango(T, k) + ')/' + X.total(T, 'presupuesto') + '/100,0)'; }; }
  function contar(txt) { return function (c) { var f = c.comp.t[T].f, n = 0; (c.data.tablas[T] || []).forEach(function (r) { if (f[r.id] && f[r.id].sem === txt) n++; }); return n; }; }
  function diagnostico(c) {
    var p = c.v('prog'), r = c.v('real'), d = (r - p) * 100, f = c.comp.t[T].f, crit = [];
    if (!c.v('pres')) return 'Captura el presupuesto y los avances por partida para generar el diagnóstico.';
    (c.data.tablas[T] || []).forEach(function (x) { if (f[x.id] && f[x.id].sem === 'ATRASADO') crit.push(x.partida || x.clave); });
    var t = d < -0.05 ? 'La obra va ' + U.fmtNum(-d, 1) + ' puntos atrás del programa' : d > 0.05 ? 'La obra va ' + U.fmtNum(d, 1) + ' puntos adelante del programa' : 'La obra va conforme al programa';
    t += ' (programado ' + U.fmtPct(p, 1) + ', real ' + U.fmtPct(r, 1) + ').';
    if (c.v('cpi')) t += ' Cada peso ejercido ha generado ' + U.fmtMoney(c.v('cpi')) + ' de avance físico' + (c.v('cpi') < 0.97 ? ', por arriba del costo previsto.' : c.v('cpi') > 1.03 ? ', por debajo del costo previsto.' : ', en línea con lo presupuestado.');
    t += crit.length ? ' Partidas críticas: ' + crit.join(', ') + '.' : ' Sin partidas en rojo.';
    return t;
  }

  ImfraPlantillas.registrar({
    id: 'fisico-financiero',
    version: 1,
    hoja: 'Físico-financiero',
    secciones: [
      { tipo: 'campos', titulo: 'Datos del control', campos: [
        { k: 'obra', l: 'Obra', w: 2 },
        { k: 'contrato', l: 'No. de contrato' },
        { k: 'corte', l: 'Fecha de corte', t: 'date' },
        { k: 'cliente', l: 'Cliente / dependencia', w: 2 },
        { k: 'inicio', l: 'Inicio de obra', t: 'date' },
        { k: 'termino', l: 'Término programado', t: 'date' },
        { k: 'contratista', l: 'Contratista', w: 2 },
        { k: 'periodo', l: 'Semana / periodo reportado', w: 2, ph: 'Semana 10' },
        { k: 'responsable', l: 'Elaboró', w: 2 },
        { k: 'reviso', l: 'Revisó', w: 2 }
      ]},
      { tipo: 'campos', titulo: 'Criterios del semáforo', campos: [
        { k: 'tolVerde', l: 'EN TIEMPO: atraso de hasta (puntos)', t: 'number', dec: 1 },
        { k: 'tolAmarillo', l: 'ATENCIÓN: atraso de hasta (puntos)', t: 'number', dec: 1 },
        { k: 'critNota', l: 'Más atraso que eso = ATRASADO', w: 2, ph: 'Diferencia = avance real − avance programado' }
      ]},
      { tipo: 'tabla', key: T, titulo: 'Avance por partida', totalLabel: 'Total de la obra', filaLabel: 'Partida',
        filaNueva: function () { return { clave: '', partida: '', presupuesto: '', fisProg: '', fisReal: '', ejercido: '', obs: '' }; },
        columnas: [
          { k: 'clave', l: 'Clave', t: 'text', ancho: 70, xlsAncho: 8 },
          { k: 'partida', l: 'Partida', t: 'textarea', ancho: 200, xlsAncho: 30 },
          { k: 'presupuesto', l: 'Presupuesto programado', t: 'money', total: true, ancho: 130, xlsAncho: 15 },
          { k: 'fisProg', l: 'Avance físico programado (%)', t: 'num', dec: 1, ancho: 116, xlsAncho: 12 },
          { k: 'fisReal', l: 'Avance físico real (%)', t: 'num', dec: 1, ancho: 104, xlsAncho: 12 },
          { k: 'dif', l: 'Diferencia (puntos)', t: 'num', dec: 1, ancho: 96, xlsAncho: 11, calc: function (r) { return num(r.fisReal) - num(r.fisProg); }, formula: '{fisReal}-{fisProg}' },
          { k: 'var', l: 'Variación %', t: 'pct', ancho: 92, xlsAncho: 11, calc: function (r) { var p = num(r.fisProg); return p ? (num(r.fisReal) - p) / p : 0; }, formula: 'IFERROR(({fisReal}-{fisProg})/{fisProg},0)' },
          { k: 'sem', l: 'Semáforo', t: 'semaforo', ancho: 118, xlsAncho: 14, calc: semaforo,
            formula: 'IF(AND({fisProg}="",{fisReal}=""),"",IF({dif}>=-{@tolVerde},"EN TIEMPO",IF({dif}>=-{@tolAmarillo},"ATENCIÓN","ATRASADO")))' },
          { k: 'ejercido', l: 'Monto ejercido', t: 'money', total: true, ancho: 124, xlsAncho: 15 },
          { k: 'fin', l: 'Avance financiero', t: 'pct', ancho: 96, xlsAncho: 11, calc: function (r) { var p = num(r.presupuesto); return p ? num(r.ejercido) / p : 0; }, formula: 'IFERROR({ejercido}/{presupuesto},0)' },
          { k: 'obs', l: 'Observaciones', t: 'textarea', ancho: 240, xlsAncho: 34 }
        ]
      },
      { tipo: 'resumen', titulo: 'Indicadores de la obra', vista: 'kpis', items: [
        { id: 'pres', l: 'Presupuesto total', t: 'money', calc: pres, xls: function (X) { return X.total(T, 'presupuesto'); } },
        { id: 'prog', l: 'Avance físico programado', t: 'pct', calc: pond('fisProg'), xls: pondX('fisProg') },
        { id: 'real', l: 'Avance físico real', t: 'pct', calc: pond('fisReal'), xls: pondX('fisReal') },
        { id: 'difG', l: 'Diferencia global (puntos)', t: 'num', dec: 1, calc: function (c) { return (c.v('real') - c.v('prog')) * 100; }, xls: function (X) { return '(' + X.id('real') + '-' + X.id('prog') + ')*100'; } },
        { id: 'finG', l: 'Avance financiero', t: 'pct', calc: function (c) { var p = c.v('pres'); return p ? c.tot(T, 'ejercido') / p : 0; }, xls: function (X) { return 'IFERROR(' + X.total(T, 'ejercido') + '/' + X.id('pres') + ',0)'; } },
        { id: 'ev', l: 'Valor ganado (avance real × presupuesto)', t: 'money', calc: function (c) { return c.v('real') * c.v('pres'); }, xls: function (X) { return X.id('real') + '*' + X.id('pres'); } },
        { id: 'spi', l: 'Índice de programa SPI (real / programado)', t: 'num', dec: 2, calc: function (c) { return c.v('prog') ? c.v('real') / c.v('prog') : 0; }, xls: function (X) { return 'IFERROR(' + X.id('real') + '/' + X.id('prog') + ',0)'; } },
        { id: 'cpi', l: 'Índice de costo CPI (ganado / ejercido)', t: 'num', dec: 2, calc: function (c) { var e = c.tot(T, 'ejercido'); return e ? c.v('ev') / e : 0; }, xls: function (X) { return 'IFERROR(' + X.id('ev') + '/' + X.total(T, 'ejercido') + ',0)'; } },
        { id: 'nRojo', l: 'Partidas atrasadas', t: 'num', dec: 0, calc: contar('ATRASADO'), xls: function (X) { return 'COUNTIF(' + X.rango(T, 'sem') + ',"ATRASADO")'; } },
        { id: 'nAmar', l: 'Partidas en atención', t: 'num', dec: 0, calc: contar('ATENCIÓN'), xls: function (X) { return 'COUNTIF(' + X.rango(T, 'sem') + ',"ATENCI*")'; } }
      ]},
      { tipo: 'resumen', titulo: 'Diagnóstico', items: [
        { id: 'tiempo', l: 'Tiempo transcurrido del plazo', t: 'pct', kpi: true, calc: function (c) {
            var i = Date.parse(c.campo('inicio')), f = Date.parse(c.campo('termino')), k = Date.parse(c.campo('corte'));
            return i && f && k && f > i ? Math.max(0, Math.min(1.5, (k - i) / (f - i))) : 0; } },
        { id: 'kReal', l: 'Avance físico real', t: 'pct', kpi: true, calc: function (c) { return c.v('real'); } },
        { id: 'diag', l: 'Diagnóstico automático', t: 'texto', calc: diagnostico }
      ]},
      { tipo: 'campos', titulo: 'Acciones correctivas', campos: [
        { k: 'acciones', l: 'Acciones y compromisos para recuperar el programa', t: 'textarea' }
      ]}
    ],
    firmas: [{ l: 'Elaboró', k: 'responsable' }, { l: 'Revisó', k: 'reviso' }, { l: 'Vo. Bo. cliente', k: 'cliente' }],
    nuevo: function (ej) {
      return {
        campos: ej ? {
          obra: 'Casa habitación de 2 niveles, 3 recámaras', contrato: 'CTO-2026-018', corte: '2026-09-27', cliente: 'Familia López Hernández',
          inicio: '2026-07-20', termino: '2026-11-09', contratista: 'Constructora del Valle', periodo: 'Semana 10', responsable: 'Ing. Carlos Méndez Ruiz', reviso: '',
          tolVerde: 5, tolAmarillo: 10, critNota: 'Diferencia = avance real − avance programado',
          acciones: '1. Acelerar suministro de acero con segundo proveedor.\n2. Turno extendido de cuadrilla de estructura durante 2 semanas.\n3. Liberar ranuras de instalaciones en planta alta antes del viernes.'
        } : { corte: U.hoyISO(), tolVerde: 5, tolAmarillo: 10, critNota: 'Diferencia = avance real − avance programado' },
        params: {},
        tablas: { partidas: ej ? EJEMPLO.map(fila) : [fila(['01', '', '', '', '', '', '']), fila(['02', '', '', '', '', '', ''])] }
      };
    }
  });
})();
