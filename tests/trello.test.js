// Trello (Noah 19.10.2026 «1a 2a 3b 4a 5a», «1a 2a»): the merge of app and board (src/lib/trello.js) and the
// way back into the app data (src/lib/trello/client.svelte.js). Fictional lists and ids only.
import { describe, it, expect } from 'vitest';
import { reconcile, bindIds, opParts, withIds, dueInTrello, TODOS_KEY } from '../src/lib/trello.js';
import { unitsOf, appOf } from '../src/lib/trello/client.svelte.js';

const B = 'b'.repeat(24);
const L1 = '1'.repeat(24);
const L2 = '2'.repeat(24);
const C1 = 'c1'.padEnd(24, '0');
const C2 = 'c2'.padEnd(24, '0');
const C3 = 'c3'.padEnd(24, '0');
let n = 0;
const ids = { newKey: () => `ls-new${++n}`, newItemId: () => `td-new${++n}` };
const board = (lists = [], cards = []) => ({ board: { id: B }, lists, cards });
const unit = (over = {}) => ({ key: 'ls-a', kind: 'list', name: 'Einkauf', sync: true, link: null, items: [], ...over });
const item = (id, text, over = {}) => ({ id, text, due: null, done: false, t: null, ...over });
const snapT = (id, name, due = null, done = false) => ({ id, name, due, done });

describe('Trello: a list goes to Trello for the first time', () => {
  it('makes the list and a card per item, waiting for their ids', () => {
    const r = reconcile([unit({ items: [item('i1', 'Brot', { due: '2026-10-20' })] })], board(), {}, ids);
    expect(r.ops).toEqual([
      { op: 'list-new', ref: 'L:ls-a', name: 'Einkauf' },
      { op: 'card-new', ref: 'C:i1', listRef: 'L:ls-a', name: 'Brot', due: '2026-10-20', done: false },
    ]);
    const b = bindIds(r.units, [{ ref: 'L:ls-a', id: L1 }, { ref: 'C:i1', id: C1 }], r.reg);
    expect(b.units[0].link).toEqual({ id: L1, name: 'Einkauf', seen: [C1] });
    expect(b.units[0].items[0].t.id).toBe(C1);
    expect(b.reg.seenLists).toEqual([L1]);
  });

  it('a list not sent to Trello stays untouched', () => {
    const r = reconcile([unit({ sync: false, items: [item('i1', 'Brot')] })], board(), {}, ids);
    expect(r.ops).toEqual([]);
    expect(r.units[0].link).toBeNull();
  });
});

