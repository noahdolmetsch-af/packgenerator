/**
 * v0.101.0 Design-Refresh P2 «Heute» (H1, Noah 12.10.2026 «h1-h6 freigeben»): the pure rules of the new
 * tiles on Today, each marked «neu» for two weeks. Nothing new is stored; they read what is there.
 * - This week: Monday to Sunday, what was done each day (rides with km, Im Flow ticks).
 * - Bike this month: the km ridden this month, against the same days of last month.
 * - Next milestone: the bike closest to its next 1000 km, else the next number of trips.
 * - A year ago: a trip that started around this day a year ago, with a line from its debrief.
 * Tested in tests/bausteine.test.js.
 */
import { TRIP_STEPS } from './heute.js';

const ms = (iso) => Date.parse(`${iso}T00:00:00Z`);
const iso = (n) => new Date(n).toISOString().slice(0, 10);
const addDays = (d, n) => iso(ms(d) + n * 864e5);
const dayOf = (x) => (typeof x === 'string' && /^\d{4}-\d{2}-\d{2}/.test(x) ? x.slice(0, 10) : null);

/** The 7 days of the week of `today` (Monday first): [{ day, rides: km, acts: [actId], future }]. */
export function weekDays({ today, log = [], rides = [] }) {
  const d = new Date(`${today}T00:00:00Z`);
  const monday = addDays(today, -((d.getUTCDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(monday, i);
    const rs = rides.filter((r) => dayOf(r?.date) === day);
    const acts = [...new Set(log.filter((e) => dayOf(e?.day) === day && e.actId).map((e) => e.actId))];
    return { day, ride: rs.length > 0, km: Math.round(rs.reduce((s, r) => s + (Number(r.km) || 0), 0)), hm: Math.round(rs.reduce((s, r) => s + (Number.isFinite(r?.gainM) ? r.gainM : 0), 0)), acts, future: day > today };
  });
}
/** «Werte überall» WU1: km and metres climbed of the week so far. */
export const weekTotals = (days = []) => ({ km: days.reduce((s, x) => s + (x.km || 0), 0), hm: days.reduce((s, x) => s + (x.hm || 0), 0) });
/** How many of those days had anything. */
export const activeCount = (days = []) => days.filter((x) => !x.future && (x.ride || x.acts.length)).length;

/**
 * km ridden this month up to today, and the change against the same days of last month in % (null when
 * last month had none). → { km, pct }
 */
export function monthKm(rides = [], today) {
  const [y, m, dd] = today.split('-').map(Number);
  const from = `${today.slice(0, 7)}-01`;
  const prev = new Date(Date.UTC(y, m - 2, 1));
  const pFrom = iso(prev.getTime());
  const pLast = new Date(Date.UTC(y, m - 1, 0)).getUTCDate();
  const pTo = `${pFrom.slice(0, 7)}-${String(Math.min(dd, pLast)).padStart(2, '0')}`;
  const sum = (a, b) => rides.filter((r) => dayOf(r?.date) && dayOf(r.date) >= a && dayOf(r.date) <= b).reduce((s, r) => s + (Number(r.km) || 0), 0);
  const km = Math.round(sum(from, today));
  const before = sum(pFrom, pTo);
  // «Werte überall» WU1/WU2: the metres climbed this month (rides that know them)
  const hm = Math.round(rides.filter((r) => dayOf(r?.date) && dayOf(r.date) >= from && dayOf(r.date) <= today && Number.isFinite(r.gainM)).reduce((s, r) => s + r.gainM, 0));
  return { km, pct: before > 0 ? Math.round(((km - before) / before) * 100) : null, hm };
}

/**
 * The next milestone: { kind: 'bike', bike, at, left, share } for the bike closest to its next full
 * 1000 km, else { kind: 'trips', at, left, share } for the next number of trips; null when nothing counts.
 */
export function nextMilestone({ bikes = [], tripsDone = 0 } = {}) {
  const near = bikes
    .filter((b) => typeof b.km === 'number' && b.km > 0)
    .map((b) => {
      const at = (Math.floor(b.km / 1000) + 1) * 1000;
      return { kind: 'bike', bike: b.name ?? '', bikeId: b.id, at, left: Math.round(at - b.km), share: (b.km % 1000) / 1000 };
    })
    .sort((a, b) => a.left - b.left)[0];
  if (near) return near;
  const at = TRIP_STEPS.find((s) => s > tripsDone);
  if (!at || !tripsDone) return null;
  const below = TRIP_STEPS.filter((s) => s <= tripsDone).at(-1) ?? 0;
  return { kind: 'trips', at, left: at - tripsDone, share: (tripsDone - below) / (at - below) };
}

/**
 * A trip that started within `span` days around this day one year ago (the closest), with a line from
 * its debrief. → { trip, note } or null.
 */
export function yearAgo({ trips = [], debriefs = [], today, span = 14 }) {
  const [y] = today.split('-');
  const then = `${Number(y) - 1}${today.slice(4)}`.replace(/-02-29$/, '-02-28');
  const best = trips
    .filter((x) => !x.skipped && dayOf(x.startDate) && Math.abs(ms(x.startDate) - ms(then)) <= span * 864e5)
    .sort((a, b) => Math.abs(ms(a.startDate) - ms(then)) - Math.abs(ms(b.startDate) - ms(then)))[0];
  if (!best) return null;
  const d = debriefs.find((x) => x.tripId === best.id && typeof x.note === 'string' && x.note.trim());
  return { trip: best, note: d ? d.note.trim().split('\n')[0].slice(0, 90) : '' };
}
