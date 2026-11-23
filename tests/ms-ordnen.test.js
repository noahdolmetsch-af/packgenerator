import { describe, it, expect } from 'vitest';
import { actNick, runningWeek } from '../src/lib/flow/hobby/words.js';

// «Meilensteine ordnen» (Noah 23.11.2026 «ja»)
describe('names and the running week on Meilensteine', () => {
  it('a playful name is small after the real one; none, or the same word, gives nothing', () => {
    expect(actNick({ id: 'bike', name: 'Cycling', nameDe: 'Velo', nick: 'Pedal joy', nickDe: 'Pedal-Glück' })).toMatch(/Pedal/);
    expect(actNick({ id: 'run', name: 'Running', nameDe: 'Laufen' })).toBe('');
    expect(actNick(null)).toBe('');
  });
  it('weekly milestones that stand at 0 say the week is running; others keep their numbers', () => {
    expect(runningWeek({ value: 0, m: { id: 'x.wholeWeek' } })).toBe(true);
    expect(runningWeek({ value: 0, m: { id: 'tennis.weeks' } })).toBe(true);
    expect(runningWeek({ value: 0, m: { id: 'd.planRuns' } })).toBe(true);
    expect(runningWeek({ value: 2, m: { id: 'x.wholeWeek' } })).toBe(false);
    expect(runningWeek({ value: 0, m: { id: 'tennis.sessions' } })).toBe(false);
    expect(runningWeek({ value: 0, done: true, m: { id: 'x.wholeWeek' } })).toBe(false);
    expect(runningWeek(null)).toBe(false);
  });
});
