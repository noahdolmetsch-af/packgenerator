/**
 * Paket U «Wetter entlang der Strecke als Zeitleiste» (Noah 19.10.2026): for a route and a plan (or a
 * pace), the weather of the hour you are expected at each sample point: rain chance and amount,
 * temperature, wind and whether it blows against you (headwind) or from behind (tailwind) there.
 *
 * Free, no key: one Open-Meteo request for all points (like wx.js / outside.js), only on a tap (or once
 * when the component is told to), kept on this device in the meta table (cacheGet/cacheSet of the race
 * store) under WXLINE_CACHE + (tripId || 'live') with the time it was fetched («as of»). Offline the
 * cached answer is shown with its time. The cache knows its route (routeKey) so a new GPX on the live
 * map does not show the weather of the old one.
 *
 * Pure functions, tested in tests/wxline.test.js; the fetcher takes a fetcher for tests.
 */
import { pointAt, effortOf, msOf } from '../race/race.js';

export const WXLINE_CACHE = 'race-wxline:';
/** About every 25 km a point; a long route gets fewer, wider steps (one request, at most WXLINE_MAX points). */
export const WXLINE_STEP_KM = 25;
export const WXLINE_MAX = 24;
/** km before and after a point that give the riding direction there. */
export const BEARING_SPAN_KM = 1.5;
/** Below this wind (km/h) the direction does not matter. */
export const CALM_KMH = 5;
/** Rain worth a word: a chance from 50 % or at least 0.5 mm in the hour. */
export const RAIN_P = 50;
export const RAIN_MM = 0.5;

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const norm = (d) => ((d % 360) + 360) % 360;

/** The compass bearing from a to b (0 = north, 90 = east). */
export function bearing(a, b) {
  const y = Math.sin(rad(b.lon - a.lon)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon - a.lon));
  return norm(deg(Math.atan2(y, x)));
}

/** The riding direction at km along pts ([{ lat, lon, km }]): from span km before to span km after. */
export function routeBearingAt(pts = [], km = 0, span = BEARING_SPAN_KM) {
  if (pts.length < 2) return null;
  const total = pts.at(-1).km;
  const a = pointAt(pts, Math.max(0, km - span));
  const b = pointAt(pts, Math.min(total, km + span));
  if (!a || !b || (a.lat === b.lat && a.lon === b.lon)) return null;
  return Math.round(bearing(a, b));
}

/**
 * The wind on the bike: wind (km/h) coming FROM fromDeg, you riding towards routeDeg.
 * → { head, cross }: head > 0 against you, head < 0 from behind (km/h); cross: the side part (≥ 0).
 */
export function windParts(wind, fromDeg, routeDeg) {
  if (!Number.isFinite(wind) || !Number.isFinite(fromDeg) || !Number.isFinite(routeDeg)) return { head: null, cross: null };
  const a = rad(fromDeg - routeDeg);
  const r = (v) => Math.round(v * 10) / 10 || 0; // no −0
  return { head: r(wind * Math.cos(a)), cross: r(Math.abs(wind * Math.sin(a))) };
}

/** 'head' | 'tail' | 'cross' | 'calm' (or '' without wind): what you feel. */
export function windKind(wind, head, cross) {
  if (!Number.isFinite(wind)) return '';
  if (wind < CALM_KMH) return 'calm';
  if (!Number.isFinite(head)) return '';
  if (Math.abs(head) >= cross) return head > 0 ? 'head' : 'tail';
  return 'cross';
}

/** English keys for t() of windKind. */
export const WIND_KIND = { head: 'Headwind', tail: 'Tailwind', cross: 'Crosswind', calm: 'Hardly any wind' };

/** A short key of a route (km and both ends), so a cache of another route is not shown. */
export function routeKey(pts = []) {
  if (pts.length < 2) return '';
  const r = (v) => Math.round(v * 1000) / 1000;
  const a = pts[0];
  const b = pts.at(-1);
  return `${Math.round(b.km * 10) / 10}:${r(a.lat)},${r(a.lon)}:${r(b.lat)},${r(b.lon)}`;
}

/**
 * The sample points: every stepKm (wider on a long route, at most max), start and end included.
 * → [{ km, lat, lon, deg }] (deg: the riding direction there; rounded to about 100 m).
 */
export function linePoints(pts = [], stepKm = WXLINE_STEP_KM, max = WXLINE_MAX) {
  if (pts.length < 2) return [];
  const total = pts.at(-1).km;
  if (!(total > 0)) return [];
  const step = Math.max(stepKm, total / Math.max(1, max - 1));
  const kms = [];
  for (let k = 0; k < total - step * 0.25; k += step) kms.push(k);
  kms.push(total);
  return kms.map((k) => {
    const p = pointAt(pts, k);
    return { km: Math.round(k * 10) / 10, lat: Math.round(p.lat * 1000) / 1000, lon: Math.round(p.lon * 1000) / 1000, deg: routeBearingAt(pts, k) };
  });
}

