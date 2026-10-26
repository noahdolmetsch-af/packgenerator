/**
 * Einzelidee 31 «Tastenkürzel nach und nach» (996 Ideen, Noah 25.10.2026): on a computer, after you clicked
 * the same place in the sidebar (or «New») HINT_AT times with the mouse, the app shows its shortcut once,
 * instead of a long list. Each shortcut is shown at most once; «No more shortcut tips» switches them off.
 * Kept on this device only (localStorage HINT_KEY { n: { key: clicks }, shown: [key], off }).
 * Pure apart from the two storage helpers; tested in tests/ichideen.test.js.
 */
export const HINT_KEY = 'keys.hint';
export const HINT_AT = 4;

export function hintStateOf(v) {
  const o = v && typeof v === 'object' ? v : {};
  const n = {};
  if (o.n && typeof o.n === 'object') for (const [k, c] of Object.entries(o.n)) if (Number.isInteger(c) && c > 0) n[k] = c;
  return { n, shown: Array.isArray(o.shown) ? o.shown.filter((x) => typeof x === 'string') : [], off: o.off === true };
}

/** One mouse click on `key` (a place letter, or 'new'). → { state, hint } (hint: the key to show now, or null). */
export function countClick(state, key) {
  const s = hintStateOf(state);
  if (!key || s.off || s.shown.includes(key)) return { state: s, hint: null };
  const c = (s.n[key] ?? 0) + 1;
  if (c >= HINT_AT) {
    const { [key]: _, ...rest } = s.n;
    return { state: { ...s, n: rest, shown: [...s.shown, key] }, hint: key };
  }
  return { state: { ...s, n: { ...s.n, [key]: c } }, hint: null };
}

/** The keys to press for a hint: «new» → ['N'], a place letter → ['g', letter]. */
export const keysOf = (key) => (key === 'new' ? ['N'] : ['g', key]);

export function readHint() {
  try {
    return hintStateOf(JSON.parse(localStorage.getItem(HINT_KEY) ?? 'null'));
  } catch {
    return hintStateOf(null);
  }
}
export function writeHint(s) {
  try {
    localStorage.setItem(HINT_KEY, JSON.stringify(s));
  } catch {
    /* private mode: no tips kept */
  }
}
