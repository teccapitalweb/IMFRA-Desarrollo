/* =========================================================
   Plantilla 06 · NÚMEROS GENERADORES
   Estructura: Concepto (partida, con clave y unidad) > Nivel/zona
   (subpartida, opcional) > Mediciones.
   Cantidad = Largo × Ancho × Alto × Piezas × Factor
   · Las medidas vacías valen 1 (m, m², m³, pza, kg con el mismo formato).
   · Piezas negativas = deducciones (huecos de puertas y ventanas).
   · Factor = peso por metro, desperdicio, abundamiento, pendiente…
   ========================================================= */
(function () {
  var U = ImfraPlantillas.util, num = U.num;
  var DIM = ['largo', 'ancho', 'alto', 'piezas', 'factor'];

  function vacio(v) { return v === '' || v == null || String(v).trim() === ''; }
  function cantidad(r) {
    if (DIM.every(function (k) { return vacio(r[k]); })) return 0;
    return DIM.reduce(function (a, k) { return a * (vacio(r[k]) ? 1 : num(r[k])); }, 1);
  }
  var FX = 'IF(COUNT({largo}:{factor})=0,0,' + DIM.map(function (k) { return 'IF({' + k + '}="",1,{' + k + '})'; }).join('*') + ')';

  function P(clave, unidad, texto) { return { id: U.nid(), _t: 'p', clave: clave, unidad: unidad, concepto: texto }; }
  function S(texto) { return { id: U.nid(), _t: 's', clave: '', unidad: '', concepto: texto }; }
  function M(ubic, eje, tramo, l, a, h, pz, f, obs) { return { id: U.nid(), _t: 'c', clave: '', unidad: '', concepto: ubic, eje: eje, tramo: tramo, largo: l, ancho: a, alto: h, piezas: pz, factor: f, obs: obs || '' }; }

  function ejemplo() {
    return [
      P('01.02.001', 'm3', 'Excavación a mano en material tipo II para cimentación, de 0.00 a -1.20 m'),
      M('Cepa de zapata corrida', 'A', '1-4', 12.00, 0.80, 1.00, 1, '', ''),
      M('Cepa de zapata corrida', 'B', '1-4', 12.00, 0.80, 1.00, 1, '', ''),
      M('Cepa de zapata corrida', 'C', '1-4', 12.00, 0.80, 1.00, 1, '', ''),
      M('Cepa de zapata corrida', '1 a 4', 'A-C', 8.50, 0.80, 1.00, 4, '', '4 ejes transversales iguales'),
      P('02.02.001', 'ml', 'Cadena de desplante de 15x20 cm, f\'c=200 kg/cm², 4 var. #3 y estribos #2 @ 20 cm'),
      M('Ejes longitudinales', 'A, B y C', '1-4', 12.00, '', '', 3, '', ''),
      M('Ejes transversales', '1 a 4', 'A-C', 8.50, '', '', 4, '', ''),
      P('03.01.001', 'kg', 'Acero de refuerzo #3 (3/8") en castillos K-1 de 15x15 cm'),
      S('Planta baja'),
      M('Varilla longitudinal de castillos', 'Varios', '—', 2.90, '', '', 72, 0.557, '18 castillos × 4 varillas · 0.557 kg/m'),
      S('Planta alta'),
      M('Varilla longitudinal de castillos', 'Varios', '—', 2.70, '', '', 64, 0.557, '16 castillos × 4 varillas'),
      M('Traslapes y anclajes', 'Varios', '—', 0.40, '', '', 136, 0.557, '40 diámetros por varilla'),
      P('04.01.001', 'm2', 'Muro de block hueco de 12x20x40 cm junteado con mortero cemento-arena 1:4'),
      S('Planta baja'),
      M('Fachada principal', 'A', '1-4', 12.00, '', 2.60, 1, '', ''),
      M('Deducción ventana V-1', 'A', '1-2', 1.50, '', 1.20, -3, '', '3 ventanas de 1.50 × 1.20'),
      M('Deducción puerta P-1 (acceso)', 'A', '3-4', 0.90, '', 2.10, -1, '', ''),
      M('Muro posterior', 'C', '1-4', 12.00, '', 2.60, 1, '', ''),
      M('Muros laterales', '1 y 4', 'A-C', 8.50, '', 2.60, 2, '', ''),
      S('Planta alta'),
      M('Fachada principal', 'A', '1-4', 12.00, '', 2.40, 1, '', ''),
      M('Deducción ventana V-2', 'A', '1-4', 1.20, '', 1.20, -4, '', ''),
      M('Muros laterales y posterior', '1, 4 y C', '—', 29.00, '', 2.40, 1, '', ''),
      P('03.02.001', 'm3', 'Concreto f\'c=250 kg/cm² en losa de azotea de 10 cm'),
      M('Tablero', 'A-B', '1-4', 12.00, 4.20, 0.10, 1, 1.03, 'Factor 3% de desperdicio'),
      M('Tablero', 'B-C', '1-4', 12.00, 4.30, 0.10, 1, 1.03, ''),
      M('Deducción cubo de escalera', 'B', '2-3', 2.40, 1.10, 0.10, -1, 1.03, '')
    ];
  }
  function blanco() {
    return [P('', '', ''), M('', '', '', '', '', '', '', '', ''), M('', '', '', '', '', '', '', '', '')];
  }

  function corto(t) { t = String(t || 'Concepto'); if (t.length <= 50) return t; t = t.slice(0, 50); return t.slice(0, t.lastIndexOf(' ')).replace(/[,;:]$/, '') + '…'; }
  function resumen(c) {
    var rows = c.data.tablas.generador || [], f = c.comp.t.generador.f, out = [];
    rows.forEach(function (r) { if (r._t === 'p') out.push((r.clave ? r.clave + ' ' : '') + corto(r.concepto) + ': ' + U.fmtNum(f[r.id] && f[r.id].cantidad, 2) + ' ' + (r.unidad || '')); });
    return out.length ? out.join('   ·   ') : 'Agrega un concepto con “+ Partida” para comenzar.';
  }
  function cuenta(tipo, neg) { return function (c) { var n = 0; (c.data.tablas.generador || []).forEach(function (r) { if (r._t === tipo && (!neg || num(r.piezas) < 0)) n++; }); return n; }; }

  ImfraPlantillas.registrar({
    id: 'generadores',
    version: 1,
    hoja: 'Generadores',
    secciones: [
      { tipo: 'campos', titulo: 'Datos del generador', campos: [
        { k: 'obra', l: 'Obra / proyecto', w: 2 },
        { k: 'contrato', l: 'No. de contrato' },
        { k: 'estimacion', l: 'Para estimación No.' },
        { k: 'ubicacion', l: 'Ubicación', w: 2 },
        { k: 'frente', l: 'Frente / nivel' },
        { k: 'fecha', l: 'Fecha', t: 'date' },
        { k: 'contratista', l: 'Contratista', w: 2 },
        { k: 'plano', l: 'Plano(s) de referencia', w: 2, ph: 'A-01, E-03' },
        { k: 'responsable', l: 'Elaboró (contratista)', w: 2 },
        { k: 'supervision', l: 'Revisó (supervisión)', w: 2 },
        { k: 'residente', l: 'Autorizó (residente de obra)', w: 2 }
      ]},
      { tipo: 'tabla', key: 'generador', titulo: 'Cuantificación', sinTotal: true, sinRenumerar: true, filaLabel: 'Medición', partidaLabel: 'Concepto', subLabel: 'Nivel / zona',
        niveles: { texto: 'concepto', sumar: ['cantidad'] },
        filaNueva: function (t) { return t === 'c' ? { clave: '', unidad: '', concepto: '', eje: '', tramo: '', largo: '', ancho: '', alto: '', piezas: '', factor: '', obs: '' } : { clave: '', unidad: '', concepto: '' }; },
        columnas: [
          { k: 'clave', l: 'Clave', t: 'text', ancho: 100, xlsAncho: 12 },
          { k: 'unidad', l: 'Unidad', t: 'unidad', ancho: 70, xlsAncho: 8 },
          { k: 'concepto', l: 'Concepto / ubicación', t: 'textarea', ancho: 260, xlsAncho: 38, ph: 'Ubicación de la medición' },
          { k: 'eje', l: 'Eje', t: 'text', ancho: 76, xlsAncho: 9 },
          { k: 'tramo', l: 'Tramo', t: 'text', ancho: 76, xlsAncho: 9 },
          { k: 'largo', l: 'Largo', t: 'num', dec: 2, ancho: 80, xlsAncho: 9 },
          { k: 'ancho', l: 'Ancho', t: 'num', dec: 2, ancho: 80, xlsAncho: 9 },
          { k: 'alto', l: 'Alto', t: 'num', dec: 2, ancho: 80, xlsAncho: 9 },
          { k: 'piezas', l: 'No. piezas', t: 'num', dec: 0, ancho: 80, xlsAncho: 9 },
          { k: 'factor', l: 'Factor', t: 'num', dec: 3, ancho: 80, xlsAncho: 9 },
          { k: 'cantidad', l: 'Cantidad', t: 'num', dec: 2, ancho: 110, xlsAncho: 13, calc: cantidad, formula: FX },
          { k: 'obs', l: 'Observaciones', t: 'textarea', ancho: 210, xlsAncho: 30 }
        ]
      },
      { tipo: 'resumen', titulo: 'Resumen del generador', items: [
        { id: 'kC', l: 'Conceptos cuantificados', t: 'num', dec: 0, kpi: true, calc: cuenta('p') },
        { id: 'kM', l: 'Mediciones registradas', t: 'num', dec: 0, kpi: true, calc: cuenta('c') },
        { id: 'kD', l: 'Deducciones (piezas negativas)', t: 'num', dec: 0, kpi: true, calc: cuenta('c', true) },
        { id: 'kS', l: 'Niveles / zonas', t: 'num', dec: 0, kpi: true, calc: cuenta('s') },
        { id: 'res', l: 'Cantidades por concepto', t: 'texto', calc: resumen }
      ]},
      { tipo: 'campos', titulo: 'Notas', campos: [
        { k: 'notas', l: 'Croquis, criterios de medición y observaciones', t: 'textarea' }
      ]}
    ],
    firmas: [{ l: 'Elaboró (contratista)', k: 'responsable' }, { l: 'Revisó (supervisión)', k: 'supervision' }, { l: 'Autorizó (residente)', k: 'residente' }],
    nuevo: function (ej) {
      return {
        campos: ej ? {
          obra: 'Casa habitación de 2 niveles, 3 recámaras', contrato: 'CTO-2026-018', estimacion: '1', ubicacion: 'Calle Reforma 214, Col. Centro, Tehuacán, Puebla',
          frente: 'Obra negra PB y PA', fecha: U.hoyISO(), contratista: 'Constructora del Valle', plano: 'A-01, A-02, E-01', responsable: 'Ing. Carlos Méndez Ruiz',
          supervision: '', residente: '',
          notas: 'Medidas tomadas a ejes según planos autorizados. Las medidas vacías se consideran 1. Las deducciones se capturan con piezas negativas. El factor del acero corresponde al peso nominal por metro (#3 = 0.557 kg/m, #4 = 0.996 kg/m).'
        } : { fecha: U.hoyISO(), notas: 'Las medidas vacías se consideran 1. Las deducciones se capturan con piezas negativas.' },
        params: {},
        tablas: { generador: ej ? ejemplo() : blanco() }
      };
    }
  });
})();
