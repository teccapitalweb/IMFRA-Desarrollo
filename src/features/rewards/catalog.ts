import corrosionImage from "../../../assets/quiz/concreto-corrosion-acero.webp";
import depositosImage from "../../../assets/quiz/concreto-depositos-blancos.webp";
import estructuraColumnaImage from "../../../assets/quiz/estructura-columna.jpg";
import estructuraVigaDetalleImage from "../../../assets/quiz/estructura-viga-detalle.jpg";
import estructuraVigaReforzadaImage from "../../../assets/quiz/estructura-viga-reforzada.jpg";
import estructuraZapataImage from "../../../assets/quiz/estructura-zapata.jpg";
import grietaImage from "../../../assets/quiz/concreto-grieta.webp";
import nidoGravaImage from "../../../assets/quiz/concreto-nido-grava.webp";

export interface RewardQuestion {
  id: string;
  area: string;
  type: "concept" | "case" | "measurement" | "visual";
  difficulty: "Fundamental" | "Intermedio" | "Avanzado";
  question: string;
  context?: string;
  visual?: "slab-plan" | "curve-s";
  optionVisuals?: Array<"honeycomb" | "crack" | "efflorescence" | "corrosion" | "beam" | "column" | "slab" | "footing">;
  optionImages?: string[];
  options: string[];
  correct: number;
  explanation: string;
}

export interface RewardItem {
  id: string;
  name: string;
  description: string;
  category: "Software" | "Recursos";
  points: number;
  availability: string;
  accent: string;
  brand?: string;
  durationDays?: number;
  accessUrl?: string;
  featured?: boolean;
  features?: string[];
}

