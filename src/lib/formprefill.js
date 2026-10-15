/**
 * v0.127.0 A-U5 «Formulare nutzen vorhandene Daten» (mockup A-U5, Noah 13.10.2026 «A-U1–A-U5 freigeben»,
 * answer 2a): a form fills in what the app already knows. The shared rule (since A-J1 visitprefill.js):
 * a suggested value sits on a green field (class `pre`, app.css) with its origin below («from …», class
 * `prefrom`), and it stays a suggestion: typing or tapping replaces it, nothing is locked. A problem shows at
 * the field before saving (class `fieldmsg`). Pure functions only, tested in tests/formprefill.test.js.
 */
import { hasBike } from './domains.js';
import { freeTitle } from './dayride.js';

/** How many similar trips the riding hours come from. */
export const SIMILAR_N = 3;

/**
 * The riding hours per day of the newest similar trips: bike trips with the same number of days and their
 * own hours (skipped ones and `skipId` left out), newest start first, at most SIMILAR_N. The suggestion is
 * their middle value (median), rounded to half an hour. → { hours, n } or null when there is none.
 */
export function similarHours(trips = [], days = 1, skipId = null) {
  const d = Math.max(1, Number(days) || 1);
  const like = trips
    .filter((x) => x && x.id !== skipId && hasBike(x) && !x.skipped && Math.max(1, Number(x.days) || 1) === d && Number(x.hours) > 0)
    .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? '') || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(0, SIMILAR_N);
  if (!like.length) return null;
  const hs = like.map((x) => Number(x.hours)).sort((a, b) => a - b);
  const mid = hs.length % 2 ? hs[(hs.length - 1) / 2] : (hs[hs.length / 2 - 1] + hs[hs.length / 2]) / 2;
  return { hours: Math.max(0.5, Math.round(mid * 2) / 2), n: like.length };
}

/**
 * The check at the name field: another trip already has this name (case and spaces ignored).
 * → { trip, suggestion } (the other trip and a free name like «Jura (2)») or null.
 */
export function nameClash(title = '', trips = [], skipId = null) {
  const name = String(title).trim();
  if (!name) return null;
  const others = trips.filter((x) => x && x.id !== skipId);
  const trip = others.find((x) => (x.title ?? '').trim().toLowerCase() === name.toLowerCase());
  return trip ? { trip, suggestion: freeTitle(name, others) } : null;
}
