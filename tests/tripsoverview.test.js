// v0.46.1 (Noah: «Touren» opened the last trip at Packen): the trips overview behind «Touren».
import { describe, it, expect } from 'vitest';
import { tripsOverview, RIDDEN_SHOWN } from '../src/lib/tripsoverview.js';
import { PLACES, pageOf, placeOf } from '../src/lib/nav.js';

const TODAY = '2026-10-09';
const item = (packed) => ({ itemId: 'x', slot: 'seat', qty: 1, packed });
const trip = (id, startDate, extra = {}) => ({ id, title: `test_data_gtp_ ${id}`, startDate, days: 1, bikeId: 'b', bike: 'test_data_gtp_ Bike', entries: [item(false)], ready: [], ...extra });

describe('trips overview (v0.46.1)', () => {
  const trips = [
    trip('packed', '2026-10-20', { entries: [item(true)] }),
    trip('riding', TODAY),
    trip('plan', '2026-10-30'),
    trip('nodate', null),
    trip('over', '2026-10-01'),
    trip('skipped', '2026-10-25', { skipped: true }),
    ...Array.from({ length: 6 }, (_, n) => trip(`old${n}`, `2026-09-0${n + 1}`, { noDebrief: true })),
  ];
  const v = tripsOverview(trips, [], TODAY);

  it('groups by state: soon on the way, in planning, debrief open, ridden', () => {
    expect(v.soon.map((r) => r.id)).toEqual(['riding', 'packed']);
    expect(v.planning.map((r) => r.id).sort()).toEqual(['nodate', 'plan']);
    expect(v.debrief.map((r) => r.id)).toEqual(['over']);
    expect(v.ridden.map((r) => r.id)).toHaveLength(RIDDEN_SHOWN);
    expect(v.ridden[0].id).toBe('old5');
    expect(v.riddenTotal).toBe(6);
    expect(v.empty).toBe(false);
  });

  it('each row has one button named by its next step', () => {
    const by = Object.fromEntries([...v.soon, ...v.planning, ...v.debrief, ...v.ridden].map((r) => [r.id, r.go]));
    expect(by.packed).toEqual({ label: 'On the way', href: '#/ride' });
    expect(by.riding).toEqual({ label: 'On the way', href: '#/ride' });
    expect(by.plan).toEqual({ label: 'Continue to Plan', href: '#/pack' });
    expect(by.over).toEqual({ label: 'Debrief', href: '#/debrief/over' });
    expect(by.old5.label).toBe('Open|trip');
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