export const rewardQuestions: RewardQuestion[] = [
  {
    id: "concreto-curado-01",
    area: "Supervisión de obra",
    type: "concept",
    difficulty: "Fundamental",
    question: "¿Cuál es el objetivo principal del curado del concreto?",
    options: [
      "Aumentar inmediatamente su temperatura",
      "Mantener humedad y temperatura para favorecer la hidratación",
      "Eliminar la necesidad de juntas",
      "Reducir el contenido de cemento"
    ],
    correct: 1,
    explanation: "El curado limita la pérdida prematura de humedad y mantiene condiciones favorables para que continúe la hidratación del cemento."
  },
  {
    id: "programa-curva-s-01",
    area: "Control de proyectos",
    type: "case",
    difficulty: "Intermedio",
    question: "En una Curva S, ¿qué representa normalmente el eje vertical?",
    context: "El residente revisa el reporte semanal y necesita comparar el avance programado con el ejecutado.",
    options: [
      "El avance o costo acumulado",
      "La cantidad de trabajadores por turno",
      "La resistencia del concreto",
      "El número de planos aprobados"
    ],
    correct: 0,
    explanation: "La Curva S compara el avance o costo acumulado contra el tiempo y facilita identificar desviaciones entre lo programado y lo ejecutado."
  },
  {
    id: "estimaciones-generadores-01",
    area: "Costos y estimaciones",
    type: "case",
    difficulty: "Fundamental",
    question: "¿Qué función cumplen los números generadores en una estimación de obra?",
    context: "El contratista presenta una estimación, pero la supervisión solicita evidencia trazable de cada volumen cobrado.",
    options: [
      "Sustituir el contrato",
      "Documentar y justificar las cantidades ejecutadas",
      "Definir el organigrama del proyecto",
      "Calcular únicamente el IVA"
    ],
    correct: 1,
    explanation: "Los generadores respaldan las cantidades ejecutadas mediante mediciones, operaciones y referencias de ubicación verificables."
  },
  {
    id: "seguridad-bitacora-01",
    area: "Administración de obra",
    type: "concept",
    difficulty: "Intermedio",
    question: "¿Qué característica debe tener una anotación profesional en bitácora?",
    options: [
      "Ser ambigua para evitar responsabilidades",
      "Incluir hechos verificables, fecha, responsables y seguimiento",
      "Registrar solamente acuerdos verbales",
      "Omitir incidencias menores"
    ],
    correct: 1,
    explanation: "Una anotación útil debe ser objetiva, trazable y suficientemente específica para facilitar acuerdos y seguimiento."
  },
  {
    id: "patologia-concreto-01",
    area: "Patología del concreto",
    type: "visual",
    difficulty: "Intermedio",
    question: "¿Cuál de estas superficies presenta oquedades o segregación tipo ‘nido de grava’ (honeycombing)?",
    context: "Durante el descimbrado se inspeccionan cuatro zonas antes de autorizar el siguiente frente.",
    optionImages: [
      nidoGravaImage,
      grietaImage,
      depositosImage,
      corrosionImage
    ],
    options: ["Detalle A", "Detalle B", "Detalle C", "Detalle D"],
    correct: 0,
    explanation: "El nido de grava se reconoce por vacíos irregulares y agregado grueso expuesto. Suele relacionarse con compactación deficiente, mezcla poco trabajable o fugas en la cimbra."
  },
  {
    id: "volumen-losa-01",
    area: "Cuantificación de obra",
    type: "measurement",
    difficulty: "Intermedio",
    question: "¿Qué volumen de concreto debe solicitarse incluyendo 5% de desperdicio?",
    context: "Losa rectangular de 4.20 m × 3.60 m, con 12 cm de espesor uniforme. Redondea a dos decimales.",
    visual: "slab-plan",
    options: ["1.72 m³", "1.81 m³", "1.90 m³", "2.04 m³"],
    correct: 2,
    explanation: "Volumen neto: 4.20 × 3.60 × 0.12 = 1.8144 m³. Con 5% de desperdicio: 1.8144 × 1.05 = 1.9051 m³, aproximadamente 1.90 m³."
  },
  {
    id: "detalle-estructural-01",
    area: "Estructuras",
    type: "visual",
    difficulty: "Fundamental",
    question: "¿Cuál esquema corresponde a una viga de concreto reforzado con acero longitudinal y estribos cerrados?",
    context: "Selecciona el detalle que representa correctamente el elemento descrito.",
    optionImages: [
      estructuraColumnaImage,
      estructuraVigaReforzadaImage,
      estructuraZapataImage,
      estructuraVigaDetalleImage
    ],
    options: ["Detalle A", "Detalle B", "Detalle C", "Detalle D"],
    correct: 1,
    explanation: "La viga se representa como un elemento horizontal con barras longitudinales y estribos cerrados distribuidos a lo largo de su claro."
  },
  {
    id: "curva-s-desviacion-01",
    area: "Planeación y control",
    type: "case",
    difficulty: "Avanzado",
    question: "Si la curva de avance ejecutado se mantiene por debajo de la programada, ¿cuál es la primera conclusión correcta?",
    context: "En el corte de la semana 8, el avance planeado es 48% y el avance físico verificado es 39%.",
    visual: "curve-s",
    options: ["La obra presenta un adelanto de 9 puntos", "Existe un atraso de 9 puntos porcentuales", "El costo real necesariamente es menor", "La calidad de la obra es insuficiente"],
    correct: 1,
    explanation: "La diferencia entre 48% programado y 39% ejecutado indica un atraso físico de 9 puntos porcentuales. El gráfico por sí solo no permite concluir sobre costo o calidad."
  },
  {
    id: "patologia-corrosion-01",
    area: "Patología del concreto",
    type: "visual",
    difficulty: "Avanzado",
    question: "¿Qué detalle muestra la evidencia más clara de corrosión activa del acero de refuerzo?",
    context: "La supervisión debe priorizar la zona con mayor riesgo de pérdida de sección y desprendimiento del recubrimiento.",
    optionImages: [
      grietaImage,
      corrosionImage,
      nidoGravaImage,
      depositosImage
    ],
    options: ["Detalle A", "Detalle B", "Detalle C", "Detalle D"],
    correct: 1,
    explanation: "El acero expuesto, el óxido y el desprendimiento del recubrimiento son señales directas de corrosión. Debe evaluarse alcance, sección remanente, causa de ingreso de humedad y reparación compatible."
  },
  {
    id: "patologia-depositos-01",
    area: "Patología del concreto",
    type: "visual",
    difficulty: "Intermedio",
    question: "¿Qué imagen amerita investigar el paso de humedad por depósitos blancos superficiales?",
    context: "No se busca emitir un dictamen definitivo con una fotografía, sino reconocer la señal que requiere inspección y pruebas complementarias.",
    optionImages: [
      corrosionImage,
      nidoGravaImage,
      grietaImage,
      depositosImage
    ],
    options: ["Detalle A", "Detalle B", "Detalle C", "Detalle D"],
    correct: 3,
    explanation: "Los depósitos blancos pueden relacionarse con migración de humedad y sales, eflorescencia o lixiviación. La imagen orienta la inspección, pero la causa debe confirmarse en sitio."
  },
  {
    id: "volumen-zanja-01",
    area: "Cuantificación de obra",
    type: "measurement",
    difficulty: "Fundamental",
    question: "¿Cuál es el volumen teórico de excavación de la zanja?",
    context: "Zanja de 12.00 m de longitud, 0.60 m de ancho y 0.80 m de profundidad uniforme.",
    options: ["4.80 m³", "5.28 m³", "5.76 m³", "6.40 m³"],
    correct: 2,
    explanation: "El volumen rectangular es longitud × ancho × profundidad: 12.00 × 0.60 × 0.80 = 5.76 m³. Abundamiento o sobreexcavación se calculan por separado."
  },
  {
    id: "mamposteria-piezas-01",
    area: "Cuantificación de obra",
    type: "measurement",
    difficulty: "Avanzado",
    question: "¿Cuántos bloques deben solicitarse, redondeando a pieza completa?",
    context: "Muro de 6.00 × 2.80 m con un vano de 1.20 × 2.10 m. Rendimiento: 12.5 bloques/m². Considera 5% de desperdicio.",
    options: ["179 bloques", "183 bloques", "188 bloques", "201 bloques"],
    correct: 2,
    explanation: "Área neta: 16.80 − 2.52 = 14.28 m². Consumo: 14.28 × 12.5 = 178.5 bloques. Con 5%: 187.425; se solicitan 188 piezas."
  },
  {
    id: "rendimiento-cuadrilla-01",
    area: "Planeación y control",
    type: "measurement",
    difficulty: "Intermedio",
    question: "¿Cuántos días completos requiere la cuadrilla para terminar el frente?",
    context: "Quedan 186 m² de acabado. El rendimiento verificado es 42 m² por jornada y no se considera una segunda cuadrilla.",
    options: ["4 días", "5 días", "6 días", "8 días"],
    correct: 1,
    explanation: "186 ÷ 42 = 4.43 jornadas. Como el trabajo no termina al cierre del cuarto día, deben programarse 5 días completos."
  },
  {
    id: "caso-plano-rfi-01",
    area: "Coordinación de proyecto",
    type: "case",
    difficulty: "Avanzado",
    question: "¿Cuál es la actuación profesional antes de ejecutar?",
    context: "El plano estructural y el arquitectónico muestran cotas distintas para el mismo vano. La cuadrilla solicita una decisión inmediata.",
    options: [
      "Usar la cota más grande para evitar demoliciones",
      "Promediar ambas cotas y documentarlo después",
      "Detener ese frente, emitir una consulta/RFI y dejar trazabilidad",
      "Seguir únicamente la instrucción verbal del contratista"
    ],
    correct: 2,
    explanation: "Una discrepancia entre documentos debe aclararse formalmente antes de ejecutar. La consulta técnica y su respuesta evitan decisiones sin respaldo y trabajos correctivos."
  },
  {
    id: "caso-colado-lluvia-01",
    area: "Supervisión de obra",
    type: "case",
    difficulty: "Intermedio",
    question: "¿Qué decisión es la más adecuada?",
    context: "Se aproxima lluvia intensa; el colado aún no comienza y no existen cubiertas, bombeo ni un plan de protección disponible.",
    options: [
      "Iniciar para no perder la jornada",
      "Posponer y reprogramar cuando existan condiciones y protección",
      "Agregar cemento en obra para compensar el agua",
      "Colar únicamente las zonas visibles"
    ],
    correct: 1,
    explanation: "Sin protección ni capacidad de controlar el agua, iniciar aumenta el riesgo de afectar relación agua/cemento, acabado, juntas y seguridad. Debe reprogramarse y documentarse."
  },
  {
    id: "caso-epp-altura-01",
    area: "Seguridad en obra",
    type: "case",
    difficulty: "Fundamental",
    question: "¿Cuál debe ser la primera acción de la supervisión?",
    context: "Un trabajador está por iniciar una actividad en borde de losa sin sistema de protección colectiva ni línea de vida habilitada.",
    options: [
      "Permitir cinco minutos si usa casco",
      "Detener la actividad y controlar el riesgo antes de continuar",
      "Tomar una fotografía y reportarlo al final del turno",
      "Pedirle que trabaje más lejos del borde sin otra medida"
    ],
    correct: 1,
    explanation: "Ante un riesgo grave e inmediato debe detenerse la actividad. Primero se implementan controles adecuados y se verifica autorización, equipo y procedimiento."
  },
  {
    id: "calidad-recepcion-concreto-01",
    area: "Control de calidad",
    type: "concept",
    difficulty: "Intermedio",
    question: "¿Qué registro aporta trazabilidad básica al recibir concreto premezclado?",
    options: [
      "Solo una fotografía del camión",
      "Remisión, hora, elemento, volumen, revenimiento y muestras realizadas",
      "El nombre del operador sin datos del suministro",
      "Únicamente la resistencia especificada en el plano"
    ],
    correct: 1,
    explanation: "La recepción debe vincular el suministro con el elemento y las verificaciones efectuadas. Así se puede rastrear cada lote y relacionarlo con sus resultados."
  },
  {
    id: "control-cambio-01",
    area: "Administración de obra",
    type: "concept",
    difficulty: "Avanzado",
    question: "¿Qué debe ocurrir antes de ejecutar un trabajo extraordinario con impacto en costo y plazo?",
    options: [
      "Ejecutarlo y negociar al cierre del proyecto",
      "Contar con alcance, cuantificación, impacto y autorización trazable",
      "Registrarlo solamente en una conversación de mensajería",
      "Cambiar el precio unitario original sin soporte"
    ],
    correct: 1,
    explanation: "El control de cambios requiere definir y autorizar alcance, costo y plazo antes de ejecutar, salvo una emergencia documentada con el procedimiento contractual correspondiente."
  }
];

