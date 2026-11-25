/**
 * «Dein Stand in Zahlen» on Velos und Material (Noah 24.11.2026 «b», thread «Mini-Landingpage pro Bereich bauen»):
 * the three big numbers and the twelve months of km, read from what is already there (nothing new is stored).
 * Pure (tests/stand-velos.test.js). rides: the unified list of Heute (kmbook.js withStravaRides), `date` and `km`;
 * due: how many care jobs are due over all bikes (care/overview.js dueCards().total).
 */
import { monthKm } from '../home/bausteine.js';

const dayOf = (d) => (typeof d === 'string' ? d.slice(0, 10) : '');
const ms = (day) => Date.parse(`${day}T00:00:00Z`);

/** Whole calendar days from a to b (Zurich day strings, no clock arithmetic). */
export const daysBetween = (a, b) => Math.round((ms(b) - ms(a)) / 864e5);

/** The newest day with a ride up to today, or null. */
export function lastRideDay(rides = [], today) {
  let last = null;
  for (const r of rides) {
    const d = dayOf(r?.date);
    if (d && d <= today && (Number(r.km) || 0) > 0 && (!last || d > last)) last = d;
  }
  return last;
}

/** The last `n` months up to today's, oldest first: [{ month: '2026-11', km }] (months without a ride are 0, drawn as a gap in the axis). */
export function monthsOf(rides = [], today, n = 12) {
  const [y, m] = today.split('-').map(Number);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    out.push({ month: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`, km: 0 });
  }
  const at = new Map(out.map((o) => [o.month, o]));
  for (const r of rides) {
    const d = dayOf(r?.date);
    if (d && d <= today) {
      const o = at.get(d.slice(0, 7));
      if (o) o.km += Number(r.km) || 0;
    }
  }
  return out.map((o) => ({ ...o, km: Math.round(o.km) }));
}

/**
 * → { km, before, pct, lastDays, due, months, any }. km: this month up to today; before/pct: the same days of last
 * month (Heute says the same, monthKm); lastDays: whole days since the last ride (0 = today, null = no ride yet);
 * any: a ride in the last 12 months (without one the chart stays away and the page says what to do).
 */
export function velosStand({ rides = [], due = 0, today }) {
  const m = monthKm(rides, today);
  const last = lastRideDay(rides, today);
  const months = monthsOf(rides, today, 12);
  return { km: m.km, before: m.before, pct: m.pct, lastDays: last ? daysBetween(last, today) : null, due, months, any: months.some((x) => x.km > 0) };
}
