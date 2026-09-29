/* =========================================================
   Plantilla 07 · ESTIMACIONES DE OBRA
   Por concepto: cantidad contratada, acumulado anterior, esta
   estimación, acumulado total, saldo por ejecutar y % de avance.
   Carátula: importe, amortización de anticipo, IVA, retenciones
   (5 al millar, fondo de garantía, otras) y NETO A PAGAR.
   Acción "Siguiente estimación": pasa el acumulado a "anterior",
   limpia el periodo y crea la estimación No. +1.
   ========================================================= */
(function () {
  var U = ImfraPlantillas.util, num = U.num;

  // [clave, tipo, texto, unidad, contratada, pu, anterior, esta]
  var EJEMPLO = [
    ['01', 'p', 'Preliminares'],
    ['01.01.001', 'c', 'Limpieza y desenraice de terreno con medios manuales.', 'm2', 160, 18.5, 160, 0],
    ['01.01.002', 'c', 'Trazo y nivelación con equipo topográfico.', 'm2', 95, 14.8, 95, 0],
    ['01.02.001', 'c', 'Excavación a mano en material tipo II, de 0.00 a -1.20 m.', 'm3', 38.5, 245, 38.5, 0],
    ['01.02.002', 'c', 'Relleno compactado con material producto de excavación al 90% Proctor.', 'm3', 22, 185, 14, 8],
    ['02', 'p', 'Cimentación'],
    ['02.01.001', 'c', 'Plantilla de concreto f\'c=100 kg/cm² de 5 cm.', 'm2', 48, 165, 48, 0],
    ['02.01.002', 'c', 'Zapata corrida de concreto f\'c=250 kg/cm² armada con varilla #3 @ 20 cm.', 'm3', 14.2, 4850, 14.2, 0],
    ['02.02.001', 'c', 'Cadena de desplante de 15x20 cm, f\'c=200 kg/cm².', 'ml', 96, 385, 70, 26],
    ['02.02.002', 'c', 'Muro de enrase de block 15x20x40 cm relleno de concreto.', 'm2', 28, 520, 0, 28],
    ['03', 'p', 'Estructura'],
    ['03.01.001', 'c', 'Castillo de 15x15 cm, f\'c=200 kg/cm², 4 var. #3 y estribos #2 @ 20 cm.', 'ml', 142, 345, 0, 64],
    ['03.01.002', 'c', 'Cadena de cerramiento de 15x20 cm, f\'c=200 kg/cm².', 'ml', 118, 395, 0, 0],
    ['03.02.001', 'c', 'Losa maciza de 10 cm, f\'c=250 kg/cm², armada con var. #3 @ 20 cm.', 'm2', 132, 1180, 0, 0],
    ['04', 'p', 'Albañilería'],
    ['04.01.001', 'c', 'Muro de block hueco de 12x20x40 cm junteado con mortero 1:4.', 'm2', 285, 395, 0, 118],
    ['04.02.001', 'c', 'Firme de concreto f\'c=150 kg/cm² de 8 cm con malla 6x6-10/10.', 'm2', 68, 295, 0, 0]
  ];

  function filas(ej) {
    if (ej) return EJEMPLO.map(function (e) {
      var r = { id: U.nid(), _t: e[1], clave: e[0], concepto: e[2] };
      if (e[1] === 'c') { r.unidad = e[3]; r.contratada = e[4]; r.pu = e[5]; r.anterior = e[6]; r.esta = e[7]; }
      return r;
    });
    return [{ id: U.nid(), _t: 'p', clave: '01', concepto: '' }, { id: U.nid(), _t: 'c', clave: '', concepto: '', unidad: '', contratada: '', pu: '', anterior: '', esta: '' }];
  }
  function sumAll(c, k) { return c.tot('conceptos', k); }
  var pX = function (k) { return function (X) { return X.param(k); }; };

  ImfraPlantillas.registrar({
    id: 'estimaciones',
    version: 1,
    hoja: 'Estimación',
    acciones: [{
      l: 'Siguiente estimación', icon: 'siguiente', ok: 'Estimación siguiente creada',
      desc: 'Se crea la estimación siguiente: el acumulado de esta pasa a "acumulado anterior", la columna "esta estimación" queda en cero y el periodo se limpia. Esta estimación no se modifica.',
      run: function (data, doc) {
        var n = (parseInt(data.campos.numero, 10) || 0) + 1;
        (data.tablas.conceptos || []).forEach(function (r) {
          if (r._t === 'c') { r.anterior = Math.round((num(r.anterior) + num(r.esta)) * 10000) / 10000; r.esta = ''; }
          r.id = U.nid();
        });
        data.campos.numero = String(n); data.campos.del = ''; data.campos.al = ''; data.campos.fecha = U.hoyISO(); data.campos.tipo = 'Normal';
        var nombre = String(doc.nombre || 'Estimación').replace(/(Est(imaci[oó]n)?\.?\s*(No\.?)?\s*)\d+/i, function (m, p) { return p + n; });
        if (nombre === doc.nombre) nombre = doc.nombre + ' — Est. ' + n;
        return { nombre: nombre, data: data };
      }
    }],
    secciones: [
      { tipo: 'campos', titulo: 'Datos de la estimación', campos: [
        { k: 'obra', l: 'Obra', w: 2 },
        { k: 'contrato', l: 'No. de contrato' },
        { k: 'numero', l: 'Estimación No.' },
        { k: 'cliente', l: 'Cliente / dependencia', w: 2 },
        { k: 'del', l: 'Periodo del', t: 'date' },
        { k: 'al', l: 'Periodo al', t: 'date' },
        { k: 'contratista', l: 'Contratista', w: 2 },
        { k: 'tipo', l: 'Tipo de estimación', t: 'select', op: ['Normal', 'Finiquito', 'Volúmenes adicionales', 'Conceptos extraordinarios'] },
        { k: 'fecha', l: 'Fecha de elaboración', t: 'date' },
        { k: 'superintendente', l: 'Superintendente (contratista)', w: 2 },
        { k: 'supervision', l: 'Supervisión', w: 2 },
        { k: 'residente', l: 'Residente de obra', w: 2 }
      ]},
      { tipo: 'tabla', key: 'conceptos', titulo: 'Conceptos estimados', totalLabel: 'Totales', sinRenumerar: true,
        niveles: { texto: 'concepto', sumar: ['impContrato', 'impEst', 'impAcum'] },
        filaNueva: function (t) { return t === 'c' ? { clave: '', concepto: '', unidad: '', contratada: '', pu: '', anterior: '', esta: '' } : { clave: '', concepto: '' }; },
        columnas: [
          { k: 'clave', l: 'Clave', t: 'text', ancho: 100, xlsAncho: 11 },
          { k: 'concepto', l: 'Concepto', t: 'textarea', ancho: 280, xlsAncho: 40 },
          { k: 'unidad', l: 'Unidad', t: 'unidad', ancho: 70, xlsAncho: 8 },
          { k: 'contratada', l: 'Cant. contratada', t: 'num', ancho: 106, xlsAncho: 11 },
          { k: 'pu', l: 'P.U.', t: 'money', ancho: 104, xlsAncho: 12 },
          { k: 'anterior', l: 'Acumulado anterior', t: 'num', ancho: 96, xlsAncho: 11 },
          { k: 'esta', l: 'Esta estimación', t: 'num', ancho: 96, xlsAncho: 11 },
          { k: 'acum', l: 'Acumulado total', t: 'num', ancho: 96, xlsAncho: 11, calc: function (r) { return num(r.anterior) + num(r.esta); }, formula: '{anterior}+{esta}' },
          { k: 'saldo', l: 'Por ejecutar', t: 'num', ancho: 96, xlsAncho: 11, calc: function (r, o) { return num(r.contratada) - o.acum; }, formula: '{contratada}-{acum}' },
          { k: 'avance', l: '% avance', t: 'pct', ancho: 80, xlsAncho: 9, calc: function (r, o) { var c = num(r.contratada); return c ? o.acum / c : 0; }, formula: 'IFERROR({acum}/{contratada},0)' },
          { k: 'impContrato', l: 'Importe contratado', t: 'money', ancho: 124, xlsAncho: 15, calc: function (r) { return num(r.contratada) * num(r.pu); }, formula: '{contratada}*{pu}' },
          { k: 'impEst', l: 'Importe esta estimación', t: 'money', ancho: 124, xlsAncho: 15, calc: function (r) { return num(r.esta) * num(r.pu); }, formula: '{esta}*{pu}' },
          { k: 'impAcum', l: 'Importe acumulado', t: 'money', ancho: 124, xlsAncho: 15, calc: function (r, o) { return o.acum * num(r.pu); }, formula: '{acum}*{pu}' }
        ]
      },
      { tipo: 'resumen', titulo: 'Carátula de la estimación', items: [
        { id: 'est', l: 'Importe de esta estimación', t: 'money', calc: function (c) { return sumAll(c, 'impEst'); }, xls: function (X) { return X.total('conceptos', 'impEst'); } },
        { id: 'amort', l: '(−) Amortización de anticipo', t: 'money', param: { k: 'anticipo', suf: '%' }, calc: function (c) { return c.v('est') * c.p('anticipo') / 100; }, xls: function (X) { return X.id('est') + '*' + pX('anticipo')(X); } },
        { id: 'sub', l: 'Subtotal', t: 'money', calc: function (c) { return c.v('est') - c.v('amort'); }, xls: function (X) { return X.id('est') + '-' + X.id('amort'); } },
        { id: 'iva', l: 'IVA', t: 'money', param: { k: 'iva', suf: '%' }, calc: function (c) { return c.v('sub') * c.p('iva') / 100; }, xls: function (X) { return X.id('sub') + '*' + pX('iva')(X); } },
        { id: 'total', l: 'Total de la estimación', t: 'money', calc: function (c) { return c.v('sub') + c.v('iva'); }, xls: function (X) { return X.id('sub') + '+' + X.id('iva'); } },
        { id: 'r1', l: '(−) Retención 5 al millar (inspección y vigilancia)', t: 'money', param: { k: 'millar', suf: '%' }, calc: function (c) { return c.v('est') * c.p('millar') / 100; }, xls: function (X) { return X.id('est') + '*' + pX('millar')(X); } },
        { id: 'r2', l: '(−) Fondo de garantía', t: 'money', param: { k: 'garantia', suf: '%' }, calc: function (c) { return c.v('est') * c.p('garantia') / 100; }, xls: function (X) { return X.id('est') + '*' + pX('garantia')(X); } },
        { id: 'r3', l: '(−) Otras retenciones / penas convencionales', t: 'money', param: { k: 'otras', suf: '%' }, calc: function (c) { return c.v('est') * c.p('otras') / 100; }, xls: function (X) { return X.id('est') + '*' + pX('otras')(X); } },
        { id: 'neto', l: 'NETO A PAGAR', t: 'money', destacado: true, calc: function (c) { return c.v('total') - c.v('r1') - c.v('r2') - c.v('r3'); }, xls: function (X) { return X.id('total') + '-' + X.id('r1') + '-' + X.id('r2') + '-' + X.id('r3'); } },
        { id: 'kNeto', l: 'Neto a pagar', t: 'money', kpi: true, calc: function (c) { return c.v('neto'); } },
        { id: 'kRet', l: 'Total retenido en esta estimación', t: 'money', kpi: true, calc: function (c) { return c.v('r1') + c.v('r2') + c.v('r3'); } },
        { id: 'kExc', l: 'Conceptos excedidos (volumen adicional)', t: 'num', dec: 0, kpi: true, calc: function (c) { var n = 0, f = c.comp.t.conceptos.f; (c.data.tablas.conceptos || []).forEach(function (r) { if (r._t === 'c' && num(r.contratada) > 0 && f[r.id] && f[r.id].saldo < -0.0001) n++; }); return n; } },
        { id: 'letra', l: 'Neto a pagar con letra', t: 'letra', calc: function (c) { return U.numeroALetras(c.v('neto')); } }
      ]},
      { tipo: 'resumen', titulo: 'Avance del contrato', vista: 'kpis', items: [
        { id: 'contrato', l: 'Monto contratado (sin IVA)', t: 'money', calc: function (c) { return sumAll(c, 'impContrato'); }, xls: function (X) { return X.total('conceptos', 'impContrato'); } },
        { id: 'acumulado', l: 'Estimado acumulado', t: 'money', calc: function (c) { return sumAll(c, 'impAcum'); }, xls: function (X) { return X.total('conceptos', 'impAcum'); }, pct: function (c) { var k = c.v('contrato'); return k ? c.v('acumulado') / k : 0; } },
        { id: 'avFin', l: 'Avance financiero', t: 'pct', calc: function (c) { var k = c.v('contrato'); return k ? c.v('acumulado') / k : 0; }, xls: function (X) { return 'IFERROR(' + X.id('acumulado') + '/' + X.id('contrato') + ',0)'; } },
        { id: 'porEstimar', l: 'Saldo por estimar', t: 'money', calc: function (c) { return c.v('contrato') - c.v('acumulado'); }, xls: function (X) { return X.id('contrato') + '-' + X.id('acumulado'); } },
        { id: 'antPend', l: 'Anticipo pendiente de amortizar', t: 'money', calc: function (c) { return (c.v('contrato') - c.v('acumulado')) * c.p('anticipo') / 100; }, xls: function (X) { return X.id('porEstimar') + '*' + X.param('anticipo'); } }
      ]},
      { tipo: 'campos', titulo: 'Observaciones', campos: [
        { k: 'notas', l: 'Observaciones de la estimación', t: 'textarea' }
      ]}
    ],
    firmas: [{ l: 'Superintendente (contratista)', k: 'superintendente' }, { l: 'Supervisión', k: 'supervision' }, { l: 'Residente de obra', k: 'residente' }],
    nuevo: function (ej) {
      var hoy = U.hoyISO();
      return {
        campos: ej ? {
          obra: 'Casa habitación de 2 niveles, 3 recámaras', contrato: 'CTO-2026-018', numero: '3', cliente: 'Familia López Hernández',
          del: '2026-09-14', al: '2026-09-27', contratista: 'Constructora del Valle', tipo: 'Normal', fecha: hoy,
          superintendente: 'Ing. Carlos Méndez Ruiz', supervision: '', residente: '',
          notas: 'Volúmenes soportados con números generadores y reporte fotográfico del periodo. Se anexa copia de bitácora.'
        } : { numero: '1', tipo: 'Normal', fecha: hoy },
        params: { anticipo: 30, iva: 16, millar: 0.5, garantia: 5, otras: 0 },
        tablas: { conceptos: filas(ej) }
      };
    }
  });
})();
