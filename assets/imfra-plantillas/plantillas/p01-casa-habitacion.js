/* =========================================================
   Plantilla 01 · PRESUPUESTO DE CASA HABITACIÓN
   Estructura: Partida > Subpartida > Concepto
   Precios de referencia 2026 (MXN, P.U. con material y mano de obra)
   ========================================================= */
(function () {
  var U = ImfraPlantillas.util, num = U.num;

  // [clave, tipo, texto, unidad, cantidad, pu]
  var EJEMPLO = [
    ['01', 'p', 'Preliminares'],
    ['01.01', 's', 'Limpieza y trazo'],
    ['01.01.001', 'c', 'Limpieza y desenraice de terreno con medios manuales, incluye retiro de maleza fuera de obra.', 'm2', 160, 18.5],
    ['01.01.002', 'c', 'Trazo y nivelación con equipo topográfico, estableciendo ejes, bancos de nivel y referencias.', 'm2', 95, 14.8],
    ['01.02', 's', 'Excavaciones y rellenos'],
    ['01.02.001', 'c', 'Excavación a mano en material tipo II, de 0.00 a -1.20 m de profundidad, incluye afine de taludes y fondo.', 'm3', 38.5, 245],
    ['01.02.002', 'c', 'Relleno compactado con material producto de excavación en capas de 20 cm al 90% Proctor, con bailarina.', 'm3', 22, 185],
    ['01.02.003', 'c', 'Carga y acarreo de material sobrante fuera de obra en camión volteo, a tiro libre.', 'm3', 21, 210],
    ['02', 'p', 'Cimentación'],
    ['02.01', 's', 'Plantillas y zapatas'],
    ['02.01.001', 'c', 'Plantilla de concreto hecho en obra f\'c=100 kg/cm² de 5 cm de espesor.', 'm2', 48, 165],
    ['02.01.002', 'c', 'Zapata corrida de concreto f\'c=250 kg/cm² armada con varilla #3 @ 20 cm, incluye cimbra y colado.', 'm3', 14.2, 4850],
    ['02.02', 's', 'Cadenas y muros de enrase'],
    ['02.02.001', 'c', 'Cadena de desplante de 15x20 cm, concreto f\'c=200 kg/cm², armada con 4 var. #3 y estribos #2 @ 20 cm.', 'ml', 96, 385],
    ['02.02.002', 'c', 'Muro de enrase de block 15x20x40 cm con celdas rellenas de concreto, junteado con mortero 1:4.', 'm2', 28, 520],
    ['02.02.003', 'c', 'Impermeabilización de cadena de desplante con emulsión asfáltica, dos manos.', 'ml', 96, 48],
    ['03', 'p', 'Estructura'],
    ['03.01', 's', 'Castillos y cadenas'],
    ['03.01.001', 'c', 'Castillo de 15x15 cm, concreto f\'c=200 kg/cm², armado con 4 var. #3 y estribos #2 @ 20 cm, incluye cimbra.', 'ml', 142, 345],
    ['03.01.002', 'c', 'Cadena de cerramiento de 15x20 cm, concreto f\'c=200 kg/cm², armada con 4 var. #3 y estribos #2 @ 20 cm.', 'ml', 118, 395],
    ['03.02', 's', 'Losas, trabes y escalera'],
    ['03.02.001', 'c', 'Losa maciza de 10 cm, concreto f\'c=250 kg/cm², armada con var. #3 @ 20 cm en ambos sentidos, incluye cimbra común.', 'm2', 132, 1180],
    ['03.02.002', 'c', 'Trabe de 20x40 cm, concreto f\'c=250 kg/cm², incluye acero de refuerzo, cimbra y descimbra.', 'ml', 24, 1450],
    ['03.02.003', 'c', 'Rampa de escalera de concreto armado f\'c=250 kg/cm², incluye escalones forjados.', 'm2', 9.5, 1850],
    ['04', 'p', 'Albañilería'],
    ['04.01', 's', 'Muros'],
    ['04.01.001', 'c', 'Muro de block hueco de 12x20x40 cm junteado con mortero cemento-arena 1:4, acabado común.', 'm2', 285, 395],
    ['04.01.002', 'c', 'Pretil de block de 12x20x40 cm de 60 cm de altura en azotea, incluye castillo ahogado.', 'ml', 42, 260],
    ['04.02', 's', 'Firmes, aplanados y entortados'],
    ['04.02.001', 'c', 'Firme de concreto f\'c=150 kg/cm² de 8 cm de espesor, con malla electrosoldada 6x6-10/10.', 'm2', 68, 295],
    ['04.02.002', 'c', 'Aplanado en muros interiores con mortero cemento-arena 1:5, acabado fino a plomo y regla.', 'm2', 520, 175],
    ['04.02.003', 'c', 'Aplanado en fachadas con mortero cemento-arena 1:4, acabado fino, incluye andamios.', 'm2', 145, 205],
    ['04.02.004', 'c', 'Relleno y entortado en azotea con pendiente mínima del 2% hacia bajadas pluviales.', 'm2', 70, 185],
    ['05', 'p', 'Instalación hidrosanitaria'],
    ['05.01', 's', 'Hidráulica'],
    ['05.01.001', 'c', 'Salida hidráulica con tubería de CPVC de 1/2", incluye conexiones, ranurado y pruebas.', 'sal', 14, 1150],
    ['05.01.002', 'c', 'Suministro e instalación de tinaco de 1,100 L con base, flotador, jarro de aire y conexiones.', 'pza', 1, 4600],
    ['05.01.003', 'c', 'Cisterna prefabricada de 2,800 L instalada, incluye excavación, bomba de 1/2 HP y conexiones.', 'pza', 1, 14500],
    ['05.02', 's', 'Sanitaria y muebles'],
    ['05.02.001', 'c', 'Salida sanitaria con tubería de PVC sanitario de 2" y 4", incluye conexiones y pruebas.', 'sal', 12, 980],
    ['05.02.002', 'c', 'Registro sanitario de 40x60 cm de block con tapa de concreto y marco metálico.', 'pza', 3, 2350],
    ['05.02.003', 'c', 'Suministro y colocación de WC ahorrador de 4.8 L con accesorios, cuello de cera y llave de paso.', 'pza', 3, 3450],
    ['06', 'p', 'Instalación eléctrica'],
    ['06.01', 's', 'Salidas y protecciones'],
    ['06.01.001', 'c', 'Salida eléctrica de centro, contacto o apagador con poliducto de 1/2" y cable THW cal. 12, incluye accesorios.', 'sal', 48, 620],
    ['06.01.002', 'c', 'Centro de carga de 8 circuitos con interruptores termomagnéticos, instalado y probado.', 'pza', 1, 3850],
    ['06.01.003', 'c', 'Acometida eléctrica y base de medidor según norma CFE, incluye mufa y tierra física.', 'lote', 1, 6800],
    ['07', 'p', 'Acabados'],
    ['07.01', 's', 'Pisos y lambrines'],
    ['07.01.001', 'c', 'Piso cerámico de 45x45 cm asentado con adhesivo, incluye boquilla, cortes y desperdicio.', 'm2', 118, 485],
    ['07.01.002', 'c', 'Lambrín de azulejo en baños y cocina asentado con adhesivo, incluye boquilla.', 'm2', 42, 520],
    ['07.01.003', 'c', 'Zoclo cerámico de 10 cm de altura del mismo material del piso.', 'ml', 110, 95],
    ['07.02', 's', 'Pintura e impermeabilización'],
    ['07.02.001', 'c', 'Pintura vinílica en muros y plafones, dos manos, incluye sellador y preparación de superficie.', 'm2', 640, 72],
    ['07.02.002', 'c', 'Impermeabilizante acrílico fibratado de 5 años en azotea, incluye sellador y malla en chaflanes.', 'm2', 72, 165],
    ['08', 'p', 'Cancelería, carpintería y herrería'],
    ['08.01', 's', 'Puertas y ventanas'],
    ['08.01.001', 'c', 'Puerta de tambor de pino de 0.90x2.10 m con marco, bisagras y chapa de pomo.', 'pza', 7, 3650],
    ['08.01.002', 'c', 'Ventana de aluminio natural línea 3" con vidrio claro de 6 mm, incluye sellado perimetral.', 'm2', 16, 2450],
    ['08.01.003', 'c', 'Puerta de acceso de herrería tubular con chapa de seguridad, acabado esmalte.', 'pza', 1, 8900],
    ['09', 'p', 'Limpieza y entrega'],
    ['09.001', 'c', 'Limpieza general de obra, retiro de escombro y entrega de vivienda.', 'm2', 125, 35]
  ];
  var ESTRUCTURA = ['Preliminares', 'Cimentación', 'Estructura', 'Albañilería', 'Instalación hidrosanitaria', 'Instalación eléctrica', 'Acabados', 'Cancelería, carpintería y herrería', 'Limpieza y entrega'];

  var NOTAS = '1. Precios en moneda nacional (MXN), incluyen materiales, mano de obra, herramienta y equipo.\n' +
    '2. No incluye: trámites, licencias, permisos, derechos de conexión ni proyecto ejecutivo.\n' +
    '3. Cualquier trabajo extraordinario se cotizará por separado previa autorización del cliente.\n' +
    '4. Forma de pago sugerida: 30% de anticipo y el resto contra estimaciones de avance.';

  function filas(ejemplo) {
    if (ejemplo) return EJEMPLO.map(function (e) {
      var r = { id: U.nid(), _t: e[1], clave: e[0], concepto: e[2] };
      if (e[1] === 'c') { r.unidad = e[3]; r.cantidad = e[4]; r.pu = e[5]; }
      return r;
    });
    var out = [];
    ESTRUCTURA.forEach(function (p, i) {
      out.push({ id: U.nid(), _t: 'p', clave: String(i + 1).padStart(2, '0'), concepto: p });
      out.push({ id: U.nid(), _t: 'c', clave: String(i + 1).padStart(2, '0') + '.001', concepto: '', unidad: '', cantidad: '', pu: '' });
    });
    return out;
  }

  ImfraPlantillas.registrar({
    id: 'casa-habitacion',
    version: 1,
    hoja: 'Presupuesto',
    secciones: [
      { tipo: 'campos', titulo: 'Datos generales del proyecto', campos: [
        { k: 'proyecto', l: 'Proyecto / obra', w: 2, ph: 'Casa habitación de 2 niveles' },
        { k: 'cliente', l: 'Cliente', w: 2, ph: 'Nombre del cliente' },
        { k: 'ubicacion', l: 'Ubicación', w: 2, ph: 'Calle, número, colonia, municipio, estado' },
        { k: 'responsable', l: 'Responsable (elaboró)', ph: 'Ing. / Arq.' },
        { k: 'cedula', l: 'Cédula profesional' },
        { k: 'folio', l: 'No. de presupuesto', ph: 'PRE-001' },
        { k: 'fecha', l: 'Fecha', t: 'date' },
        { k: 'superficie', l: 'Superficie de construcción (m²)', t: 'number' },
        { k: 'niveles', l: 'Niveles', t: 'number', dec: 0 },
        { k: 'plazo', l: 'Plazo de ejecución', ph: '16 semanas' },
        { k: 'vigencia', l: 'Vigencia de la cotización', ph: '30 días naturales' },
        { k: 'reviso', l: 'Revisó', w: 2, ph: 'Nombre de quien revisa' }
      ]},
      { tipo: 'tabla', key: 'conceptos', titulo: 'Catálogo de conceptos', totalLabel: 'Subtotal del presupuesto',
        niveles: { texto: 'concepto', sumar: ['importe'] },
        filaNueva: function (t) { return t === 'c' ? { clave: '', concepto: '', unidad: '', cantidad: '', pu: '' } : { clave: '', concepto: '' }; },
        columnas: [
          { k: 'clave', l: 'Clave', t: 'text', ancho: 104, xlsAncho: 12 },
          { k: 'concepto', l: 'Concepto', t: 'textarea', ancho: 400, xlsAncho: 62, ph: 'Descripción del concepto' },
          { k: 'unidad', l: 'Unidad', t: 'unidad', ancho: 78, xlsAncho: 9 },
          { k: 'cantidad', l: 'Cantidad', t: 'num', ancho: 100, xlsAncho: 12 },
          { k: 'pu', l: 'P.U.', t: 'money', ancho: 116, xlsAncho: 14 },
          { k: 'importe', l: 'Importe', t: 'money', ancho: 136, xlsAncho: 17, calc: function (r) { return num(r.cantidad) * num(r.pu); }, formula: '{cantidad}*{pu}' },
          { k: 'inc', l: '% Inc.', t: 'pct', ancho: 76, xlsAncho: 9, pctDe: 'importe' }
        ]
      },
      { tipo: 'resumen', titulo: 'Resumen del presupuesto', items: [
        { id: 'sub', l: 'Subtotal', t: 'money', calc: function (c) { return c.tot('conceptos', 'importe'); }, xls: function (R) { return R.total('conceptos', 'importe'); } },
        { id: 'iva', l: 'IVA', t: 'money', param: { k: 'iva', suf: '%' }, calc: function (c) { return c.v('sub') * c.p('iva') / 100; }, xls: function (R) { return R.id('sub') + '*' + R.param('iva'); } },
        { id: 'total', l: 'Total', t: 'money', destacado: true, calc: function (c) { return c.v('sub') + c.v('iva'); }, xls: function (R) { return R.id('sub') + '+' + R.id('iva'); } },
        { id: 'm2', l: 'Costo por m² de construcción', t: 'money', calc: function (c) { var s = num(c.campo('superficie')); return s ? c.v('total') / s : 0; }, xls: function (R) { return 'IFERROR(' + R.id('total') + '/' + R.campo('superficie') + ',0)'; } },
        { id: 'kpiTotal', l: 'Total con IVA', t: 'money', kpi: true, calc: function (c) { return c.v('total'); } },
        { id: 'kpiM2', l: 'Costo por m²', t: 'money', kpi: true, calc: function (c) { return c.v('m2'); } },
        { id: 'letra', l: 'Importe total con letra', t: 'letra', calc: function (c) { return U.numeroALetras(c.v('total')); } }
      ]},
      { tipo: 'campos', titulo: 'Condiciones y observaciones', campos: [
        { k: 'notas', l: 'Notas y condiciones comerciales', t: 'textarea' }
      ]}
    ],
    firmas: [{ l: 'Elaboró', k: 'responsable' }, { l: 'Revisó', k: 'reviso' }, { l: 'Autorizó (cliente)', k: 'cliente' }],
    nuevo: function (ejemplo) {
      return {
        campos: ejemplo ? {
          proyecto: 'Casa habitación de 2 niveles, 3 recámaras', cliente: 'Familia López Hernández', ubicacion: 'Calle Reforma 214, Col. Centro, Tehuacán, Puebla',
          responsable: 'Ing. Carlos Méndez Ruiz', cedula: '', folio: 'PRE-2026-001', fecha: U.hoyISO(), superficie: 125, niveles: 2,
          plazo: '16 semanas', vigencia: '30 días naturales', reviso: '', notas: NOTAS
        } : { fecha: U.hoyISO(), vigencia: '30 días naturales', notas: NOTAS },
        params: { iva: 16 },
        tablas: { conceptos: filas(ejemplo) }
      };
    }
  });
})();
