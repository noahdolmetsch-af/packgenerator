import { describe, it, expect } from 'vitest';
import { zusammenhaenge, compare, sureOf, MIN_TIMES } from '../src/lib/flow/zusammenhang.js';

const shift = (d, n) => {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};
const TODAY = '2026-11-22';
const acts = [{ id: 'sauna', name: 'Sauna', ring: 'rest' }, { id: 'ride', name: 'Ride', ring: 'move' }];
const night = (date, deepMin, asleepMin = 420) => ({ date, sleep: { deepMin, asleepMin } });
/** `n` sauna days spread over the past (every 2nd day), the night after each with deep sleep `on`, the others `off` (+/- 1 to give a spread) */
function world(n, on, off) {
  const log = [];
  const health = [];
  const ticked = new Set();
  for (let i = 0; i < n; i++) {
    const d = shift(TODAY, -3 - 2 * i);
    ticked.add(d);
    log.push({ id: `s${i}`, actId: 'sauna', day: d });
  }
  for (let i = 0; i < 120; i++) {
    const d = shift(TODAY, -i);
    const prev = shift(d, -1);
    health.push(night(d, (ticked.has(prev) ? on : off) + (i % 3) - 1));
  }
  return { log, health, acts, feel: [], today: TODAY };
}

describe('Zusammenhänge', () => {
  it('under 20 times it only counts: «noch N»', () => {
    const r = zusammenhaenge(world(12, 90, 60));
    expect(r.rituals).toEqual([{ actId: 'sauna', kind: 'wait', n: 12, left: MIN_TIMES - 12 }]);
  });

  it('from 20 times it says what it found, with how sure and the numbers', () => {
    const r = zusammenhaenge(world(24, 90, 60));
    const x = r.rituals[0];
    expect(x).toMatchObject({ actId: 'sauna', kind: 'done', on: 24, mOn: 90, mOff: 60, diff: 30 });
    expect(x.sure).toBe('clear');
    expect(x.off).toBeGreaterThanOrEqual(5);
  });

  it('no real difference: unsure, never a claim', () => {
    const r = zusammenhaenge(world(24, 70, 70));
    expect(r.rituals[0].kind).toBe('done');
    expect(r.rituals[0].sure).toBe('unsure');
  });

  it('movement is no ritual; ticks of trip days do not count', () => {
    const w = world(24, 90, 60);
    w.log.push({ id: 'r', actId: 'ride', day: shift(TODAY, -2) });
    w.log = w.log.map((e) => (e.id === 's0' ? { ...e, via: 'trip' } : e));
    const r = zusammenhaenge(w);
    expect(r.rituals.map((x) => x.actId)).toEqual(['sauna']);
    expect(r.rituals[0].on).toBe(23);
  });

  it('the felt sleep against the watch: wait, then done', () => {
    const health = Array.from({ length: 30 }, (_, i) => night(shift(TODAY, -i), 60, i % 2 ? 450 : 380));
    const few = Array.from({ length: 8 }, (_, i) => ({ day: shift(TODAY, -i), value: i % 2 ? 8 : 4 }));
    expect(zusammenhaenge({ health, log: [], acts, feel: few, today: TODAY }).feel).toEqual({ kind: 'wait', n: 8, left: MIN_TIMES - 8 });
    const many = Array.from({ length: 30 }, (_, i) => ({ day: shift(TODAY, -i), value: i % 2 ? 8 : 4 }));
    const f = zusammenhaenge({ health, log: [], acts, feel: many, today: TODAY }).feel;
    expect(f).toMatchObject({ kind: 'done', mOn: 450, mOff: 380, diff: 70 });
    expect(f.sure).toBe('clear');
  });

  it('no feeling answers: no line', () => {
    expect(zusammenhaenge({ health: [], log: [], acts, feel: [], today: TODAY })).toEqual({ rituals: [], feel: null });
  });

  it('the words of the sureness and the arithmetic', () => {
    expect(sureOf(1.9)).toBe('unsure');
    expect(sureOf(-2.1)).toBe('probably');
    expect(sureOf(2.6)).toBe('clear');
    expect(compare([10, 12, 11, 13], [5, 6, 7, 5])).toMatchObject({ on: 4, off: 4, mOn: 12, mOff: 6, diff: 6 });
    expect(compare([5, 5], [5, 5]).t).toBe(0);
  });
});
