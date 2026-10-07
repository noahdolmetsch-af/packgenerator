// v0.25.1 (Noah 1b, 2b, 3a): the helpers behind the Trips and Bikes tiles on Today.
import { describe, it, expect } from 'vitest';
import { pastTrips, hubBike, addIdea, toggleIdea, removeIdea, sortIdeas, openIdeas, parseChf, newVisit } from '../src/lib/hubs.js';
import { pageOf, placeOf } from '../src/lib/nav.js';
import { visitTotal, costByYear, withVisits } from '../src/lib/workshop.js';

const trip = (id, startDate, over = {}) => ({ id, title: `test_data_gtp_${id}`, startDate, days: 2, bikeId: 'b1', bike: 'Bike one', entries: [{ itemId: 'a' }, { itemId: 'b' }], ...over });

describe('past trips', () => {
  const today = '2026-10-07';
  const trips = [
    trip('old', '2026-05-01'),
    trip('new', '2026-09-20', { days: 3 }),
    trip('next', '2026-10-20'),
    trip('skipped', '2026-08-01', { skipped: true }),
    trip('ended-early', '2026-10-06', { days: 5, finished: '2026-10-06' }),
    trip('empty', '2026-07-01', { entries: [], bikeId: null, bike: null }),
  ];
  const debriefs = [
    { tripId: 'old', status: 'done', km: 142 },
    { tripId: 'new', status: 'draft', km: null },
  ];

  it('lists finished trips newest first, without upcoming and skipped ones', () => {
    expect(pastTrips(trips, debriefs, today).map((r) => r.trip.id)).toEqual(['ended-early', 'new', 'empty', 'old']);
  });

  it('knows days, end, bike, km, items and the debrief state', () => {
    const rows = Object.fromEntries(pastTrips(trips, debriefs, today).map((r) => [r.trip.id, r]));
    expect(rows.old).toMatchObject({ days: 2, end: '2026-05-02', bike: 'Bike one', km: 142, items: 2, debrief: 'done', canDebrief: true });
    expect(rows.new).toMatchObject({ days: 3, end: '2026-09-22', km: null, debrief: 'draft' });
    expect(rows['ended-early']).toMatchObject({ debrief: 'none', km: null });
    // unknown km stays unknown, a trip packed outside the app cannot be debriefed
    expect(rows.empty).toMatchObject({ bike: null, items: 0, km: null, canDebrief: false });
  });

  it('is empty without trips', () => {
    expect(pastTrips([], [], today)).toEqual([]);
  });
});

describe('the bike a quick action starts with', () => {
  const bikes = [{ id: 'a' }, { id: 'b' }];
  it('the next trip’s bike, else the first, else none', () => {
    expect(hubBike({ bikeId: 'b' }, bikes)).toBe('b');
    expect(hubBike({ bikeId: 'gone' }, bikes)).toBe('a');
    expect(hubBike(null, bikes)).toBe('a');
    expect(hubBike({ bikeId: null }, bikes)).toBe('a');
    expect(hubBike(null, [])).toBe(null);
  });
});

describe('ideas per bike ("Was geil wäre")', () => {
  it('adds at the top, trims, ignores empty text', () => {
    let ideas = addIdea(undefined, '  Dropper post ', { id: 'i1', at: '2026-10-01T10:00:00Z' });
    expect(ideas).toEqual([{ id: 'i1', text: 'Dropper post', at: '2026-10-01T10:00:00Z', done: false }]);
    ideas = addIdea(ideas, 'Lighter wheels', { id: 'i2', at: '2026-10-02T10:00:00Z' });
    expect(ideas.map((x) => x.id)).toEqual(['i2', 'i1']);
    expect(addIdea(ideas, '   ', { id: 'i3' })).toBe(ideas);
  });

  it('ticks done and back, removes, counts the open ones', () => {
    const ideas = [{ id: 'i1', text: 'A', at: '2026-10-01', done: false }, { id: 'i2', text: 'B', at: '2026-10-02', done: false }];
    const ticked = toggleIdea(ideas, 'i1');
    expect(ticked.find((x) => x.id === 'i1').done).toBe(true);
    expect(ideas[0].done).toBe(false); // the old list is not changed
    expect(toggleIdea(ticked, 'i1').find((x) => x.id === 'i1').done).toBe(false);
    expect(openIdeas(ticked)).toBe(1);
    expect(openIdeas(undefined)).toBe(0);
    expect(removeIdea(ticked, 'i2').map((x) => x.id)).toEqual(['i1']);
    expect(removeIdea(undefined, 'x')).toEqual([]);
  });

  it('shows open ideas first, newest first', () => {
    const ideas = [{ id: 'a', at: '2026-01-01', done: true }, { id: 'b', at: '2026-02-01' }, { id: 'c', at: '2026-03-01' }];
    expect(sortIdeas(ideas).map((x) => x.id)).toEqual(['c', 'b', 'a']);
  });
});

describe('a workshop visit typed in by hand', () => {
  it('reads CHF amounts', () => {
    expect(parseChf('')).toBe(null);
    expect(parseChf('120')).toBe(120);
    expect(parseChf('120,50')).toBe(120.5);
    expect(parseChf("1'200.25")).toBe(1200.25);
    expect(parseChf('abc')).toBeNaN();
    expect(parseChf('-5')).toBeNaN();
  });

  it('writes the shape workshop.js reads; unknown cost stays unknown', () => {
    const v = newVisit({ bikeId: 'b1', date: '2026-10-01', shop: ' test_data_gtp_shop ', km: 4200, chf: 89.5, photo: 'data:image/jpeg;base64,x' }, { id: 'visit-1' });
    expect(v).toMatchObject({ id: 'visit-1', bikeId: 'b1', date: '2026-10-01', shop: 'test_data_gtp_shop', km: 4200, totalChf: 89.5, parts: [], photos: ['data:image/jpeg;base64,x'] });
    expect(visitTotal(v)).toBe(89.5);
    const unknown = newVisit({ bikeId: 'b1', date: '2026-10-01', shop: 'x' }, { id: 'visit-2' });
    expect(visitTotal(unknown)).toBe(null);
    expect(costByYear([v, unknown])).toEqual([{ year: '2026', chf: 89.5, visits: 2, unknown: 1 }]);
    expect(withVisits({ id: 'b1', parts: [] }, [v]).id).toBe('b1');
  });
});

describe('Past trips address', () => {
  it('is its own page under Trips', () => {
    expect(pageOf('#/pack/past')).toBe('past');
    expect(placeOf('past')).toBe('trips');
    expect(pageOf('#/pack/templates')).toBe('templates');
    expect(pageOf('#/pack?choose')).toBe('pack');
  });
});
