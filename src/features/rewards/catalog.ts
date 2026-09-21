export interface RewardQuestion {
  id: string;
  area: string;
  type: "concept" | "case" | "measurement" | "visual";
  difficulty: "Fundamental" | "Intermedio" | "Avanzado";
  question: string;
  context?: string;
  visual?: "slab-plan" | "curve-s";
  optionVisuals?: Array<"honeycomb" | "crack" | "efflorescence" | "corrosion" | "beam" | "column" | "slab" | "footing">;
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
    optionVisuals: ["honeycomb", "crack", "efflorescence", "corrosion"],
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
    optionVisuals: ["slab", "beam", "footing", "column"],
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
