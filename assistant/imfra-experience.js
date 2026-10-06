(() => {
  'use strict';

  const data = window.IMFRA_EXPERIENCE_DATA;
  if (!data || document.querySelector('[data-imx-root]')) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 760px)');
  const cookieKey = 'imfra-cookie-notice-v1';
  const positionKey = 'imfra-guide-position-v1';
  const sessionKey = 'imfra-guide-session-v1';
  const asset = 'assistant/assets/imfra-guide.png';
  const blinkAsset = 'assistant/assets/imfra-guide-blink.png';
  const answers = {};
  let surveyScreen = 'intro';
  let surveyStep = 0;
  let advanceTimer = 0;
  let motionPaused = reducedMotion.matches;
  let blinkTimer = 0;
  let typingTimer = 0;

  const root = document.createElement('div');
  root.className = 'imx-experience';
  root.dataset.imxRoot = '';
  root.innerHTML = `
    <button class="imx-launcher" type="button" aria-label="Abrir la guía virtual de IMFRA" aria-expanded="false" data-imx-launcher>
      <span class="imx-launcher__halo" aria-hidden="true"></span>
      <span class="imx-mascot-frame" data-imx-mascot>
        <img class="imx-mascot-frame__base" src="${asset}" alt="" draggable="false">
        <img class="imx-mascot-frame__blink" src="${blinkAsset}" alt="" draggable="false">
      </span>
      <span class="imx-launcher__bubbles" aria-hidden="true">
        <span class="imx-launcher__bubble">¡Hola! Soy tu guía IMFRA 👋</span>
        <span class="imx-launcher__bubble">Cuéntame qué quieres aprender o resolver.</span>
        <span class="imx-launcher__bubble imx-launcher__bubble--accent">Encuentra tu curso ideal <b>→</b></span>
      </span>
      <span class="imx-launcher__hint">Toca para conversar</span>
    </button>

    <section class="imx-chat" role="dialog" aria-label="Guía virtual de IMFRA" aria-hidden="true" data-imx-chat>
      <header class="imx-chat__top">
        <span class="imx-chat__avatar imx-mascot-frame" data-imx-mascot>
          <img class="imx-mascot-frame__base" src="${asset}" alt="Asesora virtual de IMFRA" draggable="false">
          <img class="imx-mascot-frame__blink" src="${blinkAsset}" alt="" draggable="false">
        </span>
        <div class="imx-chat__identity"><strong>Guía IMFRA</strong><span>Construcción · Cursos · Orientación</span></div>
        <div class="imx-chat__controls">
          <button class="imx-icon-button" type="button" data-imx-pause aria-label="Pausar animaciones" aria-pressed="false">Ⅱ</button>
          <button class="imx-icon-button" type="button" data-imx-close aria-label="Cerrar asistente">−</button>
        </div>
      </header>
      <div class="imx-chat__disclosure">Guía digital con información de IMFRA. No sustituye cálculo, dictamen, supervisión responsable ni asesoría legal para una obra específica.</div>
      <div class="imx-chat__messages" role="log" aria-live="polite" data-imx-messages></div>
      <div class="imx-typing" data-imx-typing hidden aria-label="Preparando respuesta"><i></i><i></i><i></i></div>
      <div class="imx-chat__quick" data-imx-quick></div>
      <form class="imx-chat__form" data-imx-form>
        <input type="text" autocomplete="off" maxlength="320" placeholder="Pregunta sobre obra o cursos…" aria-label="Escribe tu pregunta" data-imx-input>
        <button class="imx-chat__send" type="submit" aria-label="Enviar pregunta">↑</button>
      </form>
    </section>

    <div class="imx-survey-layer" data-imx-survey hidden>
      <div class="imx-survey__backdrop" aria-hidden="true"></div>
      <section class="imx-survey__card" role="dialog" aria-modal="true" aria-labelledby="imx-survey-title">
        <span class="imx-survey__mascot imx-mascot-frame" data-imx-mascot>
          <img class="imx-mascot-frame__base" src="${asset}" alt="" draggable="false">
          <img class="imx-mascot-frame__blink" src="${blinkAsset}" alt="" draggable="false">
        </span>
        <button class="imx-survey__close" type="button" data-imx-survey-close aria-label="Cerrar cuestionario">×</button>
        <div class="imx-survey__view" data-imx-survey-view></div>
      </section>
    </div>

    <aside class="imx-cookie" role="dialog" aria-label="Aviso de cookies" data-imx-cookie hidden>
      <div class="imx-cookie__copy"><strong>Tu privacidad importa</strong><span>Usamos almacenamiento necesario para recordar tus preferencias y mejorar la experiencia. Consulta nuestro <a href="${data.brand.privacyUrl}">Aviso de Privacidad</a>.</span></div>
      <button class="imx-cookie__accept" type="button" data-imx-cookie-accept>Acepto</button>
    </aside>`;
  document.body.append(root);
  document.body.classList.add('imx-ready');

  const launcher = root.querySelector('[data-imx-launcher]');
  const chat = root.querySelector('[data-imx-chat]');
  const messages = root.querySelector('[data-imx-messages]');
  const quick = root.querySelector('[data-imx-quick]');
  const form = root.querySelector('[data-imx-form]');
  const input = root.querySelector('[data-imx-input]');
  const typing = root.querySelector('[data-imx-typing]');
  const survey = root.querySelector('[data-imx-survey]');
  const surveyView = root.querySelector('[data-imx-survey-view]');
  const cookie = root.querySelector('[data-imx-cookie]');
  const pauseButton = root.querySelector('[data-imx-pause]');

  const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9ñ\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  const now = () => new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' }).format(new Date());
  const optionOf = (question, value) => question?.options.find((option) => option.value === value);
  const questionById = (id) => data.questions.find((question) => question.id === id);

  function saveSession() {
    try { sessionStorage.setItem(sessionKey, JSON.stringify({ messages: [...messages.querySelectorAll('.imx-message')].slice(-14).map((node) => ({ role: node.classList.contains('imx-message--user') ? 'user' : 'assistant', text: node.querySelector('.imx-message__bubble')?.textContent || '' })) })); } catch {}
  }

  function mascotState(name, active) {
    root.querySelectorAll('[data-imx-mascot]').forEach((node) => node.classList.toggle(`is-${name}`, active));
  }

  function scheduleBlink() {
    clearTimeout(blinkTimer);
    if (motionPaused) return;
    blinkTimer = window.setTimeout(() => {
      mascotState('blinking', true);
      window.setTimeout(() => mascotState('blinking', false), 155);
      window.setTimeout(() => {
        mascotState('blinking', true);
        window.setTimeout(() => mascotState('blinking', false), 120);
      }, 260);
      scheduleBlink();
    }, 3600 + Math.random() * 3200);
  }

  function setTyping(active) {
    clearTimeout(typingTimer);
    typing.hidden = !active;
    mascotState('thinking', active && !motionPaused);
    if (active) messages.scrollTop = messages.scrollHeight;
  }

  function appendMessage(role, text, courseItems = []) {
    const wrapper = document.createElement('article');
    wrapper.className = `imx-message${role === 'user' ? ' imx-message--user' : ''}`;
    const who = document.createElement('div');
    who.className = 'imx-message__who';
    who.textContent = role === 'user' ? 'Tú' : 'IMFRA · GUÍA VIRTUAL';
    const bubble = document.createElement('div');
    bubble.className = 'imx-message__bubble';
    bubble.textContent = text;
    wrapper.append(who, bubble);
    if (courseItems.length) {
      const list = document.createElement('div');
      list.className = 'imx-course-list';
      courseItems.forEach((courseItem) => {
        const index = data.courses.indexOf(courseItem);
        const button = document.createElement('button');
        button.className = 'imx-course-card';
        button.type = 'button';
        button.dataset.imxCourse = String(index);
        button.innerHTML = `<img src="${escapeHtml(courseItem.image)}" alt=""><span><strong>${escapeHtml(courseItem.title)}</strong><span>${escapeHtml(courseItem.price)} · Ver detalles →</span></span>`;
        list.append(button);
      });
      wrapper.append(list);
    }
    const time = document.createElement('time');
    time.className = 'imx-message__time';
    time.textContent = now();
    wrapper.append(time);
    messages.append(wrapper);
    messages.scrollTop = messages.scrollHeight;
    saveSession();
  }

  function setQuick(items) {
    quick.replaceChildren();
    items.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `imx-chip${index === 0 ? ' imx-chip--accent' : ''}`;
      button.dataset.imxAction = item.value;
      button.textContent = item.label;
      quick.append(button);
    });
  }

  function respond(text, courses = [], next = []) {
    setTyping(true);
    typingTimer = window.setTimeout(() => {
      setTyping(false);
      appendMessage('assistant', text, courses);
      mascotState('speaking', !motionPaused);
      window.setTimeout(() => mascotState('speaking', false), 1700);
      setQuick(next.length ? next : homeActions());
    }, reducedMotion.matches ? 80 : 380 + Math.min(text.length * 2, 480));
  }

  const homeActions = () => [
    { label: 'Encontrar mi curso', value: 'survey' },
    { label: 'Explorar conceptos', value: 'concepts' },
    { label: 'Ver cursos', value: 'courses' },
    { label: 'Servicios IMFRA', value: 'services' },
    { label: 'Certificados', value: 'certificates' },
    { label: 'Hablar con un asesor', value: 'human' }
  ];

  function findConcept(query) {
    const normalized = normalize(query);
    return Object.entries(data.concepts).map(([id, concept]) => {
      const aliases = [concept.label, ...(concept.aliases || [])].map(normalize).sort((a, b) => b.length - a.length);
      const score = aliases.reduce((best, alias) => normalized.includes(alias) ? Math.max(best, alias.length + 20) : best, 0);
      return { id, concept, score };
    }).sort((a, b) => b.score - a.score)[0];
  }

  function findCourses(queries, limit = 3) {
    const terms = (Array.isArray(queries) ? queries : [queries]).flatMap((query) => normalize(query).split(' ')).filter((term) => term.length > 3 && !['curso','sobre','para','quiero','aprender','imfra'].includes(term));
    return data.courses.map((courseItem) => {
      const haystack = normalize(`${courseItem.title} ${courseItem.summary} ${Object.values(courseItem.tags).flat().join(' ')}`);
      const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? term.length : 0), 0);
      return { courseItem, score };
    }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map((item) => item.courseItem);
  }

  function conceptReply(entry) {
    const related = findCourses(entry.concept.courses || entry.concept.label, 2);
    const text = `${entry.concept.definition}\n\nEn la práctica: ${entry.concept.practical}${related.length ? '\n\nEn IMFRA contamos con capacitaciones relacionadas para que puedas convertir esta idea en una habilidad aplicable:' : ''}`;
    respond(text, related, [
      { label: 'Ver otro concepto', value: 'concepts' },
      { label: 'Encontrar mi curso', value: 'survey' },
      { label: 'Hacer otra pregunta', value: 'ask' }
    ]);
  }

  function showConceptGroups() {
    respond('Puedo explicarte conceptos de construcción con palabras claras y recomendarte una capacitación relacionada. Elige un área para comenzar:', [], data.conceptGroups.map((group, index) => ({ label: group.label, value: `group:${index}` })));
  }

  function showConceptGroup(index) {
    const group = data.conceptGroups[index];
    if (!group) return showConceptGroups();
    respond(`Perfecto. ¿Qué concepto de ${group.label.toLowerCase()} quieres revisar?`, [], [
      ...group.items.map((id) => ({ label: data.concepts[id]?.label || id, value: `concept:${id}` })),
      { label: 'Volver a las áreas', value: 'concepts' }
    ]);
  }

  function showCourses(query = '') {
    const found = query ? findCourses(query, 3) : data.courses.slice(0, 3);
    respond(query && found.length ? 'Encontré estas opciones relacionadas en el catálogo real de IMFRA:' : 'Estas son algunas de las capacitaciones disponibles en IMFRA. También puedes decirme un tema y busco la mejor coincidencia:', found.length ? found : data.courses.slice(0, 3), [
      { label: 'Buscar otro tema', value: 'ask-course' },
      { label: 'Encontrar mi curso', value: 'survey' },
      { label: 'Ver todos los cursos', value: 'all-courses' }
    ]);
  }

  function handleQuestion(raw) {
    const query = normalize(raw);
    if (!query) return;
    if (/^(hola|buenos dias|buenas tardes|buenas noches|hey|que tal)\b/.test(query)) {
      respond('¡Hola! Soy tu guía IMFRA. Puedo explicarte temas de construcción, ayudarte a elegir una capacitación, buscar un curso o indicarte cómo contactar al equipo. ¿Qué te gustaría resolver?', [], homeActions());
      return;
    }
    if (/curso ideal|recomiend|diagnostico|cuestionario|mi ruta|que curso/.test(query)) { openSurvey(); return; }
    if (/humano|asesor|persona|whatsapp|contacto|hablar con/.test(query)) {
      respond('Puedes hablar directamente con el equipo de IMFRA por WhatsApp. La conversación no se transfiere automáticamente y el horario de respuesta puede variar.', [], [
        { label: 'Abrir WhatsApp', value: 'open-whatsapp' }, { label: 'Seguir preguntando aquí', value: 'ask' }
      ]); return;
    }
    if (/certificado|folio|qr|reconocimiento/.test(query)) {
      respond('Las fichas publicadas de los cursos indican certificado digital o reconocimiento institucional con folio y QR, según la capacitación. Los requisitos específicos de asistencia, evaluación y emisión deben confirmarse en la ficha o con el equipo antes de inscribirte.', findCourses(['certificado','supervision'],2), [
        { label: 'Ver cursos', value: 'courses' }, { label: 'Hablar con un asesor', value: 'human' }
      ]); return;
    }
    if (/servicio|consultoria|proyecto|supervisar mi obra|presupuesto de mi obra/.test(query) && !/curso|aprender|capacit/.test(query)) {
      respond('IMFRA integra ingeniería civil, supervisión de obra, planeación y costos, desarrollo de proyectos y arquitectura de apoyo. Para preparar una propuesta conviene compartir tipo de proyecto, ubicación, etapa actual, alcance esperado y principal restricción de tiempo o presupuesto.', [], [
        { label: 'Solicitar consultoría', value: 'consulting' }, { label: 'Explorar cursos', value: 'courses' }
      ]); return;
    }
    if (/club vip|membresia|plataforma|iniciar sesion|registrarme/.test(query)) {
      respond('El Club VIP es el acceso de IMFRA a su plataforma de capacitación y recursos. Desde el botón “Club VIP” del menú puedes registrarte o iniciar sesión. Si buscas un curso específico, también puedo ayudarte a encontrarlo.', [], [
        { label: 'Entrar al Club VIP', value: 'club' }, { label: 'Encontrar mi curso', value: 'survey' }
      ]); return;
    }
    if (/precio|cuanto cuesta|inversion|costo del curso/.test(query)) {
      const found = findCourses(query, 3);
      respond(found.length ? 'Estos son los precios publicados para las opciones que encontré. Abre una tarjeta para ver también docente, fecha y modalidad:' : 'Los cursos publicados muestran inversiones de $750 MXN y, en el caso de Paisajismo Rentable, $950 MXN. El precio y disponibilidad deben confirmarse antes de reservar.', found.length ? found : data.courses.slice(0,3), [
        { label: 'Ver todos los cursos', value: 'all-courses' }, { label: 'Hablar con un asesor', value: 'human' }
      ]); return;
    }
    if (/calcula|dimensiona|cuanto acero|cuanta varilla|seccion de|capacidad de carga|diseña.*estructura|es seguro demoler/.test(query)) {
      respond('Ese resultado depende de planos, geometría, cargas, materiales, suelo, estado existente y normativa aplicable. Dar una dimensión o cantidad sin revisar esos datos podría ser inseguro. Puedo ayudarte a ordenar la información necesaria, pero el cálculo y la validación deben realizarlos y firmarlos profesionales responsables del proyecto.', findCourses(['supervision','trabes'],2), [
        { label: '¿Qué información debo reunir?', value: 'info-calculo' }, { label: 'Hablar con un asesor', value: 'human' }
      ]); return;
    }
    if (/accidente|riesgo inminente|colapso|grieta peligrosa|electrocucion|derrumbe/.test(query)) {
      respond('Si existe riesgo inmediato, detén el trabajo, aísla el área y sigue el plan de emergencias de la obra. No intentes diagnosticar ni corregir desde el chat. Solicita revisión en sitio por el responsable de seguridad y el especialista correspondiente antes de reanudar actividades.', [], [
        { label: 'Hablar con un asesor', value: 'human' }, { label: 'Seguridad en obra', value: 'concept:seguridad' }
      ]); return;
    }

    const conceptMatch = findConcept(query);
    if (conceptMatch?.score) { conceptReply(conceptMatch); return; }
    const courses = findCourses(query, 3);
    if (courses.length) {
      respond('Tu pregunta se relaciona con estos temas del catálogo de IMFRA. Para orientarte mejor, identifica primero el resultado que buscas, qué experiencia tienes y en qué proyecto lo aplicarás. Estas capacitaciones pueden darte una base práctica:', courses, [
        { label: 'Encontrar mi curso', value: 'survey' }, { label: 'Explorar conceptos', value: 'concepts' }, { label: 'Hablar con un asesor', value: 'human' }
      ]); return;
    }
    respond('Puedo ayudarte a convertir esa duda en un siguiente paso. Si se trata de construcción, dime: qué tipo de proyecto es, en qué etapa está, qué quieres lograr y qué información ya tienes. Si buscas capacitación, escribe el tema —por ejemplo supervisión, costos, contratos, generadores, SketchUp o gerencia— y te mostraré opciones reales de IMFRA.', [], homeActions());
  }

  function openChat() {
    launcher.hidden = true;
    chat.classList.add('is-open');
    chat.setAttribute('aria-hidden', 'false');
    launcher.setAttribute('aria-expanded', 'true');
    document.body.classList.add('imx-chat-open');
    if (!messages.children.length) {
      appendMessage('assistant', 'Hola, soy tu guía IMFRA. Puedo explicarte conceptos de construcción, recomendarte cursos reales o prepararte una ruta personalizada en 7 preguntas. ¿Qué te gustaría hacer?');
      setQuick(homeActions());
    }
    window.setTimeout(() => input.focus({ preventScroll: true }), 120);
  }

  function closeChat() {
    setTyping(false);
    chat.classList.remove('is-open');
    chat.setAttribute('aria-hidden', 'true');
    launcher.hidden = false;
    launcher.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('imx-chat-open');
  }

  function openCourse(index) {
    const courseItem = data.courses[index];
    if (!courseItem) return;
    closeChat();
    closeSurvey();
    if (typeof window.openCurso === 'function') window.openCurso(index);
    else document.getElementById('cursos')?.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  }

  function initialSurveyMarkup() {
    return `<div class="imx-survey__pane imx-survey__pane--intro">
      <p class="imx-survey__eyebrow">Tu guía IMFRA</p>
      <h2 class="imx-survey__title" id="imx-survey-title">Descubramos la capacitación que puede darte <span>tu siguiente ventaja profesional.</span></h2>
      <p class="imx-survey__note">Son 7 preguntas sencillas, no pedimos nombre ni teléfono y recibes un resultado inmediato.</p>
      <ul class="imx-survey__features" aria-label="Características"><li>Sin registro</li><li>Menos de 2 minutos</li><li>Recomendación personalizada</li></ul>
      <div class="imx-survey__actions"><button class="imx-button imx-button--primary" type="button" data-imx-start>Preparar mi ruta</button><button class="imx-button imx-button--secondary" type="button" data-imx-survey-close>Ahora no</button></div>
    </div>`;
  }

  function questionMarkup(question) {
    const progress = Math.round(((surveyStep + 1) / data.questions.length) * 100);
    const options = question.options.map((option) => {
      const selected = answers[question.id] === option.value;
      const visual = option.image ? `<span class="imx-option__image" style="background-image:url('${escapeHtml(option.image)}')"></span>` : `<span class="imx-option__icon" aria-hidden="true">${option.icon || '◆'}</span>`;
      return `<button class="imx-option${selected ? ' is-selected' : ''}" type="button" data-imx-option="${escapeHtml(option.value)}" aria-pressed="${selected}">${visual}<span class="imx-option__copy"><strong>${escapeHtml(option.title)}</strong>${option.detail ? `<small>${escapeHtml(option.detail)}</small>` : ''}</span><span class="imx-option__check" aria-hidden="true">✓</span></button>`;
    }).join('');
    return `<div class="imx-survey__pane imx-survey__pane--question">
      <div class="imx-progress" aria-label="Pregunta ${surveyStep + 1} de ${data.questions.length}"><span>Pregunta ${surveyStep + 1} de ${data.questions.length}</span><b>${progress}%</b><i><em style="width:${progress}%"></em></i></div>
      <p class="imx-survey__eyebrow">${escapeHtml(question.kicker)}</p><h2 class="imx-survey__question" id="imx-survey-title" tabindex="-1">${escapeHtml(question.title)}</h2><p class="imx-survey__hint">${escapeHtml(question.hint)}</p>
      <div class="imx-options">${options}</div><div class="imx-survey__actions imx-survey__actions--steps"><button class="imx-button imx-button--secondary" type="button" data-imx-back>${surveyStep ? 'Atrás' : 'Volver'}</button><span class="imx-auto-note">Elige una respuesta y avanzamos automáticamente</span></div>
    </div>`;
  }

  const learningProfiles = {
    video: ['visual y auditivo', 'Tienes facilidad para convertir explicaciones complejas en una secuencia clara que puedes recordar y comunicar.'],
    cases: ['analítico y observador', 'Sabes encontrar patrones en situaciones reales y convertir la experiencia de otros en mejores decisiones propias.'],
    guides: ['metódico y organizado', 'Tu fortaleza está en estructurar la información y construir referencias confiables para no depender de la memoria.'],
    tools: ['práctico y resolutivo', 'No te conformas con entender: buscas convertir cada idea en una herramienta, cálculo o procedimiento útil.'],
    mix: ['flexible y multidisciplinario', 'Puedes alternar análisis, comunicación y práctica; esa adaptabilidad es muy valiosa en proyectos complejos.']
  };
  const growthText = {
    start: 'Tu siguiente oportunidad es elegir una base concreta y avanzar con orden, sin sentir que debes dominar toda la construcción de una sola vez.',
    practice: 'Puedes crecer aún más documentando cada ejercicio y comparándolo con un caso real de obra.',
    control: 'Tu siguiente nivel está en convertir observaciones en registros, indicadores y decisiones con responsable y fecha.',
    money: 'Puedes potenciar tu criterio conectando cada decisión técnica con su impacto en costo, flujo y cierre del proyecto.',
    risk: 'Tu atención al detalle puede volverse una ventaja enorme si la conviertes en prevención y acuerdos bien documentados.',
    present: 'Tu siguiente paso es construir una narrativa visual clara: qué problema resuelves, cómo lo demuestras y por qué tu propuesta importa.'
  };

  function recommendCourse() {
    return data.courses.map((courseItem, index) => {
      let score = 0;
      const tags = courseItem.tags;
      if (tags.interests.includes(answers.interest)) score += 40;
      if (tags.goals.includes(answers.goal)) score += 20;
      if (tags.problems.includes(answers.need)) score += 18;
      if (tags.profiles.includes(answers.profile)) score += 10;
      const level = optionOf(questionById('experience'), answers.experience)?.level;
      if (tags.levels.includes(level)) score += 8;
      if (answers.time === 'lt1' && ['sheets','sketchup','quantities'].includes(courseItem.id)) score += 2;
      return { courseItem, index, score };
    }).sort((a, b) => b.score - a.score || a.index - b.index)[0];
  }

  function resultMarkup() {
    const recommendation = recommendCourse();
    const courseItem = recommendation.courseItem;
    const learning = learningProfiles[answers.format] || learningProfiles.mix;
    const growth = growthText[answers.need] || growthText.start;
    return `<div class="imx-survey__pane imx-survey__pane--result">
      <p class="imx-survey__eyebrow">Tu ruta está lista</p><h2 class="imx-survey__title" id="imx-survey-title" tabindex="-1">Tienes un perfil <span>${escapeHtml(learning[0])}.</span></h2>
      <div class="imx-profile"><span class="imx-profile__spark" aria-hidden="true">✨</span><p><strong>Esto dice algo muy bueno de ti:</strong> ${escapeHtml(learning[1])}</p><p>${escapeHtml(growth)}</p></div>
      <article class="imx-result-course"><div class="imx-result-course__image" style="background-image:url('${escapeHtml(courseItem.image)}')"></div><div class="imx-result-course__copy"><span>Tu mejor siguiente paso</span><h3>${escapeHtml(courseItem.title)}</h3><p>${escapeHtml(courseItem.summary)}</p><div class="imx-result-meta"><b>${escapeHtml(courseItem.price)}</b><b>${escapeHtml(courseItem.modality)}</b><b>${escapeHtml(courseItem.certificate)}</b></div><div class="imx-result-course__buttons"><button class="imx-button imx-button--primary" type="button" data-imx-result-course="${recommendation.index}">Ver capacitación</button><button class="imx-button imx-button--secondary" type="button" data-imx-restart>Repetir ruta</button></div></div></article>
    </div>`;
  }

  function renderSurvey() {
    surveyView.innerHTML = surveyScreen === 'intro' ? initialSurveyMarkup() : surveyScreen === 'result' ? resultMarkup() : questionMarkup(data.questions[surveyStep]);
    window.requestAnimationFrame(() => surveyView.querySelector('[tabindex="-1"], [data-imx-start]')?.focus({ preventScroll: true }));
  }

  function openSurvey() {
    closeChat();
    clearTimeout(advanceTimer);
    cookie.hidden = true;
    survey.hidden = false;
    document.body.classList.add('imx-scroll-lock');
    renderSurvey();
  }

  function closeSurvey() {
    clearTimeout(advanceTimer);
    survey.hidden = true;
    document.body.classList.remove('imx-scroll-lock');
    window.setTimeout(showCookieIfNeeded, 180);
  }

  function showCookieIfNeeded() {
    if (!survey.hidden || document.querySelector('#cursoModal.open')) {
      cookie.hidden = true;
      if (document.querySelector('#cursoModal.open')) window.setTimeout(showCookieIfNeeded, 650);
      return;
    }
    try { cookie.hidden = localStorage.getItem(cookieKey) === 'accepted'; } catch { cookie.hidden = false; }
  }

  survey.addEventListener('click', (event) => {
    if (event.target.closest('[data-imx-survey-close]') || event.target.classList.contains('imx-survey__backdrop')) { closeSurvey(); return; }
    if (event.target.closest('[data-imx-start]')) { surveyScreen = 'question'; surveyStep = 0; renderSurvey(); return; }
    if (event.target.closest('[data-imx-restart]')) { Object.keys(answers).forEach((key) => delete answers[key]); surveyScreen = 'question'; surveyStep = 0; renderSurvey(); return; }
    const resultCourse = event.target.closest('[data-imx-result-course]');
    if (resultCourse) { openCourse(Number(resultCourse.dataset.imxResultCourse)); return; }
    if (event.target.closest('[data-imx-back]')) { if (surveyStep === 0) surveyScreen = 'intro'; else surveyStep -= 1; renderSurvey(); return; }
    const option = event.target.closest('[data-imx-option]');
    if (!option || surveyScreen !== 'question') return;
    const question = data.questions[surveyStep];
    answers[question.id] = option.dataset.imxOption;
    surveyView.querySelectorAll('[data-imx-option]').forEach((button) => {
      const selected = button === option;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
      button.disabled = true;
    });
    const pane = surveyView.querySelector('.imx-survey__pane');
    pane?.classList.add('is-advancing');
    clearTimeout(advanceTimer);
    advanceTimer = window.setTimeout(() => {
      if (surveyStep === data.questions.length - 1) surveyScreen = 'result'; else surveyStep += 1;
      renderSurvey();
    }, reducedMotion.matches ? 60 : 270);
  });

  quick.addEventListener('click', (event) => {
    const button = event.target.closest('[data-imx-action]');
    if (!button) return;
    const action = button.dataset.imxAction;
    appendMessage('user', button.textContent.trim());
    if (action === 'survey') { openSurvey(); return; }
    if (action === 'concepts') { showConceptGroups(); return; }
    if (action.startsWith('group:')) { showConceptGroup(Number(action.split(':')[1])); return; }
    if (action.startsWith('concept:')) { const entry = { id: action.slice(8), concept: data.concepts[action.slice(8)] }; if (entry.concept) conceptReply(entry); return; }
    if (action === 'courses') { showCourses(); return; }
    if (action === 'all-courses') { closeChat(); document.getElementById('cursos')?.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth' }); return; }
    if (action === 'ask' || action === 'ask-course') { respond(action === 'ask-course' ? 'Escribe el tema que quieres aprender y buscaré coincidencias en el catálogo de IMFRA.' : 'Escribe tu pregunta. Si puedes, incluye el tipo de proyecto, la etapa y lo que quieres lograr.'); input.focus(); return; }
    if (action === 'services') { handleQuestion('servicios de consultoría'); return; }
    if (action === 'certificates') { handleQuestion('certificados'); return; }
    if (action === 'human') { handleQuestion('hablar con un asesor'); return; }
    if (action === 'info-calculo') { respond('Para revisar un cálculo o intervención suelen requerirse: ubicación y uso, planos y levantamiento, geometría, materiales y resistencias, cargas, estudio de suelo cuando aplique, condición existente, normativa, fotografías y objetivo de la modificación. El especialista responsable definirá qué información adicional necesita.', findCourses(['supervision','estructuras'],2)); return; }
    if (action === 'open-whatsapp' || action === 'consulting') { window.open(`https://wa.me/${data.brand.generalWhatsapp}?text=${encodeURIComponent('Hola IMFRA Desarrollo, vengo de la guía virtual y quiero recibir orientación.')}`, '_blank', 'noopener'); return; }
    if (action === 'club') { window.location.href = 'vip-auth.html'; return; }
    handleQuestion(button.textContent);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    appendMessage('user', value);
    input.value = '';
    handleQuestion(value);
  });

  messages.addEventListener('click', (event) => {
    const card = event.target.closest('[data-imx-course]');
    if (card) openCourse(Number(card.dataset.imxCourse));
  });

  root.querySelector('[data-imx-close]').addEventListener('click', closeChat);
  pauseButton.addEventListener('click', () => {
    motionPaused = !motionPaused;
    pauseButton.setAttribute('aria-pressed', String(motionPaused));
    pauseButton.textContent = motionPaused ? '▶' : 'Ⅱ';
    pauseButton.setAttribute('aria-label', motionPaused ? 'Reanudar animaciones' : 'Pausar animaciones');
    root.querySelectorAll('[data-imx-mascot]').forEach((node) => node.classList.remove('is-thinking','is-speaking','is-blinking'));
    scheduleBlink();
  });

  let drag = null;
  function launcherPoint(event) { return { x: event.clientX, y: event.clientY }; }
  launcher.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    const rect = launcher.getBoundingClientRect();
    const point = launcherPoint(event);
    drag = { id: event.pointerId, startX: point.x, startY: point.y, left: rect.left, top: rect.top, moved: false };
    launcher.setPointerCapture(event.pointerId);
  });
  launcher.addEventListener('pointermove', (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const point = launcherPoint(event);
    const dx = point.x - drag.startX, dy = point.y - drag.startY;
    if (Math.hypot(dx, dy) > 6) drag.moved = true;
    if (!drag.moved) return;
    const width = launcher.offsetWidth, height = launcher.offsetHeight;
    const left = Math.min(Math.max(4, drag.left + dx), window.innerWidth - width - 4);
    const top = Math.min(Math.max(4, drag.top + dy), window.innerHeight - height - 4);
    launcher.style.left = `${left}px`; launcher.style.top = `${top}px`; launcher.style.bottom = 'auto';
  });
  launcher.addEventListener('pointerup', (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const moved = drag.moved;
    drag = null;
    if (moved) {
      try { localStorage.setItem(positionKey, JSON.stringify({ left: parseFloat(launcher.style.left), top: parseFloat(launcher.style.top) })); } catch {}
    } else openChat();
  });
  launcher.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openChat(); } });

  function restoreLauncherPosition() {
    if (mobile.matches) { launcher.style.left = ''; launcher.style.top = ''; launcher.style.bottom = ''; return; }
    try {
      const saved = JSON.parse(localStorage.getItem(positionKey) || '{}');
      if (!Number.isFinite(saved.left) || !Number.isFinite(saved.top)) return;
      launcher.style.left = `${Math.min(Math.max(4, saved.left), window.innerWidth - launcher.offsetWidth - 4)}px`;
      launcher.style.top = `${Math.min(Math.max(4, saved.top), window.innerHeight - launcher.offsetHeight - 4)}px`;
      launcher.style.bottom = 'auto';
    } catch {}
  }
  window.addEventListener('resize', restoreLauncherPosition, { passive: true });

  root.querySelector('[data-imx-cookie-accept]').addEventListener('click', () => {
    try { localStorage.setItem(cookieKey, 'accepted'); } catch {}
    cookie.hidden = true;
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!survey.hidden) closeSurvey(); else if (chat.classList.contains('is-open')) closeChat();
  });
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-imx-open-survey]')) openSurvey();
  });

  try {
    const saved = JSON.parse(sessionStorage.getItem(sessionKey) || '{}');
    (saved.messages || []).slice(-8).forEach((message) => appendMessage(message.role, message.text));
  } catch {}
  if (messages.children.length) setQuick(homeActions());
  restoreLauncherPosition();
  scheduleBlink();
  window.setTimeout(openSurvey, 720);
  window.setTimeout(showCookieIfNeeded, 1100);
})();
