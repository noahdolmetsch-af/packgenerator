// Nacht-Ideen (Noah 28.10.2026): reward every hour and the bakery in the morning. Made-up places.
import { describe, it, expect } from 'vitest';
import { isBakery, morningBakery, bakeryTime, rewardsOf, nextReward } from '../src/lib/race/night-lib.js';

const at = (s) => new Date(s).getTime(); // local time
const bake = (km, hours, extra = {}) => ({ id: `b${km}`, kind: 'shop', sub: 'bakery', name: `Sample bakery ${km}`, km, hours, ...extra });

describe('bakery in the morning', () => {
  it('knows a bakery by its OSM kind or by its name', () => {
    expect(isBakery({ kind: 'shop', sub: 'bakery' })).toBe(true);
    expect(isBakery({ kind: 'shop', sub: 'supermarket', name: 'Bäckerei Muster' })).toBe(true);
    expect(isBakery({ kind: 'shop', sub: 'supermarket', name: 'Sample shop' })).toBe(false);
    expect(isBakery({ kind: 'food', sub: 'bakery' })).toBe(false);
  });
  it('takes the first one open when you get there, else the first one with its opening time', () => {
    const eta = (km) => at('2027-05-05T04:00:00') + (km - 200) * 3 * 6e4; // 20 km/h from km 200 at 04:00
    const pois = [bake(210, 'Mo-Su 06:00-18:00'), bake(240, 'Mo-Su 05:00-18:00'), { id: 's', kind: 'shop', sub: 'supermarket', km: 205, hours: '24/7' }];
    const got = morningBakery(pois, 200, eta);
    expect(got.poi.id).toBe('b240');
    expect(got.km).toBe(40);
    expect(got.state.open).toBe(true);
    const closed = morningBakery([bake(210, 'Mo-Su 06:00-18:00')], 200, eta);
    expect(closed.state).toMatchObject({ open: false, opens: '06:00' });
    expect(morningBakery(pois, 300, eta)).toBeNull();
  });
  it('shows in race mode from midnight to 10 in the morning', () => {
    expect(bakeryTime(at('2027-05-05T00:30:00'))).toBe(true);
    expect(bakeryTime(at('2027-05-05T09:59:00'))).toBe(true);
    expect(bakeryTime(at('2027-05-05T10:00:00'))).toBe(false);
    expect(bakeryTime(at('2027-05-04T23:00:00'))).toBe(false);
  });
});

describe('a reward every hour', () => {
  it('leaves out empty rows', () => {
    expect(rewardsOf({ rewards: [{ id: 'a', text: 'Gummy bears' }, { id: 'b', text: ' ' }] })).toEqual([{ id: 'a', text: 'Gummy bears' }]);
    expect(rewardsOf({})).toEqual([]);
  });
  it('the next full hour, the list in turn from the start', () => {
    const list = [{ text: 'A' }, { text: 'B' }, { text: 'C' }];
    const start = at('2027-05-04T08:30:00');
    // start 08:30: 09:00 is the first full hour (A), 10:00 the second (B) …
    expect(nextReward(list, at('2027-05-04T08:40:00'), start)).toEqual({ at: at('2027-05-04T09:00:00'), text: 'A', n: 1 });
    expect(nextReward(list, at('2027-05-04T09:10:00'), start)).toEqual({ at: at('2027-05-04T10:00:00'), text: 'B', n: 2 });
    expect(nextReward(list, at('2027-05-04T10:05:00'), start).text).toBe('C');
    expect(nextReward(list, at('2027-05-04T12:59:00'), start).text).toBe('B');
    expect(nextReward([], at('2027-05-04T10:05:00'), start)).toBeNull();
  });
});
