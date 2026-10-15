/* Listen buttons for the irregular verbs table: each plays "base, past, participle" in the chosen voice.
   Recordings: Deepgram Aura-2, /assets/audio/v/<base>-{us,uk}.mp3. The table re-renders on filter, so a MutationObserver re-adds buttons. */
(function () {
  'use strict';
  var body = document.getElementById('verbBody');
  if (!body || !window.Audio) return;
  var voice = 'us', player = null, active = null;
  try { voice = localStorage.getItem('el_voice') === 'uk' ? 'uk' : 'us'; } catch (e) { /* storage blocked */ }
  var ICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  function stop() { if (player) { player.pause(); player = null; } if (active) { active.classList.remove('is-playing'); active = null; } }
  function decorate() {
    Array.prototype.forEach.call(body.querySelectorAll('tr'), function (tr) {
      var td = tr.cells[0]; if (!td || td.querySelector('.eg-play')) return;
      var base = td.textContent.trim(); if (!/^[a-z]+$/.test(base)) return;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'eg-play'; b.innerHTML = ICON;
      b.setAttribute('aria-label', 'Listen to ' + base + ', ' + tr.cells[1].textContent + ', ' + tr.cells[2].textContent);
      b.addEventListener('click', function () {
        var same = active === b; stop(); if (same) return;
        player = new Audio('/assets/audio/v/' + base + '-' + voice + '.mp3'); active = b; b.classList.add('is-playing');
        player.onended = stop; player.onerror = stop; player.play().catch(stop);
        if (window.elTrack) window.elTrack('audio_play', { tool: 'irregular-verbs', voice: voice });
      });
      td.appendChild(b);
    });
  }
  var table = body.closest('table');
  var bar = document.createElement('div'); bar.className = 'voice-choice'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Voice for verb forms');
  var label = document.createElement('span'); label.textContent = 'Listen to the forms in'; bar.appendChild(label);
  [['us', 'American English'], ['uk', 'British English']].forEach(function (v) {
    var o = document.createElement('button'); o.type = 'button'; o.className = 'voice-option'; o.textContent = v[1]; o.dataset.voice = v[0];
    o.setAttribute('aria-pressed', String(voice === v[0]));
    o.addEventListener('click', function () {
      voice = v[0]; stop(); try { localStorage.setItem('el_voice', voice); } catch (e) { /* storage blocked */ }
      Array.prototype.forEach.call(bar.querySelectorAll('.voice-option'), function (x) { x.setAttribute('aria-pressed', String(x.dataset.voice === voice)); });
    });
    bar.appendChild(o);
  });
  if (table && table.parentNode) table.parentNode.insertBefore(bar, table);
  decorate();
  new MutationObserver(decorate).observe(body, { childList: true });
  window.addEventListener('pagehide', stop);
})();
