import { describe, it, expect } from 'vitest';
import { tageszieleOf, newZiel, addAmount, undoAmount, standing, running, untick, missing, putZiel, removeZiel, handSum, UNITS, MAX_ZIELE, remindDays, okTime } from '../src/lib/tagesziel.js';

const mk = (over = {}) => newZiel({ today: '2026-11-22', name: 'Stretching', unit: 'min', goal: 10, days: 14, id: 'tz-1', ...over });

describe('daily goals (Challenges page)', () => {
  it('makes a new goal for a number of days or until the end of the year', () => {
    expect(mk()).toMatchObject({ unit: 'min', goal: 10, from: '2026-11-22', until: '2026-12-05', stopped: false, closed: false });
    expect(mk({ days: undefined }).until).toBe('2026-12-31');
    expect(mk({ until: '2026-11-30', days: undefined }).until).toBe('2026-11-30');
    expect(mk({ name: '  ' })).toBeNull();
  });
  it('takes the default goal of the unit and keeps the word only for a count', () => {
    expect(mk({ unit: 'steps', goal: undefined }).goal).toBe(UNITS.steps.goal);
    expect(mk({ unit: 'count', word: 'glasses' }).word).toBe('glasses');
    expect(mk({ unit: 'min', word: 'glasses' }).word).toBe('');
    expect(mk({ unit: 'bad' }).unit).toBe('min');
  });
  it('makes a stored list safe', () => {
    expect(tageszieleOf(null)).toEqual([]);
    expect(tageszieleOf([{ id: 'a', name: 'x', from: '2026-12-02', until: '2026-12-01' }, { name: 'no id', from: '2026-12-01', until: '2026-12-02' }])).toEqual([]);
    const l = tageszieleOf([{ id: 'a', name: 'Walk', unit: 'min', goal: 'x', from: '2026-11-22', until: '2026-12-31', hand: { '2026-11-22': [10, -5, 'a'], bad: [1] } }]);
    expect(l[0].goal).toBe(UNITS.min.goal);
    expect(l[0].hand).toEqual({ '2026-11-22': [10] });
    expect(tageszieleOf(Array.from({ length: 20 }, (_, i) => ({ id: `${i}`, name: 'n', from: '2026-11-22', until: '2026-12-31' })))).toHaveLength(MAX_ZIELE);
  });
  it('adds amounts, takes the last one back and never passes the day limit', () => {
    let c = addAmount(mk(), '2026-11-22', 5);
    c = addAmount(c, '2026-11-22', 10);
    expect(handSum(c, '2026-11-22')).toBe(15);
    expect(undoAmount(c, '2026-11-22').hand['2026-11-22']).toEqual([5]);
    expect(undoAmount(undoAmount(c, '2026-11-22'), '2026-11-22').hand['2026-11-22']).toBeUndefined();
    const big = addAmount(addAmount(mk(), '2026-11-22', 1400), '2026-11-22', 100);
    expect(handSum(big, '2026-11-22')).toBe(UNITS.min.max);
    expect(addAmount(mk(), '2026-11-22', 0)).toEqual(mk());
  });
  it('stands: day number, today, days reached and missed, days in a row', () => {
    let c = mk();
    c = addAmount(c, '2026-11-22', 10);
    c = addAmount(c, '2026-11-23', 4);
    c = addAmount(c, '2026-11-24', 10);
    const s = standing(c, '2026-11-24');
    expect(s).toMatchObject({ phase: 'running', dayNo: 3, total: 14, doneN: 2, missed: 1, streak: 1 });
    expect(s.today).toEqual({ total: 10, left: 0, done: true });
    expect(s.days.map((d) => d.state).slice(0, 4)).toEqual(['ok', 'miss', 'ok', 'todo']);
    // an open today does not break the days in a row
    const s2 = standing(addAmount(c, '2026-11-25', 3), '2026-11-25');
    expect(s2.today.left).toBe(7);
    expect(s2.streak).toBe(1);
    expect(standing(c, '2026-11-20').phase).toBe('soon');
    expect(standing(c, '2026-12-20').phase).toBe('over');
    expect(standing({ ...c, stopped: true }, '2026-11-24').phase).toBe('stopped');
    expect(standing(null, '2026-11-24')).toBeNull();
  });
  it('ticks off with the missing amount and takes the tick back', () => {
    let c = addAmount(mk(), '2026-11-22', 4);
    expect(missing(c, '2026-11-22')).toBe(6);
    c = addAmount(c, '2026-11-22', missing(c, '2026-11-22'));
    expect(standing(c, '2026-11-22').today.done).toBe(true);
    c = untick(c, '2026-11-22');
    expect(handSum(c, '2026-11-22')).toBe(4);
    expect(missing(mk(), '2026-11-22')).toBe(10);
  });
  it('lists the goals that run today and edits the list', () => {
    const a = mk();
    const b = mk({ id: 'tz-2', until: '2026-11-25', days: undefined });
    const list = [a, b, { ...mk({ id: 'tz-3' }), stopped: true }, { ...mk({ id: 'tz-4' }), closed: true }];
    expect(running(list, '2026-11-26').map((c) => c.id)).toEqual(['tz-1']);
    expect(putZiel([a], { ...a, goal: 20 })[0].goal).toBe(20);
    expect(putZiel([a], b)).toHaveLength(2);
    expect(removeZiel([a, b], 'tz-1')).toEqual([b]);
  });
  it('keeps a valid reminder time and drops a bad one', () => {
    expect(okTime('07:05')).toBe(true);
    expect(okTime('24:00')).toBe(false);
    expect(tageszieleOf([{ ...mk(), remindAt: '18:30' }])[0].remindAt).toBe('18:30');
    expect(tageszieleOf([{ ...mk(), remindAt: '8:30' }])[0].remindAt).toBe('');
    expect(mk().remindAt).toBe('');
  });
  it('lists the days of the phone reminder: running days that do not reach the goal yet', () => {
    const c = { ...mk({ days: 5 }), remindAt: '18:00', hand: { '2026-11-22': [10] } };
    expect(remindDays(c, '2026-11-22').map((d) => d.day)).toEqual(['2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26']);
    expect(remindDays({ ...c, remindAt: '' }, '2026-11-22')).toEqual([]);
    expect(remindDays({ ...c, stopped: true }, '2026-11-22')).toEqual([]);
    expect(remindDays(c, '2026-11-22', 1).map((d) => d.day)).toEqual(['2026-11-23']);
  });
});
