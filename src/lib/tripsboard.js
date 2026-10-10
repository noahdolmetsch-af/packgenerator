/**
 * v0.78.0 «Fünf Orte» 2 / «Übergänge 2» (Noah T1–T20 a, U1–U5 a, mockup uebergaenge2/touren): the
 * Touren overview as tiles. Each tile shows the route of its trip (the GPX of the trip, else the
 * first ride linked to it); the side shows the best values and the average per kind of trip, from
 * the uploaded rides (GPX). Heart rate, zones and power come later with Strava (only observation).
 * Pure, tested in tests/tripsboard.test.js.
 */
import { localDay } from './localday.js';
import { addMonths } from './yearreview.js';

const pos = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
const days = (t) => Math.max(1, Number(t?.days) || 1);

/** The rides of a trip (uploaded GPX linked to it). */
const ridesOf = (trip, rides) => rides.filter((r) => r.tripId === trip.id);

/**
 * The line to draw on a tile: { line: [[lat, lon], …], km, gainM } from the trip's GPX route, else
 * from its first linked ride; null without one.
 */
export function routeOf(trip, rides = []) {
  if (trip?.route?.line?.length > 1) return { line: trip.route.line, km: pos(trip.route.km), gainM: pos(trip.route.gainM) };
  const r = ridesOf(trip ?? {}, rides).find((x) => x.line?.length > 1);
  if (r) return { line: r.line, km: pos(r.km), gainM: pos(r.gainM) };
  return null;
}

/**
 * An SVG path for a route line in a box of w × h (with a margin), north up; longitude is scaled by
 * the latitude so a round trip looks round. → { d, end: [x, y] } or null.
 */
export function routePath(line, w = 260, h = 128, margin = 14) {
  const pts = (line ?? []).filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (pts.length < 2) return null;
  const k = Math.cos((pts.reduce((s, p) => s + p[0], 0) / pts.length) * (Math.PI / 180));
  const xs = pts.map((p) => p[1] * k);
  const ys = pts.map((p) => -p[0]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const s = Math.min((w - 2 * margin) / (x1 - x0 || 1), (h - 2 * margin) / (y1 - y0 || 1));
  const ox = (w - (x1 - x0) * s) / 2;
  const oy = (h - (y1 - y0) * s) / 2;
  const at = (i) => [Math.round((ox + (xs[i] - x0) * s) * 10) / 10, Math.round((oy + (ys[i] - y0) * s) * 10) / 10];
  const d = pts.map((_, i) => `${i ? 'L' : 'M'}${at(i).join(' ')}`).join(' ');
  return { d, end: at(pts.length - 1) };
}

/** The kinds of trip for the averages: a day ride, one night, several nights. */
export const KINDS = [
  { key: 'day', name: 'Day ride' },
  { key: 'overnighter', name: 'Overnighter' },
  { key: 'multi', name: 'Multi-day' },
];
export const kindOf = (trip) => (days(trip) === 1 ? 'day' : days(trip) === 2 ? 'overnighter' : 'multi');

/** The periods of the best values: this season (since 1 January), the last 12 months, all. */
export const PERIODS = [
  { key: 'season', name: 'This season' },
  { key: 'year', name: '12 months' },
  { key: 'all', name: 'All|period' },
];
export function periodFrom(key, today = localDay()) {
  if (key === 'season') return `${today.slice(0, 4)}-01-01`;
  if (key === 'year') return addMonths(today, -12);
  return '';
}

/**
 * The best values and the average per kind of trip in a period, from the uploaded rides (GPX) and
 * the trips they belong to. Only trips already ridden (start on or before today) count.
 * → { longest: { km, title, days }, climb: { m, title }, time: { h, totalH, title },
 *     furthest: { km, title }, avg: [{ key, n, km, gainM, movingH, totalH, stops }], any }
 * Each best value is null when nothing counts.
 */
export function bestValues({ trips = [], rides = [], today = localDay(), period = 'season' } = {}) {
  const from = periodFrom(period, today);
  const inP = (d) => !!d && d >= from && d <= today;
  const byId = Object.fromEntries(trips.map((t) => [t.id, t]));
  const rs = rides.filter((r) => inP(r.date));
  const title = (r) => byId[r.tripId]?.title || r.name || '';
  const best = (list, f) => list.reduce((b, x) => (pos(f(x)) && (!b || f(x) > f(b)) ? x : b), null);

  // per trip: its rides added up (a trip without rides counts with its GPX route, if any)
  const done = trips.filter((t) => !t.skipped && inP(t.startDate));
  const per = done
    .map((t) => {
      const own = ridesOf(t, rs);
      const sum = (k) => own.reduce((s, r) => s + (Number(r[k]) || 0), 0);
      return {
        trip: t,
        km: own.length ? sum('km') : pos(t.route?.km),
        gainM: own.length ? sum('gainM') : pos(t.route?.gainM),
        movingH: own.length ? sum('movingH') : null,
        totalH: own.length ? sum('totalH') : null,
        stops: own.length ? own.reduce((s, r) => s + (r.pauses?.length ?? 0), 0) : null,
        rides: own.length,
      };
    })
    .filter((x) => pos(x.km));

  const lt = best(per, (x) => x.km);
  const cl = best(per, (x) => x.gainM);
  const tm = best(rs, (r) => r.movingH);
  const fd = best(rs, (r) => r.km);
  const r1 = (v) => Math.round(v * 10) / 10;
  const avg = KINDS.map((k) => {
    const list = per.filter((x) => kindOf(x.trip) === k.key && x.rides);
    const mean = (f) => (list.length ? list.reduce((s, x) => s + (f(x) ?? 0), 0) / list.length : null);
    return { key: k.key, name: k.name, n: list.length, km: list.length ? Math.round(mean((x) => x.km)) : null, gainM: list.length ? Math.round(mean((x) => x.gainM)) : null, movingH: list.length ? r1(mean((x) => x.movingH)) : null, totalH: list.length ? r1(mean((x) => x.totalH)) : null, stops: list.length ? Math.round(mean((x) => x.stops)) : null };
  });
  return {
    longest: lt ? { km: Math.round(lt.km), title: lt.trip.title ?? '', days: days(lt.trip) } : null,
    climb: cl ? { m: Math.round(cl.gainM), title: cl.trip.title ?? '' } : null,
    time: tm ? { h: tm.movingH, totalH: pos(tm.totalH), title: title(tm) } : null,
    furthest: fd ? { km: Math.round(fd.km), title: title(fd) } : null,
    avg,
    any: !!(lt || tm),
  };
}

/** Hours as «6:48». */
export const hmm = (h) => {
  if (!(typeof h === 'number' && h >= 0)) return '–';
  const m = Math.round(h * 60);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
};
