import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { todoTargets, pickTarget, withTodo, appendTodo, sendTodo, checklistId } from '../src/lib/lernen/notiztodo.js';

const now = '2026-08-03T10:00:00.000Z';

describe('Notizen werden To-dos (#88)', () => {
  it('offers a new checklist, the own notes and Google Tasks lists', () => {
    const notes = [{ id: 'n1', status: 'kept', title: 'Velo-Werkstatt', at: now }, { id: 'n2', status: 'inbox', text: 'x' }];
    const t1 = todoTargets({ notes, prefs: { tasks: true, lists: [{ id: 'L1', title: 'Privat' }] } });
    expect(t1.map((x) => x.key)).toEqual(['checklist', 'note:n1', 'gtask:L1']);
    expect(todoTargets({ notes }).map((x) => x.key)).toEqual(['checklist', 'note:n1']);
    expect(pickTarget(t1, 'note:gone')).toBe('checklist');
    expect(pickTarget(t1, 'gtask:L1')).toBe('gtask:L1');
  });
  it('one checklist per trip, no double entries', () => {
    const a = withTodo(null, 'Kette ölen', { tripId: 't1', title: 'To-dos nach «Jura»', now });
    expect(a).toMatchObject({ id: checklistId('t1'), status: 'kept', title: 'To-dos nach «Jura»', checklist: [{ text: 'Kette ölen', done: false }] });
    const b = withTodo(a, 'Schlauch kaufen', { tripId: 't1', title: 'x', now });
    expect(b.checklist).toHaveLength(2);
    expect(withTodo(b, 'Kette ölen', { tripId: 't1', title: 'x', now })).toBe(b);
    expect(appendTodo({ id: 'n', checklist: [] }, ' Licht laden ', now).checklist).toEqual([{ text: 'Licht laden', done: false }]);
  });
  it('sends to the trip checklist, a note and Google Tasks', async () => {
    const db = createDb('test-notiztodo');
    await db.notes.put({ id: 'n1', status: 'kept', title: 'Einkauf', at: now });
    expect(await sendTodo('checklist', 'Kette ölen', { db, tripId: 't1', title: 'To-dos nach «Jura»', now })).toBe(true);
    expect((await db.notes.get('todo-t1')).checklist).toHaveLength(1);
    expect(await sendTodo('note:n1', 'Riegel', { db, tripId: 't1', title: '', now })).toBe(true);
    expect((await db.notes.get('n1')).checklist).toEqual([{ text: 'Riegel', done: false }]);
    expect(await sendTodo('note:nope', 'x', { db, tripId: 't1', title: '', now })).toBe(false);
    const sent = [];
    expect(await sendTodo('gtask:L1', 'Pumpe', { db, tripId: 't1', title: '', saveTask: async (v) => (sent.push(v), { task: {} }) })).toBe(true);
    expect(sent).toEqual([{ list: 'L1', title: 'Pumpe' }]);
    expect(await sendTodo('gtask:L1', 'Pumpe', { db, tripId: 't1', title: '', saveTask: async () => null })).toBe(false);
  });
});
