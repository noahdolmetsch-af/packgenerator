/**
 * Einzelidee Heute 2 (UC-009-I3 «Überraschungsrunde mit Grenzen», Noah 25.10.2026): you pick how much
 * adventure and how much time, the app suggests a round from home you have not ridden yet. The way there
 * can stay hidden until you ride («Ziel erst unterwegs»).
 *
 * How the round is made: a triangle home → A → B → home. A lies in the direction you rode least (the
 * points of your own trip routes, by eight compass sectors), B a bit further round. The size comes from
 * the time and the speed of the level; the free bike router (BRouter, as «Umweg neu planen»: one request
 * per tap, never in the background) finds the real way. Nothing is sent anywhere else.
 * Pure functions plus planSurprise (takes a fetcher for tests). Tested in tests/ueberraschung.test.js.
 */
import { brouterUrl, parseBrouter } from './reroute.js';
import { distKm } from './route.js';

/** The levels: speed on the flat (km/h), router profile, how strictly the unknown side is chosen. */
export const LEVELS = [
  { key: 'easy', name: 'Easy-going', sub: 'quiet roads, a little new', kmh: 17, profile: 'trekking', strict: false },
  { key: 'curious', name: 'Curious', sub: 'mostly new roads', kmh: 19, profile: 'trekking', strict: true },
  { key: 'wild', name: 'Wild', sub: 'the side you know least, gravel welcome', kmh: 17, profile: 'trekking', strict: true, far: true },
];
export const LEVEL_STD = 'curious';
/** The time to choose (hours). */
export const HOURS = [1, 1.5, 2, 3, 4];
export const HOURS_STD = 2;
/** The eight compass sectors, from north clockwise (English keys for t()). */
export const SECTORS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
/** Roads are longer than the straight line by about this much. */
export const ROAD_FACTOR = 1.3;
/** Only route points within this many km of home count for «known». */
export const KNOWN_KM = 80;
/** The angle between A and B seen from home (degrees). */
export const SPREAD = 50;

const fin = (v) => Number.isFinite(Number(v));
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

/** The bearing from a to b in degrees (0 = north, clockwise). */
export function bearing(a, b) {
  const y = Math.sin(rad(b.lon - a.lon)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon - a.lon));
  return (deg(Math.atan2(y, x)) + 360) % 360;
}
/** The point km away from p in the direction deg. */
export function destination(p, deg0, km) {
  const R = 6371;
  const d = km / R;
  const b = rad(deg0);
  const la = rad(p.lat);
  const lo = rad(p.lon);
  const la2 = Math.asin(Math.sin(la) * Math.cos(d) + Math.cos(la) * Math.sin(d) * Math.cos(b));
  const lo2 = lo + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(la), Math.cos(d) - Math.sin(la) * Math.sin(la2));
  return { lat: Math.round(deg(la2) * 1e5) / 1e5, lon: Math.round((((deg(lo2) + 540) % 360) - 180) * 1e5) / 1e5 };
}
export const sectorOf = (deg0) => Math.round((((deg0 % 360) + 360) % 360) / 45) % 8;

/**
 * How well you know each sector: the points of your trip routes (trip.route.line [[lat, lon]] or
 * [{ lat, lon }]) within KNOWN_KM of home, counted per sector. → [8 numbers].
 */
export function knownSectors(trips = [], home) {
  const out = Array(8).fill(0);
  if (!home || !fin(home.lat) || !fin(home.lon)) return out;
  for (const tr of trips) {
    const line = tr?.route?.line;
    if (!Array.isArray(line)) continue;
    for (const p of line) {
      const q = Array.isArray(p) ? { lat: Number(p[0]), lon: Number(p[1]) } : { lat: Number(p?.lat), lon: Number(p?.lon) };
      if (!fin(q.lat) || !fin(q.lon)) continue;
      const d = distKm(home, q);
      if (d < 1 || d > KNOWN_KM) continue;
      out[sectorOf(bearing(home, q))]++;
    }
  }
  return out;
}

