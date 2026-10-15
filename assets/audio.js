/* Listen buttons for lesson example sentences. Recordings are Deepgram Aura-2 voices,
   American (Callista) and British (Draco), in /assets/audio/s/<sha1 first 12>-{us,uk}.mp3.
   The file name comes from the exact sentence text, so a changed sentence simply has no button. */
(function () {
  'use strict';
  var page = document.querySelector('main[data-lesson]');
  if (!page || !window.crypto || !crypto.subtle || !window.Audio) return;
  var KEY = 'el_voice';
  var voice = 'us';
  try { voice = localStorage.getItem(KEY) === 'uk' ? 'uk' : 'us'; } catch (e) { /* storage blocked */ }
  var player = null, active = null;
  var ICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function stop() { if (player) { player.pause(); player = null; } if (active) { active.classList.remove('is-playing'); active.setAttribute('aria-pressed', 'false'); active = null; } }
  function play(btn) {
    var same = active === btn; stop(); if (same) return;
    player = new Audio('/assets/audio/s/' + btn.dataset.clip + '-' + voice + '.mp3');
    active = btn; btn.classList.add('is-playing'); btn.setAttribute('aria-pressed', 'true');
    player.onended = stop; player.onerror = function () { stop(); btn.hidden = true; };
    player.play().catch(stop);
    if (window.elTrack) window.elTrack('audio_play', { lesson: page.dataset.lesson, voice: voice });
  }
  var spans = Array.prototype.slice.call(page.querySelectorAll('.eg'));
  if (!spans.length) return;
  /* Voice choice, placed under the lesson introduction. */
  var intro = page.querySelector('.lesson-introduction') || page.querySelector('.lesson-heading');
  var bar = document.createElement('div'); bar.className = 'voice-choice'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Voice for example sentences');
  var label = document.createElement('span'); label.textContent = 'Listen to the examples in';
  bar.appendChild(label);
  [['us', 'American English'], ['uk', 'British English']].forEach(function (v) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'voice-option'; b.textContent = v[1]; b.dataset.voice = v[0];
    b.setAttribute('aria-pressed', String(voice === v[0]));
    b.addEventListener('click', function () {
      voice = v[0]; stop();
      try { localStorage.setItem(KEY, voice); } catch (e) { /* storage blocked */ }
      Array.prototype.forEach.call(bar.querySelectorAll('.voice-option'), function (o) { o.setAttribute('aria-pressed', String(o.dataset.voice === voice)); });
    });
    bar.appendChild(b);
  });
  if (intro) intro.appendChild(bar);
  spans.forEach(function (span) {
    var text = span.textContent.trim();
    crypto.subtle.digest('SHA-1', new TextEncoder().encode(text)).then(function (d) {
      var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'eg-play';
      btn.dataset.clip = hex(d).slice(0, 12); btn.innerHTML = ICON;
      btn.setAttribute('aria-label', 'Listen to this example'); btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', function () { play(btn); });
      span.insertAdjacentElement('afterend', btn);
    });
  });
  window.addEventListener('pagehide', stop);
})();
