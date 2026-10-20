/**
 * «Neue Quellen» › Ladestationen (Noah 20.10.2026): charging stations for the live map, from OpenStreetMap
 * (amenity=charging_station) through the free Overpass API the places panel already uses (no key, no
 * server, no cost; route/pois.js fetchOverpass with its two mirrors and timeout).
 *
 * Why not Open Charge Map: it needs a key and an account, and it lists car chargers. OpenStreetMap has the
 * car chargers of the Swiss operators as well as the e-bike chargers and sockets at huts and cafés
 * (bicycle=yes, socket:schuko …), which matter on a bike tour. Good enough, and the same source as the
 * other places.
 *
 * The places come in the shape of the places panel (map/poisearch.js parsePlaces):
 *   { id, kind: 'charge', name, lat, lon, hours, phone, website, sub, fee, access, ele,
 *     bike (an e-bike charger), sockets: ['type2', 'schuko', …], capacity }
 * sub: 'bicycle' for an e-bike charger, else 'car'. CHARGE_CATEGORY is the entry for poisearch.js
 * CATEGORIES when the panel gets the kind as a chip. Names come from OpenStreetMap and never go through t().
 * Pure (the fetcher is passed in), tested in tests/quellen.test.js.
 */
import { fetchOverpass } from '../route/pois.js';
import { distKm } from '../route.js';

export const CHARGE_KIND = 'charge';
export const CHARGE_RADII = [2, 5, 10, 20];
export const CHARGE_MAX = 200;
export const CHARGE_TIMEOUT_S = 25;
/** The entry for map/poisearch.js CATEGORIES (same fields as the others; lucide icon «plug-zap»). */
export const CHARGE_CATEGORY = { key: CHARGE_KIND, name: 'Charging station|poi', icon: 'plug-zap', widthM: 1500, tags: ['["amenity"="charging_station"]'] };

const r5 = (v) => Math.round(v * 1e5) / 1e5;
const str = (v) => String(v ?? '').trim();
const yes = (v) => /^(yes|designated)$/i.test(str(v)) || Number(str(v)) > 0;
/** A number, or NaN for null, '' and junk (Number(null) would be 0). */
const num = (v) => (v == null || v === '' ? NaN : Number(v));

/** The Overpass query around a point (radiusKm). '' for a broken point. bikeOnly: only e-bike chargers. */
export function chargeQuery(center, radiusKm = 10, { bikeOnly = false, max = CHARGE_MAX } = {}) {
  const lat = num(center?.lat);
  const lon = num(center?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return '';
  const r = Math.round(Math.max(0.2, Math.min(50, Number(radiusKm) || 10)) * 1000);
  const sel = bikeOnly ? '["amenity"="charging_station"]["bicycle"~"^(yes|designated)$"]' : '["amenity"="charging_station"]';
  return `[out:json][timeout:${CHARGE_TIMEOUT_S}];\nnwr${sel}(around:${r},${r5(lat)},${r5(lon)});\nout center tags ${max * 2};`;
}

/** The socket kinds of a station: «socket:type2=2» → 'type2' (only those with a count or yes). */
export const socketsOf = (tags = {}) =>
  Object.keys(tags)
    .filter((k) => /^socket:[a-z0-9_]+$/i.test(k) && yes(tags[k]))
    .map((k) => k.slice(7).toLowerCase())
    .sort();

/** An e-bike charger: bicycle=yes / designated, or only small sockets (Schuko) and no car. */
export const isBikeCharger = (tags = {}) => yes(tags.bicycle) || (tags.motorcar === 'no' && socketsOf(tags).some((s) => /schuko|cee_blue|typee|type_e/.test(s)));

/**
 * Overpass JSON → { list: [place], cut }, nearest to `from` first (else by id), without private or
 * closed stations, at most max.
 */
export function parseCharge(json, { from = null, max = CHARGE_MAX } = {}) {
  const els = Array.isArray(json?.elements) ? json.elements : [];
  const seen = new Set();
  const out = [];
  for (const el of els) {
    if (!['node', 'way', 'relation'].includes(el?.type)) continue;
    const tags = el.tags ?? {};
    if (tags.amenity !== 'charging_station') continue;
    if (['private', 'no'].includes(tags.access) || tags['disused:amenity'] || /^(no|closed)$/i.test(str(tags.opening_hours))) continue;
    const lat = num(el.lat ?? el.center?.lat);
    const lon = num(el.lon ?? el.center?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const id = `${el.type}/${el.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const bike = isBikeCharger(tags);
    const cap = parseInt(tags.capacity, 10);
    out.push({
      id,
      kind: CHARGE_KIND,
      name: str(tags.name || tags.brand || tags.operator || tags.network),
      lat: r5(lat),
      lon: r5(lon),
      hours: str(tags.opening_hours),
      phone: str(tags.phone || tags['contact:phone']),
      website: str(tags.website || tags['contact:website']),
      sub: bike ? 'bicycle' : 'car',
      fee: str(tags.fee),
      access: str(tags.access),
      ele: null,
      bike,
      sockets: socketsOf(tags),
      capacity: Number.isFinite(cap) && cap > 0 ? cap : null,
      operator: str(tags.operator || tags.network),
    });
  }
  const ok = from && Number.isFinite(num(from.lat)) && Number.isFinite(num(from.lon));
  const d = (p) => (ok ? distKm({ lat: Number(from.lat), lon: Number(from.lon) }, p) : 0);
  out.sort((a, b) => d(a) - d(b) || a.id.localeCompare(b.id));
  return { list: out.slice(0, max), cut: out.length > max };
}

/** Charging stations around a point. → { list, cut }; throws when Overpass does not answer. */
export async function loadCharge(center, radiusKm = 10, { fetcher, bikeOnly = false, urls } = {}) {
  const q = chargeQuery(center, radiusKm, { bikeOnly });
  if (!q) throw new Error('invalid');
  const json = await fetchOverpass(q, { ...(fetcher ? { fetcher } : {}), ...(urls ? { urls } : {}) });
  return parseCharge(json, { from: center });
}
