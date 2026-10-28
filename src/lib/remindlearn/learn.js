/**
 * «Erinnerung zur Zeit, wann du es machst» (idea A2, Noah 27.10.2026 «alle umsetzen 1a 2a 3a 4a 5a»):
 * the app notes when you really do the evening-before check (you open «Gepackt» on the evening before a
 * trip) and, once it knows your usual time, offers to move the reminder there. Nothing changes by itself.
 *
 * settings LEARN_KEY = { eve: [{ day, min }], no: { eve: min } }
 *   eve  the first time you opened the check on each evening before a trip (minutes after midnight,
 *        only from 16:00, the newest MAX_SAMPLES days);
 *   no   the time you said «No, thanks» to: the same offer does not come again.
 * The offer: from MIN_SAMPLES evenings, the middle time (median) minus LEAD minutes, on a step of 15;
 * only when that is at least MIN_GAP minutes away from the reminder today.
 * Pure functions, tested in tests/remindlearn.test.js.
 */
export const LEARN_KEY = 'remindLearn';
export const MAX_SAMPLES = 8;
export const MIN_SAMPLES = 3;
export const FROM_MIN = 16 * 60;
export const LEAD = 15;
export const MIN_GAP = 30;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The stored record made safe. */
export function learnOf(value) {
  const v = value && typeof value === 'object' ? value : {};
  const eve = (Array.isArray(v.eve) ? v.eve : []).filter((s) => s && DAY.test(s.day ?? '') && Number.isInteger(s.min) && s.min >= 0 && s.min < 1440).slice(-MAX_SAMPLES);
  const no = Number.isInteger(v.no?.eve) ? { eve: v.no.eve } : {};
  return { eve, no };
}

/** One more evening: kept only the first time a day, only from 16:00. → the new record (or the same one). */
export function noteEve(value, day, min) {
  const l = learnOf(value);
  if (!DAY.test(day ?? '') || !Number.isInteger(min) || min < FROM_MIN || min >= 1440 || l.eve.some((s) => s.day === day)) return l;
  return { ...l, eve: [...l.eve, { day, min }].slice(-MAX_SAMPLES) };
}

/** The middle of the times (the lower one of the two middles for an even count). */
export function middle(mins) {
  const s = [...mins].sort((a, b) => a - b);
  return s.length ? s[Math.floor((s.length - 1) / 2)] : null;
}

/** The offer for the evening reminder: { usual, at } (minutes) or null. current: today's reminder time. */
export function eveOffer(value, current) {
  const l = learnOf(value);
  if (l.eve.length < MIN_SAMPLES) return null;
  const usual = middle(l.eve.map((s) => s.min));
  const at = Math.min(1425, Math.max(0, Math.floor((usual - LEAD) / 15) * 15));
  if (Math.abs(at - current) < MIN_GAP || l.no.eve === at) return null;
  return { usual, at };
}

/** «No, thanks» to an offer. */
export const declineEve = (value, at) => ({ ...learnOf(value), no: { eve: at } });
