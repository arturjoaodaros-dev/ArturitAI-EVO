/* ═══════════════════════════════════════════════════════════════════════════
   js/executor.js  —  ArturitAI Code Executor
   Handles: Python (Pyodide) · JavaScript (sandboxed iframe) · other (stub)
   Public API:
     runCode(lang, code, onOutput, onDone)
     PyodideLoader.load(cb) · PyodideLoader.loaded
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── PyodideLoader ─────────────────────────────────────────────────────────
   Non-blocking loader. Call load(callback) from anywhere; the callback
   receives the pyodide instance (or null on failure).
   ─────────────────────────────────────────────────────────────────────── */
var PyodideLoader = (function () {
  'use strict';

  var _pyodide  = null;
  var _loading  = false;
  var _queue    = [];
  var loaded    = false;

  var PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';

  function _flushQueue(py) {
    _queue.forEach(function (cb) { try { cb(py); } catch (e) { /* ignore */ } });
    _queue = [];
  }

  function _doLoad() {
    if (_loading) return;
    _loading = true;

    /* Dynamic script injection */
    var script = document.createElement('script');
    script.src = PYODIDE_URL;
    script.onload = function () {
      if (typeof loadPyodide !== 'function') {
        console.error('[executor] loadPyodide not found after script load');
        _flushQueue(null); return;
      }
      loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/' })
        .then(function (py) {
          _pyodide = py;
          loaded = true;
          PyodideLoader.loaded = true;
          _flushQueue(py);
          console.log('[executor] Pyodide ready ✓');
          /* Update status badge */
          var el = document.getElementById('pyStatus');
          if (el) { el.textContent = '✅ Python ready'; el.style.color = 'var(--emerald)'; }
        })
        .catch(function (err) {
          console.warn('[executor] Pyodide load error:', err);
          _flushQueue(null);
        });
    };
    script.onerror = function () {
      console.warn('[executor] Failed to load Pyodide script from CDN');
      _flushQueue(null);
    };
    document.head.appendChild(script);
  }

  return {
    loaded: false,

    load: function (callback) {
      if (_pyodide) { callback(_pyodide); return; }
      _queue.push(callback);
      _doLoad();
    },

    get instance() { return _pyodide; },
  };
})();

window.PyodideLoader = PyodideLoader;

/* ── Kick off Python load immediately (background, non-blocking) ─────────── */
(function _kickPyodide() {
  /* Small delay so the page renders first */
  setTimeout(function () {
    PyodideLoader.load(function (py) {
      if (!py) {
        var el = document.getElementById('pyStatus');
        if (el) { el.textContent = '⚠ Python unavailable'; el.style.color = 'var(--amber)'; }
      }
    });
  }, 800);
})();

/* ── runCode ───────────────────────────────────────────────────────────────
   Uniform code runner.
   @param lang      'python' | 'javascript' | 'typescript' | anything else
   @param code      source code string
   @param onOutput  function(line, type) — type: 'out'|'err'|'sys'|'ok'
   @param onDone    function(success)
   ─────────────────────────────────────────────────────────────────────── */
window.runCode = function (lang, code, onOutput, onDone) {
  var L = (lang || '').toLowerCase().replace(/[^a-z]/g, '');
  var out = onOutput || function () {};
  var done = onDone || function () {};

  if (L === 'javascript' || L === 'typescript' || L === 'js' || L === 'ts') {
    _runJS(code, out, done);
  } else if (L === 'python' || L === 'py') {
    _runPython(code, out, done);
  } else {
    out('ℹ ' + lang.toUpperCase() + ' cannot be executed in the browser.', 'sys');
    out('  Copy the code and run it locally.', 'sys');
    done(false);
  }
};

/* ── JavaScript runner via sandboxed iframe ─────────────────────────────── */
function _runJS(code, out, done) {
  out('▸ Running JavaScript…', 'sys');

  var escaped = code
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/<\/script>/gi, '<\\/script>');

  var html =
    '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<style>*{box-sizing:border-box;margin:0;padding:0}' +
    'body{background:#0d0d14;color:#eef2ff;font-family:system-ui,sans-serif;overflow:hidden;}</style>' +
    '</head><body>' +
    '<script>(function(){' +
    'var _p=function(t,a){try{parent.postMessage({__sc:1,t:t,msg:[].slice.call(a).map(function(x){return typeof x==="object"?JSON.stringify(x):String(x);}).join(" ")},"*");}catch(e){}};' +
    'console.log=function(){_p("out",arguments);};' +
    'console.error=function(){_p("err",arguments);};' +
    'console.warn=function(){_p("warn",arguments);};' +
    'window.onerror=function(m,u,l,c,e){_p("err",[(e&&e.message)||m+" (line "+l+")"]);return true;};' +
    'try{\n' + code + '\n}catch(e){_p("err",[e.message||String(e)]);}' +
    '})()<\/script></body></html>';

  var ifr = document.createElement('iframe');
  ifr.sandbox = 'allow-scripts';
  ifr.style.cssText = 'display:none;';
  ifr.srcdoc = html;

  var handler = function (e) {
    if (!e.data || !e.data.__sc) return;
    var t = e.data.t, m = String(e.data.msg || '');
    if (t === 'out')  out(m, 'out');
    else if (t === 'err')  out(m, 'err');
    else if (t === 'warn') out('⚠ ' + m, 'sys');
  };
  window.addEventListener('message', handler);

  ifr.onload = function () { done(true); };
  document.body.appendChild(ifr);

  /* Clean up after 30s */
  setTimeout(function () {
    window.removeEventListener('message', handler);
    if (ifr.parentNode) ifr.parentNode.removeChild(ifr);
  }, 30000);
}

/* ── Python runner via Pyodide ──────────────────────────────────────────── */
function _runPython(code, out, done) {
  out('▸ Starting Python…', 'sys');

  PyodideLoader.load(function (py) {
    if (!py) {
      out('✗ Pyodide unavailable. Copy and run locally.', 'err');
      out('  Command: python3 script.py', 'sys');
      done(false); return;
    }
    try {
      /* Redirect stdout/stderr */
      py.globals.set('_out', function (m) { out(String(m), 'out'); });
      py.globals.set('_err', function (m) { out(String(m), 'err'); });
      py.runPython(
        'import sys\n' +
        'class _W:\n' +
        '    def __init__(self,fn): self._fn=fn\n' +
        '    def write(self,m):\n' +
        '        if m.strip(): self._fn(m)\n' +
        '    def flush(self): pass\n' +
        'sys.stdout=_W(_out)\n' +
        'sys.stderr=_W(_err)\n'
      );
      py.runPython(code);
      out('✓ Done', 'ok');
      done(true);
    } catch (e) {
      out('Error: ' + (e.message || String(e)), 'err');
      done(false);
    }
  });
}

console.log('[executor.js] Code executor module loaded ✓');
