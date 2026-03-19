/* ═══════════════════════════════════════════════════════════════════════════
   js/split.js  —  ArturitAI SplitPrompt v3
   Classifies user input as: CODE | WEB | ANALYZE | CHAT | AMBIGUOUS
   Loaded first so all other modules can call SplitPrompt.classify().
   ═══════════════════════════════════════════════════════════════════════════ */

/* global SplitPrompt */
var SplitPrompt = (function () {
  'use strict';

  /* ── Language detection keywords ── */
  var LANG_KEYWORDS = {
    python:     /\b(python|py3?|django|flask|pandas|numpy|scipy|pytorch|tensorflow)\b/i,
    javascript: /\b(javascript|js|node\.?js|react|vue|angular|typescript|ts)\b/i,
    rust:       /\b(rust|cargo|rustc)\b/i,
    go:         /\b(golang|go\s+lang)\b/i,
    java:       /\b(java|spring|maven|gradle|jvm)\b/i,
    cpp:        /\b(c\+\+|cpp|cmake)\b/i,
    ruby:       /\b(ruby|rails|gem|rake)\b/i,
    kotlin:     /\b(kotlin|android)\b/i,
    swift:      /\b(swift|ios|xcode)\b/i,
    csharp:     /\b(c#|csharp|\.net|dotnet|unity)\b/i,
    php:        /\b(php|laravel|wordpress)\b/i,
    scala:      /\b(scala|spark|akka)\b/i,
    r:          /\b(ggplot|tidyverse|dplyr|\br\s+language)\b/i,
    luau:       /\b(luau|roblox|roblox\s+studio)\b/i,
  };

  /* ── WEB signals (real-time / factual) ── */
  var WEB_SIGNALS = [
    /\b(latest|current|today|now|recent|news|weather|price|stock|rate)\b/i,
    /\b(who is|what is the (ceo|president|prime minister|capital of|population of))\b/i,
    /\b(when did|when was|when is)\b/i,
    /\bhow many (people|countries|states|planets)\b/i,
    /\b\d{4}\s+(champion|winner|election|world cup|oscar|nobel)\b/i,
    /\b(search|look up|find out|tell me about|what happened)\b/i,
  ];

  /* ── CODE signals ── */
  var CODE_SIGNALS = [
    /\b(make|create|write|build|code|program|implement|generate)\b.{0,30}\b(game|app|function|class|script|algorithm|tool|program)\b/i,
    /\b(snake|calculator|todo|fibonacci|factorial|fizzbuzz|palindrome|sort|search|linked.?list|binary.?tree)\b/i,
    /\b(def |function |class |const |let |var |import |from )\b/,
    /\b(error|bug|fix|debug|trace|broken)\b.{0,20}\b(code|script|function|line)\b/i,
    /\b(add|remove|improve|refactor|update|change).{0,20}\b(code|script|function|feature|method)\b/i,
  ];

  /* ── ANALYZE signals (modify/analyze existing code) ── */
  var ANALYZE_SIGNALS = [
    /\b(fix|debug|optimize|refactor|improve|add feature|update)\b.{0,30}\b(code|script|function)\b/i,
    /\b(add restart|add pause|change color|add score|add feature)\b/i,
    /```[\w]*\n[\s\S]+?```/,
  ];

  /* ── CHAT signals (greetings / meta) ── */
  var CHAT_SIGNALS = [
    /^(hi|hello|hey|sup|yo|howdy|greetings|good\s+(morning|afternoon|evening))[!?.\s]*$/i,
    /^(who are you|what are you|what can you do|help me|how do you work)[?.\s]*$/i,
    /^(thanks|thank you|thx|ty|ok|okay|cool|awesome|great|nice)[!?.\s]*$/i,
    /^(bye|goodbye|see you|cya)[!?.\s]*$/i,
  ];

  /* ── Detect language from query ── */
  function _detectLang(q) {
    for (var lang in LANG_KEYWORDS) {
      if (LANG_KEYWORDS[lang].test(q)) return lang;
    }
    /* Fallback: if the query doesn't name a language, default to python */
    return 'python';
  }

  /* ── Weighted scorer ── */
  function _score(q) {
    var scores = { CODE: 0, WEB: 0, ANALYZE: 0, CHAT: 0 };

    WEB_SIGNALS.forEach(function (rx) { if (rx.test(q)) scores.WEB += 15; });
    CODE_SIGNALS.forEach(function (rx) { if (rx.test(q)) scores.CODE += 20; });
    ANALYZE_SIGNALS.forEach(function (rx) { if (rx.test(q)) scores.ANALYZE += 18; });
    CHAT_SIGNALS.forEach(function (rx) { if (rx.test(q)) scores.CHAT += 25; });

    /* Length signal: very short queries lean towards CHAT */
    if (q.split(/\s+/).length < 4) scores.CHAT += 5;

    return scores;
  }

  /* ── Public API ── */
  return {
    /**
     * Classify a query.
     * @param  {string} query
     * @param  {object} [context]  optional { lastCode, lastLang, turnCount }
     * @returns {{ category, type, lang, confidence, scores }}
     */
    classify: function (query, context) {
      var q      = (query || '').trim();
      var scores = _score(q);
      var lang   = _detectLang(q);

      /* Hard overrides: strong WEB patterns */
      for (var w = 0; w < WEB_SIGNALS.length; w++) {
        if (WEB_SIGNALS[w].test(q)) {
          return { category: 'WEB', type: 'WEB', lang: lang,
                   confidence: 0.92, scores: scores, reason: 'factual/real-time signal' };
        }
      }

      /* Hard overrides: strong CODE patterns */
      for (var c = 0; c < CODE_SIGNALS.length; c++) {
        if (CODE_SIGNALS[c].test(q)) {
          return { category: 'CODE', type: 'CODE', lang: lang,
                   confidence: 0.95, scores: scores, reason: 'code/programming signal' };
        }
      }

      /* Find winner by score */
      var winner = 'CODE';
      var max    = 0;
      Object.keys(scores).forEach(function (k) {
        if (scores[k] > max) { max = scores[k]; winner = k; }
      });

      /* If nothing scored, default to CHAT for short queries, else CODE */
      if (max === 0) {
        winner = q.split(/\s+/).length < 5 ? 'CHAT' : 'CODE';
      }

      /* Ambiguous: CODE and WEB neck-and-neck */
      if (Math.abs(scores.CODE - scores.WEB) <= 5 && scores.CODE > 0 && scores.WEB > 0) {
        winner = 'AMBIGUOUS';
      }

      return {
        category:   winner,
        type:       winner,
        lang:       lang,
        confidence: max > 0 ? Math.min(0.97, max / 100) : 0.5,
        scores:     scores,
        reason:     'weighted scoring',
      };
    },

    /* Expose for external patching (v12 patch still works) */
    LANG_KEYWORDS: LANG_KEYWORDS,
  };
})();

window.SplitPrompt = SplitPrompt;
console.log('[split.js] SplitPrompt v3 loaded ✓');
