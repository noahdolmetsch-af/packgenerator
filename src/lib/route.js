/**
 * GPX route of a trip (Noah, 4.10.2026, answer 12b): distance, climbing and riding hours.
 * The file is read on the device; only the numbers, the start and a thinned line are stored:
 *   trip.route = { name, km, gainM, lossM, start: { lat, lon }, end: { lat, lon }, line: [[lat, lon], …], file }
 * The start also gives the place for the weather forecast.
 */
import { t } from './i18n.svelte.js';

/** Read the points of a GPX file (track points, else route points). Works without a browser. */
export function parseGpx(text) {
  if (!/<gpx[\s>]/i.test(text)) throw new Error(t('This is not a GPX file.'));
  const name = text.match(/<name>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/name>/i)?.[1]?.trim() || '';
  const grab = (tag) => {
    const out = [];
    const re = new RegExp(`<${tag}\\b([^>]*?)(?:/>|>([\\s\\S]*?)</${tag}>)`, 'gi');
    for (const m of text.matchAll(re)) {
      const lat = Number(m[1].match(/lat\s*=\s*["']([^"']+)["']/i)?.[1]);
      const lon = Number(m[1].match(/lon\s*=\s*["']([^"']+)["']/i)?.[1]);
      const ele = m[2] ? Number(m[2].match(/<ele>\s*([^<]+)<\/ele>/i)?.[1]) : NaN;
      if (Number.isFinite(lat) && Number.isFinite(lon)) out.push({ lat, lon, ele: Number.isFinite(ele) ? ele : null });
    }
    return out;
  };
  let points = grab('trkpt');
  if (!points.length) points = grab('rtept');
  if (points.length < 2) throw new Error(t('The GPX file has no route in it.'));
  return { name: decode(name), points };
}

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");

/** Distance between two points in km (haversine). */
export function distKm(a, b) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Climbing with a 3 m threshold, so GPS noise on the flat does not count as climbing. */
export function climb(points, threshold = 3) {
  let gain = 0;
  let loss = 0;
  let ref = null;
  for (const p of points) {
    if (p.ele == null) continue;
    if (ref == null) ref = p.ele;
    const d = p.ele - ref;
    if (d >= threshold) (gain += d), (ref = p.ele);
    else if (d <= -threshold) (loss -= d), (ref = p.ele);
  }
  return { gain: Math.round(gain), loss: Math.round(loss) };
}

/** At most n points, evenly spread, first and last kept (for a small map later). */
export function thin(points, n = 200) {
  if (points.length <= n) return points.map((p) => [round(p.lat), round(p.lon)]);
  const step = (points.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => points[Math.round(i * step)]).map((p) => [round(p.lat), round(p.lon)]);
}
const round = (v) => Math.round(v * 1e5) / 1e5;

/**
 * Elevation profile (v0.18.0, answer 4b): [[km from the start, metres], …], at most n points.
 * Empty when the file has no elevation.
 */
export function profileOf(points, n = 300) {
  if (points.filter((p) => p.ele != null).length < 2) return [];
  let km = 0;
  const all = points.map((p, i) => {
    if (i) km += distKm(points[i - 1], p);
    return [Math.round(km * 100) / 100, p.ele == null ? null : Math.round(p.ele)];
  });
  const withEle = all.filter((x) => x[1] != null);
  if (withEle.length <= n) return withEle;
  const step = (withEle.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => withEle[Math.round(i * step)]);
}

/** The numbers to store on the trip. */
export function routeStats(gpx, file = '') {
  const { points } = gpx;
  let km = 0;
  for (let i = 1; i < points.length; i++) km += distKm(points[i - 1], points[i]);
  const { gain, loss } = climb(points);
  const first = points[0];
  const last = points.at(-1);
  return {
    name: gpx.name || file.replace(/\.gpx$/i, ''),
    km: Math.round(km * 10) / 10,
    gainM: gain,
    lossM: loss,
    start: { lat: round(first.lat), lon: round(first.lon) },
    end: { lat: round(last.lat), lon: round(last.lon) },
    line: thin(points),
    profile: profileOf(points),
    file,
  };
}

/**
 * Riding hours with luggage: 16 km/h on the flat plus one hour for every 600 m of climbing.
 * A rough guess; "Riding hours" stays yours to change. Returns hours a day (0.5 steps).
 * pace: your own speed and climbing rate (v0.19.0, see pace.js), else the standard.
 */
export const SPEED_KMH = 16;
export const CLIMB_MH = 600;
export function ridingHours(route, days = 1, pace = null) {
  if (!route?.km) return null;
  const kmh = pace?.kmh || SPEED_KMH;
  const climbMh = pace?.climbMh || CLIMB_MH;
  const total = route.km / kmh + (route.gainM ?? 0) / climbMh;
  return Math.max(0.5, Math.round((total / Math.max(1, days)) * 2) / 2);
}
