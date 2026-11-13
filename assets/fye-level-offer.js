/* Workbook offer on the level test result (2026-11-08, R4 idea 1; CRO 2026-11-13: data-cro="fye-level-offer-all").
   Shown to EVERY completer, at every level and in every language, above the score table.
   Free part: the level and the top 3 points missed (with a free lesson link where one exists).
   Paid part: the US$6.99 workbook with the 30-day plan for the nearest level pack (A2 to C1).
   Chinese visitors get a Chinese headline. A1/below A1 and C2 get honest variants.
   The card names the workbook units that cover the questions this visitor got wrong.
   Every unit below exists in the shipped workbook (Fix Your English v1, content/level-*.json and mistakes.json).
   Questions with no matching unit map to null and are never named. */
(function (root) {
  'use strict';

  var UNITS = {
    'p1-verbs': { label: 'Part 1 · Verb basics', en: 'am, is and are', zh: '动词基础 am、is、are' },
    'a2-u1': { label: 'A2 · Unit 1', en: 'Present simple or present continuous', zh: '一般现在时与现在进行时' },
    'a2-u3': { label: 'A2 · Unit 3', en: 'Articles a, an and the', zh: '冠词 a、an 和 the' },
    'b1-u1': { label: 'B1 · Unit 1', en: 'Present perfect or past simple', zh: '现在完成时与一般过去时' },
    'b1-u3': { label: 'B1 · Unit 3', en: 'First and second conditionals', zh: '第一条件句与第二条件句' },
    'b1-u6': { label: 'B1 · Unit 6', en: 'Relative clauses with who, which and that', zh: '定语从句' },
    'b2-u1': { label: 'B2 · Unit 1', en: 'Past perfect and narrative tenses', zh: '过去完成时与叙事时态' },
    'b2-u2': { label: 'B2 · Unit 2', en: 'The passive voice', zh: '被动语态' },
    'b2-u3': { label: 'B2 · Unit 3', en: 'Third and mixed conditionals', zh: '第三条件句与混合条件句' },
    'b2-u6': { label: 'B2 · Unit 6', en: 'Linking words for contrast like despite and however', zh: '表示转折与对比的连接词' },
    'c1-u1': { label: 'C1 · Unit 1', en: 'Inversion after never, little, hardly and no sooner', zh: '倒装与强调句' }
  };

  /* Free lessons on this site for each unit (from the workbook content files). Units without one are listed without a link. */
  var LESSON = {
    'a2-u1': '/lessons/present-simple-vs-present-continuous/',
    'a2-u3': '/lessons/articles-a-an-the/',
    'b1-u1': '/lessons/present-perfect-vs-past-simple/',
    'b1-u3': '/lessons/conditionals/',
    'b1-u6': '/lessons/relative-clauses/',
    'b2-u1': '/lessons/past-perfect/',
    'b2-u2': '/lessons/passive-voice/',
    'b2-u3': '/lessons/conditionals/',
    'b2-u6': '/lessons/main-clause-vs-subordinate-clause/'
  };

  /* All 30 level test questions, keyed by their exact text. null means no workbook unit covers it. */
  var QMAP = {
    'I ___ a student.': 'p1-verbs',
    'She ___ from Spain.': 'p1-verbs',
    'I ___ (have) a cat.': 'a2-u1',
    'What is this? ___ apple.': 'a2-u3',
    'This ___ my book.': 'p1-verbs',
    'He ___ to school every day.': 'a2-u1',
    'She ___ (watch) TV every evening.': 'a2-u1',
    '___ you like coffee?': 'a2-u1',
    'Tom usually wakes up at 7am. He has breakfast and then goes to work. What does Tom do after breakfast?': null,
    'We ___ (not/like) spinach.': 'a2-u1',
    'If it rains, I ___ stay home.': 'b1-u3',
    'They have ___ (live) here for 5 years.': 'b1-u1',
    'I ___ my keys yesterday.': 'b1-u1',
    'The restaurant was fully booked, so we decided to eat at a small café instead. Why didn\'t they eat at the restaurant?': null,
    'I have known her ___ 2015.': 'b1-u1',
    'By the time we arrived, they ___ dinner.': 'b2-u1',
    'She wishes she ___ (can) fly.': null,
    'The report ___ by the manager tomorrow.': 'b2-u2',
    'Despite the heavy traffic, we managed to reach the airport on time. However, our flight was delayed by two hours. What happened?': 'b2-u6',
    'I ___ (never/see) such a beautiful sunset.': 'b1-u1',
    'Had it not been for your help, I ___ succeeded.': 'b2-u3',
    'It’s high time you ___ (make) a decision.': null,
    'The phenomenon, ___ has been widely debated, remains unexplained.': 'b1-u6',
    'The author’s critique of the policy is not merely economic but extends to its cultural consequences. What does the critique cover?': null,
    'No sooner had we sat down ___ the phone rang.': 'c1-u1',
    'Little ___ that the decision would change everything.': 'c1-u1',
    'Not until she arrived ___ (he / realize) the truth.': 'c1-u1',
    'The obfuscation of the data rendered the analysis ___ .': null,
    'The subtext of the dialogue suggests a deep-seated ambivalence towards modernity. The characters\' nostalgia is not for the past but for a future that never materialized. Which is implied?': null,
    '___ (hardly / he / finish) when the bell rang.': 'c1-u1'
  };

  var LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  var CN_ZONES = ['Asia/Shanghai', 'Asia/Urumqi', 'Asia/Chongqing', 'Asia/Chungking', 'Asia/Harbin', 'Asia/Kashgar', 'PRC'];
  var SHOP = 'https://shop.englishlearner.org/buy/fix-your-english?src=';
  var SAMPLE = 'https://shop.englishlearner.org/sample.pdf';
  var MAX_GAPS = 3;
  var PRICE = 6.99;

  function env() {
    var tz = '', langs = [];
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    try { langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']).slice(0, 5); } catch (e) {}
    return { tz: tz, langs: langs };
  }

  /* Chinese visitor: a mainland China time zone, or a browser whose first language is Chinese. */
  function isChinese(e) {
    e = e || env();
    if (CN_ZONES.indexOf(e.tz) >= 0) { return true; }
    return /^zh(\b|-|_|$)/i.test(String((e.langs || [])[0] || ''));
  }

  /* Units for the questions this visitor got wrong, up to one level above the result.
     Harder questions are expected misses and would only add noise. Sorted by level, then by misses. */
  function gaps(answers, level) {
    var byId = {}, list = [];
    (answers || []).forEach(function (a) {
      if (!a || a.correct || a.level > level + 1) { return; }
      var id = Object.prototype.hasOwnProperty.call(QMAP, a.q) ? QMAP[a.q] : null;
      if (!id || !UNITS[id]) { return; }
      if (!byId[id]) { byId[id] = { id: id, label: UNITS[id].label, en: UNITS[id].en, zh: UNITS[id].zh, n: 0, lv: a.level }; list.push(byId[id]); }
      byId[id].n++;
      if (a.level < byId[id].lv) { byId[id].lv = a.level; }
    });
    list.sort(function (x, y) { return (x.lv - y.lv) || (y.n - x.n) || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0); });
    return list.slice(0, MAX_GAPS);
  }

  /* 2026-11-13: every completer sees the card (level -1 = below A1 ... 5 = C2), in every language. */
  function showFor(level) {
    return typeof level === 'number' && level >= -1 && level <= 5;
  }

  /* The workbook has packs and 30-day plans for A2, B1, B2 and C1. Below A2 the next pack is A2; at C2 it is C1. */
  function planLevel(level) { return LEVELS[Math.min(4, Math.max(1, level))]; }

  function track(name, p) { try { if (root.elTrack) { root.elTrack(name, p); } } catch (e) {} }

  function lang(e) { return String(((e || env()).langs || [])[0] || '').slice(0, 20); }

  function variant(level) { return level <= 0 ? 'starter' : level >= 4 ? 'advanced' : 'core'; }

  function card(level, answers, e) {
    e = e || env();
    if (!showFor(level)) { return ''; }
    var zh = isChinese(e), v = variant(level);
    var L = level >= 0 ? LEVELS[level] : 'below A1', P = planLevel(level), g = gaps(answers, Math.max(level, 0));
    var src = 'level-result-' + (zh ? 'zh' : 'en');
    var rows = g.map(function (x) {
      var lesson = LESSON[x.id] ? ' <a class="fye-free" href="' + LESSON[x.id] + '">Free lesson</a>' : '';
      return '<li><b>' + x.en + '</b>' + (zh ? ' <span class="fye-zh" lang="zh-Hans">' + x.zh + '</span>' : '') + lesson
        + '<span class="fye-unit">' + x.label + ' · ' + (x.n === 1 ? '1 question missed' : x.n + ' questions missed') + '</span></li>';
    }).join('');
    var free = '<p class="fye-free-h"><b>Free: your result is ' + L + '.</b> '
      + (g.length ? 'Your top ' + (g.length === 1 ? 'point' : g.length + ' points') + ' to fix:' : 'You missed no point that the workbook covers below your next level.') + '</p>'
      + (g.length ? '<ul class="fye-gaps">' + rows + '</ul>' : '');
    var h, lead;
    if (v === 'starter') {
      h = zh ? '你的结果是 ' + L + '。先用免费课程打基础，然后用 A2 的 30 天计划。' : 'Your result: ' + L + '. Next step: the A2 30-day plan.';
      lead = '<p>Start with the free lessons on this site. The workbook starts at A2, so it is the step after them: a 30-day A2 plan, one 15 to 20 minute task a day, with exercises and answers.</p>';
    } else if (v === 'advanced') {
      h = zh ? '你的结果是 ' + L + '。用 C1 练习包修正最后的 5%。' : 'Your result: ' + L + '. Fix the last 5%.';
      lead = '<p>At this level the errors that remain are small and repeated. The C1 pack (inversion, past deduction modals, advanced passive, nominalisation, collocations, formal register for IELTS Writing Task 2) and the 60 common mistakes are a fast check, with a 30-day C1 plan.</p>';
    } else {
      h = zh ? '你的结果是 ' + L + '。下一步，按 30 天计划学习。' : 'Your result: ' + L + '. Your ' + P + ' gaps + a 30-day plan.';
      lead = '<p>The workbook has a 30-day ' + P + ' plan. Each day is one task of 15 to 20 minutes. Every point above has a short rule and exercises with answers.</p>';
    }
    var what = zh
      ? '<p>You also get all four level packs (A2 to C1, 240 exercises) and 60 common mistakes with notes in Chinese. PDF and phone reader.</p>'
      : '<p>All four level packs (A2 to C1, 240 exercises with answers) and 60 common mistakes. Rules are in English; the mistakes part adds notes in Simplified Chinese. PDF and phone reader.</p>';
    var onBuy = "window.elTrack&&(window.elTrack('cta_click',{cta_id:'buy_" + src + "',cta:'fye',src:'" + src + "',level:'" + L + "',variant:'" + v + "'}),window.elTrack('mm_cta_click',{sku:'fye-v1',placement:'" + src + "',value:" + PRICE + ",currency:'USD'}))";
    var onSample = "window.elTrack&&(window.elTrack('cta_click',{cta_id:'fye_sample_" + src + "',src:'" + src + "',level:'" + L + "'}),window.elTrack('mm_cta_click',{sku:'fye-v1',placement:'" + src + "-sample'}))";
    /* The payment note stays honest (no Alipay or WeChat Pay yet) but sits in a closed details box, off the first screen of the card. */
    var pay = '<details class="fye-paybox" data-cro="fye-pay-note"><summary>Payment methods and refund <span lang="zh-Hans">付款方式与退款</span></summary>'
      + (zh ? '<p class="fye-pay" lang="zh-Hans">可用开通了境外网上支付的银联、Visa 或 Mastercard 卡，也可用 Apple Pay 或 Google Pay。暂不支持支付宝和微信支付。7 天内发邮件至 support@zovo.one 可全额退款。</p>' : '')
      + '<p class="fye-pay">UnionPay, Visa, Mastercard, Apple Pay or Google Pay. Alipay and WeChat Pay are not available. One payment. If it does not help you, email <a href="mailto:support@zovo.one">support@zovo.one</a> within 7 days for a full refund.</p>'
      + '</details>';
    return '<aside class="fye fye-result fye-cn fye-' + v + '" aria-labelledby="fye-cta-h" data-fye="level-result" data-cro="fye-level-offer-all" data-level="' + L + '" data-variant="' + v + '">'
      + '<p class="fye-kicker">Fix Your English' + (zh ? ' <span lang="zh-Hans">英语纠错练习册</span>' : ' workbook') + '</p>'
      + '<h3 id="fye-cta-h"' + (zh ? ' lang="zh-Hans"' : '') + '>' + h + '</h3>'
      + free + lead + what
      + '<div class="fye-actions"><a id="cta-buy_' + src + '" class="btn btn-primary" data-cro="fye-level-buy" href="' + SHOP + src + '" onclick="' + onBuy + '">Get the workbook · US$6.99</a>'
      + '<a id="cta-fye_sample_' + src + '" class="fye-more" href="' + SAMPLE + '" onclick="' + onSample + '">Free sample (PDF)' + (zh ? ' <span class="fye-zhs" lang="zh-Hans">免费样章</span>' : '') + '</a></div>'
      + pay
      + '</aside>';
  }

  /* offer_view fires once, only after a real interaction: the visitor answered the whole test (the card exists only then)
     AND half of the card is on screen. GA4 consent and the hostname allowlist are handled inside elTrack / site.js. */
  function wire(container, level, e) {
    var el = container && container.querySelector('[data-fye="level-result"]');
    if (!el) { return false; }
    e = e || env();
    var src = 'level-result-' + (isChinese(e) ? 'zh' : 'en');
    var sent = false, p = { level: level >= 0 ? LEVELS[level] : 'below A1', lang: lang(e), sku: 'fye-v1', placement: src, variant: variant(level), interaction: 'test_complete',
      currency: 'USD', value: PRICE, items: [{ item_id: 'fye-v1', item_name: 'Fix Your English workbook', price: PRICE, quantity: 1 }] };
    function fire() {
      if (sent) { return; }
      sent = true;
      track('offer_view', p);
      track('mm_cta_view', { sku: 'fye-v1', placement: src });
    }
    if (root.IntersectionObserver) {
      var io = new root.IntersectionObserver(function (es) {
        for (var i = 0; i < es.length; i++) { if (es[i].isIntersecting) { io.disconnect(); fire(); return; } }
      }, { threshold: 0.5 });
      io.observe(el);
    } else { fire(); }
    return true;
  }

  root.elFyeOffer = { UNITS: UNITS, QMAP: QMAP, LESSON: LESSON, isChinese: isChinese, gaps: gaps, showFor: showFor, planLevel: planLevel, card: card, wire: wire };
})(typeof window !== 'undefined' ? window : globalThis);
