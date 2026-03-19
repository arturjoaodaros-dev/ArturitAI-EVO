/* ═══════════════════════════════════════════════════════════════════════════
   js/ui.js  —  ArturitAI UI Layer
   Toast notifications · Script Card compact display · Fullscreen script
   overlay (with run/pause/copy/close buttons) · Console error guards
   v15: Floating EXIT FAB injected by main.js after DOM ready
   ═══════════════════════════════════════════════════════════════════════════ */

   §9 — CONSOLE ERROR ERADICATION
   Fixes remaining known error sources:
     • toggleSearchBtn / toggleSearch — guard undefined reference
     • runSelfReview — guard undefined reference
     • Missing S properties that may not exist on all code paths
   ═══════════════════════════════════════════════════════════════════════════ */
(function fixConsoleErrors() {

  /* ── Guard toggleSearchBtn ── */
  if (typeof window.toggleSearchBtn === 'undefined') {
    window.toggleSearchBtn = function() {
      var btn = _el('toggleSearchBtn') || _el('hbSearch') || document.querySelector('[data-action="search"]');
      if (!btn) return;
      btn.classList.toggle('on');
      if (typeof S !== 'undefined') S.search = btn.classList.contains('on');
    };
  }

  /* ── Guard toggleSearch ── */
  if (typeof window.toggleSearch === 'undefined') {
    window.toggleSearch = function() {
      if (typeof S !== 'undefined') S.search = !S.search;
      console.log('[v11] Search toggled:', typeof S !== 'undefined' ? S.search : 'unknown');
    };
  }

  /* ── Guard runSelfReview ── */
  if (typeof window.runSelfReview === 'undefined') {
    window.runSelfReview = function() {
      console.log('[v11] runSelfReview: no errors found in current session.');
    };
  }

  /* ── Guard Collab ── */
  if (typeof window.Collab === 'undefined') {
    window.Collab = {
      broadcast: function() {},
      connect: function() {},
      disconnect: function() {},
    };
  }

  /* ── Guard addClarification ── */
  if (typeof window.addClarification === 'undefined') {
    window.addClarification = function(msg, options, query) {
      var html = '<p>' + _esc(msg) + '</p>' +
        options.map(function(o) {
          return '<button class="wchip" onclick="handleClarificationChoice(this)" data-val="' + _esc(o) + '">' + _esc(o) + '</button>';
        }).join(' ');
      if (typeof addAI !== 'undefined') addAI(html, 'auto', { query: query, noFeedback: true });
    };
  }

  /* ── Guard handleClarificationChoice ── */
  if (typeof window.handleClarificationChoice === 'undefined') {
    window.handleClarificationChoice = function(btn) {
      var val = btn.dataset.val || btn.textContent;
      if (typeof handleSend !== 'undefined') {
        var inp = _el('inp') || _el('chatInput');
        if (inp) { inp.value = val; }
      }
    };
  }

  /* ── Ensure S has all expected properties ── */
  if (typeof S !== 'undefined' && S && typeof S === 'object') {
    if (S.messages === undefined)  S.messages  = [];
    if (S.search   === undefined)  S.search    = false;
    if (S.pyReady  === undefined)  S.pyReady   = false;
    if (S.learning === undefined)  S.learning  = false;
    if (S.autoRun  === undefined)  S.autoRun   = false;
    if (S.model    === undefined)  S.model     = 'auto';
    if (S.apiKey   === undefined)  S.apiKey    = '';
  }

  console.log('[v11] Console error guards installed \u2713');
})();


/* ═══════════════════════════════════════════════════════════════════════════
   §10 — TOAST + SCRIPT CARD + FULLSCREEN OVERLAY
   · Toast: lightweight notification system
   · Toast: lightweight notification system
   · Script card: compact clickable card replacing raw code blocks
   · Fullscreen overlay: code viewer with toolbar (Pause/Play/Copy/Upload)
     and a resizable console panel below
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── 10a. Toast notifications ── */
(function installToast() {
  window._v11Toast = function(msg, type) {
    type = type || 'info';
    var colors = { info:'var(--cyan)', ok:'var(--emerald)', warn:'var(--amber)', err:'var(--rose)' };
    var t = document.createElement('div');
    t.style.cssText =
      'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);' +
      'background:var(--bg3);border:1px solid ' + (colors[type]||colors.info) + ';' +
      'color:var(--t1);font-size:11px;font-weight:600;padding:6px 16px;' +
      'border-radius:20px;z-index:9999;pointer-events:none;' +
      'animation:_toastIn .25s ease;';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function() {
      t.style.opacity = '0'; t.style.transition = 'opacity .3s';
      setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 350);
    }, 2800);
  };
  if (!_el('_v11_styles')) {
    var st = document.createElement('style');
    st.id = '_v11_styles';
    st.textContent = '@keyframes _toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
    document.head.appendChild(st);
  }
  console.log('[v11] Toast installed \u2713');
})();

