export interface CaseStep {
  prompt: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface TrainingCase {
  id: string;
  title: string;
  area: string;
  difficulty: "Fundamental" | "Intermedio" | "Avanzado";
  duration: string;
  scenario: string;
  objective: string;
  steps: CaseStep[];
}

export interface Flashcard {
  id: string;
  area: string;
  front: string;
  back: string;
}

export const trainingCases: TrainingCase[] = [
  {
    id: "colado-lluvia",
    title: "Colado ante lluvia intensa",
    area: "Supervisión",
    difficulty: "Intermedio",
    duration: "6 min",
    scenario: "Faltan 40 minutos para iniciar una losa. El pronóstico cambió y se aproxima lluvia intensa; no hay cubiertas ni bombeo preparado.",
    objective: "Proteger calidad, seguridad y trazabilidad antes de autorizar el frente.",
    steps: [
      { prompt: "¿Cuál es la primera decisión?", options: ["Iniciar para aprovechar el concreto", "Posponer el inicio y evaluar condiciones", "Agregar cemento en obra", "Colar solo el centro"], correct: 1, explanation: "Sin controles para lluvia, iniciar expone la mezcla, el acabado y la seguridad. Primero se detiene la autorización y se evalúa." },
      { prompt: "¿Qué debe quedar documentado?", options: ["Solo el pronóstico", "La decisión, condiciones, responsables y nueva programación", "Únicamente el volumen cancelado", "Nada si no comenzó el colado"], correct: 1, explanation: "La bitácora debe dejar hechos verificables, la decisión, responsables, afectaciones y seguimiento." },
      { prompt: "¿Cuándo puede reprogramarse?", options: ["Cuando la cuadrilla lo decida", "Cuando existan condiciones seguras y un plan de protección", "En cuanto deje de llover cinco minutos", "Solo al día siguiente"], correct: 1, explanation: "La reprogramación depende de condiciones verificadas, accesos seguros, protección disponible y coordinación del suministro." }
    ]
  },
  {
    id: "discrepancia-planos",
    title: "Discrepancia entre planos",
    area: "Coordinación",
    difficulty: "Avanzado",
    duration: "7 min",
    scenario: "El plano estructural y el arquitectónico muestran cotas diferentes para un vano que se ejecutará hoy.",
    objective: "Resolver una interferencia sin improvisar ni perder trazabilidad contractual.",
    steps: [
      { prompt: "¿Qué acción corresponde primero?", options: ["Promediar las cotas", "Detener ese frente y emitir una consulta técnica", "Usar la cota mayor", "Seguir la orden verbal"], correct: 1, explanation: "La discrepancia debe aclararse formalmente antes de construir el elemento afectado." },
      { prompt: "¿Qué evidencia debe acompañar la consulta?", options: ["Un mensaje informal", "Planos, revisión, ubicación y descripción de impacto", "Solo una fotografía", "El nombre del dibujante"], correct: 1, explanation: "Una RFI útil identifica documentos, revisión, ubicación, conflicto e impacto potencial." },
      { prompt: "¿Qué autoriza reiniciar?", options: ["La respuesta trazable del responsable facultado", "La opinión mayoritaria de la cuadrilla", "Una nota sin firma", "El paso de 24 horas"], correct: 0, explanation: "La respuesta debe provenir del responsable con autoridad y quedar vinculada a los documentos del proyecto." }
    ]
  },
  {
    id: "corrosion-elemento",
    title: "Acero expuesto y corrosión",
    area: "Patología",
    difficulty: "Avanzado",
    duration: "8 min",
    scenario: "Durante una inspección se observa desprendimiento del recubrimiento, acero expuesto y productos de corrosión.",
    objective: "Priorizar seguridad, diagnóstico y reparación compatible.",
    steps: [
      { prompt: "¿Qué debe evitarse?", options: ["Delimitar la zona", "Cubrir con mortero sin diagnóstico", "Registrar extensión", "Solicitar evaluación"], correct: 1, explanation: "Ocultar la lesión sin determinar causa, sección remanente y alcance puede agravar el problema." },
      { prompt: "¿Qué información es prioritaria?", options: ["Color de la pintura", "Extensión, profundidad, sección del acero y fuente de humedad", "Edad del operador", "Marca de la cimbra"], correct: 1, explanation: "Esos datos permiten valorar capacidad, durabilidad y el sistema de reparación requerido." },
      { prompt: "¿Cuál es el enfoque correcto?", options: ["Reparar solo la apariencia", "Eliminar causa, sanear, tratar acero y restituir protección", "Aplicar yeso", "Aumentar carga para probar"], correct: 1, explanation: "La reparación debe atender la causa y restablecer protección, adherencia y geometría con un procedimiento diseñado." }
    ]
  },
  {
    id: "estimacion-sin-soporte",
    title: "Estimación sin generadores",
    area: "Costos",
    difficulty: "Intermedio",
    duration: "6 min",
    scenario: "El contratista presenta una estimación con cantidades mayores al avance observado y sin generadores firmados.",
    objective: "Validar cantidades ejecutadas y proteger el control financiero.",
    steps: [
      { prompt: "¿Qué procede?", options: ["Pagar para evitar atraso", "Solicitar soporte y verificar en campo", "Reducir 10% arbitrariamente", "Aceptar el resumen"], correct: 1, explanation: "La estimación debe sustentarse con mediciones y referencias verificables." },
      { prompt: "¿Qué integra un generador útil?", options: ["Medidas, operaciones, croquis y ubicación", "Solo el importe", "Una firma sin fecha", "El catálogo completo"], correct: 0, explanation: "El generador permite reconstruir cómo se obtuvo cada cantidad y dónde fue ejecutada." },
      { prompt: "¿Cómo se trata la diferencia?", options: ["Se documenta y concilia antes de autorizar", "Se deja para el finiquito", "Se elimina la partida", "Se cambia el contrato verbalmente"], correct: 0, explanation: "La conciliación previa mantiene trazabilidad y evita acumular controversias." }
    ]
  },
  {
    id: "trabajo-altura",
    title: "Riesgo en borde de losa",
    area: "Seguridad",
    difficulty: "Fundamental",
    duration: "5 min",
    scenario: "Un trabajador se prepara para laborar junto al borde de una losa sin protección colectiva ni sistema personal habilitado.",
    objective: "Aplicar la jerarquía de controles ante un riesgo grave e inmediato.",
    steps: [
      { prompt: "¿Primera acción?", options: ["Tomar una foto", "Detener la actividad", "Entregar solo casco", "Reducir el tiempo"], correct: 1, explanation: "El riesgo de caída exige detener la exposición antes de continuar." },
      { prompt: "¿Qué debe verificarse?", options: ["Protección, anclajes, equipo, procedimiento y autorización", "Solo el arnés", "La experiencia del trabajador", "El clima únicamente"], correct: 0, explanation: "El control requiere un sistema completo, compatible y verificado, no una sola pieza de equipo." },
      { prompt: "¿Qué registro corresponde?", options: ["Acción correctiva y liberación del frente", "Ninguno si no ocurrió accidente", "Solo una amonestación", "Un mensaje privado"], correct: 0, explanation: "La corrección y la posterior liberación deben documentarse para seguimiento preventivo." }
    ]
  },
  {
    id: "desviacion-programa",
    title: "Recuperación de programa",
    area: "Planeación",
    difficulty: "Avanzado",
    duration: "7 min",
    scenario: "En la semana 8, el avance programado es 48% y el ejecutado verificado es 39%. Dos actividades críticas explican la mayor parte de la desviación.",
    objective: "Convertir una desviación de Curva S en un plan de recuperación controlable.",
    steps: [
      { prompt: "¿Cuál es el diagnóstico inicial?", options: ["Adelanto de 9%", "Atraso de 9 puntos porcentuales", "Ahorro de 9%", "Baja calidad confirmada"], correct: 1, explanation: "La diferencia expresa atraso físico; no demuestra por sí misma ahorro, sobrecosto o calidad." },
      { prompt: "¿Dónde debe enfocarse el análisis?", options: ["En todas las actividades por igual", "En ruta crítica, restricciones y rendimientos reales", "Solo en el costo acumulado", "En aumentar personal sin evaluar"], correct: 1, explanation: "Las acciones deben atacar causas y actividades que condicionan la fecha final." },
      { prompt: "¿Cómo se acepta un plan de recuperación?", options: ["Con metas, responsables, recursos y seguimiento semanal", "Con una promesa verbal", "Moviendo la línea base", "Ocultando el atraso"], correct: 0, explanation: "Un plan profesional es medible, asigna responsables y se revisa contra hitos de recuperación." }
    ]
  }
];

export const flashcards: Flashcard[] = [
  { id: "f01", area: "Concreto", front: "Curado", back: "Conjunto de medidas para mantener humedad y temperatura favorables durante la hidratación del cemento." },
  { id: "f02", area: "Concreto", front: "Nido de grava", back: "Vacíos y agregado expuesto asociados frecuentemente con compactación deficiente, baja trabajabilidad o fugas de lechada." },
  { id: "f03", area: "Concreto", front: "Revenimiento", back: "Ensayo de consistencia del concreto fresco; no sustituye el control de resistencia ni autoriza agregar agua." },
  { id: "f04", area: "Costos", front: "Número generador", back: "Soporte de cantidades ejecutadas mediante medidas, operaciones, croquis y ubicación trazable." },
  { id: "f05", area: "Costos", front: "Precio extraordinario", back: "Precio para un concepto no previsto, sustentado con alcance, análisis, cantidades y autorización contractual." },
  { id: "f06", area: "Costos", front: "Finiquito", back: "Cierre económico y documental que concilia obligaciones, cantidades, ajustes y saldos del contrato." },
  { id: "f07", area: "Planeación", front: "Ruta crítica", back: "Secuencia de actividades cuya duración condiciona la fecha de terminación del proyecto." },
  { id: "f08", area: "Planeación", front: "Curva S", back: "Representación acumulada de avance o costo contra tiempo para comparar plan y ejecución." },
  { id: "f09", area: "Planeación", front: "Restricción", back: "Condición que impide iniciar o terminar una actividad: información, suministro, acceso, decisión o recurso." },
  { id: "f10", area: "Calidad", front: "Trazabilidad", back: "Capacidad de relacionar un resultado con su lote, ubicación, fecha, responsable, documento y evidencia." },
  { id: "f11", area: "Calidad", front: "No conformidad", back: "Incumplimiento de un requisito especificado que debe registrarse, contenerse, corregirse y verificarse." },
  { id: "f12", area: "Calidad", front: "Liberación de frente", back: "Confirmación documentada de que condiciones y verificaciones permiten continuar la siguiente actividad." },
  { id: "f13", area: "Seguridad", front: "Jerarquía de controles", back: "Eliminar, sustituir, aplicar ingeniería, controles administrativos y finalmente equipo de protección personal." },
  { id: "f14", area: "Seguridad", front: "Riesgo grave e inmediato", back: "Condición con alta probabilidad o consecuencia severa que exige detener la exposición y controlar antes de continuar." },
  { id: "f15", area: "Documentación", front: "RFI / consulta técnica", back: "Solicitud formal para aclarar información contradictoria, insuficiente o ambigua antes de ejecutar." },
  { id: "f16", area: "Documentación", front: "Bitácora profesional", back: "Registro objetivo con fecha, hecho verificable, ubicación, responsables, instrucción y seguimiento." },
  { id: "f17", area: "Documentación", front: "Control de cambios", back: "Proceso para definir, evaluar, autorizar y rastrear modificaciones de alcance, costo o plazo." },
  { id: "f18", area: "Supervisión", front: "Punto de inspección", back: "Momento definido para verificar una actividad antes de cubrirla, continuarla o aceptar su resultado." }
];
