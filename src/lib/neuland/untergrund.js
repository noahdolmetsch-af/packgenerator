/**
 * «Untergrund» für «Wege hierher» (Noah 04.11.2026 «4b», Entdecken und Sammeln, Idee 3): what the run-up to a place
 * was like (asphalt, gravel, natural ground), looked up in OpenStreetMap (free Overpass API, no key).
 *
 * - Nothing loads by itself: a tap on «Look up the ground» asks once for the run-up of each day (the newest few).
 *   Only that stretch of line, about 3 km before the place, leaves the device.
 * - The answer stays on this device (db.meta `neuland.untergrund.<place>`: app memory, not in backups, not synced) and is
 *   there offline afterwards.
 * - It is rough on purpose: many paths have no surface entry in OpenStreetMap; those count as «unknown».
 * Pure parts tested in tests/neuland-untergrund.test.js (no network).
 */
import { segKm, km } from './geo.js';

export const CACHE_PREFIX = 'neuland.untergrund.';
export const cacheKey = (itemId) => `${CACHE_PREFIX}${itemId}`;
/** Ways within this distance of the line are looked at (metres). */
export const AROUND_M = 25;
/** A sample counts a way only when it lies this near (metres): the line is a GPS track, not the road. */
export const NEAR_M = 40;
export const STEP_KM = 0.25;
export const MAX_SAMPLES = 16;
/** One lookup asks for at most this many days (the newest), one question each. */
export const MAX_DAYS = 6;
export const KINDS = ['paved', 'gravel', 'ground', 'unknown'];

