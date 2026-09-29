/* =========================================================
   Plantilla 04 · ANÁLISIS DE PRECIOS UNITARIOS (APU)
   Un documento = un concepto. Integra:
   Materiales · Mano de obra (FSR + rendimiento) · Herramienta y
   equipo de seguridad (% de MO) · Maquinaria y equipo · Auxiliares
   → Costo directo → Indirectos → Financiamiento → Utilidad →
   Cargos adicionales → PRECIO UNITARIO
   Salarios y precios de referencia 2026 (MXN)
   ========================================================= */
(function () {
  var U = ImfraPlantillas.util, num = U.num;
  function R(t, o) { var r = { id: U.nid(), _t: 'c' }; Object.keys(o).forEach(function (k) { r[k] = o[k]; }); return r; }
  function vacio(keys) { var o = {}; keys.forEach(function (k) { o[k] = ''; }); return R('c', o); }

  var NOTAS = 'Análisis integrado con base en salarios, precios de materiales y costos horarios vigentes a la fecha del análisis. ' +
    'El factor de salario real (FSR) incluye prestaciones de ley, cuotas IMSS e INFONAVIT y días no laborados. ' +
    'Los rendimientos consideran condiciones normales de trabajo; en alturas mayores a 3.00 m o accesos restringidos deben ajustarse.';

  function ejemplo() {
    return {
      materiales: [
        R('c', { clave: 'MAT-BLK-12', desc: 'Block hueco de concreto de 12x20x40 cm', unidad: 'pza', costo: 13.5, cantidad: 12.5, desp: 3 }),
        R('c', { clave: 'MAT-AGU-01', desc: 'Agua para curado y humedecido de piezas', unidad: 'm3', costo: 45, cantidad: 0.005, desp: 0 })
      ],
      auxiliares: [
        R('c', { clave: 'AUX-MOR-14', desc: 'Mortero cemento-arena 1:4 hecho en obra (básico)', unidad: 'm3', costo: 2150, cantidad: 0.012 })
      ],
      manoobra: [
        R('c', { clave: 'MO-OFA', desc: 'Oficial albañil', sbase: 650, fsr: 1.68, cantidad: 1 }),
        R('c', { clave: 'MO-AYG', desc: 'Ayudante general', sbase: 420, fsr: 1.68, cantidad: 1 }),
        R('c', { clave: 'MO-CAB', desc: 'Cabo de oficios (10% de supervisión)', sbase: 780, fsr: 1.68, cantidad: 0.1 })
      ],
      herramienta: [
        R('c', { clave: 'HE-MEN', desc: 'Herramienta menor', pct: 3 }),
        R('c', { clave: 'EQ-SEG', desc: 'Equipo de seguridad personal', pct: 2 })
      ],
      maquinaria: [
        R('c', { clave: 'EQ-AND', desc: 'Andamio tubular de 2 cuerpos (renta)', unidad: 'hr', costo: 9, rend: 1.25 })
      ]
    };
  }
  function blanco() {
    return {
      materiales: [vacio(['clave', 'desc', 'unidad', 'costo', 'cantidad', 'desp'])],
      auxiliares: [vacio(['clave', 'desc', 'unidad', 'costo', 'cantidad'])],
      manoobra: [R('c', { clave: '', desc: 'Oficial', sbase: '', fsr: 1.65, cantidad: 1 }), R('c', { clave: '', desc: 'Ayudante', sbase: '', fsr: 1.65, cantidad: 1 })],
      herramienta: [R('c', { clave: 'HE-MEN', desc: 'Herramienta menor', pct: 3 }), R('c', { clave: 'EQ-SEG', desc: 'Equipo de seguridad personal', pct: 2 })],
      maquinaria: [vacio(['clave', 'desc', 'unidad', 'costo', 'rend'])]
    };
  }
  function it(id, l, calc, xls, extra) { var o = { id: id, l: l, t: 'money', calc: calc, xls: xls }; if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; }); return o; }
  function pctCD(id) { return function (c) { var cd = c.v('cd'); return cd ? c.v(id) / cd : 0; }; }

  ImfraPlantillas.registrar({
    id: 'apu',
    version: 1,
    hoja: 'APU',
    secciones: [
      { tipo: 'campos', titulo: 'Datos del concepto', campos: [
        { k: 'clave', l: 'Clave del concepto', ph: 'ALB-MUR-012' },
        { k: 'unidad', l: 'Unidad', ph: 'm2' },
        { k: 'cantObra', l: 'Cantidad de obra (opcional)', t: 'number' },
        { k: 'fecha', l: 'Fecha del análisis', t: 'date' },
        { k: 'concepto', l: 'Descripción completa del concepto', t: 'textarea' },
        { k: 'obra', l: 'Obra / proyecto', w: 2 },
        { k: 'cliente', l: 'Cliente / dependencia', w: 2 },
        { k: 'responsable', l: 'Elaboró', w: 2 },
        { k: 'reviso', l: 'Revisó', w: 2 }
      ]},
      { tipo: 'campos', titulo: 'Rendimientos', campos: [
        { k: 'cuadrilla', l: 'Integración de la cuadrilla', w: 2, ph: '1 oficial + 1 ayudante + 0.1 cabo' },
        { k: 'rend', l: 'Rendimiento de la cuadrilla (unidad / jornada)', t: 'number' },
        { k: 'jornada', l: 'Jornada (horas)', t: 'number', dec: 0 }
      ]},
      { tipo: 'tabla', key: 'materiales', titulo: 'Materiales', totalLabel: 'Total materiales', filaLabel: 'Material',
        columnas: [
          { k: 'clave', l: 'Clave', t: 'text', ancho: 120, xlsAncho: 13 },
          { k: 'desc', l: 'Descripción', t: 'textarea', ancho: 360, xlsAncho: 46, ph: 'Material' },
          { k: 'unidad', l: 'Unidad', t: 'unidad', ancho: 84, xlsAncho: 13 },
          { k: 'costo', l: 'Costo unitario', t: 'money', ancho: 120, xlsAncho: 14 },
          { k: 'cantidad', l: 'Cantidad', t: 'num', dec: 4, ancho: 110, xlsAncho: 13 },
          { k: 'desp', l: 'Desperdicio %', t: 'num', ancho: 110, xlsAncho: 13 },
          { k: 'importe', l: 'Importe', t: 'money', total: true, ancho: 130, xlsAncho: 16, calc: function (r) { return num(r.costo) * num(r.cantidad) * (1 + num(r.desp) / 100); }, formula: '{costo}*{cantidad}*(1+{desp}/100)' }
        ]
      },
      { tipo: 'tabla', key: 'auxiliares', titulo: 'Auxiliares y básicos', totalLabel: 'Total auxiliares', filaLabel: 'Auxiliar',
        columnas: [
          { k: 'clave', l: 'Clave', t: 'text', ancho: 120 },
          { k: 'desc', l: 'Descripción', t: 'textarea', ancho: 360, ph: 'Mortero, concreto hecho en obra, cimbra…' },
          { k: 'unidad', l: 'Unidad', t: 'unidad', ancho: 84 },
          { k: 'costo', l: 'Costo unitario', t: 'money', ancho: 120 },
          { k: 'cantidad', l: 'Cantidad', t: 'num', dec: 4, ancho: 110 },
          { k: 'importe', l: 'Importe', t: 'money', total: true, ancho: 130, calc: function (r) { return num(r.costo) * num(r.cantidad); }, formula: '{costo}*{cantidad}' }
        ]
      },
      { tipo: 'tabla', key: 'manoobra', titulo: 'Mano de obra', totalLabel: 'Total mano de obra', filaLabel: 'Categoría',
        columnas: [
          { k: 'clave', l: 'Clave', t: 'text', ancho: 120 },
          { k: 'desc', l: 'Categoría', t: 'textarea', ancho: 300, ph: 'Oficial, ayudante, cabo…' },
          { k: 'sbase', l: 'Salario base diario', t: 'money', ancho: 120 },
          { k: 'fsr', l: 'FSR', t: 'num', dec: 4, ancho: 90 },
          { k: 'sreal', l: 'Salario real', t: 'money', ancho: 120, calc: function (r) { return num(r.sbase) * num(r.fsr); }, formula: '{sbase}*{fsr}' },
          { k: 'cantidad', l: 'Cant. en cuadrilla', t: 'num', ancho: 110 },
          { k: 'importe', l: 'Importe', t: 'money', total: true, ancho: 130,
            calc: function (r, o, d) { var rd = num(d.campos && d.campos.rend); return rd ? o.sreal * num(r.cantidad) / rd : 0; },
            formula: 'IFERROR({sreal}*{cantidad}/{@rend},0)' }
        ]
      },
      { tipo: 'tabla', key: 'herramienta', titulo: 'Herramienta y equipo de seguridad', totalLabel: 'Total herramienta y seguridad', filaLabel: 'Cargo',
        columnas: [
          { k: 'clave', l: 'Clave', t: 'text', ancho: 120 },
          { k: 'desc', l: 'Descripción', t: 'textarea', ancho: 360 },
          { k: 'base', l: 'Base: mano de obra', t: 'money', ancho: 140, calc: function (r, o, d, comp) { return num(comp.t.manoobra && comp.t.manoobra.tot.importe); }, formula: '{#manoobra.importe}' },
          { k: 'pct', l: '% sobre MO', t: 'num', ancho: 110 },
          { k: 'importe', l: 'Importe', t: 'money', total: true, ancho: 130, calc: function (r, o) { return o.base * num(r.pct) / 100; }, formula: '{base}*{pct}/100' }
        ]
      },
      { tipo: 'tabla', key: 'maquinaria', titulo: 'Maquinaria y equipo', totalLabel: 'Total maquinaria y equipo', filaLabel: 'Equipo',
        columnas: [
          { k: 'clave', l: 'Clave', t: 'text', ancho: 120 },
          { k: 'desc', l: 'Descripción', t: 'textarea', ancho: 360, ph: 'Revolvedora, vibrador, andamio…' },
          { k: 'unidad', l: 'Unidad', t: 'unidad', ancho: 84 },
          { k: 'costo', l: 'Costo horario', t: 'money', ancho: 120 },
          { k: 'rend', l: 'Rendimiento (unidad/hr)', t: 'num', dec: 4, ancho: 130 },
          { k: 'importe', l: 'Importe', t: 'money', total: true, ancho: 130, calc: function (r) { var rd = num(r.rend); return rd ? num(r.costo) / rd : 0; }, formula: 'IFERROR({costo}/{rend},0)' }
        ]
      },
      { tipo: 'resumen', titulo: 'Integración del costo directo', vista: 'kpis', items: [
        it('mat', 'Materiales', function (c) { return c.tot('materiales', 'importe'); }, function (X) { return X.total('materiales', 'importe'); }, { pct: pctCD('mat') }),
        it('aux', 'Auxiliares', function (c) { return c.tot('auxiliares', 'importe'); }, function (X) { return X.total('auxiliares', 'importe'); }, { pct: pctCD('aux') }),
        it('mo', 'Mano de obra', function (c) { return c.tot('manoobra', 'importe'); }, function (X) { return X.total('manoobra', 'importe'); }, { pct: pctCD('mo') }),
        it('her', 'Herramienta y seguridad', function (c) { return c.tot('herramienta', 'importe'); }, function (X) { return X.total('herramienta', 'importe'); }, { pct: pctCD('her') }),
        it('maq', 'Maquinaria y equipo', function (c) { return c.tot('maquinaria', 'importe'); }, function (X) { return X.total('maquinaria', 'importe'); }, { pct: pctCD('maq') })
      ]},
      { tipo: 'resumen', titulo: 'Precio unitario', items: [
        it('cd', 'Costo directo', function (c) { return c.v('mat') + c.v('aux') + c.v('mo') + c.v('her') + c.v('maq'); }, function (X) { return ['mat', 'aux', 'mo', 'her', 'maq'].map(X.id).join('+'); }),
        it('ind', 'Indirectos', function (c) { return c.v('cd') * c.p('indirectos') / 100; }, function (X) { return X.id('cd') + '*' + X.param('indirectos'); }, { param: { k: 'indirectos', suf: '%' } }),
        it('fin', 'Financiamiento', function (c) { return (c.v('cd') + c.v('ind')) * c.p('financiamiento') / 100; }, function (X) { return '(' + X.id('cd') + '+' + X.id('ind') + ')*' + X.param('financiamiento'); }, { param: { k: 'financiamiento', suf: '%' } }),
        it('uti', 'Utilidad', function (c) { return (c.v('cd') + c.v('ind') + c.v('fin')) * c.p('utilidad') / 100; }, function (X) { return '(' + X.id('cd') + '+' + X.id('ind') + '+' + X.id('fin') + ')*' + X.param('utilidad'); }, { param: { k: 'utilidad', suf: '%' } }),
        it('adic', 'Cargos adicionales', function (c) { return (c.v('cd') + c.v('ind') + c.v('fin') + c.v('uti')) * c.p('adicionales') / 100; }, function (X) { return '(' + X.id('cd') + '+' + X.id('ind') + '+' + X.id('fin') + '+' + X.id('uti') + ')*' + X.param('adicionales'); }, { param: { k: 'adicionales', suf: '%' } }),
        it('pu', 'PRECIO UNITARIO', function (c) { return Math.round((c.v('cd') + c.v('ind') + c.v('fin') + c.v('uti') + c.v('adic')) * 100) / 100; }, function (X) { return 'ROUND(' + X.id('cd') + '+' + X.id('ind') + '+' + X.id('fin') + '+' + X.id('uti') + '+' + X.id('adic') + ',2)'; }, { destacado: true }),
        it('imp', 'Importe total (P.U. × cantidad de obra)', function (c) { return c.v('pu') * num(c.campo('cantObra')); }, function (X) { return X.id('pu') + '*' + X.campo('cantObra'); }),
        { id: 'kPU', l: 'Precio unitario', t: 'money', kpi: true, calc: function (c) { return c.v('pu'); } },
        { id: 'kFS', l: 'Factor de sobrecosto (P.U. / C.D.)', t: 'num', dec: 4, kpi: true, calc: function (c) { return c.v('cd') ? c.v('pu') / c.v('cd') : 0; } },
        { id: 'kMO', l: 'Salario real de la cuadrilla', t: 'money', kpi: true, calc: function (c) { var d = c.data.tablas.manoobra || [], f = c.comp.t.manoobra.f, t = 0; d.forEach(function (r) { t += num(f[r.id] && f[r.id].sreal) * num(r.cantidad); }); return t; } },
        { id: 'kRend', l: 'Rendimiento (unidad / hora)', t: 'num', dec: 3, kpi: true, calc: function (c) { var j = num(c.campo('jornada')); return j ? num(c.campo('rend')) / j : 0; } },
        { id: 'letra', l: 'Precio unitario con letra', t: 'letra', calc: function (c) { return U.numeroALetras(c.v('pu')); } }
      ]},
      { tipo: 'campos', titulo: 'Observaciones', campos: [
        { k: 'notas', l: 'Consideraciones del análisis', t: 'textarea' }
      ]}
    ],
    firmas: [{ l: 'Elaboró', k: 'responsable' }, { l: 'Revisó', k: 'reviso' }, { l: 'Autorizó', k: 'autorizo' }],
    nuevo: function (ej) {
      return {
        campos: ej ? {
          clave: 'ALB-MUR-012', unidad: 'm2', cantObra: 285, fecha: U.hoyISO(),
          concepto: 'Muro de block hueco de concreto de 12x20x40 cm, junteado con mortero cemento-arena 1:4, acabado común, hasta 3.00 m de altura. Incluye materiales, mano de obra, andamios, herramienta y limpieza.',
          obra: 'Casa habitación de 2 niveles', cliente: 'Familia López Hernández', responsable: 'Ing. Carlos Méndez Ruiz', reviso: '',
          cuadrilla: '1 oficial albañil + 1 ayudante + 0.1 cabo', rend: 10, jornada: 8, notas: NOTAS
        } : { fecha: U.hoyISO(), jornada: 8, notas: NOTAS },
        params: { indirectos: 12, financiamiento: 1, utilidad: 10, adicionales: 0.5 },
        tablas: ej ? ejemplo() : blanco()
      };
    }
  });
})();
