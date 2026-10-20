/* Cambridge English Scale score converter (tool-cambridge-english-scale-converter).
   Data: official Cambridge English results tables, verified 2026-10-20 from
   https://www.cambridgeenglish.org/exams-and-tests/qualifications/results/
   Practice-test marks: the published marks for each paper in the Cambridge guide
   "Converting practice test scores to Cambridge English Scale scores" (ENG/36303/V1/NOV23),
   https://www.cambridgeenglish.org/images/210434-converting-practice-test-scores-to-cambridge-english-scale-scores.pdf
   Bands: [min, max, grade, cefr] per exam. No value is shown that is not in these tables. */
(function () {
  'use strict';

  var EXAMS = {
    a2key: { name: 'A2 Key', bands: [
      [140, 150, 'Grade A', 'B1'], [133, 139, 'Grade B', 'A2'],
      [120, 132, 'Grade C', 'A2'], [100, 119, 'Level A1', 'A1']
    ], below: [80, 99, 'Level A1'] },
    b1pre: { name: 'B1 Preliminary', bands: [
      [160, 170, 'Grade A', 'B2'], [153, 159, 'Grade B', 'B1'],
      [140, 152, 'Grade C', 'B1'], [120, 139, 'Level A2', 'A2']
    ], below: [102, 119, 'Level A2'] },
    b2first: { name: 'B2 First', bands: [
      [180, 190, 'Grade A', 'C1'], [173, 179, 'Grade B', 'B2'],
      [160, 172, 'Grade C', 'B2'], [140, 159, 'Level B1', 'B1']
    ], below: [122, 139, 'Level B1'] },
    c1adv: { name: 'C1 Advanced', bands: [
      [200, 210, 'Grade A', 'C2'], [193, 199, 'Grade B', 'C1'],
      [180, 192, 'Grade C', 'C1'], [160, 179, 'Level B2', 'B2']
    ], below: [142, 159, 'Level B2'] },
    c2prof: { name: 'C2 Proficiency', bands: [
      [220, 230, 'Grade A', 'C2'], [213, 219, 'Grade B', 'C2'],
      [200, 212, 'Grade C', 'C2'], [180, 199, 'Level C1', 'C1']
    ], below: [162, 179, 'Level C1'] }
  };

  /* Practice-test marks per paper: [mark, scale score], highest first. The last pair is the
     lowest published mark and the minimum score that the exam reports. */
  var PRACTICE = {
    a2key: [
      { paper: 'Reading', max: 30, half: false, anchors: [[28, 140], [20, 120], [13, 100], [7, 82]] },
      { paper: 'Writing', max: 30, half: false, anchors: [[26, 140], [18, 120], [12, 100], [8, 82]] },
      { paper: 'Listening', max: 25, half: false, anchors: [[23, 140], [17, 120], [11, 100], [6, 82]] },
      { paper: 'Speaking', max: 45, half: true, anchors: [[41, 140], [27, 120], [18, 100], [10, 82]] }
    ],
    b1pre: [
      { paper: 'Reading', max: 32, half: false, anchors: [[29, 160], [23, 140], [13, 120], [5, 102]] },
      { paper: 'Writing', max: 40, half: false, anchors: [[34, 160], [24, 140], [16, 120], [10, 102]] },
      { paper: 'Listening', max: 25, half: false, anchors: [[23, 160], [18, 140], [11, 120], [5, 102]] },
      { paper: 'Speaking', max: 30, half: true, anchors: [[27, 160], [18, 140], [12, 120], [7, 102]] }
    ],
    b2first: [
      { paper: 'Reading', max: 42, half: false, anchors: [[37, 180], [24, 160], [16, 140], [10, 122]] },
      { paper: 'Use of English', max: 28, half: false, anchors: [[24, 180], [18, 160], [11, 140], [7, 122]] },
      { paper: 'Writing', max: 40, half: false, anchors: [[34, 180], [24, 160], [16, 140], [10, 122]] },
      { paper: 'Listening', max: 30, half: false, anchors: [[27, 180], [18, 160], [12, 140], [8, 122]] },
      { paper: 'Speaking', max: 60, half: true, anchors: [[54, 180], [36, 160], [24, 140], [14, 122]] }
    ],
    c1adv: [
      { paper: 'Reading', max: 50, half: false, anchors: [[43, 200], [32, 180], [23, 160], [17, 142]] },
      { paper: 'Use of English', max: 28, half: false, anchors: [[23, 200], [16, 180], [11, 160], [8, 142]] },
      { paper: 'Writing', max: 40, half: false, anchors: [[34, 200], [24, 180], [16, 160], [10, 142]] },
      { paper: 'Listening', max: 30, half: false, anchors: [[26, 200], [18, 180], [13, 160], [11, 142]] },
      { paper: 'Speaking', max: 75, half: true, anchors: [[66, 200], [45, 180], [30, 160], [17, 142]] }
    ],
    c2prof: [
      { paper: 'Reading', max: 44, half: false, anchors: [[36, 220], [28, 200], [22, 180], [14, 162]] },
      { paper: 'Use of English', max: 28, half: false, anchors: [[22, 220], [17, 200], [13, 180], [9, 162]] },
      { paper: 'Writing', max: 40, half: false, anchors: [[34, 220], [24, 200], [16, 180], [10, 162]] },
      { paper: 'Listening', max: 30, half: false, anchors: [[24, 220], [18, 200], [14, 180], [10, 162]] },
      { paper: 'Speaking', max: 75, half: true, anchors: [[66, 220], [45, 200], [30, 180], [17, 162]] }
    ]
  };


  var ORDER = ['a2key', 'b1pre', 'b2first', 'c1adv', 'c2prof'];

  /* Outcome of one overall score on one exam, from the tables above. */
  function outcome(key, score) {
    var exam = EXAMS[key];
    if (key === 'a2key' && (score === 80 || score === 81)) return { kind: 'conflict', text: 'Sources disagree (see below)' };
    for (var i = 0; i < exam.bands.length; i++) {
      var b = exam.bands[i];
      if (score >= b[0] && score <= b[1]) return { kind: 'band', band: b, text: b[2] + ', CEFR ' + b[3] };
    }
    if (score >= exam.below[0] && score <= exam.below[1]) return { kind: 'below', text: 'Reported, no certificate' };
    return { kind: 'out', text: 'Not reported' };
  }

  var form = document.getElementById('converterForm');
  var input = document.getElementById('scoreInput');
  var error = document.getElementById('scoreError');
  var summary = document.getElementById('resultSummary');
  var detail = document.getElementById('resultDetail');
  var status = document.getElementById('resultStatus');
  var result = document.getElementById('result');
  var resultTitle = document.getElementById('resultTitle');
  var chosen = null;

  var PLACEHOLDER = 'Your grade and CEFR level appear here when you convert a score.';

  function resetResult() {
    error.textContent = '';
    detail.replaceChildren();
    summary.textContent = PLACEHOLDER;
    result.classList.remove('is-complete');
    status.textContent = '';
  }

  function pickExam(exam) {
    chosen = exam;
    document.querySelectorAll('.exam-btn').forEach(function (b) {
      var on = b.dataset.exam === exam;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.classList.toggle('is-selected', on);
    });
    resetResult();
  }

  document.querySelectorAll('.exam-btn').forEach(function (b) {
    b.addEventListener('click', function () { pickExam(b.dataset.exam); });
  });

  /* The same overall score on all five exams. */
  function compareTable(score) {
    var wrap = document.createElement('div');
    var h = document.createElement('h3');
    h.textContent = 'The same score on each exam';
    var table = document.createElement('table');
    table.className = 'scale-table compare-table';
    var head = document.createElement('tr');
    ['Exam', 'Score ' + score + ' means'].forEach(function (t) { var th = document.createElement('th'); th.scope = 'col'; th.textContent = t; head.append(th); });
    var thead = document.createElement('thead'); thead.append(head);
    var body = document.createElement('tbody');
    ORDER.forEach(function (key) {
      var tr = document.createElement('tr');
      var th = document.createElement('th'); th.scope = 'row'; th.textContent = EXAMS[key].name;
      var td = document.createElement('td'); td.textContent = outcome(key, score).text;
      tr.append(th, td); body.append(tr);
    });
    table.append(thead, body);
    wrap.append(h, table);
    return wrap;
  }

  function convert(event) {
    if (event) event.preventDefault();
    var raw = input.value.trim();
    var score = Number(raw);
    resetResult();
    if (!raw) { error.textContent = 'Enter your score.'; input.focus(); return; }
    if (!/^\d+$/.test(raw)) { error.textContent = 'Use a whole number, for example 173.'; input.focus(); return; }
    if (score < 80 || score > 230) { error.textContent = 'Scores on the Cambridge English Scale for these exams run from 80 to 230.'; input.focus(); return; }
    if (!chosen) { error.textContent = 'Choose which exam you took.'; return; }

    var exam = EXAMS[chosen];
    var res = outcome(chosen, score);
    var hit = res.kind === 'band' ? res.band : null;

    if (res.kind === 'conflict') {
      summary.textContent = 'Score ' + score + ' on A2 Key: two official Cambridge sources disagree.';
      var pc = document.createElement('p');
      pc.textContent = 'The Cambridge results page says that A2 Key reports scores from 80 to 99, with no certificate. The A2 Key Statement of Results factsheet (May 2026) and the Cambridge practice-test guide say that scores below 82 are not reported. Check your Statement of Results.';
      detail.append(pc);
      status.textContent = 'No conversion. The official sources disagree for 80 and 81.';
    } else if (hit) {
      summary.textContent = 'Score ' + score + ' on ' + exam.name + ' is ' + hit[2] + ' at CEFR level ' + hit[3] + '.';
      var p1 = document.createElement('p');
      p1.textContent = 'A score of ' + score + ' on the Cambridge English Scale is ' + hit[2] + ' for ' + exam.name + ', which reports at CEFR level ' + hit[3] + '. Check your Statement of Results for your official grade.';
      detail.append(p1);
      var p2 = document.createElement('p');
      var a = document.createElement('a');
      var lesson = { A1: ['a1-and-a2', 'A1 and A2'], A2: ['a1-and-a2', 'A1 and A2'], B1: ['b1-and-b2', 'B1 and B2'], B2: ['b1-and-b2', 'B1 and B2'], C1: ['c1-and-c2', 'C1 and C2'], C2: ['c1-and-c2', 'C1 and C2'] }[hit[3]];
      a.href = '/lessons/cefr-levels/#' + lesson[0];
      a.textContent = 'What ' + lesson[1] + ' mean';
      p2.append(a);
      detail.append(p2);
      status.textContent = 'Converted from the official Cambridge tables.';
    } else if (score >= exam.below[0] && score <= exam.below[1]) {
      summary.textContent = 'Score ' + score + ' on ' + exam.name + ' is reported, but below the pass line. There is no grade or certificate.';
      var p2 = document.createElement('p');
      p2.textContent = 'Cambridge reports scores from ' + exam.below[0] + ' to ' + exam.below[1] + ' for ' + exam.name + ', but candidates in this band do not receive a certificate. Your Statement of Results still shows your score.';
      detail.append(p2);
      status.textContent = 'Converted from the official Cambridge tables.';
    } else {
      summary.textContent = 'Score ' + score + ' is outside the reported band for ' + exam.name + '.';
      var p3 = document.createElement('p');
      p3.textContent = exam.name + ' reports scores from ' + exam.below[0] + ' to ' + exam.bands[0][1] + '. A score of ' + score + ' would not be reported for this exam. Check that you picked the exam you actually took.';
      detail.append(p3);
      status.textContent = 'No conversion. The score is outside the reported band.';
    }
    detail.append(compareTable(score));
    resultTitle.textContent = 'Your result';
    result.dataset.stale = 'false';
    result.classList.add('is-complete');
    resultTitle.focus();
    if (window.elTrack) window.elTrack('tool_result', { tool: 'cambridge-english-scale-converter' });
  }

  form.addEventListener('submit', convert);
  input.addEventListener('input', resetResult);
  window.addEventListener('pageshow', function (e) { if (e.persisted) resetResult(); });
  input.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') convert(e);
  });
  document.getElementById('clearButton').addEventListener('click', function () {
    input.value = ''; resetResult();
    input.focus();
  });
  /* Practice-test marks to a Cambridge English Scale range (official practice tests only). */
  var pForm = document.getElementById('practiceForm');
  if (pForm) {
    var pExam = document.getElementById('practiceExam');
    var pFields = document.getElementById('practiceFields');
    var pError = document.getElementById('practiceError');
    var pOut = document.getElementById('practiceResult');
    var P_PLACEHOLDER = 'Choose an exam, enter a mark for each paper and press Estimate range.';

    function pReset() {
      pError.textContent = '';
      pOut.replaceChildren();
      var p = document.createElement('p');
      p.textContent = P_PLACEHOLDER;
      pOut.append(p);
    }

    function buildFields() {
      pFields.replaceChildren();
      var key = pExam.value;
      if (!PRACTICE[key]) { pReset(); return; }
      PRACTICE[key].forEach(function (paper, i) {
        var div = document.createElement('div');
        div.className = 'field';
        var label = document.createElement('label');
        label.htmlFor = 'pmark' + i;
        label.textContent = paper.paper + ' mark (0 to ' + paper.max + ')';
        var inp = document.createElement('input');
        inp.type = 'text'; inp.id = 'pmark' + i; inp.inputMode = 'decimal'; inp.autocomplete = 'off'; inp.maxLength = 6;
        inp.addEventListener('input', pReset);
        div.append(label, inp);
        pFields.append(div);
      });
      pReset();
    }

    /* Range of scale scores for one paper mark, from the published marks. */
    function paperRange(paper, mark, top) {
      var a = paper.anchors;
      if (mark < a[a.length - 1][0]) return null;
      for (var i = 0; i < a.length; i++) {
        if (mark >= a[i][0]) return [a[i][1], i === 0 ? top : a[i - 1][1] - 1];
      }
      return null;
    }

    function describe(key, score) {
      var o = outcome(key, score);
      if (o.kind === 'band') return o.band[2] + ' (CEFR ' + o.band[3] + ')';
      if (o.kind === 'below') return 'reported, but below the pass line and with no certificate';
      if (o.kind === 'conflict') return 'a score on which official Cambridge sources disagree';
      return 'not reported';
    }

    function estimate(event) {
      if (event) event.preventDefault();
      pReset();
      var key = pExam.value;
      if (!PRACTICE[key]) { pError.textContent = 'Choose which exam your practice test was for.'; pExam.focus(); return; }
      var papers = PRACTICE[key];
      var top = EXAMS[key].bands[0][1];
      var lo = 0, hi = 0, rows = [], missed = [];
      for (var i = 0; i < papers.length; i++) {
        var paper = papers[i];
        var el = document.getElementById('pmark' + i);
        var raw = el.value.trim();
        var ok = paper.half ? /^\d{1,2}(\.5|\.0)?$/.test(raw) : /^\d{1,2}$/.test(raw);
        var mark = Number(raw);
        if (!raw || !ok || mark > paper.max) {
          pError.textContent = 'Enter a ' + paper.paper + ' mark from 0 to ' + paper.max + (paper.half ? ' (whole or half marks).' : ' (whole marks).');
          el.focus();
          return;
        }
        var r = paperRange(paper, mark, top);
        if (!r) missed.push(paper.paper);
        else { lo += r[0]; hi += r[1]; }
        rows.push([paper.paper, mark + ' of ' + paper.max, r ? (r[0] === r[1] ? String(r[0]) : r[0] + ' to ' + r[1]) : 'Below the lowest published mark']);
      }
      var n = papers.length;
      var sum = document.createElement('p');
      sum.className = 'practice-summary';
      if (missed.length) {
        sum.textContent = 'No overall range: ' + missed.join(', ') + ' ' + (missed.length === 1 ? 'is' : 'are') + ' below the lowest mark that Cambridge publishes for the paper. Below that mark the guide gives no scale score.';
      } else {
        var oLo = Math.round(lo / n), oHi = Math.round(hi / n);
        sum.textContent = 'Overall: about ' + (oLo === oHi ? oLo : oLo + ' to ' + oHi) + ' on the Cambridge English Scale. At ' + oLo + ' the result on ' + EXAMS[key].name + ' is ' + describe(key, oLo) + (oLo === oHi ? '.' : '; at ' + oHi + ' it is ' + describe(key, oHi) + '.');
      }
      var table = document.createElement('table');
      table.className = 'scale-table practice-table';
      var head = document.createElement('tr');
      ['Paper', 'Your mark', 'Scale range'].forEach(function (t) { var th = document.createElement('th'); th.scope = 'col'; th.textContent = t; head.append(th); });
      var thead = document.createElement('thead'); thead.append(head);
      var body = document.createElement('tbody');
      rows.forEach(function (r) {
        var tr = document.createElement('tr');
        var th = document.createElement('th'); th.scope = 'row'; th.textContent = r[0];
        var td1 = document.createElement('td'); td1.textContent = r[1];
        var td2 = document.createElement('td'); td2.textContent = r[2];
        tr.append(th, td1, td2); body.append(tr);
      });
      table.append(thead, body);
      var note = document.createElement('p');
      note.className = 'helper';
      note.textContent = 'This is a range, not an exact score. Cambridge publishes only four marks for each paper, and says that the tables apply only to official Cambridge practice tests and do not predict a precise live exam score.';
      pOut.replaceChildren(sum, table, note);
    }

    pExam.addEventListener('change', buildFields);
    pForm.addEventListener('submit', estimate);
    document.getElementById('practiceClear').addEventListener('click', function () {
      pFields.querySelectorAll('input').forEach(function (i) { i.value = ''; });
      pReset();
    });
    buildFields();
  }
})();
