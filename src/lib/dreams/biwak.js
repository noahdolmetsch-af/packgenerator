/**
 * «Feierabend-Biwak» (Träume und Neuland N6, Noah 27.10.2026 «1-5 a»): a micro-adventure after work, e.g.
 * «Friday 17:30 off, Saturday 9:00 back», to a place to sleep near home, with a packing list from the
 * bivouac building block. Everything is a suggestion: the evening, the times and the distance can be changed
 * (setting BIWAK_KEY, in the backup). The places to sleep are your own points of the kind «Place to sleep»
 * (also the ones rated after a trip, with stars), best first, then nearest.
 */
export const BIWAK_KEY = 'dreams.biwak';
export const BIWAK_DEFAULT = { weekday: 5, start: '17:30', back: '09:00', maxKm: 30 };
export const BIWAK_KM = [15, 30, 50];
/** Average speed for the ride there, km/h (loaded bike, evening). */
export const BIWAK_KMH = 18;

const hhmm = (v, def) => (typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : def);

/** The stored value → a clean setting (unknown parts take the default). weekday: 1 Monday … 7 Sunday. */
export function biwakCfg(v) {
  const x = v && typeof v === 'object' ? v : {};
  const weekday = Number.isInteger(x.weekday) && x.weekday >= 1 && x.weekday <= 7 ? x.weekday : BIWAK_DEFAULT.weekday;
  const maxKm = Number.isFinite(Number(x.maxKm)) && Number(x.maxKm) >= 5 && Number(x.maxKm) <= 100 ? Math.round(Number(x.maxKm)) : BIWAK_DEFAULT.maxKm;
  return { weekday, start: hhmm(x.start, BIWAK_DEFAULT.start), back: hhmm(x.back, BIWAK_DEFAULT.back), maxKm };
}

const addDays = (day, n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${day}T12:00:00Z`));
/** 1 Monday … 7 Sunday of a YYYY-MM-DD day. */
export const weekdayOf = (day) => ((new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7) + 1;

/**
 * The next evening to go: the chosen weekday from today on; today only while it is before the start time.
 * now: 'HH:MM' in Zürich. → { day, next } (next: the morning after).
 */
export function nextEvening(today, now, cfg) {
  const c = biwakCfg(cfg);
  let n = (c.weekday - weekdayOf(today) + 7) % 7;
  if (n === 0 && now >= c.start) n = 7;
  const day = addDays(today, n);
  return { day, next: addDays(day, 1) };
}

/** Distance in km between two { lat, lon } (haversine). */
export function distKm(a, b) {
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r;
  const dLon = (b.lon - a.lon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * The places to sleep within reach: own points of kind 'sleep' up to maxKm (as the crow flies) from home,
 * the best rated first, then the nearest. → [{ ...point, km }] (at most `max`).
 */
export function biwakSpots(points = [], home, maxKm = BIWAK_DEFAULT.maxKm, max = 3) {
  if (!home || !Number.isFinite(home.lat) || !Number.isFinite(home.lon)) return [];
  return points
    .filter((p) => p?.kind === 'sleep' && Number.isFinite(p.lat) && Number.isFinite(p.lon))
    .map((p) => ({ ...p, km: Math.round(distKm(home, p) * 10) / 10 }))
    .filter((p) => p.km <= maxKm)
    .sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0) || a.km - b.km)
    .slice(0, max);
}

/** Minutes to ride there (the road is longer than the straight line: × 1.3), rounded to 5. */
export const rideMin = (km, kmh = BIWAK_KMH) => Math.max(5, Math.round(((km * 1.3) / kmh) * 12) * 5);

/** The night's weather from the home forecast: the evening's day (rain) and the coldest of the two days (min). */
export function nightWx(days = [], { day, next }) {
  const a = days.find((d) => d.date === day);
  if (!a) return null;
  const b = days.find((d) => d.date === next);
  const mins = [a.min, b?.min].filter(Number.isFinite);
  return { min: mins.length ? Math.min(...mins) : null, rain: a.rain ?? null };
}
