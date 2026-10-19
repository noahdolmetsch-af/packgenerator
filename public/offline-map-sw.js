/*
 * Paket U3 «Karte offline» (Noah 19.10.2026 «3a und b möglich»): the service worker part that answers
 * the map's normal requests from the strips kept on this device. Loaded into the generated worker with
 * importScripts (vite.config.js workbox.importScripts), so this listener runs before Workbox's routes.
 *
 * - Only for OFFLINE_HOSTS and only for URLs a strip holds (an in-memory list of the cache's keys,
 *   reloaded when the app says the cache changed): every other request goes on to Workbox (the
 *   swisstopo route «swisstopo-tiles» stays) or the network, untouched.
 * - Tiles, sprites and fonts: from the cache. The style and the TileJSON: the network first (the free
 *   map's newest version), the kept copy when there is no internet (then it points at the kept tiles).
 *
 * Mirror of src/lib/map/sources.js (OFFLINE_CACHE, OFFLINE_HOSTS): tests/map-offline.test.js checks
 * that both say the same.
 */
(function () {
  var CACHE = 'pg-offline-map';
  var HOSTS = ['wmts.geo.admin.ch', 'tiles.openfreemap.org'];
  var NET_MS = 4000; // the style and TileJSON: wait this long for the network, then the kept copy

  var keys = null; // Set of the cached URLs, or null while loading
  var loading = null;

  function load() {
    loading = caches
      .open(CACHE)
      .then(function (c) {
        return c.keys();
      })
      .then(function (rs) {
        keys = new Set(
          rs.map(function (r) {
            return r.url;
          }),
        );
        return keys;
      })
      .catch(function () {
        keys = new Set();
        return keys;
      });
    return loading;
  }

  /** 'skip' (not a map host), 'tile' (tiles, sprites, fonts: cache first) or 'meta' (network first). */
  function kindOf(url) {
    var u;
    try {
      u = new URL(url);
    } catch (e) {
      return 'skip';
    }
    if (HOSTS.indexOf(u.hostname) < 0) return 'skip';
    if (/\/\d+\/\d+\/\d+\.[a-z0-9]+$/i.test(u.pathname) || /\/fonts\//.test(u.pathname) || /\/sprites?\//.test(u.pathname)) return 'tile';
    return 'meta';
  }

  /** What to do with a request: 'pass' (leave it), 'wait' (list still loading), 'cache' or 'network-first'. */
  function decide(method, url, set) {
    if (method !== 'GET') return 'pass';
    var kind = kindOf(url);
    if (kind === 'skip') return 'pass';
    if (!set) return 'wait';
    if (!set.has(url)) return 'pass';
    return kind === 'tile' ? 'cache' : 'network-first';
  }

  function fromCache(req) {
    return caches.open(CACHE).then(function (c) {
      return c.match(req.url, { ignoreSearch: false, ignoreVary: true });
    });
  }

  function answer(how, req) {
    if (how === 'cache')
      return fromCache(req).then(function (hit) {
        return hit || fetch(req);
      });
    if (how === 'network-first') {
      var net = new Promise(function (resolve, reject) {
        var timer = setTimeout(function () {
          reject(new Error('slow'));
        }, NET_MS);
        fetch(req).then(
          function (r) {
            clearTimeout(timer);
            if (r && r.ok) resolve(r);
            else reject(new Error('not ok'));
          },
          function (e) {
            clearTimeout(timer);
            reject(e);
          },
        );
      });
      return net.catch(function () {
        return fromCache(req).then(function (hit) {
          return hit || fetch(req);
        });
      });
    }
    return fetch(req);
  }

  // for tests/map-offline.test.js (the file is evaluated there with a stand-in `self`)
  self.__pgOfflineMap = { CACHE: CACHE, HOSTS: HOSTS, kindOf: kindOf, decide: decide };

  if (typeof self.addEventListener !== 'function') return;
  load();
  self.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'pg-offline-map') load();
  });
  self.addEventListener('fetch', function (event) {
    var req = event.request;
    var how = decide(req.method, req.url, keys);
    if (how === 'pass') return;
    if (how === 'wait') {
      // the worker just started: wait for the list, then decide (a miss goes to the network)
      event.respondWith(
        (loading || load()).then(function (set) {
          var again = decide(req.method, req.url, set);
          return again === 'pass' ? fetch(req) : answer(again, req);
        }),
      );
      return;
    }
    event.respondWith(answer(how, req));
  });
})();
