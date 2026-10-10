import { describe, it, expect } from 'vitest';
import { todayFocus, daysFrom, openDebrief, endedOn } from '../src/lib/today.js';
import { pageOf, placeOf, PLACES } from '../src/lib/nav.js';

// v0.23.0 (AP07): Today's one next step and the main places. Fictional trips only.
const TODAY = '2026-10-07';
const entry = (id, packed = false) => ({ itemId: id, qty: 1, packed });
const trip = (id, startDate, extra = {}) => ({ id: `test_data_gtp_${id}`, title: `test_data_gtp_ ${id}`, startDate, days: 1, entries: [entry('a'), entry('b')], ...extra });

describe('Today: the trip and its one next step', () => {
  it('no trip: nothing to lead with', () => {
    expect(todayFocus([], [], TODAY)).toBe(null);
  });

  it('two upcoming trips: always the sooner one, and its address', () => {
    const later = trip('later', '2026-10-20');
    const sooner = trip('sooner', '2026-10-15');
    const f = todayFocus([later, sooner], [], TODAY);
    expect(f.trip.id).toBe(sooner.id);
    expect(f.kind).toBe('plan');
    expect(f.label).toBe('Plan|stage');
    expect(f.href).toBe('#/pack');
    expect(f.days).toBe(8);
  });

  it('within two days: Start packing (packing day); everything packed: Ride day', () => {
    const t = trip('soon', '2026-10-09');
    expect(todayFocus([t], [], TODAY)).toMatchObject({ kind: 'pack', href: '#/pack?day', label: 'Pack|stage' });
    const packed = { ...t, entries: [entry('a', true)] };
    expect(todayFocus([packed], [], TODAY)).toMatchObject({ kind: 'ride', href: '#/ride' });
    // a trip without a bike (packs) has no ride day
    expect(todayFocus([{ ...packed, packs: [] }], [], TODAY)).toMatchObject({ kind: 'trip', href: '#/pack' });
    // nothing on the list yet: planning first
    expect(todayFocus([{ ...t, entries: [] }], [], TODAY).kind).toBe('plan');
  });

  it('on the trip day: Ride day for that trip', () => {
    const t = trip('now', TODAY, { days: 3 });
    const f = todayFocus([t, trip('later', '2026-10-20')], [], TODAY);
    expect(f).toMatchObject({ kind: 'ride', days: 0 });
    expect(f.trip.id).toBe(t.id);
  });

  it('an ended trip leads with its debrief, unless the next one starts within 14 days', () => {
    const done = trip('done', '2026-10-04');
    const later = trip('later', '2026-10-22');
    const f = todayFocus([done, later], [], TODAY);
    // v0.24.1 (Noah 3a): the card "How was …?": "All good" on Today, "In detail" opens the three steps.
    expect(f).toMatchObject({ kind: 'debrief', ask: true, label: 'Debrief', href: `#/debrief/${done.id}` });
    expect(f.trip.id).toBe(done.id);
    expect(f.next.id).toBe(later.id);
    expect(f.days).toBe(null);
    const soon = trip('soon', '2026-10-08');
    const g = todayFocus([done, soon], [], TODAY);
    expect(g.trip.id).toBe(soon.id);
    expect(g.debrief.id).toBe(done.id);
    // a saved debrief: nothing waits any more
    expect(todayFocus([done], [{ tripId: done.id, status: 'done' }], TODAY)).toBe(null);
    // a draft still waits; a trip ended on the ride day (finished) asks right away
    expect(todayFocus([done], [{ tripId: done.id, status: 'draft' }], TODAY)).toMatchObject({ kind: 'debrief', ask: true });
    const ended = trip('ended', TODAY, { finished: TODAY });
    expect(todayFocus([ended, later], [], TODAY)).toMatchObject({ kind: 'debrief', ask: true });
    // v0.30.2 (L6): a trip within 14 days leads, the fresh debrief waits beside it
    const twoWeeks = trip('twoweeks', '2026-10-21');
    expect(todayFocus([done, twoWeeks], [], TODAY)).toMatchObject({ kind: 'plan', days: 14 });
    expect(todayFocus([done, twoWeeks], [], TODAY).debrief.id).toBe(done.id);
    expect(todayFocus([ended, later], [], TODAY).trip.id).toBe(ended.id);
    // the other steps never ask
    expect(todayFocus([later], [], TODAY).ask).toBe(false);
  });

  // v0.30.2 (L6): a debrief weeks old never takes the top of Today.
  it('an open debrief older than 7 days never leads; it waits in Also to do', () => {
    const old = trip('old', '2026-09-20', { days: 3 }); // ended 22.9.
    const week = trip('week', '2026-09-30'); // ended exactly 7 days ago: still fresh
    const later = trip('later', '2026-11-20'); // more than 14 days ahead
    // with a later trip: that trip leads, the old debrief is the side line
    const f = todayFocus([old, later], [], TODAY);
    expect(f).toMatchObject({ kind: 'plan', ask: false });
    expect(f.trip.id).toBe(later.id);
    expect(f.debrief.id).toBe(old.id);
    expect(openDebrief(f, [old, later], [], TODAY).id).toBe(old.id);
    // nothing else planned: no lead at all, the debrief still waits in Also to do
    expect(todayFocus([old], [], TODAY)).toBe(null);
    expect(openDebrief(null, [old], [], TODAY).id).toBe(old.id);
    expect(openDebrief(null, [], [], TODAY)).toBe(null);
    // 7 days and no trip within 14 days: it still asks, as before
    expect(todayFocus([week, later], [], TODAY)).toMatchObject({ kind: 'debrief', ask: true });
    expect(openDebrief(todayFocus([week, later], [], TODAY), [week, later], [], TODAY)).toBe(null);
    // ended early: the day it was ended counts
    expect(endedOn(trip('early', '2026-09-28', { days: 5, finished: '2026-09-29' }))).toBe('2026-09-29');
    expect(endedOn(old)).toBe('2026-09-22');
  });

  it('days between two dates', () => {
    expect(daysFrom('2026-10-07', '2026-10-09')).toBe(2);
    expect(daysFrom('2026-10-07', '2026-10-07')).toBe(0);
  });
});

