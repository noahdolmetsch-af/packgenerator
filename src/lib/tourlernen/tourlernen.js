/**
 * Paket Z «Aus jeder Tour lernen» (Noah 20.10.2026 «1a 2b 3a 4a», liste.json 1120, 1122, 1123).
 *
 *   1120 Panne im Rückblick: a breakdown (kind, part, place) is kept on the trip (trip.breakdowns). It can
 *        become a bike-care job (db.maintenance, the shape of plannotes.js planRepair), and on the next
 *        packing the matching spare parts come as a suggestion («letztes Mal Platten → Schlauch, Flickzeug»).
 *        Dismissed per trip (trip.spareSkip = [kind]).
 *   1122 Schlafplätze: a rated place to sleep is an own point (map/ownpoints.js, kind 'sleep') with stars
 *        1–5 and the trip it came from. Planning a trip near one shows «Deine Schlafplätze hier».
 *   1123 Tour-Postkarte: the facts for the picture (postcard.js draws it on the device).
 * Pure functions, tested in tests/tourlernen.test.js. Labels are English keys for t().
 */
import { distKm } from '../route.js';

/* ---------- 1120 breakdowns ---------- */

/** The kinds of breakdown; spare: what to take next time (matched in the gear by name). */
export const BREAK_KINDS = [
  { key: 'flat', name: 'Flat tyre', spare: /(tube|schlauch|patch|flick|tubeless|plug|salami|reifenheber|tyre lever|tire lever|dichtmilch|sealant)/i, task: 'Check the tyres and the sealant' },
  { key: 'chain', name: 'Chain', spare: /(chain|kette|quick ?link|missing link|nieter)/i, task: 'Check the chain' },
  { key: 'brake', name: 'Brakes', spare: /(brake pad|bremsbel|bremsklotz|brake)/i, task: 'Check the brakes' },
  { key: 'spoke', name: 'Spoke or wheel', spare: /(spoke|speiche|nippel|fibrefix)/i, task: 'Have the wheel trued' },
  { key: 'gears', name: 'Gears', spare: /(derailleur hanger|schaltauge|shift cable|schaltzug|cable)/i, task: 'Check the gears' },
  { key: 'other', name: 'Something else', spare: null, task: 'Repair after the tour' },
];
export const breakKind = (key) => BREAK_KINDS.find((k) => k.key === key) ?? BREAK_KINDS.at(-1);

/** The breakdowns of a trip made safe. */
export function breakdownsOf(trip) {
  const list = Array.isArray(trip?.breakdowns) ? trip.breakdowns : [];
  return list.filter((b) => b && b.id).map((b) => ({ id: String(b.id), kind: breakKind(b.kind).key, part: String(b.part ?? ''), place: String(b.place ?? ''), note: String(b.note ?? ''), taskId: b.taskId ? String(b.taskId) : null, at: String(b.at ?? '') }));
}

/** A new breakdown (null without a kind). */
export function newBreakdown({ kind, part = '', place = '', note = '' }, { id, now = new Date().toISOString() } = {}) {
  if (!BREAK_KINDS.some((k) => k.key === kind)) return null;
  return { id, kind, part: String(part).trim(), place: String(place).trim(), note: String(note).trim(), taskId: null, at: now };
}

/** The bike-care job for a breakdown (the shape of a planning-note repair, see plannotes.js). text: the task in words. */
export function repairFor(b, trip, { id, text, bike = null, today }) {
  return {
    id, area: 'Bike', bikeId: bike?.id ?? trip?.bikeId ?? null, subject: bike?.name ?? trip?.bike ?? '', task: text, category: 'Repair', source: 'Breakdown',
    logDate: today, leadWeeks: null, priority: 'medium', status: 'open', note: [b.place, b.note].filter(Boolean).join(' · '), done: false, photo: null, dueDate: null, beforeRide: true, tripId: trip?.id ?? null,
  };
}

/**
 * The spare-part suggestions for a trip: breakdowns of the earlier trips (the newest first, the same bike
 * first), one per kind, with the gear that matches and is not on this trip yet.
 * → [{ kind, name, from: { id, title }, items: [item] }]
 */
