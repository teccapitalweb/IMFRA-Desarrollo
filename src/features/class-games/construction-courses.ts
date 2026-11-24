import type { GameConfig } from "./content";

function ordenar(pregunta: string, ...pasos: string[]): GameConfig {
  return { tipo: "ordenar", pregunta, pasos };
}

function relacionar(...pares: [termino: string, definicion: string][]): GameConfig {
  return { tipo: "memorama", pares: pares.map(([termino, definicion]) => ({ termino, definicion })) };
}

function completar(texto: string, ...distractores: string[]): GameConfig {
  return { tipo: "completar", texto, distractores };
}

function clasificar(pregunta: string, categorias: [string, string], ...elementos: [texto: string, categoria: 0 | 1][]): GameConfig {
  return { tipo: "clasificar", pregunta, categorias, elementos: elementos.map(([texto, categoria]) => ({ texto, categoria })) };
}

export const COSTOS_Y_PRESUPUESTOS: GameConfig[] = [
  relacionar(
    ["Concepto", "Partida de trabajo descrita y medible"],
    ["Unidad", "Base con la que se mide un concepto"],
    ["Cantidad", "Volumen medido de la partida"],
    ["Importe", "Cantidad multiplicada por el precio unitario"]
  ),
  clasificar("Separa los insumos de un concepto de los gastos generales de obra.", ["Costo directo", "Costo indirecto"],
    ["Arena para el mortero", 0], ["Oficina temporal de la obra", 1], ["Cuadrilla que coloca el piso", 0],
    ["Administración general del sitio", 1], ["Renta del equipo usado para excavar", 0]
  ),
  ordenar("¿Cómo armas la matriz de precio unitario para un metro cuadrado de muro de tabique?",
    "Define el espesor, el alcance del concepto y su unidad de pago",
    "Identifica el tabique, el mortero, la mano de obra y el equipo necesarios",
    "Calcula el consumo de cada insumo por metro cuadrado de muro",
    "Multiplica cada consumo por su costo y suma los importes directos",
    "Integra los cargos que correspondan y revisa el precio unitario"
  ),
  completar("Si una cuadrilla coloca 24 m² de piso en una jornada, su [rendimiento] es 24 m² por jornada. Si cuesta $1,200 por jornada, la mano de obra por m² es de [$50]. El importe para 10 m² de esa mano de obra es de [$500].", "$120", "$2,400", "desperdicio"),
  relacionar(
    ["Material", "Se consume o se incorpora a la partida"],
    ["Mano de obra", "Trabajo de la cuadrilla que ejecuta el concepto"],
    ["Equipo", "Maquinaria necesaria para ejecutar la actividad"],
    ["Desperdicio", "Consumo adicional justificado por corte o merma"]
  ),
  ordenar("Compara cotizaciones para el mismo insumo.",
    "Define la especificación y la unidad que requiere el proyecto",
    "Solicita precios, vigencia y condiciones de entrega equivalentes",
    "Lleva precios a la misma unidad y base de impuestos",
    "Compara el costo entregado y el plazo requerido",
    "Documenta el precio elegido y su fecha"
  ),
  completar("El presupuesto aprobado es la [línea base]. Para conocer el impacto de lo ya contratado registra los [compromisos] además de lo pagado. Ante una desviación, actualiza el [pronóstico] con el costo restante y documenta la causa.", "croquis", "descuento", "metrado"),
  clasificar("Antes de cerrar el presupuesto, identifica qué requiere aclaración.", ["Revisar antes de cerrar", "Dato verificable"],
    ["PU con cotización vencida", 0], ["Cantidad con generador y plano vigente", 1], ["Concepto duplicado con otra clave", 0],
    ["Precio con unidad, vigencia y entrega confirmadas", 1], ["Partida ejecutable sin unidad definida", 0]
  )
];

