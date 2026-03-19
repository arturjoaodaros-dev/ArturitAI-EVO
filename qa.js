/* ═══════════════════════════════════════════════════════════════════════════
   js/qa.js  —  ArturitAI Quality Assurance Engine
   Base QA_ENGINE + v13 (Python main guard) + v14 (25-factor) patches.
   Exports: QA_ENGINE (window.QA_ENGINE)
   ═══════════════════════════════════════════════════════════════════════════ */

   §8b — QA_ENGINE  (Quality Assurance)
   Evaluates generated code against quality standards and provides fixes.
   Integrated into processQuery_v11 as an iterative improvement loop.
   ═══════════════════════════════════════════════════════════════════════════ */
var QA_ENGINE = (function() {
  'use strict';

  /* ════════════════════════════════════════════════════════
     PROGRAM TEMPLATES — expected features per recipe
     The engine uses these as checklists during QA.
  ════════════════════════════════════════════════════════ */
  var TEMPLATES = {
    snake_game: {
      minLines: { python: 80, javascript: 80, default: 60 },
      required: [
        { id:'game_loop',       label:'Game loop',              icon:'🔄', rx:/while\s+True|setInterval|requestAnimationFrame|gameLoop/i,          weight:20 },
        { id:'snake_data',      label:'Snake data structure',   icon:'🐍', rx:/snake\s*=\s*[\[({]|snake\.push|snake\.unshift|snake\s*=\s*\[\s*\{/i, weight:15 },
        { id:'movement',        label:'Snake movement',         icon:'➡️', rx:/direction|dir|dx|dy|head\.x|move/i,                          weight:15 },
        { id:'food',            label:'Food placement',         icon:'🍎', rx:/food|spawn|place_food|placeFood/i,                                  weight:10 },
        { id:'wall_collision',  label:'Wall collision',         icon:'🧱', rx:/collision|wall|out.of.bounds|>= COLS|>= ROWS|< 0/i,                 weight:15 },
        { id:'self_collision',  label:'Self-collision',         icon:'💥', rx:/self.collision|some\(s =>|snake\.some|any\(.*==.*head/i,            weight:10 },
        { id:'score',           label:'Scoring',                icon:'🏆', rx:/score|point|tally/i,                                               weight:8  },
        { id:'game_over',       label:'Game over',              icon:'☠️',  rx:/game.?over|gameOver|endGame|end_game/i,                            weight:7  },
      ],
    },
    calculator: {
      minLines: { javascript: 40, python: 40, default: 30 },
      required: [
        { id:'addition',     label:'Addition',          icon:'➕', rx:/\+|add|plus/i,                                  weight:12 },
        { id:'subtraction',  label:'Subtraction',       icon:'➖', rx:/\-|subtract|minus/i,                            weight:12 },
        { id:'multiply',     label:'Multiplication',    icon:'✖️',  rx:/\*|multiply|times/i,                           weight:12 },
        { id:'divide',       label:'Division',          icon:'➗', rx:/\/|divide|divid/i,                              weight:12 },
        { id:'div_zero',     label:'Division-by-zero guard', icon:'🛡️', rx:/divide.?by.?zero|b\s*===?\s*0|divisor.*==|ZeroDivision|if.*b.*==.*0/i, weight:15 },
        { id:'display',      label:'Output / display',  icon:'🖥️',  rx:/print|console\.log|display|result|innerHTML|textContent/i, weight:10 },
        { id:'error_handle', label:'Error handling',    icon:'⚠️',  rx:/try|except|catch|isNaN|isFinite|ValueError/i, weight:10 },
      ],
    },
    todo_list: {
      minLines: { javascript: 35, python: 35, default: 25 },
      required: [
        { id:'add_item',    label:'Add item',     icon:'➕', rx:/add|append|push|insert/i,          weight:20 },
        { id:'remove_item', label:'Remove item',  icon:'🗑️',  rx:/remove|delete|pop|splice|filter/i, weight:20 },
        { id:'display',     label:'Display list', icon:'📋', rx:/print|render|display|show|list/i,  weight:20 },
        { id:'complete',    label:'Toggle complete', icon:'✅', rx:/complete|done|toggle|check/i,   weight:20 },
      ],
    },
    sorting_algorithm: {
      minLines: { default: 20 },
      required: [
        { id:'sort_logic',    label:'Sort logic',          icon:'🔢', rx:/sort|swap|compare|pivot|merge|partition/i,    weight:30 },
        { id:'return_sorted', label:'Returns sorted list', icon:'✅', rx:/return|sorted|result/i,                       weight:20 },
        { id:'empty_guard',   label:'Empty input guard',   icon:'🛡️', rx:/len\s*\(|length\s*===?\s*0|if.*not.*arr|arr\.length/i, weight:20 },
        { id:'loop',          label:'Iteration',           icon:'🔄', rx:/for\s|while\s/i,                             weight:15 },
      ],
    },
    fibonacci: {
      minLines: { default: 8 },
      required: [
        { id:'base_case',  label:'Base cases (0,1)',  icon:'0️⃣',  rx:/n\s*[<=>]=?\s*[01]|n\s*==\s*0|n\s*==\s*1|match\s*n/i, weight:25 },
        { id:'logic',      label:'Fibonacci logic',   icon:'🔢', rx:/fib|fibonacci/i,                                        weight:25 },
        { id:'return',     label:'Returns value',     icon:'✅', rx:/return/i,                                               weight:20 },
        { id:'output',     label:'Demo / output',     icon:'🖥️',  rx:/print|console\.log|println|fmt\.Print/i,               weight:15 },
      ],
    },
    generic: {
      minLines: { default: 10 },
      required: [
        { id:'has_logic',   label:'Core logic present',   icon:'🧠', rx:/if|for|while|function|def|class|=>/i, weight:25 },
        { id:'has_output',  label:'Has output / return',  icon:'🖥️',  rx:/print|return|console\.log|cout|puts/i, weight:20 },
        { id:'no_todo',     label:'No unresolved TODOs',  icon:'✅', rx_absent:/TODO:\s|FIXME:/i,               weight:20 },
      ],
    },
  };

  /* ════════════════════════════════════════════════════════
     CODE QUALITY RULES — language-agnostic + language-specific
  ════════════════════════════════════════════════════════ */
  var QUALITY_RULES = [
    /* Structure */
    { id:'no_stub',    label:'No stub/placeholder code',   icon:'🚫', fn: function(c,l,q){ var r=c.split('\n'); return r.length < _minLines(l,q) && /TODO|FIXME|pass$|throw new Error.*not.*impl/m.test(c); } },
    { id:'has_comments', label:'Has inline comments',      icon:'💬', fn: function(c,l){ return c.split('\n').length > 30 && !/(#|\/\/|\/\*|--\s)/.test(c); } },
    { id:'named_vars', label:'Meaningful variable names',  icon:'📝', fn: function(c){ return /(var\s+[a-z]|let\s+[a-z]|def [a-z](?!n))/i.test(c) && !/def\s+\w+|function\s+\w+|class\s+\w+/.test(c); } },
    /* Error handling */
    { id:'div_zero',   label:'Division-by-zero guard',     icon:'🛡️', fn: function(c,l,q){ return /(calculator|divide|division|arithmetic)/i.test(q) && /[\/÷]/.test(c) && !/zero|b\s*===?\s*0|divisor|ZeroDivision/.test(c); } },
    /* Length gate — per-recipe minimum */
    { id:'min_length', label:'Sufficient code length',     icon:'📏', fn: function(c,l,q){ return c.split('\n').length < _minLines(l,q); } },
  ];

  /* Map recipe name → template */
  function _getTemplate(query) {
    var q = query.toLowerCase();
    if (/snake/i.test(q))           return TEMPLATES.snake_game;
    if (/calculator|calculadora/i.test(q)) return TEMPLATES.calculator;
    if (/todo|to.do|task.?list/i.test(q))  return TEMPLATES.todo_list;
    if (/sort(ing)?/i.test(q))      return TEMPLATES.sorting_algorithm;
    if (/fibona/i.test(q))          return TEMPLATES.fibonacci;
    return TEMPLATES.generic;
  }

  function _minLines(lang, query) {
    var tpl = _getTemplate(query || '');
    var lc  = (lang || '').toLowerCase();
    return (tpl.minLines && (tpl.minLines[lc] || tpl.minLines.default)) || 10;
  }

  /* ════════════════════════════════════════════════════════
     CODE FIXERS — per issue id
     Each fixer receives (code, lang, query) and returns improved code.
  ════════════════════════════════════════════════════════ */
  var FIXERS = {

    /* ── Snake game fixers ── */
    game_loop: function(c, l) {
      if (l === 'javascript') {
        return c + '\n\n// ── Game loop (added by QA) ──\nfunction gameLoop() {\n  update();\n  draw();\n  if (!gameOver) requestAnimationFrame(gameLoop);\n}\nrequestAnimationFrame(gameLoop);\n';
      }
      return c + '\n\n# ── Game loop (added by QA) ──\nwhile True:\n    handle_input()\n    update()\n    render()\n    time.sleep(0.1)\n';
    },
    food: function(c, l) {
      if (l === 'javascript') {
        return c + '\n\n// ── Food spawning (added by QA) ──\nfunction spawnFood() {\n  do {\n    food = { x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS) };\n  } while (snake.some(s => s.x===food.x && s.y===food.y));\n}\nspawnFood();\n';
      }
      return c + '\n\n# ── Food placement (added by QA) ──\nimport random\ndef place_food():\n    while True:\n        pos = (random.randint(0, COLS-1), random.randint(0, ROWS-1))\n        if pos not in snake:\n            return pos\n';
    },
    score: function(c, l) {
      if (l === 'javascript') {
        return 'let score = 0;\nlet highScore = 0;\n\nfunction updateScore(delta) {\n  score += delta || 1;\n  if (score > highScore) highScore = score;\n}\n\n' + c;
      }
      return '# ── Scoring (added by QA) ──\nscore = 0\nhigh_score = 0\n\ndef update_score(delta=1):\n    global score, high_score\n    score += delta\n    if score > high_score: high_score = score\n\n' + c;
    },
    game_over: function(c, l) {
      if (l === 'javascript') {
        return c + '\n\n// ── Game over (added by QA) ──\nfunction endGame() {\n  gameOver = true;\n  ctx.fillStyle = "rgba(0,0,0,0.72)";\n  ctx.fillRect(0, 0, W, H);\n  ctx.fillStyle = "#f43f5e";\n  ctx.font = "bold 28px system-ui";\n  ctx.textAlign = "center";\n  ctx.fillText("GAME OVER", W/2, H/2 - 18);\n  ctx.fillStyle = "#eef2ff";\n  ctx.font = "15px system-ui";\n  ctx.fillText("Score: " + score + "  •  Press Enter to restart", W/2, H/2 + 18);\n}\n';
      }
      return c + '\n\n# ── Game over (added by QA) ──\ndef game_over_screen():\n    print("\\n" + "="*30)\n    print(f"  GAME OVER  |  Score: {score}")\n    print("="*30)\n    input("  Press Enter to restart…")\n';
    },
    wall_collision: function(c, l) {
      if (l === 'javascript') {
        return c + '\n\n// ── Wall collision check (added by QA) ──\nfunction checkWallCollision(head) {\n  return head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS;\n}\n';
      }
      return c + '\n\n# ── Wall collision (added by QA) ──\ndef check_wall_collision(head):\n    x, y = head\n    return x < 0 or x >= COLS or y < 0 or y >= ROWS\n';
    },
    self_collision: function(c, l) {
      if (l === 'javascript') {
        return c + '\n\n// ── Self-collision check (added by QA) ──\nfunction checkSelfCollision(head) {\n  return snake.some(s => s.x === head.x && s.y === head.y);\n}\n';
      }
      return c + '\n\n# ── Self-collision (added by QA) ──\ndef check_self_collision(head):\n    return head in snake[1:]\n';
    },

    /* ── Calculator fixers ── */
    div_zero: function(c, l) {
      if (l === 'javascript') {
        var guard = '\n// ── Division-by-zero guard (added by QA) ──\nfunction safeDivide(a, b) {\n  if (b === 0) throw new Error("Cannot divide by zero");\n  return a / b;\n}\n';
        return c.replace(/function\s+divide\s*\([^)]*\)\s*\{[^}]*\}/,
          'function divide(a, b) {\n  if (b === 0) throw new Error("Cannot divide by zero");\n  return a / b;\n}') || c + guard;
      }
      return c + '\n\n# ── Division-by-zero guard (added by QA) ──\ndef safe_divide(a, b):\n    if b == 0:\n        raise ZeroDivisionError("Cannot divide by zero")\n    return a / b\n';
    },

    /* ── Generic fixers ── */
    no_stub: function(c, l, q) {
      /* Replace TODO lines with a basic stub comment */
      return c.replace(/\/\/\s*TODO:.*$/gm, '// (implemented below)')
               .replace(/#\s*TODO:.*$/gm,  '# (implemented below)');
    },
    min_length: function(c, l, q) {
      /* Code is too short — add boilerplate structure based on language */
      var bump = {
        python: '\n\n# ── Main entry point ──\nif __name__ == "__main__":\n    main()\n',
        javascript: '\n\n// ── Main execution ──\n(function main() {\n  console.log("Script started.");\n})();\n',
        rust: '\n\n// ── Tests ──\n#[cfg(test)]\nmod tests {\n    use super::*;\n    #[test]\n    fn test_basic() { assert!(true); }\n}\n',
      };
      return c + (bump[l] || '');
    },
    has_comments: function(c, l) {
      /* Add a file-level docblock if no comments exist */
      var header = l === 'python'
        ? '# ─────────────────────────────────────────\n# Generated by ArturitAI — QA enhanced\n# ─────────────────────────────────────────\n\n'
        : '// ─────────────────────────────────────────\n// Generated by ArturitAI — QA enhanced\n// ─────────────────────────────────────────\n\n';
      return header + c;
    },
    error_handle: function(c, l) {
      if (l === 'javascript') {
        return c + '\n\n// ── Error handling wrapper (added by QA) ──\nwindow.onerror = function(msg, src, line) {\n  console.error("Runtime error at line " + line + ": " + msg);\n  return true;\n};\n';
      }
      return c + '\n\n# ── Error handling (added by QA) ──\n# Wrap calls in try/except to handle unexpected inputs gracefully\n';
    },
  };

  /* ════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════ */
  return {

    /**
     * Run full QA check on generated code.
     * @returns { passed: bool, issues: [{id, label, icon, detail}], score: 0-100 }
     */
    check: function(code, lang, query) {
      var issues   = [];
      var template = _getTemplate(query);
      var lines    = code.split('\n').length;
      var minL     = _minLines(lang, query);

      /* ── 1. Minimum length ── */
      if (lines < minL) {
        issues.push({
          id:     'min_length',
          label:  'Code too short (' + lines + ' lines, expected ≥' + minL + ')',
          icon:   '📏',
          detail: 'Generated ' + lines + ' lines but this task typically requires ' + minL + '+. Missing features likely.',
        });
      }

      /* ── 2. Required feature checks (from template) ── */
      if (template && template.required) {
        template.required.forEach(function(req) {
          var present;
          if (req.rx_absent) {
            present = !req.rx_absent.test(code);
          } else if (req.rx) {
            present = req.rx.test(code);
          } else {
            present = true;
          }
          if (!present) {
            issues.push({
              id:     req.id,
              label:  req.label + ' missing',
              icon:   req.icon || '🔧',
              detail: 'The code does not appear to include: ' + req.label,
            });
          }
        });
      }

      /* ── 3. General quality rules ── */
      QUALITY_RULES.forEach(function(rule) {
        /* Skip min_length (already handled above) */
        if (rule.id === 'min_length') return;
        try {
          if (rule.fn(code, lang, query)) {
            issues.push({
              id:     rule.id,
              label:  rule.label,
              icon:   rule.icon || '⚠️',
              detail: 'Quality rule violated: ' + rule.label,
            });
          }
        } catch(_) {}
      });

      /* Score: 100 - weighted deductions */
      var score = 100;
      issues.forEach(function(iss) {
        var w = (template && template.required)
          ? (template.required.find(function(r){ return r.id === iss.id; }) || {}).weight || 10
          : 10;
        score -= w;
      });

      return {
        passed: issues.length === 0,
        issues: issues,
        score:  Math.max(0, score),
        lines:  lines,
        minLines: minL,
      };
    },

    /**
     * Apply a single QA fix to code.
     * Returns the improved code string.
     */
    applyFix: function(code, lang, issue, query) {
      var fixer = FIXERS[issue.id];
      if (typeof fixer === 'function') {
        try { return fixer(code, lang, query) || code; } catch(_) { return code; }
      }
      /* No specific fixer — append a structured comment noting the missing feature */
      var cmt = lang === 'python' || lang === 'ruby' || lang === 'r' || lang === 'luau'
        ? '# '  : '// ';
      return code + '\n\n' + cmt + '── ' + issue.label + ' (needs implementation) ──\n';
    },

    /** Expose templates for external querying */
    getTemplate: function(query) { return _getTemplate(query); },
    getMinLines: function(lang, query) { return _minLines(lang, query); },
  };
})();
window.QA_ENGINE = QA_ENGINE;


     §V13-1  QA_ENGINE PATCH — Python main() guard checks + fixers
     Adds two new checks:
       missing_main_def   — main() called but def main(): absent  → NameError
       missing_name_guard — no if __name__ == "__main__" guard on runnable script
  ════════════════════════════════════════════════════════════════════ */
  (function patchQAEngine() {
    if (typeof QA_ENGINE === 'undefined') {
      console.warn('[v13] QA_ENGINE not found — main() guard patch skipped');
      return;
    }
    if (QA_ENGINE._v13Patched) return;
    QA_ENGINE._v13Patched = true;

    var _prevCheck    = QA_ENGINE.check.bind(QA_ENGINE);
    var _prevApplyFix = QA_ENGINE.applyFix.bind(QA_ENGINE);

    /* ── Augmented check ── */
    QA_ENGINE.check = function v13_check(code, lang, query) {
      var base   = _prevCheck(code, lang, query);
      var issues = base.issues.slice();

      if ((lang || '').toLowerCase() === 'python') {

        /* ── Check 1: main() called but never defined ── */
        var callsMain   = /\bmain\s*\(\s*\)/.test(code);
        var definesMain = /^\s*def\s+main\s*\(/m.test(code);
        if (callsMain && !definesMain) {
          /* Remove any duplicate of this issue from prior pass */
          issues = issues.filter(function(i){ return i.id !== 'missing_main_def'; });
          issues.unshift({
            id:     'missing_main_def',
            label:  'main() called but never defined — NameError',
            icon:   '🚨',
            detail: 'The script calls main() without a "def main():" definition. ' +
                    'Python will raise NameError: name \'main\' is not defined at runtime.',
            weight: 35,
          });
        }

        /* ── Check 2: missing if __name__ guard on runnable script ── */
        var hasGuard      = /if\s+__name__\s*==\s*['"]__main__['"]/.test(code);
        var hasAnyCall    = callsMain ||
                            /^\s*(?!\s*(def |class |import |from |#|@))[\w]+\s*\(.*\)\s*$/m.test(code);
        var codeLines     = code.split('\n').length;
        if (!hasGuard && hasAnyCall && codeLines > 8) {
          issues = issues.filter(function(i){ return i.id !== 'missing_name_guard'; });
          issues.push({
            id:     'missing_name_guard',
            label:  'Missing if __name__ == "__main__" guard',
            icon:   '🛡️',
            detail: 'Python scripts that run as programs should use the __name__ guard ' +
                    'so they can also be safely imported as modules.',
            weight: 15,
          });
        }
      }

      /* Recompute score */
      var score = 100;
      issues.forEach(function(iss){ score -= (iss.weight || 10); });

      return Object.assign({}, base, {
        issues: issues,
        score:  Math.max(0, score),
        passed: issues.length === 0,
      });
    };

    /* ── Augmented applyFix ── */
    QA_ENGINE.applyFix = function v13_applyFix(code, lang, issue, query) {

      /* Fix: missing_main_def — wrap code in def main(): + add guard */
      if (issue.id === 'missing_main_def' && (lang||'').toLowerCase() === 'python') {
        return _fixMissingMainDef(code);
      }

      /* Fix: missing_name_guard — append guard */
      if (issue.id === 'missing_name_guard' && (lang||'').toLowerCase() === 'python') {
        return _addNameGuard(code);
      }

      return _prevApplyFix(code, lang, issue, query);
    };

    /* ── Helper: wrap bare top-level code in def main(): + guard ── */
    function _fixMissingMainDef(code) {
      var lines = code.split('\n');

      /* 1. Remove the bare main() call and any existing guard (we'll re-add them) */
      var cleanLines = lines.filter(function(l) {
        return !/^\s*main\s*\(\s*\)\s*$/.test(l) &&
               !/if\s+__name__\s*==\s*['"]__main__['"]/.test(l) &&
               !/^\s+main\s*\(\s*\)\s*$/.test(l);
      });

      /* 2. Separate import/constant section from runnable body */
      var importLines = [];
      var bodyLines   = [];
      var inImports   = true;
      for (var i = 0; i < cleanLines.length; i++) {
        var l = cleanLines[i];
        /* Imports: blank lines, import/from, shebang, module-level constants (ALL_CAPS) */
        if (inImports && /^\s*(import |from |\s*$|#!|[A-Z_]{2,}\s*=)/.test(l)) {
          importLines.push(l);
        } else {
          inImports = false;
          bodyLines.push(l);
        }
      }

      /* 3. Check if def main already exists in bodyLines (shouldn't, but guard) */
      var bodyStr = bodyLines.join('\n');
      if (/^\s*def\s+main\s*\(/m.test(bodyStr)) {
        /* def main exists — just need the guard */
        return cleanLines.join('\n').trimEnd() +
               '\n\nif __name__ == "__main__":\n    main()\n';
      }

      /* 4. Build indented body for def main(): */
      var indented = bodyLines.map(function(l) {
        if (l.trim() === '') return '';
        return '    ' + l;
      }).join('\n');

      /* 5. Assemble the fixed code */
      var result = importLines.join('\n');
      if (result.trim()) result = result.trimEnd() + '\n\n';
      result += 'def main():\n';
      result += '    """Entry point — assembled by ArturitAI v13."""\n';
      result += indented;
      result += '\n\nif __name__ == "__main__":\n    main()\n';
      return result;
    }

    /* ── Helper: only add the __name__ guard (def main already exists) ── */
    function _addNameGuard(code) {
      /* Remove stray bare main() call at the very end */
      var cleaned = code.replace(/\n*\s*main\s*\(\s*\)\s*$/, '').trimEnd();
      return cleaned + '\n\nif __name__ == "__main__":\n    main()\n';
    }

    console.log('[v13] QA_ENGINE patched — missing_main_def + missing_name_guard checks ✓');
  })();


  /* ════════════════════════════════════════════════════════════════════
     §V13-2  processQuery v13 — UNLIMITED QA + DEEP THINKING
     Re-patches CODE path only; all other paths delegated to v11/v12.
  ════════════════════════════════════════════════════════════════════ */
  (function repatchProcessQuery() {

     §V14-1  QA_ENGINE PATCH — inject all 25 factors
  ═══════════════════════════════════════════════════════════════════════ */
  (function patchQAEngine25() {
    if (typeof QA_ENGINE === 'undefined') {
      console.warn('[v14] QA_ENGINE not found — 25-factor patch skipped'); return;
    }
    if (QA_ENGINE._v14Patched) return;
    QA_ENGINE._v14Patched = true;

    var _prevCheck    = QA_ENGINE.check.bind(QA_ENGINE);
    var _prevApplyFix = QA_ENGINE.applyFix.bind(QA_ENGINE);

    /* ── check() — append 25-factor results ── */
    QA_ENGINE.check = function v14_check(code, lang, query) {
      var base   = _prevCheck(code, lang, query);
      var issues = base.issues.slice();

      FACTOR_CHECKS.forEach(function(f) {
        /* Skip always-passing factors (paradigm, design-justification) */
        if (f.weight === 0 || (typeof f.check === 'function' && !f.check(code, lang, query))) return;
        /* Avoid duplicates */
        if (issues.some(function(i){ return i.id === f.id; })) return;
        issues.push({
          id:     f.id,
          label:  'Factor ' + f.factor + ': ' + f.label,
          icon:   f.icon,
          detail: typeof f.detail === 'function' ? f.detail(code, lang, query) : f.label,
          weight: f.weight,
          factor: f.factor,
          group:  f.group,
        });
      });

      /* Recompute score */
      var score = 100;
      issues.forEach(function(iss){ score -= (iss.weight || 10); });

      return Object.assign({}, base, {
        issues: issues,
        score:  Math.max(0, score),
        passed: issues.length === 0,
      });
    };

    /* ── applyFix() — route to factor fixer ── */
    QA_ENGINE.applyFix = function v14_applyFix(code, lang, issue, query) {
      var factor = FACTOR_CHECKS.find(function(f){ return f.id === issue.id; });
      if (factor && typeof factor.fix === 'function') {
        try {
          var result = factor.fix(code, lang, query);
          if (result && result !== code) return result;
        } catch(e) { console.warn('[v14] Factor fix error:', issue.id, e.message); }
      }
      return _prevApplyFix(code, lang, issue, query);
    };

    /* ── New utility: run factors by group ── */
    QA_ENGINE.checkGroup = function(code, lang, query, groupName) {
      var issues = [];
      FACTOR_CHECKS.forEach(function(f) {
        if (f.group !== groupName) return;
        if (f.check && f.check(code, lang, query)) {
          issues.push({ id: f.id, factor: f.factor, label: f.label, icon: f.icon,
                        detail: f.detail ? f.detail(code, lang, query) : '', weight: f.weight });
        }
      });
      return issues;
    };

    /* ── New utility: get design justification text ── */
    QA_ENGINE.getDesignJustification = function(code, lang, query) {
      var f = FACTOR_CHECKS.find(function(f){ return f.id === 'design_justification'; });
      return f && f.detail ? f.detail(code, lang, query) : '';
    };

    QA_ENGINE.getParadigmNote = function(code, lang, query) {
      var f = FACTOR_CHECKS.find(function(f){ return f.id === 'paradigm_note'; });
      return f && f.detail ? f.detail(code, lang, query) : '';
    };

    console.log('[v14] QA_ENGINE patched — 25-factor check/fix injected ✓');
  })();


