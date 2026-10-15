// TZ-2 «Fest nach der Fahrt» (spec tour-zustaende §2, §4; Noah 13.10.2026 «1-5 a», 5a): a completed or rated
// trip's packing list is fixed; «Wieder öffnen» makes it planned again (the debrief stays); a trip whose date
// passed without an end asks «Did you ride?». Fictional data only.
import { describe, it, expect } from 'vitest';
import { tripStateInfo, tripState, tripEnd } from '../src/lib/tripstate.js';
import { isFixed, asksRide, reopenChanges, rideAnswerChanges, beforeOf } from '../src/lib/trip/fixed.js';

const TODAY = '2026-10-13';
const trip = (id, startDate, extra = {}) => ({ id, title: `test_data_gtp_ ${id}`, startDate, days: 1, entries: [{ itemId: 'x', packed: true }], ...extra });
const done = (tripId) => ({ tripId, status: 'done', doneAt: '2026-10-02T18:00:00.000Z' });
const info = (t, opts = {}) => tripStateInfo(t, { today: TODAY, ...opts });

describe('isFixed: completed and rated keep their list', () => {
  it('planned stays open, completed and rated are fixed, no trip is not', () => {
    expect(isFixed(info(trip('a', '2026-10-14')))).toBe(false);
    expect(isFixed(info(trip('b', '2026-10-01', { finished: '2026-10-01' })))).toBe(true);
    expect(isFixed(info(trip('c', '2026-10-01', { finished: '2026-10-01' }), { debrief: done('c') }))).toBe(true);
    expect(isFixed(info(trip('d', '2026-10-01', { skipped: true })))).toBe(false);
    expect(isFixed(null)).toBe(false);
  });
  it('ended before its start: planned, with «Plan again», not fixed', () => {
    expect(isFixed(info(trip('e', '2026-10-20', { finished: TODAY })))).toBe(false);
  });
});

describe('asksRide: «Did you ride?»', () => {
  it('only when the date passed, the trip was never ended and no debrief is started', () => {
    expect(asksRide(info(trip('h', '2026-10-07')))).toBe(true);
    expect(asksRide(info(trip('h', '2026-10-07'), { debrief: { tripId: 'h', status: 'draft' } }))).toBe(false);
    expect(asksRide(info(trip('f', '2026-10-07', { finished: '2026-10-07' })))).toBe(false);
    expect(asksRide(info(trip('l', '2026-10-07'), { rides: [{ id: 'r1', tripId: 'l' }] }))).toBe(false);
    expect(asksRide(info(trip('n', '2026-10-14')))).toBe(false);
  });
  it('yes ends it on its last day (completed, fixed); no makes it skipped (no trip)', () => {
    const t = trip('y', '2026-10-05', { days: 3 });
    const yes = { ...t, ...rideAnswerChanges(t, true) };
    expect(yes.finished).toBe(tripEnd(t));
    expect(info(yes)).toMatchObject({ state: 'done', ask: false });
    const no = { ...t, ...rideAnswerChanges(t, false) };
    expect(tripState(no, { today: TODAY })).toBe(null);
  });
});

describe('reopen: «Wieder öffnen» (answer 5a)', () => {
  it('a completed trip is planned again, also after its date', () => {
    const t = trip('o', '2026-10-01', { finished: '2026-10-01', status: 'done' });
    const open = { ...t, ...reopenChanges(t) };
    expect(open).toMatchObject({ finished: null, status: 'planned', reopened: true });
    expect(info(open)).toMatchObject({ state: 'plan', reopened: true });
    expect(isFixed(info(open))).toBe(false);
  });
  it('a rated trip is planned again and its debrief stays; ending it again rates it again', () => {
    const t = trip('p', '2026-10-01', { finished: '2026-10-01' });
    const open = { ...t, ...reopenChanges(t) };
    expect(tripState(open, { debrief: done('p'), today: TODAY })).toBe('plan');
    expect(tripState({ ...open, finished: TODAY }, { debrief: done('p'), today: TODAY })).toBe('rated');
  });
  it('a trip made from a ride or with a ride is planned while reopened', () => {
    const r = trip('q', '2026-10-04', { fromRide: 'ride1', entries: [], status: 'done', finished: '2026-10-04' });
    expect(tripState({ ...r, ...reopenChanges(r) }, { today: TODAY })).toBe('plan');
    const l = trip('s', '2026-10-04');
    expect(tripState({ ...l, ...reopenChanges(l) }, { rides: [{ id: 'r2', tripId: 's' }], today: TODAY })).toBe('plan');
  });
  it('beforeOf keeps what Undo writes back (missing fields as null)', () => {
    const t = trip('u', '2026-10-01', { finished: '2026-10-01' });
    expect(beforeOf(t, reopenChanges(t))).toEqual({ finished: '2026-10-01', endReason: null, reopened: null });
  });
});