/** One request for all points: hourly temperature, rain chance and amount, wind, gusts, direction. */
export async function fetchWxLine(points, fetcher = fetch) {
  if (!points.length) return [];
  const q = new URLSearchParams({
    latitude: points.map((p) => p.lat.toFixed(3)).join(','),
    longitude: points.map((p) => p.lon.toFixed(3)).join(','),
    hourly: 'temperature_2m,precipitation_probability,precipitation,wind_speed_10m,wind_gusts_10m,wind_direction_10m',
    forecast_days: '16',
    timezone: 'UTC',
    timeformat: 'unixtime',
  });
  const res = await fetcher(`https://api.open-meteo.com/v1/forecast?${q}`);
  if (!res.ok) throw new Error(res.status === 429 ? 'busy' : 'failed');
  const j = await res.json();
  return Array.isArray(j) ? j : [j];
}

/** The forecast hour nearest to ms at one point → { at, temp, rainP, rainMm, wind, gust, dir } or null (outside the forecast). */
export function wxLineAt(series, ms) {
  const h = series?.hourly;
  if (!h?.time?.length || !Number.isFinite(ms)) return null;
  const s = ms / 1000;
  if (s < h.time[0] - 1800 || s > h.time.at(-1) + 1800) return null;
  let i = 0;
  for (let k = 1; k < h.time.length; k++) if (Math.abs(h.time[k] - s) < Math.abs(h.time[i] - s)) i = k;
  const v = (a) => (Number.isFinite(a?.[i]) ? a[i] : null);
  return { at: h.time[i] * 1000, temp: v(h.temperature_2m), rainP: v(h.precipitation_probability), rainMm: v(h.precipitation), wind: v(h.wind_speed_10m), gust: v(h.wind_gusts_10m), dir: v(h.wind_direction_10m) };
}

/** A start as ms: ms, 'YYYY-MM-DDTHH:MM' (local) or an ISO string; else null. */
export function startMs(startAt) {
  if (Number.isFinite(startAt)) return startAt;
  if (typeof startAt === 'string' && startAt) {
    const v = /^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(startAt) ? msOf(startAt) : Date.parse(startAt);
    return Number.isFinite(v) ? v : null;
  }
  return null;
}

/** pace: a number (km/h) or { kmh } → km/h, else null. */
export const kmhOf = (pace) => {
  const v = Number(typeof pace === 'object' && pace ? pace.kmh : pace);
  return v > 0 ? v : null;
};

/**
 * When you are at km: km → ms.
 * - plan (race.js schedule / strategy simPlan): its etaOf;
 * - else a pace (km/h, climbs slower as in the app's rule: 600 m up ≈ 16 km flat) from startAt (default now)
 *   at fromKm (where you are on the live map).
 * → a function, or null without plan and pace.
 */
export function etaFn({ plan = null, pace = null, startAt = null, fromKm = 0, profile = [], totalKm = 0, now = Date.now() } = {}) {
  if (typeof plan?.etaOf === 'function') return (km) => plan.etaOf(km);
  const kmh = kmhOf(pace);
  if (!kmh) return null;
  const t0 = startMs(startAt) ?? now;
  const eff = effortOf(profile ?? [], totalKm);
  const e0 = eff.at(fromKm);
  return (km) => t0 + (Math.max(0, eff.at(km) - e0) / kmh) * 36e5;
}

/**
 * The timeline: one row per cached point from fromKm on (the point just behind you stays out).
 * cache: { points, series }; eta: km → ms (etaFn). A time already past counts as now (you are late,
 * the weather of now says more than the past). Points whose hour is outside the forecast get w: false.
 * → [{ km, lat, lon, deg, eta, at, temp, rainP, rainMm, wind, gust, dir, head, cross, kind, rain, w }]
 */
export function timelineRows(cache, { eta = null, fromKm = 0, now = Date.now() } = {}) {
  const points = cache?.points ?? [];
  return points
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.km >= fromKm - 0.05)
    .map(({ p, i }) => {
      const at = Math.max(now, eta ? eta(p.km) : now);
      const w = wxLineAt(cache.series?.[i], at);
      if (!w) return { ...p, eta: at, w: false };
      const { head, cross } = windParts(w.wind, w.dir, p.deg);
      const rain = (w.rainP != null && w.rainP >= RAIN_P) || (w.rainMm != null && w.rainMm >= RAIN_MM);
      return { ...p, ...w, eta: at, head, cross, kind: windKind(w.wind, head, cross), rain, w: true };
    });
}

/**
 * The one line above the strip: the first rain, the strongest headwind, the lowest and highest temperature.
 * → { rain: row | null, head: row | null, low, high } (head only from CALM_KMH on).
 */
export function lineSummary(rows = []) {
  const ok = rows.filter((r) => r.w);
  const rain = ok.find((r) => r.rain) ?? null;
  const head = ok.filter((r) => Number.isFinite(r.head) && r.head >= CALM_KMH).reduce((a, b) => (!a || b.head > a.head ? b : a), null);
  const temps = ok.map((r) => r.temp).filter(Number.isFinite);
  return { rain, head, low: temps.length ? Math.min(...temps) : null, high: temps.length ? Math.max(...temps) : null };
}

/** Is the cache for this route (and so worth showing)? */
export const cacheFits = (cache, pts) => !!cache?.points?.length && cache.key === routeKey(pts);

/** The cache key of a trip (or of the live map without one). */
export const wxLineKey = (tripId = '') => WXLINE_CACHE + (tripId || 'live');
