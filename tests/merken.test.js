import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { addDays, addMonth, newTodo, tick, groupTodos, doneTodos, isDue, kmLeft, remindDay } from '../src/lib/merken.js';
import { createDb } from '../src/lib/db.js';
import { addTodo, loadTodos, tickTodo, removeTodo } from '../src/lib/merkendb.js';

const NOW = '2026-10-14T08:00:00.000Z';
const TODAY = '2026-10-14';
const td = (over = {}) => ({ ...newTodo({ text: 'Ersatz-Schaltauge bestellen' }, { id: 'a', now: NOW }), ...over });

describe('calendar days', () => {
  it('adds days across a month and the clock change', () => {
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-10-14', -1)).toBe('2026-10-13');
  });
  it('keeps the 31st at the end of a shorter month', () => {
    expect(addMonth('2026-01-31')).toBe('2026-02-28');
    expect(addMonth('2026-10-14')).toBe('2026-11-14');
    expect(addMonth('2026-12-05')).toBe('2027-01-05');
  });
});

describe('a new to-do', () => {
  it('needs only the text', () => {
    expect(newTodo({ text: '  Kettenöl kaufen ' }, { id: 'x', now: NOW })).toEqual({ id: 'x', text: 'Kettenöl kaufen', due: null, remind: null, repeat: null, list: null, created: NOW, doneAt: null });
  });
  it('gives null for empty text and drops a reminder without a date', () => {
    expect(newTodo({ text: '  ' }, { id: 'x' })).toBeNull();
    expect(newTodo({ text: 'a', remind: { at: '08:00', before: 0 } }, { id: 'x' }).remind).toBeNull();
    expect(newTodo({ text: 'a', due: '17.10.' }, { id: 'x' }).due).toBeNull();
  });
});

describe('ticking off', () => {
  it('a plain to-do is done', () => {
    expect(tick(td(), { today: TODAY, now: NOW }).doneAt).toBe(NOW);
  });
  it('a weekly one moves to its next date after today', () => {
    const t = tick(td({ due: '2026-10-05', repeat: { every: 'week' } }), { today: TODAY, now: NOW });
    expect(t.doneAt).toBeNull();
    expect(t.due).toBe('2026-10-19');
  });
  it('a monthly one moves a month on', () => {
    expect(tick(td({ due: TODAY, repeat: { every: 'month' } }), { today: TODAY }).due).toBe('2026-11-14');
  });
  it('a km one waits for the next km from the counter', () => {
    const t = td({ repeat: { every: 'km', km: 300, bikeId: 'gravel', fromKm: 2000 } });
    expect(kmLeft(t, 2350)).toBe(-50);
    expect(isDue(t, TODAY, 2350)).toBe(true);
    const n = tick(t, { today: TODAY, bikeKm: 2350 });
    expect(n.doneAt).toBeNull();
    expect(kmLeft(n, 2350)).toBe(300);
  });
});

describe('groups of the Merken list', () => {
  it('sorts late, today, this week, later and without date', () => {
    const list = [
      td({ id: '1', due: '2026-10-13' }),
      td({ id: '2', due: TODAY }),
      td({ id: '3', due: '2026-10-17' }),
      td({ id: '4', due: '2026-11-30' }),
      td({ id: '5' }),
      td({ id: '6', due: TODAY, doneAt: NOW }),
      td({ id: '7', repeat: { every: 'km', km: 300, bikeId: 'g', fromKm: 0 } }),
    ];
    const g = groupTodos(list, TODAY, (id) => (id === 'g' ? 310 : null));
    expect(Object.fromEntries(Object.entries(g).map(([k, v]) => [k, v.map((t) => t.id)]))).toEqual({ late: ['1'], today: ['2', '7'], week: ['3'], later: ['4'], none: ['5'] });
    expect(doneTodos(list).map((t) => t.id)).toEqual(['6']);
  });
  it('shows a reminder on the day or one day before', () => {
    expect(remindDay(td({ due: '2026-10-17', remind: { at: '08:00', before: 1 } }))).toBe('2026-10-16');
    expect(remindDay(td({ due: '2026-10-17' }))).toBeNull();
  });
});

describe('stored in the settings', () => {
  it('adds, ticks and removes, each with Undo', async () => {
    const db = createDb(`merken-${Math.random()}`);
    const r = await addTodo(db, { text: 'Kettenöl kaufen', due: TODAY }, { now: NOW });
    expect((await loadTodos(db)).map((t) => t.text)).toEqual(['Kettenöl kaufen']);
    const undo = await tickTodo(db, r.todo.id, { today: TODAY, now: NOW });
    expect((await loadTodos(db))[0].doneAt).toBe(NOW);
    await undo();
    expect((await loadTodos(db))[0].doneAt).toBeNull();
    await removeTodo(db, r.todo.id);
    expect(await loadTodos(db)).toEqual([]);
    await r.undo();
    expect(await loadTodos(db)).toEqual([]);
    expect(await addTodo(db, { text: ' ' })).toBeNull();
  });
});
