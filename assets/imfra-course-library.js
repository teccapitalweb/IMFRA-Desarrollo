(function () {
  'use strict';

  const filters = { search: '', area: '', level: '', sort: 'next', status: 'all' };
  const statuses = {
    all: 'Todos', open: 'Disponibles', progress: 'En progreso', completed: 'Completados',
    locked: 'Bloqueados', soon: 'Próximamente'
  };
  const sorts = {
    next: 'Próximos a desbloquear', priority: 'Mi orden de prioridad',
    name: 'Nombre', progress: 'Progreso', recent: 'Más recientes'
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
  const key = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const icon = name => `<svg class="ic" aria-hidden="true"><use href="#i-${name}"/></svg>`;

  function sortCourses(items, unlocks) {
    const priority = new Map((unlocks?.priorities || []).map((id, index) => [id, index]));
    const rank = item => priority.get(item.course.bunnyCollectionId) ?? Number.MAX_SAFE_INTEGER;
    const byTitle = (a, b) => a.course.titulo.localeCompare(b.course.titulo, 'es');
    const byOrder = (a, b) => a.order - b.order;
    const byPriority = (a, b) => rank(a) - rank(b);
    const byDate = (a, b) => (Date.parse(b.course.createdAt) || 0) - (Date.parse(a.course.createdAt) || 0);
    const byUpcoming = (a, b) => Number(a.soon) - Number(b.soon) ||
      Number(b.open) - Number(a.open) || byPriority(a, b) || byOrder(a, b);
    const comparisons = {
      next: byUpcoming,
      priority: (a, b) => byPriority(a, b) || byUpcoming(a, b),
      name: byTitle,
      progress: (a, b) => b.progress - a.progress || byUpcoming(a, b),
      recent: (a, b) => byDate(a, b) || byOrder(b, a)
    };
    return items.sort(comparisons[filters.sort]);
  }

  function option(value, label, selected) {
    return `<option value="${esc(value)}" ${selected === value ? 'selected' : ''}>${esc(label)}</option>`;
  }

  function mount(container, options) {
    const { courses } = options;
    const areas = [...new Set(courses.map(course => course.area).filter(Boolean))].sort();
    const levels = [...new Set(courses.map(course => course.nivel).filter(Boolean))].sort();
    if (!areas.includes(filters.area)) filters.area = '';
    if (!levels.includes(filters.level)) filters.level = '';
    container.innerHTML = `<div class="course-library fade-up">
      <div class="course-library__heading"><h1>Mis cursos</h1><p>${courses.length} ${courses.length === 1 ? 'programa' : 'programas'}</p></div>
      <div data-course-unlocks></div>
      <section class="course-library__controls" aria-label="Buscar y filtrar cursos">
        <div class="course-library__filters">
          <label>Buscar cursos<input type="search" id="cur-search" placeholder="Curso o instructor" value="${esc(filters.search)}"></label>
          <label>Categoría<select id="cur-area">${option('', 'Todas', filters.area)}${areas.map(area => option(area, area, filters.area)).join('')}</select></label>
          <label>Nivel<select id="cur-level">${option('', 'Todos', filters.level)}${levels.map(level => option(level, level, filters.level)).join('')}</select></label>
          <label>Ordenar<select id="cur-sort">${Object.entries(sorts).map(([value, label]) => option(value, label, filters.sort)).join('')}</select></label>
        </div>
        <div class="course-library__status" aria-label="Estado del curso">
          ${Object.entries(statuses).map(([value, label]) => `<button type="button" data-course-filter="${value}" aria-pressed="${filters.status === value}">${label}</button>`).join('')}
          <span class="course-library__count" aria-live="polite"></span>
        </div>
      </section>
      <div id="cur-list"></div>
    </div>`;
    const root = container.querySelector('.course-library');
    root.querySelector('#cur-search').oninput = event => { filters.search = event.target.value; update(root, options); };
    for (const field of ['area', 'level', 'sort']) {
      root.querySelector('#cur-' + field).onchange = event => { filters[field] = event.target.value; update(root, options); };
    }
    const buttons = root.querySelectorAll('[data-course-filter]');
    for (const button of buttons) {
      button.onclick = () => {
        filters.status = button.dataset.courseFilter;
        for (const item of buttons) item.setAttribute('aria-pressed', String(item === button));
        update(root, options);
      };
    }
    update(root, options);
    return root;
  }

  function update(root, options) {
    if (!root?.isConnected) return;
    const { courses, describe, openCourse, chooseFree, fallbackCover } = options;
    const list = root.querySelector('#cur-list');
    const unlocks = window.IMFRACourseUnlocks;
    const state = unlocks?.get();
    const refresh = () => {
      options.onUnlockChange();
      update(root, options);
    };
    unlocks?.mount(root.querySelector('[data-course-unlocks]'), courses, refresh);

    const search = key(filters.search.trim());
    const items = courses.map(course => ({ ...describe(course), course })).filter(item => {
      const course = item.course;
      if (filters.area && course.area !== filters.area) return false;
      if (filters.level && course.nivel !== filters.level) return false;
      if (search && !key([course.titulo, course.instructor, course.area].join(' ')).includes(search)) return false;
      if (filters.status === 'open') return item.open;
      return filters.status === 'all' || filters.status === item.status;
    });
    sortCourses(items, state);
    root.querySelector('.course-library__count').textContent = `${items.length} de ${courses.length} cursos`;
    if (!items.length) {
      list.innerHTML = `<div class="empty-state"><h3>${courses.length ? 'Sin resultados' : 'Aún no hay cursos publicados'}</h3>
        ${courses.length ? '<p>Cambia los filtros o intenta otra búsqueda.</p>' : ''}</div>`;
      return;
    }

    list.innerHTML = `<div class="course-library__grid">${items.map(({ course, status, label, open, progress, free, resources }, index) => {
      const ready = state?.enabled && state.eligibleCourseIds.includes(course.bunnyCollectionId);
      const rank = (state?.priorities || []).indexOf(course.bunnyCollectionId) + 1;
      const action = !open ? 'Ver detalles' : status === 'completed' ? 'Revisar curso'
        : progress ? 'Continuar' : 'Iniciar curso';
      return `<article class="curso-card" data-cid="${esc(course.id)}">
        <div class="curso-card__cover"><img src="${esc(course.portada || fallbackCover)}" alt="" width="1200" height="675" decoding="async" loading="${index < 4 ? 'eager' : 'lazy'}"></div>
        <div class="curso-card__body">
          <div class="curso-card__tags"><span class="tag">${esc(course.area)}</span><span class="tag">${esc(course.nivel)}</span></div>
          <h3 class="curso-card__title" title="${esc(course.titulo)}">${esc(course.titulo)}</h3>
          <div class="curso-card__meta">
            ${course.instructor ? `<span>${icon('user')}${esc(course.instructor.replace(/Equipo IMFRA/i, 'IMFRA'))}</span>` : ''}
            ${course.horas ? `<span>${icon('clock')}${esc(course.horas)} h</span>` : ''}
            <span>${icon('book')}${course.sesiones.length} ${course.sesiones.length === 1 ? 'clase' : 'clases'}</span>
            ${resources ? `<span>${icon('news')}${resources} ${resources === 1 ? 'recurso' : 'recursos'}</span>` : ''}
          </div>
          <div class="curso-card__rating" data-course-rating="${esc(course.id)}" hidden></div>
          ${progress ? `<div class="curso-card__progress" aria-label="${progress}% completado"><div class="curso-card__progress-bar"><div class="curso-card__progress-fill" style="width:${progress}%"></div></div><span class="curso-card__progress-pct">${progress}%</span></div>` : ''}
          <div class="curso-card__footer">
            <div class="curso-card__footer-line">
              <span class="curso-card__state${open ? ' is-open' : ''}">${icon(open ? 'check' : 'shield-check')}${esc(label)}</span>
              ${ready ? `<button type="button" class="curso-card__priority" data-course-prioritize>${rank ? 'Prioridad #' + rank : 'Priorizar'}</button>` : ''}
            </div>
            ${free ? '<button type="button" class="curso-card__action is-primary" data-course-free>Elegir gratis</button>'
              : ready && state.available ? '<button type="button" class="curso-card__action is-primary" data-course-choose>Elegir curso</button>'
              : `<button type="button" class="curso-card__action${open ? ' is-primary' : ''}" data-course-details aria-label="${action}: ${esc(course.titulo)}">${action} ${icon('arrow-right')}</button>`}
            ${free || (ready && state.available) ? `<button type="button" class="curso-card__more" data-course-details aria-label="Ver detalles: ${esc(course.titulo)}">Ver detalles ${icon('arrow-right')}</button>` : ''}
          </div>
        </div>
      </article>`;
    }).join('')}</div>`;
    const byId = new Map(courses.map(course => [String(course.id), course]));
    for (const card of list.querySelectorAll('.curso-card')) {
      const course = byId.get(card.dataset.cid);
      card.querySelector('img').onerror = event => { event.target.onerror = null; event.target.src = fallbackCover; };
      card.querySelector('[data-course-details]').onclick = () => openCourse(course.id);
      card.onclick = event => { if (!event.target.closest('button, a')) openCourse(course.id); };
      const freeButton = card.querySelector('[data-course-free]');
      if (freeButton) freeButton.onclick = () => chooseFree(course);
      const choose = card.querySelector('[data-course-choose]');
      if (choose) choose.onclick = () => unlocks.open(courses, refresh, 'select', course.bunnyCollectionId);
      const priority = card.querySelector('[data-course-prioritize]');
      if (priority) priority.onclick = () => unlocks.open(courses, refresh, 'priorities', course.bunnyCollectionId);
    }
    window.IMFRACourseRatings?.mountCatalog(list, courses.map(course => String(course.id)));
  }

  window.IMFRACourseLibrary = { mount, update };
})();
