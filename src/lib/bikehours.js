/**
 * «Velo im Griff» #193 (Noah 19.10.2026): the riding hours of a bike, for services by hours
 * (fork lower legs every 50 h, the whole bike every 100 h: whichever of km, hours or days comes first).
 *
 * The hours come from the ride ledger (kmbook.js): a counted ride with a Strava id takes the moving time
 * of that Strava activity (training.js actRecord movingS). Every other km (rides without a time, the
 * start value, a new reading, a correction) is an estimate: km ÷ average speed, the bike's own
 * (bike.avgKmh) or the standard of its kind (bikekind.js KIND_SPEED: road 25, gravel 20, mtb 14 km/h).
 * Estimated hours are shown with «≈». A bike without a ledger but with km: all of it estimated.
 * Pure functions, tested in tests/bikehours.test.js.
 */
import { kindOf, KIND_SPEED } from './bikekind.js';
import { num } from './i18n.svelte.js';

/** The average speed used for the estimate, in km/h. */
export const speedOf = (bike) => (typeof bike?.avgKmh === 'number' && bike.avgKmh > 0 ? bike.avgKmh : KIND_SPEED[kindOf(bike)]);

const r2 = (n) => Math.round(n * 100) / 100;

/**
 * The hours of one bike, day by day. entries: the ride ledger (all bikes); acts: Strava activities
 * ({ id, movingS }). → { total, est, exact, avg, km, days: [{ day, h, e }] } with h: the hours of that
 * day (e: the estimated part of them), oldest day first; total ≥ 0.
 */
export function hourSeries(bike, entries = [], acts = []) {
  const avg = speedOf(bike);
  const byId = new Map((acts ?? []).filter((a) => a?.id != null).map((a) => [String(a.id), a]));
  const by = new Map();
  for (const e of entries ?? []) {
    if (e?.bikeId !== bike?.id || e.state !== 'counted') continue;
    const km = Number(e.km) || 0;
    const act = e.stravaId ? byId.get(String(e.stravaId)) : null;
    const known = act && act.movingS > 0;
    const h = known ? act.movingS / 3600 : km / avg;
    const d = by.get(e.date) ?? { day: e.date, h: 0, e: 0 };
    d.h += h;
    if (!known) d.e += h;
    by.set(e.date, d);
  }
  const days = [...by.values()].sort((a, b) => String(a.day).localeCompare(String(b.day))).map((d) => ({ day: d.day, h: r2(d.h), e: r2(d.e) }));
  const km = typeof bike?.km === 'number' ? bike.km : null;
  if (!days.length) {
    const total = km != null ? r2(Math.max(0, km / avg)) : null;
    return { total, est: total, exact: 0, avg, km, days };
  }
  const sum = days.reduce((s, d) => s + d.h, 0);
  const est = days.reduce((s, d) => s + d.e, 0);
  return { total: r2(Math.max(0, sum)), est: r2(est), exact: r2(sum - est), avg, km, days };
}

/** The hours up to and including a day: { h, e } (e: the estimated part). */
function upTo(series, day) {
  let h = 0;
  let e = 0;
  for (const d of series.days) {
    if (d.day > day) break;
    h += d.h;
    e += d.e;
  }
  return { h, e };
}

/**
 * The hours since an entry (a service: { date | day, km }): { hours, est } or null when nothing is known.
 * With a ledger: the hours of the days after that day. Without: the hours noted then (entry.hours),
 * else (km now − km then) ÷ average speed.
 * est: true when any of it is estimated (shown with «≈»).
 */
export function hoursSince(series, entry) {
  if (!series || !entry) return null;
  const day = entry.date ?? entry.day ?? null;
  if (series.days.length && day) {
    const all = upTo(series, '9999-12-31');
    const then = upTo(series, day);
    return { hours: r2(Math.max(0, all.h - then.h)), est: all.e - then.e > 0.005 };
  }
  if (typeof entry.hours === 'number' && series.total != null) return { hours: r2(Math.max(0, series.total - entry.hours)), est: series.est > 0 };
  if (series.km != null && typeof entry.km === 'number') return { hours: r2(Math.max(0, (series.km - entry.km) / series.avg)), est: true };
  return null;
}

/** The hours on a day (for «Service done»: the hours then). null when nothing is known. */
export function hoursOn(series, day) {
  if (!series) return null;
  if (series.days.length) return r2(Math.max(0, upTo(series, day).h));
  return series.total;
}

/** «123 h» or «≈ 123 h» (whole hours; below 10 one decimal). */
export function hoursText(h, est = false) {
  if (h == null) return '';
  const n = Math.abs(h) < 10 ? Math.round(h * 10) / 10 : Math.round(h);
  return `${est ? '≈ ' : ''}${num(n)} h`;
}
