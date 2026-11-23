// «Neuer Schwung» Aufklappen (Noah 26.10.2026 «2a», 27.10.2026 «alle offen, gemerkt»): which areas of Today are
// folded on this phone. All areas start open; the list lives per device in localStorage and never blocks the page.
export const FOLD_KEY = 'pg.homeFolded';

export function readFolded(store = globalThis.localStorage) {
  try {
    const v = JSON.parse(store?.getItem(FOLD_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function writeFolded(list, store = globalThis.localStorage) {
  try {
    if (list.length) store?.setItem(FOLD_KEY, JSON.stringify(list));
    else store?.removeItem(FOLD_KEY);
  } catch {
    /* private window or blocked storage: the fold just is not remembered */
  }
}

export const toggleFold = (list, key) => (list.includes(key) ? list.filter((x) => x !== key) : [...list, key]);

// Heute aufräumen (23.11.2026): the one closed line «More» under the first areas; closed at the start, the device remembers it.
export const MORE_KEY = 'pg.homeMoreOpen';
export function readMoreOpen(store = globalThis.localStorage) {
  try {
    return store?.getItem(MORE_KEY) === '1';
  } catch {
    return false;
  }
}
export function writeMoreOpen(open, store = globalThis.localStorage) {
  try {
    if (open) store?.setItem(MORE_KEY, '1');
    else store?.removeItem(MORE_KEY);
  } catch {
    /* private window or blocked storage: it just is not remembered */
  }
}
