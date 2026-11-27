// «Ein Wochenziel statt zwei» (Noah 26.11.2026 «ja»): the hours of the weekly plan count when a plan is saved, else those of the training
// goal while its day has not passed. Fictional data only.
import { describe, it, expect } from 'vitest';
import { weekHours, defaultsFor } from '../src/lib/training/wochenplan.js';
import { hoursGoal } from '../src/lib/flow/geschafft.js';

const DAY = '2026-11-26'; // winter
const plan = (hours) => ({ v: 1, winter: { ...defaultsFor(false), hours }, summer: defaultsFor(true) });

describe('one hours goal for a week', () => {
  it('takes the hours of the weekly plan when one is saved, also when a training goal says something else', () => {
    expect(weekHours({ goal: { hours: 10, until: '2027-03-01' }, weekplan: plan(15) }, DAY)).toBe(15);
  });
  it('takes the hours of the training goal while its day has not passed and no weekly plan is saved', () => {
    expect(weekHours({ goal: { hours: 10, until: '2026-12-31' }, weekplan: null }, DAY)).toBe(10);
    expect(weekHours({ goal: { hours: 10 }, weekplan: null }, DAY)).toBe(10); // no day: it does not end
    expect(weekHours({ goal: { hours: 10, until: DAY }, weekplan: null }, DAY)).toBe(10); // the day itself still counts
  });
  it('lets a goal whose day has passed stop counting (it stays stored, nothing is deleted)', () => {
    const goal = { name: 'Old goal', hours: 10, base: 70, until: '2026-10-24' };
    expect(weekHours({ goal, weekplan: null }, DAY)).toBe(null);
    expect(weekHours({ goal, weekplan: plan(15) }, DAY)).toBe(15);
    expect(goal).toEqual({ name: 'Old goal', hours: 10, base: 70, until: '2026-10-24' });
  });
  it('knows no goal at all', () => {
    expect(weekHours({}, DAY)).toBe(null);
    expect(weekHours({ goal: { name: 'x' } }, DAY)).toBe(null);
    expect(weekHours({ goal: { hours: 99 } }, DAY)).toBe(null);
  });
  it('is the one Geschafft uses (a raw goal goes through goalOf)', () => {
    expect(hoursGoal({ goal: { hours: 10, until: '2026-10-24' }, weekplan: plan(15) }, DAY)).toBe(15);
    expect(hoursGoal({ goal: { hours: 10, until: '2026-10-24' }, weekplan: null }, DAY)).toBe(null);
    expect(hoursGoal({ goal: { hours: 8 }, weekplan: null }, DAY)).toBe(8);
  });
});
