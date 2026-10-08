/**
 * Today (v0.23.0, AP07): which trip the start page leads with, and the ONE next step that fits it.
 * Pure (no database, no screen), so the choice is tested in tests/today.test.js.
 *
 * Order:
 * 1. A trip under way (between its first and last day): bike trip → Ride day, else open the trip.
 * 2. A trip that ended and still wants its debrief, unless the next trip starts within 14 days.
 *    v0.24.1 (Noah 3a): Today asks "How was {trip}?" with "All good" (saves at once) and
 *    "In detail" (the three steps); the step's label and address are the "In detail" ones.
 *    v0.30.2 (L6): only a fresh one (ended at most 7 days ago) asks here; an older open debrief
 *    never pushes the next trip away: it waits in "Also to do" (debrief) with "All good" there.
 * 3. The next trip: within two days → Pack (packing day); all packed → Ride day (bike) / the trip;
 *    nothing on the list yet or later than two days → Continue planning.
 */
import { nextTrip, toDebrief, tripEnd } from './debrief.js';
import { packStatus } from './readiness.js';
import { hasBike } from './domains.js';

/** Whole days from today to an ISO date (both YYYY-MM-DD). */
export const daysFrom = (today, date) => Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 864e5);

/** v0.30.2 (L6): a trip starting within this many days leads; a debrief this many days old still asks. */
export const SOON_DAYS = 14;
export const FRESH_DAYS = 7;

/** The day a trip ended: the day it was ended early (finished), else its last day. */
export const endedOn = (trip) => {
  const end = tripEnd(trip);
  return trip?.finished && (!end || trip.finished < end) ? trip.finished : end;
};

/**
 * The step: its button text (English key for t()), address and short reason (English key).
 * v0.29.0: the button names are the names of the four trip tabs (Plan, Pack, On the way, Debrief),
 * the same everywhere.
 */
export const STEP = {
  plan: { label: 'Plan|stage', href: () => '#/pack', why: 'Choose what comes along; the list stays editable.' },
  pack: { label: 'Pack|stage', href: () => '#/pack?day', why: 'Packing day: bag by bag, then the ready check.' },
  ride: { label: 'On the way', href: () => '#/ride', why: 'Route, weather and the list for the day.' },
  trip: { label: 'Open the trip', href: () => '#/pack', why: 'Your list for the way.' },
  // v0.24.1 (Noah 3a): the card "How was {trip}?"; "All good" is the quick save on Today itself.
  debrief: { label: 'Debrief', href: (trip) => `#/debrief/${encodeURIComponent(trip.id)}`, why: '"All good": every item counts as used and nothing else changes.', ask: true },
};

/**
 * { trip, kind, days, href, label, why, next, debrief } or null when there is no trip at all.
 * trip: the trip shown and opened (the action always opens exactly this one);
 * next: the next upcoming trip (may be another one when the debrief leads); debrief: a trip
 * still waiting for its debrief that is not the lead.
 * Without a trip to lead with it is null; an older open debrief then is openDebrief()'s.
 */
export function todayFocus(trips, debriefs, today) {
  const next = nextTrip(trips, today);
  const waiting = toDebrief(trips, debriefs, today)[0] ?? null;
  const days = next ? daysFrom(today, next.startDate) : null;
  const bike = next ? hasBike(next) : false;
  let trip = next;
  let kind = null;
  const fresh = !!waiting && daysFrom(endedOn(waiting), today) <= FRESH_DAYS;
  if (next && days <= 0) kind = bike ? 'ride' : 'trip';
  else if (fresh && (!next || days > SOON_DAYS)) (trip = waiting), (kind = 'debrief');
  else if (next) {
    const s = packStatus(next);
    if (days > 2 || s.status === 'empty') kind = 'plan';
    else if (s.status === 'done') kind = bike ? 'ride' : 'trip';
    else kind = 'pack';
  }
  if (!kind) return null;
  const step = STEP[kind];
  return {
    trip,
    kind,
    days: trip === next ? days : null,
    href: step.href(trip),
    label: step.label,
    why: step.why,
    ask: !!step.ask,
    next,
    debrief: kind === 'debrief' ? null : waiting,
  };
}

/**
 * v0.30.2 (L6): the open debrief for "Also to do" (a trip, or null): the one waiting beside the
 * trip Today leads with, or, with nothing to lead with, the newest waiting one.
 */
export const openDebrief = (focus, trips, debriefs, today) => (focus ? focus.debrief : (toDebrief(trips, debriefs, today)[0] ?? null));
