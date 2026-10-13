// v0.124.0 TZ-1 «Zustand sichtbar» (spec tour-zustaende, Noah 13.10.2026 «1-5 a»): one rule decides the
// state of a trip: Geplant, Abgeschlossen, Bewertet. Fictional data only.
import { describe, it, expect, afterEach } from 'vitest';
import { tripState, tripStateInfo, tripStates, stateCounts, happened, endedTooEarly, stateExtra, STATES, STATE_NAMES, STATE_HELP } from '../src/lib/tripstate.js';
import { stateExtraText } from '../src/lib/tripstatetext.js';
import { tripDone } from '../src/lib/yearreview.js';
import { isOver } from '../src/lib/debrief.js';
import { lang } from '../src/lib/i18n.svelte.js';
import DE from '../src/lib/i18n/de/index.js';

const TODAY = '2026-10-13';
const trip = (id, startDate, extra = {}) => ({ id, title: `test_data_gtp_ ${id}`, startDate, days: 1, entries: [{ itemId: 'x', packed: false }], ...extra });
const done = (tripId, extra = {}) => ({ tripId, status: 'done', doneAt: '2026-09-06T18:00:00.000Z', ...extra });
afterEach(() => (lang.v = 'en'));

describe('tripState: the three states', () => {
  it('ahead or under way: planned', () => {
    expect(tripState(trip('a', '2026-10-14'), { today: TODAY })).toBe('plan');
    expect(tripState(trip('b', '2026-10-12', { days: 3 }), { today: TODAY })).toBe('plan'); // under way
    expect(tripState(trip('c', null), { today: TODAY })).toBe('plan'); // no date yet
  });

  it('ended in the app, made from a ride, or the date passed: completed', () => {
    expect(tripState(trip('f', TODAY, { finished: TODAY }), { today: TODAY })).toBe('done');
    expect(tripState(trip('s', '2026-10-01', { status: 'done', noDebrief: true }), { today: TODAY })).toBe('done');
    expect(tripState(trip('r', '2026-10-04', { fromRide: 'ride1', entries: [], status: 'done', finished: '2026-10-04' }), { today: TODAY })).toBe('done');
    // the date passed, never ended: completed, but marked (TZ-2 asks «Did you ride?»)
    const old = tripStateInfo(trip('h', '2026-10-07'), { today: TODAY });
    expect(old).toMatchObject({ state: 'done', ask: true });
  });

  it('a ride linked to the trip: completed once its last day is over, not asked', () => {
    const rides = [{ id: 'r1', tripId: 'l', date: '2026-10-07' }];
    expect(tripStateInfo(trip('l', '2026-10-07'), { rides, today: TODAY })).toMatchObject({ state: 'done', ask: false });
    expect(tripState(trip('l', '2026-10-20'), { rides, today: TODAY })).toBe('plan');
  });

  it('the debrief saved: rated; a draft stays completed', () => {
    expect(tripState(trip('d', '2026-09-03'), { debrief: done('d'), today: TODAY })).toBe('rated');
    expect(tripStateInfo(trip('e', '2026-09-03'), { debrief: { tripId: 'e', status: 'draft' }, today: TODAY })).toMatchObject({ state: 'done', draft: true });
  });

  it('«Not riding» and archived trips are no trips', () => {
    expect(tripState(trip('x', '2026-10-01', { skipped: true }), { today: TODAY })).toBeNull();
    expect(tripState(trip('y', '2026-10-01', { archivedAt: '2026-10-02T10:00:00Z' }), { today: TODAY })).toBeNull();
    expect(tripState(null)).toBeNull();
  });

  it('ended before it began: planned again (with «Plan again»), even with a debrief', () => {
    const early = trip('z', '2026-10-20', { finished: TODAY, status: 'done' });
    expect(endedTooEarly(early, TODAY)).toBe(true);
    expect(tripStateInfo(early, { debrief: done('z'), today: TODAY })).toMatchObject({ state: 'plan', early: true });
  });

  it('an uploaded ride names its source', () => {
    const t = trip('g', '2026-10-11', { fromRide: 'ride2', entries: [], status: 'done', finished: '2026-10-11' });
    expect(tripStateInfo(t, { rides: [{ id: 'ride2', source: 'gpx' }], today: TODAY }).source).toBe('gpx');
    expect(tripStateInfo(t, { rides: [{ id: 'ride2', source: 'strava' }], today: TODAY }).source).toBe('strava');
    expect(tripStateInfo(t, { today: TODAY }).source).toBe('gpx');
  });

  it('counts per state, all states named and explained in German', () => {
    const trips = [trip('a', '2026-10-14'), trip('h', '2026-10-07'), trip('d', '2026-09-03'), trip('x', '2026-10-01', { skipped: true })];
    const infos = tripStates(trips, { debriefs: [done('d')], today: TODAY });
    expect(stateCounts(infos)).toEqual({ plan: 1, done: 1, rated: 1, all: 3 });
    expect(happened('done') && happened('rated') && !happened('plan') && !happened(null)).toBe(true);
    expect(STATES).toEqual(['plan', 'done', 'rated']);
    lang.v = 'de';
    for (const k of STATES) {
      expect(DE[STATE_NAMES[k]], k).toBeTruthy();
      expect(DE[STATE_HELP[k]], k).toBeTruthy();
    }
    expect(Object.values(STATE_NAMES).map((k) => DE[k])).toEqual(['Geplant', 'Abgeschlossen', 'Bewertet']);
  });
});