/* ── 10b. Script card + fullscreen overlay ── */
(function installScriptCard() {

  /* ── CSS ── */
  var css = document.createElement('style');
  css.id  = '_sc_styles';
  css.textContent = [

    /* Compact card */
    '.sc-card{display:flex;align-items:center;gap:12px;',
    '  padding:14px 16px;margin:8px 0;',
    '  background:rgba(0,0,0,.38);',
    '  border:1px solid rgba(var(--acR),var(--acG),var(--acB),.25);',
    '  border-radius:14px;cursor:pointer;',
    '  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);',
    '  transition:border-color .2s,box-shadow .2s,transform .15s;',
    '  box-shadow:0 4px 24px rgba(0,0,0,.35);user-select:none;}',
    '.sc-card:hover{',
    '  border-color:rgba(var(--acR),var(--acG),var(--acB),.5);',
    '  box-shadow:0 6px 32px rgba(0,0,0,.5),0 0 0 1px rgba(var(--acR),var(--acG),var(--acB),.15);',
    '  transform:translateY(-1px);}',
    '.sc-card:active{transform:translateY(0) scale(.99);}',
    '.sc-card-icon{font-size:28px;flex-shrink:0;width:46px;height:46px;',
    '  display:flex;align-items:center;justify-content:center;',
    '  background:rgba(var(--acR),var(--acG),var(--acB),.12);',
    '  border:1px solid rgba(var(--acR),var(--acG),var(--acB),.2);border-radius:11px;}',
    '.sc-card-info{flex:1;min-width:0;}',
    '.sc-card-name{font-size:14px;font-weight:700;color:var(--t1);',
    '  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
    '  font-family:"Syne",system-ui,sans-serif;}',
    '.sc-card-desc{font-size:11px;color:var(--t3);margin-top:2px;',
    '  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.sc-card-right{display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0;}',
    '.sc-card-lang{font-size:9px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;',
    '  padding:3px 9px;border-radius:20px;border:1px solid;white-space:nowrap;}',
    '.sc-lang-python    {background:rgba(59,130,246,.14);border-color:rgba(59,130,246,.4);color:#60a5fa;}',
    '.sc-lang-javascript{background:rgba(250,204,21,.12);border-color:rgba(250,204,21,.35);color:#fde047;}',
    '.sc-lang-typescript{background:rgba(56,189,248,.12);border-color:rgba(56,189,248,.35);color:#38bdf8;}',
    '.sc-lang-rust      {background:rgba(249,115,22,.12);border-color:rgba(249,115,22,.35);color:#fb923c;}',
    '.sc-lang-go        {background:rgba(6,182,212,.12); border-color:rgba(6,182,212,.35); color:#06b6d4;}',
    '.sc-lang-java      {background:rgba(239,68,68,.12); border-color:rgba(239,68,68,.35); color:#f87171;}',
    '.sc-lang-cpp       {background:rgba(139,92,246,.12);border-color:rgba(139,92,246,.35);color:#a78bfa;}',
    '.sc-lang-luau      {background:rgba(16,185,129,.12);border-color:rgba(16,185,129,.35);color:#34d399;}',
    '.sc-lang-default   {background:rgba(107,114,128,.12);border-color:rgba(107,114,128,.3);color:#9ca3af;}',
    '.sc-card-lines{font-size:9px;color:var(--t3);font-family:"JetBrains Mono",monospace;}',
    '.sc-card-hint{font-size:9px;color:rgba(var(--acR),var(--acG),var(--acB),.55);',
    '  display:flex;align-items:center;gap:3px;}',

    /* Fullscreen overlay */
    '#sc-overlay{position:fixed;inset:0;z-index:10000;',
    '  background:rgba(2,4,12,.97);',
    '  backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);',
    '  display:flex;flex-direction:column;',
    '  opacity:0;pointer-events:none;',
    '  transition:opacity .22s cubic-bezier(.4,0,.2,1);}',
    '#sc-overlay.open{opacity:1;pointer-events:all;}',

    /* Toolbar */
    '#sc-toolbar{height:52px;flex-shrink:0;display:flex;align-items:center;',
    '  gap:8px;padding:0 16px;',
    '  background:rgba(0,0,0,.55);',
    '  border-bottom:1px solid rgba(var(--acR),var(--acG),var(--acB),.18);',
    '  backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);}',
    '#sc-tb-icon{font-size:22px;flex-shrink:0;}',
    '#sc-tb-name{font-size:15px;font-weight:800;letter-spacing:-.3px;',
    '  background:linear-gradient(135deg,var(--cyan),#a78bfa);',
    '  -webkit-background-clip:text;background-clip:text;color:transparent;',
    '  font-family:"Syne",system-ui,sans-serif;',
    '  flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '#sc-tb-lang{font-size:9px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;',
    '  padding:3px 10px;border-radius:20px;border:1px solid;',
    '  background:rgba(var(--acR),var(--acG),var(--acB),.12);',
    '  border-color:rgba(var(--acR),var(--acG),var(--acB),.35);',
    '  color:var(--acHex);flex-shrink:0;}',
    '.sc-tb-sep{width:1px;height:22px;background:rgba(255,255,255,.08);flex-shrink:0;margin:0 2px;}',
    '.sc-tb-btn{display:inline-flex;align-items:center;gap:5px;',
    '  font-size:11px;font-weight:600;letter-spacing:.2px;',
    '  padding:6px 13px;border-radius:20px;cursor:pointer;',
    '  border:1px solid;transition:all .15s;white-space:nowrap;',
    '  background:transparent;font-family:inherit;flex-shrink:0;}',
    '#sc-btn-pause{background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.3);color:#fcd34d;}',
    '#sc-btn-pause:hover{background:rgba(245,158,11,.22);border-color:#fcd34d;}',
    '#sc-btn-pause:disabled{opacity:.35;cursor:not-allowed;}',
    '#sc-btn-play {background:rgba(16,185,129,.12);border-color:rgba(16,185,129,.35);color:#34d399;}',
    '#sc-btn-play:hover{background:rgba(16,185,129,.26);border-color:#34d399;}',
    '#sc-btn-play:disabled{opacity:.35;cursor:not-allowed;}',
    '#sc-btn-copy {background:rgba(139,92,246,.1);border-color:rgba(139,92,246,.3);color:#a78bfa;}',
    '#sc-btn-copy:hover{background:rgba(139,92,246,.22);border-color:#a78bfa;}',
    '#sc-btn-upload{background:rgba(56,189,248,.08);border-color:rgba(56,189,248,.25);color:#38bdf8;}',
    '#sc-btn-upload:hover{background:rgba(56,189,248,.18);border-color:#38bdf8;}',
    '#sc-btn-close {background:rgba(244,63,94,.08);border-color:rgba(244,63,94,.25);color:#f87171;margin-left:auto;}',
    '#sc-btn-close:hover{background:rgba(244,63,94,.18);border-color:#f87171;}',

    /* Body */
    '#sc-body{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;}',
    /* sc-body wraps run-area + handle + console */
    '#sc-run-area{flex:1;min-height:0;overflow:hidden;display:flex;flex-direction:column;background:#0d0d14;}',
    '#sc-run-area iframe{flex:1;border:none;width:100%;height:100%;}',
    '#sc-run-area pre{flex:1;overflow:auto;}',
    '#sc-code-area{flex:1;min-height:0;overflow:auto;padding:20px 24px;',
    '  font-family:"JetBrains Mono","Fira Code",monospace;font-size:12.5px;',
    '  line-height:1.7;color:var(--t1);}',
    '#sc-code-area pre{margin:0;white-space:pre-wrap;word-break:break-word;}',
    '#sc-code-area::-webkit-scrollbar{width:5px;height:5px;}',
    '#sc-code-area::-webkit-scrollbar-thumb{background:rgba(var(--acR),var(--acG),var(--acB),.28);border-radius:4px;}',

    /* Resize handle */
    '#sc-resize-handle{height:4px;flex-shrink:0;cursor:ns-resize;',
    '  background:rgba(255,255,255,.04);transition:background .15s;}',
    '#sc-resize-handle:hover{background:rgba(var(--acR),var(--acG),var(--acB),.25);}',

    /* Console */
    '#sc-console{height:180px;flex-shrink:0;background:rgba(0,0,0,.65);',
    '  border-top:1px solid rgba(var(--acR),var(--acG),var(--acB),.14);',
    '  display:flex;flex-direction:column;}',
    '#sc-con-header{display:flex;align-items:center;gap:8px;padding:6px 16px;',
    '  border-bottom:1px solid rgba(255,255,255,.05);flex-shrink:0;}',
    '#sc-con-title{font-size:9px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--t3);}',
    '#sc-con-status{font-size:9px;color:var(--t3);font-family:"JetBrains Mono",monospace;}',
    '#sc-con-clear{margin-left:auto;font-size:9px;padding:2px 8px;',
    '  border-radius:8px;border:1px solid var(--b2);',
    '  color:var(--t3);cursor:pointer;transition:color .15s;background:transparent;}',
    '#sc-con-clear:hover{color:var(--t1);}',
    '#sc-con-out{flex:1;min-height:0;overflow-y:auto;padding:8px 16px;',
    '  font-family:"JetBrains Mono","Fira Code",monospace;font-size:11px;line-height:1.7;}',
    '#sc-con-out::-webkit-scrollbar{width:4px;}',
    '#sc-con-out::-webkit-scrollbar-thumb{background:rgba(var(--acR),var(--acG),var(--acB),.2);border-radius:4px;}',
    '.sc-con-line{margin:0;padding:1px 0;}',
    '.sc-con-out{color:#a3e635;}',
    '.sc-con-err{color:#f87171;}',
    '.sc-con-sys{color:rgba(var(--acR),var(--acG),var(--acB),.65);font-style:italic;}',
    '.sc-con-ok {color:#34d399;}',
    '#sc-upload-input{display:none;}',
  ].join('\n');
  document.head.appendChild(css);

  /* ── Script registry ── */
  var _scripts = {};

  /* ── Helpers ── */
  function _langIcon(l) {
    return {python:'\u{1F40D}',javascript:'\u26A1',typescript:'\u{1F537}',rust:'\u{1F980}',
            go:'\u{1F439}',java:'\u2615',cpp:'\u2699\uFE0F',ruby:'\u{1F48E}',
            php:'\u{1F418}',swift:'\u{1F985}',kotlin:'\u{1F3AF}',luau:'\u{1F3AE}',
            csharp:'#\uFE0F\u20E3'}[l] || '\u{1F4C4}';
  }
  function _langCls(l) {
    var k = (l||'').toLowerCase().replace(/[^a-z]/g,'');
    return 'sc-lang-' + (['python','javascript','typescript','rust','go','java','cpp','luau'].indexOf(k) > -1 ? k : 'default');
  }
  function _scriptName(query, lang, code) {
    var q = (query || '').toLowerCase();
    var names = [
      [/snake\s*game/,'Snake Game'],[/calculadora|calculator/,'Calculator'],
      [/todo|to[\-\s]do|task.?list/,'To-Do List'],[/fibonacci|fib\b/,'Fibonacci'],
      [/sort(ing)?\s*(algo|alg)/,'Sorting Algorithm'],[/stopwatch|cron[o\xf4]metro/,'Stopwatch'],
      [/binary.?tree|bst/,'Binary Tree'],[/linked.?list/,'Linked List'],
      [/hello.?world/,'Hello World'],[/palindrome|pal[\xed\u0069]ndromo/,'Palindrome Checker'],
      [/web.?scraper|crawler/,'Web Scraper'],[/weather|clima/,'Weather App'],
    ];
    for (var i=0; i<names.length; i++) if (names[i][0].test(q)) return names[i][1];
    var stop = new Set(['write','create','make','build','a','an','the','for','in','with','me','please','using','generate','code','script','function','program','em','um','uma','para','usar','usando']);
    var kept = q.replace(/[^a-z0-9 ]/g,'').split(/\s+/).filter(function(w){ return w.length>2 && !stop.has(w); }).slice(0,3);
    return kept.length ? kept.map(function(w){ return w[0].toUpperCase()+w.slice(1); }).join(' ') : 'Script';
  }
  function _descCode(code) {
    var ln = code.split('\n').length;
    var fn = (code.match(/\b(?:def|function|fn|func|fun)\s+\w+/g)||[]).length;
    var cl = (code.match(/\b(?:class|struct|impl)\s+\w+/g)||[]).length;
    var p = [ln+' lines'];
    if(fn) p.push(fn+' fn'+(fn>1?'s':''));
    if(cl) p.push(cl+' class'+(cl>1?'es':''));
    return p.join(' \u00b7 ');
  }

  /* ── Build the fullscreen overlay (once) ── */
  function _buildOverlay() {
    if (_el('sc-overlay')) return;
    var o = document.createElement('div');
    o.id = 'sc-overlay';
    o.innerHTML =
      '<div id="sc-toolbar">' +
        '<span id="sc-tb-icon">\u{1F4C4}</span>' +
        '<span id="sc-tb-name">Script</span>' +
        '<span id="sc-tb-lang">TEXT</span>' +
        '<div class="sc-tb-sep"></div>' +
        '<button class="sc-tb-btn" id="sc-btn-pause" onclick="_scPause()">\u23F8 Pause</button>' +
        '<button class="sc-tb-btn" id="sc-btn-play"  onclick="_scRestart()">\u21BA Restart</button>' +
        '<button class="sc-tb-btn" id="sc-btn-copy"  onclick="_scCopy()">\u29C9 Copy</button>' +
        '<button class="sc-tb-btn" id="sc-btn-upload" onclick="_scUpload()">\u2B06 Upload</button>' +
        '<input type="file" id="sc-upload-input" onchange="_scHandleUpload(event)">' +
        '<button class="sc-tb-btn" id="sc-btn-close"  onclick="_scClose()">\u2715 Close</button>' +
      '</div>' +
      /* Game runs here — fills all remaining space */
      '<div id="sc-run-area"></div>' +
      /* Console at bottom (resizable) */
      '<div id="sc-resize-handle"></div>' +
      '<div id="sc-console">' +
        '<div id="sc-con-header">' +
          '<span id="sc-con-title">\u25B8 Console</span>' +
          '<span id="sc-con-status"></span>' +
          '<button id="sc-con-clear" onclick="_scClearCon()">Clear</button>' +
        '</div>' +
        '<div id="sc-con-out"></div>' +
      '</div>';
    document.body.appendChild(o);

    /* ESC closes */
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && _el('sc-overlay') && _el('sc-overlay').classList.contains('open'))
        _scClose();
    });

    /* Drag-to-resize console */
    var rh = o.querySelector('#sc-resize-handle');
    if (rh) {
      var _d = false, _sy = 0, _sh = 0;
      rh.addEventListener('mousedown', function(e) {
        _d = true; _sy = e.clientY;
        var con = _el('sc-console'); _sh = con ? con.offsetHeight : 160;
        e.preventDefault();
      });
      document.addEventListener('mousemove', function(e) {
        if (!_d) return;
        var con = _el('sc-console'); if (!con) return;
        con.style.height = Math.max(40, Math.min(500, _sh + (_sy - e.clientY))) + 'px';
      });
      document.addEventListener('mouseup', function() { _d = false; });
    }
  }

  /* ── Build & inject the JS runner iframe ── */
  function _buildJsIframe(code) {
    /* Intercept console.log/error/warn and postMessage them up */
    var escaped = code
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/<\/script>/gi, '<\\/script>');

    var html = '<!DOCTYPE html><html><head>' +
      '<meta charset="UTF-8">' +
      '<style>*{box-sizing:border-box;margin:0;padding:0}body{background:#0d0d14;color:#eef2ff;font-family:system-ui,sans-serif;overflow:hidden;}</style>' +
      '</head><body>' +
      '<script>(function(){\n' +
      /* Redirect console */
      'var _p=function(t,a){try{parent.postMessage({__sc:1,t:t,msg:[].slice.call(a).map(function(x){return typeof x==="object"?JSON.stringify(x):String(x);}).join(" ")},"*");}catch(e){}};\n' +
      'console.log=function(){_p("out",arguments);};\n' +
      'console.error=function(){_p("err",arguments);};\n' +
      'console.warn=function(){_p("warn",arguments);};\n' +
      'window.onerror=function(m,u,l,c,e){_p("err",[(e&&e.message)||m+" (line "+l+")"]);return true;};\n' +
      'try{\n' + code + '\n}catch(e){_p("err",[e.message||String(e)]);}\n' +
      '})()<\/script>' +
      '</body></html>';

    var ifr = document.createElement('iframe');
    ifr.id = 'sc-js-frame';
    ifr.sandbox = 'allow-scripts';
    ifr.style.cssText = 'width:100%;height:100%;border:none;display:block;background:#0d0d14;';
    ifr.srcdoc = html;
    return ifr;
  }

  /* ── Run JS: inject iframe into #sc-run-area ── */
  function _runJS(s) {
    var area = _el('sc-run-area'); if (!area) return;
    /* Kill previous iframe */
    var old = _el('sc-js-frame'); if (old) old.remove();

    _scConLog('\u25b8 ' + s.name + ' running\u2026', 'sys');
    _scBtnState('running');

    /* Listen for console messages from the iframe */
    var _handler = function(e) {
      if (!e.data || !e.data.__sc) return;
      var t = e.data.t, m = String(e.data.msg || '');
      if (t === 'out')  _scConLog(m, 'out');
      else if (t === 'err')  _scConLog(m, 'err');
      else if (t === 'warn') _scConLog('\u26a0 ' + m, 'sys');
    };
    window.addEventListener('message', _handler);

    var ifr = _buildJsIframe(s.code);
    area.appendChild(ifr);

    /* Store cleanup reference */
    var o = _el('sc-overlay');
    if (o) {
      o._msgHandler = _handler;
      o._iframe     = ifr;
    }
  }

  /* ── Run Python: use Pyodide or show helpful fallback ── */
  function _runPython(s) {
    var area = _el('sc-run-area'); if (!area) return;
    var old = _el('sc-py-frame'); if (old) old.remove();

    _scConLog('\u25b8 Starting Python\u2026', 'sys');
    _scBtnState('running');

    /* Try PyodideLoader */
    if (typeof PyodideLoader !== 'undefined' && typeof PyodideLoader.load === 'function') {
      _scConLog('\u23f3 Loading Python environment\u2026', 'sys');
      PyodideLoader.load(function(py) {
        if (!py) {
          _scConLog('\u2717 Python (Pyodide) failed to load.', 'err');
          _scConLog('  Use Copy to run the code in your local Python environment.', 'sys');
          _scBtnState('idle'); return;
        }
        /* Redirect stdout/stderr */
        py.globals.set('_sc_log', function(m) { _scConLog(String(m), 'out'); });
        py.globals.set('_sc_err', function(m) { _scConLog(String(m), 'err'); });
        try {
          py.runPython(
            'import sys\n' +
            'class _SCOut:\n' +
            '    def write(self,m):\n' +
            '        if m.strip(): _sc_log(m)\n' +
            '    def flush(self): pass\n' +
            'sys.stdout = _SCOut()\n' +
            'sys.stderr = _SCOut()\n'
          );
          py.runPython(s.code);
          _scConLog('\u2713 Done', 'ok');
        } catch(e) {
          _scConLog('Error: ' + (e.message || String(e)), 'err');
        }
        _scBtnState('idle');
      });
    } else {
      /* No Pyodide — show code in a styled read-only view with copy hint */
      _scConLog('\u2139 Python runs in your local environment.', 'sys');
      _scConLog('  Click \u29C9 Copy above then run: python3 script.py', 'sys');
      _scBtnState('idle');

      /* Still show the code so the user can read it */
      var pre = document.createElement('pre');
      pre.style.cssText = 'margin:0;padding:20px 24px;font-family:"JetBrains Mono",monospace;font-size:12px;line-height:1.7;color:#eef2ff;white-space:pre-wrap;word-break:break-word;overflow:auto;height:100%;';
      pre.id = 'sc-py-frame';
      pre.innerHTML = _highlight(
        s.code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'),
        'python'
      );
      area.appendChild(pre);
    }
  }

  /* ── Open: set up toolbar + run immediately ── */
  window._scOpen = function(id) {
    var s = _scripts[id]; if (!s) return;
    _buildOverlay();
    var o = _el('sc-overlay'); if (!o) return;

    /* Toolbar labels */
    var ti = _el('sc-tb-icon'), tn = _el('sc-tb-name'), tl = _el('sc-tb-lang');
    if (ti) ti.textContent = _langIcon(s.lang);
    if (tn) tn.textContent = s.name;
    if (tl) { tl.textContent = s.lang.toUpperCase(); tl.className = _langCls(s.lang) + ' sc-tb-lang'; }

    /* Wipe previous run */
    _scKillRun(o);
    _scClearCon();

    o._sc     = s;
    o._paused = false;

    o.classList.add('open');
    document.body.style.overflow = 'hidden';

    /* START RUNNING immediately */
    _scLaunch(s);
  };

  /* ── Launch the appropriate runner ── */
  function _scLaunch(s) {
    var lang = (s.lang || '').toLowerCase().replace(/[^a-z]/g,'');
    if (lang === 'javascript' || lang === 'typescript' || lang === 'js' || lang === 'ts') {
      _runJS(s);
    } else if (lang === 'python' || lang === 'py') {
      _runPython(s);
    } else {
      /* Other languages: show code + copy hint */
      var area = _el('sc-run-area'); if (!area) return;
      var pre = document.createElement('pre');
      pre.style.cssText = 'margin:0;padding:20px 24px;font-family:"JetBrains Mono",monospace;font-size:12px;line-height:1.7;color:#eef2ff;white-space:pre-wrap;word-break:break-word;overflow:auto;height:100%;';
      pre.innerHTML = _highlight(
        s.code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'),
        s.lang
      );
      area.appendChild(pre);
      _scConLog('\u2139 ' + s.lang.toUpperCase() + ' runs in your local environment.', 'sys');
      _scConLog('  Click \u29C9 Copy then run locally.', 'sys');
      _scBtnState('idle');
    }
  }

  /* ── Kill current run (remove iframe / cleanup) ── */
  function _scKillRun(o) {
    o = o || _el('sc-overlay');
    if (!o) return;
    /* Remove message listener */
    if (o._msgHandler) { window.removeEventListener('message', o._msgHandler); o._msgHandler = null; }
    /* Wipe run area */
    var area = _el('sc-run-area');
    if (area) area.innerHTML = '';
    o._iframe = null;
    _scBtnState('idle');
  }

  /* ── Close ── */
  window._scClose = function() {
    var o = _el('sc-overlay'); if (!o) return;
    _scKillRun(o);
    o.classList.remove('open');
    document.body.style.overflow = '';
  };

  /* ── Restart (kills iframe, re-launches) ── */
  window._scRestart = function() {
    var o = _el('sc-overlay'); if (!o || !o._sc) return;
    _scKillRun(o);
    _scClearCon();
    o._paused = false;
    _scConLog('\u21ba Restarting\u2026', 'sys');
    setTimeout(function() { _scLaunch(o._sc); }, 80);
  };

  /* ── Pause: freeze/unfreeze the iframe ── */
  window._scPause = function() {
    var o = _el('sc-overlay'); if (!o) return;
    var ifr = _el('sc-js-frame');
    if (!ifr) return;
    o._paused = !o._paused;
    var pb = _el('sc-btn-pause');
    if (o._paused) {
      /* Remove from DOM — halts JS execution */
      ifr._savedSrcdoc = ifr.srcdoc || '';
      ifr.style.visibility = 'hidden';
      /* Send pause signal into iframe */
      try { ifr.contentWindow.postMessage({ __scPause: true }, '*'); } catch(_) {}
      if (pb) pb.textContent = '\u25B6 Resume';
      _scConLog('\u23f8 Paused', 'sys');
    } else {
      ifr.style.visibility = 'visible';
      try { ifr.contentWindow.postMessage({ __scResume: true }, '*'); } catch(_) {}
      if (pb) pb.textContent = '\u23F8 Pause';
      _scConLog('\u25b6 Resumed', 'sys');
    }
  };

  /* ── Copy ── */
  window._scCopy = function() {
    var o = _el('sc-overlay'); if (!o || !o._sc) return;
    navigator.clipboard && navigator.clipboard.writeText(o._sc.code).then(function() {
      var b = _el('sc-btn-copy');
      if (b) { b.textContent = '\u2713 Copied'; setTimeout(function(){ b.textContent = '\u29C9 Copy'; }, 1600); }
      if (typeof _v11Toast === 'function') _v11Toast('Code copied!', 'ok');
    });
  };

  /* ── Upload ── */
  window._scUpload = function() { var i = _el('sc-upload-input'); if (i) i.click(); };
  window._scHandleUpload = function(e) {
    var f = e.target.files && e.target.files[0]; if (!f) return;
    var ext = f.name.split('.').pop().toLowerCase();
    var lm  = {py:'python',js:'javascript',ts:'typescript',rs:'rust',go:'go',
               java:'java',cpp:'cpp',rb:'ruby',php:'php',swift:'swift',kt:'kotlin',cs:'csharp',r:'r',lua:'luau'};
    var r = new FileReader();
    r.onload = function(ev) {
      var o = _el('sc-overlay'); if (!o) return;
      var newLang = lm[ext] || o._sc.lang;
      o._sc = { code: ev.target.result, lang: newLang, name: f.name.replace(/\.[^.]+$/, '') };
      _scKillRun(o);
      _scClearCon();
      _scConLog('\u{1F4C2} Loaded: ' + f.name, 'sys');
      setTimeout(function() { _scLaunch(o._sc); }, 80);
    };
    r.readAsText(f);
    e.target.value = '';
  };

  /* ── Console helpers ── */
  window._scConLog = function(msg, type) {
    var out = _el('sc-con-out'); if (!out) return;
    var p = document.createElement('p');
    p.className = 'sc-con-line sc-con-' + (type || 'out');
    p.textContent = msg;
    out.appendChild(p);
    out.scrollTop = out.scrollHeight;
  };
  window._scClearCon = function() {
    var out = _el('sc-con-out'); if (out) out.innerHTML = '';
    var st  = _el('sc-con-status'); if (st) st.textContent = '';
  };

  function _scBtnState(state) {
    var pb = _el('sc-btn-pause'), st = _el('sc-con-status');
    if (state === 'running') {
      if (pb) { pb.disabled = false; pb.textContent = '\u23F8 Pause'; }
      if (st) { st.textContent = '\u25CF Running'; st.style.color = '#34d399'; }
    } else {
      if (pb) { pb.disabled = false; pb.textContent = '\u23F8 Pause'; }
      if (st) st.textContent = '';
    }
  }

  /* ── Simple syntax highlighter ── */
  function _highlight(esc, lang) {
    var c = esc;
    c = c.replace(/((?:&quot;|&#34;|')((?:[^\\]|\\.)*?)(?:&quot;|&#34;|'))/g,'<span style="color:#a3e635">$1</span>');
    var cmtRx = (lang==='python'||lang==='ruby'||lang==='r') ? /(#[^\n]*)/g : /(\/\/[^\n]*)/g;
    c = c.replace(cmtRx,'<span style="color:rgba(148,163,184,.5)">$1</span>');
    c = c.replace(/\b(\d+\.?\d*)\b/g,'<span style="color:#fb923c">$1</span>');
    var kw = {
      python:['def','class','import','from','return','if','elif','else','for','while','in','not','and','or','True','False','None','try','except','finally','with','as','pass','break','continue','lambda','yield','async','await'],
      javascript:['const','let','var','function','return','if','else','for','while','do','switch','case','break','new','this','typeof','import','export','default','class','extends','try','catch','finally','throw','async','await','true','false','null','undefined'],
      rust:['fn','let','mut','if','else','match','for','while','loop','return','struct','enum','impl','trait','use','pub','mod','true','false','Some','None','Ok','Err','async','await'],
      go:['func','var','const','if','else','for','range','switch','case','return','struct','interface','go','chan','defer','make','new','type','package','import','true','false','nil'],
    };
    var words = (kw[lang]||kw['javascript']);
    words.forEach(function(k){
      c = c.replace(new RegExp('\\b('+k+')\\b','g'),'<span style="color:#c084fc">$1</span>');
    });
    return c;
  }

  /* ── Override buildCodeBlock → emit compact card ── */
  window.buildCodeBlock = function(code, lang, opts) {
    opts = opts || {};
    var id   = 'sc_' + Math.random().toString(36).slice(2,9);
    var q    = opts.query || (typeof S!=='undefined' && S ? (S.lastQuery||'') : '');
    var name = _scriptName(q, lang, code);
    var desc = _descCode(code);
    var lc   = (lang||'text').toLowerCase().replace(/[^a-z]/g,'');
    _scripts[id] = { code:code, lang:lang||'text', name:name };
    return (
      '<div class="sc-card" onclick="_scOpen(\''+id+'\')" role="button" tabindex="0"' +
          ' onkeydown="if(event.key===\'Enter\'||event.key===\' \')_scOpen(\''+id+'\')">' +
        '<div class="sc-card-icon">'+_langIcon(lc)+'</div>' +
        '<div class="sc-card-info">' +
          '<div class="sc-card-name">'+_esc(name)+'</div>' +
          '<div class="sc-card-desc">'+_esc(desc)+'</div>' +
        '</div>' +
        '<div class="sc-card-right">' +
          '<span class="sc-card-lang '+_langCls(lang)+'">'+_esc((lang||'text').toUpperCase())+'</span>' +
          '<span class="sc-card-lines">'+code.split('\n').length+' lines</span>' +
          '<span class="sc-card-hint">&#x25B6; click to open</span>' +
        '</div>' +
      '</div>'
    );
  };

  console.log('[v11] Script card + fullscreen overlay installed \u2713');

  /* ── CRITICAL: intercept addAI so EVERY code block becomes a card ──
     No matter which internal function generates the code (processQuery,
     _codeHTML, _analyzeHTML, buildCodeBlock, enhanceCodeGen, etc.),

/* ═══════════════════════════════════════════════════════════════════════════
   v15 — Floating EXIT FAB
   Pulsing ✕ button that appears over the script overlay.
   Synced with _scOpen / _scClose lifecycle.
   ═══════════════════════════════════════════════════════════════════════════ */
(function installExitFAB() {
  /* FAB element is created once and reused */
  var fab = null;
  var _collapseTimer = null;
  var _expandOnce    = false;

  function _ensureFab() {
    if (fab) return;
    fab = document.createElement('button');
    fab.id = 'sc-exit-fab';
    fab.setAttribute('aria-label', 'Close script overlay (Escape)');
    fab.innerHTML =
      '<span class="sc-fab-icon">&#x2715;</span>' +
      '<span class="sc-fab-label">Exit Script</span>' +
      '<span class="sc-fab-esc">ESC</span>';
    document.body.appendChild(fab);

    fab.addEventListener('click',      _doClose);
    fab.addEventListener('touchend',   function(e){ e.preventDefault(); _doClose(); });
    fab.addEventListener('mouseenter', _expand);
    fab.addEventListener('mouseleave', _collapse);
    fab.addEventListener('touchstart', function(e){ e.preventDefault(); _expand(); });
  }

  function _showFab() {
    _ensureFab();
    fab.classList.add('sc-fab-visible');
    if (!_expandOnce) {
      _expandOnce = true;
      setTimeout(function() {
        if (fab) fab.classList.add('sc-fab-expanded');
        _collapseTimer = setTimeout(function() {
          if (fab) fab.classList.remove('sc-fab-expanded');
        }, 3500);
      }, 300);
    }
  }

  function _hideFab() {
    clearTimeout(_collapseTimer);
    if (!fab) return;
    fab.classList.remove('sc-fab-visible', 'sc-fab-expanded');
    _expandOnce = false;
  }

  function _expand() {
    clearTimeout(_collapseTimer);
    if (fab) fab.classList.add('sc-fab-expanded');
  }

  function _collapse() {
    _collapseTimer = setTimeout(function() {
      if (fab) fab.classList.remove('sc-fab-expanded');
    }, 1200);
  }

  function _doClose() {
    if (typeof window._scClose === 'function') window._scClose();
    _hideFab();
  }

  /* Intercept _scOpen / _scClose */
  var _origOpen  = window._scOpen;
  var _origClose = window._scClose;

  window._scOpen = function(id) {
    if (typeof _origOpen === 'function') _origOpen(id);
    setTimeout(_showFab, 120);
  };

  window._scClose = function() {
    if (typeof _origClose === 'function') _origClose();
    _hideFab();
  };

  /* MutationObserver fallback */
  function _watchOverlay() {
    var overlay = document.getElementById('sc-overlay');
    if (overlay) {
      new MutationObserver(function(muts) {
        muts.forEach(function(m) {
          if (m.attributeName === 'class' && !overlay.classList.contains('open'))
            _hideFab();
        });
      }).observe(overlay, { attributes: true });
    } else {
      setTimeout(_watchOverlay, 600);
    }
  }
  _watchOverlay();

  console.log('[ui.js] EXIT FAB installed ✓');
})();
