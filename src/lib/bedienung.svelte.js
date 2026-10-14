/**
 * Bedienung (Noah 13.10.2026 23:52 and 23:56): the live switches (see bedienung.js for what each does).
 * Read once at the start (main.js initOps, before the app is drawn), kept on this device. contrast sets
 * data-contrast="high" on <html>; app.css makes text and lines stronger there. The start place (FE18,
 * with «Last place» = FE11) turns a plain start address into the chosen page; every page change is
 * kept as the last place.
 */
import { OPS, OPS_KEY, opOf, buzzNow, START_KEY, LAST_KEY, SEEN_KEY, startOf, lastOf, startHash, DEFAULT_START } from './bedienung.js';
import { quietNow } from './quiet.js';
import { miniAppOf } from './miniapps.js';

export const ops = $state({ ...Object.fromEntries(OPS.map((o) => [o.key, o.on])), start: DEFAULT_START });

const get = (k) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null; // private mode: the defaults
  }
};
const put = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* private mode: only this visit */
  }
};

function apply() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (ops.contrast) root.dataset.contrast = 'high';
  else delete root.dataset.contrast;
}

/** Read the stored switches, set the contrast on <html>, open the start place, keep the last place. */
export function initOps() {
  for (const o of OPS) ops[o.key] = opOf(o.key, get(OPS_KEY + o.key));
  ops.start = startOf(get(START_KEY));
  apply();
  if (typeof location === 'undefined') return;
  // Regeln der App (14.10.2026): a small app starts on its own area and is never kept as the whole app's
  // last place; «App öffnen bei» is for the whole app only
  if (miniAppOf(location.pathname)) return;
  let nav = '';
  try {
    nav = performance.getEntriesByType('navigation')[0]?.type ?? '';
  } catch {
    /* an old browser: no pause rule */
  }
  const to = startHash({ start: ops.start, last: get(LAST_KEY), hash: location.hash, search: location.search, nav, seen: get(SEEN_KEY) });
  if (to) history.replaceState(null, '', `${location.pathname}${to}`);
  const seen = () => put(SEEN_KEY, String(Date.now()));
  const keep = () => {
    const h = lastOf(location.hash);
    if (h) put(LAST_KEY, h);
    seen();
  };
  keep();
  window.addEventListener('hashchange', keep);
  // 1b: the last moment the app was used, so a tab that comes back after a pause starts at the start place
  window.addEventListener('pagehide', seen);
  document.addEventListener('visibilitychange', seen);
}

export function setOp(key, on) {
  if (!OPS.some((o) => o.key === key)) return;
  ops[key] = !!on;
  put(OPS_KEY + key, ops[key] ? '1' : '0');
  apply();
}

/** FE18: where the app opens (today | pack | active | last). */
export function setStart(key) {
  ops.start = startOf(key);
  put(START_KEY, ops.start);
}

/** FE7: a short buzz when an item is ticked, when switched on. */
export const buzz = () => ops.buzz && buzzNow();
/** FE8: Today keeps its tips back now. */
export const quietHome = (now = new Date()) => quietNow(now, ops.quiet);