const PAVED = new Set(['asphalt', 'paved', 'concrete', 'concrete:plates', 'concrete:lanes', 'paving_stones', 'sett', 'cobblestone', 'metal', 'bricks', 'tartan']);
const GRAVEL = new Set(['compacted', 'fine_gravel', 'gravel', 'pebblestone', 'unhewn_cobblestone', 'woodchips']);
const GROUND = new Set(['unpaved', 'dirt', 'earth', 'ground', 'grass', 'mud', 'sand', 'rock', 'clay', 'snow', 'ice', 'grass_paver']);
/** Roads that are paved when nobody wrote a surface (Switzerland). */
const ROADS = new Set(['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'residential', 'living_street', 'motorway_link', 'trunk_link', 'primary_link', 'secondary_link', 'tertiary_link']);

/** 'paved' | 'gravel' | 'ground' | 'unknown' for the tags of a way. The surface wins; then the track grade; then the kind of road. */
export function classOf(tags = {}) {
  const s = String(tags.surface ?? '').split(';')[0].trim().toLowerCase();
  if (PAVED.has(s)) return 'paved';
  if (GRAVEL.has(s)) return 'gravel';
  if (GROUND.has(s)) return 'ground';
  const g = String(tags.tracktype ?? '').toLowerCase();
  if (g === 'grade1') return 'paved';
  if (g === 'grade2' || g === 'grade3') return 'gravel';
  if (g === 'grade4' || g === 'grade5') return 'ground';
  if (ROADS.has(tags.highway)) return 'paved';
  return 'unknown';
}

/** Points along a line [[lat, lon], …] about every stepKm, the first and the last kept, at most max. */
export function samplesOf(line, stepKm = STEP_KM, max = MAX_SAMPLES) {
  const pts = (line ?? []).filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (pts.length < 2) return pts.slice();
  const step = Math.max(stepKm, totalKm(pts) / (max - 1));
  const out = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    let a = pts[i - 1];
    const b = pts[i];
    let d = km(a, b);
    while (acc + d >= step && d > 0) {
      const t = (step - acc) / d;
      a = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      out.push(a);
      d = km(a, b);
      acc = 0;
    }
    acc += d;
  }
  const last = pts[pts.length - 1];
  if (km(out[out.length - 1], last) > step * 0.3 && out.length < max) out.push(last);
  return out.slice(0, max);
}
const totalKm = (pts) => pts.slice(1).reduce((s, p, i) => s + km(pts[i], p), 0);

const r5 = (v) => Math.round(v * 1e5) / 1e5;

/** The Overpass QL query: every way near the samples (a polyline), with its tags and shape. '' without two samples. */
export function surfaceQuery(samples, { around = AROUND_M, timeout = 25 } = {}) {
  if (!samples || samples.length < 2) return '';
  const coords = samples.map(([lat, lon]) => `${r5(lat)},${r5(lon)}`).join(',');
  return `[out:json][timeout:${timeout}];\nway(around:${around},${coords})["highway"];\nout tags geom;`;
}

/**
 * The Overpass answer → what each sample stands on. samples: the points asked about.
 * → { n, paved, gravel, ground, unknown } (counts; a sample with no way near it counts as unknown) or null without samples.
 */
export function parseSurface(json, samples) {
  if (!samples?.length) return null;
  const ways = (json?.elements ?? []).filter((e) => e?.type === 'way' && Array.isArray(e.geometry) && e.geometry.length > 1).map((e) => ({ cls: classOf(e.tags), g: e.geometry.map((p) => [p.lat, p.lon]) }));
  const out = { n: samples.length, paved: 0, gravel: 0, ground: 0, unknown: 0 };
  for (const p of samples) {
    let best = null;
    for (const w of ways) {
      for (let i = 1; i < w.g.length; i++) {
        const d = segKm(p, w.g[i - 1], w.g[i]) * 1000;
        if (d <= NEAR_M && (!best || d < best.d || (d === best.d && w.cls !== 'unknown' && best.cls === 'unknown'))) best = { d, cls: w.cls };
      }
    }
    out[best ? best.cls : 'unknown']++;
  }
  return out;
}

/** Shares in whole percent that add up to 100 (largest remainder), for { paved, gravel, ground, unknown }. */
export function sharesOf(c) {
  const n = KINDS.reduce((s, k) => s + (c?.[k] ?? 0), 0);
  if (!n) return null;
  const raw = KINDS.map((k) => ({ k, v: ((c[k] ?? 0) / n) * 100 }));
  const out = Object.fromEntries(raw.map((r) => [r.k, Math.floor(r.v)]));
  let rest = 100 - KINDS.reduce((s, k) => s + out[k], 0);
  for (const r of [...raw].sort((a, b) => b.v - Math.floor(b.v) - (a.v - Math.floor(a.v)))) {
    if (rest <= 0) break;
    out[r.k]++;
    rest--;
  }
  return out;
}

/** The stored answer of a place: { at, days: { [day]: counts } } or null. */
export async function readGround(db, itemId) {
  const v = (await db.meta.get(cacheKey(itemId)))?.value;
  return v && typeof v === 'object' && v.days && typeof v.days === 'object' ? v : null;
}

/**
 * The lookup. ways: waysOf() of the place. Asks for the newest days that have a run-up and no stored answer yet (at most
 * MAX_DAYS; force: all of them again), one question each, and stores what came back.
 * → { rec (all stored days), asked, failed: null | 'busy' | 'net' | 'failed' }; never throws.
 * opts: fetcher (tests), now (ms), urls.
 */
export async function lookupGround(db, itemId, ways, { fetcher, now = Date.now(), force = false, urls } = {}) {
  const prev = (await readGround(db, itemId)) ?? { at: 0, days: {} };
  const todo = ways.filter((w) => w.run?.length > 1 && (force || !prev.days[w.day])).slice(0, MAX_DAYS);
  const rec = { at: prev.at, days: { ...prev.days } };
  let asked = 0;
  let failed = null;
  const pois = await import('../route/pois.js');
  const servers = urls ?? pois.overpassUrls(todo.map((w) => ({ lat: w.run[0][0], lon: w.run[0][1] })));
  for (const w of todo) {
    const samples = samplesOf(w.run);
    const query = surfaceQuery(samples);
    if (!query) continue;
    try {
      const json = await pois.fetchOverpass(query, { ...(fetcher ? { fetcher } : {}), urls: servers });
      const c = parseSurface(json, samples);
      if (c) {
        rec.days[w.day] = c;
        rec.at = now;
        asked++;
      }
    } catch (err) {
      failed = err?.why ?? 'failed';
      break;
    }
  }
  if (asked) await db.meta.put({ key: cacheKey(itemId), value: JSON.parse(JSON.stringify(rec)) });
  return { rec, asked, failed };
}
