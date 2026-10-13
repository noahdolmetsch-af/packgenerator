/**
 * v0.46.1 (Noah: «Touren» opened the last trip at Packen): «Touren» opens a calm overview of all
 * trips. Each row has one button named by its next step, which opens the trip at that step.
 * v0.88.0 «Aufräumen und Ausprobieren» (Noah 0.88 5a): a trip ended (or debriefed) before its start
 * date is not ridden: it gets «Wieder planen».
 * v0.126.0 TZ-1 «Zustand sichtbar» (Noah 13.10.2026 «1-5 a», mockup TZ1): the groups are the three
 * trip states of tripstate.js, the same everywhere:
 *   plan   Planned:   ended before it began (first, with «Plan again»), then under way, soon, in planning;
 *   done   Completed: the debrief still open first (inProgress order), then the trips without one
 *                     (uploaded rides, closed without a debrief), newest first, RIDDEN_SHOWN of them;
 *   rated  Rated:     the debriefed trips, newest first, RIDDEN_SHOWN of them.
 * The rows still come from drafts.js inProgress (the band's «In progress» list) and the past rows as on
 * Past trips (hubs.js), so the steps and buttons agree. Pure, tested in tests/tripsoverview.test.js.
 */
import { inProgress } from './drafts.js';
import { tripEnd } from './debrief.js';
import { tripStates, stateCounts, endedTooEarly } from './tripstate.js';
import { localDay } from './localday.js';

export { endedTooEarly };

/** How many finished trips (completed without a debrief, or rated) the overview shows before «All». */
export const RIDDEN_SHOWN = 5;

/** The button of a row, by the next step (English keys for t()). */
export const GO = {
  plan: 'Continue to Plan',
  replan: 'Plan again',
  pack: 'Continue to Pack',
  ride: 'On the way',
  trip: 'Open the trip',
  debrief: 'Debrief',
  past: 'Open|trip',
};

/** The groups in their order: the three states (their words: tripstate.js STATE_NAMES). */
export const GROUPS = [{ key: 'plan' }, { key: 'done' }, { key: 'rated' }];

/** The address of a finished trip (as on Past trips): its ride, its debrief, or Pack. */
const pastHref = (trip, items, debrief) =>
  trip.fromRide && !items ? `#/debrief/ride/${encodeURIComponent(trip.fromRide)}` : !debrief && !items ? '#/pack' : `#/debrief/${encodeURIComponent(trip.id)}`;

/** km of a finished trip: the debrief's, else the route's of a trip made from a ride (unknown: null). */
const kmOf = (trip, debrief) => (typeof debrief?.km === 'number' ? debrief.km : trip.fromRide && typeof trip.route?.km === 'number' ? trip.route.km : null);

const newestFirst = (a, b) => (b.date ?? '').localeCompare(a.date ?? '') || (a.title ?? '').localeCompare(b.title ?? '');

/**
 * → { plan, done, rated, doneTotal, ratedTotal, counts: { plan, done, rated, all }, empty }; each row
 * { id, tripId, title, date, bike, km?, kind: 'replan'|'trip'|'ride'|'debrief'|'past',
 *   tstate: the tripstate.js info, state: { key, label, done?, total?, day? }, go: { label, href } }.
 * rides: the uploaded rides (the source of a trip made from a ride, a ride linked to a trip).
 */
export function tripsOverview(trips = [], debriefs = [], today = localDay(), rides = []) {
  const byId = Object.fromEntries(trips.map((t) => [t.id, t]));
  const byTrip = Object.fromEntries(debriefs.map((d) => [d.tripId, d]));
  const info = tripStates(trips, { debriefs, rides, today });
  const out = { plan: [], done: [], rated: [] };
  const base = (x) => ({ id: x.id, tripId: x.id, title: x.title ?? '', bike: x.bike ?? null, tstate: info[x.id] });

  // Planned, ended before it began: first, with «Plan again»
  for (const x of trips.filter((x) => info[x.id].early).sort((a, b) => a.startDate.localeCompare(b.startDate)))
    out.plan.push({ ...base(x), kind: 'replan', date: x.startDate, state: { key: 'replan', label: 'Marked as ended, the date is still ahead' }, go: { label: GO.replan, href: '#/pack' } });
  // the rows of inProgress: planned trips, and completed trips with their debrief still open
  const listed = new Set();
  for (const r of inProgress(trips, debriefs, today)) {
    const st = info[r.tripId];
    if (!st?.state || st.early) continue;
    const row = { ...base(byId[r.tripId]), id: r.id, title: r.title, date: r.date, kind: r.kind, state: r.state, go: { label: GO[r.next.step], href: r.next.href } };
    if (st.state === 'plan') out.plan.push(row);
    else if (st.state === 'done' && r.kind === 'debrief') out.done.push(row);
    else continue;
    listed.add(r.tripId);
  }
  // the rest: completed without a debrief to fill in, and rated, newest first
  const past = { done: [], rated: [], plan: [] };
  for (const x of trips) {
    const st = info[x.id];
    if (listed.has(x.id) || !st.state || st.early) continue;
    const d = byTrip[x.id] ?? null;
    const items = (x.entries ?? []).length;
    past[st.state].push({ ...base(x), kind: 'past', date: x.startDate ?? tripEnd(x) ?? null, km: kmOf(x, d), state: { key: st.state === 'rated' ? 'rated' : 'ridden', label: st.state === 'rated' ? 'Debrief done' : 'Ridden' }, go: { label: GO.past, href: pastHref(x, items, d) } });
  }
  past.done.sort(newestFirst);
  past.rated.sort(newestFirst);
  out.done.push(...past.done.slice(0, RIDDEN_SHOWN));
  out.rated = past.rated.slice(0, RIDDEN_SHOWN);
  const counts = stateCounts(info);
  return { ...out, doneTotal: counts.done, ratedTotal: counts.rated, counts, empty: counts.all === 0 };
}