describe('Trello: both directions', () => {
  const linked = (items, seen = items.map((x) => x.t?.id).filter(Boolean)) => unit({ link: { id: L1, name: 'Einkauf', seen }, items });

  it('a field changed in Trello wins, a field changed in the app goes to Trello', () => {
    const u = linked([item('i1', 'Brot neu', { t: snapT(C1, 'Brot') }), item('i2', 'Milch', { t: snapT(C2, 'Milch') })]);
    const r = reconcile([u], board([{ id: L1, name: 'Einkauf' }], [{ id: C1, list: L1, name: 'Brot', due: null, done: false }, { id: C2, list: L1, name: 'Milch', due: '2026-10-21', done: true }]), { boardId: B, seenLists: [L1] }, ids);
    expect(r.ops).toEqual([{ op: 'card-set', id: C1, name: 'Brot neu' }]);
    expect(r.units[0].items[1]).toMatchObject({ text: 'Milch', due: '2026-10-21', done: true });
  });

  it('a new card in Trello becomes an item; a card deleted in the app is archived', () => {
    const u = linked([item('i1', 'Brot', { t: snapT(C1, 'Brot') })], [C1, C2]);
    const r = reconcile([u], board([{ id: L1, name: 'Einkauf' }], [{ id: C1, list: L1, name: 'Brot', due: null, done: false }, { id: C2, list: L1, name: 'Butter', due: null, done: false }, { id: C3, list: L1, name: 'Käse', due: null, done: false }]), { boardId: B, seenLists: [L1] }, ids);
    expect(r.ops).toEqual([{ op: 'card-archive', id: C2 }]);
    expect(r.units[0].items.map((x) => x.text)).toEqual(['Brot', 'Käse']);
    expect(r.units[0].link.seen).toEqual([C1, C3]);
  });

  it('an item whose card is gone in Trello goes; a renamed Trello list renames the app list', () => {
    const u = linked([item('i1', 'Brot', { t: snapT(C1, 'Brot') })]);
    const r = reconcile([u], board([{ id: L1, name: 'Wocheneinkauf' }]), { boardId: B, seenLists: [L1] }, ids);
    expect(r.units[0].items).toEqual([]);
    expect(r.units[0].name).toBe('Wocheneinkauf');
    expect(r.ops).toEqual([]);
  });

  it('a list renamed in the app is renamed in Trello', () => {
    const u = { ...linked([]), name: 'Markt' };
    const r = reconcile([u], board([{ id: L1, name: 'Einkauf' }]), { boardId: B, seenLists: [L1] }, ids);
    expect(r.ops).toEqual([{ op: 'list-rename', id: L1, name: 'Markt' }]);
    expect(r.units[0].link.name).toBe('Markt');
  });

  it('a repeating to-do ticked in Trello moves on instead of being done', () => {
    const u = { ...linked([item('i1', 'Kette ölen', { due: '2026-10-19', repeat: { every: 'week' }, t: snapT(C1, 'Kette ölen', '2026-10-19') })]), kind: 'todos', key: TODOS_KEY };
    const onDone = (it) => ({ ...it, done: false, due: '2026-10-26', ticked: true });
    const r = reconcile([u], board([{ id: L1, name: 'To-dos' }], [{ id: C1, list: L1, name: 'Kette ölen', due: '2026-10-19', done: true }]), { boardId: B, seenLists: [L1] }, { ...ids, onDone });
    expect(r.ops).toEqual([{ op: 'card-set', id: C1, due: '2026-10-26', done: false }]);
    expect(r.units[0].items[0]).toMatchObject({ due: '2026-10-26', done: false, ticked: true });
  });
});

describe('Trello: lists', () => {
  it('a new Trello list becomes a new app list with its cards', () => {
    const r = reconcile([], board([{ id: L2, name: 'Ideen' }], [{ id: C1, list: L2, name: 'Zelt testen', due: null, done: false }]), { boardId: B, seenLists: [] }, ids);
    expect(r.units).toHaveLength(1);
    expect(r.units[0]).toMatchObject({ kind: 'list', name: 'Ideen', sync: true, link: { id: L2, seen: [C1] } });
    expect(r.units[0].items[0].text).toBe('Zelt testen');
    expect(r.reg.seenLists).toEqual([L2]);
  });

  it('a list archived in Trello becomes «app only» with all items', () => {
    const u = unit({ link: { id: L1, name: 'Einkauf', seen: [C1] }, items: [item('i1', 'Brot', { t: snapT(C1, 'Brot') })] });
    const r = reconcile([u], board(), { boardId: B, seenLists: [L1] }, ids);
    expect(r.units[0]).toMatchObject({ sync: false, link: null });
    expect(r.units[0].items[0]).toMatchObject({ text: 'Brot', t: null });
    expect(r.ops).toEqual([]);
  });

  it('«app only» or deleted in the app archives the Trello list', () => {
    const off = unit({ sync: false, link: { id: L1, name: 'Einkauf', seen: [] } });
    const r = reconcile([off], board([{ id: L1, name: 'Einkauf' }, { id: L2, name: 'Weg' }]), { boardId: B, seenLists: [L1, L2] }, ids);
    expect(r.ops).toEqual([{ op: 'list-archive', id: L1 }, { op: 'list-archive', id: L2 }]);
    expect(r.units[0].link).toBeNull();
  });

  it('two devices never make the same list or card twice', () => {
    const u = unit({ items: [item('i1', 'Brot')] });
    const r = reconcile([u], board([{ id: L1, name: 'Einkauf' }], [{ id: C1, list: L1, name: 'Brot', due: null, done: false }]), { boardId: B, seenLists: [] }, ids);
    expect(r.ops).toEqual([]);
    expect(r.units).toHaveLength(1);
    expect(r.units[0].link.id).toBe(L1);
    expect(r.units[0].items[0].t.id).toBe(C1);
  });

  it('a new board (the old one deleted) sends everything again, nothing is lost in the app', () => {
    const u = unit({ link: { id: L1, name: 'Einkauf', seen: [C1] }, items: [item('i1', 'Brot', { t: snapT(C1, 'Brot') })] });
    const r = reconcile([u], board(), { boardId: 'x'.repeat(24), seenLists: [L1] }, ids);
    expect(r.ops.map((o) => o.op)).toEqual(['list-new', 'card-new']);
    expect(r.units[0].items[0].text).toBe('Brot');
  });
});

