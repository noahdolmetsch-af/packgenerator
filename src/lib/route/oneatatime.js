// OpenStreetMap (Overpass) answers only a few requests of one device at a time; more come back as
// «busy» (429). The live map asked twice at once (the stops around you and the place search), so the
// place search said «OpenStreetMap ist gerade ausgelastet» (Noah 20.10.2026, picture). Now every
// Overpass request of the app waits for the one before it.
//
// Noah 21.10.2026 (picture, 02:35): the stops around him stayed at «Lädt…» and then the place search did
// nothing at all. One request that never answered held up every request after it. So a request now
// gives up after its time (postTimed), and the next one never waits longer than MAX_WAIT_MS for it.
//
// The file name must not contain «overpass»: the browser tests answer every address with that word as Overpass.

/** The longest a request waits for the one before it (ms). */
export const MAX_WAIT_MS = 30_000;
/** The longest one request may take before it gives up (ms). */
export const REQUEST_MS = 35_000;

let chain = Promise.resolve();
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));

/** Run fn after the request before it (at most `wait` ms later); its result or error is passed on. */
export function queued(fn, { wait = MAX_WAIT_MS } = {}) {
  const run = Promise.race([chain, sleep(wait)]).then(() => fn());
  chain = run.catch(() => {});
  return run;
}

/**
 * fetcher(url, init) that gives up after ms: the request is aborted and the error is 'timeout'.
 * A fetcher that does not know signals (tests) still stops waiting.
 */
export async function postTimed(fetcher, url, init = {}, ms = REQUEST_MS) {
  const ctl = typeof AbortController === 'undefined' ? null : new AbortController();
  let timer;
  const late = new Promise((_, no) => {
    timer = setTimeout(() => {
      ctl?.abort();
      no(new Error('timeout'));
    }, ms);
  });
  try {
    return await Promise.race([fetcher(url, { ...init, ...(ctl ? { signal: ctl.signal } : {}) }), late]);
  } finally {
    clearTimeout(timer);
  }
}
