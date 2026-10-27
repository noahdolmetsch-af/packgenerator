/**
 * «Brunnen und Velo-Werkstätten an der Strecke» (Noah 19.10.2026, built without mockups): along a
 * trip's route the drinking water fountains, bike shops and public pumps / repair stands from
 * OpenStreetMap, through the free Overpass API (no key, no cost).
 *
 * - Nothing loads by itself: the card asks only after a tap (RoutePois.svelte).
 * - The query asks for everything within AROUND_M of the route line (the line thinned to MAX_PTS).
 * - The answer stays on this device (db.meta `pois.<tripId>`: app memory, not in backups, not synced),
 *   with a hash of the line: it works offline afterwards and is asked again only on «Neu laden» or when
 *   the route changed.
 * - Names come from OpenStreetMap as they are; they never go through t().
 */
import { distKm } from '../route.js';

import { queued } from './oneatatime.js';

// Live Navigation PR 2 (Noah 26.10.2026 «OSM ausgelastet, Backup-Server»): three free servers in turn, and the
// Swiss one first when the search lies in Switzerland (it only knows Swiss data, so only there)
export const OVERPASS_URLS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
export const OVERPASS_CH = 'https://overpass.osm.ch/api/interpreter';
/** Switzerland as a box (lat, lon), a little generous at the borders it is not used for. */
export const CH_BOX = { s: 45.82, n: 47.81, w: 5.96, e: 10.49 };
const inCh = (p) => !!p && Number.isFinite(p.lat) && Number.isFinite(p.lon) && p.lat >= CH_BOX.s && p.lat <= CH_BOX.n && p.lon >= CH_BOX.w && p.lon <= CH_BOX.e;
/** The servers to ask for a search whose points are pts ([{ lat, lon }]): the Swiss one first when all lie in Switzerland. */
export const overpassUrls = (pts = []) => (pts.length && pts.every(inCh) ? [OVERPASS_CH, ...OVERPASS_URLS] : OVERPASS_URLS);

/**
 * Why the servers did not answer → 'busy' (a server said it is full or too slow: 429, 503, 504, a timeout),
 * 'net' (none could be reached: no internet, or blocked) or 'failed' (another error, e.g. a wrong answer).
 */
export function whyFailed(errors = []) {
  const msgs = errors.map((e) => `${e?.name ?? ''} ${e?.message ?? e ?? ''}`);
  if (msgs.some((m) => /\b(429|503|504)\b|abort|timeout/i.test(m))) return 'busy';
  if (msgs.length && msgs.every((m) => /TypeError|Failed to fetch|NetworkError|Load failed|ENOTFOUND|ECONN/i.test(m))) return 'net';
  return 'failed';
}
export const AROUND_M = 250;
export const MAX_PTS = 150;
export const MAX_POIS = 300;
export const TIMEOUT_MS = 25000;
export const KINDS = ['water', 'shop', 'repair'];
export const cacheKey = (tripId) => `pois.${tripId}`;

/** The tags asked for: [key, value, kind]. The first matching one gives the kind. */
export const TAGS = [
  ['amenity', 'drinking_water', 'water'],
  ['shop', 'bicycle', 'shop'],
  ['amenity', 'bicycle_repair_station', 'repair'],
  ['service:bicycle:pump', 'yes', 'repair'],
  ['amenity', 'compressed_air', 'repair'],
];

/** Every n-th point, the first and the last kept: at most `max` points. */
export function thinLine(line, max = MAX_PTS) {
  const pts = (line ?? []).filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (pts.length <= max) return pts;
  const step = (pts.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => pts[Math.round(i * step)]);
}

const r5 = (v) => Math.round(v * 1e5) / 1e5;

