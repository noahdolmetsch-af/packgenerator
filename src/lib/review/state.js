/**
 * SN2/SN4 «Seiten neu» (mockups approved 13.10.2026): the state of every row of the look-back pages
 * (Rückblick, Logbuch, Vergangene Touren), the same rule as everywhere (tripstate.js). A row of
 * tripFacts (rueckblick.js) is a trip that happened, so it is Completed or Rated; an uploaded ride on
 * its own is Completed, with «GPX» or «Strava» as its small extra (rating it comes with TZ-3).
 * Pure, tested in tests/review-state.test.js.
 */
import { tripStateInfo, stateExtra } from '../tripstate.js';
import { localDay } from '../localday.js';

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
      out[f.id] = { state: 'done', extra: { key: r?.source === 'strava' ? 'strava' : 'gpx' }, open: false };
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
