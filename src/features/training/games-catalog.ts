import type { GameConfig, GameType } from "../class-games/content";

// ═══════════════════════════════════════════════════════════════════
// Juegos de obra en Retos · cada tipo tiene varios tableros.
// Cada día se propone un tablero distinto; el primero que se gana en el día
// por cada juego da Créditos IMFRA. Los demás quedan como práctica.
// Debe coincidir con GAME_TYPES / GAME_BOARDS de imfra-backend/lib/credits.js.
// ═══════════════════════════════════════════════════════════════════

export const GAME_CREDITS = 30;

export interface RetoGame {
  tipo: GameType;
  titulo: string;
  descripcion: string;
  color: string;
  tableros: { titulo: string; config: GameConfig }[];
}

export const retoGames: RetoGame[] = [
  {
    tipo: "crucigrama",
    titulo: "Crucigrama técnico",
    descripcion: "Resuelve términos de obra con sus pistas",
    color: "#e8890c",
    tableros: [
      {
        titulo: "Concreto",
        config: {
          tipo: "crucigrama",
          entradas: [
            { palabra: "REVENIMIENTO", pista: "Prueba que mide la consistencia del concreto fresco" },
            { palabra: "FRAGUADO", pista: "Etapa en que el concreto pierde plasticidad y empieza a endurecer" },
            { palabra: "CIMBRA", pista: "Molde temporal que da forma al concreto" },
            { palabra: "CURADO", pista: "Mantener la humedad para que el concreto alcance su resistencia" },
            { palabra: "VIBRADO", pista: "Se aplica para sacar el aire atrapado en la mezcla" },
            { palabra: "AGREGADO", pista: "Grava o arena que forma parte de la mezcla" },
            { palabra: "CEMENTO", pista: "Conglomerante que reacciona con el agua" }
          ]
        }
      },
      {
        titulo: "Administración de obra",
        config: {
          tipo: "crucigrama",
          entradas: [
            { palabra: "ESTIMACION", pista: "Documento para cobrar el avance ejecutado en un periodo" },
            { palabra: "BITACORA", pista: "Registro oficial de los hechos y acuerdos de la obra" },
            { palabra: "GENERADOR", pista: "Hoja que demuestra cómo se calculó una cantidad de obra" },
            { palabra: "ANTICIPO", pista: "Pago inicial para arrancar los trabajos" },
            { palabra: "PRESUPUESTO", pista: "Costo estimado de todos los conceptos de la obra" },
            { palabra: "RESIDENTE", pista: "Responsable técnico de la ejecución en el sitio" },
            { palabra: "FINIQUITO", pista: "Cierre económico final del contrato" }
          ]
        }
      },
      {
        titulo: "Estructuras",
        config: {
          tipo: "crucigrama",
          entradas: [
            { palabra: "ZAPATA", pista: "Cimentación aislada que recibe una columna" },
            { palabra: "TRABE", pista: "Elemento horizontal que recibe las cargas de la losa" },
            { palabra: "COLUMNA", pista: "Elemento vertical que baja las cargas a la cimentación" },
            { palabra: "ESTRIBO", pista: "Anillo de acero que confina el armado longitudinal" },
            { palabra: "CASTILLO", pista: "Elemento vertical de concreto que confina un muro" },
            { palabra: "DALA", pista: "Elemento horizontal que remata o liga un muro" },
            { palabra: "LOSA", pista: "Elemento plano que forma pisos y techos" }
          ]
        }
      },
      {
        titulo: "Seguridad en obra",
        config: {
          tipo: "crucigrama",
          entradas: [
            { palabra: "ANDAMIO", pista: "Estructura provisional para trabajar en altura" },
            { palabra: "ARNES", pista: "Equipo de cuerpo completo contra caídas" },
            { palabra: "TALUD", pista: "Inclinación de las paredes de una excavación" },
            { palabra: "ENTIBADO", pista: "Soporte que evita derrumbes en una zanja" },
            { palabra: "EXTINTOR", pista: "Equipo para combatir un conato de incendio" },
            { palabra: "BOTIQUIN", pista: "Material de primeros auxilios en el frente" },
            { palabra: "CASCO", pista: "Protege la cabeza de golpes y objetos que caen" }
          ]
        }
      }
    ]
  },
  {
    tipo: "memorama",
    titulo: "Memorama de obra",
    descripcion: "Une cada término con su definición",
    color: "#7a5ad6",
    tableros: [
      {
        titulo: "Materiales",
        config: {
          tipo: "memorama",
          pares: [
            { termino: "Mortero", definicion: "Mezcla de cemento, arena y agua para pegar piezas" },
            { termino: "Grava", definicion: "Agregado grueso del concreto" },
            { termino: "Aditivo", definicion: "Modifica propiedades de la mezcla, como el fraguado" },
            { termino: "Block", definicion: "Pieza hueca de concreto para muros" },
            { termino: "Varilla corrugada", definicion: "Acero con relieves para adherirse al concreto" },
            { termino: "Impermeabilizante", definicion: "Impide el paso del agua en azoteas" }
          ]
        }
      },
      {
        titulo: "Suelos y cimentación",
        config: {
          tipo: "memorama",
          pares: [
            { termino: "Mecánica de suelos", definicion: "Estudio que define la capacidad del terreno" },
            { termino: "Desplante", definicion: "Nivel donde se apoya la cimentación" },
            { termino: "Plantilla", definicion: "Capa de concreto pobre bajo la zapata" },
            { termino: "Compactación", definicion: "Reduce vacíos del suelo con energía mecánica" },
            { termino: "Pilote", definicion: "Elemento profundo que lleva la carga a estratos firmes" },
            { termino: "Relleno", definicion: "Material colocado en capas para recuperar niveles" }
          ]
        }
      },
      {
        titulo: "Control de obra",
        config: {
          tipo: "memorama",
          pares: [
            { termino: "Ruta crítica", definicion: "Actividades que, si se retrasan, retrasan la obra" },
            { termino: "Curva S", definicion: "Gráfica del avance acumulado contra el tiempo" },
            { termino: "Holgura", definicion: "Tiempo que una actividad puede atrasarse sin afectar" },
            { termino: "Precio unitario", definicion: "Costo de una unidad de concepto con indirectos y utilidad" },
            { termino: "Rendimiento", definicion: "Cantidad de trabajo que hace una cuadrilla por jornada" },
            { termino: "Orden de cambio", definicion: "Autoriza modificar alcance, costo o plazo" }
          ]
        }
      },
      {
        titulo: "Instalaciones",
        config: {
          tipo: "memorama",
          pares: [
            { termino: "Tinaco", definicion: "Depósito elevado que da presión por gravedad" },
            { termino: "Cisterna", definicion: "Depósito enterrado de almacenamiento de agua" },
            { termino: "Registro sanitario", definicion: "Permite inspeccionar y limpiar el drenaje" },
            { termino: "Tierra física", definicion: "Conduce corrientes de falla al terreno" },
            { termino: "Centro de carga", definicion: "Tablero con las pastillas de los circuitos" },
            { termino: "Prueba hidrostática", definicion: "Verifica que una tubería no tenga fugas" }
          ]
        }
      }
    ]
  },
  {
    tipo: "sopa",
    titulo: "Sopa de letras",
    descripcion: "Encuentra las palabras escondidas",
    color: "#13906f",
    tableros: [
      { titulo: "Herramientas", config: { tipo: "sopa", palabras: ["PALA", "NIVEL", "PLOMADA", "FLEXOMETRO", "CUCHARA", "MARRO", "LLANA", "SERRUCHO"] } },
      { titulo: "Materiales", config: { tipo: "sopa", palabras: ["GRAVA", "ARENA", "CEMENTO", "MORTERO", "TABIQUE", "VARILLA", "YESO", "ADITIVO"] } },
      { titulo: "Topografía", config: { tipo: "sopa", palabras: ["TRAZO", "COTA", "ESTACION", "BANCO", "PLANO", "ESCALA", "RUMBO", "NIVELACION"] } },
      { titulo: "Instalaciones", config: { tipo: "sopa", palabras: ["TUBERIA", "CODO", "VALVULA", "REGISTRO", "CABLE", "DUCTO", "BOMBA", "TINACO"] } }
    ]
  },
  {
    tipo: "ordenar",
    titulo: "Ordena el proceso",
    descripcion: "Acomoda los pasos como en la obra",
    color: "#2f6fdd",
    tableros: [
      {
        titulo: "Colado de losa",
        config: {
          tipo: "ordenar",
          pregunta: "¿En qué orden se cuela una losa de concreto?",
          pasos: [
            "Revisar cimbra y apuntalamiento",
            "Verificar armado, separadores y recubrimientos",
            "Humedecer la cimbra y limpiar el área",
            "Colocar y vibrar el concreto",
            "Nivelar y dar acabado a la superficie",
            "Curar el concreto durante los días indicados"
          ]
        }
      },
      {
        titulo: "Muro de block",
        config: {
          tipo: "ordenar",
          pregunta: "¿Cómo se levanta un muro de block?",
          pasos: [
            "Trazar los ejes y el paño del muro",
            "Asentar la primera hilada a nivel",
            "Levantar hiladas cuatrapeadas con mortero",
            "Colocar el armado de castillos",
            "Colar castillos y dala de cerramiento",
            "Aplanar o dar el acabado final"
          ]
        }
      },
      {
        titulo: "Zapata aislada",
        config: {
          tipo: "ordenar",
          pregunta: "¿Cuál es la secuencia para construir una zapata aislada?",
          pasos: [
            "Trazo y nivelación del eje",
            "Excavar hasta el nivel de desplante",
            "Colar la plantilla de concreto pobre",
            "Colocar parrilla y armado del dado",
            "Cimbrar y colar la zapata",
            "Rellenar y compactar en capas"
          ]
        }
      },
      {
        titulo: "Estimación de obra",
        config: {
          tipo: "ordenar",
          pregunta: "¿En qué orden se integra y cobra una estimación?",
          pasos: [
            "Medir el avance ejecutado en el periodo",
            "Elaborar los números generadores",
            "Integrar fotos, reportes y pruebas",
            "Calcular importes, amortización y retenciones",
            "Revisión y firma de la supervisión",
            "Trámite de pago"
          ]
        }
      }
    ]
  },
  {
    tipo: "ahorcado",
    titulo: "Adivina la palabra",
    descripcion: "Descubre el término con 6 intentos",
    color: "#d0475b",
    tableros: [
      {
        titulo: "Estructura",
        config: {
          tipo: "ahorcado",
          palabras: [
            { palabra: "RECUBRIMIENTO", pista: "Espesor de concreto que protege al acero de refuerzo" },
            { palabra: "TRASLAPE", pista: "Longitud en que se empalman dos varillas" },
            { palabra: "CONTRATRABE", pista: "Viga de cimentación que liga zapatas o una losa de cimentación" }
          ]
        }
      },
      {
        titulo: "Procesos",
        config: {
          tipo: "ahorcado",
          palabras: [
            { palabra: "APUNTALAMIENTO", pista: "Soporte provisional que sostiene la cimbra mientras fragua el concreto" },
            { palabra: "DESCIMBRADO", pista: "Retiro de moldes cuando el concreto ya resiste" },
            { palabra: "ESCARIFICADO", pista: "Picar una superficie para mejorar la adherencia" }
          ]
        }
      },
      {
        titulo: "Gestión",
        config: {
          tipo: "ahorcado",
          palabras: [
            { palabra: "AMORTIZACION", pista: "Descuento del anticipo en cada estimación" },
            { palabra: "INDIRECTOS", pista: "Costos de oficina y campo que no son de un concepto" },
            { palabra: "CONVENIO", pista: "Acuerdo que modifica monto o plazo del contrato" }
          ]
        }
      },
      {
        titulo: "Calidad",
        config: {
          tipo: "ahorcado",
          palabras: [
            { palabra: "TRAZABILIDAD", pista: "Poder rastrear el origen y la historia de un material o trabajo" },
            { palabra: "MUESTREO", pista: "Tomar especímenes representativos para ensayar" },
            { palabra: "LIBERACION", pista: "Autorización para continuar después de inspeccionar" }
          ]
        }
      }
    ]
  },
  {
    tipo: "clasificar",
    titulo: "Clasifica",
    descripcion: "Pon cada elemento en su categoría",
    color: "#a8740a",
    tableros: [
      {
        titulo: "Costos",
        config: {
          tipo: "clasificar",
          pregunta: "¿Es un costo directo o indirecto?",
          categorias: ["Costo directo", "Costo indirecto"],
          elementos: [
            { texto: "Cemento para el colado", categoria: 0 },
            { texto: "Mano de obra del albañil", categoria: 0 },
            { texto: "Renta de revolvedora", categoria: 0 },
            { texto: "Sueldo del residente", categoria: 1 },
            { texto: "Renta de la oficina central", categoria: 1 },
            { texto: "Fianzas y seguros", categoria: 1 },
            { texto: "Varilla para castillos", categoria: 0 },
            { texto: "Papelería y teléfono", categoria: 1 }
          ]
        }
      },
      {
        titulo: "Equipo de protección",
        config: {
          tipo: "clasificar",
          pregunta: "¿Qué parte del cuerpo protege?",
          categorias: ["Cabeza y cara", "Manos y pies", "Caídas"],
          elementos: [
            { texto: "Casco", categoria: 0 },
            { texto: "Lentes de seguridad", categoria: 0 },
            { texto: "Careta para esmeril", categoria: 0 },
            { texto: "Guantes de carnaza", categoria: 1 },
            { texto: "Botas con casquillo", categoria: 1 },
            { texto: "Arnés de cuerpo completo", categoria: 2 },
            { texto: "Línea de vida", categoria: 2 },
            { texto: "Punto de anclaje", categoria: 2 }
          ]
        }
      },
      {
        titulo: "Etapas de la obra",
        config: {
          tipo: "clasificar",
          pregunta: "¿En qué etapa ocurre?",
          categorias: ["Obra negra", "Acabados"],
          elementos: [
            { texto: "Excavación", categoria: 0 },
            { texto: "Cimentación", categoria: 0 },
            { texto: "Muros de block", categoria: 0 },
            { texto: "Losa de azotea", categoria: 0 },
            { texto: "Pintura", categoria: 1 },
            { texto: "Colocación de piso", categoria: 1 },
            { texto: "Cancelería", categoria: 1 },
            { texto: "Muebles de baño", categoria: 1 }
          ]
        }
      },
      {
        titulo: "Pruebas",
        config: {
          tipo: "clasificar",
          pregunta: "¿A qué material o sistema se le hace esta prueba?",
          categorias: ["Concreto", "Suelo", "Instalaciones"],
          elementos: [
            { texto: "Revenimiento", categoria: 0 },
            { texto: "Cilindros a compresión", categoria: 0 },
            { texto: "Prueba Proctor", categoria: 1 },
            { texto: "Grado de compactación", categoria: 1 },
            { texto: "Prueba hidrostática", categoria: 2 },
            { texto: "Continuidad eléctrica", categoria: 2 },
            { texto: "Temperatura de la mezcla", categoria: 0 },
            { texto: "Prueba de hermeticidad en gas", categoria: 2 }
          ]
        }
      }
    ]
  }
];

/** Número de día UTC; sirve para proponer un tablero distinto cada día. */
export function dayNumber(date = new Date()) {
  return Math.floor(date.getTime() / 86_400_000);
}

export function boardOfTheDay(game: RetoGame, date = new Date()) {
  return dayNumber(date) % game.tableros.length;
}