export const DIRECCION_DE_PROYECTOS: GameConfig[] = [
  relacionar(
    ["Alcance", "Entregables y límites del proyecto"],
    ["Responsable", "Persona que responde por un entregable"],
    ["Hito", "Punto de control significativo en el programa"],
    ["Interesado", "Persona o grupo que puede afectar al proyecto o verse afectado"]
  ),
  clasificar("Distingue las definiciones de alcance de los cambios que deben evaluarse.", ["Alcance acordado", "Cambio por evaluar"],
    ["Concluir los elementos incluidos en planos aprobados", 0], ["Agregar un frente solicitado después del arranque", 1],
    ["Entregar las pruebas previstas en el contrato", 0], ["Sustituir el acabado por una especificación distinta", 1],
    ["Entregar los documentos acordados al cierre", 0]
  ),
  ordenar("Arma un programa de construcción que puedas controlar.",
    "Desglosa los entregables en actividades medibles",
    "Establece dependencias entre las actividades",
    "Estima duraciones y revisa la disponibilidad de recursos",
    "Calcula la secuencia crítica y fija los hitos",
    "Aprueba y conserva el programa como referencia"
  ),
  relacionar(
    ["Cuadrilla", "Personal asignado para ejecutar un frente"],
    ["Ruta de suministro", "Cómo y cuándo llega el material al sitio"],
    ["Cuello de botella", "Recurso o actividad que limita el rendimiento del conjunto"],
    ["Reserva", "Capacidad prevista para atender una variación"]
  ),
  completar("En el control económico, compara el [presupuesto] aprobado con el costo real y el [costo comprometido]. Registra cambios aprobados y actualiza el [costo al cierre] con el trabajo pendiente.", "número de trabajadores", "tiempo de entrega", "acta de recorrido"),
  ordenar("Dos especialidades necesitan el mismo frente. Ordena la coordinación.",
    "Confirma el conflicto con los planos y responsables de ambos frentes",
    "Evalúa restricciones de acceso, espacio y secuencia",
    "Acuerda qué actividad va primero y quién libera el frente",
    "Actualiza el programa y comunica el acuerdo",
    "Verifica la liberación antes de que ingrese la siguiente especialidad"
  ),
  clasificar("Distingue riesgos futuros de problemas que ya ocurrieron.", ["Riesgo", "Problema actual"],
    ["Posible demora de un proveedor clave", 0], ["El embarque programado no llegó", 1],
    ["Pronóstico de lluvia que podría afectar un colado", 0], ["Un frente está detenido por falta de acceso", 1],
    ["Una aprobación pendiente podría desplazar un hito", 0]
  ),
  completar("Si terminaron 30 de 40 actividades comparables, el avance por conteo es [75%]. Cuando las actividades tienen pesos distintos, usa el [peso] acordado y registra evidencia por [fecha de corte].", "25%", "duración máxima", "costo del equipo"),
  ordenar("¿Cómo preparas la entrega de un frente terminado?",
    "Revisa los criterios de aceptación y los registros de prueba",
    "Recorre el frente con los responsables y levanta pendientes",
    "Corrige los pendientes y comprueba su cierre",
    "Reúne planos finales, manuales y garantías aplicables",
    "Formaliza la entrega y conserva la evidencia"
  ),
  relacionar(
    ["Lección aprendida", "Observación respaldada que se puede aplicar al siguiente proyecto"],
    ["Cierre económico", "Conciliación de avances, cambios y saldos"],
    ["Acta de entrega", "Constancia de recepción y de las condiciones acordadas"],
    ["Plano conforme a obra", "Registro de cómo quedó ejecutado el proyecto"]
  )
];

export const PROCESOS_CONSTRUCTIVOS: GameConfig[] = [
  relacionar(
    ["Banco de nivel", "Referencia estable desde la que se trasladan cotas"],
    ["Eje", "Línea de referencia que controla la ubicación de los elementos"],
    ["Caballetes", "Apoyos fuera del área de excavación para conservar hilos y ejes"],
    ["Nivel de piso terminado", "Cota prevista para la superficie final del piso"]
  ),
  clasificar("¿Qué hallazgos permiten revisar el fondo de la excavación antes de autorizar la cimentación?", ["Puede pasar a revisión", "Corregir primero"],
    ["Fondo firme y limpio", 0], ["Agua o lodo acumulado", 1], ["Cota de desplante verificada", 0],
    ["Tierra suelta bajo el apoyo", 1], ["Ejes marcados y cotejados con plano", 0]
  ),
  ordenar("Ordena el arranque de un muro de albañilería.",
    "Verifica el eje y las dimensiones de la cadena de desplante",
    "Coloca la protección contra humedad según el detalle",
    "Asienta las esquinas de la primera hilada a nivel y a plomo",
    "Tiende el hilo de referencia y asienta las piezas intermedias",
    "Controla juntas y alturas con el escantillón"
  ),
  completar("En un marco de concreto, la [losa] recibe las cargas del piso. La [trabe] las conduce a sus apoyos y la [columna] las baja hacia la cimentación.", "cimbra", "plantilla", "impermeabilizante"),
  relacionar(
    ["Losa maciza", "Concreto armado continuo en todo el espesor"],
    ["Vigueta y bovedilla", "Sistema de elementos prefabricados con piezas de relleno"],
    ["Losa reticular", "Nervaduras en dos direcciones formadas con casetones"],
    ["Apuntalamiento", "Soporte temporal dimensionado para la etapa de ejecución"]
  ),
  clasificar("Separa verificaciones previas al colado de controles posteriores.", ["Antes del colado", "Después del colado"],
    ["Revisar recubrimientos y separadores", 0], ["Iniciar y mantener el curado prescrito", 1],
    ["Confirmar insertos y pasos de instalaciones", 0], ["Documentar el acabado al descimbrar", 1],
    ["Verificar alineación y estanqueidad de cimbra", 0]
  ),
  completar("Antes de tapar una instalación oculta, realiza la [prueba] prevista y conserva el [registro]. Si aparece interferencia con la estructura, solicita la [revisión] del responsable del proyecto.", "pintura", "factura", "demolición inmediata"),
  ordenar("Controla el agua en una cubierta antes de entregar el frente.",
    "Revisa en el plano las pendientes y puntos de desagüe",
    "Verifica el sustrato y corrige irregularidades",
    "Ejecuta el sistema y sus remates según la especificación",
    "Comprueba los desagües y las uniones con la prueba indicada",
    "Registra el resultado y atiende los pendientes"
  ),
  relacionar(
    ["Cota", "Dimensión o nivel indicado en el dibujo"],
    ["Corte", "Vista que muestra elementos al atravesar el edificio"],
    ["Detalle", "Dibujo ampliado para resolver un encuentro constructivo"],
    ["Revisión del plano", "Identificador de la versión aprobada para ejecutar"]
  ),
  clasificar("Distingue la evidencia técnica del cierre de los asuntos aún pendientes.", ["Evidencia de cierre", "Pendiente por resolver"],
    ["Plano final con cambios incorporados", 0], ["Prueba de estanqueidad fallida", 1],
    ["Registro de una prueba aceptada", 0], ["Desagüe sin caudal comprobado", 1],
    ["Acta del recorrido con pendientes cerrados", 0]
  )
];

