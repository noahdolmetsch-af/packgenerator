// «Heute lädt nicht» (19.10.2026): two milestones of the same kind on one day crashed Heute (the same key twice).
import { describe, it, expect } from 'vitest';
import { milestoneStep, milestonesNow } from '../src/lib/home/heute.js';

const lv = (trips, km = 1) => ({ trips, bikes: { b1: km }, nights: false });

describe('milestones on one day', () => {
  it('a second step of the same kind on the same day replaces the first', () => {
    const s0 = milestoneStep(null, lv(5), '2026-10-19').state;
    const s1 = milestoneStep(s0, lv(6, 2), '2026-10-19').state;
    // the other device's lower levels come back with the exchange, then this device counts again
    const s2 = milestoneStep({ ...s1, levels: { ...s1.levels, trips: 5, bikes: { b1: 1 } } }, lv(6, 2), '2026-10-19').state;
    const keys = s2.events.map((e) => `${e.key}:${e.bikeId ?? ''}:${e.day}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(s2.events.filter((e) => e.key === 'trips')).toHaveLength(1);
  });

  it('a state stored twice before still shows each milestone once (the newer one)', () => {
    const state = { levels: lv(7), events: [{ key: 'trips', n: 6, day: '2026-10-19' }, { key: 'trips', n: 7, day: '2026-10-19' }] };
    const now = milestonesNow(state, '2026-10-19');
    expect(now).toHaveLength(1);
    expect(now[0].n).toBe(7);
  });
});
