export interface RewardQuestion {
  id: string;
  area: string;
  question: string;
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
    question: "En una Curva S, ¿qué representa normalmente el eje vertical?",
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
    question: "¿Qué función cumplen los números generadores en una estimación de obra?",
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
    question: "¿Qué característica debe tener una anotación profesional en bitácora?",
    options: [
      "Ser ambigua para evitar responsabilidades",
      "Incluir hechos verificables, fecha, responsables y seguimiento",
      "Registrar solamente acuerdos verbales",
      "Omitir incidencias menores"
    ],
    correct: 1,
    explanation: "Una anotación útil debe ser objetiva, trazable y suficientemente específica para facilitar acuerdos y seguimiento."
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