describe('the small extra of the pill', () => {
  const x = (t, opts = {}) => stateExtra(tripStateInfo(t, { today: TODAY, ...opts }), { trip: t, today: TODAY, ...opts });
  it('planned: today, tomorrow, in n days, on the way', () => {
    expect(x(trip('a', TODAY))).toEqual({ key: 'today' });
    expect(x(trip('a', '2026-10-14'))).toEqual({ key: 'tomorrow' });
    expect(x(trip('a', '2026-10-16'))).toEqual({ key: 'days', n: 3 });
    expect(x(trip('a', '2026-10-12', { days: 3 }))).toEqual({ key: 'under' });
    expect(x(trip('a', null))).toBeNull();
    // over the change to winter time (25.10.2026) still calendar days
    expect(stateExtra({ state: 'plan' }, { trip: trip('w', '2026-10-27'), today: '2026-10-24' })).toEqual({ key: 'days', n: 3 });
  });
  it('completed: date passed, source; in the header also «debrief started» or «debrief missing»', () => {
    expect(x(trip('h', '2026-10-07'))).toEqual({ key: 'ask' });
    expect(x(trip('g', '2026-10-11', { fromRide: 'r', entries: [], status: 'done', finished: '2026-10-11' }))).toEqual({ key: 'gpx' });
    expect(x(trip('e', '2026-10-01', { finished: '2026-10-01' }), { debrief: { tripId: 'e', status: 'draft' } })).toBeNull();
    expect(x(trip('e', '2026-10-01', { finished: '2026-10-01' }), { debrief: { tripId: 'e', status: 'draft' }, head: true })).toEqual({ key: 'draft' });
    expect(x(trip('j', '2026-10-01', { finished: '2026-10-01' }))).toBeNull();
    expect(x(trip('j', '2026-10-01', { finished: '2026-10-01' }), { head: true })).toEqual({ key: 'missing' });
    expect(x(trip('n', '2026-10-01', { finished: '2026-10-01', noDebrief: true }), { head: true })).toBeNull();
  });
  it('rated: the day of the debrief in the header only', () => {
    const t = trip('d', '2026-09-03', { days: 3 });
    expect(x(t, { debrief: done('d') })).toBeNull();
    expect(x(t, { debrief: done('d'), head: true })).toEqual({ key: 'on', date: '2026-09-06' });
  });
  it('the words, in German too', () => {
    lang.v = 'de';
    expect(stateExtraText({ key: 'tomorrow' })).toBe('Morgen');
    expect(stateExtraText({ key: 'days', n: 3 })).toBe('in 3 Tagen');
    expect(stateExtraText({ key: 'missing' })).toBe('Rückblick fehlt');
    expect(stateExtraText({ key: 'ask' })).toBe('Datum vorbei');
    expect(stateExtraText({ key: 'on', date: '2026-09-06' })).toMatch(/^6\. Sept/);
    expect(stateExtraText(null)).toBe('');
  });
});

describe('the old rules it replaced keep their behaviour', () => {
  // yearreview.js tripDone before v0.124.0 (kept here as the reference)
  const oldTripDone = (t, debriefs, today) => {
    if (!t || t.skipped || !t.startDate || t.startDate > today) return false;
    return t.status === 'done' || !!t.finished || isOver(t, today) || debriefs.some((d) => d.tripId === t.id && d.status === 'done');
  };
  it('tripDone: the same answer for every combination', () => {
    const starts = [null, '2026-10-01', '2026-10-12', TODAY, '2026-10-14'];
    let n = 0;
    for (const startDate of starts)
      for (const days of [1, 3])
        for (const finished of [null, '2026-10-12'])
          for (const status of ['planned', 'done'])
            for (const skipped of [false, true])
              for (const fromRide of [null, 'r'])
                for (const deb of [null, 'draft', 'done']) {
                  const t = { id: 'q', startDate, days, finished, status, skipped, fromRide: fromRide && finished ? fromRide : null, entries: [] };
                  const debriefs = deb ? [{ tripId: 'q', status: deb }] : [];
                  expect(tripDone(t, debriefs, TODAY), JSON.stringify({ t, deb })).toBe(oldTripDone(t, debriefs, TODAY));
                  n++;
                }
    expect(n).toBe(480);
  });
});
