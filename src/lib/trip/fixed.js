/**
 * TZ-2 «Fest nach der Fahrt» (spec tour-zustaende §2, §4; Noah 13.10.2026 «1-5 a», 5a; mockup TZ2):
 *   - the packing list of a completed or rated trip is fixed: «this is how you rode»;
 *   - «Wieder öffnen» asks once, then the trip is planned again; a saved debrief stays;
 *   - a trip whose date passed but was never ended asks «Did you ride?»: Yes ends it on its last
 *     day (finished), «Not riding» marks it skipped (then it is no trip any more).
 * The state itself comes from tripstate.js (rule 2: trip.reopened). No migration: `reopened` is a
 * plain field of the trip, like finished and skipped. Pure (the browser tests read it in Node); the
 * writes are in reopen.svelte.js.
 */
import { tripEnd } from '../tripstate.js';

/** Is the packing list fixed (completed or rated)? info: tripStateInfo(). */
export const isFixed = (info) => info?.state === 'done' || info?.state === 'rated';

/** Does the trip ask «Did you ride?» (the date passed, never ended, no debrief started)? */
export const asksRide = (info) => info?.state === 'done' && !!info.ask && !info.draft;

/** The fields «Wieder öffnen» changes: the end is taken back as in «Wieder planen» (ending.js
 * planAgainChanges) and the trip marked reopened. */
export const reopenChanges = (trip) => ({ finished: null, endReason: null, ...(trip.status === 'done' ? { status: 'planned' } : {}), reopened: true });

/** The fields of the answer to «Did you ride?»: yes ends the trip on its last day, no skips it. */
export const rideAnswerChanges = (trip, yes) => (yes ? { finished: tripEnd(trip), reopened: null } : { skipped: true });

/** The fields to write back for an Undo: each changed field as it was before (null when it was missing). */
export const beforeOf = (trip, changes) => Object.fromEntries(Object.keys(changes).map((k) => [k, trip?.[k] ?? null]));
