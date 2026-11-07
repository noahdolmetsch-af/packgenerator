/**
 * «Sonnenaufgang auf dem Hügel» (Träume und Neuland N9, Noah 27.10.2026 «1-5 a»): a short morning or evening
 * tip with the time, when the sky is clear: «Clear morning Thu: sunrise 7:21, leave 6:45 for your view point».
 * Sun times are worked out on the device (himmel.js); clear = little cloud and little rain in the hour of the
 * sunrise or sunset in the home forecast (hourly c = cloud cover %, p = rain %). The view points are your own
 * points of the kind «View» near home. Pure, tested in tests/sonne.test.js.
 */
import { sunAt } from '../unterwegs/himmel.js';
import { distKm } from './biwak.js';

/** Clear enough: at most this cloud cover (%) and this rain chance (%) in the hour. */
export const CLEAR_CLOUD = 30;
export const CLEAR_RAIN = 20;
/** View points up to this many km from home (straight line). */
export const VIEW_KM = 15;
/** Ride speed to the view point (km/h; uphill, so slow) and the minutes to be there before. */
export const VIEW_KMH = 14;
export const EARLY_MIN = 15;
/** Without a view point: the minutes to plan for getting up a hill nearby. */
export const NO_VIEW_MIN = 30;

/** The hour (0–23) and «HH:MM» in Zürich of a moment. */
export function zurich(ms) {
  const s = new Date(ms).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Zurich' });
  return { hour: Number(s.slice(0, 2)), hm: s };
}

/** Is the sky clear in that hour of that forecast day? null when the forecast has no cloud cover. */
export function clearIn(day, hour) {
  const c = day?.hourly?.c?.[hour];
  if (!Number.isFinite(c)) return null;
  const p = day?.hourly?.p?.[hour];
  return c <= CLEAR_CLOUD && !(Number.isFinite(p) && p > CLEAR_RAIN);
}

/**
 * The next clear sunrise and sunset from now on, within the forecast: { rise, set }, each
 * { date, at (ms), hm, cloud } or null.
 */
export function nextClear(days = [], home, now = Date.now()) {
  const out = { rise: null, set: null };
  if (!home || !Number.isFinite(home.lat) || !Number.isFinite(home.lon)) return out;
  for (const d of days) {
    const s = sunAt(d.date, home.lat, home.lon);
    if (!s) continue;
    for (const k of ['rise', 'set']) {
      if (out[k] || s[k] <= now) continue;
      const z = zurich(s[k]);
      if (clearIn(d, z.hour)) out[k] = { date: d.date, at: s[k], hm: z.hm, cloud: d.hourly.c[z.hour] };
    }
    if (out.rise && out.set) break;
  }
  return out;
}

/** Own view points near home, nearest first: [{ ...point, km }]. */
export function viewSpots(points = [], home, maxKm = VIEW_KM, max = 2) {
  if (!home || !Number.isFinite(home.lat) || !Number.isFinite(home.lon)) return [];
  return points
    .filter((p) => p?.kind === 'view' && Number.isFinite(p.lat) && Number.isFinite(p.lon))
    .map((p) => ({ ...p, km: Math.round(distKm(home, p) * 10) / 10 }))
    .filter((p) => p.km <= maxKm)
    .sort((a, b) => a.km - b.km)
    .slice(0, max);
}

/** Minutes to ride to a view point (road 1.3 × the straight line), rounded to 5; without one NO_VIEW_MIN. */
export const rideTo = (km) => (Number.isFinite(km) ? Math.max(5, Math.round(((km * 1.3) / VIEW_KMH) * 12) * 5) : NO_VIEW_MIN);

/** When to leave: the sun's moment minus the ride and EARLY_MIN. → «HH:MM» in Zürich. */
export const leaveAt = (at, km) => zurich(at - (rideTo(km) + EARLY_MIN) * 6e4).hm;