export const TOPOGRAFIA_APLICADA: GameConfig[] = [
  relacionar(
    ["Levantamiento", "Mide y representa la situación existente del terreno"],
    ["Replanteo", "Lleva la geometría diseñada del plano al terreno"],
    ["Punto de control", "Referencia materializada con coordenadas conocidas"],
    ["Cota", "Elevación de un punto respecto a una referencia"]
  ),
  clasificar("Distingue información en planta de información de elevación.", ["Planimetría", "Altimetría"],
    ["Ubicación horizontal de una esquina", 0], ["Cota del terreno en un punto", 1],
    ["Longitud horizontal entre dos vértices", 0], ["Desnivel entre dos bancos", 1], ["Coordenadas Este y Norte de un eje", 0]
  ),
  ordenar("Ordena la puesta en estación de un instrumento sobre un punto conocido.",
    "Reconoce el punto de control y el punto de orientación",
    "Coloca el trípode y centra el instrumento sobre el punto",
    "Nivela y vuelve a comprobar el centrado",
    "Registra altura y coordenadas de la estación",
    "Orienta al punto de referencia y comprueba una observación"
  ),
  completar("En la nivelación, la altura de instrumento se obtiene sumando la [vista atrás] a la cota conocida. Para hallar la cota de otro punto, resta la [vista adelante]. El recorrido termina con una [comprobación de cierre].", "altura del prisma", "distancia inclinada", "azimut de salida"),
  relacionar(
    ["Azimut", "Ángulo horizontal medido desde una dirección de referencia"],
    ["Distancia horizontal", "Proyección de la separación sobre el plano horizontal"],
    ["Ángulo vertical", "Inclinación de la visual en el plano vertical"],
    ["Altura de prisma", "Distancia vertical entre el punto y el centro del prisma"]
  ),
  clasificar("Distingue las comprobaciones de campo de los productos de gabinete.", ["Comprobación de campo", "Producto de gabinete"],
    ["Verificar un punto de control al terminar", 0], ["Plano de curvas de nivel", 1],
    ["Registrar altura de instrumento y prisma", 0], ["Modelo digital del terreno", 1],
    ["Repetir una observación dudosa", 0]
  ),
  ordenar("De los puntos de terreno al replanteo. ¿Cuál es el orden?",
    "Valida cotas, coordenadas y sistema de referencia",
    "Construye y comprueba el modelo del terreno",
    "Obtén del proyecto las coordenadas y niveles a replantear",
    "Materializa los puntos con el instrumento orientado",
    "Comprueba el replanteo desde un control independiente"
  ),
  completar("Si el terreno baja 0.40 m en una distancia horizontal de 20 m, la magnitud de la [pendiente] es [2%]. En un plano, curvas de nivel más juntas indican una ladera [más inclinada].", "0.2%", "20%", "más plana"),
  relacionar(
    ["Tolerancia", "Diferencia máxima admitida por el proyecto"],
    ["Control independiente", "Comprobación desde otra referencia u observación"],
    ["Metadatos", "Sistema de referencia, unidades y fecha asociados al levantamiento"],
    ["Plano final", "Documento que reúne geometría, cotas y referencias verificadas"]
  )
];
