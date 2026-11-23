/**
 * «Form und Erholung klüger» (Noah 23.11.2026 «ja»): ONE answer for today, counted from everything together.
 * Before, the card said «Easy» (42) while the row «Form effect» said «You are fresh», although the HRV was 42 % under the
 * normal and the night 3 h 55: the good form hid two clear warnings. The answer looks at the recovery values (sleep, HRV,
 * resting pulse, the morning check) one by one:
 *   - two or more are clearly low: at most «easy»; when together they pull hard (−30 points or more): «rest, or an easy
 *     half hour», whatever the form says;
 *   - one is very low (−15 or more) on a «ready» day: «normal» instead of «hard».
 * It never raises the level, only lowers it, and it says which values count (the same sentences as «What counts today»).
 * Only a suggestion, no diagnosis. Pure; tests/form-antwort.test.js.
 */
const ORDER = ['rest', 'easy', 'normal', 'hard'];
/** The recovery values (the form is counted apart). */
export const RECOVERY = ['rhr', 'hrv', 'sleep', 'feltSleep', 'energy'];
/** A value is «clearly low» from this many points under zero. */
export const LOW = -8;
/** Two low values together this far down: rest. */
export const LOW_SUM = -30;
/** One value this far down takes «ready» back to «normal». */
export const VERY_LOW = -15;
/** A value is «good» from this many points. */
export const GOOD = 6;

/**
 * r: readiness() of form.js. → { level, adjusted, reasons: [part], good: bool } or null.
 * reasons: the values that explain the answer (the low ones; else the weak ones on a tired day; else the best ones on a good day).
 * good: the form is fresh although values are low (the page then says that the low values weigh more today).
 */
export function dayAnswer(r) {
  if (!r) return null;
  const rec = (r.parts ?? []).filter((p) => RECOVERY.includes(p.key));
  const form = r.formPts != null ? { key: 'form', v: r.form, delta: r.form, points: r.formPts } : null;
  const low = rec.filter((p) => p.points <= LOW).sort((a, b) => a.points - b.points);
  const sum = low.reduce((s, p) => s + p.points, 0);
  const rank = ORDER.indexOf(r.level);
  let level = r.level;
  if (low.length >= 2 && sum <= LOW_SUM) level = 'rest';
  else if (low.length >= 2 && rank > 1) level = 'easy';
  else if (low.length === 1 && low[0].points <= VERY_LOW && r.level === 'hard') level = 'normal';
  if (ORDER.indexOf(level) > rank) level = r.level; // never raise
  const all = [...rec, ...(form ? [form] : [])];
  let reasons;
  if (low.length) reasons = low.slice(0, 3);
  else if (level === 'rest' || level === 'easy') reasons = all.filter((p) => p.points < 0).sort((a, b) => a.points - b.points).slice(0, 2);
  else reasons = all.filter((p) => p.points >= GOOD).sort((a, b) => b.points - a.points).slice(0, 2);
  return { level, adjusted: level !== r.level, reasons, good: low.length > 0 && (r.formPts ?? 0) >= GOOD };
}
