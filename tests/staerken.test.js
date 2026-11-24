// «Rundgang der Stärken» (Noah 23.11.2026 «1-5a»): four stations, each a question card and a lit step
import { describe, it, expect } from 'vitest';
import DE from '../src/lib/i18n/de/index.js';
import { TOURS, TOUR_NAMES, stepCount, stepNo, skipRun, nextRun, backRun, stepAt } from '../src/lib/tour.js';

const S = TOURS.staerken;
describe('Rundgang der Stärken', () => {
  it('has four stations of a question and a lit step, and an end card', () => {
    expect(stepCount('staerken')).toBe(4);
    for (const n of [1, 2, 3, 4]) {
      const own = S.filter((s) => s.station === n);
      expect(own.map((s) => !!s.ask), `station ${n}`).toEqual([true, false]);
      expect(own[0].target).toEqual([]);
      expect(own[1].target.length).toBeGreaterThan(0);
    }
    expect(S.at(-1).end).toBe(true);
  });
  it('every text has its German version', () => {
    expect(DE[TOUR_NAMES.staerken]).toBeTruthy();
    for (const s of S) {
      expect(DE[s.title] ?? DE[s.title.replace(/\|[a-z]+$/, '')], s.title).toBeTruthy();
      expect(DE[s.text], s.text).toBeTruthy();
    }
  });
  it('«Station n of 4» counts stations, not steps', () => {
    expect(S.map((_, i) => stepNo('staerken', i)).slice(0, 8)).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
    expect(stepNo('app', 2)).toBe(3);
    expect(stepCount('app')).toBe(6);
  });
  it('«Skip» goes to the next station, the last one to the end card; «Show me» is «Next»', () => {
    const at = (step) => ({ id: 'staerken', step, play: false });
    expect(skipRun(at(0)).step).toBe(2);
    expect(skipRun(at(2)).step).toBe(4);
    expect(stepAt('staerken', skipRun(at(6)).step).end).toBe(true);
    expect(nextRun(at(0)).step).toBe(1);
    expect(backRun(at(1)).step).toBe(0);
    expect(skipRun(null)).toBeNull();
  });
});
