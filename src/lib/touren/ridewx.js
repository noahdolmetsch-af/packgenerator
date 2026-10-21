/**
 * Wetter einer Fahrt wie auf Strava (Noah 21.10.2026 «beide übersichten 1:1 übernehmen»): Strava's overview
 * shows the weather at the start of a ride: Bewölkt, Temperatur, Gefühlt, Luftfeuchtigkeit,
 * Windgeschwindigkeit, Windrichtung. The app asks Open-Meteo (free, no key, as tourwx.js) for the hour the
 * ride started, at the first point of its line, once, and keeps it with the activity:
 *   activity.wxRide = { v, t, feel, hum, wind, dir, code }
 * Pure functions plus ensureRideWx(db, act), which fetches and stores it when it is missing.
 */
import { decodePolyline } from '../spur/polyline.js';
import { RECENT_DAYS } from './tourwx.js';

const FORECAST = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE = 'https://archive-api.open-meteo.com/v1/archive';
export const RIDE_WX_V = 1;
const r1 = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 10) / 10 : null);
const r4 = (n) => Math.round(n * 1e4) / 1e4;
const between = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5);

/** Where the ride started: { lat, lon } from its line, or null. */
export function rideStart(act) {
  const pts = act?.line ? decodePolyline(act.line) : [];
  return pts.length ? { lat: r4(pts[0][0]), lon: r4(pts[0][1]) } : null;
}

/** The address to ask for the day of the ride. */
export function rideWxUrl(place, day, today) {
  const base = between(day, today) <= RECENT_DAYS ? FORECAST : ARCHIVE;
  return `${base}?latitude=${place.lat}&longitude=${place.lon}&start_date=${day}&end_date=${day}&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code&wind_speed_unit=kmh&timezone=auto`;
}

/** Open-Meteo's answer → the weather at the start hour of the ride (time 'HH:MM'), or null. */
export function rideWxOf(data = {}, time = '') {
  const m = /^(\d{1,2}):/.exec(time ?? '');
  const hour = m ? Number(m[1]) : 12;
  const h = data.hourly ?? {};
  const n = (h.time ?? []).findIndex((stamp) => Number(String(stamp).split('T')[1]?.slice(0, 2)) === hour);
  if (n < 0) return null;
  const out = {
    v: RIDE_WX_V,
    t: r1(h.temperature_2m?.[n]),
    feel: r1(h.apparent_temperature?.[n]),
    hum: r1(h.relative_humidity_2m?.[n]),
    wind: r1(h.wind_speed_10m?.[n]),
    dir: r1(h.wind_direction_10m?.[n]),
    code: Number.isInteger(h.weather_code?.[n]) ? h.weather_code[n] : null,
  };
  return out.t == null && out.code == null ? null : out;
}

/** The 16 compass points (English source words for t(), as Strava writes them). */
export const DIRS = ['N|wind', 'NNE|wind', 'NE|wind', 'ENE|wind', 'E|wind', 'ESE|wind', 'SE|wind', 'SSE|wind', 'S|wind', 'SSW|wind', 'SW|wind', 'WSW|wind', 'W|wind', 'WNW|wind', 'NW|wind', 'NNW|wind'];
/** Where the wind comes from, as a compass point key, or null. */
export const dirOf = (deg) => (typeof deg === 'number' && Number.isFinite(deg) ? DIRS[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16] : null);

/** The sky from the WMO weather code: { key, icon } (key: English source for t(); icon: a name for the page). */
export function skyOf(code) {
  if (code == null) return null;
  if (code === 0) return { key: 'Clear|sky', icon: 'sun' };
  if (code === 1) return { key: 'Mostly clear|sky', icon: 'sun' };
  if (code === 2) return { key: 'Partly cloudy|sky', icon: 'cloudsun' };
  if (code === 3) return { key: 'Cloudy|sky', icon: 'cloud' };
  if (code === 45 || code === 48) return { key: 'Fog|sky', icon: 'fog' };
  if (code >= 51 && code <= 57) return { key: 'Drizzle|sky', icon: 'drizzle' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { key: 'Rain|sky', icon: 'rain' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { key: 'Snow|sky', icon: 'snow' };
  if (code >= 95) return { key: 'Thunderstorm|sky', icon: 'storm' };
  return { key: 'Cloudy|sky', icon: 'cloud' };
}

/** Is the weather of this ride still to fetch? (a line to place it, no weather of this kind yet) */
export const needsRideWx = (act) => !!act?.line && act?.day && !(act.wxRide && (act.wxRide.v ?? 0) >= RIDE_WX_V);

/** Fetch and keep the weather of a ride once. Quiet when offline or the service does not answer. */
export async function ensureRideWx(db, act, today, fetcher = fetch) {
  if (!needsRideWx(act)) return act?.wxRide ?? null;
  const place = rideStart(act);
  if (!place) return null;
  try {
    const res = await fetcher(rideWxUrl(place, act.day, today));
    if (!res.ok) return null;
    const wx = rideWxOf(await res.json(), act.time);
    if (wx) await db.table('activities').update(act.id, { wxRide: wx });
    return wx;
  } catch {
    return null;
  }
}
