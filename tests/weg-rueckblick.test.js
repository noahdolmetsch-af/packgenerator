import { describe, it, expect } from 'vitest';
import { lookBack, sayDiff } from '../src/lib/weg/rueckblick.js';
import { setDone, applyAuto, stepOf } from '../src/lib/weg/weg.js';

const step = (o) => ({ id: o.id, type: 'own', title: o.id, offset: null, due: '', done: false, by: '', ...o });
const goal = (steps, start = '2026-05-15') => ({ id: 'g', title: 'Rennen im Mai', kind: 'race', start, steps });

describe('weg review planned against actual', () => {
  it('nothing before the start day is over, without a start, or without planned days', () => {
    expect(lookBack(goal([step({ id: 'a', due: '2026-05-01' })]), '2026-05-15')).toBeNull();
    expect(lookBack(goal([step({ id: 'a', due: '2026-05-01' })], ''), '2026-06-01')).toBeNull();
    expect(lookBack(goal([step({ id: 'a' })]), '2026-06-01')).toBeNull();
  });
  it('lists the steps with a planned day, earliest first, with the day difference', () => {
    const g = goal([
      step({ id: 'late', due: '2026-02-15', done: true, doneAt: '2026-02-20' }),
      step({ id: 'early', due: '2026-03-14', done: true, doneAt: '2026-03-10' }),
      step({ id: 'miss', due: '2026-05-02' }),
      step({ id: 'old', offset: 100, done: true }), // 2026-02-04: ticked before doneAt existed
      step({ id: 'exact', due: '2026-05-08', done: true, doneAt: '2026-05-08' }),
      step({ id: 'free' }),
    ]);
    const rows = lookBack(g, '2026-06-01');
    expect(rows.map((r) => r.id)).toEqual(['old', 'late', 'early', 'miss', 'exact']);
    expect(rows.find((r) => r.id === 'late')).toMatchObject({ state: 'day', diff: 5 });
    expect(rows.find((r) => r.id === 'early')).toMatchObject({ state: 'day', diff: -4 });
    expect(rows.find((r) => r.id === 'exact')).toMatchObject({ state: 'day', diff: 0 });
    expect(rows.find((r) => r.id === 'miss')).toMatchObject({ state: 'missed', actual: '' });
    expect(rows.find((r) => r.id === 'old')).toMatchObject({ state: 'done', diff: null });
  });
  it('sayDiff names the direction', () => {
    expect(sayDiff(null)).toBeNull();
    expect(sayDiff(0).n).toBe(0);
    expect(sayDiff(5)).toMatchObject({ one: '+{n} day', n: 5 });
    expect(sayDiff(-4)).toMatchObject({ many: '−{n} days', n: 4 });
  });
  it('ticking keeps the day, unticking takes it back, the app writes the day too', () => {
    const g = goal([step({ id: 'a', due: '2026-05-01' })]);
    const on = setDone(g, 'a', true, '2026-05-03');
    expect(on.steps[0]).toMatchObject({ done: true, doneAt: '2026-05-03', by: 'user' });
    expect(setDone(on, 'a', false, '2026-05-04').steps[0]).toMatchObject({ done: false, doneAt: '' });
    expect(stepOf({ id: 'a', done: false, doneAt: '2026-05-03' }).doneAt).toBe('');
    expect(stepOf({ id: 'a', done: true, doneAt: 'x' }).doneAt).toBe('');
    const auto = applyAuto(g, [{ type: 'own', auto: () => true }], { today: '2026-05-06' });
    expect(auto.steps[0]).toMatchObject({ done: true, by: 'auto', doneAt: '2026-05-06' });
  });
});
