/* =========================================================
   Plantilla 10 · BITÁCORA Y REPORTE SEMANAL DE OBRA
   · Bitácora diaria: fecha, clima, personal, horas perdidas,
     actividades, avance/frente e incidencias
   · Maquinaria y equipo en obra (horas trabajadas / inactivas)
   · Material recibido (remisión, proveedor, quién recibió)
   · Visitas a la obra
   · Acuerdos con estatus automático (CUMPLIDO / PENDIENTE /
     EN PROCESO / VENCIDO según fecha compromiso)
   · Avance de la semana y programa siguiente
   · Evidencia fotográfica con pie de foto, fecha y ubicación
   ========================================================= */
(function () {
  var U = ImfraPlantillas.util, num = U.num;
  var CLIMA = ['Soleado', 'Medio nublado', 'Nublado', 'Lluvia ligera', 'Lluvia intensa', 'Viento fuerte', 'Frío / helada', 'Calor extremo'];
  var ESTATUS = ['Pendiente', 'En proceso', 'Cumplido'];

  function lleno(v) { return v !== '' && v != null && String(v).trim() !== ''; }
  function R(o) { var r = { id: U.nid(), _t: 'c' }; Object.keys(o).forEach(function (k) { r[k] = o[k]; }); return r; }
  function dia(iso, n) { var p = iso.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2] + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function estatusAcuerdo(r, o, d) {
    if (!lleno(r.acuerdo)) return '';
    if (r.estatus === 'Cumplido') return 'CUMPLIDO';
    var corte = (d.campos && (d.campos.al || d.campos.fecha)) || '';
    if (lleno(r.compromiso) && corte && String(r.compromiso) < String(corte)) return 'VENCIDO';
    return r.estatus === 'En proceso' ? 'EN PROCESO' : 'PENDIENTE';
  }
  function contar(t, k) { return function (c) { return (c.data.tablas[t] || []).filter(function (r) { return lleno(r[k]); }).length; }; }

  function ejemplo() {
    var ini = '2026-09-21';
    return {
      bitacora: [
        R({ fecha: dia(ini, 0), clima: 'Soleado', personal: 14, hPerdidas: 0, actividades: 'Armado de acero en trabes y losa de entrepiso, eje A-B. Cimbrado de losa tablero B-C.', avance: 'Estructura PA', incidencias: '' }),
        R({ fecha: dia(ini, 1), clima: 'Medio nublado', personal: 15, hPerdidas: 0, actividades: 'Continúa armado de losa. Levantamiento de muro de block en fachada posterior PB.', avance: 'Estructura / albañilería', incidencias: 'Faltaron 40 varillas #3; se solicitó entrega urgente al proveedor.' }),
        R({ fecha: dia(ini, 2), clima: 'Lluvia intensa', personal: 9, hPerdidas: 4, actividades: 'Trabajos bajo techo: ranurado para instalaciones eléctricas en PB.', avance: 'Instalaciones PB', incidencias: 'Lluvia de 13:00 a 17:00; se suspendieron trabajos en losa.' }),
        R({ fecha: dia(ini, 3), clima: 'Nublado', personal: 16, hPerdidas: 0, actividades: 'Revisión de acero por supervisión. Colado de losa de entrepiso con concreto premezclado f\'c=250 (bombeado, 13.5 m³).', avance: 'Losa entrepiso', incidencias: '' }),
        R({ fecha: dia(ini, 4), clima: 'Soleado', personal: 14, hPerdidas: 0, actividades: 'Curado de losa. Aplanados interiores en recámara 1 y baño PB.', avance: 'Albañilería PB', incidencias: '' }),
        R({ fecha: dia(ini, 5), clima: 'Soleado', personal: 10, hPerdidas: 0, actividades: 'Limpieza general, acarreo de sobrantes y levantamiento de castillos en PA.', avance: 'Estructura PA', incidencias: 'Se detectó desplome de 1.5 cm en castillo K-7; se corrigió antes del colado.' })
      ],
      maquinaria: [
        R({ equipo: 'Revolvedora de 1 saco', cantidad: 1, hTrab: 30, hInact: 4, obs: 'Inactiva por lluvia el miércoles' }),
        R({ equipo: 'Vibrador para concreto', cantidad: 1, hTrab: 6, hInact: 0, obs: 'Colado de losa' }),
        R({ equipo: 'Bomba para concreto (servicio)', cantidad: 1, hTrab: 4, hInact: 0, obs: 'Proveedor externo' }),
        R({ equipo: 'Andamio tubular (2 cuerpos)', cantidad: 6, hTrab: 48, hInact: 0, obs: '' })
      ],
      material: [
        R({ fecha: dia(ini, 0), material: 'Varilla corrugada #3', cantidad: 0.8, unidad: 'ton', proveedor: 'Distribuidor de acero', remision: 'R-45821', recibio: 'Almacenista' }),
        R({ fecha: dia(ini, 1), material: 'Block hueco 12x20x40 cm', cantidad: 1200, unidad: 'pza', proveedor: 'Bloquera regional', remision: 'B-1190', recibio: 'Almacenista' }),
        R({ fecha: dia(ini, 2), material: 'Varilla corrugada #3 (entrega urgente)', cantidad: 40, unidad: 'pza', proveedor: 'Distribuidor de acero', remision: 'R-45877', recibio: 'Residente' }),
        R({ fecha: dia(ini, 3), material: 'Concreto premezclado f\'c=250 kg/cm²', cantidad: 13.5, unidad: 'm3', proveedor: 'Concretera', remision: 'C-7702 / C-7703', recibio: 'Residente' })
      ],
      visitas: [
        R({ fecha: dia(ini, 3), visitante: 'Arq. Laura Pérez', empresa: 'Supervisión externa', motivo: 'Revisión de acero y liberación para colado de losa de entrepiso.' }),
        R({ fecha: dia(ini, 4), visitante: 'Sr. Jorge López', empresa: 'Cliente', motivo: 'Recorrido de avance y definición de acabados de baño.' })
      ],
      acuerdos: [
        R({ no: '1', acuerdo: 'Entregar muestras de azulejo y piso para autorización del cliente.', responsable: 'Contratista', compromiso: dia(ini, 9), estatus: 'En proceso' }),
        R({ no: '2', acuerdo: 'Corregir plomo de castillo K-7 antes del colado de cadena.', responsable: 'Residente', compromiso: dia(ini, 5), estatus: 'Cumplido' }),
        R({ no: '3', acuerdo: 'Enviar programa de recuperación por atraso en estructura.', responsable: 'Superintendente', compromiso: dia(ini, 2), estatus: 'Pendiente' })
      ]
    };
  }
  function blanco() {
    var ini = U.hoyISO(), out = [];
    for (var i = 0; i < 6; i++) out.push(R({ fecha: dia(ini, i), clima: '', personal: '', hPerdidas: '', actividades: '', avance: '', incidencias: '' }));
    return { bitacora: out, maquinaria: [R({ equipo: '', cantidad: '', hTrab: '', hInact: '', obs: '' })], material: [R({ fecha: '', material: '', cantidad: '', unidad: '', proveedor: '', remision: '', recibio: '' })], visitas: [R({ fecha: '', visitante: '', empresa: '', motivo: '' })], acuerdos: [R({ no: '1', acuerdo: '', responsable: '', compromiso: '', estatus: 'Pendiente' })] };
  }

  ImfraPlantillas.registrar({
    id: 'bitacora',
    version: 1,
    hoja: 'Reporte semanal',
    secciones: [
      { tipo: 'campos', titulo: 'Datos del reporte', campos: [
        { k: 'proyecto', l: 'Proyecto / obra', w: 2 },
        { k: 'contrato', l: 'No. de contrato' },
        { k: 'semana', l: 'Semana No.' },
        { k: 'ubicacion', l: 'Ubicación', w: 2 },
        { k: 'del', l: 'Periodo del', t: 'date' },
        { k: 'al', l: 'Periodo al', t: 'date' },
        { k: 'cliente', l: 'Cliente', w: 2 },
        { k: 'contratista', l: 'Contratista', w: 2 },
        { k: 'responsable', l: 'Responsable (residente de obra)', w: 2 },
        { k: 'superintendente', l: 'Superintendente', w: 2 }
      ]},
      { tipo: 'tabla', key: 'bitacora', titulo: 'Bitácora diaria', totalLabel: 'Total de la semana', filaLabel: 'Día',
        filaNueva: function () { return { fecha: '', clima: '', personal: '', hPerdidas: '', actividades: '', avance: '', incidencias: '' }; },
        columnas: [
          { k: 'fecha', l: 'Fecha', t: 'date', ancho: 140, xlsAncho: 12 },
          { k: 'clima', l: 'Clima', t: 'select', op: CLIMA, ancho: 140, xlsAncho: 14 },
          { k: 'personal', l: 'Personal en obra', t: 'num', dec: 0, total: true, ancho: 90, xlsAncho: 10 },
          { k: 'hPerdidas', l: 'Horas perdidas', t: 'num', dec: 1, total: true, ancho: 90, xlsAncho: 10 },
          { k: 'actividades', l: 'Actividades realizadas', t: 'textarea', ancho: 330, xlsAncho: 46 },
          { k: 'avance', l: 'Avance / frente', t: 'text', ancho: 140, xlsAncho: 16 },
          { k: 'incidencias', l: 'Incidencias', t: 'textarea', ancho: 260, xlsAncho: 36 }
        ]
      },
      { tipo: 'tabla', key: 'maquinaria', titulo: 'Maquinaria y equipo en obra', totalLabel: 'Totales', filaLabel: 'Equipo',
        filaNueva: function () { return { equipo: '', cantidad: '', hTrab: '', hInact: '', obs: '' }; },
        columnas: [
          { k: 'equipo', l: 'Maquinaria / equipo', t: 'textarea', ancho: 300 },
          { k: 'cantidad', l: 'Cantidad', t: 'num', dec: 0, total: true, ancho: 90 },
          { k: 'hTrab', l: 'Horas trabajadas', t: 'num', dec: 1, total: true, ancho: 110 },
          { k: 'hInact', l: 'Horas inactivas', t: 'num', dec: 1, total: true, ancho: 110 },
          { k: 'util', l: 'Utilización', t: 'pct', ancho: 100, calc: function (r) { var t = num(r.hTrab) + num(r.hInact); return t ? num(r.hTrab) / t : 0; }, formula: 'IFERROR({hTrab}/({hTrab}+{hInact}),0)' },
          { k: 'obs', l: 'Observaciones', t: 'textarea', ancho: 280 }
        ]
      },
      { tipo: 'tabla', key: 'material', titulo: 'Material recibido', sinTotal: true, filaLabel: 'Entrada',
        filaNueva: function () { return { fecha: '', material: '', cantidad: '', unidad: '', proveedor: '', remision: '', recibio: '' }; },
        columnas: [
          { k: 'fecha', l: 'Fecha', t: 'date', ancho: 140 },
          { k: 'material', l: 'Material', t: 'textarea', ancho: 280 },
          { k: 'cantidad', l: 'Cantidad', t: 'num', ancho: 96 },
          { k: 'unidad', l: 'Unidad', t: 'unidad', ancho: 76 },
          { k: 'proveedor', l: 'Proveedor', t: 'text', ancho: 170 },
          { k: 'remision', l: 'Remisión / folio', t: 'text', ancho: 140 },
          { k: 'recibio', l: 'Recibió', t: 'text', ancho: 130 }
        ]
      },
      { tipo: 'tabla', key: 'visitas', titulo: 'Visitas a la obra', sinTotal: true, filaLabel: 'Visita',
        filaNueva: function () { return { fecha: '', visitante: '', empresa: '', motivo: '' }; },
        columnas: [
          { k: 'fecha', l: 'Fecha', t: 'date', ancho: 140 },
          { k: 'visitante', l: 'Visitante', t: 'text', ancho: 190 },
          { k: 'empresa', l: 'Empresa / cargo', t: 'text', ancho: 190 },
          { k: 'motivo', l: 'Motivo / observaciones', t: 'textarea', ancho: 420 }
        ]
      },
      { tipo: 'tabla', key: 'acuerdos', titulo: 'Acuerdos', sinTotal: true, filaLabel: 'Acuerdo',
        filaNueva: function () { return { no: '', acuerdo: '', responsable: '', compromiso: '', estatus: 'Pendiente' }; },
        columnas: [
          { k: 'no', l: 'No.', t: 'text', ancho: 60 },
          { k: 'acuerdo', l: 'Acuerdo', t: 'textarea', ancho: 380 },
          { k: 'responsable', l: 'Responsable', t: 'text', ancho: 160 },
          { k: 'compromiso', l: 'Fecha compromiso', t: 'date', ancho: 140 },
          { k: 'estatus', l: 'Estatus capturado', t: 'select', op: ESTATUS, ancho: 130 },
          { k: 'sem', l: 'Situación', t: 'semaforo', ancho: 120, calc: estatusAcuerdo,
            formula: 'IF({acuerdo}="","",IF({estatus}="Cumplido","CUMPLIDO",IF(AND({compromiso}<>"",{compromiso}<{@al}),"VENCIDO",IF({estatus}="En proceso","EN PROCESO","PENDIENTE"))))' }
        ]
      },
      { tipo: 'campos', titulo: 'Avance de la semana', campos: [
        { k: 'avProg', l: 'Avance programado acumulado (%)', t: 'number', dec: 1 },
        { k: 'avReal', l: 'Avance real acumulado (%)', t: 'number', dec: 1 },
        { k: 'avSemana', l: 'Avance logrado en la semana (%)', t: 'number', dec: 1 },
        { k: 'frentes', l: 'Frentes activos', ph: 'Estructura PA, albañilería PB' },
        { k: 'resumen', l: 'Resumen de actividades principales', t: 'textarea' },
        { k: 'proxima', l: 'Programa de la próxima semana', t: 'textarea' }
      ]},
      { tipo: 'fotos', key: 'evidencia', titulo: 'Evidencia fotográfica', max: 24 },
      { tipo: 'resumen', titulo: 'Resumen de la semana', vista: 'kpis', items: [
        { id: 'dias', l: 'Días registrados', t: 'num', dec: 0, calc: contar('bitacora', 'actividades') },
        { id: 'jh', l: 'Jornadas-hombre', t: 'num', dec: 0, calc: function (c) { return c.tot('bitacora', 'personal'); }, xls: function (X) { return X.total('bitacora', 'personal'); } },
        { id: 'hp', l: 'Horas perdidas', t: 'num', dec: 1, calc: function (c) { return c.tot('bitacora', 'hPerdidas'); }, xls: function (X) { return X.total('bitacora', 'hPerdidas'); } },
        { id: 'inc', l: 'Días con incidencias', t: 'num', dec: 0, calc: contar('bitacora', 'incidencias') },
        { id: 'mat', l: 'Entradas de material', t: 'num', dec: 0, calc: contar('material', 'material') },
        { id: 'vis', l: 'Visitas', t: 'num', dec: 0, calc: contar('visitas', 'visitante') },
        { id: 'acP', l: 'Acuerdos abiertos', t: 'num', dec: 0, calc: function (c) { var f = c.comp.t.acuerdos.f; return (c.data.tablas.acuerdos || []).filter(function (r) { var s = f[r.id] && f[r.id].sem; return s && s !== 'CUMPLIDO'; }).length; } },
        { id: 'acV', l: 'Acuerdos vencidos', t: 'num', dec: 0, calc: function (c) { var f = c.comp.t.acuerdos.f; return (c.data.tablas.acuerdos || []).filter(function (r) { return f[r.id] && f[r.id].sem === 'VENCIDO'; }).length; } },
        { id: 'difAv', l: 'Real vs programado (puntos)', t: 'num', dec: 1, calc: function (c) { return num(c.campo('avReal')) - num(c.campo('avProg')); }, xls: function (X) { return X.campo('avReal') + '-' + X.campo('avProg'); } },
        { id: 'fotos', l: 'Fotos de evidencia', t: 'num', dec: 0, calc: function (c) { return ((c.data.fotos && c.data.fotos.evidencia) || []).length; } }
      ]},
      { tipo: 'campos', titulo: 'Observaciones', campos: [
        { k: 'observaciones', l: 'Observaciones generales', t: 'textarea' }
      ]}
    ],
    firmas: [{ l: 'Residente de obra', k: 'responsable' }, { l: 'Superintendente', k: 'superintendente' }, { l: 'Supervisión', k: 'supervision' }],
    nuevo: function (ej) {
      return {
        campos: ej ? {
          proyecto: 'Casa habitación de 2 niveles, 3 recámaras', contrato: 'CTO-2026-018', semana: '10', ubicacion: 'Calle Reforma 214, Col. Centro, Tehuacán, Puebla',
          del: '2026-09-21', al: '2026-09-27', cliente: 'Familia López Hernández', contratista: 'Constructora del Valle', responsable: 'Ing. Carlos Méndez Ruiz', superintendente: 'Ing. Ana Robles Díaz',
          avProg: 68, avReal: 59.5, avSemana: 7.5, frentes: 'Estructura PA, albañilería e instalaciones PB',
          resumen: 'Se coló la losa de entrepiso (13.5 m³) previa liberación de supervisión. Avance en muros de block y aplanados de PB. La lluvia del miércoles provocó 4 horas perdidas.',
          proxima: 'Castillos y cadenas de PA, muros de block PA, instalación hidráulica PB y aplanados en baño y cocina.',
          observaciones: 'Se reforzó la cuadrilla de estructura para recuperar el atraso. El suministro de acero quedó normalizado.'
        } : { semana: '1', del: U.hoyISO(), al: dia(U.hoyISO(), 6) },
        params: {},
        tablas: ej ? ejemplo() : blanco(),
        fotos: { evidencia: [] }
      };
    }
  });
})();
