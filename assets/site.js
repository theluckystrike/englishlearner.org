/* englishlearner.org: Google Analytics 4 and AdSense loader with one consent gate.
   Rules:
   - Load Google code only on englishlearner.org and www.englishlearner.org.
   - Analytics (GA4 G-GHQNNECRRP) loads on every page. Ads never load on pages marked <html data-no-ads>.
   - EEA, UK and Switzerland: load nothing until Accept. A visitor is in this region if EITHER
     the device time zone is European (or unknown or generic, such as UTC) OR the IP country is
     in REGION. The IP country comes from the Cloudflare trace (loc=) of recipetool.net, a site of
     the same operator: GitHub Pages has no /cdn-cgi/trace. The request sends no cookies and no
     referrer. A failed lookup, a timeout (TRACE_MS), XX or T1 count as the region.
   - A European time zone shows the banner at once, with no lookup. Other time zones wait for
     the lookup at most TRACE_MS before Google code loads or the banner shows.
   - Other regions: load on page load, unless the visitor declined before.
   - QA: ?el_loc=DE (a REGION code) forces the banner. It can never skip the banner.
   - "Privacy choices" in the footer reopens the banner in every region.
   - Google signals and ad personalisation for analytics stay off (set in GA4 admin).
   Page code can call window.elTrack('event_name', {param: 'value'}) at any time. */
