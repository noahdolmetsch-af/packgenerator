/**
 * «Neue Sammlungen: Aussichtstürme, Hängebrücken, Wasserfälle» (Träume und Neuland N18, Noah 27.10.2026 «1-5 a»):
 * small goals near home that Neuland finds on your rides. The places come from OpenStreetMap (ODbL,
 * «© OpenStreetMap-Mitwirkende»), loaded once on a tap from the free Overpass service for Switzerland and kept
 * on this device (db.meta, OSM_KEY; not in the backup, one tap loads it again). Nothing of yours is sent: the
 * question only names the kind of place and Switzerland.
 * Pure helpers plus fetchOsm (a fetcher is passed in). Tested in tests/neuland-osm.test.js.
 */
import { slug } from './neuland.js';
import { km } from './geo.js';

export const OSM_KEY = 'neuland.osm';
export const OVERPASS = 'https://overpass-api.de/api/interpreter';

/** What each collection asks OpenStreetMap for (Overpass QL, inside the Swiss area .ch). prefix: of the ids. */
export const OSM_SETS = {
  towers: { prefix: 't-', q: 'nwr["man_made"="tower"]["tower:type"="observation"](area.ch);' },
  bridges: {
    prefix: 'b-',
    q: 'way["bridge"="suspension"]["highway"~"^(footway|path|cycleway|track|pedestrian|bridleway)$"](area.ch);way["bridge:structure"="suspension"]["highway"~"^(footway|path|cycleway|track|pedestrian|bridleway)$"](area.ch);',
  },
  waterfalls: { prefix: 'w-', q: 'nwr["waterway"="waterfall"](area.ch);' },
};
export const isOsm = (cid) => Object.hasOwn(OSM_SETS, cid);

/** The Overpass question for a collection. */
export const osmQuery = (cid) => `[out:json][timeout:90];area["ISO3166-1"="CH"][admin_level=2]->.ch;(${OSM_SETS[cid].q});out center tags;`;

/** Places closer than this (km) with the same name are one place (a bridge drawn in several pieces). */
export const SAME_KM = 0.5;

/**
 * An Overpass answer → [[name, lat, lon, ele|null]], named places only, one per place, sorted north to south.
 */
export function parseOsm(json) {
  const out = [];
  for (const e of Array.isArray(json?.elements) ? json.elements : []) {
    const tags = e?.tags ?? {};
    const name = String(tags.name ?? tags['bridge:name'] ?? '').trim();
    const lat = Number(e.lat ?? e.center?.lat);
    const lon = Number(e.lon ?? e.center?.lon);
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const ele = Number.parseFloat(tags.ele);
    const p = [name, Math.round(lat * 1e5) / 1e5, Math.round(lon * 1e5) / 1e5, Number.isFinite(ele) ? Math.round(ele) : null];
    if (out.some((o) => o[0] === name && km([o[1], o[2]], [p[1], p[2]]) < SAME_KM)) continue;
    out.push(p);
  }
  return out.sort((a, b) => b[1] - a[1] || a[2] - b[2]);
}

/** The kept places of a collection as Neuland items ([] when not loaded). Equal names get -2, -3 … */
export function osmItems(rec, cid) {
  const list = rec?.[cid]?.list;
  if (!isOsm(cid) || !Array.isArray(list)) return [];
  const seen = new Map();
  return list.map(([name, lat, lon, alt]) => {
    const base = `${OSM_SETS[cid].prefix}${slug(name)}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return { id: n > 1 ? `${base}-${n}` : base, name, kind: 'point', lat, lon, alt: alt ?? null };
  });
}
/** When a collection was loaded (ISO) or null. */
export const osmLoadedAt = (rec, cid) => rec?.[cid]?.at ?? null;

/** Load one collection from Overpass and keep it. → the kept record; throws 'busy' or 'failed'. */
export async function fetchOsm(db, cid, { fetcher = fetch, now = Date.now() } = {}) {
  if (!isOsm(cid)) throw new Error('failed');
  let res;
  try {
    res = await fetcher(OVERPASS, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `data=${encodeURIComponent(osmQuery(cid))}` });
  } catch {
    throw new Error('failed');
  }
  if (res.status === 429 || res.status === 504) throw new Error('busy');
  if (!res.ok) throw new Error('failed');
  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error('failed');
  }
  const list = parseOsm(json);
  const rec = (await db.meta.get(OSM_KEY)) ?? { key: OSM_KEY };
  const next = { ...rec, key: OSM_KEY, [cid]: { at: new Date(now).toISOString(), list } };
  await db.meta.put(next);
  return next;
}
