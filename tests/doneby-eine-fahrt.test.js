// One ride fulfils at most one session of its day (Noah 27.11.2026: a Zwift ride of 28 minutes ticked the Zwift session
// and the 2 h 10 min ride of the same day). Made-up sessions and rides.
import { describe, it, expect } from 'vitest';
import { doneBy, matchDay } from '../src/lib/training.js';

const S = (id, over = {}) => ({ id, day: '2026-11-27', kind: 'bike', mins: 60, name: id, ...over });
const R = (over = {}) => ({ id: 'r1', day: '2026-11-27', kind: 'bike', movingS: 28 * 60, time: '09:14', ...over });

describe('one ride, two sessions of the same sport on one day', () => {
  const zwift = S('zwift', { mins: 60, time: '09:14' });
  const long = S('long', { mins: 130 });
  it('the old rule ticks both', () => {
    expect(doneBy(zwift, [R()])).toBeTruthy();
    expect(doneBy(long, [R()])).toBeTruthy();
  });
  it('with the sessions of the plan only the best fit is ticked (by the start time)', () => {
    expect(doneBy(zwift, [R()], [zwift, long])).toBeTruthy();
    expect(doneBy(long, [R()], [zwift, long])).toBeNull();
  });
  it('without start times the length decides', () => {
    const a = S('a', { mins: 30 });
    const b = S('b', { mins: 120 });
    const ride = R({ time: undefined, movingS: 35 * 60 });
    expect(doneBy(a, [ride], [a, b])).toBeTruthy();
    expect(doneBy(b, [ride], [a, b])).toBeNull();
  });
  it('two rides tick two sessions', () => {
    const rides = [R({ id: 'r1' }), R({ id: 'r2', time: '17:30', movingS: 125 * 60 })];
    expect(doneBy(zwift, rides, [zwift, long])?.id).toBe('r1');
    expect(doneBy(long, rides, [zwift, long])?.id).toBe('r2');
  });
  it('a session ticked by hand stays ticked', () => {
    expect(doneBy({ ...long, done: true }, [R()], [zwift, { ...long, done: true }])?.byHand).toBe(true);
  });
  it('a ride of another day or sport ticks nothing', () => {
    expect(doneBy(zwift, [R({ day: '2026-11-26' })], [zwift])).toBeNull();
    expect(doneBy(zwift, [R({ kind: 'run' })], [zwift])).toBeNull();
  });
  it('an «other» session only takes a ride the sessions of the sport did not take', () => {
    const yoga = S('yoga', { kind: 'other', mins: 60 });
    const m = matchDay([yoga, zwift], [R()]);
    expect(m.get('zwift')).toBeTruthy();
    expect(m.get('yoga')).toBeUndefined();
    expect(matchDay([yoga], [R()]).get('yoga')).toBeTruthy(); // as before: without a session of the sport it counts
  });
  it('one session and one ride: as before', () => {
    expect(doneBy(zwift, [R()], [zwift])).toBeTruthy();
    expect(doneBy(zwift, [], [zwift])).toBeNull();
  });
});