describe('Trello: helpers', () => {
  it('cuts the changes into parts; a later part gets the list made before', () => {
    const ops = [{ op: 'card-set', id: 'a' }, { op: 'list-new', ref: 'L:x' }, { op: 'card-new', listRef: 'L:x' }];
    const parts = opParts(ops, 2);
    expect(parts.map((p) => p.length)).toEqual([2, 1]);
    expect(withIds(parts[1], new Map([['L:x', L1]]))[0]).toMatchObject({ op: 'card-new', list: L1, listRef: undefined });
  });

  it('due items of Trello lists for «Heute wichtig»', () => {
    const u = unit({ link: { id: L1, name: 'Einkauf', seen: [] }, items: [item('i1', 'A', { due: '2026-10-19' }), item('i2', 'B', { due: '2026-10-25' }), item('i3', 'C', { due: '2026-10-10', done: true })] });
    expect(dueInTrello([u, unit({ sync: false, items: [item('x', 'D', { due: '2026-10-01' })] })], '2026-10-19').map((x) => x.item.text)).toEqual(['A']);
  });
});

describe('Trello: into the app data', () => {
  it('to-dos and lists come back with their Trello ids; birthdays stay as they are', () => {
    const todos = [{ id: 't1', text: 'Velo putzen', due: null, doneAt: null, created: 'x' }, { id: 'b1', kind: 'birthday', text: 'Kim' }];
    const lists = [{ id: 'ls-a', name: 'Einkauf', check: true, pin: null, items: [{ id: 'i1', text: 'Brot', done: null, at: 'x' }], created: 'x', sync: 'trello' }];
    const prefs = { todos: { sync: true } };
    const units = unitsOf({ todos, lists, prefs }, 'To-dos');
    expect(units.map((u) => u.key)).toEqual([TODOS_KEY, 'ls-a']);
    expect(units[0].items.map((x) => x.id)).toEqual(['t1']);
    const r = reconcile(units, board(), {}, ids);
    const b = bindIds(r.units, [{ ref: 'L:todos', id: L2 }, { ref: 'C:t1', id: C2 }, { ref: 'L:ls-a', id: L1 }, { ref: 'C:i1', id: C1 }], r.reg);
    const out = appOf(b.units, { todos, lists }, { now: 'NOW', today: '2026-10-19' });
    expect(out.todos.find((x) => x.id === 't1').trello.id).toBe(C2);
    expect(out.todos.find((x) => x.id === 'b1')).toEqual(todos[1]);
    expect(out.lists[0]).toMatchObject({ id: 'ls-a', sync: 'trello', trello: { id: L1 } });
    expect(out.lists[0].items[0].trello.id).toBe(C1);
    expect(out.todosPrefs).toMatchObject({ sync: true, link: { id: L2 } });
  });

  it('a to-do ticked in Trello is done in the app; a new card becomes a to-do', () => {
    const todos = [{ id: 't1', text: 'Velo putzen', due: null, doneAt: null, created: 'x', trello: snapT(C1, 'Velo putzen') }];
    const prefs = { todos: { sync: true, link: { id: L1, name: 'To-dos', seen: [C1] } } };
    const units = unitsOf({ todos, lists: [], prefs }, 'To-dos');
    const r = reconcile(units, board([{ id: L1, name: 'To-dos' }], [{ id: C1, list: L1, name: 'Velo putzen', due: null, done: true }, { id: C2, list: L1, name: 'Licht prüfen', due: '2026-10-22', done: false }]), { boardId: B, seenLists: [L1] }, ids);
    const out = appOf(r.units, { todos, lists: [] }, { now: 'NOW' });
    expect(out.todos[0].doneAt).toBe('NOW');
    expect(out.todos[1]).toMatchObject({ text: 'Licht prüfen', due: '2026-10-22', trello: { id: C2 } });
  });
});
