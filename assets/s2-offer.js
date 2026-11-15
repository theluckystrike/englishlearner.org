/* Sprint 2026-11-15 (data-cro sprint-20261115-el-top): top-of-page workbook offer.
   offer_view fires once per page, only after a real scroll, pointer, touch or key input, and only when the block
   is at least half visible. cta_click is sent by the inline onclick; begin_checkout by site.js on the shop link.
   All events go through window.elTrack, so GA stays on the production host only. */
(function () {
  var box = document.querySelector('[data-s2-offer]');
  if (!box) { return; }
  var sent = false, acted = false, seen = false;
  function fire(reason) {
    if (sent || !acted || !seen || !window.elTrack) { return; }
    sent = true;
    window.elTrack('offer_view', { site: 'englishlearner.org', product: 'Fix Your English workbook', offer_id: box.getAttribute('data-s2-offer'),
      price: 6.99, value: 6.99, currency: 'USD', items: [{ item_id: 'fye-v1', item_name: 'Fix Your English workbook', price: 6.99, quantity: 1 }],
      placement: 'top', interaction: reason });
  }
  function act(e) {
    acted = true;
    fire(e.type);
    if (sent) { ['scroll', 'pointerdown', 'touchstart', 'keydown'].forEach(function (t) { window.removeEventListener(t, act, true); }); }
  }
  ['scroll', 'pointerdown', 'touchstart', 'keydown'].forEach(function (t) { window.addEventListener(t, act, { capture: true, passive: true }); });
  if (typeof IntersectionObserver === 'function') {
    new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.intersectionRatio >= 0.5) { seen = true; fire('visible'); } }); }, { threshold: [0.5] }).observe(box);
  } else { seen = true; }
})();
