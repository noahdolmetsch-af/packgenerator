// «Deine Gewohnheiten» on top of Heute (Noah 27.10.2026 «1a 2a und b 3b»): up to three chosen habits, meditation by default
import { describe, it, expect } from 'vitest';
import { normHabits, habitsOf, addHabit, removeHabit, moveHabit, lastSeven, MAX_HABITS } from '../src/lib/home/habits.js';
import { addDays } from '../src/lib/routine.js';
import { isMedAct } from '../src/lib/flow/hobby/medstart.js';

const acts = [{ id: 'test_data_gtp_run' }, { id: 'meditation', page: 'meditation' }, { id: 'test_data_gtp_stretch' }];
const items = [{ id: 'r-1', name: 'test_data_gtp_ Wasser' }];

describe('habits on top of Today', () => {
  it('nothing chosen yet: the meditation activity, as before; none without one', () => {
    expect(habitsOf(null, acts, items, isMedAct)).toEqual([{ kind: 'act', id: 'meditation' }]);
    expect(habitsOf(undefined, [{ id: 'x' }], items, isMedAct)).toEqual([]);
  });
  it('chosen ones in their order; deleted ones drop out; an empty choice stays empty', () => {
    const v = [{ kind: 'routine', id: 'r-1' }, { kind: 'act', id: 'test_data_gtp_stretch' }, { kind: 'act', id: 'gone' }];
    expect(habitsOf(v, acts, items, isMedAct)).toEqual([{ kind: 'routine', id: 'r-1' }, { kind: 'act', id: 'test_data_gtp_stretch' }]);
    expect(habitsOf([], acts, items, isMedAct)).toEqual([]);
  });
  it('at most three, no doubles, unknown kinds go', () => {
    const v = [{ kind: 'act', id: 'a' }, { kind: 'act', id: 'a' }, { kind: 'x', id: 'b' }, { kind: 'act', id: 'c' }, { kind: 'routine', id: 'd' }, { kind: 'act', id: 'e' }];
    expect(normHabits(v)).toEqual([{ kind: 'act', id: 'a' }, { kind: 'act', id: 'c' }, { kind: 'routine', id: 'd' }]);
    expect(normHabits('x')).toBeNull();
  });
  it('add, remove and move', () => {
    let l = addHabit(null, { kind: 'act', id: 'a' });
    l = addHabit(l, { kind: 'routine', id: 'b' });
    l = addHabit(l, { kind: 'act', id: 'a' });
    expect(l).toHaveLength(2);
    l = addHabit(addHabit(l, { kind: 'act', id: 'c' }), { kind: 'act', id: 'd' });
    expect(l).toHaveLength(MAX_HABITS);
    expect(moveHabit(l, 2, 0).map((r) => r.id)).toEqual(['c', 'a', 'b']);
    expect(removeHabit(l, { kind: 'routine', id: 'b' }).map((r) => r.id)).toEqual(['a', 'c']);
  });
  it('the last seven days, oldest first', () => {
    const w = lastSeven(new Set(['2026-10-27', '2026-10-21']), '2026-10-27', addDays);
    expect(w.map((g) => g.day)).toEqual(['2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27']);
    expect(w.filter((g) => g.on).length).toBe(2);
  });
});
