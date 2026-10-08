/**
 * AP29 (Noah, v0.35.0): the list "In Bearbeitung" (In progress) behind the small "{n} more" pill in
 * the dark trip band (trip/InProgress.svelte). Pure functions, tested in tests/drafts.test.js.
 *
 * Noah's answers: only trips and debriefs are listed (3b: no templates, no dialog drafts); open
 * debriefs older than 7 days go to the bottom (2a); a fully packed trip stays until the trip is
 * over, its next step is On the way (7a); finished, over (with the debrief saved or skipped) and
 * skipped trips drop out by themselves (8a+b).
 *
 * The states reuse the existing rules: isOver / tripEnd (debrief.js), packStatus (readiness.js),
 * Today's steps and their addresses (today.js STEP), hasBike (domains.js).
 * Labels are English keys for t(); a row's numbers come separately (state.done/total, state.day).
 */
import { isOver, tripEnd } from './debrief.js';
import { packStatus } from './readiness.js';
import { STEP, daysFrom, endedOn, FRESH_DAYS } from './today.js';
import { hasBike } from './domains.js';
import { localDay } from './localday.js';

/** A trip starting within this many days is urgent (Today's packing-day rule). */
export const PACK_DAYS = 2;

/** The order of the list: lower comes first. */
const RANK = { ride: 0, soon: 1, freshDebrief: 2, upcoming: 3, oldDebrief: 4 };

/** The small neutral badge of a row (English keys for t()). */
export const STATE = {
  plan: 'Planning',
  empty: 'Nothing on the list yet',
  packing: 'Packing {done}/{total}',
  ready: 'Ready check {done}/{total}',
  packed: 'Packed',
  ride: 'On the way · day {day}',
  debrief: 'Debrief open',
  debriefDraft: 'Debrief started',
};

const stamp = (...xs) => xs.find((x) => typeof x === 'string' && x) ?? null;
const ms = (iso) => (iso ? Date.parse(iso) : NaN);

/** The next step of a trip as { step, label, href, tripId } (the caller opens the trip first: nav.js openTrip). */
const nextOf = (step, trip) => ({ step, label: STEP[step].label, href: STEP[step].href(trip), tripId: trip.id });

/**
 * One trip's row, or null when nothing is open: skipped ("Not riding"), the debrief saved or
 * finished without one (noDebrief), or over without a list.
 * debrief: the trip's debrief record or null.
 */
export function tripRow(trip, debrief = null, today = localDay()) {
  if (!trip || trip.skipped) return null;
  const base = { id: trip.id, title: trip.title ?? '', tripId: trip.id, bike: hasBike(trip) };
  if (isOver(trip, today)) {
    // toDebrief's rule (answer 1a): only trips packed in the app want a debrief.
    if (trip.noDebrief || debrief?.status === 'done' || !trip.entries?.length) return null;
    const ended = endedOn(trip);
    const age = ended ? daysFrom(ended, today) : 0;
    const key = debrief?.status === 'draft' ? 'debriefDraft' : 'debrief';
    return {
      ...base,
      kind: 'debrief',
      state: { key, label: STATE[key] },
      next: nextOf('debrief', trip),
      updatedAt: stamp(debrief?.updatedAt, trip.updatedAt, trip.createdAt),
      date: ended,
      rank: age <= FRESH_DAYS ? RANK.freshDebrief : RANK.oldDebrief,
    };
  }
  const updatedAt = stamp(trip.updatedAt, trip.createdAt);
  const start = trip.startDate ?? null;
  // Under way: between the first and the last day.
  if (start && start <= today && tripEnd(trip) >= today) {
    const day = daysFrom(start, today) + 1;
    return { ...base, kind: 'ride', state: { key: 'ride', label: STATE.ride, day }, next: nextOf(base.bike ? 'ride' : 'trip', trip), updatedAt, date: start, rank: RANK.ride };
  }
  const days = start ? daysFrom(today, start) : null;
  const soon = days != null && days <= PACK_DAYS;
  const s = packStatus(trip);
  let state;
  let step;
  if (s.status === 'empty') (state = { key: 'empty', label: STATE.empty }), (step = 'plan');
  else if (s.status === 'done') (state = { key: 'packed', label: STATE.packed }), (step = base.bike ? 'ride' : 'trip');
  else if (s.packed < s.count) {
    // Nothing ticked yet and more than two days away: still planning (Today's rule).
    state = s.packed || soon ? { key: 'packing', label: STATE.packing, done: s.packed, total: s.count } : { key: 'plan', label: STATE.plan };
    step = soon || s.packed ? 'pack' : 'plan';
  } else (state = { key: 'ready', label: STATE.ready, done: s.ready, total: s.readyTotal }), (step = 'pack');
  return { ...base, kind: 'trip', state, next: nextOf(step, trip), updatedAt, date: start, days, rank: soon ? RANK.soon : RANK.upcoming };
}

