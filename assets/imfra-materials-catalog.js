// Catálogo público de materiales almacenados en Bunny Storage.
// No contiene credenciales: usa exclusivamente el Pull Zone público.
(function () {
  const CDN = 'https://imframateriales.b-cdn.net/';
  const material = (archivo, titulo, cursoTitulo, opciones) => ({
    archivo,
    titulo,
    cursoTitulo,
    url: CDN + encodeURIComponent(archivo),
    ...(opciones || {})
  });
  const COSTOS_RECOMPENSA = [160, 175, 190, 205, 220, 240, 260];
  const recompensa = (archivo, titulo, rewardOrder) => material(
    archivo,
    titulo,
    'Recompensas de obra',
    {
      esRecompensa: true,
      rewardOrder,
      rewardId: `material-${rewardOrder}`,
      creditCost: COSTOS_RECOMPENSA[rewardOrder - 1],
      area: 'Control de obra'
    }
  );

  window.IMFRA_MATERIALS_CATALOG = [
    material(
      'IMFRA_Matriz_Control_Documental_ISO9001_Constructoras.xlsm',
      'Matriz de Control Documental ISO 9001',
      'Calidad ISO 9001'
    ),
    material(
      'IMFRA_Formato_No_Conformidades_Acciones_Correctivas_Mejora_Continua_ISO9001_2026.xlsm',
      'Formato de No Conformidades y Acciones Correctivas',
      'Calidad ISO 9001'
    ),
    material(
      'IMFRA_Programa_Lista_Verificacion_Auditoria_Interna_ISO9001_2026.xlsm',
      'Programa y Lista de Verificación para Auditoría Interna',
      'Calidad ISO 9001'
    ),

    material(
      'Clase 01.-Generadores y Estimaciones de Obra.pdf',
      'Clase 01 · Generadores y estimaciones de obra',
      'Generadores y Estimaciones desde cero'
    ),
    material(
      'Clase 02.-Lectura de planos y catalogo de conceptos.pdf',
      'Clase 02 · Lectura de planos y catálogo de conceptos',
      'Generadores y Estimaciones desde cero'
    ),
    material(
      'Clase 03.-Cuantificación de volúmenes de obra.pdf',
      'Clase 03 · Cuantificación de volúmenes de obra',
      'Generadores y Estimaciones desde cero'
    ),
    material(
      'Clase 04.-Elaboración de números generadores.pdf',
      'Clase 04 · Elaboración de números generadores',
      'Generadores y Estimaciones desde cero'
    ),
    material(
      'Clase 05.-Generadores por partidas de obra.pdf',
      'Clase 05 · Generadores por partidas de obra',
      'Generadores y Estimaciones desde cero'
    ),
    material(
      'Clase 06.-Estimaciones de obra.pdf',
      'Clase 06 · Estimaciones de obra',
      'Generadores y Estimaciones desde cero'
    ),
    material(
      'Clase 07.-Control de avances y evidencia de campo.pdf',
      'Clase 07 · Control de avances y evidencia de campo',
      'Generadores y Estimaciones desde cero'
    ),
    material(
      'Clase 08.-Presupuestos, precios unitarios y control de conceptos.pdf',
      'Clase 08 · Presupuestos, precios unitarios y control de conceptos',
      'Generadores y Estimaciones desde cero'
    ),
    material(
      'Clase 09.-Revisión, conciliación y corrección de estimaciones.pdf',
      'Clase 09 · Revisión, conciliación y corrección de estimaciones',
      'Generadores y Estimaciones desde cero'
    ),
    material(
      'Clase 10.-Cierre del caso aplicado de generadores y estimaciones.pdf',
      'Clase 10 · Cierre del caso aplicado',
      'Generadores y Estimaciones desde cero'
    ),
    recompensa(
      'Calculadoras_Excel_Obra_IMFRAValor.xlsx',
      'Calculadoras Excel para obra',
      3
    ),

    material(
      'IMFRA_Control_Personal_Destajos_Rendimientos_Constructoras.xlsx',
      'Control de Personal, Destajos y Rendimientos',
      'Superintendencia de obra'
    ),
    material(
      'IMFRA_Checklist_Supervision_Diaria_Frentes_Trabajo.xlsm',
      'Checklist de Supervisión Diaria de Frentes de Trabajo',
      'Superintendencia de obra'
    ),
    material(
      'IMFRA_Plantilla_Reporte_Semanal_Avance_Superintendente.xlsm',
      'Plantilla de Reporte Semanal de Avance del Superintendente',
      'Superintendencia de obra'
    ),
    recompensa(
      'Caso_Practico_Recuperacion_de_Obra_IMFRAValor.pdf',
      'Caso práctico de recuperación de obra',
      1
    ),
    recompensa(
      'Plantillas_Control_Integral_Obra_IMFRAValor.xlsx',
      'Plantillas para control integral de obra',
      2
    ),
    recompensa(
      'Formatos_Word_Control_de_Obra_IMFRAValor.docx',
      'Formatos Word para control de obra',
      4
    ),
    recompensa(
      'Checklist_Integral_de_Obra_IMFRAValor.xlsx',
      'Checklist integral de obra',
      5
    ),
    recompensa(
      'Control_Integral_de_Obra_IMFRAValor.xlsx',
      'Control integral de obra',
      6
    ),
    recompensa(
      'Manual_Tecnico_Control_Integral_de_Obra_IMFRAValor.pdf',
      'Manual técnico de control integral de obra',
      7
    )
  ];
})();
