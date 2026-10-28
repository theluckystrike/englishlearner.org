/* Code is exempt from prose checks.
```javascript
*/
/* Enhance the retained written quiz without changing its questions or answer key. */
(function () {
  'use strict';
  var page = document.querySelector('main[data-lesson]');
  if (!page) return;
  var lesson = page.dataset.lesson;
  var catalog = ['articles-a-an-the', 'prepositions-in-on-at', 'present-perfect-vs-past-simple', 'countable-uncountable-nouns', 'conditionals', 'cefr-levels', 'past-perfect', 'modal-verbs', 'gerunds-and-infinitives', 'passive-voice', 'common-mistakes-chinese-speakers', 'present-simple-vs-present-continuous', 'comparatives-and-superlatives'];
  if (catalog.indexOf(lesson) < 0) return;
  function track(name, params) {
    try { if (typeof window.elTrack === 'function') window.elTrack(name, params); } catch (e) { /* Learning works without analytics. */ }
  }
  page.querySelectorAll('[data-lesson-next]').forEach(function (link) {
    link.addEventListener('click', function () {
      var next = link.dataset.lessonNext;
      if (catalog.indexOf(next) >= 0) track('lesson_next_click', {from: lesson, to: next});
    });
  });
  page.querySelectorAll('[data-lesson-practice]').forEach(function (link) {
    link.addEventListener('click', function () { track('cta_click', {cta_id: 'lesson_' + lesson + '_practice'}); });
  });
  var contents = page.querySelector('.contents');
  var rail = window.matchMedia('(min-width: 1280px)');
  function resizeContents() { if (contents) contents.open = rail.matches; }
  resizeContents();
  if (rail.addEventListener) rail.addEventListener('change', resizeContents);
  else rail.addListener(resizeContents);
  function element(tag, text, className) {
    var node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function button(text, action, className) {
    var node = element('button', text, className || 'btn');
    node.type = 'button'; node.addEventListener('click', action); return node;
  }
  function reportLink(item) {
    var link = element('a', 'Report a mistake');
    var body = 'Page https://englishlearner.org/lessons/' + lesson + '/\nQuestion ' + (item + 1) + '\nSuggested correction ';
    link.href = 'mailto:support@zovo.one?subject=' + encodeURIComponent('englishlearner.org lesson correction') + '&body=' + encodeURIComponent(body);
    return link;
  }
  var widget = page.querySelector('[data-lesson-quiz]');
  if (!widget) return;
  var questions = Array.from(page.querySelectorAll('.written-quiz > li'));
  var keys = Array.from(page.querySelectorAll('.lesson-answers ol > li'));
  if (!questions.length || keys.length !== questions.length) return;
  var items = questions.map(function (node, i) {
    return {prompt: node.textContent.trim(), answers: JSON.parse(node.dataset.answers), explanation: keys[i].textContent.trim()};
  });
  var controls = widget.querySelector('.lesson-quiz-controls');
  var start = widget.querySelector('[data-quiz-start]');
  var task = widget.querySelector('[data-quiz-task]');
  var result = widget.querySelector('[data-quiz-result]');
  var typing = element('p', '', 'typing-status');
  typing.hidden = true; typing.setAttribute('role', 'status'); page.append(typing);
  var index = 0, records = [], complete = false, checked = false;
  var fields = [], form, status, feedback, check, next, progressText;
  controls.hidden = false;
  function normalize(value) {
    return value.trim().toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' ');
  }
  function focus(node) { node.focus(); }
  function resetResult() {
    result.classList.remove('is-complete'); result.replaceChildren();
    var title = element('h3', 'Your result'); title.id = 'quiz-result-title'; title.tabIndex = -1;
    result.append(title, element('p', 'Your result appears here when you finish.'));
  }
  function begin() {
    index = 0; records = []; complete = false; start.hidden = true; task.hidden = false;
    resetResult(); render();
  }
  start.addEventListener('click', begin);
  function render() {
    checked = false; fields = []; task.replaceChildren();
    var item = items[index];
    progressText = element('p', 'Question ' + (index + 1) + ' of ' + items.length, 'meta');
    var bar = element('progress', '', 'progress'); bar.max = items.length; bar.value = records.length;
    bar.setAttribute('aria-label', 'Questions answered');
    var heading = element('h4', 'Question ' + (index + 1)); heading.tabIndex = -1;
    form = element('form'); form.noValidate = true;
    var group = element('fieldset'); group.append(element('legend', item.prompt));
    var choices = lesson === 'countable-uncountable-nouns' || widget.hasAttribute('data-quiz-choice') ? item.prompt.match(/\(([^)]+)\)/) : null;
    if (choices) {
      var options = element('div', undefined, 'quiz-options');
      choices[1].split(' / ').forEach(function (choice, optionIndex) {
        var label = element('label', undefined, 'quiz-option');
        var radio = element('input'); radio.type = 'radio'; radio.name = 'quiz-answer'; radio.value = choice;
        radio.id = 'quiz-option-' + optionIndex;
        radio.addEventListener('change', function () {
          options.querySelectorAll('label').forEach(function (row) { row.classList.toggle('is-selected', row.querySelector('input').checked); });
        });
        label.append(radio, element('span', choice)); options.append(label); fields.push(radio);
      });
      group.append(options);
    } else {
      item.answers.forEach(function (_, gapIndex) {
        var field = element('div', undefined, 'field');
        var id = 'quiz-answer-' + gapIndex;
        var label = element('label', item.answers.length > 1 ? 'Gap ' + (gapIndex + 1) : 'Your answer'); label.htmlFor = id;
        var input;
        if (lesson === 'articles-a-an-the' || lesson === 'prepositions-in-on-at') {
          input = element('select');
          var choicesList = lesson === 'articles-a-an-the' ? ['a', 'an', 'the', 'no article'] : ['in', 'on', 'at', 'nothing'];
          var empty = element('option', 'Choose an answer'); empty.value = ''; input.append(empty);
          choicesList.forEach(function (value) { var option = element('option', value); option.value = value; input.append(option); });
        } else {
          input = element('input'); input.type = 'text'; input.autocomplete = 'off'; input.spellcheck = false;
        }
        input.id = id; input.name = 'gap-' + gapIndex; input.setAttribute('aria-describedby', 'quiz-field-error');
        field.append(label, input); group.append(field); fields.push(input);
      });
    }
    var error = element('p', '', 'field-error'); error.id = 'quiz-field-error'; error.setAttribute('role', 'alert');
    status = element('p', '', 'status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    feedback = element('div', undefined, 'feedback'); feedback.hidden = true;
    check = element('button', 'Check answer', 'btn btn-primary'); check.type = 'submit';
    next = button('Next question', function () { if (!checked || complete) return; index += 1; render(); }, 'btn btn-primary'); next.hidden = true;
    var actions = element('div', undefined, 'actions'); actions.append(check, next);
    form.append(group, error, status, feedback, actions);
    form.addEventListener('submit', function (event) { event.preventDefault(); submit(error); });
    task.append(progressText, bar, heading, form);
    focus(heading);
  }
  function submit(error) {
    if (checked || complete) return;
    var radioMode = fields[0].type === 'radio';
    var selected = radioMode ? fields.find(function (field) { return field.checked; }) : null;
    var missing = radioMode ? !selected : fields.some(function (field) { return !field.value.trim(); });
    if (missing) {
      error.textContent = radioMode || fields[0].tagName === 'SELECT' ? 'Choose an answer.' : 'Enter an answer.';
      fields.forEach(function (field) { field.setAttribute('aria-invalid', 'true'); });
      focus(radioMode ? fields[0] : fields.find(function (field) { return !field.value.trim(); })); return;
    }
    fields.forEach(function (field) { field.removeAttribute('aria-invalid'); }); error.textContent = '';
    var values = radioMode ? [selected.value] : fields.map(function (field) { return field.value; });
    var item = items[index];
    var correct = item.answers.every(function (accepted, i) { return accepted.some(function (answer) { return normalize(answer) === normalize(values[i]); }); });
    checked = true; records.push(correct);
    fields.forEach(function (field) {
      if (field.type === 'text') field.readOnly = true; else field.disabled = true;
      if (!radioMode) field.parentElement.classList.add(correct ? 'is-correct' : 'is-wrong');
    });
    if (radioMode) {
      selected.parentElement.classList.add(correct ? 'is-correct' : 'is-wrong');
      selected.parentElement.append(element('span', correct ? 'Correct' : 'Incorrect'));
    }
    if (document.activeElement && document.activeElement.tagName === 'INPUT') document.activeElement.blur();
    status.textContent = correct ? 'Correct' : 'Incorrect. Read the answer below.'; status.tabIndex = -1;
    feedback.hidden = false; feedback.classList.add(correct ? 'is-correct' : 'is-wrong');
    feedback.append(element('p', item.explanation));
    var links = element('div', undefined, 'link-row'); links.append(reportLink(index)); feedback.append(links);
    check.hidden = true; next.hidden = index === items.length - 1;
    task.querySelector('progress').value = records.length;
    if (records.length === items.length) finish(); else focus(status);
    updateTyping();
  }
  function finish() {
    if (complete) return;
    complete = true;
    var score = records.filter(Boolean).length;
    track('quiz_complete', {lesson: lesson, score: score, total: items.length});
    result.replaceChildren(); result.classList.add('is-complete');
    var title = element('h3', 'Your result'); title.id = 'quiz-result-title'; title.tabIndex = -1;
    var value = element('p', String(score), 'result-value'); value.append(element('small', 'out of ' + items.length));
    result.append(title, value, element('p', 'Correct answers in this lesson quiz. This isn’t a level test.'));
    var links = element('div', undefined, 'link-row');
    var read = element('a', 'Read the rules again'); read.href = '#rules'; links.append(read);
    result.append(links);
    var missed = records.map(function (correct, i) { return correct ? -1 : i; }).filter(function (i) { return i >= 0; });
    if (missed.length) {
      var review = element('details', undefined, 'quiz-review'); review.append(element('summary', 'Review ' + missed.length + ' missed answers'));
      var list = element('ol');
      missed.forEach(function (i) { var li = element('li'); li.value = i + 1; li.append(element('p', items[i].prompt), element('p', items[i].explanation)); list.append(li); });
      review.append(list); result.append(review);
    } else result.append(element('p', 'You answered every question correctly.'));
    var actions = element('div', undefined, 'actions');
    actions.append(button('Try the quiz again', begin));
    var copy = button('Copy my result', function () {
      var summary = score + ' out of ' + items.length + '. Lesson quiz only. This isn’t a level test. https://englishlearner.org/lessons/' + lesson + '/';
      function fallback() {
        var message = element('p', 'Select the text to copy it.', 'helper');
        var text = element('textarea', undefined, 'result-copy'); text.readOnly = true; text.value = summary; text.setAttribute('aria-label', 'Result to copy');
        result.append(message, text); text.focus(); text.select(); copy.disabled = true;
      }
      if (!navigator.clipboard || !navigator.clipboard.writeText) { fallback(); return; }
      navigator.clipboard.writeText(summary).then(function () { copy.textContent = 'Result copied'; }, fallback);
    });
    actions.append(copy); result.append(actions); focus(title);
  }
  function updateTyping() {
    var active = document.activeElement;
    var inputFocused = active && task.contains(active) && active.matches('input[type="text"]');
    var viewport = window.visualViewport;
    var hiddenFeedback = status && (status.getBoundingClientRect().top < (viewport ? viewport.offsetTop : 0) || status.getBoundingClientRect().bottom > (viewport ? viewport.offsetTop + viewport.height : window.innerHeight));
    typing.hidden = !inputFocused || !hiddenFeedback;
    if (!typing.hidden) {
      typing.textContent = checked ? (records[index] ? 'Correct' : 'Read the correction') : 'Question ' + (index + 1) + ' of ' + items.length + '. Answer not checked.';
      typing.style.top = (viewport ? viewport.offsetTop : 0) + 'px';
    }
  }
  task.addEventListener('focusin', updateTyping); task.addEventListener('focusout', function () { setTimeout(updateTyping, 0); });
  window.addEventListener('scroll', updateTyping, {passive: true});
  if (window.visualViewport) { window.visualViewport.addEventListener('resize', updateTyping); window.visualViewport.addEventListener('scroll', updateTyping); }
})();

/*
```
*/