/** The Overpass QL query for the line, or '' without a usable line. */
export function buildQuery(line, { around = AROUND_M, max = MAX_PTS, timeout = Math.round(TIMEOUT_MS / 1000) } = {}) {
  const pts = thinLine(line, max);
  if (pts.length < 2) return '';
  const coords = pts.map(([lat, lon]) => `${r5(lat)},${r5(lon)}`).join(',');
  const parts = TAGS.map(([k, v]) => `  nwr(around:${around},${coords})["${k}"="${v}"];`);
  return `[out:json][timeout:${timeout}];\n(\n${parts.join('\n')}\n);\nout center tags ${MAX_POIS + 100};`;
}

/** The kind of an OSM element by its tags, or null. A shop stays a shop even when it has a pump. */
export function kindOf(tags = {}) {
  for (const [k, v, kind] of TAGS) if (tags[k] === v) return kind;
  return null;
}

/** Cumulative km of the line's points: [0, …, sum]. */
function cumKm(pts) {
  const out = [0];
  for (let i = 1; i < pts.length; i++) out.push(out[i - 1] + distKm({ lat: pts[i - 1][0], lon: pts[i - 1][1] }, { lat: pts[i][0], lon: pts[i][1] }));
  return out;
}

/**
 * Where a point lies along the line: { km (along the line, scaled to totalKm), off (metres beside it) }.
 * Projection onto the nearest segment in a local flat plane (good enough for metres beside a route).
 */
export function projectKm(line, lat, lon, totalKm = null, cum = null) {
  const pts = line ?? [];
  if (!pts.length) return { km: 0, off: 0 };
  const c = cum ?? cumKm(pts);
  const sum = c.at(-1) || 0;
  const kx = 111.32 * Math.cos((lat * Math.PI) / 180);
  const ky = 110.57;
  let best = { d2: Infinity, km: 0 };
  if (pts.length === 1) best = { d2: ((pts[0][1] - lon) * kx) ** 2 + ((pts[0][0] - lat) * ky) ** 2, km: 0 };
  for (let i = 1; i < pts.length; i++) {
    const ax = (pts[i - 1][1] - lon) * kx;
    const ay = (pts[i - 1][0] - lat) * ky;
    const bx = (pts[i][1] - lon) * kx;
    const by = (pts[i][0] - lat) * ky;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const f = len2 ? Math.min(1, Math.max(0, -(ax * dx + ay * dy) / len2)) : 0;
    const px = ax + dx * f;
    const py = ay + dy * f;
    const d2 = px * px + py * py;
    if (d2 < best.d2) best = { d2, km: c[i - 1] + (c[i] - c[i - 1]) * f };
  }
  const scale = totalKm > 0 && sum > 0 ? totalKm / sum : 1;
  return { km: Math.round(best.km * scale * 10) / 10, off: Math.round(Math.sqrt(best.d2) * 1000) };
}

/**
 * The Overpass JSON answer → [{ id, kind, name, lat, lon, km, off, open }], sorted by km, deduped (the
 * same element, or the same kind and name within 30 m, e.g. a shop drawn as a point and as a building),
 * at most `max`. id: 'node/123' (also the path on openstreetmap.org).
 */
