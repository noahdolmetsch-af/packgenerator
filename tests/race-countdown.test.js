// «Velo-Countdown» (Noah 27.10.2026): the steps before a race, their day and where they stand.
import { describe, it, expect } from 'vitest';
import { STEPS, stepsOf, dueOf, stateOf, summary } from '../src/lib/race/countdown-lib.js';

describe('the bike countdown', () => {
  it('shows the suggestions until you save your own list', () => {
    expect(stepsOf({}).map((s) => s.weeks)).toEqual(STEPS.map((s) => s.weeks));
    expect(stepsOf({}, (x) => `DE ${x}`)[0].text).toBe(`DE ${STEPS[0].text}`);
    const mine = [{ id: 'a', text: 'Own step', weeks: '4', done: true }];
    expect(stepsOf({ countdown: mine })).toEqual([{ id: 'a', text: 'Own step', weeks: 4, done: true }]);
    expect(stepsOf({ countdown: [] })).toEqual([]);
  });
  it('counts back whole weeks from the race day', () => {
    expect(dueOf('2027-05-04', 6)).toBe('2027-03-23');
    expect(dueOf('2027-05-04', 0)).toBe('2027-05-04');
    expect(dueOf('', 3)).toBeNull();
  });
  it('knows what is late, due now and later', () => {
    const race = '2027-05-04';
    expect(stateOf({ weeks: 6, done: false }, race, '2027-03-30')).toBe('late');
    expect(stateOf({ weeks: 5, done: false }, race, '2027-03-28')).toBe('now');
    expect(stateOf({ weeks: 3, done: false }, race, '2027-03-28')).toBe('later');
    expect(stateOf({ weeks: 6, done: true }, race, '2027-03-30')).toBe('done');
    expect(stateOf({ weeks: 6, done: false }, '', '2027-03-30')).toBe('open');
    const steps = [{ weeks: 6, done: true }, { weeks: 6, done: false }, { weeks: 5, done: false }, { weeks: 1, done: false }];
    expect(summary(steps, race, '2027-03-28')).toEqual({ done: 1, of: 4, late: 1, now: 1 });
  });
});