export function spareHints(trip, trips = [], items = []) {
  if (!trip) return [];
  const skip = new Set(Array.isArray(trip.spareSkip) ? trip.spareSkip : []);
  const on = new Set((trip.entries ?? []).map((e) => e.itemId));
  const start = trip.startDate ?? '9999';
  const before = trips
    .filter((x) => x && x.id !== trip.id && breakdownsOf(x).length && (x.startDate ?? '') <= start)
    .sort((a, b) => (b.bikeId === trip.bikeId) - (a.bikeId === trip.bikeId) || String(b.startDate ?? '').localeCompare(String(a.startDate ?? '')));
  const out = [];
  const seen = new Set();
  for (const x of before)
    for (const b of breakdownsOf(x)) {
      const k = breakKind(b.kind);
      if (seen.has(k.key) || skip.has(k.key) || !k.spare) continue;
      seen.add(k.key);
      const match = items.filter((i) => i && !i.archived && !on.has(i.id) && k.spare.test([i.name, i.nameDe, i.model].filter(Boolean).join(' ')));
      if (match.length) out.push({ kind: k.key, name: k.name, part: b.part, from: { id: x.id, title: x.title ?? '' }, items: match.slice(0, 4) });
    }
  return out;
}

/* ---------- 1122 sleep spots ---------- */

/** The rated places to sleep among the own points (stars first, then the newest). */
export const sleepSpots = (points = []) => points.filter((p) => p.kind === 'sleep').sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0) || String(b.createdAt).localeCompare(String(a.createdAt)));

/** Where a trip goes: its route line (every few points), else its place. */
function tripPlaces(trip) {
  const line = Array.isArray(trip?.route?.line) ? trip.route.line : [];
  if (line.length) {
    const step = Math.max(1, Math.floor(line.length / 200));
    return line.filter((_, i) => i % step === 0).map(([lat, lon]) => ({ lat, lon }));
  }
  const p = trip?.place;
  return p && Number.isFinite(p.lat) && Number.isFinite(p.lon) ? [{ lat: p.lat, lon: p.lon }] : [];
}

/** «Deine Schlafplätze hier»: the sleep spots within km of the trip's route or place (not those of this trip). */
export const NEAR_KM = 15;
export function spotsNear(points = [], trip, km = NEAR_KM) {
  const places = tripPlaces(trip);
  if (!places.length) return [];
  return sleepSpots(points)
    .filter((p) => p.tripId !== trip.id)
    .map((p) => ({ ...p, km: Math.min(...places.map((q) => distKm(p, q))) }))
    .filter((p) => p.km <= km);
}

/** «★★★☆☆» for stars 1–5. */
export const starText = (n) => (Number.isInteger(n) && n >= 1 && n <= 5 ? '★'.repeat(n) + '☆'.repeat(5 - n) : '');

/* ---------- 1123 postcard ---------- */

/**
 * The facts of the postcard: km, metres up, riding time and days. The uploaded rides of the trip count
 * first; without them the route and the plan.
 */
export function postcardFacts(trip, rides = []) {
  const own = rides.filter((r) => r && r.tripId === trip?.id);
  const km = own.length ? own.reduce((s, r) => s + (Number(r.km) || 0), 0) : Number(trip?.route?.km) || null;
  const gain = own.length ? own.reduce((s, r) => s + (Number(r.gainM) || 0), 0) : Number(trip?.route?.gainM) || null;
  const hours = own.length ? own.reduce((s, r) => s + (Number(r.movingH) || 0), 0) : null;
  const days = Math.max(1, Number(trip?.days) || 1);
  return { km: km ? Math.round(km) : null, gainM: gain ? Math.round(gain) : null, hours: hours ? Math.round(hours * 10) / 10 : null, days };
}

/** The route line fitted into a box (x, y, w, h), north up, the same scale both ways → [[x, y]]. */
export function fitLine(line = [], x, y, w, h) {
  const pts = line.filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (pts.length < 2) return [];
  const lats = pts.map((p) => p[0]);
  const lons = pts.map((p) => p[1]);
  const midLat = ((Math.min(...lats) + Math.max(...lats)) / 2) * (Math.PI / 180);
  const kx = Math.cos(midLat);
  const minX = Math.min(...lons) * kx;
  const maxX = Math.max(...lons) * kx;
  const minY = Math.min(...lats);
  const maxY = Math.max(...lats);
  const s = Math.min(w / (maxX - minX || 1e-9), h / (maxY - minY || 1e-9));
  const ox = x + (w - (maxX - minX) * s) / 2;
  const oy = y + (h - (maxY - minY) * s) / 2;
  return pts.map(([lat, lon]) => [ox + (lon * kx - minX) * s, oy + (maxY - lat) * s]);
}
