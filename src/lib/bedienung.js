/**
 * Bedienung (Noah 13.10.2026 23:52 and 23:56, FE2 FE6 FE7 FE8 FE10 FE11 FE17 FE18): small helps for using
 * the app, each one a switch in Ich › Darstellung › Bedienung, only on this device (localStorage), never
 * mandatory.
 * - speak: the microphone button in note fields (FE10), on by default
 * - keys: keyboard shortcuts on a computer (FE6), on by default
 * - buzz: a short vibration when ticking off while packing (FE7), on by default
 * - quiet: night quiet on Today, 22–06 no tips (FE8), on by default
 * - search: the search offers go-to actions too (FE17), on by default
 * - path: the path line above every page (Noah 28.10.2026 «1a»), on by default
 * - explore: Explorer mode (Noah 28.10.2026 «1a»): a tap on a tile shows where it comes from instead of opening it, off by default
 * - contrast: high contrast for the sun outdoors (FE2), off by default
 * The pure part; bedienung.svelte.js holds the live state.
 */
export const OPS = [
  { key: 'speak', name: 'Speak instead of type', text: 'A microphone in note fields, where the browser can turn speech into text.', on: true },
  { key: 'keys', name: 'Keyboard shortcuts', text: 'On a computer: N new, / search, ? the list.', on: true },
  { key: 'buzz', name: 'Short vibration when ticking', text: 'A short buzz when you tick off an item while packing, where the phone can.', on: true },
  { key: 'quiet', name: 'Night quiet', text: 'From 22:00 to 06:00 Today shows no tips.', on: true },
  { key: 'search', name: 'Search can act', text: 'The search also offers backup, settings, a quick note or a bike.', on: true },
  { key: 'path', name: 'Show the path on every page', text: 'A quiet line above the title, for example Plan › Week, so you see where you are. Pages with their own path keep it.', on: true },
  { key: 'explore', name: 'Explorer mode', text: 'A tap on a tile with an «i» shows where it comes from instead of opening it. Switch it off in the bar at the top.', on: false },
  { key: 'contrast', name: 'High contrast (outdoors)', text: 'Darker text and stronger lines, easier to read in the sun.', on: false },
];
export const OPS_KEY = 'ops.';

/** The stored value ('1' | '0' | null) or the default of that switch. */
export function opOf(key, stored) {
  if (stored === '1') return true;
  if (stored === '0') return false;
  return !!OPS.find((o) => o.key === key)?.on;
}

/** Vibrate shortly where the device can (FE7); never throws. */
export function buzzNow(nav = typeof navigator !== 'undefined' ? navigator : null, ms = 15) {
  try {
    if (typeof nav?.vibrate !== 'function') return false;
    return nav.vibrate(ms) !== false;
  } catch {
    return false;
  }
}

/* ---------- FE18 «Startort» and FE11 «Weitermachen, wo du warst» (Noah 13.10.2026 23:56) ----------
 * Where the app opens: Today (default), the packing list, Active, or the last place opened («Last place»
 * is FE11). Only when the app opens at its plain address: a link to a page, a shared text or an app
 * shortcut always wins. The last place is kept without its ?… part and never as a page that opens a
 * dialog or an in-between step, so a start never reopens a dialog.
 */
export const START_PLACES = [
  { key: 'today', name: 'Today|place', href: '#/' },
  { key: 'pack', name: 'Packing|start', href: '#/pack' },
  { key: 'active', name: 'Active|place', href: '#/flow' },
  { key: 'last', name: 'Last place', href: null },
];
export const DEFAULT_START = 'today';
export const START_KEY = 'ops.start';
export const LAST_KEY = 'ops.last';

export const startOf = (v) => (START_PLACES.some((p) => p.key === v) ? v : DEFAULT_START);

/** The address to keep as «last place», or null (a dialog, a shared list, an in-between step). */
export function lastOf(hash = '') {
  const h = String(hash ?? '').split('?')[0];
  if (!h.startsWith('#/')) return null;
  if (/^#\/(share|trip)\//.test(h) || /\/(new|edit)(\/|$)/.test(h)) return null;
  return h;
}

/* Regeln App-Start 1b (Noah 14.10.2026 19:59): a tab that opens again after a pause (a restored browser
 * tab, a tab woken up the next day) starts at the start place like a plain start; only a reload (F5) or a
 * fresh link right after using the app stays on its page. A pause is AWAY_MS without the app. */
export const SEEN_KEY = 'ops.seen';
export const AWAY_MS = 30 * 60 * 1000;

/**
 * The address to open at the start, or null to stay. hash and search: the address the app was opened
 * with; start: the choice; last: the kept last place; nav: how the page was opened ('reload' | 'navigate'
 * | 'back_forward', '' when the browser cannot tell: then no pause rule); seen and now: when the app was last used and now (ms), to tell a pause.
 */
export function startHash({ start = DEFAULT_START, last = null, hash = '', search = '', nav = '', seen = null, now = Date.now() } = {}) {
  if (new URLSearchParams(search).toString()) return null; // shared text, a Strava return …
  const s = startOf(start);
  const to = s === 'last' ? lastOf(last) : START_PLACES.find((p) => p.key === s).href;
  if (hash && hash !== '#/' && hash !== '#') {
    // a link to a page wins, unless the tab comes back after a pause (1b); shared lists always win
    const page = lastOf(hash);
    const pause = !!nav && nav !== 'reload' && Number(seen) > 0 && now - Number(seen) > AWAY_MS;
    if (!page || !pause) return null;
    const back = to ?? '#/';
    return back === page ? null : back;
  }
  return to && to !== '#/' ? to : null;
}
