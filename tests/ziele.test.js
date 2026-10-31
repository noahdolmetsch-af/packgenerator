import { describe, it, expect } from 'vitest';
import { goalsOf, newGoal, editGoal, progressOf, goalState, stepGoals, daysLeft, presets, sortGoals, monthEnd, cantonOf } from '../src/lib/neuland/ziele.js';

const items = [
  { id: 'm1', name: 'A', kt: 'ZH' },
  { id: 'm2', name: 'B', kt: 'ZH' },
  { id: 'm3', name: 'C', kt: 'BE' },
  { id: 'l1', name: 'See', region: 'ZH' },
];
const visited = new Map([
  ['m1', { day: '2026-10-02' }],
  ['m2', { day: '2026-11-03' }],
  ['l1', { day: '2025-06-01' }],
]);

describe('Neuland challenges with an end (N5)', () => {
  it('cleans stored goals and makes new ones', () => {
    expect(goalsOf([null, { id: 'x' }, { id: 'g', cid: 'lakes', mode: 'all', kt: 'XX', from: '2026-10-01', until: '2026-12-31', times: 0 }])).toEqual([
      { id: 'g', cid: 'lakes', mode: 'all', times: 1, kt: null, from: '2026-10-01', until: '2026-12-31', name: '', doneOn: null },
    ]);
    const g = newGoal({ cid: 'municipalities', times: 5, until: '2026-01-01', today: '2026-10-27', id: 'n' });
    expect(g).toMatchObject({ id: 'n', mode: 'count', times: 5, from: '2026-10-27', until: '2026-10-31' });
    expect(monthEnd('2026-02-10')).toBe('2026-02-28');
  });

  it('counts new ones in the window and all of a canton', () => {
    const count = { mode: 'count', times: 2, from: '2026-10-01', until: '2026-10-31' };
    expect(progressOf(count, items, visited)).toMatchObject({ have: 1, need: 2, left: 1, done: false, ids: ['m1'] });
    const all = { mode: 'all', kt: 'ZH', from: '2026-10-01', until: '2026-12-31' };
    expect(progressOf(all, items, visited)).toMatchObject({ have: 3, need: 3, done: true });
    expect(cantonOf(items[3])).toBe('ZH');
    expect(progressOf({ ...all, kt: null, until: '2026-10-31' }, items, visited)).toMatchObject({ have: 2, need: 4, done: false });
  });

  it('states, steps, days left and order', () => {
    const g = { id: 'a', until: '2026-10-31', doneOn: null };
    expect(goalState(g, { done: false }, '2026-10-27')).toBe('running');
    expect(goalState(g, { done: false }, '2026-11-01')).toBe('over');
    expect(goalState(g, { done: true }, '2026-10-27')).toBe('done');
    expect(daysLeft(g, '2026-10-27')).toBe(4);
    const { list, reached } = stepGoals([g, { id: 'b', doneOn: '2026-10-01' }], new Map([['a', { done: true }], ['b', { done: true }]]), '2026-10-27');
    expect(reached.map((x) => x.id)).toEqual(['a']);
    expect(list[0].doneOn).toBe('2026-10-27');
    expect(list[1].doneOn).toBe('2026-10-01');
    const order = sortGoals(
      [{ id: 'o', until: '2026-10-01' }, { id: 'd', until: '2026-12-01', doneOn: '2026-10-20' }, { id: 'r2', until: '2026-12-31' }, { id: 'r1', until: '2026-11-30' }],
      new Map([['o', 'over'], ['d', 'done'], ['r1', 'running'], ['r2', 'running']]),
    );
    expect(order.map((x) => x.id)).toEqual(['r1', 'r2', 'd', 'o']);
  });

  it('editing keeps the start and a reached day unless what it asks for changes', () => {
    const list = goalsOf([{ id: 'g', cid: 'lakes', mode: 'count', times: 3, from: '2026-10-01', until: '2026-12-31', doneOn: '2026-10-20' }]);
    expect(editGoal(list, 'g', { until: '2027-01-31', name: 'Seen' }, '2026-10-27')[0]).toMatchObject({ from: '2026-10-01', doneOn: '2026-10-20', name: 'Seen' });
    expect(editGoal(list, 'g', { times: 4 }, '2026-10-27')[0]).toMatchObject({ from: '2026-10-01', doneOn: null, times: 4 });
    expect(editGoal(list, 'g', { cid: 'passes' }, '2026-10-27')[0]).toMatchObject({ from: '2026-10-27', doneOn: null });
  });

  it('offers three ready goals with the home canton', () => {
    const p = presets('2026-10-27', 'BE');
    expect(p.map((x) => x.key)).toEqual(['muni', 'lakes', 'passes']);
    expect(p[0].until).toBe('2026-10-31');
    expect(p[1]).toMatchObject({ kt: 'BE', until: '2026-12-31', mode: 'all' });
    expect(presets('2026-10-27', 'nope')[1].kt).toBe('ZH');
  });
});
