/**
 * Idee 50 «Regel mit Ablaufdatum» (Touren b, 996 Ideen): a block's rule («Kommt mit, wenn …», Bausteine) can hold
 * for one tour or until a day (a season) instead of always. Stored next to the rule on the block's record in the
 * settings «sets»: until = { tripId } | { date: 'YYYY-MM-DD' }. While it holds, the rule works as before; for other
 * tours it suggests nothing. Once it is over, the app asks once whether the rule stays (Packen and Bausteine):
 * «Immer behalten» takes the end away, «Nicht mehr vorschlagen» switches the rule off.
 * Pure functions (no Svelte), tested in tests/touren-b.test.js.
 */

const DAY = /^\d{4}-\d\d-\d\d$/;

/** The end made safe: { tripId } or { date }, else null (always). */
export function untilOf(v) {
  if (!v || typeof v !== 'object') return null;
  if (typeof v.tripId === 'string' && v.tripId) return { tripId: v.tripId };
  if (typeof v.date === 'string' && DAY.test(v.date)) return { date: v.date };
  return null;
}

/** The end of a block in the settings «sets» value. */
export const untilIn = (setsValue, key) => untilOf((Array.isArray(setsValue) ? setsValue : []).find((s) => s?.key === key)?.until);

/** Does a rule with this end count for the trip? (no end: always) */
export function ruleHolds(until, trip) {
  const u = untilOf(until);
  if (!u) return true;
  if (u.tripId) return trip?.id === u.tripId;
  return !trip?.startDate || trip.startDate <= u.date;
}

const addDays = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
/** The last day of a trip (start + days − 1), or '' without a start. */
const lastDay = (trip) => (trip?.startDate ? addDays(trip.startDate, Math.max(1, Math.round(Number(trip.days) || 1)) - 1) : '');

/** Is the end over? A tour: it is finished, past its last day or gone. A day: before today. */
export function untilOver(until, trips = [], today = '') {
  const u = untilOf(until);
  if (!u) return false;
  if (u.date) return u.date < today;
  const trip = trips.find((x) => x?.id === u.tripId);
  if (!trip) return true;
  const end = lastDay(trip);
  return trip.finished === true || (!!end && end < today);
}

/** Store a block's end (null: always). A record left with only its key goes. */
export function setUntil(setsValue, key, until) {
  const list = Array.isArray(setsValue) ? setsValue : [];
  const u = untilOf(until);
  const has = list.some((s) => s?.key === key);
  const next = has
    ? list.map((s) => {
        if (s?.key !== key) return s;
        const { until: _, ...rest } = s;
        return u ? { ...rest, until: u } : rest;
      })
    : u
      ? [...list, { key, until: u }]
      : list;
  return next.filter((s) => !(s?.key === key && Object.keys(s).length === 1));
}

/** The blocks whose rule is over and still waits for the answer: [{ key, until }]. */
export function rulesOver(setsValue, trips = [], today = '') {
  return (Array.isArray(setsValue) ? setsValue : []).filter((s) => s?.key && s.until && s.rule?.on !== false && !s.deleted && untilOver(s.until, trips, today)).map((s) => ({ key: s.key, until: untilOf(s.until) }));
}

/** «Nicht mehr vorschlagen»: the rule off and the end gone (the record keeps its name and items). */
export function ruleOff(setsValue, key) {
  const list = Array.isArray(setsValue) ? setsValue : [];
  return setUntil(list.map((s) => (s?.key === key ? { ...s, rule: { ...(s.rule ?? {}), on: false } } : s)), key, null);
}

/** The season ends the sheet offers: the end of this summer (30.9.) or this winter (30.4.), from today. */
export function seasonEnd(today = '') {
  const y = Number(today.slice(0, 4)) || new Date().getFullYear();
  const m = Number(today.slice(5, 7)) || 1;
  if (m >= 5 && m <= 9) return { key: 'summer', date: `${y}-09-30` };
  return { key: 'winter', date: m >= 10 ? `${y + 1}-04-30` : `${y}-04-30` };
}
