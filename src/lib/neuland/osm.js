/**
 * «Neue Sammlungen» (Träume und Neuland N18, Noah 07.11.2026 «ok N18»; 28.10.2026 «5b» weekly by itself): Lookout towers,
 * Suspension bridges and Waterfalls of Switzerland, from OpenStreetMap (free Overpass API, no key). The app asks once a week
 * by itself when New ground opens (and after a ride on Today), and on a tap; the answer is kept on the device in the table
 * `meta` (key OSM_KEY, never exported, no schema change): { at: last success, tried: last try, sets: { towers: [row], … } }
 * with row = [name, lat, lon, ele|null, osmId]. What you reached stays in the Neuland state (your ticks and finds, in the
 * backup) under the item ids «o-n123» / «o-w456»; the places themselves are loaded again from OpenStreetMap.
 * Only named places count. Pure parts tested in tests/osm.test.js.
 */
export const OSM_KEY = 'neuland.osm';
export const OSM_SETS = ['towers', 'bridges', 'waterfalls'];
export const OSM_EVERY_MS = 7 * 24 * 3600 * 1000;
export const OSM_RETRY_MS = 6 * 3600 * 1000;
const MAX_PER_SET = 3000;
/** A point in Switzerland: tells overpassUrls to ask the Swiss server first. */
const CH_POINT = { lat: 46.8, lon: 8.2 };

/** The Overpass QL query: named lookout towers, waterfalls and suspension footbridges of Switzerland. */
export function osmQuery() {
  const ways = '^(path|footway|pedestrian|track|steps|cycleway|bridleway)$';
  return [
    '[out:json][timeout:90];',
    'area["ISO3166-1"="CH"][admin_level="2"]->.ch;',
    '(',
    '  nwr["man_made"="tower"]["tower:type"="observation"]["name"](area.ch);',
    '  nwr["waterway"="waterfall"]["name"](area.ch);',
    `  way["highway"~"${ways}"]["bridge:structure"="suspension"]["name"](area.ch);`,
    `  way["highway"~"${ways}"]["bridge"="suspension"]["name"](area.ch);`,
    ');',
    'out tags center;',
  ].join('\n');
}

const r5 = (n) => Math.round(n * 1e5) / 1e5;
const eleOf = (tags) => {
  const v = parseFloat(String(tags?.ele ?? '').replace(',', '.'));
  return Number.isFinite(v) && v > 0 && v < 5000 ? Math.round(v) : null;
};
/** Which collection an OpenStreetMap element belongs to, or null. */
export function osmKind(tags = {}) {
  if (tags.waterway === 'waterfall') return 'waterfalls';
  if (tags.man_made === 'tower' && tags['tower:type'] === 'observation') return 'towers';
  if (tags['bridge:structure'] === 'suspension' || tags.bridge === 'suspension') return 'bridges';
  return null;
}

/** The Overpass answer → { towers: [row], bridges: [row], waterfalls: [row] } (rows by name, named places only, each once). */
export function parseOsm(json) {
  const sets = { towers: [], bridges: [], waterfalls: [] };
  const seen = new Set();
  for (const el of json?.elements ?? []) {
    const kind = osmKind(el?.tags);
    const name = String(el?.tags?.name ?? '').trim();
    const lat = Number(el?.lat ?? el?.center?.lat);
    const lon = Number(el?.lon ?? el?.center?.lon);
    if (!kind || !name || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const id = `${String(el.type ?? 'n')[0]}${el.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    sets[kind].push([name, r5(lat), r5(lon), eleOf(el.tags), id]);
  }
  for (const k of OSM_SETS) sets[k] = sets[k].sort((a, b) => a[0].localeCompare(b[0], 'de') || a[4].localeCompare(b[4])).slice(0, MAX_PER_SET);
  return sets;
}

/** The stored record, cleaned: { at, tried, sets }. */
export function osmRec(v) {
  const x = v && typeof v === 'object' ? v : {};
  const sets = {};
  for (const k of OSM_SETS) sets[k] = Array.isArray(x.sets?.[k]) ? x.sets[k].filter((r) => Array.isArray(r) && r.length >= 5 && Number.isFinite(r[1]) && Number.isFinite(r[2])) : [];
  return { at: Number(x.at) || 0, tried: Number(x.tried) || 0, sets };
}

/** Time to ask again? Weekly after a success; after a failure not before 6 hours. now: ms. */
export function osmDue(rec, now) {
  const r = osmRec(rec);
  if (r.tried && now - r.tried < OSM_RETRY_MS) return false;
  return !r.at || now - r.at >= OSM_EVERY_MS;
}

/** The items of one collection for the loader: points like the other built-in collections. */
export function osmItems(rec, cid) {
  return osmRec(rec).sets[cid]?.map(([name, lat, lon, alt, id]) => ({ id: `o-${id}`, name, kind: 'point', lat, lon, ...(alt != null ? { alt } : {}) })) ?? [];
}
export const osmCounts = (rec) => Object.fromEntries(OSM_SETS.map((k) => [k, osmRec(rec).sets[k].length]));

let running = null;
/**
 * Asks OpenStreetMap and keeps the answer. → { ok, at } ; never throws. Only one ask at a time.
 * opts: fetcher (tests), now (ms).
 */
export function refreshOsm(db, opts = {}) {
  if (running) return running;
  running = (async () => {
    const now = opts.now ?? Date.now();
    const prev = osmRec((await db.meta.get(OSM_KEY))?.value);
    try {
      const pois = await import('../route/pois.js');
      const json = await pois.fetchOverpass(osmQuery(), { ...(opts.fetcher ? { fetcher: opts.fetcher } : {}), urls: pois.overpassUrls([CH_POINT]), timeout: 90000 });
      const sets = parseOsm(json);
      await db.meta.put({ key: OSM_KEY, value: { at: now, tried: now, sets } });
      return { ok: true, at: now };
    } catch {
      await db.meta.put({ key: OSM_KEY, value: { ...prev, tried: now } });
      return { ok: false, at: prev.at };
    }
  })().finally(() => (running = null));
  return running;
}

/** Asks again if it is time (weekly). → the result of refreshOsm, or null when it is not time. */
export async function refreshOsmIfDue(db, opts = {}) {
  const rec = (await db.meta.get(OSM_KEY))?.value ?? null;
  return osmDue(rec, opts.now ?? Date.now()) ? refreshOsm(db, opts) : null;
}
