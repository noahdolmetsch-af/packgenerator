/**
 * Paket Q #127 «Fehlermeldungen in Alltagssprache mit nächstem Schritt»: instead of a technical text
 * («TypeError: Failed to fetch», «Unexpected token») the app says in plain words what happened and
 * what to do next. A message the app wrote itself (already plain, through t()) stays as it is.
 * Returns an English key for t() or the app's own message. Pure, tested in tests/errors.test.js.
 */

const TECH = /(\b[A-Z][A-Za-z]*Error\b|undefined|null\b|\bNaN\b|JSON|Unexpected (token|end)|Failed to fetch|NetworkError|Load failed|is not a function|Cannot read|Cannot set|is not defined|\bat position\b|Dexie|IDB|Constraint|Key already exists|\(\d{3}\))/;

/** What kind of failure this is: 'offline', 'full', 'file', 'own' (the app's own words) or 'other'. */
export function errorKind(err, online = globalThis.navigator?.onLine !== false) {
  const name = err?.name ?? err?.inner?.name ?? '';
  const msg = String(err?.message ?? err ?? '');
  if (name === 'QuotaExceededError' || /quota/i.test(msg)) return 'full';
  if (!online || /Failed to fetch|NetworkError|Load failed|network/i.test(msg)) return 'offline';
  if (name === 'SyntaxError' || /JSON|Unexpected (token|end)/.test(msg)) return 'file';
  if (msg && !TECH.test(msg) && name !== 'TypeError' && name !== 'ReferenceError') return 'own';
  return 'other';
}

export const NEXT = {
  offline: 'No internet just now. Try again when you are online.',
  full: "This device's storage is full. Delete old photos or rides, then try again.",
  file: 'The file could not be read. Pick the file again; a backup ends in .json.',
  other: 'Try again. If it fails again, reload the page; your data is safe.',
};

/** The plain sentence for an error (English key for t(), or the app's own message). */
export function plainError(err, online) {
  const kind = errorKind(err, online);
  if (kind === 'own') return String(err?.message ?? err);
  console.error(err);
  return NEXT[kind];
}
