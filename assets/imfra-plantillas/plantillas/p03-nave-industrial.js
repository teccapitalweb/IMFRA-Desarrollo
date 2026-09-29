/* =========================================================
   Plantilla 03 · PRESUPUESTO DE NAVE INDUSTRIAL
   Partidas: Preliminares, Cimentación, Estructura, Cubierta,
   Instalaciones, Pisos y Acabados.
   Indicadores: superficie, costo por m² y kg de acero por m².
   Precios de referencia 2026 (MXN, P.U. con material y mano de obra)
   ========================================================= */
(function () {
  var U = ImfraPlantillas.util, num = U.num;

  // [clave, tipo, texto, unidad, cantidad, pu]
  var EJEMPLO = [
    ['01', 'p', 'Preliminares'],
    ['01.01', 's', 'Trabajos preliminares'],
    ['01.01.001', 'c', 'Limpieza y despalme de terreno con maquinaria en espesor de 20 cm, incluye carga y acarreo fuera de obra.', 'm2', 1800, 28],
    ['01.01.002', 'c', 'Trazo y nivelación con estación total para ejes de columnas, niveles de desplante y bancos de nivel.', 'm2', 1500, 9.5],
    ['01.01.003', 'c', 'Oficina y bodega provisional de obra, incluye sanitario portátil y servicio de limpieza.', 'mes', 5, 18500],
    ['01.02', 's', 'Terracerías'],
    ['01.02.001', 'c', 'Excavación con retroexcavadora en material tipo II para zapatas y contratrabes, incluye afine.', 'm3', 420, 145],
    ['01.02.002', 'c', 'Plataforma con material de banco (tepetate) compactado en capas de 20 cm al 95% Proctor, incluye suministro.', 'm3', 900, 480],
    ['01.02.003', 'c', 'Carga y acarreo de material producto de excavación fuera de obra en camión de 14 m³.', 'm3', 420, 165],
    ['02', 'p', 'Cimentación'],
    ['02.01', 's', 'Zapatas, dados y anclas'],
    ['02.01.001', 'c', 'Plantilla de concreto f\'c=100 kg/cm² de 5 cm de espesor.', 'm2', 260, 170],
    ['02.01.002', 'c', 'Zapata aislada de concreto premezclado f\'c=250 kg/cm², incluye acero de refuerzo, cimbra, colado y vibrado.', 'm3', 120, 5200],
    ['02.01.003', 'c', 'Dado de concreto f\'c=250 kg/cm² para anclaje de columna, incluye acero y cimbra aparente.', 'm3', 14, 6800],
    ['02.01.004', 'c', 'Juego de anclas de acero A-36 de 1" con placa, tuercas y rondanas, colocadas con plantilla metálica.', 'jgo', 34, 3900],
    ['02.02', 's', 'Contratrabes'],
    ['02.02.001', 'c', 'Contratrabe de liga de 30x60 cm, concreto f\'c=250 kg/cm², incluye acero de refuerzo y cimbra.', 'ml', 320, 2350],
    ['03', 'p', 'Estructura'],
    ['03.01', 's', 'Estructura metálica principal'],
    ['03.01.001', 'c', 'Suministro, fabricación y montaje de columnas de acero A-572 Gr. 50 perfil IR, incluye primario.', 'kg', 16000, 58],
    ['03.01.002', 'c', 'Suministro, fabricación y montaje de trabes para marcos rígidos de acero A-572 Gr. 50, incluye primario.', 'kg', 26000, 58],
    ['03.01.003', 'c', 'Placas base, cartabones y conexiones con tornillería de alta resistencia A-325.', 'kg', 3200, 68],
    ['03.02', 's', 'Estructura secundaria'],
    ['03.02.001', 'c', 'Largueros de lámina galvanizada tipo polín monten de 10" cal. 12 para cubierta y fachadas.', 'kg', 9500, 52],
    ['03.02.002', 'c', 'Contraventeos de cubierta y muros con redondo liso y tensores.', 'kg', 1800, 60],
    ['03.02.003', 'c', 'Esmalte alquidálico en estructura principal, dos manos, sobre primario anticorrosivo.', 'm2', 1900, 95],
    ['04', 'p', 'Cubierta'],
    ['04.01', 's', 'Cubierta y fachadas'],
    ['04.01.001', 'c', 'Lámina galvanizada pintada KR-18 cal. 24 en cubierta, incluye tornillería autotaladrante y sellos.', 'm2', 1560, 380],
    ['04.01.002', 'c', 'Lámina traslúcida de fibra de vidrio para iluminación natural en cubierta.', 'm2', 150, 520],
    ['04.01.003', 'c', 'Lámina R-101 cal. 26 pintada en muros perimetrales, incluye tapajuntas y remates.', 'm2', 1050, 330],
    ['04.02', 's', 'Desagüe pluvial y ventilación'],
    ['04.02.001', 'c', 'Canalón de lámina galvanizada cal. 22 con desarrollo de 90 cm, incluye soportes.', 'ml', 100, 780],
    ['04.02.002', 'c', 'Bajada pluvial de PVC de 6" con abrazaderas y codos.', 'ml', 90, 420],
    ['04.02.003', 'c', 'Extractor eólico de 24" instalado en cubierta con base y sellado.', 'pza', 10, 3600],
    ['05', 'p', 'Instalaciones'],
    ['05.01', 's', 'Instalación eléctrica'],
    ['05.01.001', 'c', 'Subestación eléctrica de 112.5 kVA en media tensión, incluye equipo, conexiones y pruebas.', 'lote', 1, 385000],
    ['05.01.002', 'c', 'Tablero general y circuitos derivados de alumbrado y fuerza, incluye canalización y cableado.', 'lote', 1, 145000],
    ['05.01.003', 'c', 'Luminaria LED tipo high bay de 150 W con soportería, cableado y control.', 'pza', 48, 4800],
    ['05.01.004', 'c', 'Salida para contacto industrial y fuerza, incluye caja, canalización y cableado.', 'sal', 24, 2100],
    ['05.01.005', 'c', 'Sistema de pararrayos y red de tierras físicas con varillas copperweld y registros.', 'lote', 1, 68000],
    ['05.02', 's', 'Hidrosanitaria y protección contra incendio'],
    ['05.02.001', 'c', 'Red hidráulica con tubería de polipropileno, incluye conexiones y pruebas.', 'ml', 120, 380],
    ['05.02.002', 'c', 'Red sanitaria y pluvial exterior con tubería de PVC de 6".', 'ml', 150, 520],
    ['05.02.003', 'c', 'Registro de 60x80 cm de tabique con tapa de concreto y marco metálico.', 'pza', 8, 3200],
    ['05.02.004', 'c', 'Gabinete contra incendio con manguera de 30 m, válvula angular y extintor.', 'pza', 4, 18500],
    ['05.02.005', 'c', 'Extintor PQS de 9 kg con señalización según NOM-002-STPS.', 'pza', 12, 1650],
    ['06', 'p', 'Pisos'],
    ['06.01', 's', 'Piso industrial y exteriores'],
    ['06.01.001', 'c', 'Piso industrial de concreto f\'c=250 kg/cm² de 15 cm armado con malla 6x6-6/6, pulido con endurecedor metálico.', 'm2', 1500, 690],
    ['06.01.002', 'c', 'Corte de juntas de control con disco y sellado con poliuretano autonivelante.', 'ml', 620, 95],
    ['06.01.003', 'c', 'Banqueta perimetral de concreto f\'c=150 kg/cm² de 10 cm de espesor.', 'm2', 180, 380],
    ['06.01.004', 'c', 'Rampa de acceso vehicular de concreto armado f\'c=250 kg/cm² de 15 cm.', 'm2', 90, 820],
    ['07', 'p', 'Acabados'],
    ['07.01', 's', 'Accesos, muros y señalización'],
    ['07.01.001', 'c', 'Cortina metálica enrollable de 5x6 m motorizada, incluye guías y control.', 'pza', 2, 68000],
    ['07.01.002', 'c', 'Puerta peatonal metálica de 1.00x2.10 m con barra antipánico.', 'pza', 3, 9500],
    ['07.01.003', 'c', 'Muro de block de 15 cm en zócalo perimetral de 1.20 m de altura, aplanado y pintado.', 'm2', 192, 520],
    ['07.01.004', 'c', 'Pintura de tráfico para señalización de pasillos y áreas en piso.', 'ml', 400, 45],
    ['07.01.005', 'c', 'Limpieza general de obra y entrega de la nave.', 'm2', 1500, 28]
  ];
  var ESTRUCTURA = ['Preliminares', 'Cimentación', 'Estructura', 'Cubierta', 'Instalaciones', 'Pisos', 'Acabados'];

  var NOTAS = '1. Precios en moneda nacional (MXN); incluyen materiales, mano de obra, maquinaria y equipo.\n' +
    '2. El precio del acero estructural está sujeto a variación del mercado; se ajustará si cambia más de 5% entre la cotización y la compra.\n' +
    '3. No incluye: estudio de mecánica de suelos, proyecto y memoria de cálculo estructural, trámites ante CFE, licencias ni permisos.\n' +
    '4. No incluye maquinaria de proceso, racks, oficinas interiores ni obras exteriores no descritas.\n' +
    '5. Cantidades basadas en anteproyecto; se ajustarán con el proyecto ejecutivo definitivo.';

  function filas(ejemplo) {
    if (ejemplo) return EJEMPLO.map(function (e) {
      var r = { id: U.nid(), _t: e[1], clave: e[0], concepto: e[2] };
      if (e[1] === 'c') { r.unidad = e[3]; r.cantidad = e[4]; r.pu = e[5]; }
      return r;
    });
    var out = [];
    ESTRUCTURA.forEach(function (p, i) {
      var pp = String(i + 1).padStart(2, '0');
      out.push({ id: U.nid(), _t: 'p', clave: pp, concepto: p });
      out.push({ id: U.nid(), _t: 'c', clave: pp + '.001', concepto: '', unidad: '', cantidad: '', pu: '' });
    });
    return out;
  }

  /* Filas de acero: conceptos en kg dentro de la partida "Estructura" */
  function esAcero(rows) {
    var ids = {}, enEst = false;
    rows.forEach(function (r) {
      if (r._t === 'p') enEst = /ESTRUCTUR/i.test(String(r.concepto || '').normalize('NFD').replace(/[̀-ͯ]/g, ''));
      else if (r._t === 'c' && enEst && /^kg$/i.test(String(r.unidad || '').trim())) ids[r.id] = true;
    });
    return ids;
  }
  function superficie(c) { return num(c.campo('largo')) * num(c.campo('ancho')); }

  ImfraPlantillas.registrar({
    id: 'nave-industrial',
    version: 1,
    hoja: 'Nave industrial',
    secciones: [
      { tipo: 'campos', titulo: 'Datos generales del proyecto', campos: [
        { k: 'proyecto', l: 'Proyecto / obra', w: 2, ph: 'Nave industrial para almacén' },
        { k: 'cliente', l: 'Cliente', w: 2 },
        { k: 'ubicacion', l: 'Ubicación', w: 2, ph: 'Parque industrial, lote, municipio, estado' },
        { k: 'uso', l: 'Uso de la nave', w: 2, t: 'select', op: ['Almacén / centro de distribución', 'Manufactura', 'Agroindustrial', 'Taller de mantenimiento', 'Comercial', 'Otro'] },
        { k: 'folio', l: 'No. de presupuesto', ph: 'NAV-001' },
        { k: 'largo', l: 'Largo (m)', t: 'number' },
        { k: 'ancho', l: 'Ancho / claro (m)', t: 'number' },
        { k: 'altura', l: 'Altura libre (m)', t: 'number' },
        { k: 'estructura', l: 'Sistema estructural', w: 2, t: 'select', op: ['Marcos rígidos de acero', 'Armaduras de acero', 'Estructura prefabricada de concreto', 'Mixta (concreto y acero)'] },
        { k: 'cubierta', l: 'Tipo de cubierta', w: 2, t: 'select', op: ['Lámina galvanizada pintada KR-18', 'Lámina con aislamiento (panel sándwich)', 'Losacero', 'Techo engargolado (standing seam)'] },
        { k: 'pisoCarga', l: 'Carga de diseño del piso (ton/m²)', t: 'number' },
        { k: 'responsable', l: 'Responsable (elaboró)' },
        { k: 'fecha', l: 'Fecha', t: 'date' },
        { k: 'plazo', l: 'Plazo de ejecución', ph: '20 semanas' },
        { k: 'vigencia', l: 'Vigencia de la cotización', ph: '15 días naturales' },
        { k: 'reviso', l: 'Revisó', w: 2 }
      ]},
      { tipo: 'tabla', key: 'conceptos', titulo: 'Catálogo de conceptos', totalLabel: 'Costo directo',
        niveles: { texto: 'concepto', sumar: ['importe'] },
        filaNueva: function (t) { return t === 'c' ? { clave: '', concepto: '', unidad: '', cantidad: '', pu: '' } : { clave: '', concepto: '' }; },
        columnas: [
          { k: 'clave', l: 'Clave', t: 'text', ancho: 104, xlsAncho: 12 },
          { k: 'concepto', l: 'Concepto', t: 'textarea', ancho: 420, xlsAncho: 62, ph: 'Descripción del concepto' },
          { k: 'unidad', l: 'Unidad', t: 'unidad', ancho: 80, xlsAncho: 9 },
          { k: 'cantidad', l: 'Cantidad', t: 'num', ancho: 110, xlsAncho: 13 },
          { k: 'pu', l: 'P.U.', t: 'money', ancho: 120, xlsAncho: 14 },
          { k: 'importe', l: 'Importe', t: 'money', ancho: 140, xlsAncho: 17, calc: function (r) { return num(r.cantidad) * num(r.pu); }, formula: '{cantidad}*{pu}' },
          { k: 'inc', l: '% Inc.', t: 'pct', ancho: 76, xlsAncho: 9, pctDe: 'importe' }
        ]
      },
      { tipo: 'resumen', titulo: 'Indicadores de la nave', vista: 'kpis', items: [
        { id: 'sup', l: 'Superficie de nave (m²)', t: 'num', dec: 0, calc: superficie, xls: function (R) { return R.campo('largo') + '*' + R.campo('ancho'); } },
        { id: 'acero', l: 'Acero estructural (kg)', t: 'num', dec: 0, calc: function (c) {
            var ids = esAcero(c.data.tablas.conceptos || []), t = 0;
            (c.data.tablas.conceptos || []).forEach(function (r) { if (ids[r.id]) t += num(r.cantidad); }); return t;
          }, xls: function (R) { var ids = esAcero(R.data.tablas.conceptos || []); return R.filas('conceptos', 'cantidad', function (r) { return !!ids[r.id]; }); } },
        { id: 'kgm2', l: 'Acero por m² (kg/m²)', t: 'num', dec: 1, calc: function (c) { var s = c.v('sup'); return s ? c.v('acero') / s : 0; }, xls: function (R) { return 'IFERROR(' + R.id('acero') + '/' + R.id('sup') + ',0)'; } },
        { id: 'cdm2', l: 'Costo directo por m²', t: 'money', calc: function (c) { var s = c.v('sup'); return s ? c.tot('conceptos', 'importe') / s : 0; }, xls: function (R) { return 'IFERROR(' + R.total('conceptos', 'importe') + '/' + R.id('sup') + ',0)'; } }
      ]},
      { tipo: 'resumen', titulo: 'Resumen del presupuesto', items: [
        { id: 'cd', l: 'Costo directo', t: 'money', calc: function (c) { return c.tot('conceptos', 'importe'); }, xls: function (R) { return R.total('conceptos', 'importe'); } },
        { id: 'ind', l: 'Indirectos', t: 'money', param: { k: 'indirectos', suf: '%' }, calc: function (c) { return c.v('cd') * c.p('indirectos') / 100; }, xls: function (R) { return R.id('cd') + '*' + R.param('indirectos'); } },
        { id: 'fin', l: 'Financiamiento', t: 'money', param: { k: 'financiamiento', suf: '%' }, calc: function (c) { return (c.v('cd') + c.v('ind')) * c.p('financiamiento') / 100; }, xls: function (R) { return '(' + R.id('cd') + '+' + R.id('ind') + ')*' + R.param('financiamiento'); } },
        { id: 'uti', l: 'Utilidad', t: 'money', param: { k: 'utilidad', suf: '%' }, calc: function (c) { return (c.v('cd') + c.v('ind') + c.v('fin')) * c.p('utilidad') / 100; }, xls: function (R) { return '(' + R.id('cd') + '+' + R.id('ind') + '+' + R.id('fin') + ')*' + R.param('utilidad'); } },
        { id: 'sub', l: 'Subtotal', t: 'money', calc: function (c) { return c.v('cd') + c.v('ind') + c.v('fin') + c.v('uti'); }, xls: function (R) { return R.id('cd') + '+' + R.id('ind') + '+' + R.id('fin') + '+' + R.id('uti'); } },
        { id: 'iva', l: 'IVA', t: 'money', param: { k: 'iva', suf: '%' }, calc: function (c) { return c.v('sub') * c.p('iva') / 100; }, xls: function (R) { return R.id('sub') + '*' + R.param('iva'); } },
        { id: 'total', l: 'Total', t: 'money', destacado: true, calc: function (c) { return c.v('sub') + c.v('iva'); }, xls: function (R) { return R.id('sub') + '+' + R.id('iva'); } },
        { id: 'm2', l: 'Costo total por m² de nave', t: 'money', calc: function (c) { var s = c.v('sup'); return s ? c.v('total') / s : 0; }, xls: function (R) { return 'IFERROR(' + R.id('total') + '/' + R.id('sup') + ',0)'; } },
        { id: 'kTotal', l: 'Total con IVA', t: 'money', kpi: true, calc: function (c) { return c.v('total'); } },
        { id: 'kM2', l: 'Costo total por m²', t: 'money', kpi: true, calc: function (c) { return c.v('m2'); } },
        { id: 'letra', l: 'Importe total con letra', t: 'letra', calc: function (c) { return U.numeroALetras(c.v('total')); } }
      ]},
      { tipo: 'campos', titulo: 'Condiciones y exclusiones', campos: [
        { k: 'notas', l: 'Notas, alcances y exclusiones', t: 'textarea' }
      ]}
    ],
    firmas: [{ l: 'Elaboró', k: 'responsable' }, { l: 'Revisó', k: 'reviso' }, { l: 'Autorizó (cliente)', k: 'cliente' }],
    nuevo: function (ejemplo) {
      return {
        campos: ejemplo ? {
          proyecto: 'Nave industrial de 1,500 m² para almacén', cliente: 'Distribuidora del Valle, S.A. de C.V.', ubicacion: 'Parque Industrial, Lote 12, Tehuacán, Puebla',
          uso: 'Almacén / centro de distribución', folio: 'NAV-2026-003', largo: 50, ancho: 30, altura: 9, pisoCarga: 5,
          estructura: 'Marcos rígidos de acero', cubierta: 'Lámina galvanizada pintada KR-18', responsable: 'Ing. Roberto Salas Méndez',
          fecha: U.hoyISO(), plazo: '20 semanas', vigencia: '15 días naturales', reviso: '', notas: NOTAS
        } : { uso: 'Almacén / centro de distribución', estructura: 'Marcos rígidos de acero', cubierta: 'Lámina galvanizada pintada KR-18', fecha: U.hoyISO(), vigencia: '15 días naturales', notas: NOTAS },
        params: { indirectos: 10, financiamiento: 1.5, utilidad: 8, iva: 16 },
        tablas: { conceptos: filas(ejemplo) }
      };
    }
  });
})();
