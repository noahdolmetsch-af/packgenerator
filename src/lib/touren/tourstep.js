/**
 * «Eine Tour, eine Seite» (UI-Ziele #5, #8, #10, Noah 20.10.2026 «alle freigegeben»): what the one tour page
 * needs to know about where a trip stands. Pure functions, tested in tests/tourstep.test.js.
 *
 *   - countdownOf: the warm chip on the drawn head (#10): «Noch kein Datum», «Morgen», «In 5 Tagen»,
 *     «Tag 2 von 3», «Zurück seit gestern», «Zurück seit 2 Tagen».
 *   - sayOf: one sentence with a number under the head (#10).
 *   - missingOf / missingText: «Fehlt noch: Wetter und Strecke. Beides geht auch später.» on Planen (#5).
 *   - kpisShown: only the key figures that have a value (#8).
 */
import { tripEnd } from '../tripstate.js';

const day0 = (iso) => Date.parse(`${iso}T00:00:00Z`);
/** Whole days from a to b (YYYY-MM-DD). */
export const daysBetween = (a, b) => Math.round((day0(b) - day0(a)) / 864e5);

/**
 * Where the trip stands in time. → { key, vars } for t(), or null without a trip.
 * key: 'No date yet' | 'Today' | 'Tomorrow' | 'In {n} days' | 'Day {n} of {m}' | 'Back since today' |
 *      'Back since yesterday' | 'Back for {n} days'
 * The one source for every countdown: the tour page's chip and Today's countdown (heute.js countdown).
 * byDate: only the dates count (Today shows a trip ended early as under way until its last day).
 */
export function countdownOf(trip, today, { byDate = false } = {}) {
  if (!trip) return null;
  const start = trip.startDate;
  if (!start) return { key: 'No date yet', vars: {} };
  const end = tripEnd(trip) ?? start;
  const days = Math.max(1, daysBetween(start, end) + 1);
  if (today < start) {
    const n = daysBetween(today, start);
    return n === 1 ? { key: 'Tomorrow|tour', vars: {} } : { key: 'In {n} days|tour', vars: { n } };
  }
  const finished = !byDate && trip.finished;
  if (today <= end && !finished) {
    if (days === 1) return { key: 'Today|tour', vars: {} };
    return { key: 'Day {n} of {m}|tour', vars: { n: daysBetween(start, today) + 1, m: days } };
  }
  const back = Math.max(0, daysBetween(finished && today <= end ? today : end, today));
  if (back === 0) return { key: 'Back since today', vars: {} };
  if (back === 1) return { key: 'Back since yesterday', vars: {} };
  return { key: 'Back for {n} days', vars: { n: back } };
}

/**
 * One sentence with a number (#10), or null. km: the km of the tour (ridden or planned); items: packed
 * things; open: things not packed yet.
 */
export function sayOf(trip, today, { km = null, items = 0, open = 0 } = {}) {
  const c = countdownOf(trip, today);
  if (!c) return null;
  const kmR = km > 0 ? Math.round(km) : null;
  if (c.key === 'In {n} days|tour' || c.key === 'Tomorrow|tour') {
    if (items && open) return { key: '{open} of {n} things still to pack.', vars: { open, n: items } };
    if (kmR) return { key: '{km} km are waiting for you.', vars: { km: kmR } };
    return null;
  }
  if (c.key === 'Day {n} of {m}|tour' || c.key === 'Today|tour') return kmR ? { key: '{km} km on this tour.', vars: { km: kmR } } : null;
  if (c.key === 'No date yet') return null;
  return kmR ? { key: '{km} km behind you.', vars: { km: kmR } } : null;
}

/** What Planen still misses: 'weather' (no forecast set), 'route' (no route), 'weights' (things without a weight). */
export function missingOf(trip, { unweighed = 0, bike = true } = {}) {
  if (!trip) return [];
  const out = [];
  const wx = trip.wx ?? {};
  if (wx.min == null && wx.max == null) out.push('weather');
  if (bike && !trip.route?.km && !(trip.route?.line?.length > 1) && !trip.route?.komoot) out.push('route');
  if (unweighed > 0) out.push('weights');
  return out;
}

/** The names of what is missing, for t(). */
export const MISSING_NAMES = { weather: 'Weather|missing', route: 'Route|missing', weights: '{n} weights|missing' };

/**
 * The sentence «Fehlt noch: Wetter und Strecke. Beides geht auch später.» from missingOf. → { parts, key }
 * parts: [{ key, vars }] to join with «und»; key: the closing sentence by the count (one, both, all).
 */
export function missingText(keys = [], { unweighed = 0 } = {}) {
  if (!keys.length) return null;
  const parts = keys.map((k) => (k === 'weights' && unweighed === 1 ? { key: 'One weight|missing', vars: {} } : { key: MISSING_NAMES[k], vars: k === 'weights' ? { n: unweighed } : {} }));
  const close = keys.length === 1 ? 'That can also come later.' : keys.length === 2 ? 'Both can also come later.' : 'All of it can also come later.';
  return { parts, close };
}

/** #8: only the key figures with a value (an empty value is left out, not shown as «–»). */
export function kpisShown(kpis = [], valueOf = () => null) {
  return kpis.filter((k) => {
    const v = valueOf(k);
    return v != null && !(typeof v === 'number' && !Number.isFinite(v)) && v !== 0;
  });
}

/** A trip with a packing list (the steps Planen to Rückblick exist); a ride only from Strava has only Auswertung. */
export const hasSteps = (trip) => !!trip && !(trip.fromActs?.length && !(trip.entries ?? []).length);