describe('main places', () => {
  it('five places in a fixed order (v0.46.1: Trips opens the overview; v0.76.0 «Fünf Orte»: Aktiv opens Im Flow)', () => {
    expect(PLACES.map((p) => [p.key, p.href])).toEqual([['today', '#/'], ['trips', '#/trips'], ['gear', '#/gear'], ['bikes', '#/bikes'], ['active', '#/flow']]);
  });

  it('every address belongs to the right place', () => {
    const cases = {
      '': 'today',
      '#/': 'today',
      '#/pack': 'trips',
      '#/pack?day': 'trips',
      '#/pack/templates': 'trips',
      '#/ride': 'trips',
      '#/debrief': 'trips',
      '#/debrief/x': 'trips',
      '#/share/abc': 'trips',
      '#/gear?fav=1': 'gear',
      '#/gear?q=Tent': 'gear',
      '#/favorites': 'gear',
      '#/bikes?tab=care': 'bikes',
      '#/care': 'bikes',
      // v0.76.0 «Fünf Orte»: Im Flow is the place Aktiv; the Inbox, the notes and the features live in «Ich»
      '#/flow': 'active',
      '#/flow/goals': 'active',
      '#/me': 'me',
      '#/inbox': 'me',
      '#/inbox/new': 'me',
      '#/notes': 'me',
      '#/features': 'me',
    };
    for (const [hash, place] of Object.entries(cases)) expect([hash, placeOf(pageOf(hash))]).toEqual([hash, place]);
    expect(pageOf('#/care', true)).toBe('care');
  });
});
