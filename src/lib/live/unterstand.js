/**
 * «Wetter-Ausweichen» (Noah 07.11.2026 «1b 2a 3a», Thread «Verbessern: Routing und Navigation»): a thunderstorm or
 * heavy rain ahead → the nearest place with a roof, offered as «Plan there» (never planned by itself).
 * Pure functions; the live map does the asking (live-lib stormUrl, askServers) and shows the card.
 */
import { poisFrom } from '../race/outside.js';
import { distKm } from './live-lib.js';

/** Kinds of the stops that have a roof: real shelters and stations first, cafés and shops may be closed. */
export const ROOF_KINDS = ['shelter', 'station', 'food', 'shop'];
/** A café or shop counts a little further away (it may be closed): km added to its distance when ranking. */
export const MAYBE_CLOSED_KM = 0.5;
/** How far the app looks for a roof (km); at 20 km/h this is ten minutes. */
export const SHELTER_MAX_KM = 3;

/** The Overpass query for roofs around you: shelters, huts, bus stops with a roof, waiting rooms, stations, cafés, shops. */
export function shelterQuery(here, m = SHELTER_MAX_KM * 1000) {
  const a = `(around:${m},${here.lat.toFixed(4)},${here.lon.toFixed(4)})`;
  return `[out:json][timeout:25];(
nwr["amenity"="shelter"]${a};
nwr["tourism"="wilderness_hut"]${a};
nwr["amenity"="waiting_room"]${a};
node["highway"="bus_stop"]["shelter"="yes"]${a};
nwr["railway"="station"]${a};
nwr["amenity"~"^(restaurant|fast_food|cafe)$"]${a};
nwr["shop"~"^(supermarket|convenience|bakery|kiosk|general|deli)$"]${a};
);out center tags;`;
}

/** Overpass answer → stops with a roof: [{ id, kind, name, lat, lon, sub }]. */
export const sheltersFrom = (json) => poisFrom(json, []).filter((p) => ROOF_KINDS.includes(p.kind));

/**
 * The nearest roof from the stops we know (found: the fresh answer, pois: the stops of the map).
 * → { id, kind, name, lat, lon, distKm } or null. A café or shop must be at most SHELTER_MAX_KM away like the others.
 */
export function nearestShelter({ here, found = [], pois = [], maxKm = SHELTER_MAX_KM }) {
  if (!here) return null;
  const seen = new Set();
  const list = [];
  for (const p of [...found, ...pois]) {
    const lat = Number(p.lat);
    const lon = Number(p.lon);
    if (!ROOF_KINDS.includes(p.kind) || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const d = distKm(here, { lat, lon });
    if (d > maxKm || d < 0.03) continue;
    list.push({ id: p.id, kind: p.kind, name: p.name || '', lat, lon, distKm: Math.round(d * 10) / 10, rank: d + (p.kind === 'food' || p.kind === 'shop' ? MAYBE_CLOSED_KM : 0) });
  }
  list.sort((a, b) => a.rank - b.rank);
  const best = list[0];
  if (!best) return null;
  const { rank, ...out } = best;
  return out;
}
