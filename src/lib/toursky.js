/**
 * Paket G (Noah 19.10.2026 «1a», «4-6»): three small hints on the packing list of a planned tour,
 * each from data the app already has, each only a suggestion with «Dazu» (add) and nothing forced.
 * - Licht (#1): a stage goes on after sunset (blockplan.js) → the light and the reflective vest.
 * - Sonne (#6): the UV index of the forecast → sunscreen and sunglasses from 6 (high), on a ski tour
 *   from 3 also the glacier glasses (snow reflects).
 * - Rückenwind (#5): a round tour (start and end close) and the wind of the start day → which way
 *   round gives the tailwind on the way home.
 * Pure functions.
 */
import { ridesIntoDark, sunTimes, offsetFor } from './blockplan.js';
import { forecastForTrip } from './weather.js';
import { distKm } from './route.js';
import { domainOf } from './domains.js';
import { isInventory } from './gear.js';

export const UV_HIGH = 6;
export const UV_SNOW = 3;
export const WIND_MIN = 12; // km/h: below it the direction does not matter
export const LOOP_KM = 1.5;

const nameOf = (i) => `${i?.name ?? ''} ${i?.nameDe ?? ''}`;
export const WORDS = {
  lamp: (i) => i?.category === 'light' || /stirnlampe|headlamp|velolicht|bike light|rücklicht|ruecklicht|frontlicht|lampe\b|lamp\b/i.test(nameOf(i)),
  vest: (i) => /reflex|reflective|warnweste|leuchtweste|hi-?vis|safety vest/i.test(nameOf(i)),
  sunscreen: (i) => /sonnencreme|sonnenschutz|sunscreen|sun cream|sunblock|lsf|spf/i.test(nameOf(i)),
  sunglasses: (i) => /sonnenbrille|sunglasses/i.test(nameOf(i)) && !/gletscher|glacier/i.test(nameOf(i)),
  glacier: (i) => /gletscherbrille|glacier glasses|glacier goggles|kategorie 4|category 4|cat\.? ?4/i.test(nameOf(i)),
};

/** For each wanted kind: the first own item of that kind, and whether it is on the list already. */
function wants(kinds, trip, items) {
  const on = new Set((trip?.entries ?? []).map((e) => e.itemId));
  const own = (items ?? []).filter((i) => isInventory(i));
  return kinds.map((kind) => {
    const all = own.filter(WORDS[kind]);
    const packed = all.find((i) => on.has(i.id));
    return { kind, item: packed ?? all[0] ?? null, onList: !!packed };
  });
}

/** Licht: { set: 'HH:MM' | null, want } when the ride goes into the dark, else null. */
export function lightTip(trip, items, place) {
  if (!ridesIntoDark(trip, place)) return null;
  const sun = place && trip?.startDate ? sunTimes(trip.startDate, place.lat, place.lon) : null;
  const set = sun ? new Date(sun.set + offsetFor(trip.startDate) * 6e4).toISOString().slice(11, 16) : null;
  return { set, want: wants(['lamp', 'vest'], trip, items) };
}

/** Sonne: { uv, want } from UV 6 (on a ski tour from 3, with the glacier glasses), else null. */
export function sunTip(trip, items) {
  const uvs = forecastForTrip(trip).map((d) => d.uv).filter((v) => typeof v === 'number');
  if (!uvs.length) return null;
  const uv = Math.max(...uvs);
  const snow = domainOf(trip) === 'ski';
  if (uv < UV_HIGH && !(snow && uv >= UV_SNOW)) return null;
  return { uv: Math.round(uv), snow, want: wants(snow ? ['sunscreen', 'glacier'] : ['sunscreen', 'sunglasses'], trip, items) };
}

const RAD = Math.PI / 180;
const bearing = (a, b) => {
  const y = Math.sin((b.lon - a.lon) * RAD) * Math.cos(b.lat * RAD);
  const x = Math.cos(a.lat * RAD) * Math.sin(b.lat * RAD) - Math.sin(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.cos((b.lon - a.lon) * RAD);
  return (Math.atan2(y, x) / RAD + 360) % 360;
};

/**
 * How much of the first and the last third of a line goes into the wind (km, + into the wind, − with
 * it). windFrom: the direction the wind comes from (degrees, as the forecast gives it). The middle does
 * not decide: on a round tour the halfway point is the same both ways, the start and the end are not.
 */
export function intoWind(line, windFrom) {
  const pts = (line ?? []).map(([lat, lon]) => ({ lat, lon }));
  const legs = pts.slice(1).map((p, n) => ({ km: distKm(pts[n], p), b: bearing(pts[n], p) }));
  const total = legs.reduce((s, l) => s + l.km, 0);
  let run = 0;
  let first = 0;
  let last = 0;
  for (const l of legs) {
    const into = l.km * Math.cos((l.b - windFrom) * RAD);
    const mid = run + l.km / 2;
    if (mid <= total / 3) first += into;
    else if (mid >= (total * 2) / 3) last += into;
    run += l.km;
  }
  return { first, last, total };
}

/**
 * Rückenwind: on a round tour with wind of WIND_MIN or more on the start day → { windFrom, wind,
 * way: 'keep' | 'reverse' } (keep: the planned way already has more tailwind on the last third, the
 * way home), else null (no round tour, little wind, or about the same both ways).
 */
export function windTip(trip) {
  const line = trip?.route?.line;
  if (!line || line.length < 4 || (Number(trip.days) || 1) > 1) return null;
  const a = { lat: line[0][0], lon: line[0][1] };
  const b = { lat: line.at(-1)[0], lon: line.at(-1)[1] };
  if (distKm(a, b) > LOOP_KM) return null;
  const day = forecastForTrip(trip)[0];
  const wind = day?.wind ?? (day?.gust != null ? day.gust / 1.6 : null);
  if (day?.windDir == null || wind == null || wind < WIND_MIN) return null;
  const w = intoWind(line, day.windDir);
  if (w.total < 5) return null;
  // the way home is the last third: planned = its own last third; reversed = the first third, ridden backwards
  const homeKeep = w.last;
  const homeReverse = -w.first;
  if (Math.abs(homeKeep - homeReverse) < (w.total / 3) * 0.2) return null;
  return { windFrom: Math.round(day.windDir), wind: Math.round(wind), way: homeKeep <= homeReverse ? 'keep' : 'reverse' };
}

/** 16 compass words for the wind direction (English keys for t()). */
const COMPASS = ['north', 'north-northeast', 'northeast', 'east-northeast', 'east', 'east-southeast', 'southeast', 'south-southeast', 'south', 'south-southwest', 'southwest', 'west-southwest', 'west', 'west-northwest', 'northwest', 'north-northwest'];
export const compass = (deg) => COMPASS[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
