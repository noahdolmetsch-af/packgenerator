/**
 * v0.125.0 TZ-1 «Zustand sichtbar» (Noah 13.10.2026: «unterscheiden zwischen einer abgeschlossenen
 * Aktivität … und einer Aktivität, die wir in der App planen … und ob wir eine Tour bewertet haben»;
 * answers «1-5 a», mockups TZ1–TZ3 approved): ONE rule decides the state of a trip.
 *
 *   plan   Planned:   still ahead or under way (packing and «on the way» are steps inside it).
 *   done   Completed: ridden: ended in the app, made from an uploaded ride, or its last day is over.
 *   rated  Rated:     its debrief is saved.
 *   null   not a trip: «Not riding» (skipped) or archived. It shows nowhere as a trip.
 *
 * The order of the checks (spec tour-zustaende, section 2):
 *   1. skipped or archived → null;
 *   2. ended before its start date (endedTooEarly) → plan, with «Plan again» (the exception stays);
 *      TZ-2: reopened («Wieder öffnen», trip.reopened) and not ended again → plan too, also with a saved
 *      debrief (it stays) or a ride; ending it again (finished, or status 'done') closes it once more;
 *   3. the debrief saved (status 'done') → rated;
 *   4. ended in the app (finished, status 'done'), made from a ride (fromRide), or an uploaded ride
 *      belongs to it and its last day is over → done;
 *   5. the last day is over and none of that → done too, but `ask` is set: the date passed and the
 *      trip was not ended (TZ-2 asks «Did you ride?»; until then it counts as completed, as before);
 *   6. else → plan.
 * No migration: everything comes from trips, debriefs and rides. Pure, tested in tests/tripstate.test.js.
 */
import { localDay } from './localday.js';

const addDays = (isoDate, n) => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Last day of a trip (YYYY-MM-DD), or null without a start date (moved here from debrief.js, which re-exports it). */
export const tripEnd = (trip) => (trip?.startDate ? addDays(trip.startDate, Math.max(1, Number(trip.days) || 1) - 1) : null);

/** The three states in their order. */
export const STATES = ['plan', 'done', 'rated'];

/** The word of each state (English keys for t(); German: Geplant, Abgeschlossen, Bewertet). */
export const STATE_NAMES = { plan: 'Planned|state', done: 'Completed|state', rated: 'Rated|state' };

/** What each state means, for the legend «Three states» (English keys for t()). */
export const STATE_HELP = {
  plan: 'Still ahead of you. Packing list, date and bike can be changed any time. Templates come from here.',
  done: 'Ridden: ended in the app or uploaded as a ride. The list stays as you rode it.',
  rated: 'Debrief saved. Its learnings help the next trip.',
};

/** Ended before it began: finished (or done) while the start date is still ahead, not skipped. */
export const endedTooEarly = (trip, today = localDay()) => !!trip && !trip.skipped && !!trip.startDate && trip.startDate > today && (!!trip.finished || trip.status === 'done');

/**
 * The state of a trip with the reasons behind it:
 * { state: 'plan'|'done'|'rated'|null, early, ask, source: 'gpx'|'strava'|null, draft, over }.
 * debrief: the trip's debrief record or null; rides: the uploaded rides (rides table), only those of
 * this trip count; today: «YYYY-MM-DD» (localDay).
 * early: ended before its start date; ask: the date passed but the trip was never ended;
 * source: the trip was made from an uploaded ride; draft: a debrief is started, not saved.
 */
export function tripStateInfo(trip, { debrief = null, rides = [], today = localDay() } = {}) {
  const none = { state: null, early: false, ask: false, source: null, draft: false, over: false, reopened: false };
  if (!trip || trip.skipped || trip.archivedAt) return none;
  const end = tripEnd(trip);
  const over = !!end && end < today;
  const draft = !!debrief && debrief.status !== 'done';
  if (endedTooEarly(trip, today)) return { ...none, state: 'plan', early: true };
  // TZ-2: «Wieder öffnen» makes a completed or rated trip planned again, until it is ended again
  if (trip.reopened && !trip.finished && trip.status !== 'done') return { ...none, state: 'plan', reopened: true };
  const ride = trip.fromRide ? (rides ?? []).find((r) => r.id === trip.fromRide) ?? null : null;
  const source = trip.fromRide ? (ride?.source === 'strava' ? 'strava' : 'gpx') : null;
  if (debrief?.status === 'done') return { ...none, state: 'rated', source, over };
  const ended = !!trip.finished || trip.status === 'done' || !!trip.fromRide;
  const linked = over && (rides ?? []).some((r) => r.tripId === trip.id);
  if (ended || linked) return { ...none, state: 'done', source, draft, over };
  if (over) return { ...none, state: 'done', ask: true, draft, over };
  return { ...none, state: 'plan' };
}

/** The state of a trip: 'plan' | 'done' | 'rated' | null (see tripStateInfo). */
export const tripState = (trip, opts) => tripStateInfo(trip, opts).state;

/** Has the trip happened (completed or rated)? */
export const happened = (state) => state === 'done' || state === 'rated';

/**
 * The state of every trip by its id, with its own debrief and rides: { [id]: info }.
 */
export function tripStates(trips = [], { debriefs = [], rides = [], today = localDay() } = {}) {
  const byTrip = Object.fromEntries((debriefs ?? []).map((d) => [d.tripId, d]));
  return Object.fromEntries((trips ?? []).map((x) => [x.id, tripStateInfo(x, { debrief: byTrip[x.id] ?? null, rides, today })]));
}

/** How many trips are in each state: { plan, done, rated, all } (null states not counted). */
export function stateCounts(infos) {
  const n = { plan: 0, done: 0, rated: 0, all: 0 };
  for (const i of Object.values(infos ?? {})) if (i?.state) (n[i.state]++, n.all++);
  return n;
}

const dayGap = (from, to) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 864e5);

/**
 * The small extra of the pill after «·» as data (the words: stateExtraText):
 *   plan:  { key: 'today'|'tomorrow'|'days'|'under', n? } by the start date (nothing without a date);
 *   done:  { key: 'ask' } the date passed, never ended; { key: 'gpx'|'strava' } made from a ride;
 *          in the header (head) also { key: 'draft' } a debrief started, or { key: 'missing' } when
 *          the trip waits for its debrief (packed in the app, not closed without one); a tile keeps
 *          its pill short (its button already says «Debrief»);
 *   rated: in the header { key: 'on', date } the day the debrief was saved.
 * → null when there is nothing to add.
 */
export function stateExtra(info, { trip = null, debrief = null, today = localDay(), head = false } = {}) {
  if (!info?.state || !trip) return null;
  if (info.state === 'plan') {
    if (info.early || !trip.startDate) return null;
    const n = dayGap(today, trip.startDate);
    if (n < 0) return tripEnd(trip) >= today ? { key: 'under' } : null;
    // Klick-Rundgang H06: after «Losfahren» on the start day the trip is under way, not «heute»
    return n === 0 ? (trip.goDays?.[0] ? { key: 'under' } : { key: 'today' }) : n === 1 ? { key: 'tomorrow' } : { key: 'days', n };
  }
  if (info.state === 'done') {
    if (info.ask && !info.draft) return { key: 'ask' };
    if (info.source) return { key: info.source };
    if (head && info.draft) return { key: 'draft' };
    if (head && trip.entries?.length && !trip.noDebrief) return { key: 'missing' };
    return null;
  }
  const at = debrief?.doneAt ?? debrief?.updatedAt ?? null;
  return head && at ? { key: 'on', date: localDay(new Date(at)) } : null;
}
