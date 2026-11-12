/**
 * Schlafplatz finden, Schritt 1 (Noah 28.10.2026 «1b 2a 3a und b 4a», Wildcampen): the places to sleep
 * around you that are written down in OpenStreetMap: shelters, huts, bivouac boxes and bus stops with a roof,
 * plus the places you saved yourself (own points of kind «Place to sleep»). One request per tap (the free
 * servers of stops.js), never in the background. Later steps: good spots worked out from the map (step 2) and
 * the red zones where it is forbidden (step 3). The app only gives tips: the rules differ by canton.
 * Pure functions plus loadSleepAround (takes a fetcher for tests). Tested in tests/schlafplatz.test.js.
 */
import { poisFrom } from '../race/outside.js';
import { spotOf } from '../race/sleep.js';
import { askServers } from './stops.js';
import { queued } from '../route/oneatatime.js';
import { distKm } from '../route.js';

/** The kinds of roofs on the chips (key = sleep.js SPOTS key; name = English key for t()). */
export const SLEEP_KINDS = [
  { key: 'hut', name: 'Hut and shelter' },
  { key: 'bivouac', name: 'Bivouac box' },
  { key: 'bus', name: 'Bus stop with a roof' },
  { key: 'own', name: 'My places to sleep' },
];
export const SLEEP_KIND_KEYS = SLEEP_KINDS.map((k) => k.key);
/** How far around you (m) the request looks, and how far (km) the list shows. */
export const SLEEP_M = 8000;
export const SLEEP_SHOW_KM = 8;

/** The Overpass query for roofs within m metres of here. */
export function sleepAroundQuery(here, m = SLEEP_M) {
  const a = `(around:${m},${Number(here.lat).toFixed(4)},${Number(here.lon).toFixed(4)})`;
  return `[out:json][timeout:30];(
node["amenity"="shelter"]${a};
way["amenity"="shelter"]${a};
node["highway"="bus_stop"]["shelter"="yes"]${a};
node["tourism"="wilderness_hut"]${a};
way["tourism"="wilderness_hut"]${a};
);out center tags;`;
}

/** One request: the roofs around here → [{ id, kind, spot, name, lat, lon, sub }] (throws 'busy' | 'net' | 'failed'). */
export async function loadSleepAround(here, { fetcher = fetch } = {}) {
  if (!here || !Number.isFinite(Number(here.lat)) || !Number.isFinite(Number(here.lon))) throw new Error('failed');
  const json = await queued(() => askServers(fetcher, sleepAroundQuery(here), [here]));
  return poisFrom(json, [])
    .map(({ km, offKm, ...p }) => ({ ...p, spot: spotOf(p) ?? (p.kind === 'shelter' ? 'hut' : null) }))
    .filter((p) => p.spot && ['hut', 'bivouac', 'bus'].includes(p.spot));
}

/** The places to show, nearest first: roofs (osm) and own places to sleep, within maxKm, by the chips (kinds: null = all). */
export function findSpots({ here, list = [], own = [], kinds = null, maxKm = SLEEP_SHOW_KM, n = 30 } = {}) {
  if (!here || !Number.isFinite(Number(here.lat))) return [];
  const on = (s) => !kinds || kinds.includes(s);
  const mine = own
    .filter((p) => p?.kind === 'sleep' && Number.isFinite(p.lat) && Number.isFinite(p.lon))
    .map((p) => ({ id: `own:${p.id}`, ownId: p.id, source: 'own', spot: 'own', name: p.name ?? '', note: p.note ?? '', lat: p.lat, lon: p.lon }));
  return [...list.map((p) => ({ ...p, source: 'osm' })), ...mine]
    .filter((p) => on(p.spot))
    .map((p) => ({ ...p, distKm: Math.round(distKm({ lat: Number(here.lat), lon: Number(here.lon) }, p) * 10) / 10 }))
    .filter((p) => p.distKm <= maxKm)
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, n);
}