(function () {
  'use strict';

  var PUB = 'ca-pub-2241192243363112';
  var GA_ID = 'G-GHQNNECRRP';
  var KEY = 'el_consent_v2';
  var OLD_KEY = 'el_ads_consent';
  var EXTRA_ZONES = [
    'Atlantic/Reykjavik', 'Atlantic/Canary', 'Atlantic/Madeira', 'Atlantic/Azores',
    'Atlantic/Faroe', 'Atlantic/Jan_Mayen', 'Arctic/Longyearbyen', 'Asia/Nicosia',
    'Asia/Famagusta', 'Africa/Ceuta', 'America/Cayenne', 'America/Guadeloupe',
    'America/Martinique', 'America/Marigot', 'America/St_Barthelemy', 'Indian/Reunion',
    'Indian/Mayotte', 'GB', 'GB-Eire', 'Eire', 'Poland', 'Portugal', 'Iceland',
    'CET', 'EET', 'WET', 'MET', 'UTC', 'GMT', 'UCT', 'Universal', 'Zulu'
  ];

  var TRACE = 'https://recipetool.net/cdn-cgi/trace';
  var TRACE_MS = 800;
  /* EEA + UK + CH, and EU regions with their own country code (same list as recipetool.net). */
  var REGION = ('AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE ' +
    'IS LI NO GB CH AX GF GP MQ RE YT MF').split(' ');
  var consentRegion = null; /* null until decided for this page view, then true or false */

  var host = location.hostname;
  var isProduction = host === 'englishlearner.org' || host === 'www.englishlearner.org';
  var noAds = document.documentElement.hasAttribute('data-no-ads');
  var adsLoaded = false;
  var gaLoaded = false;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  /* Events queue in dataLayer. They are sent only if GA4 loads. */
  window.elTrack = function (name, params) {
    try { window.gtag('event', name, params || {}); } catch (e) { /* never break the page */ }
  };

  function readChoice() {
    try {
      var v = window.localStorage.getItem(KEY);
      if (v) { return v; }
      /* A decline from the old ads-only notice still counts. */
      return window.localStorage.getItem(OLD_KEY) === 'denied' ? 'denied' : null;
    } catch (e) { return null; }
  }

  function saveChoice(value) {
    try { window.localStorage.setItem(KEY, value); } catch (e) { /* storage blocked */ }
  }

  function timeZone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; }
  }

  function zoneNeedsConsent() {
    var zone = timeZone();
    if (!zone) { return true; }
    if (zone.indexOf('Europe/') === 0 || zone.indexOf('Etc/') === 0) { return true; }
    return EXTRA_ZONES.indexOf(zone) !== -1;
  }

  function countryNeedsConsent(cc) {
    return !cc || cc === 'XX' || cc === 'T1' || REGION.indexOf(cc) !== -1;
  }

  /* Calls done(country) once: a 2-letter code, or null on error, timeout or no answer. */
  function lookupCountry(done) {
    var finished = false;
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = null;
    function finish(cc) {
      if (finished) { return; }
      finished = true;
      if (timer) { clearTimeout(timer); }
      done(cc);
    }
    var qa = /[?&]el_loc=([A-Za-z]{2})/.exec(location.search);
    if (qa && REGION.indexOf(qa[1].toUpperCase()) !== -1) { finish(qa[1].toUpperCase()); return; }
    if (!window.fetch) { finish(null); return; }
    timer = setTimeout(function () {
      if (ctl) { try { ctl.abort(); } catch (e) { /* ignore */ } }
      finish(null);
    }, TRACE_MS);
    try {
      window.fetch(TRACE, {
        credentials: 'omit', cache: 'no-store', mode: 'cors', referrerPolicy: 'no-referrer',
        signal: ctl ? ctl.signal : undefined
      })
        .then(function (r) { return r && r.ok ? r.text() : ''; })
        .then(function (t) {
          var m = /^loc=([A-Z0-9]{2})\s*$/m.exec(t || '');
          finish(m ? m[1] : null);
        }, function () { finish(null); });
    } catch (e) { finish(null); }
  }

  /* done(true) = ask first (banner). True if the time zone OR the IP country is in the region. */
  function decideRegion(done) {
    if (zoneNeedsConsent()) { consentRegion = true; done(true); return; }
    lookupCountry(function (cc) {
      consentRegion = countryNeedsConsent(cc);
      done(consentRegion);
    });
  }

  function needsConsent() {
    return consentRegion === null ? zoneNeedsConsent() : consentRegion;
  }

  /* Code loads only after Accept, or by default outside the consent regions, so the state is granted. */
  /* Keep only utm_* and gclid in page_location, so no other query data reaches GA4. */
  function cleanLocation() {
    var keep = [];
    var q = location.search.replace(/^\?/, '').split('&');
    for (var i = 0; i < q.length; i++) {
      var k = q[i].split('=')[0];
      if (/^utm_/.test(k) || k === 'gclid') { keep.push(q[i]); }
    }
    return location.origin + location.pathname + (keep.length ? '?' + keep.join('&') : '');
  }

  function loadAnalytics() {
    if (gaLoaded || !isProduction) { return; }
    gaLoaded = true;
    gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });
    gtag('js', new Date());
    gtag('config', GA_ID, {
      page_location: cleanLocation(),
      allow_google_signals: false,
      consent_region: needsConsent() ? 'eea' : 'other'
    });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  function loadAds() {
    if (adsLoaded || !isProduction || noAds) { return; }
    adsLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + PUB;
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
  }

  function loadAll() {
    loadAnalytics();
    loadAds();
  }

  function closeBanner() {
    var old = document.getElementById('el-consent');
    if (old && old.parentNode) { old.parentNode.removeChild(old); }
  }

  function showBanner() {
    closeBanner();
    var box = document.createElement('div');
    box.id = 'el-consent';
    box.className = 'el-consent';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Privacy choice');

    var text = document.createElement('p');
    text.appendChild(document.createTextNode(
      'This site is free. It uses Google Analytics to count visits and Google AdSense to show ads. ' +
      'If you accept, Google may use cookies. ' +
      'If you decline, no Google code is loaded. '));
    var link = document.createElement('a');
    link.href = '/privacy/';
    link.textContent = 'Read the privacy policy';
    text.appendChild(link);
    text.appendChild(document.createTextNode('.'));

    var btns = document.createElement('div');
    btns.className = 'el-btns';
    var yes = document.createElement('button');
    yes.type = 'button';
    yes.textContent = 'Accept';
    var no = document.createElement('button');
    no.type = 'button';
    no.textContent = 'Decline';

    yes.addEventListener('click', function () {
      saveChoice('granted');
      closeBanner();
      loadAll();
    });
    no.addEventListener('click', function () {
      var hadCode = adsLoaded || gaLoaded;
      saveChoice('denied');
      closeBanner();
      if (hadCode) { location.reload(); }
    });

    btns.appendChild(yes);
    btns.appendChild(no);
    box.appendChild(text);
    box.appendChild(btns);
    document.body.appendChild(box);
  }

  function wireChoiceLinks() {
    var links = document.querySelectorAll('[data-el-privacy-choices]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function (ev) {
        ev.preventDefault();
        showBanner();
      });
    }
  }

  /* Generic engagement: the first button press inside <main> on a page = tool_use. */
  function wireToolUse() {
    var main = document.querySelector('main');
    if (!main) { return; }
    var sent = false;
    main.addEventListener('click', function (ev) {
      if (sent) { return; }
      var t = ev.target;
      while (t && t !== main && t.tagName !== 'BUTTON') { t = t.parentNode; }
      if (!t || t === main) { return; }
      sent = true;
      window.elTrack('tool_use', { tool_path: location.pathname });
    }, true);
  }

  /* Support (tip) cards: count clicks and show the result card only after a result. */
  function wireSupport() {
    var cards = document.querySelectorAll('[data-support-cta][data-reveal-for]');
    for (var i = 0; i < cards.length; i++) {
      (function (card) {
        var target = document.getElementById(card.getAttribute('data-reveal-for'));
        var when = card.getAttribute('data-reveal-when');
        if (!target || !when || typeof MutationObserver !== 'function') { return; }
        function update() {
          if (!target.hidden && target.querySelector(when)) {
            if (typeof window.sctShown === "function") window.sctShown();
          } else { card.hidden = true; }
        }
        new MutationObserver(update).observe(target, { childList: true, attributes: true, attributeFilter: ['hidden', 'class'] });
        update();
      })(cards[i]);
    }
  }

  /* Internal traffic opt-out. Open any page once with ?el_internal=1 (or =0 to undo). */
  function isInternal() {
    try {
      var m = location.search.match(/[?&]el_internal=([01])/);
      if (m) { window.localStorage.setItem('el_internal', m[1]); }
      return window.localStorage.getItem('el_internal') === '1';
    } catch (e) { return false; }
  }

  function start() {
    wireChoiceLinks();
    wireToolUse();
    wireSupport();
    if (!isProduction || isInternal()) { return; }
    var choice = readChoice();
    if (choice === 'denied') { return; }
    if (choice === 'granted') { loadAll(); return; }
    decideRegion(function (ask) {
      if (ask) { showBanner(); } else { loadAll(); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