/**
 * Every unfinished trip and debrief, most urgent first:
 * 1. a trip under way, 2. a trip within two days, 3. a fresh debrief (ended ≤ 7 days),
 * 4. the other upcoming trips (soonest first), 5. older open debriefs (newest first).
 * Inside a group: by date (soonest trip / newest debrief), then the latest change first.
 * Each row: { kind: 'trip'|'ride'|'debrief', id, title, tripId, bike, state: { key, label, done?, total?, day? },
 *   next: { step, label, href, tripId }, updatedAt, date, rank }.
 */
export function inProgress(trips = [], debriefs = [], today = localDay()) {
  const byTrip = Object.fromEntries(debriefs.map((d) => [d.tripId, d]));
  const rows = trips.map((t) => tripRow(t, byTrip[t.id] ?? null, today)).filter(Boolean);
  const newerFirst = (a, b) => (ms(b.updatedAt) || 0) - (ms(a.updatedAt) || 0);
  return rows.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    if (a.date && b.date && a.date !== b.date) {
      // Trips: the soonest first; debriefs: the newest end first.
      const later = a.kind === 'debrief' ? -1 : 1;
      return a.date < b.date ? -later : later;
    }
    return newerFirst(a, b) || (a.title ?? '').localeCompare(b.title ?? '');
  });
}

/**
 * The quiet actions behind a row's •••, safest first (Noah: prefer skipped/finished over delete):
 * an upcoming trip: 'skip' ("Not riding" / "Not going") and 'discard' (the sheet asks once more
 * before it deletes); a trip under way: 'end' (ended today, then the debrief); a debrief:
 * 'noDebrief' ("Finish without debrief"). A past trip is never deleted from here, nor the open one.
 */
export function rowActions(row, { current = null } = {}) {
  if (!row) return [];
  if (row.kind === 'debrief') return ['noDebrief'];
  if (row.kind === 'ride') return ['end'];
  // The trip open on this page is not deleted from under it (its page would vanish with the Undo).
  return row.tripId === current ? ['skip'] : ['skip', 'discard'];
}

/** The changes an action writes to the trip (discard deletes it instead: null). */
export function actionChanges(action, today = localDay()) {
  if (action === 'skip') return { skipped: true };
  if (action === 'end') return { finished: today };
  if (action === 'noDebrief') return { noDebrief: true, status: 'done' };
  return null;
}

/**
 * Has the trip anything beyond its start (ticks, a done check, a route, notes)? Then "Discard"
 * says so in its question.
 */
export const hasWork = (trip) =>
  !!trip && (!!trip.entries?.some((e) => e.packed) || !!trip.ready?.some((r) => r.done) || !!trip.route || !!trip.ride?.notes?.length || !!trip.finished);

/*
 * v0.35.0 (Noah 4b + 5a): nothing typed is lost in "New trip", "Add item" and the quick note.
 * The windows save while you type (TripDialog, ItemDialog, QuickNote); these are their rules.
 */

/**
 * Does a window for something new save now? Only a new thing, not after "Create"/"Save"/"Discard"
 * (ended), with a name (the note: its text or photo) and something typed in this window (changed:
 * a name the app made itself or one brought from the search does not count until it is changed).
 */
export const autoKeep = ({ isNew = true, ended = false, name = '', changed = true } = {}) => isNew && !ended && !!String(name ?? '').trim() && !!changed;

/**
 * What leaving the window does with the thing it made:
 * 'save' ("Create trip"/"Save": the full save with its checks), 'delete' ("Discard"/"Cancel" after
 * it was made here: it has nothing else yet), 'keep' (closed with Escape, outside or a link after
 * typing: the last state is saved and opened), 'nothing' (closed or cancelled before anything was typed).
 */
export function leaveWindow(how, { made = false, typed = false } = {}) {
  if (how === 'save') return 'save';
  if (how === 'discard') return made ? 'delete' : 'nothing';
  return made || typed ? 'keep' : 'nothing';
}
