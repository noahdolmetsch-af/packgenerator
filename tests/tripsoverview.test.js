// v0.46.1 (Noah: «Touren» opened the last trip at Packen): the trips overview behind «Touren».
// v0.126.0 TZ-1 «Zustand sichtbar» (mockup TZ1): the groups are the three trip states (tripstate.js).
import { describe, it, expect } from 'vitest';
import { tripsOverview, RIDDEN_SHOWN, GROUPS } from '../src/lib/tripsoverview.js';
import { STATES } from '../src/lib/tripstate.js';
import { PLACES, pageOf, placeOf } from '../src/lib/nav.js';

const TODAY = '2026-10-09';
const item = (packed) => ({ itemId: 'x', slot: 'seat', qty: 1, packed });
const trip = (id, startDate, extra = {}) => ({ id, title: `test_data_gtp_ ${id}`, startDate, days: 1, bikeId: 'b', bike: 'test_data_gtp_ Bike', entries: [item(false)], ready: [], ...extra });

describe('trips overview by state (v0.46.1, v0.126.0)', () => {
  const trips = [
    trip('packed', '2026-10-20', { entries: [item(true)] }),
    trip('riding', TODAY),
    trip('plan', '2026-10-30'),
    trip('nodate', null),
    trip('early', '2026-10-25', { finished: TODAY, status: 'done' }),
    trip('over', '2026-10-01'),
    trip('ride', '2026-10-04', { fromRide: 'r1', entries: [], status: 'done', finished: '2026-10-04' }),
    trip('skipped', '2026-10-25', { skipped: true }),
    ...Array.from({ length: 6 }, (_, n) => trip(`old${n}`, `2026-09-0${n + 1}`, { noDebrief: true, status: 'done' })),
    ...Array.from({ length: 7 }, (_, n) => trip(`rated${n}`, `2026-08-0${n + 1}`)),
  ];
  const debriefs = Array.from({ length: 7 }, (_, n) => ({ tripId: `rated${n}`, status: 'done', km: 40 + n }));
  const v = tripsOverview(trips, debriefs, TODAY, [{ id: 'r1', source: 'gpx' }]);

  it('the groups are the three states, in their order', () => {
    expect(GROUPS.map((g) => g.key)).toEqual(STATES);
  });

  it('planned: ended before it began first, then under way, soon and in planning', () => {
    expect(v.plan.map((r) => r.id).slice(0, 2)).toEqual(['early', 'riding']);
    expect(v.plan.map((r) => r.id).slice(2).sort()).toEqual(['nodate', 'packed', 'plan']); // the inProgress order (drafts.js)
    expect(v.plan.every((r) => r.tstate.state === 'plan')).toBe(true);
    expect(v.plan[0]).toMatchObject({ kind: 'replan', go: { label: 'Plan again' } });
  });

  it('completed: the open debrief first, then the rest newest first, RIDDEN_SHOWN of them', () => {
    expect(v.done[0]).toMatchObject({ id: 'over', kind: 'debrief', go: { label: 'Debrief', href: '#/debrief/over' } });
    expect(v.done.slice(1).map((r) => r.id)).toEqual(['ride', 'old5', 'old4', 'old3', 'old2']);
    expect(v.done.slice(1)).toHaveLength(RIDDEN_SHOWN);
    expect(v.doneTotal).toBe(8);
    const ride = v.done.find((r) => r.id === 'ride');
    expect(ride.go).toEqual({ label: 'Open|trip', href: '#/debrief/ride/r1' });
    expect(ride.tstate).toMatchObject({ state: 'done', source: 'gpx' });
  });

  it('rated: newest first, RIDDEN_SHOWN of them, with their km', () => {
    expect(v.rated.map((r) => r.id)).toEqual(['rated6', 'rated5', 'rated4', 'rated3', 'rated2']);
    expect(v.rated[0].km).toBe(46);
    expect(v.ratedTotal).toBe(7);
    expect(v.counts).toEqual({ plan: 5, done: 8, rated: 7, all: 20 });
    expect(v.empty).toBe(false);
  });

  it('nothing at all: empty', () => {
    expect(tripsOverview([], [], TODAY).empty).toBe(true);
    expect(tripsOverview([trip('s', '2026-10-25', { skipped: true })], [], TODAY).empty).toBe(true);
  });

  it('«Touren» goes to the overview; #/pack still opens a trip', () => {
    expect(PLACES.find((p) => p.key === 'trips').href).toBe('#/trips');
    expect(pageOf('#/trips')).toBe('trips');
    expect(placeOf('trips')).toBe('trips');
    expect(pageOf('#/pack?trip=x')).toBe('pack');
  });
});
