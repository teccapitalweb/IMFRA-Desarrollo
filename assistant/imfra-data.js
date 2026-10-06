(() => {
  'use strict';

  const course = (id, title, image, teacher, summary, date, price, modality, certificate, tags) => ({
    id, title, image, teacher, summary, date, price, modality, certificate, tags
  });

  window.IMFRA_EXPERIENCE_DATA = Object.freeze({
    brand: {
      name: 'IMFRA Desarrollo',
      assistant: 'Guía IMFRA',
      whatsapp: '522382196286',
      generalWhatsapp: '5212225245127',
      privacyUrl: 'privacidad.html'
    },

    questions: [
      {
        id: 'profile', dimension: 'profiles', kicker: 'Sobre ti',
        title: '¿Dónde te encuentras hoy en el mundo de la construcción?',
        hint: 'No hay respuestas correctas; queremos recomendarte algo que sí te sirva.',
        options: [
          { value: 'student', icon: '🎓', title: 'Estoy estudiando', detail: 'Arquitectura, ingeniería o una carrera afín' },
          { value: 'graduate', icon: '📐', title: 'Recién egresé', detail: 'Quiero fortalecer mi perfil profesional' },
          { value: 'field', icon: '🦺', title: 'Trabajo en obra', detail: 'Supervisión, residencia o ejecución' },
          { value: 'designer', icon: '🏙️', title: 'Diseño y proyecto', detail: 'Arquitectura, cálculo o representación' },
          { value: 'business', icon: '🏗️', title: 'Tengo un negocio', detail: 'Contratista, despacho o constructora' },
          { value: 'team', icon: '👥', title: 'Capacito a un equipo', detail: 'Busco formación para mi empresa' }
        ]
      },
      {
        id: 'experience', dimension: 'level', kicker: 'Tu experiencia',
        title: '¿Qué tanta experiencia tienes en el tema que buscas?',
        hint: 'Así ajustamos la profundidad de la recomendación.',
        options: [
          { value: 'starting', level: 'inicial', icon: '🌱', title: 'Voy comenzando', detail: 'Necesito una base clara' },
          { value: 'basics', level: 'basico', icon: '📘', title: 'Conozco lo básico', detail: 'Quiero ordenar lo que ya sé' },
          { value: 'practical', level: 'intermedio', icon: '🛠️', title: 'Ya lo aplico', detail: 'Busco mejorar mi práctica' },
          { value: 'specialize', level: 'avanzado', icon: '🏆', title: 'Quiero especializarme', detail: 'Necesito mayor profundidad' }
        ]
      },
      {
        id: 'interest', dimension: 'interests', kicker: 'Tu enfoque',
        title: '¿Qué tema te interesa más en este momento?',
        hint: 'Elige el que tendría mayor impacto en tu siguiente proyecto.',
        options: [
          { value: 'supervision', image: 'assets/cursos/curso-01-supervision.jpg', title: 'Supervisión y residencia' },
          { value: 'costs', image: 'assets/cursos/curso-04-control-financiero.jpg', title: 'Costos y control financiero' },
          { value: 'quantities', image: 'assets/cursos/curso-07-numeros.jpg', title: 'Números generadores' },
          { value: 'contracts', image: 'assets/cursos/curso-02-contratos.jpg', title: 'Contratos y riesgos' },
          { value: 'structures', image: 'assets/cursos/curso-03-trabes.jpg', title: 'Estructuras e infraestructura' },
          { value: 'visualization', image: 'assets/cursos/curso-08-sketchup.jpg', title: 'Modelado y presentación' },
          { value: 'management', image: 'assets/cursos/curso-09-gerencia.jpg', title: 'Gerencia de proyectos' },
          { value: 'landscape', image: 'assets/cursos/curso-10-paisajismo.jpg', title: 'Paisajismo rentable' }
        ]
      },
      {
        id: 'goal', dimension: 'goals', kicker: 'Tu siguiente logro',
        title: '¿Qué te gustaría conseguir con esta capacitación?',
        hint: 'Piensa en el resultado que te haría decir: valió la pena.',
        options: [
          { value: 'job', icon: '💼', title: 'Conseguir una oportunidad', detail: 'Mejorar mi perfil y empleabilidad' },
          { value: 'work', icon: '✅', title: 'Trabajar con más seguridad', detail: 'Tomar mejores decisiones técnicas' },
          { value: 'lead', icon: '📊', title: 'Liderar proyectos', detail: 'Coordinar alcance, tiempo y costo' },
          { value: 'business', icon: '📈', title: 'Hacer crecer mi negocio', detail: 'Cobrar, controlar y vender mejor' },
          { value: 'certificate', icon: '🏅', title: 'Respaldar lo que sé', detail: 'Obtener un certificado digital' },
          { value: 'solve', icon: '🎯', title: 'Resolver un reto actual', detail: 'Aplicarlo de inmediato en una obra' }
        ]
      },
      {
        id: 'need', dimension: 'problems', kicker: 'Tu reto actual',
        title: '¿Qué necesitas fortalecer primero?',
        hint: 'Esto define el ángulo práctico de tu ruta.',
        options: [
          { value: 'start', icon: '🧭', title: 'Saber por dónde empezar', detail: 'Necesito una ruta clara' },
          { value: 'practice', icon: '🧰', title: 'Pasar de teoría a práctica', detail: 'Quiero casos y procedimientos' },
          { value: 'control', icon: '📋', title: 'Controlar mejor la obra', detail: 'Orden, evidencia y seguimiento' },
          { value: 'money', icon: '💰', title: 'Cuidar costos y cobros', detail: 'Presupuesto, avance y rentabilidad' },
          { value: 'risk', icon: '🛡️', title: 'Reducir riesgos', detail: 'Contratos, calidad y prevención' },
          { value: 'present', icon: '✨', title: 'Presentar mejor mis proyectos', detail: 'Comunicación visual y profesional' }
        ]
      },
      {
        id: 'format', dimension: 'formats', kicker: 'Tu forma de aprender',
        title: '¿Qué tipo de contenido te ayuda a aprender mejor?',
        hint: 'Tu estilo también dice mucho de tus fortalezas.',
        options: [
          { value: 'video', icon: '▶️', title: 'Explicaciones visuales', detail: 'Ver y escuchar el proceso' },
          { value: 'cases', icon: '🔎', title: 'Casos reales', detail: 'Entender decisiones de obra' },
          { value: 'guides', icon: '📚', title: 'Guías paso a paso', detail: 'Consultar y repasar' },
          { value: 'tools', icon: '🧮', title: 'Ejercicios y herramientas', detail: 'Aprender haciendo' },
          { value: 'mix', icon: '⚡', title: 'Una combinación', detail: 'Alternar explicación y práctica' }
        ]
      },
      {
        id: 'time', dimension: 'time', kicker: 'Tu ritmo',
        title: '¿Cuánto tiempo podrías dedicar a aprender por semana?',
        hint: 'Una ruta sostenible funciona mejor que una promesa difícil de cumplir.',
        options: [
          { value: 'lt1', icon: '⏳', title: 'Menos de una hora', detail: 'Avances pequeños y concretos' },
          { value: '1-2', icon: '🕐', title: 'Entre 1 y 2 horas', detail: 'Una sesión semanal' },
          { value: '3-5', icon: '📅', title: 'Entre 3 y 5 horas', detail: 'Ritmo constante' },
          { value: '5plus', icon: '🚀', title: 'Más de 5 horas', detail: 'Quiero avanzar a profundidad' }
        ]
      }
    ],

    courses: [
      course('supervision', 'Supervisión Integral de Obra Civil e Industrial', 'assets/cursos/curso-01-supervision.jpg', 'Arq. Luis Roberto Bautista Retama', 'Control técnico, coordinación multidisciplinaria y gestión en campo para asegurar calidad, tiempo y cumplimiento.', '29 de junio', '$750 MXN', 'En vivo · Google Meet', 'Certificado digital con folio y QR', { interests: ['supervision', 'management'], goals: ['work', 'lead', 'solve'], profiles: ['field', 'team', 'business'], problems: ['control', 'risk', 'practice'], levels: ['basico', 'intermedio', 'avanzado'] }),
      course('contracts', 'Contratos en la Construcción', 'assets/cursos/curso-02-contratos.jpg', 'Lic. Margarita López Lara', 'Redacción y revisión de contratos para reducir riesgos, definir responsabilidades y proteger los proyectos.', '22 de junio', '$750 MXN', 'Clase online en vivo', 'Reconocimiento institucional con folio y QR', { interests: ['contracts', 'management'], goals: ['business', 'lead', 'solve'], profiles: ['business', 'team', 'field'], problems: ['risk', 'start', 'control'], levels: ['basico', 'intermedio', 'avanzado'] }),
      course('aashto', 'Trabes AASHTO: Fabricación, Montaje y Control en Puentes', 'assets/cursos/curso-03-trabes.jpg', 'Ing. Jorge Sánchez Hernández', 'Fabricación, montaje y control normativo de trabes AASHTO en puentes, tipos II a V.', '22 de junio', '$750 MXN', 'Curso online', 'Certificado digital con QR', { interests: ['structures', 'supervision'], goals: ['work', 'certificate', 'solve'], profiles: ['field', 'graduate', 'team'], problems: ['practice', 'risk', 'control'], levels: ['intermedio', 'avanzado'] }),
      course('financial-control', 'Control Físico Financiero de Obra', 'assets/cursos/curso-04-control-financiero.jpg', 'Ing. Laura Mariella Hernández Pitalua', 'Seguimiento del avance físico y financiero para detectar desviaciones y tomar decisiones oportunas.', '29 de junio', '$750 MXN', 'En vivo · Clase online', 'Certificado digital con QR', { interests: ['costs', 'management', 'quantities'], goals: ['business', 'lead', 'solve'], profiles: ['field', 'business', 'team'], problems: ['money', 'control', 'practice'], levels: ['basico', 'intermedio', 'avanzado'] }),
      course('resident', 'Residente de Obra', 'assets/cursos/curso-05-residente.jpg', 'Ing. Ángel Ricardo Fisher López', 'Funciones, responsabilidades y control técnico de la residencia de obra en proyectos de construcción.', '29 de junio', '$750 MXN', 'En vivo · Google Meet', 'Certificado digital con QR', { interests: ['supervision', 'management'], goals: ['job', 'work', 'certificate'], profiles: ['student', 'graduate', 'field'], problems: ['start', 'control', 'practice'], levels: ['inicial', 'basico', 'intermedio'] }),
      course('sheets', 'Elaboración de Láminas Arquitectónicas Profesionales', 'assets/cursos/curso-06-laminas.jpg', 'Arq. Alesiram Sotelo Peñuelas', 'De la idea a la presentación final: composición y comunicación visual profesional con Photoshop.', '29 de junio', '$750 MXN', 'Online · Google Meet', 'Certificado digital con QR', { interests: ['visualization'], goals: ['job', 'work', 'business'], profiles: ['student', 'graduate', 'designer'], problems: ['present', 'practice', 'start'], levels: ['inicial', 'basico', 'intermedio'] }),
      course('quantities', 'Elaboración de Números Generadores', 'assets/cursos/curso-07-numeros.jpg', 'Arq. Alesiram Sotelo Peñuelas', 'Cuantificación y control de volúmenes de obra para presupuestos y estimaciones confiables.', '22 de junio', '$750 MXN', 'Clase online en vivo', 'Reconocimiento institucional con folio y QR', { interests: ['quantities', 'costs', 'supervision'], goals: ['job', 'work', 'solve'], profiles: ['student', 'graduate', 'field', 'business'], problems: ['money', 'control', 'practice'], levels: ['inicial', 'basico', 'intermedio'] }),
      course('sketchup', 'SketchUp Profesional', 'assets/cursos/curso-08-sketchup.jpg', 'Arq. Carlos Mauricio Pérez Zepeda', 'Modelado arquitectónico en SketchUp desde cero hasta un nivel intermedio para presentar proyectos.', '29 de junio', '$750 MXN', 'Online · Google Meet', 'Certificado digital con QR', { interests: ['visualization'], goals: ['job', 'work', 'business'], profiles: ['student', 'graduate', 'designer'], problems: ['present', 'practice', 'start'], levels: ['inicial', 'basico', 'intermedio'] }),
      course('management', 'Gerencia de Proyectos en Construcción', 'assets/cursos/curso-09-gerencia.jpg', 'Mtro. Arq. Juan Pablo Hernández García', 'Planeación, ejecución y control de proyectos con herramientas de gestión y liderazgo estratégico.', '22 de junio', '$750 MXN', 'Curso online', 'Certificado digital con QR', { interests: ['management', 'costs', 'supervision'], goals: ['lead', 'business', 'work'], profiles: ['field', 'business', 'team'], problems: ['control', 'money', 'risk'], levels: ['basico', 'intermedio', 'avanzado'] }),
      course('landscape', 'Paisajismo Rentable: Costos, Presupuestos y Precios', 'assets/cursos/curso-10-paisajismo.jpg', 'Arq. Laura Elizabeth Espinoza', 'Costeo, presupuesto y precios estratégicos para convertir proyectos de paisajismo en un negocio rentable.', '06 de julio', '$950 MXN', 'En vivo · Google Meet', 'Certificado digital con QR', { interests: ['landscape', 'costs'], goals: ['business', 'work', 'solve'], profiles: ['designer', 'business', 'graduate'], problems: ['money', 'present', 'practice'], levels: ['basico', 'intermedio'] })
    ],

    conceptGroups: [
      { label: 'Obra y supervisión', items: ['supervision', 'residencia', 'bitacora', 'calidad', 'seguridad', 'as-built'] },
      { label: 'Costos y control', items: ['presupuesto', 'apu', 'generadores', 'estimaciones', 'control-financiero', 'costos-indirectos', 'curva-s'] },
      { label: 'Planeación y gestión', items: ['gerencia', 'ruta-critica', 'alcance', 'riesgos', 'contratos', 'licitacion', 'cambio-orden'] },
      { label: 'Diseño y estructuras', items: ['ingenieria-civil', 'cimentacion', 'geotecnia', 'topografia', 'concreto', 'acero-refuerzo', 'trabes-aashto', 'bim', 'sketchup', 'laminas'] }
    ],

    concepts: {
      'ingenieria-civil': { label: 'Ingeniería civil', aliases: ['ingenieria civil', 'que es ingenieria civil'], definition: 'La ingeniería civil planea, diseña, construye, supervisa y conserva infraestructura y edificaciones. Integra estructuras, geotecnia, hidráulica, materiales, costos, seguridad y gestión para convertir una necesidad en una solución construible y durable.', practical: 'Un proyecto sólido conecta criterios de diseño, información del sitio, normativa, presupuesto, programa y control de calidad; ninguna especialidad debería resolverse de forma aislada.', courses: ['Supervisión Integral', 'Gerencia de Proyectos'] },
      supervision: { label: 'Supervisión de obra', aliases: ['supervision', 'supervision de obra', 'supervisor de obra'], definition: 'La supervisión de obra verifica que los trabajos se ejecuten conforme a planos, especificaciones, contrato, programa, presupuesto, seguridad y calidad.', practical: 'Una buena supervisión deja evidencia: reportes, pruebas, fotografías, minutas, bitácora, controles de avance y seguimiento de no conformidades.', courses: ['Supervisión Integral', 'Residente de Obra'] },
      residencia: { label: 'Residencia de obra', aliases: ['residente', 'residente de obra', 'residencia de obra'], definition: 'La residencia de obra representa la conducción técnica cotidiana de la ejecución. Coordina personal, recursos, contratistas, programa, calidad, seguridad y documentación.', practical: 'El residente debe anticipar restricciones, verificar frentes antes de ejecutar, registrar decisiones y escalar oportunamente cualquier desviación de alcance, costo o plazo.', courses: ['Residente de Obra', 'Supervisión Integral'] },
      bitacora: { label: 'Bitácora de obra', aliases: ['bitacora', 'bitacora de obra', 'nota de bitacora'], definition: 'La bitácora de obra es el registro cronológico de hechos, instrucciones, acuerdos, incidencias y decisiones relevantes durante la ejecución.', practical: 'Una nota útil indica fecha, ubicación, hecho verificable, responsable, instrucción o acuerdo, plazo y evidencia. Debe ser clara, objetiva y congruente con el contrato.', courses: ['Supervisión Integral', 'Residente de Obra'] },
      calidad: { label: 'Control de calidad', aliases: ['control de calidad', 'calidad en obra', 'calidad de obra'], definition: 'El control de calidad compara materiales, procedimientos y resultados contra requisitos definidos en planos, especificaciones, normativa y contrato.', practical: 'Funciona mejor con puntos de inspección, criterios de aceptación, trazabilidad de materiales, pruebas, liberaciones y tratamiento documentado de no conformidades.', courses: ['Supervisión Integral', 'Trabes AASHTO'] },
      seguridad: { label: 'Seguridad en obra', aliases: ['seguridad en obra', 'seguridad construccion', 'accidente en obra', 'riesgo de trabajo'], definition: 'La seguridad en obra identifica peligros, evalúa riesgos y establece controles para proteger a trabajadores, visitantes y entorno.', practical: 'La prioridad es eliminar o controlar el peligro desde la planeación, complementar con procedimientos, capacitación y equipo de protección, y detener actividades ante riesgo inminente.', courses: ['Supervisión Integral', 'Residente de Obra'] },
      presupuesto: { label: 'Presupuesto de obra', aliases: ['presupuesto', 'presupuesto de obra', 'costear una obra'], definition: 'Un presupuesto de obra estima el costo de ejecutar un alcance definido mediante cantidades, precios unitarios, indirectos, financiamiento, utilidad y cargos aplicables.', practical: 'Su confiabilidad depende de planos y alcance claros, catálogo completo, cuantificaciones revisadas, rendimientos realistas, cotizaciones vigentes y supuestos documentados.', courses: ['Control Físico Financiero', 'Números Generadores'] },
      apu: { label: 'Análisis de precios unitarios', aliases: ['apu', 'analisis de precio unitario', 'precio unitario'], definition: 'El análisis de precios unitarios descompone el costo de una unidad de trabajo en materiales, mano de obra, maquinaria, herramienta y rendimientos; después integra cargos indirectos y complementarios según el caso.', practical: 'Antes de reutilizar un APU hay que actualizar precios, cuadrillas, rendimientos, desperdicios, ubicación, condiciones de ejecución y alcance exacto del concepto.', courses: ['Control Físico Financiero', 'Números Generadores'] },
      generadores: { label: 'Números generadores', aliases: ['numero generador', 'numeros generadores', 'generador de obra'], definition: 'Los números generadores documentan cómo se obtuvo una cantidad de obra mediante dimensiones, operaciones, ubicación, croquis y referencias a planos.', practical: 'Deben permitir que otra persona reproduzca la cuantificación. Conviene separar por frente, periodo y concepto, conservar unidades coherentes y vincular evidencia.', courses: ['Elaboración de Números Generadores', 'Control Físico Financiero'] },
      estimaciones: { label: 'Estimaciones de obra', aliases: ['estimacion de obra', 'estimaciones', 'cobro de avance'], definition: 'Una estimación de obra cuantifica y valora trabajos ejecutados y aceptados durante un periodo para tramitar su pago conforme al contrato.', practical: 'Se soporta con generadores, reportes, evidencia, pruebas, autorizaciones, amortizaciones y retenciones. Cobrar avance sin respaldo aumenta el riesgo de rechazo o controversia.', courses: ['Elaboración de Números Generadores', 'Control Físico Financiero'] },
      'control-financiero': { label: 'Control físico-financiero', aliases: ['control fisico financiero', 'avance fisico financiero', 'control financiero de obra'], definition: 'El control físico-financiero compara el avance construido con el gasto, compromisos y cobros para detectar desviaciones y pronosticar el cierre del proyecto.', practical: 'No basta comparar porcentajes globales: conviene revisar por partida, frente y periodo, distinguir costo incurrido, comprometido y pagado, y actualizar el costo por terminar.', courses: ['Control Físico Financiero', 'Gerencia de Proyectos'] },
      gerencia: { label: 'Gerencia de proyectos', aliases: ['gerencia de proyectos', 'gestion de proyectos', 'project management'], definition: 'La gerencia de proyectos coordina alcance, tiempo, costo, calidad, recursos, comunicaciones, riesgos y adquisiciones para alcanzar un objetivo definido.', practical: 'Una línea base clara, responsables visibles, control de cambios, reuniones con acuerdos y decisiones basadas en indicadores evitan que el proyecto se administre solo por urgencias.', courses: ['Gerencia de Proyectos', 'Supervisión Integral'] },
      'ruta-critica': { label: 'Ruta crítica', aliases: ['ruta critica', 'camino critico', 'programa de obra'], definition: 'La ruta crítica es la secuencia de actividades que determina la duración mínima del proyecto; un retraso en una actividad crítica puede mover la fecha final si no se recupera tiempo.', practical: 'Para usarla bien se necesitan relaciones lógicas, duraciones realistas, calendarios, restricciones y actualización con avance real. Un diagrama bonito sin seguimiento no controla la obra.', courses: ['Gerencia de Proyectos', 'Supervisión Integral'] },
      alcance: { label: 'Alcance de proyecto', aliases: ['alcance', 'alcance del proyecto', 'scope'], definition: 'El alcance define qué entregables y trabajos forman parte del proyecto y cuáles quedan fuera. Es la base para programar, presupuestar, contratar y aceptar resultados.', practical: 'Conviene descomponerlo en entregables verificables, criterios de aceptación, límites, interfaces y supuestos; los cambios deben evaluarse antes de autorizarse.', courses: ['Gerencia de Proyectos', 'Contratos en la Construcción'] },
      riesgos: { label: 'Riesgos de proyecto', aliases: ['riesgo', 'riesgos de proyecto', 'matriz de riesgos'], definition: 'Un riesgo es un evento incierto que, si ocurre, afecta objetivos como costo, plazo, seguridad, calidad o reputación.', practical: 'Un registro útil identifica causa, evento, impacto, probabilidad, responsable, respuesta y señal de alerta. Priorizar pocos riesgos accionables es mejor que una lista extensa sin seguimiento.', courses: ['Gerencia de Proyectos', 'Contratos en la Construcción'] },
      contratos: { label: 'Contratos de construcción', aliases: ['contrato', 'contratos', 'contrato de obra', 'contratos de construccion'], definition: 'Un contrato de construcción establece alcance, precio, plazo, responsabilidades, forma de pago, cambios, garantías, entregables, riesgos y mecanismos de controversia.', practical: 'Antes de firmar se deben alinear anexos técnicos, catálogo, programa, criterios de aceptación y procedimiento de cambios. Una cláusula no sustituye revisión legal del caso concreto.', courses: ['Contratos en la Construcción', 'Gerencia de Proyectos'] },
      concreto: { label: 'Concreto', aliases: ['concreto', 'hormigon', 'f c', 'resistencia del concreto'], definition: 'El concreto combina cemento, agua, agregados y, cuando corresponde, aditivos. Su desempeño depende de dosificación, materiales, mezclado, transporte, colocación, compactación, curado y verificación.', practical: 'La resistencia no se confirma por apariencia. Se requiere especificación, control de revenimiento y temperatura, muestreo, curado de especímenes y resultados interpretados por personal competente.', courses: ['Supervisión Integral', 'Trabes AASHTO'] },
      'trabes-aashto': { label: 'Trabes AASHTO', aliases: ['aashto', 'trabes aashto', 'vigas aashto', 'puentes'], definition: 'Las trabes AASHTO son elementos prefabricados y presforzados usados en puentes. Sus tipos y dimensiones responden a claros, cargas, diseño y normativa aplicable.', practical: 'Fabricación, izaje, transporte, apoyos, montaje, tolerancias e inspección requieren procedimientos y responsables especializados; no deben improvisarse con datos genéricos.', courses: ['Trabes AASHTO', 'Supervisión Integral'] },
      bim: { label: 'BIM', aliases: ['bim', 'building information modeling', 'modelado de informacion'], definition: 'BIM es una metodología colaborativa que organiza información del activo mediante modelos y procesos compartidos durante diseño, construcción y operación.', practical: 'Su valor no proviene solo del modelo 3D: requiere objetivos, usos BIM, niveles de información, responsables, estándares de intercambio y un entorno común de datos.', courses: ['SketchUp Profesional', 'Gerencia de Proyectos'] },
      sketchup: { label: 'SketchUp', aliases: ['sketchup', 'modelado 3d', 'modelo 3d'], definition: 'SketchUp es una herramienta de modelado 3D usada para estudiar espacios, comunicar propuestas y producir vistas de proyectos.', practical: 'Un modelo profesional se organiza con grupos, componentes, etiquetas y escenas; modelar todo como geometría suelta vuelve difícil editar, medir y documentar.', courses: ['SketchUp Profesional', 'Láminas Arquitectónicas'] },
      laminas: { label: 'Láminas arquitectónicas', aliases: ['lamina arquitectonica', 'laminas arquitectonicas', 'presentacion arquitectonica', 'panel arquitectonico'], definition: 'Una lámina arquitectónica comunica una propuesta mediante jerarquía visual, planos, diagramas, imágenes y texto en una composición legible.', practical: 'Primero se define el mensaje y el recorrido visual; después se ajustan retícula, escala, contraste, tipografía y consistencia gráfica. Más elementos no siempre comunican mejor.', courses: ['Elaboración de Láminas', 'SketchUp Profesional'] },
      paisajismo: { label: 'Paisajismo rentable', aliases: ['paisajismo', 'presupuesto de paisajismo', 'costos de jardineria'], definition: 'Un proyecto de paisajismo rentable conecta diseño, sitio, especies, materiales, instalación, mantenimiento, merma, logística y margen.', practical: 'Conviene separar costos directos, indirectos y contingencias, definir alcance de mantenimiento, medir cantidades y cotizar por entregables claros en lugar de depender solo de un precio por metro cuadrado.', courses: ['Paisajismo Rentable', 'Control Físico Financiero'] },
      'costos-indirectos': { label: 'Costos indirectos', aliases: ['costo indirecto', 'costos indirectos', 'indirectos de obra'], definition: 'Los costos indirectos son recursos necesarios para ejecutar y administrar la obra que no se asignan de manera directa a una sola unidad de trabajo, como oficina de campo, supervisión, servicios, seguridad y administración central.', practical: 'Deben calcularse para el proyecto y plazo reales; copiar un porcentaje histórico puede ocultar personal, instalaciones, garantías o costos financieros que cambian entre obras.', courses: ['Control Físico Financiero', 'Gerencia de Proyectos'] },
      'curva-s': { label: 'Curva S', aliases: ['curva s', 'curva de avance', 'curva de valor ganado'], definition: 'La curva S representa acumulados de avance, costo o valor a través del tiempo. Permite comparar la línea base con el comportamiento real y visualizar desviaciones.', practical: 'Debe construirse con una estructura de desglose consistente y actualizarse con cortes confiables. Dos porcentajes globales parecidos pueden esconder partidas críticas adelantadas o atrasadas.', courses: ['Control Físico Financiero', 'Gerencia de Proyectos'] },
      licitacion: { label: 'Licitación', aliases: ['licitacion', 'concurso de obra', 'propuesta tecnica economica'], definition: 'Una licitación es un proceso competitivo para seleccionar una propuesta conforme a bases, requisitos técnicos, condiciones económicas y criterios de evaluación.', practical: 'Antes de ofertar conviene crear una matriz de cumplimiento, aclarar el alcance, revisar riesgos contractuales, validar cantidades y documentar todos los supuestos de la propuesta.', courses: ['Contratos en la Construcción', 'Gerencia de Proyectos'] },
      'cambio-orden': { label: 'Orden de cambio', aliases: ['orden de cambio', 'cambio de alcance', 'trabajo extraordinario', 'concepto extraordinario'], definition: 'Una orden de cambio formaliza una modificación de alcance, cantidad, especificación, plazo o costo respecto de la línea base contractual.', practical: 'Antes de ejecutar conviene documentar origen, descripción, planos, impacto en tiempo y costo, responsable de autorizar y ajuste contractual. Trabajar primero y negociar después eleva el riesgo de no cobro.', courses: ['Contratos en la Construcción', 'Control Físico Financiero'] },
      'as-built': { label: 'Planos as-built', aliases: ['as built', 'planos as built', 'planos como construido', 'planos finales de obra'], definition: 'Los planos as-built registran cómo quedó realmente construida la obra, incluyendo cambios aprobados, ubicación final de elementos y datos relevantes para operación y mantenimiento.', practical: 'Se actualizan durante la ejecución, no al final de memoria. Deben apoyarse en levantamientos, notas de cambio y revisiones que permitan rastrear quién autorizó cada modificación.', courses: ['Supervisión Integral', 'Residente de Obra'] },
      cimentacion: { label: 'Cimentación', aliases: ['cimentacion', 'cimientos', 'zapata', 'losa de cimentacion'], definition: 'La cimentación transmite las cargas de la estructura al terreno de forma compatible con su capacidad y deformación admisible. Puede ser superficial o profunda según el proyecto y el suelo.', practical: 'La selección requiere cargas, geometría, nivel freático, estudio geotécnico, entorno y normativa. Una solución usada en la obra vecina no sustituye el análisis del sitio.', courses: ['Supervisión Integral', 'Trabes AASHTO'] },
      geotecnia: { label: 'Geotecnia', aliases: ['geotecnia', 'mecanica de suelos', 'estudio de suelo', 'capacidad portante'], definition: 'La geotecnia estudia el comportamiento del suelo y la roca frente a cargas, excavaciones, agua y cambios constructivos para apoyar decisiones de cimentación y estabilidad.', practical: 'Un estudio útil conecta exploración, muestreo, ensayos, modelo estratigráfico y recomendaciones con el proyecto específico; sus resultados no deben extrapolarse sin criterio.', courses: ['Supervisión Integral', 'Gerencia de Proyectos'] },
      topografia: { label: 'Topografía en obra', aliases: ['topografia', 'levantamiento topografico', 'trazo y nivelacion', 'replanteo'], definition: 'La topografía determina posiciones, niveles, distancias y geometría del terreno y de los elementos construidos. Da soporte al levantamiento, trazo, control y verificación.', practical: 'Conviene establecer bancos y referencias protegidas, verificar cierres, calibración y tolerancias, y conservar archivos y reportes para rastrear cada replanteo.', courses: ['Supervisión Integral', 'Residente de Obra'] },
      'acero-refuerzo': { label: 'Acero de refuerzo', aliases: ['acero de refuerzo', 'varilla', 'armado', 'refuerzo de concreto'], definition: 'El acero de refuerzo complementa al concreto para resistir esfuerzos y controlar fisuración según el diseño estructural. Su diámetro, cantidad, separación, anclaje y recubrimiento forman parte del cálculo.', practical: 'En obra se verifican certificados, limpieza, ubicación, traslapes, dobleces, separadores, recubrimiento y estabilidad antes del colado. No se deben modificar barras sin autorización del responsable estructural.', courses: ['Supervisión Integral', 'Trabes AASHTO'] }
    }
  });
})();
