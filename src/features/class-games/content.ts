// Contenido de los mini juegos: uno distinto por clase, en el orden de cada curso.
// Los cursos se reconocen por su título (igual que los títulos editoriales del
// panel), así que una resincronización con Bunny no borra los juegos.

export type PlanKind = "obra" | "planta";

export type GameConfig =
  | { tipo: "sopa"; palabras: string[] }
  | { tipo: "crucigrama"; entradas: { palabra: string; pista: string }[] }
  | { tipo: "rompecabezas"; lado: number; mensaje: string }
  | { tipo: "plano"; plano: PlanKind; rondas: { pregunta: string; zona: string; explicacion: string }[] }
  | { tipo: "memorama"; pares: { termino: string; definicion: string }[] }
  | { tipo: "ordenar"; pregunta: string; pasos: string[] }
  | { tipo: "clasificar"; pregunta: string; categorias: string[]; elementos: { texto: string; categoria: number }[] }
  | { tipo: "ahorcado"; palabras: { palabra: string; pista: string }[] }
  | { tipo: "completar"; texto: string; distractores: string[] };

export type GameType = GameConfig["tipo"];

// Íconos dibujados (los emojis se ven distintos en cada sistema operativo).
const svg = (paths: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const GAME_INFO: Record<GameType, { nombre: string; instruccion: string; icono: string }> = {
  sopa: { nombre: "Sopa de letras", instruccion: "Encuentra los términos clave escondidos en el tablero.", icono: svg('<rect x="3" y="3" width="12" height="12" rx="2"/><path d="M7 3v12M11 3v12M3 7h12M3 11h12"/><circle cx="16.5" cy="16.5" r="3.6"/><path d="m19.2 19.2 2.3 2.3"/>') },
  crucigrama: { nombre: "Crucigrama técnico", instruccion: "Resuelve el crucigrama con las pistas de la clase.", icono: svg('<path d="M3 9h6V3h6v6h6v6h-6v6H9v-6H3z"/><path d="M9 9h6v6H9z"/>') },
  rompecabezas: { nombre: "Rompecabezas", instruccion: "Intercambia las piezas hasta armar la imagen completa.", icono: svg('<path d="M4 7h3a1 1 0 0 0 1-1V5a2 2 0 0 1 4 0v1a1 1 0 0 0 1 1h3a1 1 0 0 1 1 1v3a1 1 0 0 0 1 1h1a2 2 0 0 1 0 4h-1a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-1a2 2 0 0 0-4 0v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a2 2 0 0 0 0-4H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1"/>') },
  plano: { nombre: "Señala en el plano", instruccion: "Toca en el plano el lugar correcto para cada situación.", icono: svg('<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>') },
  memorama: { nombre: "Memorama", instruccion: "Encuentra cada término con su definición.", icono: svg('<rect x="2.5" y="6" width="10" height="14" rx="2"/><path d="M14 4.4l5.3 1.1a2 2 0 0 1 1.6 2.4l-2.3 10.9a2 2 0 0 1-2.4 1.5l-1.7-.4"/><path d="M7.5 10.5v5M5 13h5"/>') },
  ordenar: { nombre: "Ordena el proceso", instruccion: "Acomoda los pasos en el orden correcto.", icono: svg('<path d="M10 6h11M10 12h11M10 18h11"/><path d="M4 4h1.5v4M4 8h3"/><path d="M3.5 14.5a1.6 1.6 0 0 1 3.2 0c0 1.1-3.2 2.3-3.2 3.5h3.2"/>') },
  clasificar: { nombre: "Clasifica", instruccion: "Coloca cada elemento en la categoría que le corresponde.", icono: svg('<rect x="3" y="4" width="7.5" height="16" rx="1.8"/><rect x="13.5" y="4" width="7.5" height="16" rx="1.8"/><path d="M5.5 8.5h2.5M5.5 12h2.5M16 8.5h2.5"/>') },
  ahorcado: { nombre: "Adivina la palabra", instruccion: "Descubre el término técnico antes de cometer 6 errores.", icono: svg('<path d="M3.5 17 7.5 6l4 11M5 13h5"/><path d="M14 17h7"/><path d="M16.5 7h2.5a1.5 1.5 0 0 1 0 3h-2.5V5.5"/>') },
  completar: { nombre: "Completa la frase", instruccion: "Coloca cada palabra en el espacio correcto.", icono: svg('<path d="M4 6h16M4 12h4M16 12h4M4 18h10"/><rect x="9.5" y="9.5" width="5" height="5" rx="1.2"/>') }
};

const CALIDAD: GameConfig[] = [
  // 1 · Fundamentos de ISO 9001 en obra
  { tipo: "sopa", palabras: ["CALIDAD", "PROCESO", "CLIENTE", "RIESGO", "EVIDENCIA", "MEJORA", "AUDITORIA", "REGISTRO"] },
  // 2 · Alcance y mapa de procesos
  {
    tipo: "ordenar",
    pregunta: "¿En qué orden se construye el sistema de calidad de una obra?",
    pasos: [
      "Identificar los requisitos del cliente y del contrato",
      "Definir el alcance y el mapa de procesos",
      "Asignar responsables y recursos a cada proceso",
      "Ejecutar los trabajos con procedimientos aprobados",
      "Medir, inspeccionar y verificar los resultados",
      "Corregir y mejorar el proceso"
    ]
  },
  // 3 · Control documental y registros
  {
    tipo: "memorama",
    pares: [
      { termino: "Procedimiento", definicion: "Describe cómo se realiza una actividad" },
      { termino: "Registro", definicion: "Evidencia de una actividad ya realizada" },
      { termino: "Plano vigente", definicion: "Última revisión aprobada para construir" },
      { termino: "Lista maestra", definicion: "Controla documentos y sus revisiones" },
      { termino: "Bitácora", definicion: "Registro oficial de los hechos de la obra" },
      { termino: "Documento obsoleto", definicion: "Se retira del frente y no debe usarse" }
    ]
  },
  // 4 · Responsabilidades y competencias
  {
    tipo: "crucigrama",
    entradas: [
      { palabra: "RESIDENTE", pista: "Responsable técnico de la ejecución en el sitio" },
      { palabra: "SUPERVISOR", pista: "Verifica que lo ejecutado cumpla con el proyecto" },
      { palabra: "COMPETENCIA", pista: "Capacidad demostrada para aplicar conocimientos" },
      { palabra: "CAPACITACION", pista: "Acción para cerrar una brecha de conocimiento" },
      { palabra: "PERFIL", pista: "Requisitos que describen un puesto" },
      { palabra: "MATRIZ", pista: "Tabla que asigna responsables a cada actividad" }
    ]
  },
  // 5 · Inspección, pruebas y liberación
  {
    tipo: "plano",
    plano: "obra",
    rondas: [
      { pregunta: "¿Dónde se toman las muestras de concreto para revenimiento y cilindros?", zona: "colado", explicacion: "Las muestras se toman en el frente de colado, del concreto que realmente se coloca en el elemento." },
      { pregunta: "¿Dónde verificas diámetro, grado y estado del acero antes de habilitarlo?", zona: "acero", explicacion: "La inspección de recepción se hace en el patio de habilitado, antes de cortar y doblar." },
      { pregunta: "¿Dónde se resguardan las liberaciones firmadas y los resultados de laboratorio?", zona: "caseta", explicacion: "Los registros de calidad se controlan en la oficina de obra, junto con la bitácora." }
    ]
  },
  // 6 · No conformidades y acciones correctivas
  {
    tipo: "clasificar",
    pregunta: "¿Es una corrección inmediata o una acción correctiva?",
    categorias: ["Corrección", "Acción correctiva"],
    elementos: [
      { texto: "Reparar la zona con nido de grava", categoria: 0 },
      { texto: "Sellar la fuga detectada en la prueba", categoria: 0 },
      { texto: "Retirar del frente el material rechazado", categoria: 0 },
      { texto: "Capacitar a la cuadrilla en el vibrado del concreto", categoria: 1 },
      { texto: "Cambiar el procedimiento de recepción de materiales", categoria: 1 },
      { texto: "Analizar la causa raíz y ajustar el plan de inspección", categoria: 1 }
    ]
  },
  // 7 · Auditoría interna de obra
  {
    tipo: "ahorcado",
    palabras: [
      { palabra: "HALLAZGO", pista: "Resultado de comparar la evidencia contra un criterio de auditoría" },
      { palabra: "EVIDENCIA", pista: "Registros o hechos verificables que sustentan una conclusión" },
      { palabra: "CRITERIO", pista: "Requisito o referencia contra la que se compara lo auditado" }
    ]
  },
  // 8 · Indicadores y mejora continua
  { tipo: "rompecabezas", lado: 3, mensaje: "Como en la mejora continua: cada pieza en su lugar hace que el sistema funcione." },
  // 9 · Implementación del sistema en la constructora
  {
    tipo: "completar",
    texto: "Para implementar ISO 9001 primero se define la [política] de calidad, luego se identifican los [procesos] y sus responsables, se controlan los [documentos] y registros, se realizan [auditorías] internas y la dirección revisa los resultados para la [mejora] continua.",
    distractores: ["cotización", "nómina"]
  }
];

const GENERADORES: GameConfig[] = [
  // 1 · Alcance de generadores y estimaciones
  {
    tipo: "memorama",
    pares: [
      { termino: "Generador", definicion: "Hoja que soporta la cantidad de un concepto" },
      { termino: "Estimación", definicion: "Cobro de los trabajos ejecutados en un periodo" },
      { termino: "Concepto", definicion: "Partida del catálogo con unidad y precio" },
      { termino: "Unidad", definicion: "Forma de medir: m³, m², kg o pieza" },
      { termino: "Croquis", definicion: "Dibujo que ubica lo que se midió" },
      { termino: "Soporte", definicion: "Evidencia que respalda la cantidad cobrada" }
    ]
  },
  // 2 · Lectura de planos y catálogo de conceptos
  {
    tipo: "plano",
    plano: "planta",
    rondas: [
      { pregunta: "Señala un eje: la línea de referencia para ubicar elementos.", zona: "eje", explicacion: "Los ejes son la retícula de referencia; todo se localiza respecto a ellos." },
      { pregunta: "¿Dónde está una columna estructural?", zona: "columna", explicacion: "Las columnas se dibujan rellenas en las intersecciones de ejes." },
      { pregunta: "Señala la escalera.", zona: "escalera", explicacion: "La escalera se representa con huellas paralelas y una flecha de sentido de subida." }
    ]
  },
  // 3 · Cuantificación de volúmenes de obra
  {
    tipo: "crucigrama",
    entradas: [
      { palabra: "VOLUMEN", pista: "Cantidad medida en metros cúbicos" },
      { palabra: "AREA", pista: "Cantidad medida en metros cuadrados" },
      { palabra: "ABUNDAMIENTO", pista: "Aumento de volumen del suelo al excavarlo" },
      { palabra: "DESPERDICIO", pista: "Porcentaje de material que se pierde en la ejecución" },
      { palabra: "ESPESOR", pista: "Dimensión que multiplica al área de una losa" },
      { palabra: "CUBICACION", pista: "Cálculo del volumen de un elemento" }
    ]
  },
  // 4 · Números generadores por partidas
  {
    tipo: "clasificar",
    pregunta: "¿A qué partida pertenece cada concepto?",
    categorias: ["Preliminares", "Cimentación", "Estructura"],
    elementos: [
      { texto: "Trazo y nivelación del terreno", categoria: 0 },
      { texto: "Limpieza y despalme", categoria: 0 },
      { texto: "Excavación para zapatas", categoria: 1 },
      { texto: "Plantilla de concreto pobre", categoria: 1 },
      { texto: "Colado de columnas", categoria: 2 },
      { texto: "Cimbra de losa", categoria: 2 }
    ]
  },
  // 5 · Elaboración de estimaciones
  {
    tipo: "ordenar",
    pregunta: "Ordena el proceso para integrar una estimación.",
    pasos: [
      "Medir en campo lo ejecutado en el periodo",
      "Elaborar los números generadores",
      "Integrar croquis y fotografías de soporte",
      "Calcular importes con los precios unitarios",
      "Aplicar amortización del anticipo y retenciones",
      "Entregar a supervisión para su revisión"
    ]
  },
  // 6 · Precios unitarios y control de conceptos
  {
    tipo: "completar",
    texto: "Un precio unitario se integra con el costo [directo] (materiales, mano de obra y equipo), más los [indirectos], el [financiamiento], la [utilidad] y los cargos adicionales.",
    distractores: ["volumen", "anticipo"]
  },
  // 7 · Evidencia y soporte de campo
  { tipo: "sopa", palabras: ["CROQUIS", "FOTOGRAFIA", "BITACORA", "MEDICION", "FIRMA", "UBICACION", "SOPORTE"] },
  // 8 · Presupuestos, avances y estimaciones
  { tipo: "rompecabezas", lado: 3, mensaje: "Presupuesto, avance y estimación encajan cuando cada pieza está bien medida." },
  // 9 · Revisión, conciliación y correcciones
  {
    tipo: "ahorcado",
    palabras: [
      { palabra: "CONCILIACION", pista: "Acuerdo entre contratista y supervisión sobre las cantidades" },
      { palabra: "DEDUCTIVA", pista: "Disminución de cantidades o conceptos respecto al contrato" },
      { palabra: "ADITIVA", pista: "Incremento de cantidades respecto a lo contratado" }
    ]
  },
  // 10 · Cierre del caso aplicado
  {
    tipo: "plano",
    plano: "planta",
    rondas: [
      { pregunta: "Para el generador de aplanados, ¿qué elemento mides en m²?", zona: "muro", explicacion: "Los aplanados se cuantifican por la superficie de muro, descontando vanos según el criterio del contrato." },
      { pregunta: "Señala la cota que te da la longitud a cuantificar.", zona: "cota", explicacion: "Las cotas dan las dimensiones reales; nunca se mide a escala sobre el plano." },
      { pregunta: "¿Qué elemento se cuantifica por pieza (pza)?", zona: "puerta", explicacion: "Puertas y ventanas se cobran por pieza según su tipo en el catálogo." }
    ]
  }
];

const SUPERINTENDENCIA: GameConfig[] = [
  // 1 · Rol técnico del superintendente
  {
    tipo: "crucigrama",
    entradas: [
      { palabra: "PROGRAMA", pista: "Plan de tiempos que el superintendente debe cumplir" },
      { palabra: "CALIDAD", pista: "Cumplir especificaciones y requisitos del proyecto" },
      { palabra: "SEGURIDAD", pista: "Prevenir accidentes del personal en campo" },
      { palabra: "COSTO", pista: "Lo que se controla contra el presupuesto" },
      { palabra: "LIDERAZGO", pista: "Habilidad para dirigir cuadrillas y contratistas" },
      { palabra: "CONTRATO", pista: "Documento que fija alcance, plazo y precio" }
    ]
  },
  // 2 · Planeación y arranque de obra
  {
    tipo: "plano",
    plano: "obra",
    rondas: [
      { pregunta: "¿Dónde conviene la oficina de obra para controlar quién entra?", zona: "caseta", explicacion: "Junto al acceso, la oficina controla personal, materiales y visitas desde el primer día." },
      { pregunta: "Ubica el acopio de arena y grava.", zona: "agregados", explicacion: "El acopio debe estar cerca de la zona de mezclado y con acceso para camiones." },
      { pregunta: "¿Dónde se ubica el punto de reunión de emergencia?", zona: "reunion", explicacion: "En una zona abierta, alejada de la estructura, la grúa y las excavaciones." }
    ]
  },
  // 3 · Coordinación de contratistas y cuadrillas
  {
    tipo: "memorama",
    pares: [
      { termino: "Contratista", definicion: "Empresa que ejecuta una parte de la obra" },
      { termino: "Cuadrilla", definicion: "Grupo de trabajadores de un mismo oficio" },
      { termino: "Junta de coordinación", definicion: "Reunión semanal de avances y compromisos" },
      { termino: "Frente de trabajo", definicion: "Zona asignada a una cuadrilla" },
      { termino: "Lookahead", definicion: "Planeación de corto plazo con restricciones" },
      { termino: "Restricción", definicion: "Lo que impide iniciar una actividad" }
    ]
  },
  // 4 · Control de programa y avances
  {
    tipo: "ordenar",
    pregunta: "Ordena el ciclo para controlar el programa de obra.",
    pasos: [
      "Definir la línea base del programa",
      "Medir el avance real en campo",
      "Comparar lo programado contra lo real (curva S)",
      "Identificar atrasos en la ruta crítica",
      "Definir acciones de recuperación con responsables",
      "Dar seguimiento semanal a los compromisos"
    ]
  },
  // 5 · Bitácora, reportes y comunicación
  {
    tipo: "completar",
    texto: "Cada nota de [bitácora] debe llevar fecha, describir el hecho de forma [objetiva], identificar al [responsable] y tener [seguimiento] hasta su cierre.",
    distractores: ["verbal", "opcional"]
  },
  // 6 · Calidad y liberación de trabajos
  {
    tipo: "clasificar",
    pregunta: "¿Se puede liberar o se debe detener?",
    categorias: ["Liberar", "Detener"],
    elementos: [
      { texto: "Acero con recubrimientos y separadores correctos", categoria: 0 },
      { texto: "Prueba hidráulica sin caída de presión", categoria: 0 },
      { texto: "Cimbra plomeada y bien apuntalada", categoria: 0 },
      { texto: "Losa con nidos de grava sin reparar", categoria: 1 },
      { texto: "Instalación oculta sin prueba de presión", categoria: 1 },
      { texto: "Relleno con compactación bajo especificación", categoria: 1 }
    ]
  },
  // 7 · Seguridad y prevención en campo
  {
    tipo: "plano",
    plano: "obra",
    rondas: [
      { pregunta: "Señala la zona con mayor riesgo de caída de objetos.", zona: "grua", explicacion: "El radio de giro de la grúa se delimita y nadie permanece bajo la carga suspendida." },
      { pregunta: "¿Dónde se requiere talud o entibado antes de que entre personal?", zona: "excavacion", explicacion: "Las paredes de una excavación profunda deben estabilizarse para evitar derrumbes." },
      { pregunta: "¿A dónde se dirige el personal durante una evacuación?", zona: "reunion", explicacion: "El punto de reunión permite contar al personal y confirmar que nadie quedó dentro." }
    ]
  },
  // 8 · Control administrativo de la obra
  { tipo: "sopa", palabras: ["ESTIMACION", "ANTICIPO", "NOMINA", "CONTRATO", "FACTURA", "PRESUPUESTO", "RETENCION"] },
  // 9 · Entrega, pendientes y cierre
  {
    tipo: "ahorcado",
    palabras: [
      { palabra: "FINIQUITO", pista: "Documento que cierra la relación económica del contrato" },
      { palabra: "GARANTIA", pista: "Fianza que cubre defectos y vicios ocultos después de la entrega" },
      { palabra: "PLANOS", pista: "Se entregan \"as built\" con lo que realmente se construyó" }
    ]
  },
  // 10 · Caso integral de superintendencia
  { tipo: "rompecabezas", lado: 3, mensaje: "Así es la superintendencia: coordinar cada pieza hasta entregar la obra completa." }
];

// Para cursos nuevos sin contenido propio: rotación de juegos generales.
const GENERALES: GameConfig[] = [
  { tipo: "sopa", palabras: ["OBRA", "CALIDAD", "SEGURIDAD", "PROGRAMA", "COSTO", "BITACORA", "PLANO"] },
  { tipo: "rompecabezas", lado: 3, mensaje: "¡Pieza por pieza se construye una gran obra!" },
  {
    tipo: "memorama",
    pares: [
      { termino: "Bitácora", definicion: "Registro oficial de los hechos de la obra" },
      { termino: "Estimación", definicion: "Cobro de trabajos ejecutados en un periodo" },
      { termino: "Plano vigente", definicion: "Última revisión aprobada para construir" },
      { termino: "Curva S", definicion: "Avance acumulado programado contra real" }
    ]
  }
];

function grupoCurso(tituloCurso: string): GameConfig[] {
  const t = String(tituloCurso || "").toLowerCase();
  if (t.includes("calidad") || t.includes("9001")) return CALIDAD;
  if (t.includes("generador") || t.includes("estimacion") || t.includes("estimación")) return GENERADORES;
  if (t.includes("superintend")) return SUPERINTENDENCIA;
  return GENERALES;
}

export function juegoDeClase(tituloCurso: string, indiceClase: number): GameConfig {
  const lista = grupoCurso(tituloCurso);
  const i = Math.max(0, Number(indiceClase) || 0);
  return lista[i] || lista[i % lista.length];
}
