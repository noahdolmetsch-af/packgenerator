/**
 * Paket U2 «Karte» › Wetter-Layer (Noah 19.10.2026 «4a: Regenradar, Wind, Schneefallgrenze resp. wo liegt
 * der Schnee»). Free services without a key, one request per tap:
 * - RainViewer: the newest radar frame (weather-maps.json gives its path). The tiles go up to zoom 7;
 *   maplibre enlarges them beyond. Attribution «RainViewer».
 * - Open-Meteo forecast: wind, freezing level and snow depth at about 12 points along the route
 *   (samples()), read for the hour you are expected there (the plan), else now.
 * The answers are kept on this device (meta table, cacheGet/cacheSet of the race store): MAP_WX_CACHE +
 * tripId, with the time they were fetched («as of»). Weather along the route of AlongRoute (WX_CACHE) has
 * no freezing level or snow, so this is its own request; seriesNear (route-lib.js) is shared.
 * Pure parsers, tested in tests/map-lib.test.js; the fetchers take a fetcher for tests.
 */
import { samples } from '../race/race.js';
import { profileAt } from './maplib.js';

export const RAINVIEWER = 'https://api.rainviewer.com/public/weather-maps.json';
export const RADAR_MAX_ZOOM = 7;
export const RADAR_ATTRIBUTION = '© RainViewer';
export const MAP_WX_CACHE = 'race-mapwx:';
/** How far below the freezing level snow still falls (a rule of thumb: about 300 m). */
export const SNOW_BELOW_FREEZING_M = 300;

/** weather-maps.json → the newest radar frame { time (ms), url (tiles with {z}/{x}/{y}) } or null. */
export function radarFrame(json) {
  const host = typeof json?.host === 'string' ? json.host : '';
  const past = Array.isArray(json?.radar?.past) ? json.radar.past : [];
  const f = past.filter((x) => x && typeof x.path === 'string').at(-1);
  if (!host || !f) return null;
  // 256 px tiles, colour scheme 2 (universal blue), smoothed, snow shown in its own colour
  return { time: Number(f.time) * 1000, url: `${host}${f.path}/256/{z}/{x}/{y}/2/1_1.png` };
}
export async function fetchRadar(fetcher = fetch) {
  const res = await fetcher(RAINVIEWER);
  if (!res.ok) throw new Error('failed');
  const frame = radarFrame(await res.json());
  if (!frame) throw new Error('failed');
  return frame;
}

/** The sample points of the map weather: [{ lat, lon, km, m }] (m: the route's height there). */
export function wxPoints(pts, profile = []) {
  return samples(pts, 50, 12).map((p) => ({ lat: Math.round(p.lat * 1000) / 1000, lon: Math.round(p.lon * 1000) / 1000, km: Math.round(p.km), m: profileAt(profile, p.km)?.m ?? null }));
}

/** One request for all points: hourly wind, direction, freezing level and snow depth (UTC, unixtime). */
export async function fetchMapWx(points, fetcher = fetch) {
  if (!points.length) return [];
  const q = new URLSearchParams({
    latitude: points.map((p) => p.lat.toFixed(3)).join(','),
    longitude: points.map((p) => p.lon.toFixed(3)).join(','),
    hourly: 'wind_speed_10m,wind_direction_10m,freezing_level_height,snow_depth',
    forecast_days: '16',
    timezone: 'UTC',
    timeformat: 'unixtime',
  });
  const res = await fetcher(`https://api.open-meteo.com/v1/forecast?${q}`);
  if (!res.ok) throw new Error(res.status === 429 ? 'busy' : 'failed');
  const j = await res.json();
  return Array.isArray(j) ? j : [j];
}

/**
 * The hour nearest to ms at one point → { wind (km/h), dir (° the wind comes from), freezing (m),
 * snow (m of snow lying) } or null when ms is outside the forecast.
 */
export function mapWxAt(series, ms) {
  const h = series?.hourly;
  if (!h?.time?.length || !Number.isFinite(ms)) return null;
  const s = ms / 1000;
  if (s < h.time[0] - 1800 || s > h.time.at(-1) + 1800) return null;
  let i = 0;
  for (let k = 1; k < h.time.length; k++) if (Math.abs(h.time[k] - s) < Math.abs(h.time[i] - s)) i = k;
  const num = (a) => (Number.isFinite(a?.[i]) ? a[i] : null);
  return { at: h.time[i] * 1000, wind: num(h.wind_speed_10m), dir: num(h.wind_direction_10m), freezing: num(h.freezing_level_height), snow: num(h.snow_depth) };
}

/**
 * Every sample point with its weather for the moment you are there: when(km) → ms (the plan), or now.
 * → [{ km, lat, lon, m, at, wind, dir, freezing, snow, snowLine, state }] with state 'lies' (snow lies),
 * 'line' (the route is above the snow line) or ''. Points outside the forecast are left out.
 */
export function wxRows(cache, when = null, now = Date.now()) {
  const points = cache?.points ?? [];
  return points
    .map((p, i) => {
      let ms = when ? when(p.km) : now;
      // a plan in the past or far ahead: the forecast hour nearest to now still tells something
      let w = mapWxAt(cache.series?.[i], ms);
      if (!w && when) w = mapWxAt(cache.series?.[i], (ms = now));
      if (!w) return null;
      const snowLine = w.freezing != null ? Math.max(0, w.freezing - SNOW_BELOW_FREEZING_M) : null;
      const state = w.snow != null && w.snow > 0 ? 'lies' : snowLine != null && p.m != null && p.m >= snowLine ? 'line' : '';
      return { ...p, ...w, planned: ms !== now, snowLine, state };
    })
    .filter(Boolean);
}

/**
 * The route stretches with snow: each sample point with a state stands for the half-way to its
 * neighbours. Neighbours with snow join. → [{ fromKm, toKm, state }] ('lies' wins over 'line').
 */
export function snowStretches(rows = [], totalKm = 0) {
  const r = [...rows].sort((a, b) => a.km - b.km);
  const out = [];
  r.forEach((x, i) => {
    if (!x.state) return;
    const from = i ? (r[i - 1].km + x.km) / 2 : 0;
    const to = i < r.length - 1 ? (x.km + r[i + 1].km) / 2 : Math.max(x.km, totalKm);
    const last = out.at(-1);
    if (last && Math.abs(last.toKm - from) < 0.01) {
      last.toKm = to;
      if (x.state === 'lies') last.state = 'lies';
    } else out.push({ fromKm: Math.round(from), toKm: Math.round(to), state: x.state });
  });
  return out.map((s) => ({ ...s, toKm: Math.round(s.toKm) }));
}

/** Wind on the bike: the strongest wind of the rows → { km, wind, dir } or null. */
export const windiest = (rows = []) => rows.filter((r) => r.wind != null).reduce((a, b) => (!a || b.wind > a.wind ? b : a), null);

/** The map arrows: the wind blows towards dir + 180°. → [{ lat, lon, deg, label }] */
export const windArrows = (rows = []) => rows.filter((r) => r.wind != null && r.dir != null).map((r) => ({ lat: r.lat, lon: r.lon, deg: (r.dir + 180) % 360, label: `${Math.round(r.wind)}` }));

/** Is a cached answer older than maxH hours? */
export const isOld = (iso, maxH = 6, now = Date.now()) => !iso || now - Date.parse(iso) > maxH * 36e5;