/**
 * The sector to ride to. strict: one of the least known; else any of the less known half. skip: sectors
 * already suggested (the «Andere Runde» button), tried last. rnd: 0…1 (Math.random in the app).
 */
export function pickSector(known = Array(8).fill(0), { strict = true, skip = [], rnd = Math.random() } = {}) {
  const order = known.map((n, i) => ({ i, n })).sort((a, b) => a.n - b.n || a.i - b.i);
  const fresh = order.filter((s) => !skip.includes(s.i));
  const pool0 = fresh.length ? fresh : order;
  const min = pool0[0].n;
  const pool = strict ? pool0.filter((s) => s.n === min) : pool0.slice(0, Math.max(1, Math.ceil(pool0.length / 2)));
  return pool[Math.min(pool.length - 1, Math.floor(rnd * pool.length))].i;
}

/**
 * The plan of a round: { level, hours, sector, km (wanted), via: [A, B] }. home: { lat, lon }.
 * The triangle has two sides of r and one of 2·r·sin(SPREAD/2); roads add ROAD_FACTOR.
 */
export function surprisePlan(home, { level = LEVEL_STD, hours = HOURS_STD, known = Array(8).fill(0), skip = [], rnd = Math.random(), turn = Math.random() } = {}) {
  if (!home || !fin(home.lat) || !fin(home.lon)) return null;
  const L = LEVELS.find((x) => x.key === level) ?? LEVELS.find((x) => x.key === LEVEL_STD);
  const h = HOURS.includes(hours) ? hours : HOURS_STD;
  const km = Math.round(h * L.kmh);
  const sector = pickSector(known, { strict: L.strict, skip, rnd });
  const around = 2 + 2 * Math.sin(rad(SPREAD / 2));
  const r = km / (around * ROAD_FACTOR);
  const dir = sector * 45 + (L.far ? 0 : (rnd - 0.5) * 20);
  const side = turn < 0.5 ? -1 : 1;
  const a = destination(home, dir - (side * SPREAD) / 2, r);
  const b = destination(home, dir + (side * SPREAD) / 2, r);
  return { level: L.key, profile: L.profile, hours: h, sector, km, via: [a, b] };
}

/** The riding time of a round in minutes from its km and climb, at the level's speed (+1 h per 600 m). */
export const minutesOf = (km, gainM, kmh) => Math.round(((km || 0) / kmh + (gainM || 0) / 600) * 60);

/**
 * Ask the router for the round. → { line, km, gainM, min, sector, hours, level, home, at }.
 * Throws 'busy', 'noroute' or 'failed' (as planDetour).
 */
export async function planSurprise(home, plan, { fetcher = fetch, now = Date.now() } = {}) {
  if (!home || !plan) throw new Error('failed');
  const P = { lat: Number(home.lat), lon: Number(home.lon) };
  let res;
  try {
    res = await fetcher(brouterUrl([P, ...plan.via, P], plan.profile));
  } catch {
    throw new Error('failed');
  }
  if (res.status === 429 || res.status === 503) throw new Error('busy');
  if (!res.ok) throw new Error(res.status === 400 || res.status === 500 ? 'noroute' : 'failed');
  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error('noroute');
  }
  const r = parseBrouter(json);
  if (!r) throw new Error('noroute');
  const L = LEVELS.find((x) => x.key === plan.level) ?? LEVELS[1];
  return { ...r, min: minutesOf(r.km, r.gainM, L.kmh), sector: plan.sector, hours: plan.hours, level: plan.level, home: P, at: now };
}

/** The round as a parsed GPX ({ name, points }), ready for route.js routeStats. */
export function gpxOfRound(round, name = 'Surprise round') {
  const points = (round?.line ?? []).map(([lat, lon, ele]) => ({ lat, lon, ele: fin(ele) ? ele : null }));
  if (points.length < 2) return null;
  return { name, points };
}
