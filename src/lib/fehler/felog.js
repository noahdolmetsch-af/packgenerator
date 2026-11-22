// «Fehler-Melder» (Noah 21.11.2026 «a», thread «Prüfungen so einrichten, dass main grün bleibt»): the app quietly notes
// the errors it catches, on THIS device only. Nothing is sent, nothing goes into the backup or the sync; the notes live
// in localStorage (like the Tempo-Messer switch), so they work even when the database itself is what broke.
// An entry holds: the error text (cut, no long quoted pieces), the page (the address without parameters), the time and
// the version. Never a name, a value or a record of the user's.
// Who reads it: the Logbuch takes the entries over with takeErrors() (src/lib/logbuch/fehler.js) and shows them as «Fehler»
// (thread «Neue Verbesserungen finden», L1b); the small card under Ich › Daten is gone.
export const KEY = 'pg.errors';
export const MAX = 30; // the newest 30 stay
export const TEXT_MAX = 200;
const REPEAT_MS = 60_000; // the same error on the same page within a minute is noted once (a loop would fill the list)

// not the app's fault: the network is away, a request was cancelled, the browser's own harmless warning
const NOISE = /ResizeObserver loop|^Script error\.?$|Failed to fetch|NetworkError|Load failed|AbortError|The operation was aborted|The user aborted/i;

/** The address without parameters: «#/trip/abc?x=1» → «#/trip/abc». */
export const pageOf = (hash = '') => String(hash).split('?')[0] || '#/';

/** The error text as a short plain line: web addresses become file names, long quoted pieces (they could be typed text) go. */
export function textOf(error) {
  let s = String(error?.message ?? error ?? '');
  s = s.replace(/https?:\/\/[^\s)'"]+/g, (u) => u.split('?')[0].split('#')[0].split('/').pop() || '(page)');
  s = s.replace(/(["'`«])[^"'`»\n]{25,}?["'`»]/g, '…');
  s = s.replace(/\s+/g, ' ').trim();
  return s.length > TEXT_MAX ? `${s.slice(0, TEXT_MAX - 1)}…` : s;
}

const version = () => (typeof __APP_VERSION__ === 'undefined' ? '' : __APP_VERSION__);

function read(store) {
  try {
    const v = JSON.parse(store.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((e) => e && typeof e.message === 'string') : [];
  } catch {
    return [];
  }
}
function write(store, list) {
  try {
    list.length ? store.setItem(KEY, JSON.stringify(list)) : store.removeItem(KEY);
  } catch {
    /* private mode or full: the note is lost, the app goes on */
  }
}
const storeOf = () => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

/** Note one error. Returns the entry, or null when it was not worth a note. `now` and `store` are for the tests. */
export function recordError(error, { page, now = Date.now(), store = storeOf() } = {}) {
  if (!store) return null;
  const message = textOf(error);
  if (!message || NOISE.test(message)) return null;
  const where = page ?? pageOf(globalThis.location?.hash);
  const list = read(store);
  if (list.some((e) => e.message === message && e.page === where && now - e.at < REPEAT_MS)) return null;
  const entry = { message, page: where, at: now, version: version() };
  write(store, [...list, entry].slice(-MAX));
  return entry;
}

/** The noted errors, oldest first. */
export const list = (store = storeOf()) => (store ? read(store) : []);
export const count = (store = storeOf()) => list(store).length;

/** Hands over the noted errors and forgets them (the Logbuch takes them over). */
export function takeErrors(store = storeOf()) {
  const all = list(store);
  if (all.length && store) write(store, []);
  return all;
}
export const clear = (store = storeOf()) => void (store && write(store, []));

/** One text to copy and send, newest first. */
export const copyText = (entries) =>
  [...entries]
    .reverse()
    .map((e) => `${new Date(e.at).toISOString().slice(0, 16).replace('T', ' ')} UTC · ${e.version || '?'} · ${e.page} · ${e.message}`)
    .join('\n');

/** Listen for errors nobody caught (once). The error pages of App.svelte call recordError themselves. */
export function watchErrors(win = globalThis.window) {
  if (!win) return () => {};
  const onError = (e) => recordError(e.error ?? e.message);
  const onRejection = (e) => recordError(e.reason);
  win.addEventListener('error', onError);
  win.addEventListener('unhandledrejection', onRejection);
  return () => {
    win.removeEventListener('error', onError);
    win.removeEventListener('unhandledrejection', onRejection);
  };
}
