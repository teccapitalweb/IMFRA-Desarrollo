/* =========================================================
   Plantilla 02 · PRESUPUESTO DE REMODELACIÓN
   Estructura: Zona intervenida (partida) > Especialidad (subpartida) > Concepto
   Cada concepto separa P.U. de material y de mano de obra.
   Precios de referencia 2026 (MXN)
   ========================================================= */
(function () {
  var U = ImfraPlantillas.util, num = U.num;

  var ESP = [
    { id: 'eDem', k: 'dem', l: 'Demoliciones' },
    { id: 'eAlb', k: 'alb', l: 'Albañilería' },
    { id: 'eIns', k: 'ins', l: 'Instalaciones' },
    { id: 'eAca', k: 'aca', l: 'Acabados' },
    { id: 'eOtr', k: 'otr', l: 'Otros / obra general' }
  ];
  function especialidad(txt) {
    var t = String(txt || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
    if (/DEMOLIC|DESMANTEL|DESMONTAJ|RETIRO/.test(t)) return 'dem';
    if (/ALBANIL/.test(t)) return 'alb';
    if (/INSTALAC|HIDRAUL|SANITAR|ELECTRIC|GAS/.test(t)) return 'ins';
    if (/ACABADO|RECUBRIM|PINTURA|CANCEL|CARPINT/.test(t)) return 'aca';
    return 'otr';
  }
  /* Suma el importe de los conceptos según la especialidad de su subpartida.
     Conceptos sin subpartida cuentan como "Otros". */
  function porEspecialidad(c, clave) {
    var rows = c.data.tablas.conceptos || [], f = c.comp.t.conceptos.f, cur = 'otr', tot = 0;
    rows.forEach(function (r) {
      if (r._t === 'p') cur = 'otr';
      else if (r._t === 's') cur = especialidad(r.concepto);
      else if (cur === clave) tot += num(f[r.id] && f[r.id].importe);
    });
    return tot;
  }

  // [clave, tipo, texto, unidad, cantidad, puMat, puMO]
  var EJEMPLO = [
    ['01', 'p', 'Cocina'],
    ['01.01', 's', 'Demoliciones'],
    ['01.01.001', 'c', 'Demolición de azulejo en muros con cincel y marro, incluye limpieza de superficie y acarreo a pie de obra.', 'm2', 16, 0, 70],
    ['01.01.002', 'c', 'Demolición de piso cerámico existente incluyendo capa de mortero, hasta llegar a firme.', 'm2', 12, 0, 95],
    ['01.01.003', 'c', 'Desmontaje de cocina integral existente (gabinetes, tarja y parrilla) sin recuperación.', 'lote', 1, 0, 1800],
    ['01.01.004', 'c', 'Acarreo de escombro en camioneta de 3.5 t a tiro autorizado, incluye carga manual.', 'viaje', 2, 0, 1500],
    ['01.02', 's', 'Albañilería'],
    ['01.02.001', 'c', 'Nivelación de piso con mortero cemento-arena 1:4 de 3 cm de espesor promedio.', 'm2', 12, 95, 110],
    ['01.02.002', 'c', 'Ranurado de muros para instalaciones y resane con mortero.', 'ml', 18, 15, 55],
    ['01.02.003', 'c', 'Aplanado fino en muros con mortero cemento-arena 1:5 a plomo y regla.', 'm2', 14, 60, 115],
    ['01.03', 's', 'Instalaciones'],
    ['01.03.001', 'c', 'Salida hidráulica con tubería de CPVC de 1/2" para tarja y refrigerador, incluye conexiones y prueba.', 'sal', 3, 520, 650],
    ['01.03.002', 'c', 'Salida sanitaria con tubería de PVC de 2", incluye conexiones y céspol.', 'sal', 2, 380, 550],
    ['01.03.003', 'c', 'Salida eléctrica para contacto dúplex 20 A con poliducto y cable THW cal. 12.', 'sal', 5, 290, 330],
    ['01.03.004', 'c', 'Salida eléctrica para campana y luminaria de techo, incluye apagador.', 'sal', 3, 260, 330],
    ['01.04', 's', 'Acabados'],
    ['01.04.001', 'c', 'Piso porcelánico rectificado de 60x60 cm asentado con adhesivo, incluye boquilla y cortes.', 'm2', 12, 420, 190],
    ['01.04.002', 'c', 'Azulejo en salpicadero de cocina asentado con adhesivo, incluye boquilla.', 'm2', 5, 380, 220],
    ['01.04.003', 'c', 'Cubierta de cuarzo de 2 cm con zoclo, incluye cortes para tarja y parrilla.', 'ml', 4.2, 6200, 900],
    ['01.04.004', 'c', 'Cocina integral de MDF 16 mm (alacena y bajo cubierta) con herrajes de cierre lento.', 'ml', 4.2, 8500, 1500],
    ['01.04.005', 'c', 'Pintura vinílica en muros y plafón, dos manos, incluye sellador.', 'm2', 30, 32, 40],
    ['02', 'p', 'Baño principal'],
    ['02.01', 's', 'Demoliciones'],
    ['02.01.001', 'c', 'Demolición de azulejo en muros de baño, incluye limpieza de superficie.', 'm2', 22, 0, 70],
    ['02.01.002', 'c', 'Demolición de piso cerámico en baño incluyendo mortero de asiento.', 'm2', 5, 0, 95],
    ['02.01.003', 'c', 'Retiro de muebles sanitarios existentes (WC, lavabo y regadera).', 'pza', 3, 0, 280],
    ['02.02', 's', 'Albañilería'],
    ['02.02.001', 'c', 'Impermeabilización cementosa flexible en piso y muros de regadera, dos capas con malla.', 'm2', 7, 220, 150],
    ['02.02.002', 'c', 'Aplanado y plomeo de muros para recibir azulejo.', 'm2', 22, 55, 105],
    ['02.03', 's', 'Instalaciones'],
    ['02.03.001', 'c', 'Sustitución de red hidráulica del baño con PPR de 1/2", incluye llaves de paso y prueba de presión.', 'lote', 1, 3200, 2800],
    ['02.03.002', 'c', 'Salida sanitaria para WC con tubería de PVC de 4" y conexiones.', 'sal', 1, 650, 700],
    ['02.03.003', 'c', 'Salida eléctrica para contacto, luminaria y extractor.', 'sal', 3, 290, 330],
    ['02.03.004', 'c', 'Suministro e instalación de extractor de baño con ducto a exterior.', 'pza', 1, 1250, 450],
    ['02.04', 's', 'Acabados'],
    ['02.04.001', 'c', 'Azulejo en muros de baño asentado con adhesivo, incluye boquilla y esquineros.', 'm2', 22, 360, 230],
    ['02.04.002', 'c', 'Piso porcelánico antiderrapante asentado con adhesivo, incluye boquilla.', 'm2', 5, 430, 210],
    ['02.04.003', 'c', 'WC de una pieza ahorrador, incluye cuello de cera, manguera y llave angular.', 'pza', 1, 4200, 650],
    ['02.04.004', 'c', 'Mueble de baño con lavabo y monomando, incluye céspol y conexiones.', 'pza', 1, 5800, 750],
    ['02.04.005', 'c', 'Cancel de cristal templado de 9 mm con herrajes de acero inoxidable.', 'm2', 3.2, 2900, 600],
    ['02.04.006', 'c', 'Regadera monomando empotrada con salida de lluvia.', 'jgo', 1, 3400, 800],
    ['02.04.007', 'c', 'Accesorios de baño (toallero, portarrollo y jabonera).', 'jgo', 1, 1100, 250],
    ['03', 'p', 'Sala-comedor'],
    ['03.01', 's', 'Demoliciones'],
    ['03.01.001', 'c', 'Retiro de piso laminado existente incluyendo zoclo y bajo piso.', 'm2', 28, 0, 45],
    ['03.02', 's', 'Albañilería'],
    ['03.02.001', 'c', 'Resane de muros y plafón con pasta, incluye lijado y preparación para pintura.', 'm2', 40, 18, 45],
    ['03.03', 's', 'Instalaciones'],
    ['03.03.001', 'c', 'Suministro y colocación de luminaria LED empotrable de 18 W.', 'pza', 6, 380, 180],
    ['03.04', 's', 'Acabados'],
    ['03.04.001', 'c', 'Piso laminado de 8 mm AC4 con bajo piso y zoclo, incluye cortes y remates.', 'm2', 28, 360, 120],
    ['03.04.002', 'c', 'Plafón de tablaroca con cajillo para iluminación indirecta, incluye pasta y acabado.', 'm2', 10, 280, 260],
    ['03.04.003', 'c', 'Pintura vinílica en muros y plafón, dos manos, incluye sellador.', 'm2', 95, 32, 40],
    ['04', 'p', 'Obra general'],
    ['04.01', 's', 'Protección y limpieza'],
    ['04.01.001', 'c', 'Protección de pisos, muebles y áreas no intervenidas con cartón y plástico durante la obra.', 'm2', 60, 22, 15],
    ['04.01.002', 'c', 'Limpieza fina final y entrega de áreas remodeladas.', 'lote', 1, 400, 1800]
  ];
  var ESTRUCTURA = ['Cocina', 'Baño', 'Recámara'];
  var ESPS = ['Demoliciones', 'Albañilería', 'Instalaciones', 'Acabados'];

  var NOTAS = '1. Precios en moneda nacional (MXN). Materiales y mano de obra se desglosan por concepto.\n' +
    '2. Incluye retiro de escombro generado por la remodelación y protección de áreas no intervenidas.\n' +
    '3. No incluye: vicios ocultos detectados durante demoliciones (tubería o cableado dañado, humedad, fisuras), los cuales se cotizarán por separado.\n' +
    '4. Muebles y acabados de marca/modelo específico elegidos por el cliente pueden modificar el importe de materiales.\n' +
    '5. Horario de trabajo sujeto al reglamento del condominio o fraccionamiento.';

  function filas(ejemplo) {
    if (ejemplo) return EJEMPLO.map(function (e) {
      var r = { id: U.nid(), _t: e[1], clave: e[0], concepto: e[2] };
      if (e[1] === 'c') { r.unidad = e[3]; r.cantidad = e[4]; r.puMat = e[5]; r.puMO = e[6]; }
      return r;
    });
    var out = [];
    ESTRUCTURA.forEach(function (z, i) {
      var pz = String(i + 1).padStart(2, '0');
      out.push({ id: U.nid(), _t: 'p', clave: pz, concepto: z });
      ESPS.forEach(function (e, j) {
        var sz = pz + '.' + String(j + 1).padStart(2, '0');
        out.push({ id: U.nid(), _t: 's', clave: sz, concepto: e });
        out.push({ id: U.nid(), _t: 'c', clave: sz + '.001', concepto: '', unidad: '', cantidad: '', puMat: '', puMO: '' });
      });
    });
    return out;
  }

  var espItems = ESP.map(function (e) {
    var it = {
      id: e.id, l: e.l, t: 'money',
      calc: function (c) { return porEspecialidad(c, e.k); },
      pct: function (c) { var cd = c.tot('conceptos', 'importe'); return cd ? c.v(e.id) / cd : 0; }
    };
    if (e.k === 'otr') {
      it.xls = function (R) { return R.total('conceptos', 'importe') + '-' + ['eDem', 'eAlb', 'eIns', 'eAca'].map(R.id).join('-'); };
    } else {
      it.xls = function (R) { return R.filas('conceptos', 'importe', function (r) { return r._t === 's' && especialidad(r.concepto) === e.k; }); };
    }
    return it;
  });

  ImfraPlantillas.registrar({
    id: 'remodelacion',
    version: 1,
    hoja: 'Remodelación',
    secciones: [
      { tipo: 'campos', titulo: 'Datos generales de la remodelación', campos: [
        { k: 'proyecto', l: 'Proyecto / obra', w: 2, ph: 'Remodelación de cocina y baño' },
        { k: 'cliente', l: 'Cliente', w: 2 },
        { k: 'ubicacion', l: 'Ubicación del inmueble', w: 2, ph: 'Calle, número, colonia, municipio' },
        { k: 'inmueble', l: 'Tipo de inmueble', t: 'select', op: ['Casa habitación', 'Departamento', 'Local comercial', 'Oficina', 'Consultorio', 'Otro'] },
        { k: 'habitado', l: '¿Habitado durante la obra?', t: 'select', op: ['Sí', 'No'] },
        { k: 'zonas', l: 'Áreas o zonas intervenidas', w: 2, ph: 'Cocina, baño principal, sala-comedor' },
        { k: 'superficie', l: 'Superficie intervenida (m²)', t: 'number' },
        { k: 'folio', l: 'No. de presupuesto', ph: 'REM-001' },
        { k: 'responsable', l: 'Responsable (elaboró)', ph: 'Ing. / Arq.' },
        { k: 'fecha', l: 'Fecha', t: 'date' },
        { k: 'plazo', l: 'Plazo de ejecución', ph: '6 semanas' },
        { k: 'vigencia', l: 'Vigencia de la cotización', ph: '15 días naturales' },
        { k: 'reviso', l: 'Revisó', w: 2 }
      ]},
      { tipo: 'tabla', key: 'conceptos', titulo: 'Conceptos por zona y especialidad', totalLabel: 'Costo directo',
        niveles: { texto: 'concepto', sumar: ['impMat', 'impMO', 'importe'] },
        filaNueva: function (t) { return t === 'c' ? { clave: '', concepto: '', unidad: '', cantidad: '', puMat: '', puMO: '' } : { clave: '', concepto: '' }; },
        columnas: [
          { k: 'clave', l: 'Clave', t: 'text', ancho: 104, xlsAncho: 11 },
          { k: 'concepto', l: 'Concepto', t: 'textarea', ancho: 330, xlsAncho: 50, ph: 'Descripción del concepto' },
          { k: 'unidad', l: 'Unidad', t: 'unidad', ancho: 80, xlsAncho: 8 },
          { k: 'cantidad', l: 'Cantidad', t: 'num', ancho: 88, xlsAncho: 10 },
          { k: 'puMat', l: 'P.U. material', t: 'money', ancho: 108, xlsAncho: 13 },
          { k: 'puMO', l: 'P.U. mano de obra', t: 'money', ancho: 108, xlsAncho: 13 },
          { k: 'impMat', l: 'Materiales', t: 'money', ancho: 120, xlsAncho: 14, calc: function (r) { return num(r.cantidad) * num(r.puMat); }, formula: '{cantidad}*{puMat}' },
          { k: 'impMO', l: 'Mano de obra', t: 'money', ancho: 120, xlsAncho: 14, calc: function (r) { return num(r.cantidad) * num(r.puMO); }, formula: '{cantidad}*{puMO}' },
          { k: 'importe', l: 'Importe', t: 'money', ancho: 130, xlsAncho: 15, calc: function (r, o) { return o.impMat + o.impMO; }, formula: '{impMat}+{impMO}' },
          { k: 'inc', l: '% Inc.', t: 'pct', ancho: 70, xlsAncho: 8, pctDe: 'importe' }
        ]
      },
      { tipo: 'resumen', titulo: 'Costo por especialidad', vista: 'kpis', items: espItems },
      { tipo: 'resumen', titulo: 'Total del proyecto', items: [
        { id: 'mat', l: 'Materiales', t: 'money', calc: function (c) { return c.tot('conceptos', 'impMat'); }, xls: function (R) { return R.total('conceptos', 'impMat'); } },
        { id: 'mo', l: 'Mano de obra', t: 'money', calc: function (c) { return c.tot('conceptos', 'impMO'); }, xls: function (R) { return R.total('conceptos', 'impMO'); } },
        { id: 'cd', l: 'Costo directo', t: 'money', calc: function (c) { return c.tot('conceptos', 'importe'); }, xls: function (R) { return R.total('conceptos', 'importe'); } },
        { id: 'ind', l: 'Indirectos', t: 'money', param: { k: 'indirectos', suf: '%' }, calc: function (c) { return c.v('cd') * c.p('indirectos') / 100; }, xls: function (R) { return R.id('cd') + '*' + R.param('indirectos'); } },
        { id: 'uti', l: 'Utilidad', t: 'money', param: { k: 'utilidad', suf: '%' }, calc: function (c) { return (c.v('cd') + c.v('ind')) * c.p('utilidad') / 100; }, xls: function (R) { return '(' + R.id('cd') + '+' + R.id('ind') + ')*' + R.param('utilidad'); } },
        { id: 'sub', l: 'Subtotal', t: 'money', calc: function (c) { return c.v('cd') + c.v('ind') + c.v('uti'); }, xls: function (R) { return R.id('cd') + '+' + R.id('ind') + '+' + R.id('uti'); } },
        { id: 'iva', l: 'IVA', t: 'money', param: { k: 'iva', suf: '%' }, calc: function (c) { return c.v('sub') * c.p('iva') / 100; }, xls: function (R) { return R.id('sub') + '*' + R.param('iva'); } },
        { id: 'total', l: 'Total del proyecto', t: 'money', destacado: true, calc: function (c) { return c.v('sub') + c.v('iva'); }, xls: function (R) { return R.id('sub') + '+' + R.id('iva'); } },
        { id: 'm2', l: 'Costo por m² intervenido', t: 'money', calc: function (c) { var s = num(c.campo('superficie')); return s ? c.v('total') / s : 0; }, xls: function (R) { return 'IFERROR(' + R.id('total') + '/' + R.campo('superficie') + ',0)'; } },
        { id: 'kTotal', l: 'Total del proyecto', t: 'money', kpi: true, calc: function (c) { return c.v('total'); } },
        { id: 'kM2', l: 'Costo por m² intervenido', t: 'money', kpi: true, calc: function (c) { return c.v('m2'); } },
        { id: 'kMat', l: 'Materiales / costo directo', t: 'pct', kpi: true, calc: function (c) { return c.v('cd') ? c.v('mat') / c.v('cd') : 0; } },
        { id: 'kMO', l: 'Mano de obra / costo directo', t: 'pct', kpi: true, calc: function (c) { return c.v('cd') ? c.v('mo') / c.v('cd') : 0; } },
        { id: 'letra', l: 'Total del proyecto con letra', t: 'letra', calc: function (c) { return U.numeroALetras(c.v('total')); } }
      ]},
      { tipo: 'campos', titulo: 'Condiciones y alcances', campos: [
        { k: 'notas', l: 'Notas, alcances y exclusiones', t: 'textarea' }
      ]}
    ],
    firmas: [{ l: 'Elaboró', k: 'responsable' }, { l: 'Revisó', k: 'reviso' }, { l: 'Autorizó (cliente)', k: 'cliente' }],
    nuevo: function (ejemplo) {
      return {
        campos: ejemplo ? {
          proyecto: 'Remodelación de cocina, baño principal y sala-comedor', cliente: 'Ing. Alejandra Ruiz Campos', ubicacion: 'Priv. Los Pinos 18, Fracc. Las Flores, Tehuacán, Puebla',
          inmueble: 'Casa habitación', habitado: 'Sí', zonas: 'Cocina, baño principal y sala-comedor', superficie: 45, folio: 'REM-2026-014',
          responsable: 'Arq. Daniela Torres Vega', fecha: U.hoyISO(), plazo: '6 semanas', vigencia: '15 días naturales', reviso: '', notas: NOTAS
        } : { inmueble: 'Casa habitación', habitado: 'Sí', fecha: U.hoyISO(), vigencia: '15 días naturales', notas: NOTAS },
        params: { indirectos: 12, utilidad: 10, iva: 16 },
        tablas: { conceptos: filas(ejemplo) }
      };
    }
  });
})();
