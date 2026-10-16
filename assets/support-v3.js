/* support-v3.js - tip card behaviour (no network, no cookies). 2026-10-17.
   Markup contract:
   <div data-support-cta="result" data-sct-site="SITE" hidden?>
     <div data-sct-variant="first">...first-use copy...</div>
     <div data-sct-variant="returning" hidden>...copy with <span data-sct-uses></span>...</div>
     ...buttons (a[data-rail])...
     <button type="button" data-sct-dismiss>Not now</button>
   </div>
   Call window.sctShown() when the tool shows a result (or let the card count once per page view if it is always visible).
   Uses are counted only in this browser (localStorage). "Not now" hides the result card for 30 days; the footer block stays. */
(function () {
  var K = 'sct:' + (document.documentElement.getAttribute('data-sct-site') || location.hostname);
  function get(k, d) { try { var v = localStorage.getItem(K + ':' + k); return v === null ? d : v; } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(K + ':' + k, String(v)); } catch (e) {} }
  var RETURNING_AT = 3, SNOOZE_MS = 30 * 864e5;
  function cards() { return Array.prototype.slice.call(document.querySelectorAll('[data-support-cta="result"]')); }
  function snoozed() { return Date.now() < Number(get('snooze', 0)); }
  function render(card) {
    var uses = Number(get('uses', 0));
    var ret = uses >= RETURNING_AT;
    card.setAttribute('data-sct-state', ret ? 'returning' : 'first');
    Array.prototype.forEach.call(card.querySelectorAll('[data-sct-variant]'), function (v) {
      v.hidden = v.getAttribute('data-sct-variant') !== (ret ? 'returning' : 'first');
    });
    Array.prototype.forEach.call(card.querySelectorAll('[data-sct-uses]'), function (s) { s.textContent = String(uses); });
  }
  var counted = false;
  window.sctShown = function () {
    if (!counted) { counted = true; set('uses', Number(get('uses', 0)) + 1); }
    cards().forEach(function (c) { render(c); if (!snoozed()) c.hidden = false; });
  };
  document.addEventListener('click', function (e) {
    var t = e.target;
    var d = t && t.closest && t.closest('[data-sct-dismiss]');
    if (d) { set('snooze', Date.now() + SNOOZE_MS); var c = d.closest('[data-support-cta]'); if (c) c.hidden = true; return; }
    var a = t && t.closest && t.closest('[data-support-cta] a[data-rail]');
    if (a && typeof window.gtag === 'function') {
      var r = a.closest('[data-support-cta]');
      window.gtag('event', 'support_click', { cta_position: r.getAttribute('data-support-cta'), rail: a.getAttribute('data-rail'), variant: r.getAttribute('data-sct-state') || 'na' });
    }
  }, true);
  function init() {
    cards().forEach(function (c) {
      render(c);
      if (snoozed()) c.hidden = true;
      if (c.hasAttribute('data-sct-always')) window.sctShown();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
