import { describe, it, expect } from 'vitest';
import { WAIT_ON, waitOf, newWait, stillWaiting, waitingRows, notWaiting, endList, reopenList, isEnded, endGoal, reopenGoal, goalEnd, bufferItems } from '../src/lib/stand/stand.js';
import { newTodo, groupTodos } from '../src/lib/merken.js';
import { pinnedTo } from '../src/lib/ownlists.js';

const today = '2026-10-25';

describe('Waiting to-dos', () => {
  it('keep the wait when made and leave the date groups', () => {
    const td = newTodo({ text: 'test_data_gtp_ Offerte', due: '2026-10-20', wait: newWait('answer', today, 'Werkstatt') }, { id: 'a' });
    expect(td.wait).toEqual({ on: 'answer', note: 'Werkstatt', check: '2026-10-28' });
    const other = newTodo({ text: 'test_data_gtp_ Kette', due: '2026-10-20' }, { id: 'b' });
    expect(groupTodos(notWaiting([td, other]), today).late.map((x) => x.id)).toEqual(['b']);
  });
  it('sort those to check now first, and ignore broken waits', () => {
    const a = { id: 'a', text: 'A', wait: { on: 'part', check: '2026-10-30' } };
    const b = { id: 'b', text: 'B', wait: { on: 'person', check: '2026-10-24' } };
    const c = { id: 'c', text: 'C', wait: { on: 'nonsense' } };
    const d = { id: 'd', text: 'D', wait: { on: 'date', check: '2026-10-26' }, doneAt: 'x' };
    const rows = waitingRows([a, b, c, d], today);
    expect(rows.map((r) => [r.todo.id, r.now])).toEqual([['b', true], ['a', false]]);
    expect(waitOf(c)).toBe(null);
    expect(stillWaiting(rows[0].wait, today).check).toBe('2026-10-28');
    expect(WAIT_ON.map((w) => w.key)).toEqual(['answer', 'part', 'person', 'date']);
  });
});

describe('Lists and goals can end', () => {
  it('an ended list is no longer pinned, and opens again', () => {
    const l = { id: 'l', name: 'test_data_gtp_ Liste', check: true, pin: { place: 'gear' }, items: [{ id: 'p', text: 'x', done: null }] };
    const e = endList(l, 'away', 'now');
    expect(isEnded(e)).toBe(true);
    expect(e.items).toEqual(l.items);
    expect(pinnedTo([e], 'gear')).toEqual([]);
    expect(isEnded(reopenList(e))).toBe(false);
    expect(endList(l, 'nonsense')).toBe(l);
  });
  it('a goal ends as reached, changed or let go, with a reason', () => {
    const g = { id: 'g', title: 'test_data_gtp_ Ziel', steps: [], checks: [] };
    const e = endGoal(g, 'letgo', ' passt nicht mehr ', 'now');
    expect(e).toMatchObject({ done: true, end: { how: 'letgo', why: 'passt nicht mehr', at: 'now' } });
    expect(goalEnd(e).how).toBe('letgo');
    expect(goalEnd({ ...g, done: true }).how).toBe('reached');
    expect(goalEnd(reopenGoal(e))).toBe(null);
  });
});

import { CANCEL_STEPS, cancelOf, cancelState, cancelStep, OPENED, setOpened, wetRests } from '../src/lib/stand/stand.js';
import { newContract, remindDayOf } from '../src/lib/alltag.js';
import { buyReason } from '../src/lib/supplies.js';

describe('Part 2: honest state', () => {
  it('a cancellation has three steps; only «confirmed» stops the contract', () => {
    let c = newContract({ name: 'test_data_gtp_ Abo', end: '2027-03-31', notice: 1, renew: 12 }, 'c');
    c = cancelStep(c, 'sent', today);
    expect(cancelState(c)).toBe('sent');
    expect(c.stopped).toBe(false);
    expect(remindDayOf(c, today)).not.toBe(null);
    c = cancelStep(c, 'confirmed', '2026-10-30');
    expect(c).toMatchObject({ stopped: true, cancel: { sent: today, confirmed: '2026-10-30' } });
    expect(remindDayOf(c, today)).toBe(null);
    expect(newContract({ ...c, cancel: { ...c.cancel, proof: ' R 123 ' } }, 'c').cancel.proof).toBe('R 123');
    c = cancelStep(c, 'confirmed', today);
    expect(c.stopped).toBe(false);
    expect(cancelOf({ sent: 'x' })).toBe(null);
    expect(CANCEL_STEPS.map((s) => s.key)).toEqual(['drafted', 'sent', 'confirmed']);
  });
  it('an opened pack with little left goes on the shopping list', () => {
    const gel = { id: 'g', name: 'test_data_gtp_ Gel', category: 'food', stock: 1, minStock: 1 };
    expect(buyReason(gel, today)).toBe(null);
    expect(buyReason(setOpened(gel, 'little'), today)).toBe('low');
    expect(buyReason(setOpened(gel, 'much'), today)).toBe(null);
    expect(setOpened(setOpened(gel, 'little'), '')).not.toHaveProperty('opened');
    expect(OPENED[0].key).toBe('');
  });
  it('the wet chain hint rests for today only', () => {
    expect(wetRests({ b: { day: today, how: 'later' } }, 'b', today)).toBe(true);
    expect(wetRests({ b: { day: '2026-10-24', how: 'later' } }, 'b', today)).toBe(false);
  });
});

describe('Buffers around a date (UC-228-I1)', () => {
  const date = { kind: 'date', title: 'test_data_gtp_ Zahnarzt', day: '2026-10-27', time: '09:00' };
  it('make nothing when no time is chosen', () => {
    expect(bufferItems(date, { before: 0, after: 0 })).toEqual([]);
    expect(bufferItems({ ...date, kind: 'todo' }, { before: 30 })).toEqual([]);
  });
  it('put the time before at start minus the minutes, the time after without a time', () => {
    expect(bufferItems(date, { before: 30, after: 15 })).toEqual([
      { kind: 'date', title: 'Before: test_data_gtp_ Zahnarzt (30 min)', day: '2026-10-27', time: '08:30' },
      { kind: 'date', title: 'After: test_data_gtp_ Zahnarzt (15 min)', day: '2026-10-27', time: '' },
    ]);
  });
  it('leave the time out when the date has none or it would fall before midnight', () => {
    expect(bufferItems({ ...date, time: '' }, { before: 60 })[0].time).toBe('');
    expect(bufferItems({ ...date, time: '00:30' }, { before: 60 })[0].time).toBe('');
  });
});
