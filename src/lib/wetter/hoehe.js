/**
 * «Temperaturen nach Höhe» (Noah 05.11.2026 «1b 2a und c 3a …»): the air temperature at 1000, 2000 and 3000 m above sea
 * level (the ski tours later at 500 … 4000 m), next to the lake. No own request: the air layers of wetter/profil.js
 * (shared with «Nebelgrenze») give the temperature at nine pressure levels and their real heights; between two layers
 * the temperature is taken linearly (profil.js tempAt). So an inversion (warmer above than below) shows as it is.
 *
 * It is the temperature of the free air at that height over the place, not a measurement on a slope in the sun; it
 * can be off by a few degrees. A height under the ground of the place (or above the highest layer, about 4000 m
 * in cold air) has no value: the card says so instead of guessing.
 *
 * - SPOTS: places in the mountains to look at (Noah: Sedrun, Lenzerheide, Davos, Saas-Fee, Ascona and more);
 * - PEAKS: Swiss peaks of about 1000 to 3600 m, picked in place of a place: the card shows the temperature AT the summit;
 * - rowsOf / daysOf: the numbers for the card (now, 6, 12 and 18 h today, the next days as low–high);
 * - zeroLine: the height of 0 °C in the air above the place (a check against the weather model's freezing level).
 *
 * Pure functions, tested in tests/hoehe.test.js.
 */
import { localDate, localHour, atLocal } from './kern.js';
import { profile, tempAt } from './profil.js';

/** The card's heights (m above sea level), highest first; and the ski planning's heights (PR «Skitour planen»). */
export const HEIGHTS = [3000, 2000, 1000];
export const SKI_HEIGHTS = [4000, 3500, 3000, 2500, 2000, 1500, 1000, 500];
/** The times of today (local hours) the card shows besides «now». */
export const SLOTS = [6, 12, 18];
/** How many days after today the card shows (as low–high from 6 to 21 h). */
export const DAYS_AHEAD = 2;

export const SEL_KEY = 'hoehe.orte'; // the chosen items: ['page', 'sedrun', 'peak:corvatsch', 'own:<id>']
export const OWN_KEY = 'hoehe.eigene'; // your own places: [{ id, name, lat, lon }]
export const HOME_KEY = 'hoehe.heute'; // false = no line on Today

/** Places in the mountains (centre of the village; proper names, no translation). */
export const SPOTS = [
  { id: 'sedrun', name: 'Sedrun', lat: 46.6833, lon: 8.7667 },
  { id: 'andermatt', name: 'Andermatt', lat: 46.6339, lon: 8.5942 },
  { id: 'lenzerheide', name: 'Lenzerheide', lat: 46.727, lon: 9.556 },
  { id: 'davos', name: 'Davos', lat: 46.8027, lon: 9.836 },
  { id: 'stmoritz', name: 'St. Moritz', lat: 46.4908, lon: 9.8355 },
  { id: 'grindelwald', name: 'Grindelwald', lat: 46.6242, lon: 8.0414 },
  { id: 'zermatt', name: 'Zermatt', lat: 46.0207, lon: 7.7491 },
  { id: 'saasfee', name: 'Saas-Fee', lat: 46.1086, lon: 7.9289 },
  { id: 'ascona', name: 'Ascona', lat: 46.1558, lon: 8.7686 },
];

/**
 * Swiss peaks and viewpoints, sorted by height, as a pick-list «about 1000 / 2000 / 3000 m». z = height in m above sea
 * level (rounded), lat/lon the summit to about 1 km. Put together by hand; a wrong number can be told to the app's
 * thread and is changed here.
 */
export const PEAKS = [
  { id: 'uetliberg', name: 'Üetliberg', z: 870, lat: 47.3498, lon: 8.4912 },
  { id: 'weissenstein', name: 'Weissenstein', z: 1284, lat: 47.2536, lon: 7.5189 },
  { id: 'napf', name: 'Napf', z: 1408, lat: 47.0036, lon: 7.9407 },
  { id: 'hoherkasten', name: 'Hoher Kasten', z: 1794, lat: 47.285, lon: 9.4553 },
  { id: 'rigi', name: 'Rigi Kulm', z: 1798, lat: 47.0567, lon: 8.4855 },
  { id: 'pilatus', name: 'Pilatus Kulm', z: 2073, lat: 46.9789, lon: 8.2522 },
  { id: 'rothorn', name: 'Brienzer Rothorn', z: 2350, lat: 46.7864, lon: 8.0472 },
  { id: 'saentis', name: 'Säntis', z: 2502, lat: 47.2494, lon: 9.3433 },
  { id: 'schilthorn', name: 'Schilthorn', z: 2970, lat: 46.5586, lon: 7.835 },
  { id: 'gornergrat', name: 'Gornergrat', z: 3089, lat: 45.9835, lon: 7.7842 },
  { id: 'titlis', name: 'Titlis', z: 3238, lat: 46.7717, lon: 8.4377 },
  { id: 'corvatsch', name: 'Piz Corvatsch', z: 3303, lat: 46.418, lon: 9.821 },
  { id: 'pizbuin', name: 'Piz Buin', z: 3312, lat: 46.8408, lon: 10.1197 },
  { id: 'jungfraujoch', name: 'Jungfraujoch', z: 3466, lat: 46.5475, lon: 7.9853 },
  { id: 'toedi', name: 'Tödi', z: 3614, lat: 46.8128, lon: 8.915 },
];

