/**
 * «Orte auf der Karte» (Noah 19.10.2026 «brunnen, einkaufsmöglichkeiten, tankstellen, bikeshops,
 * restaurants, hotels, zeltplätze, öffentliche toiletten … aktiv in der karte anzeigen … im umkreis von
 * 10km»): the places of the switched-on kinds from OpenStreetMap, through the free Overpass API (no key,
 * no cost, fair use: one query per tap, a timeout, at most MAX_PLACES places, two mirrors).
 *
 * Three ways to search: around a point (2/5/10/20 km), the visible map area («Search here») or a
 * corridor along the route (width per kind). The answers stay on this device (db.meta, not in the
 * backup): along the route until «Load again» (works offline), around / the map area 24 h; «around» is
 * also reused when you moved less than a quarter of the radius.
 *
 * Pure: the store ({ get(key), put(rec) }, e.g. db.meta) and the fetcher are passed in. Names come from
 * OpenStreetMap as they are and never go through t(). Tested in tests/poisearch.test.js.
 */
import { thinLine, fetchOverpass, OVERPASS_URLS, lineHash } from '../route/pois.js';
import { lineKm, snap } from '../race/race.js';
import { distKm } from '../live/live-lib.js';

export { OVERPASS_URLS };
export const SETTINGS_KEY = 'poi-search';
export const CACHE_PREFIX = 'poi-search:';
export const MAX_PLACES = 400;
export const TIMEOUT_S = 25;
export const RADII = [2, 5, 10, 20];
export const MODES = ['around', 'here', 'route'];
export const DEFAULTS = { on: [], mode: 'around', radiusKm: 10 };
export const DAY_MS = 864e5;
/** The visible map area is searched only up to this diagonal (fair use; zoom in otherwise). */
export const MAX_VIEW_KM = 40;
/** Line points sent for a corridor (each kind repeats them). */
export const CORRIDOR_PTS = 100;

/**
 * The kinds. name: English key for t(); icon: a lucide icon name; tags: Overpass selectors (any one
 * matches); widthM: the corridor beside the route. The order is also the order of kindOf.
 */
export const CATEGORIES = [
  { key: 'water', name: 'Water|poi', icon: 'droplet', widthM: 300, tags: ['["amenity"="drinking_water"]', '["amenity"="fountain"]["drinking_water"="yes"]', '["man_made"="water_tap"]["drinking_water"!="no"]', '["amenity"="water_point"]'] },
  { key: 'shop', name: 'Shopping|poi', icon: 'shopping-cart', widthM: 1000, tags: ['["shop"~"^(supermarket|convenience|bakery|kiosk|general|deli|greengrocer|butcher|farm)$"]'] },
  { key: 'food', name: 'Food|poi', icon: 'utensils', widthM: 1000, tags: ['["amenity"~"^(restaurant|cafe|fast_food|biergarten)$"]'] },
  { key: 'fuel', name: 'Petrol station', icon: 'fuel', widthM: 1500, tags: ['["amenity"="fuel"]'] },
  { key: 'bike', name: 'Bike shop and workshop|poi', icon: 'bike', widthM: 3000, tags: ['["shop"="bicycle"]', '["craft"="bicycle"]'] },
  { key: 'repair', name: 'Repair stand|poi', icon: 'wrench', widthM: 500, tags: ['["amenity"="bicycle_repair_station"]', '["service:bicycle:pump"="yes"]', '["amenity"="compressed_air"]'] },
  { key: 'sleep', name: 'Hotel|poi', icon: 'bed', widthM: 3000, tags: ['["tourism"~"^(hotel|guest_house|hostel|motel|alpine_hut|chalet|apartment)$"]'] },
  { key: 'camp', name: 'Camping|poi', icon: 'tent', widthM: 3000, tags: ['["tourism"~"^(camp_site|caravan_site|camp_pitch)$"]'] },
  { key: 'shelter', name: 'Shelter', icon: 'house', widthM: 500, tags: ['["amenity"="shelter"]', '["tourism"="wilderness_hut"]'] },
  { key: 'toilet', name: 'WC|poi', icon: 'toilet', widthM: 300, tags: ['["amenity"="toilets"]'] },
  { key: 'pharmacy', name: 'Pharmacy|poi', icon: 'pill', widthM: 2000, tags: ['["amenity"="pharmacy"]', '["healthcare"="pharmacy"]'] },
  { key: 'hospital', name: 'Hospital|poi', icon: 'hospital', widthM: 5000, tags: ['["amenity"~"^(hospital|clinic)$"]'] },
  { key: 'atm', name: 'ATM|poi', icon: 'banknote', widthM: 1000, tags: ['["amenity"="atm"]', '["amenity"="bank"]["atm"="yes"]'] },
  { key: 'station', name: 'Station', icon: 'train-front', widthM: 3000, tags: ['["railway"~"^(station|halt)$"]'] },
  { key: 'laundry', name: 'Laundry', icon: 'washing-machine', widthM: 3000, tags: ['["shop"~"^(laundry|dry_cleaning)$"]', '["amenity"="laundry"]'] },
  { key: 'view', name: 'Viewpoint|poi', icon: 'binoculars', widthM: 300, tags: ['["tourism"="viewpoint"]'] },
];
export const CATEGORY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));
export const KEYS = CATEGORIES.map((c) => c.key);

