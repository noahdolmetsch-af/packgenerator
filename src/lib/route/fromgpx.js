/**
 * «Neue Quellen» (Noah 20.10.2026): a GPX (a file, or the GPX of a Ride with GPS link) → the route of a
 * trip WITH its waypoints. Ride with GPS, Garmin and komoot files carry the useful stops as <wpt>
 * (water, food, controls, a bed); until now the trip kept only the line and the numbers.
 *
 *   trip.route = { …route.js routeStats…, wpts: [{ id, name, lat, lon, kind, km, offKm, desc }] }
 *
 * wpts is a new, optional field (an old route without it is the same as no waypoints; no schema change).
 * kind: one of the place kinds of the map (poisearch.js CATEGORIES keys: water, shop, food, fuel, bike,
 * repair, sleep, camp, toilet, hospital, station, view) or 'control' / 'depot' / 'startfinish' / 'other'.
 * Turn instructions (Ride with GPS cues «Left», «Right» …) are left out: they are no places.
 * Waypoints more than WPT_MAX_OFF_KM beside the route are left out, at most WPT_MAX are kept.
 * Pure (no browser needed), tested in tests/quellen.test.js.
 */
import { parseGpx, routeStats, GPX_MAX_MB } from '../route.js';
import { parseWaypoints, kindOfWpt, ownPois } from '../race/files.js';
import { t } from '../i18n.svelte.js';

export const WPT_MAX = 300;
export const WPT_MAX_OFF_KM = 5;

/** Ride with GPS point types and Garmin/komoot words → the app's kinds (lower case, first match). */
export const TYPE_KIND = [
  [/^(water|drinking water|water source|fountain)$/, 'water'],
  [/^(food|restaurant|cafe|café|coffee|bar|fast food|pub)$/, 'food'],
  [/^(convenience store|grocery|groceries|supermarket|store|shopping|shopping center)$/, 'shop'],
  [/^(gas station|fuel|petrol)$/, 'fuel'],
  [/^(bike shop|bicycle shop|bike|bicycle)$/, 'bike'],
  [/^(bike repair|repair|pump|air)$/, 'repair'],
  [/^(lodging|hotel|hostel|motel)$/, 'sleep'],
  [/^(camping|campground|campsite|camp)$/, 'camp'],
  [/^(restroom|toilet|toilets|wc)$/, 'toilet'],
  [/^(first aid|hospital|medical)$/, 'hospital'],
  [/^(transit|train|train station|station|bus)$/, 'station'],
  [/^(viewpoint|scenic|scenic view|overlook|photo)$/, 'view'],
  [/^(control|checkpoint|aid station|feed zone|rest stop|cp)$/, 'control'],
];
/** Turn cues: no places. */
const CUE = /^(left|right|straight|slight left|slight right|sharp left|sharp right|u-?turn|keep left|keep right|generic|start|end|segment start|segment end)$/;

/** The kind of a waypoint ({ name, sym, type }): its type or symbol first, then kindOfWpt (Garmin, name words). */
export function wptKind(w) {
  for (const raw of [w?.type, w?.sym]) {
    const s = String(raw ?? '').trim().toLowerCase().replace(/_/g, ' ');
    if (!s) continue;
    const hit = TYPE_KIND.find(([re]) => re.test(s));
    if (hit) return hit[1];
  }
  const k = kindOfWpt(w);
  if (k !== 'other') return k;
  return /(control|checkpoint|kontrolle|contrôle|(?:^|[^a-z])cp\s?\d+)/i.test(String(w?.name ?? '')) ? 'control' : 'other';
}

/** Is the waypoint a turn cue (no place)? */
export const isCue = (w) => [w?.type, w?.sym].some((v) => CUE.test(String(v ?? '').trim().toLowerCase().replace(/_/g, ' ')));

/**
 * The waypoints of a GPX text along a route (routeStats shape, with line and km) →
 * [{ id, name, lat, lon, kind, km, offKm, desc }] in km order. [] for a text without waypoints.
 */
export function wptsOf(text, route) {
  let raw;
  try {
    raw = parseWaypoints(text);
  } catch {
    return [];
  }
  const places = raw.filter((w) => !isCue(w));
  const { pois } = ownPois(places, route, WPT_MAX_OFF_KM);
  // ownPois numbers them by their place in `places`: own0, own1 …; the kind from wptKind (types too)
  return pois.slice(0, WPT_MAX).map((p) => {
    const w = places[Number(p.id.slice(3))];
    return { id: `w${p.id.slice(3)}`, name: p.name, lat: p.lat, lon: p.lon, kind: wptKind(w), km: Math.round(p.km * 10) / 10, offKm: Math.round(p.offKm * 100) / 100, desc: p.desc ?? '' };
  });
}

/** GPX text → the trip route with its waypoints (throws the plain messages of parseGpx). */
export function routeFromGpx(text, fileName = '') {
  const route = routeStats(parseGpx(text), fileName);
  return { ...route, wpts: wptsOf(text, route) };
}

/** A file from the file picker → the trip route (as route.js readGpxFile, plus the waypoints). */
export async function readRouteFile(file) {
  if (!file) return null;
  if (file.size > GPX_MAX_MB * 1024 * 1024) throw new Error(t('This file is too big for a GPX route (more than {mb} MB).', { mb: GPX_MAX_MB }));
  if (!file.size) throw new Error(t('This file is empty.'));
  return routeFromGpx(await file.text(), file.name);
}

/** The waypoints of a trip route as map places ({ id, kind, name, lat, lon, sub: 'gpx' }), for the live map. */
export const wptsOnMap = (route) =>
  (Array.isArray(route?.wpts) ? route.wpts : [])
    .filter((w) => Number.isFinite(Number(w?.lat)) && Number.isFinite(Number(w?.lon)))
    .map((w) => ({ id: `gpx/${w.id}`, kind: w.kind || 'other', name: String(w.name ?? ''), lat: Number(w.lat), lon: Number(w.lon), sub: 'gpx', km: w.km ?? null, desc: String(w.desc ?? '') }));
