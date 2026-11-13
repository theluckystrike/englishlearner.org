/* Sentence Explainer Pro waitlist + free daily limit (sprint-20261113).
   Free: 5 analyses a day. The count is kept in this browser (localStorage), so it is a soft limit.
   Pro is not on sale yet: the panel collects emails for the launch through fleet-leads (offer_id el-explainer-pro).
   Events (via site.js elTrack, GA only on the production host): offer_view (after a real interaction and 50% visible),
   cta_click, generate_lead. No begin_checkout: there is no checkout for Pro yet. */
(function () {
  'use strict';
  var LIMIT = 5, KEY = 'el_sa_uses_v1', OFFER = 'el-explainer-pro', PRICE = 3.99;
  var P = { site: 'englishlearner.org', product: 'Sentence Explainer Pro', offer_id: OFFER, price: PRICE, value: PRICE, currency: 'USD' };
  var panel = document.getElementById('sa-pro');
  var quota = document.getElementById('saQuota');
  function track(name, extra) {
    var p = {}, k;
    for (k in P) { p[k] = P[k]; }
    for (k in (extra || {})) { p[k] = extra[k]; }
    if (window.elTrack) { window.elTrack(name, p); }
  }
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function read() {
    try { var o = JSON.parse(window.localStorage.getItem(KEY) || '{}'); return o && o.d === today() ? (o.n | 0) : 0; } catch (e) { return 0; }
  }
  function write(n) { try { window.localStorage.setItem(KEY, JSON.stringify({ d: today(), n: n })); } catch (e) {} }
  function showQuota() {
    if (!quota) { return; }
    var left = Math.max(0, LIMIT - read());
    quota.firstChild.nodeValue = left > 0
      ? 'Free: ' + left + ' of ' + LIMIT + ' analyses left today. '
      : 'Free limit reached for today (' + LIMIT + ' a day). ';
    quota.hidden = false;
  }

  /* offer_view: once, only after scroll, pointer or key input, or 10 s on the page, and when half the panel is visible. */
  var interacted = false, visible = false, viewed = false;
  function maybeView(reason) {
    if (viewed || !interacted || !visible) { return; }
    viewed = true;
    track('offer_view', { interaction: reason || 'scroll' });
  }
  function onInteract(e) { if (interacted) { return; } interacted = true; maybeView(e && e.type); }
  ['scroll', 'pointerdown', 'keydown'].forEach(function (t) { window.addEventListener(t, onInteract, { passive: true, once: true }); });
  setTimeout(function () { if (!interacted) { interacted = true; maybeView('time_10s'); } }, 10000);
  if (panel && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (en) { visible = en.isIntersecting; if (visible) { maybeView('visible'); } });
    }, { threshold: 0.5 }).observe(panel);
  }

  function openPanel(src) {
    if (!panel) { return; }
    var lim = panel.querySelector('.sa-pro-limit');
    if (src === 'limit' && lim) { lim.hidden = false; }
    interacted = true;
    panel.scrollIntoView({ block: 'start', behavior: 'smooth' });
    var email = panel.querySelector('input[type=email]');
    if (email && src === 'limit') { setTimeout(function () { email.focus({ preventScroll: true }); }, 400); }
  }

  /* Called by the analyzer's submit(): allow() before the analysis, used() after a shown result. */
  window.elSaPro = {
    allow: function () {
      if (read() < LIMIT) { return true; }
      var st = document.getElementById('analysisStatus');
      if (st) { st.textContent = 'You used your ' + LIMIT + ' free analyses today. See Sentence Explainer Pro below.'; }
      track('cta_click', { cta_id: 'sa_pro_limit', src: 'limit' });
      openPanel('limit');
      showQuota();
      return false;
    },
    used: function () { write(read() + 1); showQuota(); }
  };

  if (quota) {
    var a = quota.querySelector('a');
    if (a) { a.addEventListener('click', function (e) { e.preventDefault(); track('cta_click', { cta_id: 'sa_pro_quota', src: 'quota' }); openPanel('quota'); }); }
    if (read() > 0) { showQuota(); }
  }

  /* Waitlist form -> fleet-leads. */
  var form = panel && panel.querySelector('form');
  if (!form) { return; }
  var btn = form.querySelector('button'), err = panel.querySelector('.sa-pro-err'), ok = panel.querySelector('.sa-pro-ok');
  if (btn) { btn.addEventListener('click', function () { track('cta_click', { cta_id: 'sa_pro_waitlist', src: 'panel' }); }); }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = (form.elements.email.value || '').trim(), hp = form.elements.hp.value || '';
    err.hidden = true;
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) { err.textContent = 'Enter a valid email address.'; err.hidden = false; form.elements.email.focus(); return; }
    btn.disabled = true;
    fetch('https://fleet-leads.lipmichal.workers.dev/lead', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, offer_id: OFFER, page: location.pathname, price: '3.99/month', hp: hp })
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j || !j.ok) { throw new Error('not ok'); }
      form.hidden = true; ok.hidden = false;
      track('generate_lead', { method: 'waitlist' });
    }).catch(function () {
      btn.disabled = false;
      err.textContent = 'That did not work. Please try again in a minute.'; err.hidden = false;
    });
  });
})();
