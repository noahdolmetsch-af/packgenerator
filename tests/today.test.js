import { describe, it, expect } from 'vitest';
import { todayFocus, daysFrom } from '../src/lib/today.js';
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
    expect(f.label).toBe('Continue planning');
    expect(f.href).toBe('#/pack');
    expect(f.days).toBe(8);
  });

  it('within two days: Start packing (packing day); everything packed: Ride day', () => {
    const t = trip('soon', '2026-10-09');
    expect(todayFocus([t], [], TODAY)).toMatchObject({ kind: 'pack', href: '#/pack?day', label: 'Start packing' });
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

  it('an ended trip leads with its debrief, unless the next one starts within two days', () => {
    const done = trip('done', '2026-10-04');
    const later = trip('later', '2026-10-20');
    const f = todayFocus([done, later], [], TODAY);
    expect(f).toMatchObject({ kind: 'debrief', label: 'Write debrief', href: `#/debrief/${done.id}` });
    expect(f.trip.id).toBe(done.id);
    expect(f.next.id).toBe(later.id);
    expect(f.days).toBe(null);
    const soon = trip('soon', '2026-10-08');
    const g = todayFocus([done, soon], [], TODAY);
    expect(g.trip.id).toBe(soon.id);
    expect(g.debrief.id).toBe(done.id);
    // a saved debrief: nothing waits any more
    expect(todayFocus([done], [{ tripId: done.id, status: 'done' }], TODAY)).toBe(null);
  });

  it('days between two dates', () => {
    expect(daysFrom('2026-10-07', '2026-10-09')).toBe(2);
    expect(daysFrom('2026-10-07', '2026-10-07')).toBe(0);
  });
});

describe('main places', () => {
  it('four places in a fixed order', () => {
    expect(PLACES.map((p) => [p.key, p.href])).toEqual([['today', '#/'], ['trips', '#/pack'], ['gear', '#/gear'], ['bikes', '#/bikes']]);
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
      '#/inbox': null,
      '#/inbox/new': null,
    };
    for (const [hash, place] of Object.entries(cases)) expect([hash, placeOf(pageOf(hash))]).toEqual([hash, place]);
    expect(pageOf('#/care', true)).toBe('care');
  });
});