// Catálogo provisional para validar la experiencia. Los nombres y costos
// definitivos se administrarán desde backend antes de publicar.
export const rewardCatalog: RewardItem[] = [
  {
    id: "software-presupuestos-7d",
    name: "Software de presupuestos",
    description: "Acceso temporal durante 7 días para preparar y revisar presupuestos de obra.",
    category: "Software",
    points: 350,
    availability: "Catálogo piloto",
    accent: "#f59d1a"
  },
  {
    id: "imdac-control-obra-30d",
    name: "IMDAC · Control de Obra",
    description: "Acceso profesional para centralizar el avance físico, financiero y documental de tus proyectos.",
    category: "Software",
    points: 600,
    availability: "30 días de acceso",
    accent: "#ee8d16",
    brand: "TEC Capital × IMDAC",
    durationDays: 30,
    accessUrl: "https://imdac-control-obra-web.vercel.app/login",
    featured: true,
    features: [
      "Seguimiento físico y financiero",
      "Control documental de obra",
      "Presupuestos, avances y estimaciones",
      "Panel ejecutivo por proyecto"
    ]
  },
  {
    id: "pack-plantillas-pro",
    name: "Pack de plantillas profesionales",
    description: "Formatos editables para supervisión, bitácora, estimaciones y control documental.",
    category: "Recursos",
    points: 500,
    availability: "Catálogo piloto",
    accent: "#0f9d78"
  }
];
