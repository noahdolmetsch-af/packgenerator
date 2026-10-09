/**
 * v0.46.1 (Noah: «Touren» opened the last trip at Packen): «Touren» opens a calm overview of all
 * trips, an interim until the full Touren entry page. One list grouped by state:
 *   soon      Bald unterwegs: under way now, or packed and not started yet
 *   planning  In Planung: everything else that is still ahead
 *   debrief   Rückblick offen: over, the debrief still open
 *   ridden    Gefahren: the last 5 finished trips (the rest on Past trips, #/pack/past)
 * Each row has one button named by its next step, which opens the trip at that step.
 * The states come from drafts.js inProgress (the band's "In progress" list) and hubs.js
 * pastTripList (Past trips), so all three places agree. Pure, tested in tests/tripsoverview.test.js.
 */
import { inProgress } from './drafts.js';
import { pastTripList } from './hubs.js';
import { localDay } from './localday.js';

/** How many finished trips the overview shows before «Alle anzeigen». */
export const RIDDEN_SHOWN = 5;

/** The button of a row, by the next step (English keys for t()). */
export const GO = {
  plan: 'Continue to Plan',
  pack: 'Continue to Pack',
  ride: 'On the way',
  trip: 'Open the trip',
  debrief: 'Debrief',
  past: 'Open|trip',
};

/** The groups in their order, with their headings (English keys for t()). */
export const GROUPS = [
  { key: 'soon', name: 'Soon on the way' },
  { key: 'planning', name: 'In planning' },
  { key: 'debrief', name: 'Debrief open' },
  { key: 'ridden', name: 'Ridden' },
];

const SOON = new Set(['ride', 'packed', 'ready']);

/** The address of a finished trip (as on Past trips): its debrief, its ride, or Pack. */
const pastHref = (r) =>
  r.trip.fromRide && !r.items ? `#/debrief/ride/${encodeURIComponent(r.trip.fromRide)}` : r.state === 'none' && !r.items ? '#/pack' : `#/debrief/${encodeURIComponent(r.trip.id)}`;

/**
 * → { soon, planning, debrief, ridden, riddenTotal, empty }; each row
 * { id, tripId, title, date, bike, state: { key, label, done?, total?, day? }, go: { label, href } }.
 */
export function tripsOverview(trips = [], debriefs = [], today = localDay()) {
  const byId = Object.fromEntries(trips.map((t) => [t.id, t]));
  const out = { soon: [], planning: [], debrief: [], ridden: [] };
  for (const r of inProgress(trips, debriefs, today)) {
    const trip = byId[r.tripId];
    const row = { id: r.id, tripId: r.tripId, title: r.title, date: r.date, bike: trip?.bike ?? null, state: r.state, go: { label: GO[r.next.step], href: r.next.href } };
    if (r.kind === 'debrief') out.debrief.push(row);
    else if (SOON.has(r.state.key)) out.soon.push(row);
    else out.planning.push(row);
  }
  const past = pastTripList(trips, debriefs, today);
  out.ridden = past.done.slice(0, RIDDEN_SHOWN).map((r) => ({
    id: r.trip.id, tripId: r.trip.id, title: r.trip.title ?? '', date: r.start, bike: r.bike, km: r.km,
    state: { key: 'ridden', label: r.state === 'done' ? 'Debrief done' : 'Ridden' }, go: { label: GO.past, href: pastHref(r) },
  }));
  return { ...out, riddenTotal: past.done.length, empty: !trips.some((t) => !t.skipped) };
}
