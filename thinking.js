/* ═══════════════════════════════════════════════════════════════════════════
   js/thinking.js  —  ArturitAI Thinking Panel
   Provides: beginThink · addStep · updateStep · finishThk
   Consumed by: engine.js, qa.js, main.js
   ═══════════════════════════════════════════════════════════════════════════ */

/* global beginThink, addStep, updateStep, finishThk */

(function () {
  'use strict';

  var _panel  = null;
  var _body   = null;
  var _label  = null;
  var _stepN  = 0;

  /* ── Status → CSS class map ── */
  var STATUS_CLS = {
    active:  'thk-active',
    done:    'thk-done',
    error:   'thk-error',
    warn:    'thk-warn',
    debug:   'thk-debug',
  };

  /* ── Resolve DOM refs lazily ── */
  function _init() {
    if (_panel) return;
    _panel = document.getElementById('thkPanel');
    _body  = document.getElementById('thkBody');
    _label = document.getElementById('thkLabel');
  }

  /* ── Safely escape HTML ── */
  function _esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ─────────────────────────────────────────────────────────────────────────
     beginThink(label)
     Opens the thinking panel and resets step counter.
  ───────────────────────────────────────────────────────────────────────── */
  window.beginThink = function (label) {
    _init();
    _stepN = 0;
    if (_label)  _label.textContent = label || 'Thinking…';
    if (_body)   _body.innerHTML    = '';
    if (_panel)  _panel.classList.add('open');
    console.log('[thinking] beginThink:', label);
  };

  /* ─────────────────────────────────────────────────────────────────────────
     addStep(title, icon, detail, status, code?)
     Appends a numbered step card to the panel.
     Returns the card element (for updateStep).
  ───────────────────────────────────────────────────────────────────────── */
  window.addStep = function (title, icon, detail, status, code) {
    _init();
    if (!_body) return null;

    _stepN++;
    var cls = STATUS_CLS[status] || STATUS_CLS.active;

    var card = document.createElement('div');
    card.className = 'thk-step ' + cls;
    card.dataset.stepN = _stepN;

    /* Format detail: preserve newlines */
    var detailHTML = detail
      ? '<div class="thk-detail">' + _esc(detail).replace(/\n/g, '<br>') + '</div>'
      : '';

    var codeHTML = code
      ? '<pre class="thk-code">' + _esc(code) + '</pre>'
      : '';

    card.innerHTML =
      '<div class="thk-step-header">' +
        '<span class="thk-step-icon">' + (icon || '·') + '</span>' +
        '<span class="thk-step-num">' + _stepN + '</span>' +
        '<span class="thk-step-title">' + _esc(title) + '</span>' +
        '<span class="thk-step-status"></span>' +
      '</div>' +
      detailHTML + codeHTML;

    _body.appendChild(card);
    _body.scrollTop = _body.scrollHeight;

    return card;
  };

  /* ─────────────────────────────────────────────────────────────────────────
     updateStep(card, status, newDetail?)
     Updates an existing step card's status and optionally its detail text.
  ───────────────────────────────────────────────────────────────────────── */
  window.updateStep = function (card, status, newDetail) {
    if (!card) return;

    /* Remove all status classes, add new one */
    Object.values(STATUS_CLS).forEach(function (c) { card.classList.remove(c); });
    card.classList.add(STATUS_CLS[status] || STATUS_CLS.done);

    /* Update detail if provided */
    if (newDetail !== undefined && newDetail !== null && newDetail !== '') {
      var existing = card.querySelector('.thk-detail');
      if (existing) {
        existing.innerHTML = _esc(newDetail).replace(/\n/g, '<br>');
      } else {
        var d = document.createElement('div');
        d.className = 'thk-detail';
        d.innerHTML = _esc(newDetail).replace(/\n/g, '<br>');
        card.appendChild(d);
      }
    }

    if (_body) _body.scrollTop = _body.scrollHeight;
  };

  /* ─────────────────────────────────────────────────────────────────────────
     finishThk()
     Marks all active steps as done and collapses after a short delay.
  ───────────────────────────────────────────────────────────────────────── */
  window.finishThk = function () {
    _init();
    if (!_body) return;

    /* Finalize any steps still showing as active */
    _body.querySelectorAll('.thk-active').forEach(function (el) {
      el.classList.remove('thk-active');
      el.classList.add('thk-done');
    });

    if (_label) _label.textContent = 'Done ✓';
    console.log('[thinking] finishThk — ' + _stepN + ' steps');
  };

  /* ─────────────────────────────────────────────────────────────────────────
     closeThinkPanel() / toggleThinkPanel()
     Called by header button.
  ───────────────────────────────────────────────────────────────────────── */
  window.closeThinkPanel = function () {
    _init();
    if (_panel) _panel.classList.remove('open');
  };

  window.toggleThinkPanel = function () {
    _init();
    if (!_panel) return;
    if (_panel.classList.contains('open')) {
      _panel.classList.remove('open');
    } else {
      _panel.classList.add('open');
    }
  };

  /* ── Inject thinking-panel CSS that was previously inline ── */
  (function _injectStyles() {
    if (document.getElementById('_thk_styles')) return;
    var s = document.createElement('style');
    s.id = '_thk_styles';
    s.textContent = [
      '#thkPanel{position:fixed;top:0;right:0;bottom:0;width:340px;z-index:200;',
      '  background:var(--glass2);border-left:1px solid var(--b3);',
      '  backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);',
      '  display:flex;flex-direction:column;',
      '  transform:translateX(100%);transition:transform .3s cubic-bezier(.4,0,.2,1);',
      '  box-shadow:var(--sh3);}',
      '#thkPanel.open{transform:translateX(0);}',
      '#thkHeader{height:46px;flex-shrink:0;display:flex;align-items:center;',
      '  gap:8px;padding:0 14px;border-bottom:1px solid var(--b2);}',
      '#thkLabel{flex:1;font-size:12px;font-weight:700;',
      '  background:linear-gradient(90deg,var(--cyan),var(--violet));',
      '  -webkit-background-clip:text;background-clip:text;color:transparent;}',
      '#thkClose{color:var(--t3);font-size:14px;background:none;border:none;cursor:pointer;}',
      '#thkBody{flex:1;overflow-y:auto;padding:10px 12px;}',
      '.thk-step{border-radius:10px;margin-bottom:7px;overflow:hidden;',
      '  border:1px solid var(--b2);background:var(--bg2);transition:border-color .2s;}',
      '.thk-step-header{display:flex;align-items:center;gap:7px;',
      '  padding:8px 10px;cursor:pointer;}',
      '.thk-step-icon{font-size:16px;flex-shrink:0;}',
      '.thk-step-num{font-size:9px;font-weight:800;color:var(--t3);',
      '  min-width:16px;text-align:center;}',
      '.thk-step-title{flex:1;font-size:11px;font-weight:600;color:var(--t1);}',
      '.thk-step-status{font-size:9px;flex-shrink:0;}',
      '.thk-detail{padding:0 10px 8px;font-size:10px;line-height:1.6;',
      '  color:var(--t3);border-top:1px solid var(--b1);padding-top:6px;}',
      '.thk-code{padding:6px 10px;font-family:"JetBrains Mono",monospace;',
      '  font-size:9.5px;line-height:1.5;color:var(--t2);',
      '  border-top:1px solid var(--b1);margin:0;overflow-x:auto;}',
      '.thk-active{border-color:rgba(var(--acR),var(--acG),var(--acB),.4);}',
      '.thk-active .thk-step-status::after{content:"●";color:var(--amber);}',
      '.thk-done{border-color:rgba(16,185,129,.25);}',
      '.thk-done .thk-step-status::after{content:"✓";color:var(--emerald);}',
      '.thk-error{border-color:rgba(244,63,94,.3);}',
      '.thk-error .thk-step-status::after{content:"✗";color:var(--rose);}',
      '.thk-warn{border-color:rgba(245,158,11,.3);}',
      '.thk-warn .thk-step-status::after{content:"⚠";color:var(--amber);}',
      '.thk-debug{border-color:rgba(99,102,241,.35);}',
      '.thk-debug .thk-step-status::after{content:"↻";color:var(--indigo);}',
      '@media(max-width:640px){',
      '  #thkPanel{width:100%;top:auto;height:55vh;border-top:1px solid var(--b3);',
      '    border-left:none;transform:translateY(100%);}',
      '  #thkPanel.open{transform:translateY(0);}',
      '}',
    ].join('\n');
    document.head.appendChild(s);
  })();

  console.log('[thinking.js] Thinking panel module loaded ✓');
})();
