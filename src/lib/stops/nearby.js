/**
 * «Stopps in der Nähe» (Noah 22.10.2026 «tankstellen, brunnen, restaurants, etc können entlang der route oder
 * in meinem umkreis geladen werden»; 24.10.2026 «1a 2a 3a 4b 5a»): the pure helpers of the stops page
 * (#/stopps). The places come from OpenStreetMap through the live map's loaders (live/stops.js: around you
 * and along a route), so the page, the live map and the race page share one kept answer.
 * Tested in tests/stops-nearby.test.js.
 */
import { snap, lineKm } from '../race/race.js';

/** The kinds the page offers, in this order (POI_KINDS keys of race/outside.js). */
export const STOP_KINDS = ['water', 'fuel', 'food', 'shop', 'toilet', 'atm', 'pharmacy', 'repair', 'bike', 'station', 'sleep'];
/** settings: the kinds switched off on the stops page ({ off: [key] }); on this device and in the backup. */
export const STOPS_KEY = 'stops-kinds';
/** settings: true when the «Stopps in der Nähe» button on Heute is hidden. */
export const HEUTE_OFF_KEY = 'heute-stops-off';
/** How far around you (km, as the crow flies) and how far ahead on a route (km) the page lists. */
export const AROUND_KM = 10;
export const AHEAD_KM = 60;
/** You count as on the route when you are at most this far from it (km). */
export const ON_ROUTE_KM = 3;

/** The kinds switched on, from the stored record. */
export function kindsOn(value) {
  const off = new Set(Array.isArray(value?.off) ? value.off : []);
  return STOP_KINDS.filter((k) => !off.has(k));
}
/** Switch one kind; never all off (the last one stays on). → the record to store */
export function flipKind(value, key) {
  const off = new Set(Array.isArray(value?.off) ? value.off.filter((k) => STOP_KINDS.includes(k)) : []);
  if (off.has(key)) off.delete(key);
  else if (STOP_KINDS.length - off.size > 1) off.add(key);
  return { off: STOP_KINDS.filter((k) => off.has(k)) };
}

/**
 * The trips with a route to choose from: today's and the coming ones first (soonest first), then the past ones
 * (newest first). races: the race records (settings 'races' → races); a race's route wins over the trip's.
 */
export function tripsWithRoute(trips = [], today = '', races = {}) {
  const ok = trips
    .map((tr) => (races?.[tr?.id]?.route?.line ? { ...tr, route: races[tr.id].route } : tr))
    .filter((tr) => !tr?.skipped && !tr?.deleted && Array.isArray(tr?.route?.line) && tr.route.line.length > 1);
  const end = (tr) => tr.endDate || tr.startDate || '';
  const coming = ok.filter((tr) => end(tr) >= today).sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
  const past = ok.filter((tr) => end(tr) < today).sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
  return [...coming, ...past];
}

/** The route of a trip as km points. */
export const ptsOfTrip = (trip) => lineKm(trip?.route);

/** Where you are on the route: { km, offKm } when you are near it, else null (then the list starts at km 0). */
export function placeOnRoute(pts = [], here = null, maxOffKm = ON_ROUTE_KM) {
  if (pts.length < 2 || !here || !Number.isFinite(here.lat) || !Number.isFinite(here.lon)) return null;
  const s = snap(pts, here);
  return Number.isFinite(s.offKm) && s.offKm <= maxOffKm ? { km: s.km, offKm: s.offKm } : null;
}

/** The link to the page: around you, or along a trip's route. */
export const stopsHref = (trip = null) => (trip?.id ? `#/stopps?trip=${encodeURIComponent(trip.id)}` : '#/stopps');
