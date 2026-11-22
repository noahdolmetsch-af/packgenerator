/**
 * «Wetter entlang der Route» on the tour page (Wetter-Ausbau A and G, Noah 22.11.2026 «a»): the strip of
 * map/wxline.js (rain, temperature and wind at about every 25 km) gets three more things from the same rows:
 * how much of the way is headwind, the coldest point of the route (a pass is colder than the start), what that
 * adds to what the start place already asks you to pack, and the webcams of «My webcams» that have a place on
 * the route (G). Everything is a suggestion; nothing is put on a list by itself. Pure functions, tested in
 * tests/wetter-routewx.test.js.
 */
import { packHints } from './kern.js';
import { distKm, ridingHours } from '../route.js';
import { stagePlan, hasStages } from '../stages.js';
import { etaFn, timelineRows } from '../map/wxline.js';
import { atLocal } from './kern.js';

const fin = (x) => typeof x === 'number' && Number.isFinite(x);

/** The rows of the first riding day: from `fromKm` to dayKm (a route of several days shows its first day; the stages come with «Wetter nach Etappe»). */
export const dayRows = (rows = [], dayKm = null) => (dayKm > 0 ? rows.filter((r) => r.km <= dayKm + 0.5) : rows);

/** The km a day covers and the pace to ride it (km/h) from the route and the days of a trip. */
export function tripPace(trip) {
  const route = trip?.route;
  const days = Math.max(1, Number(trip?.days) || 1);
  if (!(route?.km > 0)) return { dayKm: null, kmh: null };
  const h = ridingHours(route, days);
  const dayKm = route.km / days;
  return { dayKm, kmh: h ? dayKm / h : null };
}

/** The share of the points (in percent) where the wind is against you. Only points with a forecast count. null without any. */
export function headShare(rows = []) {
  const ok = rows.filter((r) => r.w);
  if (!ok.length) return null;
  return Math.round((ok.filter((r) => r.kind === 'head').length / ok.length) * 100);
}

/** The coldest point with a forecast: { km, temp, eta } or null. */
export function coldest(rows = []) {
  const ok = rows.filter((r) => r.w && fin(r.temp));
  const r = ok.reduce((a, b) => (!a || b.temp < a.temp ? b : a), null);
  return r ? { km: r.km, temp: Math.round(r.temp), eta: r.eta } : null;
}

/**
 * What the weather along the route adds to what the start place already says: the pack hints of all points, without the
 * ones the start hints (startKeys) already have and without «a layer to take off» (that is about one place and a morning).
 * → [{ key, why }] (the keys of PACK_TEXT in kern.js).
 */
export function routeHints(rows = [], startKeys = []) {
  const hours = rows.filter((r) => r.w).map((r) => ({ temp: r.temp, feels: r.temp, rainP: r.rainP, rainMm: r.rainMm, wind: r.wind, gust: r.gust, dir: r.dir }));
  if (!hours.length) return [];
  return packHints(hours).filter((h) => h.key !== 'layer' && !startKeys.includes(h.key));
}

/**
 * The webcams that have a place near the route. cams: [{ id, name, url, place: { lat, lon } }]; pts: [{ lat, lon, km }]
 * (race.js lineKm). → [{ cam, km, offKm }] in route order, each cam once, only up to maxOffKm away from the line (2 km).
 */
export function camsAlong(cams = [], pts = [], maxOffKm = 2, fromKm = 0, toKm = Infinity) {
  if (pts.length < 2) return [];
  const out = [];
  for (const cam of cams) {
    if (!cam?.place || !fin(Number(cam.place.lat)) || !fin(Number(cam.place.lon))) continue;
    const p = { lat: Number(cam.place.lat), lon: Number(cam.place.lon) };
    let best = null;
    for (const q of pts) {
      if (q.km < fromKm - 0.5 || q.km > toKm + 0.5) continue;
      const d = distKm(p, q);
      if (!best || d < best.offKm) best = { cam, km: q.km, offKm: d };
    }
    if (best && best.offKm <= maxOffKm) out.push({ ...best, km: Math.round(best.km * 10) / 10, offKm: Math.round(best.offKm * 10) / 10 });
  }
  return out.sort((a, b) => a.km - b.km);
}

/** The row of the strip a webcam at km belongs to: the last point at or before km (so the picture stands where you pass it). */
export const rowBefore = (rows = [], km = 0) => rows.filter((r) => r.km <= km + 0.05).at(-1) ?? null;

/**
 * C «Wetter pro Etappe» (Wetter-Ausbau, Noah 22.11.2026 «a»): the weather of each riding day of a trip with stages, from the
 * points the strip along the route has already kept (cache { points, series }). Day n starts at startHour on its date and rides
 * at kmh; the points of its km range give: lowest and highest temperature, the share of points with rain, the first rain hour,
 * the strongest wind and the share of headwind. A day outside the 16-day forecast says so (ok: false).
 * → [{ day, date, from, to, fromKm, toKm, km, ok, tmin, tmax, rainShare, rainAt, windMax, head }] or [] without stages, route or pace.
 */
export function stageWeather(cache, trip, { kmh = null, startHour = 8, off = 0, now = Date.now() } = {}) {
  if (!cache?.points?.length || !hasStages(trip) || !trip?.startDate || !(kmh > 0)) return [];
  const profile = trip.route?.profile ?? [];
  const totalKm = Number(trip.route?.km) || 0;
  return stagePlan(trip)
    .filter((d) => d.fromKm != null && d.date)
    .map((d) => {
      const eta = etaFn({ pace: kmh, startAt: atLocal(d.date, startHour, off), fromKm: d.fromKm, profile, totalKm, now: 0 });
      let rows = timelineRows(cache, { eta, fromKm: d.fromKm, now: 0 }).filter((r) => r.km <= d.toKm + 0.5);
      if (!rows.length) {
        // a short day between two points: the point nearest to where it ends
        const all = timelineRows(cache, { eta, fromKm: 0, now: 0 });
        const near = all.reduce((a, b) => (!a || Math.abs(b.km - d.toKm) < Math.abs(a.km - d.toKm) ? b : a), null);
        rows = near ? [near] : [];
      }
      const ok = rows.filter((r) => r.w);
      const temps = ok.map((r) => r.temp).filter(fin);
      const winds = ok.map((r) => r.wind).filter(fin);
      const wet = ok.filter((r) => r.rain);
      return {
        day: d.day, date: d.date, from: d.from, to: d.to, fromKm: d.fromKm, toKm: d.toKm, km: d.km,
        ok: ok.length > 0,
        tmin: temps.length ? Math.round(Math.min(...temps)) : null,
        tmax: temps.length ? Math.round(Math.max(...temps)) : null,
        rainShare: ok.length ? Math.round((wet.length / ok.length) * 100) : null,
        rainAt: wet[0]?.eta ?? null,
        windMax: winds.length ? Math.round(Math.max(...winds)) : null,
        head: headShare(rows),
      };
    });
}
