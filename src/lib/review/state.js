/**
 * SN2/SN4 «Seiten neu» (mockups approved 13.10.2026): the state of every row of the look-back pages
 * (Rückblick, Logbuch, Vergangene Touren), the same rule as everywhere (tripstate.js). A row of
 * tripFacts (rueckblick.js) is a trip that happened, so it is Completed or Rated; an uploaded ride on
 * its own is Completed, with «GPX» or «Strava» as its small extra; Rated after «Kurz: Alles gut» (rideOpen).
 * Pure, tested in tests/review-state.test.js.
 */
import { tripStateInfo, stateExtra } from '../tripstate.js';
import { localDay } from '../localday.js';

/**
 * Impeccable Runde 2 (Fahrten 2, Noah 18.10.2026): an uploaded ride without a trip waits for its short
 * debrief until «Kurz: Alles gut» (ride.okAt) or one of its learnings is answered (ride.answers).
 * trip: the ride's trip when it has one (then the trip's own debrief counts, not this).
 */
export function rideOpen(ride, trip = null) {
  if (!ride || trip) return false;
  return !ride.okAt && !Object.keys(ride.answers ?? {}).length;
}

/**
 * { [row id]: { state: 'done' | 'rated', extra: stateExtra data or null, open } } for tripFacts rows.
 * open: the trip waits for its debrief (open or started), so the row offers «Rate».
 */
export function factStates(facts = [], { debriefs = [], rides = [], today = localDay() } = {}) {
  const dBy = Object.fromEntries((debriefs ?? []).map((d) => [d.tripId, d]));
  const out = {};
  for (const f of facts ?? []) {
    const open = f.debrief === 'open' || f.debrief === 'draft';
    if (f.kind !== 'trip' || !f.trip) {
      const r = f.rides?.[0];
      out[f.id] = { state: r && !rideOpen(r) ? 'rated' : 'done', extra: r?.source === 'live' ? null : { key: r?.source === 'strava' ? 'strava' : 'gpx' }, open: false };
      continue;
    }
    const debrief = dBy[f.trip.id] ?? null;
    const info = tripStateInfo(f.trip, { debrief, rides, today });
    // a row here has happened; a trip the rule does not see as a trip any more stays Completed
    const state = info.state === 'rated' ? 'rated' : 'done';
    const extra = state === 'done' ? stateExtra({ ...info, state }, { trip: f.trip, debrief, today, head: true }) : null;
    out[f.id] = { state, extra, open };
  }
  return out;
}

/** How many rows are in each state: { all, done, rated }. */
export function factCounts(rows = [], states = {}) {
  const n = { all: 0, done: 0, rated: 0 };
  for (const r of rows ?? []) {
    const s = states[r.id]?.state;
    n.all++;
    if (s === 'done' || s === 'rated') n[s]++;
  }
  return n;
}

/** Does a row match the state filter ('all', 'done', 'rated')? Rows without a state (old logbook entries) only show under 'all'. */
export const matchesState = (states, id, filter) => !filter || filter === 'all' || states?.[id]?.state === filter;

/** The Rückblick's period choice (12 Monate / this year / Alle), kept on this device (Hub.svelte reads it). */
export const PERIOD_KEY = 'review.period';
export function keepPeriod(mode) {
  try {
    localStorage.setItem(PERIOD_KEY, mode);
  } catch {
    /* private mode: the Rückblick opens on its last choice */
  }
}
