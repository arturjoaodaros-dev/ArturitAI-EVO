/* ═══════════════════════════════════════════════════════════════════════════
   service-worker.js  —  ArturitAI PWA Service Worker
   Strategy: Cache-first for static assets, network-first for API calls.
   Provides offline fallback so the app loads even without connectivity.
   ═══════════════════════════════════════════════════════════════════════════ */

var CACHE_NAME    = 'arturitai-v15';
var OFFLINE_URL   = 'index.html';

/* Static assets to pre-cache on install */
var PRECACHE_URLS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/split.js',
  '/js/knowledge.js',
  '/js/qa.js',
  '/js/executor.js',
  '/js/thinking.js',
  '/js/engine.js',
  '/js/ui.js',
  '/js/main.js',
  '/manifest.json',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
];

/* CDN resources we want to cache after first fetch */
var CDN_CACHE_NAME = 'arturitai-cdn-v15';
var CDN_ORIGINS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net',
];

/* ── Install: pre-cache local assets ─────────────────────────────────────── */
self.addEventListener('install', function (event) {
  console.log('[SW] Installing v15…');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE_URLS).catch(function (err) {
        console.warn('[SW] Pre-cache partial failure (ok during dev):', err.message);
      });
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

/* ── Activate: clean up old caches ──────────────────────────────────────── */
self.addEventListener('activate', function (event) {
  console.log('[SW] Activating…');
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) {
          return k !== CACHE_NAME && k !== CDN_CACHE_NAME;
        }).map(function (k) {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* ── Fetch: serve from cache, fall back to network ──────────────────────── */
self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);

  /* Skip non-GET requests and browser-extension requests */
  if (event.request.method !== 'GET') return;
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return;

  /* Skip API calls and Pyodide WASM (too large / dynamic) */
  if (url.hostname === 'api.anthropic.com') return;
  if (url.pathname.includes('pyodide') && url.pathname.endsWith('.wasm')) return;
  if (url.hostname === 'en.wikipedia.org') return;
  if (url.hostname === 'api.duckduckgo.com') return;

  /* CDN resources: cache after first fetch */
  var isCDN = CDN_ORIGINS.some(function (origin) {
    return url.hostname.includes(origin);
  });

  if (isCDN) {
    event.respondWith(
      caches.open(CDN_CACHE_NAME).then(function (cache) {
        return cache.match(event.request).then(function (cached) {
          if (cached) return cached;
          return fetch(event.request).then(function (response) {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          }).catch(function () {
            return new Response('/* CDN resource unavailable offline */', {
              headers: { 'Content-Type': 'text/css' }
            });
          });
        });
      })
    );
    return;
  }

  /* Local assets: cache-first */
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;

      return fetch(event.request).then(function (response) {
        /* Cache successful responses for local assets */
        if (response.ok && url.origin === self.location.origin) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, copy);
          });
        }
        return response;
      }).catch(function () {
        /* Offline fallback: serve index.html for navigation requests */
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
        return new Response('', { status: 503, statusText: 'Offline' });
      });
    })
  );
});

/* ── Background sync stub (future: queue offline messages) ──────────────── */
self.addEventListener('sync', function (event) {
  if (event.tag === 'sync-messages') {
    console.log('[SW] Background sync: sync-messages');
    /* TODO: replay queued offline messages */
  }
});

console.log('[SW] ArturitAI service worker v15 loaded');
