/* =========================================================
   Plantilla 05 · EXPLOSIÓN DE INSUMOS
   Tres tablas separadas: Materiales · Mano de obra · Maquinaria y equipo
   Clave, insumo, unidad, cantidad requerida, P.U., importe, % de
   participación, proveedor y observaciones.
   Resumen por tipo de insumo, IVA de compras e insumos que más pesan.
   Precios de referencia 2026 (MXN)
   ========================================================= */
(function () {
  var U = ImfraPlantillas.util, num = U.num;
  var TABLAS = ['materiales', 'manoobra', 'maquinaria'];

  function fila(a) { return { id: U.nid(), _t: 'c', clave: a[0], insumo: a[1], unidad: a[2], cantidad: a[3], pu: a[4], proveedor: a[5] || '', obs: a[6] || '' }; }
  function vacia() { return fila(['', '', '', '', '', '', '']); }

  var MAT = [
    ['MAT-001', 'Cemento gris CPC 30R (bulto de 50 kg)', 'bto', 620, 245, 'Casa de materiales local', 'Entregas semanales de 100 bultos'],
    ['MAT-002', 'Mortero para albañilería (bulto de 50 kg)', 'bto', 380, 175, 'Casa de materiales local', ''],
    ['MAT-003', 'Arena de río cribada', 'm3', 95, 420, 'Banco de materiales', 'Puesta en obra'],
    ['MAT-004', 'Grava de 3/4"', 'm3', 60, 460, 'Banco de materiales', 'Puesta en obra'],
    ['MAT-005', 'Varilla corrugada #3 fy=4,200 kg/cm²', 'ton', 3.2, 21500, 'Distribuidor de acero', 'Precio sujeto a variación del acero'],
    ['MAT-006', 'Varilla corrugada #4 fy=4,200 kg/cm²', 'ton', 1.1, 21200, 'Distribuidor de acero', ''],
    ['MAT-007', 'Alambrón de 1/4"', 'kg', 520, 26, 'Distribuidor de acero', 'Para estribos'],
    ['MAT-008', 'Alambre recocido cal. 18', 'kg', 180, 34, 'Distribuidor de acero', ''],
    ['MAT-009', 'Block hueco de concreto 12x20x40 cm', 'pza', 3700, 13.5, 'Bloquera regional', 'Incluye 3% de desperdicio'],
    ['MAT-010', 'Concreto premezclado f\'c=250 kg/cm² T.M.A. 3/4"', 'm3', 38, 2650, 'Concretera', 'Programar bombeo para losas'],
    ['MAT-011', 'Malla electrosoldada 6x6-10/10', 'm2', 120, 22, 'Distribuidor de acero', ''],
    ['MAT-012', 'Tubo CPVC de 1/2" (tramo de 6 m)', 'tmo', 30, 145, 'Ferretería y plomería', ''],
    ['MAT-013', 'Tubo PVC sanitario de 4" (tramo de 6 m)', 'tmo', 12, 390, 'Ferretería y plomería', ''],
    ['MAT-014', 'Cable THW cal. 12 (caja de 100 m)', 'caja', 6, 1450, 'Material eléctrico', 'Colores según circuito'],
    ['MAT-015', 'Piso cerámico 45x45 cm', 'm2', 130, 215, 'Distribuidor de acabados', 'Incluye 10% de desperdicio'],
    ['MAT-016', 'Pintura vinílica (cubeta de 19 L)', 'cub', 22, 1650, 'Distribuidor de pinturas', ''],
    ['MAT-017', 'Impermeabilizante acrílico 5 años (cubeta de 19 L)', 'cub', 7, 1950, 'Distribuidor de pinturas', '']
  ];
  var MO = [
    ['MO-001', 'Oficial albañil (salario real)', 'jor', 160, 1092, 'Cuadrilla propia', 'FSR 1.68'],
    ['MO-002', 'Ayudante general (salario real)', 'jor', 200, 705.6, 'Cuadrilla propia', 'FSR 1.68'],
    ['MO-003', 'Fierrero', 'jor', 25, 1150, 'Cuadrilla propia', ''],
    ['MO-004', 'Carpintero de obra negra', 'jor', 30, 1120, 'Cuadrilla propia', 'Cimbra de losas y trabes'],
    ['MO-005', 'Plomero', 'jor', 12, 1180, 'Subcontrato', ''],
    ['MO-006', 'Electricista', 'jor', 14, 1180, 'Subcontrato', ''],
    ['MO-007', 'Pintor', 'jor', 18, 1020, 'Subcontrato', ''],
    ['MO-008', 'Cabo de oficios', 'jor', 16, 1310, 'Cuadrilla propia', '']
  ];
  var MAQ = [
    ['EQ-001', 'Retroexcavadora con operador', 'hr', 16, 950, 'Renta de maquinaria', 'Excavación de cimentación'],
    ['EQ-002', 'Camión de volteo de 7 m³', 'viaje', 22, 1400, 'Fletes regionales', 'Acarreo de sobrantes'],
    ['EQ-003', 'Revolvedora de 1 saco (renta)', 'día', 35, 480, 'Renta de equipo', ''],
    ['EQ-004', 'Vibrador para concreto (renta)', 'día', 12, 380, 'Renta de equipo', ''],
    ['EQ-005', 'Andamio tubular de 2 cuerpos (renta)', 'día', 90, 45, 'Renta de equipo', ''],
    ['EQ-006', 'Bomba para concreto (servicio)', 'serv', 2, 5500, 'Concretera', 'Colado de losas']
  ];

  function columnas(lbl) {
    return [
      { k: 'clave', l: 'Clave', t: 'text', ancho: 96, xlsAncho: 11 },
      { k: 'insumo', l: lbl, t: 'textarea', ancho: 300, xlsAncho: 40, ph: lbl },
      { k: 'unidad', l: 'Unidad', t: 'unidad', ancho: 76, xlsAncho: 9 },
      { k: 'cantidad', l: 'Cantidad requerida', t: 'num', ancho: 110, xlsAncho: 13 },
      { k: 'pu', l: 'Precio unitario', t: 'money', ancho: 116, xlsAncho: 14 },
      { k: 'importe', l: 'Importe', t: 'money', total: true, ancho: 130, xlsAncho: 16, calc: function (r) { return num(r.cantidad) * num(r.pu); }, formula: '{cantidad}*{pu}' },
      { k: 'part', l: '% del tipo', t: 'pct', ancho: 80, xlsAncho: 9, pctDe: 'importe' },
      { k: 'proveedor', l: 'Proveedor', t: 'text', ancho: 170, xlsAncho: 22 },
      { k: 'obs', l: 'Observaciones', t: 'textarea', ancho: 220, xlsAncho: 30 }
    ];
  }
  function tabla(key, titulo, lbl, fila) {
    return { tipo: 'tabla', key: key, titulo: titulo, totalLabel: 'Total ' + titulo.toLowerCase(), filaLabel: fila, columnas: columnas(lbl),
      filaNueva: function () { return { clave: '', insumo: '', unidad: '', cantidad: '', pu: '', proveedor: '', obs: '' }; } };
  }

  /* Insumos de mayor peso (análisis ABC) */
  function top(c) {
    var total = c.v('tot'), lst = [];
    TABLAS.forEach(function (t) {
      var f = c.comp.t[t] ? c.comp.t[t].f : {};
      (c.data.tablas[t] || []).forEach(function (r) { var v = num(f[r.id] && f[r.id].importe); if (v > 0) lst.push({ n: r.insumo || r.clave || 'Sin nombre', v: v }); });
    });
    if (!total || !lst.length) return 'Captura cantidades y precios para ver los insumos de mayor peso.';
    lst.sort(function (a, b) { return b.v - a.v; });
    var acum = 0;
    return lst.slice(0, 5).map(function (x, i) { acum += x.v; return (i + 1) + '. ' + x.n + ' — ' + U.fmtPct(x.v / total, 1); }).join('   ·   ') +
      '   (juntos suman ' + U.fmtPct(acum / total, 1) + ' del total)';
  }
  function share(id) { return function (c) { var t = c.v('tot'); return t ? c.v(id) / t : 0; }; }
  function contar(c) { var n = 0; TABLAS.forEach(function (t) { (c.data.tablas[t] || []).forEach(function (r) { if (num(r.cantidad) > 0) n++; }); }); return n; }

  ImfraPlantillas.registrar({
    id: 'explosion-insumos',
    version: 1,
    hoja: 'Explosión de insumos',
    secciones: [
      { tipo: 'campos', titulo: 'Datos de la obra', campos: [
        { k: 'obra', l: 'Obra / proyecto', w: 2 },
        { k: 'cliente', l: 'Cliente', w: 2 },
        { k: 'ubicacion', l: 'Ubicación', w: 2 },
        { k: 'presupuesto', l: 'Presupuesto de referencia', ph: 'PRE-2026-001' },
        { k: 'fecha', l: 'Fecha', t: 'date' },
        { k: 'responsable', l: 'Elaboró', w: 2 },
        { k: 'reviso', l: 'Revisó (compras)', w: 2 }
      ]},
      tabla('materiales', 'Materiales', 'Material', 'Material'),
      tabla('manoobra', 'Mano de obra', 'Categoría', 'Categoría'),
      tabla('maquinaria', 'Maquinaria y equipo', 'Equipo', 'Equipo'),
      { tipo: 'resumen', titulo: 'Participación por tipo de insumo', vista: 'kpis', items: [
        { id: 'mat', l: 'Materiales', t: 'money', calc: function (c) { return c.tot('materiales', 'importe'); }, xls: function (X) { return X.total('materiales', 'importe'); }, pct: share('mat') },
        { id: 'mo', l: 'Mano de obra', t: 'money', calc: function (c) { return c.tot('manoobra', 'importe'); }, xls: function (X) { return X.total('manoobra', 'importe'); }, pct: share('mo') },
        { id: 'maq', l: 'Maquinaria y equipo', t: 'money', calc: function (c) { return c.tot('maquinaria', 'importe'); }, xls: function (X) { return X.total('maquinaria', 'importe'); }, pct: share('maq') }
      ]},
      { tipo: 'resumen', titulo: 'Resumen de insumos', items: [
        { id: 'tot', l: 'Total de insumos', t: 'money', calc: function (c) { return c.v('mat') + c.v('mo') + c.v('maq'); }, xls: function (X) { return X.id('mat') + '+' + X.id('mo') + '+' + X.id('maq'); } },
        { id: 'compras', l: 'Compras gravables (materiales + equipo)', t: 'money', calc: function (c) { return c.v('mat') + c.v('maq'); }, xls: function (X) { return X.id('mat') + '+' + X.id('maq'); } },
        { id: 'iva', l: 'IVA de compras', t: 'money', param: { k: 'iva', suf: '%' }, calc: function (c) { return c.v('compras') * c.p('iva') / 100; }, xls: function (X) { return X.id('compras') + '*' + X.param('iva'); } },
        { id: 'flujo', l: 'Flujo total requerido', t: 'money', destacado: true, calc: function (c) { return c.v('tot') + c.v('iva'); }, xls: function (X) { return X.id('tot') + '+' + X.id('iva'); } },
        { id: 'kTot', l: 'Flujo total requerido', t: 'money', kpi: true, calc: function (c) { return c.v('flujo'); } },
        { id: 'kN', l: 'Insumos con cantidad', t: 'num', dec: 0, kpi: true, calc: contar },
        { id: 'top', l: 'Insumos de mayor peso', t: 'texto', calc: top }
      ]},
      { tipo: 'campos', titulo: 'Observaciones', campos: [
        { k: 'notas', l: 'Notas para compras y almacén', t: 'textarea' }
      ]}
    ],
    firmas: [{ l: 'Elaboró', k: 'responsable' }, { l: 'Revisó (compras)', k: 'reviso' }, { l: 'Autorizó', k: 'autorizo' }],
    nuevo: function (ej) {
      return {
        campos: ej ? {
          obra: 'Casa habitación de 2 niveles, 3 recámaras', cliente: 'Familia López Hernández', ubicacion: 'Calle Reforma 214, Col. Centro, Tehuacán, Puebla',
          presupuesto: 'PRE-2026-001', fecha: U.hoyISO(), responsable: 'Ing. Carlos Méndez Ruiz', reviso: '',
          notas: 'Cantidades obtenidas de los análisis de precios unitarios del presupuesto. Confirmar existencias antes de cada pedido y programar el acero y el concreto con una semana de anticipación.'
        } : { fecha: U.hoyISO() },
        params: { iva: 16 },
        tablas: ej ? { materiales: MAT.map(fila), manoobra: MO.map(fila), maquinaria: MAQ.map(fila) }
          : { materiales: [vacia(), vacia(), vacia()], manoobra: [vacia(), vacia()], maquinaria: [vacia()] }
      };
    }
  });
})();
