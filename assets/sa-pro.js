/* Sentence Explainer Pro (sprint-20261115, data-cro sprint-20261115-el-explainer-pro-buy) and the free daily limit (sprint-20261113).
   Free: 5 analyses a day. The count is kept in this browser (localStorage), so it is a soft limit. Free use does not change.
   Pro: a 12-month pass, $29, one payment, no renewal (Stripe Payment Link). After payment Stripe sends the buyer back to
   ?pro=<checkout session id>. The el-pro Worker checks the session with Stripe and returns a signed token (HMAC, 12 months).
   The token is kept in localStorage and checked with the Worker on load (result cached 24 h).
   Pro features run in this browser over the existing analyzer (window.elSaCore): whole paragraph, printable worksheet
   (.txt/.csv too), saved history, no daily limit.
   Events via site.js elTrack (GA only on the production host): offer_view, cta_click, begin_checkout, purchase
   (data-cro sprint-20261115-purchase: once per transaction_id = Stripe session id, after the Worker verified it). */
(function () {
  'use strict';
  var LIMIT = 5, KEY = 'el_sa_uses_v1', OFFER = 'el-explainer-pro', PRICE = 29;
  var LINK = 'https://buy.stripe.com/cNi00k7Iu4Jy7VXgjj43S3P';
  var API = 'https://el-pro.lipmichal.workers.dev';
  var TKEY = 'el_sa_pro_v1', HKEY = 'el_sa_pro_history_v1', DAY = 86400000;
  var ITEM = { item_id: OFFER, item_name: 'Sentence Explainer Pro - 12-month pass', price: PRICE, quantity: 1 };
  var P = { site: 'englishlearner.org', product: 'Sentence Explainer Pro', offer_id: OFFER, price: PRICE, value: PRICE, currency: 'USD' };
  var panel = document.getElementById('sa-pro');
  var quota = document.getElementById('saQuota');
  var proBox = document.getElementById('saProApp');
  var pro = false;

  function track(name, extra) {
    var p = {}, k;
    for (k in P) { p[k] = P[k]; }
    for (k in (extra || {})) { p[k] = extra[k]; }
    if (window.elTrack) { window.elTrack(name, p); }
  }
  function ls(k, v) {
    try {
      if (v === undefined) { return JSON.parse(window.localStorage.getItem(k) || 'null'); }
      if (v === null) { window.localStorage.removeItem(k); } else { window.localStorage.setItem(k, JSON.stringify(v)); }
    } catch (e) { return null; }
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (text !== undefined) { e.textContent = text; } return e; }

  /* ---------- free daily limit (unchanged for free users) ---------- */
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function read() {
    try { var o = JSON.parse(window.localStorage.getItem(KEY) || '{}'); return o && o.d === today() ? (o.n | 0) : 0; } catch (e) { return 0; }
  }
  function write(n) { try { window.localStorage.setItem(KEY, JSON.stringify({ d: today(), n: n })); } catch (e) {} }
  function showQuota() {
    if (!quota) { return; }
    if (pro) { quota.firstChild.nodeValue = 'Pro is on: no daily limit. '; quota.hidden = false; return; }
    var left = Math.max(0, LIMIT - read());
    quota.firstChild.nodeValue = left > 0
      ? 'Free: ' + left + ' of ' + LIMIT + ' analyses left today. '
      : 'Free limit reached for today (' + LIMIT + ' a day). ';
    quota.hidden = false;
  }

  /* offer_view: once, only after scroll, pointer or key input, or 10 s on the page, and when half the panel is visible. */
  var interacted = false, visible = false, viewed = false;
  function maybeView(reason) {
    if (viewed || pro || !interacted || !visible) { return; }
    viewed = true;
    track('offer_view', { interaction: reason || 'scroll' });
  }
  function onInteract(e) { if (interacted) { return; } interacted = true; maybeView(e && e.type); }
  ['scroll', 'pointerdown', 'keydown'].forEach(function (t) { window.addEventListener(t, onInteract, { passive: true, once: true }); });
  setTimeout(function () { if (!interacted) { interacted = true; maybeView('time_10s'); } }, 10000);
  var offerBox = $('.sa-pro-offer', panel);
  if (offerBox && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (en) { visible = en.isIntersecting; if (visible) { maybeView('visible'); } });
    }, { threshold: 0.5 }).observe(offerBox);
  }

  function openPanel(src) {
    if (!panel) { return; }
    var lim = $('.sa-pro-limit', panel);
    if (src === 'limit' && lim) { lim.hidden = false; }
    interacted = true;
    panel.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  /* Called by the analyzer's submit(): allow() before the analysis, used() after a shown result. */
  window.elSaPro = {
    allow: function () {
      if (pro || read() < LIMIT) { return true; }
      var st = document.getElementById('analysisStatus');
      if (st) { st.textContent = 'You used your ' + LIMIT + ' free analyses today. See Sentence Explainer Pro below.'; }
      track('cta_click', { cta_id: 'sa_pro_limit', src: 'limit' });
      openPanel('limit');
      showQuota();
      return false;
    },
    used: function () {
      if (pro) { var inp = document.getElementById('sentenceInput'); if (inp) { saveHistory(inp.value); } showQuota(); return; }
      write(read() + 1); showQuota();
    }
  };

  if (quota) {
    var qa = quota.querySelector('a');
    if (qa) { qa.addEventListener('click', function (e) { e.preventDefault(); track('cta_click', { cta_id: 'sa_pro_quota', src: 'quota' }); openPanel('quota'); }); }
    if (read() > 0) { showQuota(); }
  }

  /* ---------- buy button ---------- */
  var buying = false;
  document.querySelectorAll('a[data-sa-pro-buy]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (buying) { return; }
      buying = true; setTimeout(function () { buying = false; }, 3000);
      var src = a.getAttribute('data-sa-pro-buy') || 'panel';
      track('cta_click', { cta_id: 'sa_pro_buy_' + src, src: src });
      track('begin_checkout', { items: [ITEM], src: src });
    });
  });
  window.addEventListener('pageshow', function () { buying = false; });

  /* ---------- unlock ---------- */
  var msg = $('.sa-pro-msg', panel);
  function say(text, isErr) { if (!msg) { return; } msg.textContent = text; msg.className = 'sa-pro-msg ' + (isErr ? 'field-error' : 'helper'); msg.hidden = !text; }
  function fmt(expS) { try { return new Date(expS * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } }
  function getJSON(url) {
    return fetch(url, { credentials: 'omit' }).then(function (r) {
      return r.json().catch(function () { return { ok: false, reason: 'The server sent no answer.' }; }).then(function (j) { j.status = r.status; return j; });
    });
  }

  function firePurchase(sid, rc) {
    var dk = 'el_sa_pro_purchase_' + sid;
    if (ls(dk)) { return; }
    ls(dk, 1);
    var value = rc && rc.amount_total ? (rc.amount_total - (rc.amount_tax || 0)) / 100 : PRICE;
    var cur = rc && rc.currency ? String(rc.currency).toUpperCase() : 'USD';
    track('purchase', { transaction_id: sid, value: value, currency: cur, tax: rc && rc.amount_tax ? rc.amount_tax / 100 : 0,
      items: [{ item_id: OFFER, item_name: ITEM.item_name, price: value, quantity: 1 }], data_cro: 'sprint-20261115-purchase' });
  }

  function unlock(sid, tries) {
    say('Checking your payment with Stripe…');
    getJSON(API + '/unlock?session_id=' + encodeURIComponent(sid)).then(function (j) {
      if (j.ok && j.token) {
        ls(TKEY, { token: j.token, exp: j.exp, sid: sid, checked: Date.now(), ok: true });
        firePurchase(sid, j.payment_receipt);
        try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
        startPro(j.exp, sid, true);
        return;
      }
      if (j.retry && tries < 10) { say(j.reason || 'Still checking…'); setTimeout(function () { unlock(sid, tries + 1); }, 4000); return; }
      say((j.reason || 'We could not turn Pro on.') + '', true);
    }).catch(function () {
      if (tries < 5) { setTimeout(function () { unlock(sid, tries + 1); }, 4000); return; }
      say('We could not reach the server. Reload this page in a minute to try again.', true);
    });
  }

  function checkStored() {
    var t = ls(TKEY);
    if (!t || !t.token) { return; }
    if (t.exp && t.exp * 1000 <= Date.now()) { ls(TKEY, null); say('Your 12-month Pro pass has ended. The free tool still works.', false); return; }
    var fresh = t.ok && t.checked && Date.now() - t.checked < DAY;
    if (t.ok) { startPro(t.exp, t.sid, false); }
    if (fresh) { return; }
    getJSON(API + '/check?token=' + encodeURIComponent(t.token)).then(function (j) {
      if (j.ok) { t.ok = true; t.checked = Date.now(); t.exp = j.exp; ls(TKEY, t); if (!pro) { startPro(j.exp, t.sid, false); } return; }
      if (j.status === 403) { ls(TKEY, null); stopPro(j.reason || 'Pro is not active in this browser.'); }
    }).catch(function () { /* offline: keep a pass that was valid before, until its expiry */ });
  }

  function stopPro(reason) {
    pro = false;
    if (proBox) { proBox.hidden = true; }
    var off = $('.sa-pro-offer', panel); if (off) { off.hidden = false; }
    say(reason, true); showQuota();
  }

  /* ---------- Pro features ---------- */
  function core() { return window.elSaCore; }
  function history_() { return ls(HKEY) || []; }
  function saveHistory(text) {
    text = String(text || '').trim();
    if (!text) { return; }
    var h = history_().filter(function (x) { return x.t !== text; });
    h.unshift({ t: text, at: Date.now() });
    ls(HKEY, h.slice(0, 200));
    drawHistory();
  }
  function drawHistory() {
    var list = $('#saProHist'); if (!list) { return; }
    var h = history_();
    list.replaceChildren();
    $('#saProHistEmpty').hidden = h.length > 0;
    h.slice(0, 50).forEach(function (x, i) {
      var li = el('li', 'sa-pro-hist-item');
      li.append(el('span', 'sa-pro-hist-text', x.t));
      var open = el('button', 'btn', 'Open'); open.type = 'button';
      open.addEventListener('click', function () {
        var inp = document.getElementById('sentenceInput'), form = document.getElementById('parseForm');
        if (/[.!?]\s+\S/.test(x.t)) { $('#saProPara').value = x.t; runParagraph(); return; }
        if (inp && form) { inp.value = x.t; if (form.requestSubmit) { form.requestSubmit(); } else { form.dispatchEvent(new Event('submit', { cancelable: true })); } }
      });
      var del = el('button', 'btn', 'Delete'); del.type = 'button'; del.setAttribute('aria-label', 'Delete sentence ' + (i + 1));
      del.addEventListener('click', function () { ls(HKEY, history_().filter(function (y) { return y.t !== x.t; })); drawHistory(); });
      li.append(open, del); list.append(li);
    });
  }

  function splitSentences(text) {
    var out = [];
    try { out = window.nlp(text).json().map(function (s) { return String(s.text || '').trim(); }); } catch (e) { out = []; }
    if (!out.length) { out = text.split(/(?<=[.!?])\s+/); }
    return out.filter(function (s) { return /[a-z]/i.test(s); });
  }
  var lastSet = [];
  function analyzeAll(sentences) {
    var c = core();
    return sentences.map(function (s) { var r = c.analyze(s); return { text: s, r: r }; });
  }
  function runParagraph() {
    var ta = $('#saProPara'), out = $('#saProParaOut'), st = $('#saProParaStatus');
    var text = (ta.value || '').trim();
    if (!core() || typeof window.nlp !== 'function') { st.textContent = 'The word library did not load. Reload this page and try again.'; return; }
    if (!text) { st.textContent = 'Paste a paragraph first.'; ta.focus(); return; }
    var words = text.split(/\s+/).length;
    if (words > 1500) { st.textContent = 'Use up to 1,500 words at a time. This text has ' + words + '.'; return; }
    var sents = splitSentences(text);
    if (sents.length > 40) { st.textContent = 'Found ' + sents.length + ' sentences. Use up to 40 at a time.'; return; }
    lastSet = analyzeAll(sents);
    out.replaceChildren();
    lastSet.forEach(function (x, i) {
      var d = el('details', 'sa-pro-card'); if (i === 0) { d.open = true; }
      var sum = el('summary', '');
      sum.append(el('b', '', (i + 1) + '. '), document.createTextNode(x.text + ' '));
      sum.append(el('span', 'parse-tag', x.r.error ? 'Not analyzed' : (x.r.uncertain ? 'Not sure' : x.r.type + ' · ' + x.r.pattern)));
      d.append(sum);
      var box = el('div', 'sa-pro-card-body');
      if (x.r.error) { box.append(el('p', 'field-error', x.r.error)); } else { core().render(x.r, box); }
      d.append(box); out.append(d);
    });
    st.textContent = lastSet.length + ' sentence' + (lastSet.length === 1 ? '' : 's') + ' analyzed. Open each one below. Use the worksheet buttons to print or download them.';
    saveHistory(text);
    if (window.elTrack) { window.elTrack('tool_result', { tool: 'sentence-analyzer-pro-paragraph', sentences: lastSet.length }); }
  }

  function worksheetSet() {
    if (lastSet.length) { return lastSet; }
    var h = history_().slice(0, 20).map(function (x) { return x.t; });
    var sents = [];
    h.forEach(function (t) { splitSentences(t).forEach(function (s) { if (sents.length < 40) { sents.push(s); } }); });
    return analyzeAll(sents);
  }
  function factRow(r) {
    if (r.error) { return { subject: '', verb: '', pattern: '', tense: '', type: '', clauses: '', voice: '', note: r.error }; }
    return { subject: r.subject || 'Not sure', verb: r.verb || 'Not sure', pattern: r.pattern || 'Not sure', tense: r.tense || 'Not sure',
      type: r.type || '', clauses: r.clauseCount || '', voice: r.voice || 'Not sure', note: (r.notes || []).join(' ') };
  }
  function noSet(st) { st.textContent = 'Analyze a paragraph first, or analyze some sentences so they are in your history.'; }
  function download(name, mime, body) {
    var a = el('a'); a.href = URL.createObjectURL(new Blob([body], { type: mime })); a.download = name;
    document.body.append(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function exportTxt() {
    var set = worksheetSet(), st = $('#saProWsStatus'); if (!set.length) { noSet(st); return; }
    var L = ['Sentence worksheet - englishlearner.org Sentence Explainer Pro', 'Name: ____________________   Date: ____________', '',
      'For each sentence, write the subject, the verb phrase, the word order pattern (S-V, S-V-O, S-V-O-O, S-V-C, S-V-A) and the tense.', ''];
    set.forEach(function (x, i) {
      L.push((i + 1) + '. ' + x.text, '   Subject: ______________________   Verb phrase: ______________________',
        '   Pattern: ____________   Tense or verb form: ______________________', '   Rewrite it in your own words: ____________________________________________', '');
    });
    L.push('', 'ANSWER KEY (automatic estimate - check it against the meaning)', '');
    set.forEach(function (x, i) {
      var f = factRow(x.r);
      L.push((i + 1) + '. ' + (f.type ? f.type + ' | ' : '') + 'Subject: ' + f.subject + ' | Verb: ' + f.verb + ' | Pattern: ' + f.pattern + ' | Tense: ' + f.tense + ' | Voice: ' + f.voice + (f.note ? ' | ' + f.note : ''));
    });
    download('sentence-worksheet.txt', 'text/plain;charset=utf-8', L.join('\r\n'));
    st.textContent = 'Downloaded sentence-worksheet.txt with ' + set.length + ' sentences.';
  }
  function csvCell(v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) { v = "'" + v; } return '"' + v.replace(/"/g, '""') + '"'; }
  function exportCsv() {
    var set = worksheetSet(), st = $('#saProWsStatus'); if (!set.length) { noSet(st); return; }
    var rows = [['number', 'sentence', 'sentence_type', 'subject', 'verb_phrase', 'pattern', 'tense', 'voice', 'clauses', 'notes']];
    set.forEach(function (x, i) { var f = factRow(x.r); rows.push([i + 1, x.text, f.type, f.subject, f.verb, f.pattern, f.tense, f.voice, f.clauses, f.note]); });
    download('sentence-analysis.csv', 'text/csv;charset=utf-8', '﻿' + rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n'));
    st.textContent = 'Downloaded sentence-analysis.csv with ' + set.length + ' sentences.';
  }
  function printWs() {
    var set = worksheetSet(), st = $('#saProWsStatus'); if (!set.length) { noSet(st); return; }
    var old = document.getElementById('saWorksheet'); if (old) { old.remove(); }
    var ws = el('div', 'sa-ws'); ws.id = 'saWorksheet';
    ws.append(el('h1', '', 'Sentence worksheet'), el('p', 'sa-ws-line', 'Name: ______________________________   Date: ________________'),
      el('p', '', 'For each sentence, write the subject, the verb phrase, the word order pattern (S-V, S-V-O, S-V-O-O, S-V-C, S-V-A) and the tense. Then rewrite the sentence in your own words.'));
    var ol = el('ol', 'sa-ws-list');
    set.forEach(function (x) {
      var li = el('li', '');
      li.append(el('p', 'sa-ws-q', x.text), el('p', 'sa-ws-line', 'Subject: ________________________  Verb phrase: ________________________'),
        el('p', 'sa-ws-line', 'Pattern: ______________  Tense or verb form: ________________________'),
        el('p', 'sa-ws-line', 'Your own sentence: ____________________________________________________'));
      ol.append(li);
    });
    ws.append(ol);
    var key = el('section', 'sa-ws-key'); key.append(el('h2', '', 'Answer key'), el('p', '', 'Automatic estimate. Check it against the meaning.'));
    var kol = el('ol', '');
    set.forEach(function (x) { var f = factRow(x.r); kol.append(el('li', '', (f.type ? f.type + '. ' : '') + 'Subject: ' + f.subject + '. Verb: ' + f.verb + '. Pattern: ' + f.pattern + '. Tense: ' + f.tense + '. Voice: ' + f.voice + '.' + (f.note ? ' ' + f.note : ''))); });
    key.append(kol, el('p', 'sa-ws-foot', 'Made with Sentence Explainer Pro, englishlearner.org'));
    ws.append(key);
    document.body.append(ws);
    document.documentElement.classList.add('sa-printing');
    var done = function () { document.documentElement.classList.remove('sa-printing'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    st.textContent = 'The print window shows ' + set.length + ' sentences. Choose "Save as PDF" to keep a file.';
    window.print();
    setTimeout(done, 60000);
  }

  var wired = false;
  function startPro(expS, sid, justBought) {
    pro = true;
    var off = $('.sa-pro-offer', panel); if (off) { off.hidden = true; }
    var lim = $('.sa-pro-limit', panel); if (lim) { lim.hidden = true; }
    if (!proBox) { return; }
    proBox.hidden = false;
    $('#saProUntil').textContent = fmt(expS);
    var share = $('#saProShare');
    if (share && sid && /^cs_live_/.test(sid)) {
      share.hidden = false;
      $('#saProShareUrl').value = location.origin + location.pathname + '?pro=' + sid;
    }
    say(justBought ? 'Thank you. Pro is on in this browser.' : '', false);
    showQuota();
    if (wired) { return; }
    wired = true;
    $('#saProParaBtn').addEventListener('click', runParagraph);
    $('#saProPrint').addEventListener('click', printWs);
    $('#saProTxt').addEventListener('click', exportTxt);
    $('#saProCsv').addEventListener('click', exportCsv);
    $('#saProHistClear').addEventListener('click', function () { if (window.confirm('Delete all saved sentences in this browser?')) { ls(HKEY, null); drawHistory(); } });
    drawHistory();
    if (justBought && proBox.scrollIntoView) { panel.scrollIntoView({ block: 'start' }); }
  }

  var sp = /[?&]pro=([^&#]+)/.exec(location.search);
  if (sp) {
    var sid = decodeURIComponent(sp[1]);
    if (/^cs_live_[A-Za-z0-9]{10,200}$/.test(sid)) { unlock(sid, 0); } else { say('That link has no valid purchase reference.', true); }
  } else {
    checkStored();
  }
})();