/** The peaks nearest to a height (for the group headings «about 1000 m» …): the ones within ±500 m of it. */
export const peaksNear = (z) => PEAKS.filter((p) => Math.abs(p.z - z) <= 500);

const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const hourAt = (prof, ms) => (prof?.hours ?? []).find((h) => h.ms <= ms && ms < h.ms + 36e5) ?? null;

/** The temperature at height z in one hour of the answer (°C, one decimal) or null. */
export function tempIn(prof, hour, z) {
  if (!hour || !fin(z)) return null;
  const v = tempAt(profile(hour, prof?.elev), z);
  return v == null ? null : Math.round(v * 10) / 10;
}

/** The temperature at height z now (the hour that holds `now`) or null. */
export const tempNow = (prof, z, now = Date.now()) => tempIn(prof, hourAt(prof, now), z);

/**
 * The numbers for one height: { z, now, slots: [{ hour, t }], days: [{ date, min, max }] }. The slots are today's
 * 6, 12 and 18 h; the days the next DAYS_AHEAD days as the lowest and highest value from 6 to 21 h. Any value may be null.
 */
export function rowOf(prof, z, now = Date.now()) {
  const off = prof?.offset ?? 0;
  const today = localDate(now, off);
  const slots = SLOTS.map((hour) => ({ hour, t: tempIn(prof, hourAt(prof, atLocal(today, hour, off)), z) }));
  const days = [];
  for (let n = 1; n <= DAYS_AHEAD; n++) {
    const date = localDate(Date.parse(`${today}T12:00:00Z`) + n * 864e5, 0);
    const vals = (prof?.hours ?? [])
      .filter((h) => fin(h.ms) && localDate(h.ms, off) === date && localHour(h.ms, off) >= 6 && localHour(h.ms, off) <= 21)
      .map((h) => tempIn(prof, h, z))
      .filter(fin);
    days.push({ date, min: vals.length ? Math.min(...vals) : null, max: vals.length ? Math.max(...vals) : null });
  }
  return { z, now: tempNow(prof, z, now), slots, days };
}

/** All rows of the card for a list of heights (a place: HEIGHTS; a peak: its own height). */
export const rowsOf = (prof, heights = HEIGHTS, now = Date.now()) => heights.map((z) => rowOf(prof, z, now));

/** True when at least one value of the rows is there (else the card says «no value for these heights»). */
export const hasValue = (rows) => rows.some((r) => fin(r.now) || r.slots.some((s) => fin(s.t)) || r.days.some((d) => fin(d.min)));

/**
 * The height of 0 °C in the air above the place now (m, rounded to 100): the first crossing from above zero to below
 * it when going up; the lowest layer's height if it is already below zero; null if the air is above 0 °C everywhere
 * (or without a profile).
 */
export function zeroLine(prof, now = Date.now()) {
  const pts = profile(hourAt(prof, now), prof?.elev);
  if (pts.length < 2) return null;
  if (pts[0].t <= 0) return Math.round(pts[0].z / 100) * 100;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (a.t > 0 && b.t <= 0) return Math.round((a.z + ((0 - a.t) * (b.z - a.z)) / (b.t - a.t)) / 100) * 100;
  }
  return null;
}

/** The chosen items of the card (ids). Without a setting: only the place of the page. */
export const selOf = (v) => (Array.isArray(v) && v.length ? v.filter((x) => typeof x === 'string') : ['page']);

/** One id → { id, kind: 'page'|'spot'|'peak'|'own', name, lat, lon, z? } (null when it is gone, e.g. a deleted own place). */
export function itemOf(id, { page = null, own = [] } = {}) {
  if (id === 'page') return page && fin(Number(page.lat)) ? { id, kind: 'page', name: page.name || '', lat: Number(page.lat), lon: Number(page.lon) } : null;
  if (id.startsWith('peak:')) {
    const p = PEAKS.find((x) => x.id === id.slice(5));
    return p ? { id, kind: 'peak', name: p.name, lat: p.lat, lon: p.lon, z: p.z } : null;
  }
  if (id.startsWith('own:')) {
    const o = own.find((x) => x.id === id.slice(4));
    return o ? { id, kind: 'own', name: o.name, lat: o.lat, lon: o.lon } : null;
  }
  const s = SPOTS.find((x) => x.id === id);
  return s ? { id, kind: 'spot', name: s.name, lat: s.lat, lon: s.lon } : null;
}

/** The own places of the setting (clean list). */
export const ownOf = (v) => (Array.isArray(v) ? v.filter((o) => o && typeof o.id === 'string' && fin(Number(o.lat)) && fin(Number(o.lon))).map((o) => ({ id: o.id, name: String(o.name ?? ''), lat: Number(o.lat), lon: Number(o.lon) })) : []);

/** Toggle an id in the chosen list (the order stays; the last item can be taken away too: the card then falls back to the page's place). */
export const toggleSel = (sel, id) => (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);

/** A new id for an own place. */
export const newOwnId = (own, now = Date.now()) => {
  let n = now.toString(36);
  while (own.some((o) => o.id === n)) n += 'x';
  return n;
};
