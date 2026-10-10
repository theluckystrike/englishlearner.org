/* englishlearner.org: ad loader with a consent gate.
   Rules:
   - Never load ads on localhost / 127.0.0.1.
   - Never load ads on pages marked <html data-no-ads>.
   - EEA, UK and Switzerland (guessed from the device time zone): load only after Accept.
   - If the time zone is unknown or generic (UTC), ask first.
   - Other regions: load on page load, unless the visitor declined before.
   - "Privacy choices" in the footer reopens the banner in every region. */
(function () {
  'use strict';

  var PUB = 'ca-pub-2241192243363112';
  var KEY = 'el_ads_consent';
  var EXTRA_ZONES = [
    'Atlantic/Reykjavik', 'Atlantic/Canary', 'Atlantic/Madeira', 'Atlantic/Azores',
    'Atlantic/Faroe', 'Atlantic/Jan_Mayen', 'Arctic/Longyearbyen', 'Asia/Nicosia',
    'Asia/Famagusta', 'Africa/Ceuta', 'America/Cayenne', 'America/Guadeloupe',
    'America/Martinique', 'America/Marigot', 'America/St_Barthelemy', 'Indian/Reunion',
    'Indian/Mayotte', 'GB', 'GB-Eire', 'Eire', 'Poland', 'Portugal', 'Iceland',
    'CET', 'EET', 'WET', 'MET', 'UTC', 'GMT', 'UCT', 'Universal', 'Zulu'
  ];

  var host = location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1' || host === '[::1]' ||
    host === '0.0.0.0' || host === '';
  var noAds = document.documentElement.hasAttribute('data-no-ads');
  var loaded = false;

  function readChoice() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function saveChoice(value) {
    try { window.localStorage.setItem(KEY, value); } catch (e) { /* storage blocked */ }
  }

  function timeZone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; }
  }

  function needsConsent() {
    var zone = timeZone();
    if (!zone) { return true; }
    if (zone.indexOf('Europe/') === 0 || zone.indexOf('Etc/') === 0) { return true; }
    return EXTRA_ZONES.indexOf(zone) !== -1;
  }

  function loadAds() {
    if (loaded || isLocal || noAds) { return; }
    loaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + PUB;
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
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
    box.setAttribute('aria-label', 'Advertising choice');

    var text = document.createElement('p');
    text.appendChild(document.createTextNode(
      'This site is free and is paid for by ads from Google AdSense. ' +
      'If you accept, Google loads ads and may use cookies. ' +
      'If you decline, no ad code is loaded. '));
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
      loadAds();
    });
    no.addEventListener('click', function () {
      var hadAds = loaded;
      saveChoice('denied');
      closeBanner();
      if (hadAds) { location.reload(); }
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

  function start() {
    wireChoiceLinks();
    if (isLocal || noAds) { return; }
    var choice = readChoice();
    if (choice === 'denied') { return; }
    if (choice === 'granted') { loadAds(); return; }
    if (needsConsent()) { showBanner(); return; }
    loadAds();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