/** A nicer English key for common OSM sub kinds (shown when a place has no name). */
export const SUB_NAMES = {
  supermarket: 'Supermarket|poi',
  convenience: 'Small shop|poi',
  bakery: 'Bakery|poi',
  kiosk: 'Kiosk|poi',
  restaurant: 'Restaurant',
  cafe: 'Café|poi',
  fast_food: 'Takeaway|poi',
  hotel: 'Hotel|poi',
  guest_house: 'Guesthouse|poi',
  hostel: 'Hostel|poi',
  alpine_hut: 'Mountain hut|poi',
  camp_site: 'Campsite|poi',
  caravan_site: 'Campsite|poi',
  camp_pitch: 'Tent site|poi',
  drinking_water: 'Drinking water|poi',
  fountain: 'Fountain|poi',
  hospital: 'Hospital|poi',
  clinic: 'Clinic|poi',
  bicycle_repair_station: 'Repair stand|poi',
  compressed_air: 'Air pump|poi',
};
/** The English key that names a place without a name: its sub kind, else its kind. */
export const labelOf = (p) => SUB_NAMES[p?.sub] ?? CATEGORY[p?.kind]?.name ?? 'Place|poi';

/** A starred place as kept: { id, kind, name, lat, lon, sub }. */
export const starOf = (p) => ({ id: String(p.id), kind: CATEGORY[p.kind] ? p.kind : 'water', name: str(p.name), lat: r5(Number(p.lat)), lon: r5(Number(p.lon)), sub: str(p.sub) });

/** The settings record, cleaned: { on: [known keys], mode, radiusKm, starred: [places] }. */
export function prefsOf(v) {
  const on = Array.isArray(v?.on) ? [...new Set(v.on.filter((k) => CATEGORY[k]))] : [];
  const starred = (Array.isArray(v?.starred) ? v.starred : []).filter((p) => p?.id && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lon))).map(starOf);
  return { on, mode: MODES.includes(v?.mode) ? v.mode : DEFAULTS.mode, radiusKm: RADII.includes(v?.radiusKm) ? v.radiusKm : DEFAULTS.radiusKm, starred };
}
/** Star or unstar a place in the prefs (→ new prefs). */
export function toggleStar(prefs, place) {
  const p = prefsOf(prefs);
  const has = p.starred.some((s) => s.id === place.id);
  return { ...p, starred: has ? p.starred.filter((s) => s.id !== place.id) : [...p.starred, starOf(place)] };
}

