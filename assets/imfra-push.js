/* IMFRA · notificaciones web push
   Consentimiento explícito, soporte iOS instalado, preferencias por categoría
   y sincronización segura con el backend autenticado. */
(function () {
  'use strict';

  var API = window.WEBHOOK_URL || 'https://imfra-backend-production.up.railway.app';
  var SYNC_MS = 24 * 60 * 60 * 1000;
  var supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  var categories = {
    service: ['Servicio', 'Bienvenida y avisos para usar tu cuenta.'],
    promotions: ['Beneficios VIP', 'Beneficios y promociones limitadas.'],
    learning: ['Aprendizaje', 'Cursos pendientes y clases en vivo.'],
    activity: ['Créditos y logros', 'Créditos obtenidos y certificados listos.'],
    admin: ['Avisos importantes', 'Información administrativa de IMFRA.']
  };

  function user() { return window.__currentUser || (window.__auth && window.__auth.currentUser) || null; }
  function uid() { return user() && user().uid || ''; }
  function localGet(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  function localSet(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  function answerKey() { return 'imfra:push:consent:v1:' + uid(); }
  function syncKey() { return 'imfra:push:sync:' + uid(); }

  function toast(kind, title, detail) {
    if (window.Toast && typeof window.Toast[kind] === 'function') window.Toast[kind](title, detail || '');
    else if (kind === 'error') window.alert(title + (detail ? '\n' + detail : ''));
  }

  function base64ToBytes(value) {
    var padding = '='.repeat((4 - value.length % 4) % 4);
    var binary = atob((value + padding).replace(/-/g, '+').replace(/_/g, '/'));
    var bytes = new Uint8Array(binary.length);
    for (var index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  }

  async function api(path, options) {
    options = options || {};
    var current = user();
    if (!current || !current.getIdToken) throw new Error('Tu sesión aún no está lista.');
    var token = await current.getIdToken();
    var response = await fetch(API + path, {
      method: options.method || 'GET',
      cache: 'no-store',
      headers: Object.assign({ Authorization: 'Bearer ' + token }, options.body ? { 'Content-Type': 'application/json' } : {}),
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok || data.ok === false) throw new Error(data.error || ('HTTP ' + response.status));
    return data;
  }

  async function serviceWorker() {
    var registration = await navigator.serviceWorker.register('sw.js');
    await navigator.serviceWorker.ready;
    return registration;
  }

  async function browserSubscription() {
    if (!supported) return null;
    var registration = await navigator.serviceWorker.getRegistration();
    return registration ? registration.pushManager.getSubscription() : null;
  }

  async function subscribe() {
    var registration = await serviceWorker();
    var subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      var response = await fetch(API + '/api/push/public-key', { cache: 'no-store' });
      var key = await response.json().catch(function () { return {}; });
      if (!response.ok || !key.configured || !key.publicKey) throw new Error(key.error || 'Las notificaciones todavía no están disponibles.');
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToBytes(key.publicKey)
      });
    }
    var result = await api('/api/push/subscribe', {
      method: 'POST',
      body: {
        consent: true,
        subscription: subscription.toJSON(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Mexico_City',
        locale: navigator.language || 'es-MX',
        platform: navigator.userAgentData && navigator.userAgentData.platform || navigator.platform || ''
      }
    });
    localSet(answerKey(), 'yes');
    localSet(syncKey(), String(Date.now()));
    return result;
  }

  async function enable() {
    if (isIOS && !standalone) throw new Error('En iPhone o iPad primero agrega IMFRA a tu pantalla de inicio y ábrela desde ese ícono.');
    if (!supported) throw new Error('Este navegador no permite notificaciones push.');
    var permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
    if (permission !== 'granted') throw new Error('Las notificaciones están bloqueadas. Puedes permitirlas desde los ajustes del sitio.');
    return subscribe();
  }

  async function disable() {
    localSet(answerKey(), 'no');
    if (!supported) return;
    var subscription = await browserSubscription();
    if (!subscription) return;
    await api('/api/push/subscribe', { method: 'DELETE', body: { endpoint: subscription.endpoint } }).catch(function () {});
    await subscription.unsubscribe().catch(function () {});
  }

  async function active() {
    if (!supported || Notification.permission !== 'granted') return false;
    return Boolean(await browserSubscription());
  }

  async function status() {
    return api('/api/push/status');
  }

  async function savePreferences(preferences) {
    return api('/api/push/preferences', { method: 'PATCH', body: { preferences: preferences } });
  }

  function injectStyles() {
    if (document.getElementById('imfra-push-styles')) return;
    var style = document.createElement('style');
    style.id = 'imfra-push-styles';
    style.textContent = [
      '.ips-overlay{position:fixed;inset:0;z-index:9800;display:grid;place-items:center;padding:18px;background:rgba(14,10,6,.72);backdrop-filter:blur(7px);opacity:0;transition:opacity .22s ease}',
      '.ips-overlay.is-open{opacity:1}.ips-dialog{width:min(460px,100%);padding:27px;border:1px solid rgba(255,255,255,.12);border-radius:24px;background:#17110b;color:#fbf6ee;box-shadow:0 28px 90px rgba(0,0,0,.5);transform:translateY(12px);transition:transform .25s ease}.ips-overlay.is-open .ips-dialog{transform:none}',
      '.ips-icon{display:grid;place-items:center;width:64px;height:64px;margin:0 auto 15px;border-radius:19px;background:linear-gradient(135deg,#f59d1a,#ffcf7a);color:#17110b;font-size:31px}.ips-dialog h2{margin:0;text-align:center;font:800 21px/1.25 "Plus Jakarta Sans",sans-serif}.ips-dialog p{margin:10px auto 0;max-width:370px;text-align:center;color:#c8b9aa;font-size:13.5px;line-height:1.6}.ips-list{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:18px 0}.ips-list span{padding:10px;border:1px solid #342619;border-radius:11px;background:#120e0a;color:#e9ddcf;font-size:11.5px}.ips-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ips-actions button{min-height:46px;border:1px solid #493624;border-radius:12px;background:transparent;color:#e9ddcf;font-weight:800;cursor:pointer}.ips-actions button[data-ips-yes]{border-color:#f59d1a;background:#f59d1a;color:#17110b}.ips-note{display:block;margin-top:12px;text-align:center;color:#8f8173;font-size:10.5px;line-height:1.45}',
      '.ips-settings{display:grid;gap:13px}.ips-master{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px;border:1px solid var(--border);border-radius:14px;background:var(--surface-2)}.ips-master strong{display:block;font-size:13px;color:var(--text)}.ips-master small{display:block;margin-top:4px;color:var(--text-3);font-size:11px;line-height:1.45}.ips-switch{position:relative;width:46px;height:26px;flex:none}.ips-switch input{position:absolute;opacity:0}.ips-switch i{position:absolute;inset:0;border-radius:99px;background:#9ca3af;transition:.2s}.ips-switch i:after{content:"";position:absolute;left:3px;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.28);transition:.2s}.ips-switch input:checked+i{background:#f59d1a}.ips-switch input:checked+i:after{transform:translateX(20px)}.ips-switch input:focus-visible+i{outline:3px solid rgba(245,157,26,.3);outline-offset:2px}',
      '.ips-switch input:disabled+i{cursor:not-allowed;background:#9ca3af;opacity:.62}.ips-switch input:disabled:checked+i{background:#9ca3af}',
      '.ips-categories{display:grid;gap:1px;border:1px solid var(--border);border-radius:14px;overflow:hidden}.ips-category{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;background:var(--surface)}.ips-category+ .ips-category{border-top:1px solid var(--border)}.ips-category b{display:block;font-size:12px;color:var(--text)}.ips-category small{display:block;margin-top:3px;color:var(--text-3);font-size:10.5px}.ips-message{padding:11px 13px;border-radius:12px;background:color-mix(in srgb,var(--primary) 9%,var(--surface));color:var(--text-2);font-size:11px;line-height:1.5}',
      '@media(max-width:520px){.ips-dialog{padding:22px 18px;border-radius:20px}.ips-list{grid-template-columns:1fr}.ips-actions{grid-template-columns:1fr}.ips-actions button[data-ips-yes]{grid-row:1}.ips-overlay{align-items:end;padding:10px}.ips-category{align-items:flex-start}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function iosGuide(card) {
    card.innerHTML = '<div class="ips-icon">📲</div><h2>Actívalas desde tu pantalla de inicio</h2><p>En iPhone y iPad Apple permite los avisos web cuando IMFRA está instalada:</p>' +
      '<div class="ips-list"><span>1. Toca <b>Compartir</b> ↑</span><span>2. Elige <b>Agregar a inicio</b></span><span>3. Abre IMFRA desde el ícono</span><span>4. Activa los avisos en tu perfil</span></div>' +
      '<div class="ips-actions" style="grid-template-columns:1fr"><button type="button" data-ips-close>Entendido</button></div>';
    card.querySelector('[data-ips-close]').addEventListener('click', function () { card.closest('.ips-overlay').remove(); });
  }

  function askConsent() {
    if (!uid() || document.querySelector('.ips-overlay')) return;
    injectStyles();
    var overlay = document.createElement('div');
    overlay.className = 'ips-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = '<div class="ips-dialog"><div class="ips-icon">🔔</div><h2>¿Quieres recibir avisos de IMFRA?</h2>' +
      '<p>Te acompañamos fuera del panel con mensajes útiles y breves. Tú eliges qué categorías recibir.</p>' +
      '<div class="ips-list"><span>📚 Cursos y clases</span><span>🏆 Créditos y certificados</span><span>⭐ Beneficios VIP</span><span>📢 Avisos importantes</span></div>' +
      '<div class="ips-actions"><button type="button" data-ips-no>No por ahora</button><button type="button" data-ips-yes>Sí, activar</button></div>' +
      '<span class="ips-note">Puedes desactivarlas o ajustar categorías en Mi perfil. No sustituye tus correos de cuenta.</span></div>';
    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add('is-open'); });
    var close = function () { overlay.classList.remove('is-open'); setTimeout(function () { overlay.remove(); }, 230); };
    overlay.querySelector('[data-ips-no]').addEventListener('click', function () { localSet(answerKey(), 'no'); close(); });
    overlay.querySelector('[data-ips-yes]').addEventListener('click', async function (event) {
      if (isIOS && !standalone) { localSet(answerKey(), 'ios'); iosGuide(overlay.querySelector('.ips-dialog')); return; }
      var button = event.currentTarget;
      button.disabled = true; button.textContent = 'Activando…';
      try {
        await enable(); close(); toast('success', '¡Avisos activados!', 'IMFRA te avisará en este dispositivo.');
      } catch (error) {
        button.disabled = false; button.textContent = 'Sí, activar';
        toast('info', 'No se activaron los avisos', error.message);
      }
    });
  }

  function appBusy() {
    return Boolean(document.querySelector('.onb-overlay, .modal-backdrop.is-open, .cc-overlay, [data-onboarding-open], .welcome-splash'));
  }

  function reviewConsent() {
    if (window.__isDemoMode || !uid()) return;
    if (supported && Notification.permission === 'granted') {
      if (Date.now() - Number(localGet(syncKey()) || 0) > SYNC_MS) subscribe().catch(function () {});
      return;
    }
    var answer = localGet(answerKey());
    if (answer === 'yes' || answer === 'no') return;
    if (answer === 'ios' && !(isIOS && standalone)) return;
    if (supported && Notification.permission === 'denied') return;
    if (!supported && !isIOS) return;
    var attempts = 0;
    (function wait() {
      if (appBusy() && attempts++ < 90) { setTimeout(wait, 1500); return; }
      askConsent();
    })();
  }

  async function mountSettings(container) {
    var host = container.querySelector('[data-imfra-push-settings]');
    if (!host) return;
    injectStyles();
    var blockedMessage = '';
    if (window.__isDemoMode || !uid()) blockedMessage = 'Inicia sesión con tu cuenta IMFRA para activar avisos en este dispositivo.';
    else if (isIOS && !standalone) blockedMessage = 'En iPhone/iPad: Compartir → Agregar a inicio; abre IMFRA desde el ícono y vuelve aquí.';
    else if (!supported) blockedMessage = 'Este navegador no admite notificaciones. Usa Chrome, Edge o Safari actualizado.';
    else if (Notification.permission === 'denied') blockedMessage = 'Los avisos están bloqueados en el navegador. Permítelos en los ajustes de este sitio.';
    host.innerHTML = '<div class="ips-settings"><div class="ips-master"><div><strong>Avisos en este dispositivo</strong><small>Recíbelos aunque el panel esté cerrado.</small></div><label class="ips-switch"><input type="checkbox" data-ips-master aria-label="Activar avisos"><i></i></label></div>' +
      (blockedMessage ? '<div class="ips-message">' + blockedMessage + '</div>' : '') + '<div class="ips-categories" data-ips-categories></div><div class="ips-message">Horario tranquilo: las promociones y recordatorios se reservan entre 9:00 p. m. y 8:00 a. m. Los créditos y certificados pueden llegar al momento.</div></div>';
    var master = host.querySelector('[data-ips-master]');
    master.disabled = Boolean(blockedMessage);
    var remote = { preferences: {} };
    try { remote = await status(); } catch (_) {}
    master.checked = await active().catch(function () { return false; });
    var list = host.querySelector('[data-ips-categories]');
    list.innerHTML = Object.keys(categories).map(function (key) {
      var item = categories[key];
      var checked = remote.preferences && remote.preferences[key] !== false;
      return '<label class="ips-category"><span><b>' + item[0] + '</b><small>' + item[1] + '</small></span><span class="ips-switch"><input type="checkbox" data-ips-category="' + key + '" ' + (checked ? 'checked' : '') + '><i></i></span></label>';
    }).join('');
    list.querySelectorAll('[data-ips-category]').forEach(function (input) {
      input.disabled = !master.checked;
      input.addEventListener('change', async function () {
        var preferences = {};
        list.querySelectorAll('[data-ips-category]').forEach(function (item) { preferences[item.dataset.ipsCategory] = item.checked; });
        list.querySelectorAll('input').forEach(function (item) { item.disabled = true; });
        try { await savePreferences(preferences); toast('success', 'Preferencias guardadas'); }
        catch (error) { input.checked = !input.checked; toast('error', 'No se pudo guardar', error.message); }
        list.querySelectorAll('input').forEach(function (item) { item.disabled = !master.checked; });
      });
    });
    master.addEventListener('change', async function () {
      var wants = master.checked;
      master.disabled = true;
      try {
        if (wants) await enable(); else await disable();
        list.querySelectorAll('input').forEach(function (item) { item.disabled = !wants; });
        toast('success', wants ? 'Avisos activados' : 'Avisos desactivados', wants ? 'Llegarán a este dispositivo.' : 'Este dispositivo dejó de recibirlos.');
      } catch (error) {
        master.checked = !wants;
        toast('info', 'No se pudo cambiar', error.message);
      } finally { master.disabled = Boolean(blockedMessage); }
    });
  }

  window.addEventListener('imfra:user-ready', function () { setTimeout(reviewConsent, 3500); });
  if (uid()) setTimeout(reviewConsent, 3500);
  window.IMFRAPush = { enable: enable, disable: disable, active: active, status: status, mountSettings: mountSettings, supported: supported };
})();
