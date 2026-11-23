(function () {
  'use strict';

  const endpoint = '/api/courses/unlocks';
  let owner = '';
  let state = null;
  let pending = null;
  let failed = false;

  const user = () => window.__currentUser;
  function sameAccount() {
    const uid = user()?.uid || '';
    if (uid !== owner) {
      owner = uid;
      state = null;
      pending = null;
      failed = false;
    }
    return uid;
  }

  async function request(path = '', method = 'GET', body) {
    const account = user();
    if (!account) return { enabled: false };
    const headers = { Authorization: 'Bearer ' + await account.getIdToken() };
    if (body) headers['Content-Type'] = 'application/json';
    const response = await fetch(window.WEBHOOK_URL + endpoint + path, {
      method, headers, cache: 'no-store', body: body && JSON.stringify(body)
    });
    if (response.status === 404 && !path) return { enabled: false };
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(data.error || 'No pudimos actualizar tus desbloqueos.'), {
      status: response.status
    });
    return data;
  }

  function load(force = false) {
    const uid = sameAccount();
    if (!uid) return Promise.resolve(null);
    if (pending) return pending;
    if (state && !force) return Promise.resolve(state);
    const operation = request().then(data => {
      if (sameAccount() === uid) {
        if (!(Number.isInteger(state?.revision) && Number.isInteger(data.revision) && state.revision > data.revision)) {
          state = data;
        }
        failed = false;
      }
      return state;
    }).catch(() => {
      if (sameAccount() === uid) failed = true;
      return state;
    }).finally(() => {
      if (pending === operation) pending = null;
    });
    pending = operation;
    return operation;
  }

  function hasPendingLoad() {
    return !!sameAccount() && !state && !failed;
  }

  function dateLabel(iso) {
    return new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeZone: 'America/Mexico_City' }).format(new Date(iso));
  }

  function mount(host, courses, onChange) {
    if (!host) return;
    const uid = sameAccount();
    host.replaceChildren();
    if (!state && !failed) return;
    if (!state && failed) {
      host.innerHTML = '<section class="course-unlocks" role="status"><p>No pudimos consultar tus desbloqueos.</p><button type="button" class="course-route-button">Reintentar</button></section>';
      host.querySelector('button').onclick = async () => { await load(true); if (host.isConnected && sameAccount() === uid) onChange(); };
      return;
    }
    if (!state.enabled && !state.isAdmin) return;
    if (window.__isTrialActive?.() && !state.isAdmin) return;

    host.innerHTML = `<section class="course-unlocks" aria-label="Mis desbloqueos">
      <div class="course-unlocks__icon"><svg class="ic" aria-hidden="true"><use href="#i-shield-check"/></svg></div>
      <div class="course-unlocks__copy"><h2>Mis desbloqueos</h2><p data-unlock-status></p><small data-unlock-priority hidden></small></div>
      <div class="course-unlocks__actions"></div>
    </section>`;
    const status = host.querySelector('[data-unlock-status]');
    const actions = host.querySelector('.course-unlocks__actions');
    const first = courses.find(course => course.bunnyCollectionId === state.priorities?.[0]);
    if (first) {
      const hint = host.querySelector('[data-unlock-priority]');
      hint.hidden = false;
      hint.textContent = 'Primero en tu lista · ' + first.titulo;
    }
    if (state.isAdmin) {
      status.textContent = 'Acceso a todos los cursos';
      return;
    }
    const count = state.available;
    const hasEligible = state.eligibleCourseIds.length > 0;
    if (!hasEligible) status.textContent = 'Ya elegiste todos los cursos disponibles.';
    else if (!state.active) status.textContent = 'Organiza tu lista para cuando actives tu membresía.';
    else if (count) status.textContent = count === 1 ? 'Tienes un curso por elegir' : `Tienes ${count} cursos por elegir`;
    else if (state.nextUnlockAt) status.textContent = 'Siguiente cupo el ' + dateLabel(state.nextUnlockAt);
    else status.textContent = 'Recibe otro cupo después de seis días de acceso VIP.';

    if (count) actions.append(action('Elegir cursos', () => open(courses, onChange, 'select')));
    if (hasEligible) actions.append(action('Organizar lista', () => open(courses, onChange, 'priorities'), 'is-quiet'));
  }

  function action(label, callback, modifier = '') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'course-route-button ' + modifier;
    button.textContent = label;
    button.onclick = callback;
    return button;
  }

  function open(courses, onChange, mode, firstId) {
    if (!sameAccount() || !state?.enabled) return;
    if (mode === 'select' && !state.available) return;
    const uid = owner;
    let startingState = state;
    const byId = new Map(courses.map(course => [course.bunnyCollectionId, course]));
    const candidates = () => startingState.eligibleCourseIds.filter(id => byId.has(id));
    const selectable = () => [...new Set([...startingState.priorities, ...candidates()])]
      .filter(id => candidates().includes(id));
    let selection = mode === 'select' && candidates().includes(firstId) ? [firstId] : [];
    let priorities = startingState.priorities.filter(id => candidates().includes(id));
    if (mode === 'priorities' && candidates().includes(firstId) && !priorities.includes(firstId)) {
      priorities = [firstId, ...priorities];
    }
    let busy = false;
    let requestId = '';
    let confirmed = '';
    let returnFocus = document.activeElement;

    const dialog = document.createElement('dialog');
    dialog.className = 'course-unlock-picker';
    dialog.setAttribute('aria-labelledby', 'course-unlock-picker-title');
    const choose = mode === 'select';
    dialog.innerHTML = `<div class="course-unlock-picker__head">
      <div><h2 id="course-unlock-picker-title">${choose ? 'Elige tus cursos' : 'Organiza tus próximos cursos'}</h2>
      <p>${choose ? 'Confirma los cursos que quieres abrir. Tus cupos restantes se conservan.' : 'Guarda tus prioridades para encontrarlas cuando tengas un cupo.'}</p></div>
      <button type="button" class="course-route-button is-quiet" aria-label="Cerrar" data-route-close>×</button>
    </div>
    <div class="course-unlock-picker__body" data-route-body></div>
    <p class="course-unlock-picker__status" aria-live="polite"></p>
    <div class="course-unlock-picker__footer"><button type="button" class="course-route-button is-quiet" data-route-cancel>Cancelar</button><button type="button" class="course-route-button" data-route-save>${choose ? 'Confirmar selección' : 'Guardar orden'}</button></div>`;
    const content = dialog.querySelector('[data-route-body]');
    const status = dialog.querySelector('.course-unlock-picker__status');
    const save = dialog.querySelector('[data-route-save]');
    const close = () => { if (!busy) dialog.close(); };
    dialog.querySelector('[data-route-close]').onclick = close;
    dialog.querySelector('[data-route-cancel]').onclick = close;
    dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
    dialog.addEventListener('close', () => {
      dialog.remove();
      if (returnFocus?.isConnected) returnFocus.focus();
      returnFocus = null;
    }, { once: true });

    function render() {
      content.replaceChildren();
      if (choose) {
        const count = document.createElement('p');
        count.className = 'course-unlock-picker__count';
        count.textContent = `${selection.length} de ${startingState.available} cupos seleccionados`;
        content.append(count);
        for (const id of selectable()) {
          const course = byId.get(id);
          const label = document.createElement('label');
          label.className = 'course-unlock-option';
          const input = document.createElement('input');
          input.type = 'checkbox';
          input.checked = selection.includes(id);
          input.disabled = busy || (!input.checked && selection.length >= startingState.available);
          input.dataset.course = id;
          input.onchange = () => {
            selection = input.checked ? [...selection, id] : selection.filter(value => value !== id);
            status.textContent = '';
            render();
            [...content.querySelectorAll('input')].find(option => option.dataset.course === id)?.focus();
          };
          label.append(input, document.createTextNode(course.titulo));
          content.append(label);
        }
      } else {
        const ordered = document.createElement('ol');
        ordered.className = 'course-unlock-order';
        for (const [index, id] of priorities.entries()) {
          const row = document.createElement('li');
          const label = document.createElement('strong');
          label.textContent = byId.get(id).titulo;
          const move = offset => {
            const order = priorities.slice();
            [order[index], order[index + offset]] = [order[index + offset], order[index]];
            priorities = order;
            render();
            [...content.querySelectorAll('button')].find(button => button.dataset.course === id && !button.disabled)?.focus();
          };
          const up = action('↑', () => move(-1), 'is-quiet');
          up.setAttribute('aria-label', 'Subir ' + label.textContent);
          up.dataset.course = id;
          up.disabled = !index || busy;
          const down = action('↓', () => move(1), 'is-quiet');
          down.setAttribute('aria-label', 'Bajar ' + label.textContent);
          down.dataset.course = id;
          down.disabled = index === priorities.length - 1 || busy;
          const remove = action('Quitar', () => { priorities = priorities.filter(value => value !== id); render(); }, 'is-quiet');
          remove.disabled = busy;
          row.append(label, up, down, remove);
          ordered.append(row);
        }
        content.append(ordered);
        for (const id of candidates().filter(id => !priorities.includes(id))) {
          const button = action('Añadir · ' + byId.get(id).titulo, () => { priorities = [...priorities, id]; render(); }, 'is-quiet');
          button.disabled = busy;
          content.append(button);
        }
      }
      save.disabled = busy || (choose && !selection.length);
    }

    save.onclick = async () => {
      if (busy || sameAccount() !== uid) return;
      busy = true;
      status.textContent = 'Guardando…';
      render();
      const fingerprint = JSON.stringify(selection);
      if (choose && fingerprint !== confirmed) {
        confirmed = fingerprint;
        requestId = globalThis.crypto.randomUUID();
      }
      try {
        const data = await request(choose ? '/select' : '/priorities', choose ? 'POST' : 'PUT', choose
          ? { courseIds: selection, requestId }
          : { courseIds: priorities, revision: startingState.revision });
        if (sameAccount() !== uid) { busy = false; dialog.close(); return; }
        state = data;
        busy = false;
        dialog.close();
        onChange();
        window.Toast?.success?.(choose ? 'Cursos desbloqueados' : 'Prioridades guardadas');
      } catch (error) {
        if (sameAccount() !== uid) { busy = false; dialog.close(); return; }
        if (error.status === 409) {
          const fresh = await load(true);
          if (sameAccount() !== uid) { busy = false; dialog.close(); return; }
          if (fresh?.managed) {
            startingState = fresh;
            selection = selection.filter(id => candidates().includes(id)).slice(0, fresh.available);
            priorities = priorities.filter(id => candidates().includes(id));
            onChange();
          }
        }
        busy = false;
        status.textContent = error.message;
        render();
      }
    };
    document.body.append(dialog);
    render();
    dialog.showModal();
  }

  window.IMFRACourseUnlocks = { load, hasPendingLoad, mount, open, get: () => sameAccount() ? state : null };
})();