/* ---------- selectors: query and matching ---------- */

const SEL = /\["([^"]+)"(=|!=|~)"([^"]*)"\]/g;
/** One selector string → [[key, op, value]]. */
export const partsOf = (sel) => [...sel.matchAll(SEL)].map((m) => [m[1], m[2], m[3]]);
const matches = (tags, sel) =>
  partsOf(sel).every(([k, op, v]) => {
    const x = tags[k];
    if (op === '=') return x === v;
    if (op === '!=') return x !== v;
    return x != null && new RegExp(v).test(x);
  });

/** The kind of an OSM element among `keys` (default all), or null. The first fitting kind wins. */
export function kindOf(tags = {}, keys = KEYS) {
  for (const c of CATEGORIES) if (keys.includes(c.key) && c.tags.some((s) => matches(tags, s))) return c.key;
  return null;
}

const r5 = (v) => Math.round(v * 1e5) / 1e5;
const known = (keys) => KEYS.filter((k) => (keys ?? []).includes(k));
const wrap = (lines) => `[out:json][timeout:${TIMEOUT_S}];\n(\n${lines.join('\n')}\n);\nout center tags ${MAX_PLACES * 3};`;

/** Around a point: every switched-on kind within radiusKm. '' without kinds or point. */
export function aroundQuery(keys, center, radiusKm = DEFAULTS.radiusKm) {
  const ks = known(keys);
  if (!ks.length || !Number.isFinite(center?.lat) || !Number.isFinite(center?.lon)) return '';
  const a = `(around:${Math.round(radiusKm * 1000)},${r5(center.lat)},${r5(center.lon)})`;
  return wrap(ks.flatMap((k) => CATEGORY[k].tags.map((s) => `  nwr${s}${a};`)));
}

/** The diagonal of a map area in km. */
export const boundsKm = (b) => distKm({ lat: b.s, lon: b.w }, { lat: b.n, lon: b.e });
const okBounds = (b) => [b?.s, b?.w, b?.n, b?.e].every(Number.isFinite) && b.n > b.s && b.e > b.w;

/** The visible map area { s, w, n, e }. '' without kinds, without an area or when it is too big. */
export function bboxQuery(keys, b) {
  const ks = known(keys);
  if (!ks.length || !okBounds(b) || boundsKm(b) > MAX_VIEW_KM) return '';
  const box = `(${r5(b.s)},${r5(b.w)},${r5(b.n)},${r5(b.e)})`;
  return wrap(ks.flatMap((k) => CATEGORY[k].tags.map((s) => `  nwr${s}${box};`)));
}

/** A corridor along the route line [[lat, lon]]: each kind with its own width. '' without a line. */
export function corridorQuery(keys, line, { max = CORRIDOR_PTS } = {}) {
  const ks = known(keys);
  const pts = thinLine(line, max);
  if (!ks.length || pts.length < 2) return '';
  const coords = pts.map(([lat, lon]) => `${r5(lat)},${r5(lon)}`).join(',');
  return wrap(ks.flatMap((k) => CATEGORY[k].tags.map((s) => `  nwr${s}(around:${CATEGORY[k].widthM},${coords});`)));
}

/* ---------- distances ---------- */

/** The line as km points (race.js lineKm), [] without a usable line. */
export const ptsOf = (line) => (Array.isArray(line) && line.length >= 2 ? lineKm({ line, km: 0 }) : []);

/**
 * How far a place is: { km (straight from `from`, or null), along (km along the route from `from`, ahead
 * positive; null without line or from), offKm (beside the route; null without line), atKm (where along) }.
 */
export function distanceOf(place, from, pts = []) {
  const km = from && Number.isFinite(from.lat) ? Math.round(distKm(from, place) * 100) / 100 : null;
  if (!pts.length) return { km, along: null, offKm: null, atKm: null };
  const s = snap(pts, place);
  const me = from && Number.isFinite(from.lat) ? snap(pts, from) : null;
  return { km, along: me ? Math.round((s.km - me.km) * 10) / 10 : null, offKm: s.offKm, atKm: s.km };
}

/** The places with their distances (d), nearest first (along the route: the next ahead first, then behind). */
export function withDistance(list = [], from = null, line = null) {
  const pts = ptsOf(line);
  const out = list.map((p) => ({ ...p, d: distanceOf(p, from, pts) }));
  const key = (p) => {
    if (p.d.along != null) return p.d.along >= 0 ? p.d.along : 1e6 - p.d.along;
    if (p.d.km != null) return p.d.km;
    return p.d.atKm ?? 0;
  };
  return out.sort((a, b) => key(a) - key(b) || a.id.localeCompare(b.id));
}

/* ---------- parsing ---------- */

const str = (v) => String(v ?? '').trim();

/**
 * Overpass JSON → [{ id, kind, name, lat, lon, hours, phone, website, sub, fee, access }], only the
 * `keys` kinds, without private or closed places, deduped (the same element; or the same kind and
 * name within 30 m). `near(p)` gives the order for the limit: the nearest `max` are kept.
 * → { list, cut }
 */
export function parsePlaces(json, keys = KEYS, { near = null, max = MAX_PLACES } = {}) {
  const els = Array.isArray(json?.elements) ? json.elements : [];
  const seen = new Set();
  const out = [];
  for (const el of els) {
    if (!['node', 'way', 'relation'].includes(el?.type)) continue;
    const lat = Number(el.lat ?? el.center?.lat);
    const lon = Number(el.lon ?? el.center?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const tags = el.tags ?? {};
    if (['private', 'no'].includes(tags.access)) continue;
    const kind = kindOf(tags, keys);
    if (!kind) continue;
    const id = `${el.type}/${el.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const sub = str(kind === 'bike' ? tags.shop || tags.craft : tags.shop || tags.tourism || tags.amenity || tags.railway || tags.man_made || tags.healthcare);
    out.push({
      id,
      kind,
      name: str(tags.name || tags.brand || tags.operator),
      lat: r5(lat),
      lon: r5(lon),
      hours: str(tags.opening_hours),
      phone: str(tags.phone || tags['contact:phone']),
      website: str(tags.website || tags['contact:website']),
      sub,
      fee: str(tags.fee),
      access: str(tags.access),
      ele: Number.isFinite(parseFloat(tags.ele)) ? Math.round(parseFloat(tags.ele)) : null,
      n: Object.keys(tags).length,
    });
  }
  const kept = [];
  for (const p of out) {
    const at = kept.findIndex((q) => q.kind === p.kind && q.name && q.name === p.name && distKm(q, p) < 0.03);
    if (at < 0) kept.push(p);
    else if (p.n > kept[at].n) kept[at] = p;
  }
  const order = near ? (a, b) => near(a) - near(b) || a.id.localeCompare(b.id) : (a, b) => a.id.localeCompare(b.id);
  kept.sort(order);
  return { list: kept.slice(0, max).map(({ n, ...p }) => p), cut: kept.length > max };
}

/* ---------- cache rules ---------- */

/** The cache key of a search: around / here one slot each, along the route one per trip. */
export const cacheKeyOf = (mode, tripId = '') => `${CACHE_PREFIX}${mode === 'route' ? `route:${tripId || 'free'}` : mode}`;

const covers = (rec, keys) => known(keys).every((k) => (rec?.keys ?? []).includes(k));
const inside = (outer, b) => okBounds(outer) && okBounds(b) && outer.s <= b.s && outer.w <= b.w && outer.n >= b.n && outer.e >= b.e;

/**
 * Is a kept answer still good for this search? rec: { at (ms), keys, center, radiusKm, bounds, hash }.
 * - route: same line (hash), all kinds asked; kept until «Load again» (any age).
 * - around: younger than 24 h, all kinds, its radius at least this one, moved less than a quarter of it.
 * - here: younger than 24 h, all kinds, its area contains this one.
 * stale = true: only the age is wrong (good offline).
 */
export function fresh(rec, q, now = Date.now(), { stale = false } = {}) {
  if (!rec || !Array.isArray(rec.list) || !covers(rec, q.keys)) return false;
  const young = stale || now - rec.at < DAY_MS;
  if (q.mode === 'route') return rec.hash === lineHash(q.line);
  if (q.mode === 'around') return young && rec.radiusKm >= q.radiusKm && !!rec.center && !!q.center && distKm(rec.center, q.center) < q.radiusKm / 4;
  if (q.mode === 'here') return young && inside(rec.bounds, q.bounds);
  return false;
}

/** The places of a kept answer that fit this search: the asked kinds, within the radius / area. */
export function fitting(rec, q) {
  const ks = known(q.keys);
  let list = (rec?.list ?? []).filter((p) => ks.includes(p.kind));
  if (q.mode === 'around' && q.center) list = list.filter((p) => distKm(q.center, p) <= q.radiusKm);
  if (q.mode === 'here' && okBounds(q.bounds)) list = list.filter((p) => p.lat >= q.bounds.s && p.lat <= q.bounds.n && p.lon >= q.bounds.w && p.lon <= q.bounds.e);
  return list;
}

/** The query text of a search, or { error: 'zoom' | 'nothing' }. */
export function queryOf(q) {
  if (!known(q.keys).length) return { error: 'nothing' };
  if (q.mode === 'around') return aroundQuery(q.keys, q.center, q.radiusKm) || { error: 'nothing' };
  if (q.mode === 'here') {
    if (okBounds(q.bounds) && boundsKm(q.bounds) > MAX_VIEW_KM) return { error: 'zoom' };
    return bboxQuery(q.keys, q.bounds) || { error: 'nothing' };
  }
  if (q.mode === 'route') return corridorQuery(q.keys, q.line) || { error: 'nothing' };
  return { error: 'nothing' };
}

const errorOf = (err, online) => {
  if (!online) return 'offline';
  return /\b(429|504|503)\b|abort/i.test(String(err?.message ?? err?.name ?? '')) ? 'busy' : 'failed';
};

/**
 * The panel's one call. q: { mode, keys, center, radiusKm, bounds, line, tripId }.
 * opts: { store ({ get, put }, e.g. db.meta), fetcher, force, now (ms), online, urls }.
 * → { list (the fitting places, not yet sorted), at (ms of the data), cut, cached (from the store),
 *     error ('offline' | 'busy' | 'failed' | 'zoom' | 'nothing' | null), stale (old data shown) }
 */
export async function loadPlaces(q, { store, fetcher, force = false, now = Date.now(), online = true, urls } = {}) {
  const key = cacheKeyOf(q.mode, q.tripId);
  let rec = null;
  try {
    rec = (await store?.get(key))?.value ?? null;
  } catch {
    rec = null;
  }
  if (!force && fresh(rec, q, now)) return { list: fitting(rec, q), at: rec.at, cut: !!rec.cut, cached: true, error: null, stale: false };
  const query = queryOf(q);
  if (typeof query !== 'string') return { list: [], at: null, cut: false, cached: false, error: query.error, stale: false };
  const old = fresh(rec, q, now, { stale: true }) ? rec : null;
  if (!online) return old ? { list: fitting(old, q), at: old.at, cut: !!old.cut, cached: true, error: 'offline', stale: true } : { list: [], at: null, cut: false, cached: false, error: 'offline', stale: false };
  try {
    const json = await fetchOverpass(query, { ...(fetcher ? { fetcher } : {}), ...(urls ? { urls } : {}), timeout: TIMEOUT_S * 1000 });
    const pts = q.mode === 'route' ? ptsOf(q.line) : [];
    const mid = q.mode === 'here' && okBounds(q.bounds) ? { lat: (q.bounds.s + q.bounds.n) / 2, lon: (q.bounds.w + q.bounds.e) / 2 } : q.center;
    const near = q.mode === 'route' ? (p) => snap(pts, p).offKm : mid ? (p) => distKm(mid, p) : null;
    const { list, cut } = parsePlaces(json, known(q.keys), { near });
    let value = { at: now, keys: known(q.keys), list, cut, mode: q.mode };
    if (q.mode === 'around') Object.assign(value, { center: { lat: q.center.lat, lon: q.center.lon }, radiusKm: q.radiusKm });
    if (q.mode === 'here') value.bounds = { ...q.bounds };
    if (q.mode === 'route') {
      value.hash = lineHash(q.line);
      // the same route: keep the other kinds already kept (e.g. all kinds kept with the offline strip)
      if (rec?.hash === value.hash) value = mergeRoute(rec, value);
    }
    try {
      await store?.put({ key, value });
    } catch {
      /* a full store: the answer is still shown */
    }
    return { list: fitting(value, q), at: now, cut, cached: false, error: null, stale: false };
  } catch (err) {
    const e = errorOf(err, online);
    return old ? { list: fitting(old, q), at: old.at, cut: !!old.cut, cached: true, error: e, stale: true } : { list: [], at: null, cut: false, cached: false, error: e, stale: false };
  }
}

/** Two kept answers of the same route → one: the new kinds replace the old ones of those kinds. */
export function mergeRoute(old, next) {
  const ks = new Set(next.keys);
  const list = [...(old?.list ?? []).filter((p) => !ks.has(p.kind)), ...next.list];
  return { ...next, keys: KEYS.filter((k) => ks.has(k) || (old?.keys ?? []).includes(k)), list, cut: !!(old?.cut || next.cut) };
}

/* ---------- 1a · all places along the route, kept with the offline strip ---------- */

/** How many line points one chunk of the route sends, and how many points the route is thinned to. */
export const CHUNK_PTS = 30;
export const ALONG_PTS = 240;
export const MAX_ALONG = 5000;
export const CHUNK_PAUSE_MS = 1500;

/** The route line thinned to `total` points, cut into chunks of `size` points (each starts where the last ended). */
export function corridorChunks(line, { size = CHUNK_PTS, total = ALONG_PTS } = {}) {
  const pts = thinLine(line, total);
  if (pts.length < 2) return [];
  const out = [];
  for (let i = 0; i < pts.length - 1; i += size - 1) out.push(pts.slice(i, i + size));
  return out.filter((c) => c.length >= 2);
}

/**
 * Every kind along the whole route, chunk by chunk with a pause (polite to Overpass), stored as the
 * route answer of the trip (all kinds, kept until «Load again»). A chunk that fails is skipped.
 * → { count, chunks, failed, cut }
 */
export async function keepAlong(line, tripId, { store, fetcher, keys = KEYS, now = Date.now(), pauseMs = CHUNK_PAUSE_MS, onProgress = () => {}, wait = (ms) => new Promise((r) => setTimeout(r, ms)), urls } = {}) {
  const chunks = corridorChunks(line);
  const all = new Map();
  let failed = 0;
  for (let i = 0; i < chunks.length; i++) {
    if (i) await wait(pauseMs);
    try {
      const json = await fetchOverpass(corridorQuery(keys, chunks[i], { max: CHUNK_PTS }), { ...(fetcher ? { fetcher } : {}), ...(urls ? { urls } : {}), timeout: TIMEOUT_S * 1000 });
      for (const p of parsePlaces(json, keys, { max: Infinity }).list) all.set(p.id, p);
    } catch {
      failed++;
    }
    onProgress({ done: i + 1, total: chunks.length, count: all.size });
  }
  if (!chunks.length || failed === chunks.length) return { count: 0, chunks: chunks.length, failed, cut: false };
  const pts = ptsOf(line);
  const list = [...all.values()].sort((a, b) => snap(pts, a).km - snap(pts, b).km || a.id.localeCompare(b.id));
  const value = { at: now, keys: known(keys), list: list.slice(0, MAX_ALONG), cut: list.length > MAX_ALONG, mode: 'route', hash: lineHash(line), failed };
  try {
    await store?.put({ key: cacheKeyOf('route', tripId), value });
  } catch {
    /* full: nothing kept */
  }
  return { count: value.list.length, chunks: chunks.length, failed, cut: value.cut };
}

/** How many places are kept along a trip's route (0 when none or another line). */
export async function keptAlong(store, tripId, line) {
  try {
    const v = (await store?.get(cacheKeyOf('route', tripId)))?.value;
    return v?.hash === lineHash(line) && Array.isArray(v.list) ? v.list.length : 0;
  } catch {
    return 0;
  }
}

/* ---------- 3a · detour ---------- */

/** The route's height at km of a profile [[km, m]] (linear), or null. */
export function heightAt(profile, km) {
  if (!Array.isArray(profile) || !profile.length || !Number.isFinite(km)) return null;
  if (km <= profile[0][0]) return profile[0][1];
  for (let i = 1; i < profile.length; i++) {
    const [k1, m1] = profile[i];
    const [k0, m0] = profile[i - 1];
    if (k1 >= km) return k1 > k0 ? m0 + ((m1 - m0) * (km - k0)) / (k1 - k0) : m1;
  }
  return profile.at(-1)[1];
}

/**
 * The detour to a place beside the route, there and back from the nearest route point (straight, so
 * «about»): { km, hm, atKm } or null without a route. hm: the climb up to the place when OSM knows its
 * height and the route has a profile, else 0.
 */
export function detourOf(place, pts = [], profile = null) {
  if (!pts?.length || !Number.isFinite(place?.lat)) return null;
  const s = snap(pts, place);
  const h = heightAt(profile, s.km);
  const hm = Number.isFinite(place.ele) && h != null ? Math.max(0, Math.round(place.ele - h)) : 0;
  return { km: Math.round(s.offKm * 2 * 10) / 10, hm, atKm: s.km };
}

/* ---------- 5a · share ---------- */

/** The links of a place: Google Maps (opens everywhere) and geo: (map apps). */
export const shareLinks = ({ lat, lon }) => ({
  maps: `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(5)},${lon.toFixed(5)}`,
  geo: `geo:${lat.toFixed(5)},${lon.toFixed(5)}`,
});

/** The text for one or more places: «name (kind)» and the map link, one block each. label(p) gives the kind. */
export function shareText(places = [], label = (p) => p.kind, title = '') {
  const blocks = places.map((p) => {
    const k = label(p);
    const head = p.name ? (k ? `${p.name} (${k})` : p.name) : k;
    const l = shareLinks(p);
    return `${head}\n${l.maps}`;
  });
  return [title, ...blocks].filter(Boolean).join('\n\n');
}

/** Share (the phone's own sheet) or copy the text. → 'shared' | 'copied' | 'cancelled' | 'failed' */
export async function shareOrCopy({ title = '', text }, nav = globalThis.navigator) {
  if (nav?.share) {
    try {
      await nav.share({ title, text });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
    }
  }
  try {
    await nav.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}

/** Has the map area moved enough that «Search here» makes sense? (no answer, or not inside the last one) */
export const viewMoved = (lastBounds, bounds) => !!bounds && !inside(lastBounds, bounds);

/** A small debounce (one query per tap, chips tapped fast give one query). */
export function debounce(fn, ms = 600) {
  let id = null;
  const d = (...a) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...a), ms);
  };
  d.cancel = () => clearTimeout(id);
  return d;
}