export function parsePois(json, line, totalKm = null, { max = MAX_POIS } = {}) {
  const els = Array.isArray(json?.elements) ? json.elements : [];
  const pts = line ?? [];
  const cum = cumKm(pts);
  const seen = new Set();
  const out = [];
  for (const el of els) {
    const lat = Number(el?.lat ?? el?.center?.lat);
    const lon = Number(el?.lon ?? el?.center?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !['node', 'way', 'relation'].includes(el?.type)) continue;
    const kind = kindOf(el.tags);
    if (!kind) continue;
    const id = `${el.type}/${el.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const tags = el.tags ?? {};
    const name = String(tags.name ?? tags.operator ?? tags.brand ?? '').trim();
    const { km, off } = projectKm(pts, lat, lon, totalKm, cum);
    out.push({ id, kind, name, lat: r5(lat), lon: r5(lon), km, off, open: String(tags.opening_hours ?? '').trim(), n: Object.keys(tags).length });
  }
  const order = (a, b) => a.km - b.km || a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id);
  out.sort(order);
  // twins: keep the one that tells more (more tags), at its own km
  const kept = [];
  for (const p of out) {
    const at = kept.findIndex((q) => q.kind === p.kind && q.name === p.name && distKm(q, p) < 0.03);
    if (at < 0) kept.push(p);
    else if (p.n > kept[at].n) kept[at] = p;
  }
  return kept.sort(order).slice(0, max).map(({ n, ...p }) => p);
}

/** A short hash of the line and its km: tells when the route changed. */
export function lineHash(line, km = 0) {
  const s = `${Math.round((km || 0) * 10)}|${(line ?? []).map(([a, b]) => `${r5(a)},${r5(b)}`).join(';')}`;
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** Asks Overpass (each server in turn). → the JSON answer; throws when all fail (err.why: whyFailed). */
export function fetchOverpass(query, opts = {}) {
  return queued(() => askOverpass(query, opts));
}
async function askOverpass(query, { fetcher = (...a) => fetch(...a), urls = OVERPASS_URLS, timeout = TIMEOUT_MS } = {}) {
  const errors = [];
  for (const url of urls) {
    const ctl = typeof AbortController === 'undefined' ? null : new AbortController();
    const timer = ctl ? setTimeout(() => ctl.abort(), timeout) : null;
    try {
      const res = await fetcher(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', Accept: 'application/json' },
        body: `data=${encodeURIComponent(query)}`,
        ...(ctl ? { signal: ctl.signal } : {}),
      });
      if (!res?.ok) throw new Error(`overpass ${res?.status}`);
      const json = await res.json();
      if (!Array.isArray(json?.elements)) throw new Error('overpass: no elements');
      return json;
    } catch (err) {
      errors.push(err);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  // every server failed: the error says why (whyFailed) and how many were asked
  const err = new Error(`overpass: ${errors.map((e) => e?.message ?? e).join(' | ') || 'no server'}`);
  err.why = whyFailed(errors);
  err.tried = urls.length;
  throw err;
}

/** The stored answer of a trip: { hash, fetchedAt, items, cut } or null. */
export async function readPois(db, tripId) {
  const v = (await db.meta.get(cacheKey(tripId)))?.value;
  return v && Array.isArray(v.items) ? v : null;
}

/** Does the stored answer still fit the trip's route? */
export const fitsRoute = (cache, trip) => !!cache && cache.hash === lineHash(trip?.route?.line, trip?.route?.km);

/**
 * The card's one call. The stored answer when it fits the route (unless force), else a new one (stored).
 * On an error: the stored one that fits, with error set, or { error: true, items: null }.
 */
export async function loadPois(db, trip, { fetcher, force = false, now = new Date(), urls } = {}) {
  const line = trip?.route?.line;
  const km = trip?.route?.km;
  const hash = lineHash(line, km);
  const cache = await readPois(db, trip.id);
  const fits = cache?.hash === hash;
  if (fits && !force) return cache;
  const query = buildQuery(line);
  if (!query) return { error: true, items: null };
  try {
    const json = await fetchOverpass(query, { ...(fetcher ? { fetcher } : {}), ...(urls ? { urls } : {}) });
    const all = parsePois(json, line, km, { max: Infinity });
    const rec = { hash, fetchedAt: now.toISOString(), items: all.slice(0, MAX_POIS), cut: all.length > MAX_POIS };
    await db.meta.put({ key: cacheKey(trip.id), value: rec });
    return rec;
  } catch {
    return fits ? { ...cache, error: true } : { error: true, items: null };
  }
}

/** Counts per kind: { water, shop, repair }. */
export function countKinds(items) {
  const c = { water: 0, shop: 0, repair: 0 };
  for (const p of items ?? []) if (p.kind in c) c[p.kind]++;
  return c;
}

export const osmUrl = (id) => `https://www.openstreetmap.org/${id}`;
