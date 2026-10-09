/**
 * The Trips and Bikes tiles on Today (v0.25.1, Noah 1b, 2b, 3a): more ways in, four buttons visible,
 * the rest under "More". Pure functions only (tested in tests/hubs.test.js); the pages write the records.
 *
 * - pastTrips: the finished trips, newest first, for the "Past trips" list (#/pack/past).
 * - hubBike: the bike a quick action starts with (the next trip's bike, else the first bike).
 * - Ideas ("Was geil wäre", Noah 2b): each bike keeps its OWN idea list, bike.ideas =
 *   [{ id, text, at, done? }] (bikes are plain objects, no schema change). Not the Gear wishlist.
 * - newVisit: a workshop visit typed in by hand, in the shape workshop.js reads.
 */
import { isOver, tripEnd } from './debrief.js';

/**
 * The finished trips (ended, or ended early on the ride day), newest first. Skipped trips
 * ("Not riding") are not trips that happened. Each row:
 * { trip, start, end, days, bike, km, items, debrief: 'done' | 'draft' | 'none', canDebrief }.
 * km: from the debrief when it has one (null otherwise: unknown is not zero).
 */
export function pastTrips(trips = [], debriefs = [], today) {
  const byTrip = Object.fromEntries(debriefs.map((d) => [d.tripId, d]));
  return trips
    .filter((t) => !t.skipped && t.startDate && isOver(t, today))
    .sort((a, b) => b.startDate.localeCompare(a.startDate) || (a.title ?? '').localeCompare(b.title ?? ''))
    .map((trip) => {
      const d = byTrip[trip.id] ?? null;
      const items = (trip.entries ?? []).length;
      return {
        trip,
        start: trip.startDate,
        end: tripEnd(trip),
        days: Math.max(1, Number(trip.days) || 1),
        bike: trip.bike ?? null,
        km: typeof d?.km === 'number' ? d.km : null,
        items,
        debrief: d?.status === 'done' ? 'done' : d ? 'draft' : 'none',
        // Only trips packed in the app can be debriefed (the same rule as toDebrief).
        canDebrief: items > 0,
      };
    });
}

/**
 * v0.40.0 (Noah 3a): ONE list of past trips with the debrief state (the debrief page keeps
 * Learnings, the comparison and the pace). Two groups:
 *   open: trips that can still get a debrief (packed in the app, not closed "without a debrief"),
 *         a started draft included, newest first;
 *   done: the rest, newest first: debriefed, closed without a debrief, or nothing packed in the app.
 * Each row is a pastTrips row plus { state: 'open' | 'draft' | 'done' | 'none', unused, missing }
 * (unused, missing: counts from a saved debrief, else 0). km: the sum of the known km of the done
 * trips (unknown is left out, never counted as 0); kmKnown: how many of them had km.
 * → { open, done, km, kmKnown, total }
 */
export function pastTripList(trips = [], debriefs = [], today) {
  const byTrip = Object.fromEntries(debriefs.map((d) => [d.tripId, d]));
  const rows = pastTrips(trips, debriefs, today).map((r) => {
    const d = byTrip[r.trip.id] ?? null;
    const entries = r.trip.entries ?? [];
    const unused = d?.status === 'done' ? entries.filter((e) => d.items?.[e.itemId] === 'unused').length : 0;
    const missing = d?.status === 'done' ? (d.missing ?? []).length : 0;
    const state = r.debrief === 'done' ? 'done' : !r.canDebrief || r.trip.noDebrief ? 'none' : r.debrief === 'draft' ? 'draft' : 'open';
    return { ...r, state, unused, missing };
  });
  const open = rows.filter((r) => r.state === 'open' || r.state === 'draft');
  const done = rows.filter((r) => r.state === 'done' || r.state === 'none');
  const withKm = done.filter((r) => typeof r.km === 'number');
  return { open, done, km: withKm.reduce((s, r) => s + r.km, 0), kmKnown: withKm.length, total: rows.length };
}

/** The bike a quick action starts with: the next trip's bike, else the first bike (bikes sorted). */
export function hubBike(next, bikes = []) {
  const own = next?.bikeId ? bikes.find((b) => b.id === next.bikeId) : null;
  return (own ?? bikes[0] ?? null)?.id ?? null;
}

/* ---------- ideas per bike ("Was geil wäre") ---------- */

/** localStorage wish: Bikes → Setup opens its ideas section once (set by the links on Today). */
export const IDEAS_KEY = 'bikes.ideas';

/** A new idea at the top of the list. Empty text adds nothing. */
export function addIdea(ideas = [], text, { id, at = new Date().toISOString() } = {}) {
  const clean = String(text ?? '').trim();
  if (!clean) return ideas ?? [];
  return [{ id, text: clean, at, done: false }, ...(ideas ?? [])];
}

/** Tick an idea done (or open again). */
export const toggleIdea = (ideas = [], id) => (ideas ?? []).map((x) => (x.id === id ? { ...x, done: !x.done } : x));

/** Remove one idea (the page asks with confirm() first). */
export const removeIdea = (ideas = [], id) => (ideas ?? []).filter((x) => x.id !== id);

/** Open ideas first (newest first), the done ones after. */
export const sortIdeas = (ideas = []) => [...(ideas ?? [])].sort((a, b) => Number(!!a.done) - Number(!!b.done) || (b.at ?? '').localeCompare(a.at ?? ''));

/** How many ideas are still open. */
export const openIdeas = (ideas = []) => (ideas ?? []).filter((x) => !x.done).length;

/* ---------- a workshop visit typed in by hand ---------- */

/**
 * Read a CHF amount ("120", "120.50", "120,50", "1'200") → number, '' → null, rubbish → NaN.
 */
export function parseChf(text) {
  const s = String(text ?? '').trim();
  if (!s) return null;
  const n = Number(s.replace(/['’\s]/g, '').replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : NaN;
}

/**
 * A visit record as workshop.js reads it: { id, bikeId, date, shop, invoice, km, totalChf, parts, photos }.
 * The jobs (parts) stay empty: a visit typed in by hand only knows the total; the receipt photo
 * shows the rest. km and cost may be unknown (null).
 */
export function newVisit({ bikeId, date, shop, km = null, chf = null, photo = null }, { id }) {
  return {
    id,
    bikeId,
    date,
    shop: String(shop ?? '').trim(),
    invoice: null,
    km: typeof km === 'number' ? km : null,
    totalChf: typeof chf === 'number' ? chf : null,
    parts: [],
    photos: photo ? [photo] : [],
    source: 'Today',
  };
}
