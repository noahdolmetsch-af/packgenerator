/**
 * «Heute erholen» / «Welcher Berg ruft?» (Noah 24.11.2026 «1-5», Leitfaden «Die App kennt meine Daten und schlägt vor»):
 * ONE quiet sentence under the greeting, counted from the answer of the day (form.js: form, sleep, HRV, resting pulse),
 * the zone minutes of the week (bodyhints.js loadHint) and the weather of today. Only a suggestion, never a diagnosis,
 * never a value judgement; it says what fits today and leads to the page that shows why. «Not today» puts it away for the day.
 * Pure; tests/tagessatz.test.js.
 */

/** localStorage key: the day (YYYY-MM-DD) the sentence was put away. */
export const NOT_TODAY_KEY = 'tagessatzNichtHeute';

/**
 * level: 'rest' | 'easy' | 'normal' | 'hard' (readiness().level, already the answer of the day) or null.
 * azm: loadHint() of bodyhints.js or null (zone minutes of the last 7 days far from your usual week).
 * dry: true / false when the forecast of today is known (dayDry), null when unknown.
 * → { kind, text, href } | null. `text` is an English key for t(); href is a hash address.
 */
export function tagesSatz({ level = null, azm = null, dry = null } = {}) {
  if (!level) return null;
  const busyWeek = azm?.dir > 0;
  if (level === 'rest') return { kind: 'rest', text: 'Rest today: your values say so quietly.', href: '#/flow/form' };
  if (level === 'easy') return { kind: 'easy', text: 'An easy day: a calm ride or a walk fits.', href: '#/flow/form' };
  if (level === 'normal') return busyWeek ? { kind: 'calm', text: 'A busy week behind you: today may be calm.', href: '#/flow/stats/azm' } : null;
  if (level === 'hard') {
    if (busyWeek) return { kind: 'calm', text: 'A busy week behind you: today may be calm.', href: '#/flow/stats/azm' };
    if (dry === false) return { kind: 'wet', text: 'Today works well, but it rains: inside, or later.', href: '#/wetter' };
    return { kind: 'berg', text: 'Today works well: which mountain calls?', href: '#/flow/gipfelbuch' };
  }
  return null;
}

/** Is the sentence put away for this day? */
export const putAway = (stored, today) => !!stored && stored === today;
