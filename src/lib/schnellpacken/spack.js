/**
 * Paket SP «Schneller packen» (Noah 20.10.2026 «1a 2a 3a 4a», liste.json 1124–1127).
 *
 *   1124 Zu zweit packen: trip.two = { name, carry: { [itemId]: 'them' } }. The companion is only a name
 *        you type (no account, nothing from the other person). Everything not marked is yours.
 *   1125 In der Wäsche: item.laundry = true on a piece of clothing. Two days before a trip a to-do in Merken
 *        (src 'laundry:<tripId>') reminds you; the trip shows «noch in der Wäsche».
 *   1126 Erst am Abfahrtsmorgen: item.morning = true (phone, food from the fridge, bottles). On the morning of
 *        the start these items come as their own short list on Unterwegs.
 *   1127 Packzeit: trip.packTime = { start, ms }; per trip the time and the trend against the last trip.
 *        Settings 'packExtras' { timeOff } switches the timer off.
 * Pure functions, tested in tests/schnellpacken.test.js. Labels are English keys for t().
 */
import { CLOTHING_CATEGORIES } from '../gear.js';

export const EXTRAS_KEY = 'packExtras';

const rowsOf = (trip, itemsById) => (trip?.entries ?? []).map((e) => ({ e, item: itemsById[e.itemId] })).filter((r) => r.item);
const gOf = ({ e, item }) => (item.weightG == null ? null : item.weightG * (Number(e.qty) || 1));

/* ---------- 1124 two people ---------- */

/** The companion of a trip, or null. */
export const twoOf = (trip) => (trip?.two && typeof trip.two === 'object' ? { name: String(trip.two.name ?? ''), carry: trip.two.carry && typeof trip.two.carry === 'object' ? trip.two.carry : {} } : null);

/** Who carries an item: 'me' or 'them'. */
export const whoCarries = (trip, itemId) => (twoOf(trip)?.carry?.[itemId] === 'them' ? 'them' : 'me');

/** The trip's two after switching who carries one item. */
export function switchCarry(trip, itemId) {
  const two = twoOf(trip) ?? { name: '', carry: {} };
  const carry = { ...two.carry };
  if (carry[itemId] === 'them') delete carry[itemId];
  else carry[itemId] = 'them';
  return { ...two, carry };
}

/** The weight per person: { me, them, unweighed } in grams (unweighed: items without a weight). */
export function splitWeights(trip, itemsById = {}) {
  const out = { me: 0, them: 0, unweighed: 0 };
  for (const r of rowsOf(trip, itemsById)) {
    const g = gOf(r);
    if (g == null) out.unweighed++;
    else out[whoCarries(trip, r.item.id)] += g;
  }
  return out;
}

/* ---------- 1125 laundry ---------- */

export const isClothing = (item) => CLOTHING_CATEGORIES.includes(item?.category);

/** The clothes of a trip: [{ e, item, wash }]. */
export const clothesOf = (trip, itemsById = {}) => rowsOf(trip, itemsById).filter((r) => isClothing(r.item)).map((r) => ({ ...r, wash: !!r.item.laundry }));

/** The pieces of a trip that are still in the wash. */
export const inWash = (trip, itemsById = {}) => clothesOf(trip, itemsById).filter((r) => r.wash).map((r) => r.item);

const addDay = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
/** The day of the reminder: two days before the start (today when that is past), or null without a date. */
export function washDay(trip, today) {
  if (!trip?.startDate || trip.startDate < today) return null;
  const d = addDay(trip.startDate, -2);
  return d < today ? today : d;
}
export const washSrc = (trip) => `laundry:${trip.id}`;

/* ---------- 1126 the morning list ---------- */

/** The items of a trip packed only on the morning of the start: [{ e, item }]. */
export const morningOf = (trip, itemsById = {}) => rowsOf(trip, itemsById).filter((r) => r.item.morning);

/** Is today the morning of the start (the first day, before the trip is finished)? */
export const startMorning = (trip, today) => !!trip?.startDate && trip.startDate === today && !trip.finished;

/* ---------- 1127 packing time ---------- */

/** The stored time of a trip: { start, ms } made safe. */
export function packTimeOf(trip) {
  const p = trip?.packTime;
  return { start: typeof p?.start === 'string' ? p.start : null, ms: Number.isFinite(p?.ms) && p.ms > 0 ? p.ms : null };
}
/** Stop the clock: the fields to save (the time adds up when packing ran in several goes). */
export function stopClock(trip, now = Date.now()) {
  const p = packTimeOf(trip);
  if (!p.start) return null;
  const ran = Math.max(0, now - new Date(p.start).getTime());
  return { packTime: { start: null, ms: (p.ms ?? 0) + ran } };
}
export const startClock = (trip, now = new Date()) => ({ packTime: { ...packTimeOf(trip), start: now.toISOString() } });

/** The last earlier trip with a packing time → { ms, title, diffMs (+ = slower now) } or null. */
export function packTrend(trip, trips = []) {
  const mine = packTimeOf(trip).ms;
  const prev = trips
    .filter((x) => x && x.id !== trip?.id && packTimeOf(x).ms && String(x.startDate ?? '') <= String(trip?.startDate ?? '9999'))
    .sort((a, b) => String(b.startDate ?? '').localeCompare(String(a.startDate ?? '')))[0];
  if (!prev) return null;
  const ms = packTimeOf(prev).ms;
  return { ms, title: prev.title ?? '', diffMs: mine ? mine - ms : null };
}

/** Minutes from ms (at least 1 when there was any time). */
export const minutesOf = (ms) => (ms ? Math.max(1, Math.round(ms / 6e4)) : 0);
