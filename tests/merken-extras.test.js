import { describe, it, expect } from 'vitest';
import { newTodo, tick, groupTodos } from '../src/lib/merken.js';
import { addStep, toggleStep, removeStep, moveStep, renameStep, stepProgress, MAX_STEPS } from '../src/lib/merken/steps.js';
import { addLink, removeLink, todosFor, linkName } from '../src/lib/merken/links.js';
import { reorderGroup, postponeChanges } from '../src/lib/merken/order.js';

const today = '2026-11-05';
const mk = (text, id, extra = {}) => newTodo({ text, ...extra }, { id, now: `2026-11-0${id.length}T08:00:00Z` });

describe('Schritte (N2)', () => {
  it('adds, ticks, renames, moves and removes steps and counts them', () => {
    let td = mk('Alpen-Tour', 'a');
    expect(stepProgress(td)).toEqual({ done: 0, total: 0 });
    td = addStep(td, 'Route', { id: 's1' });
    td = addStep(td, 'Hotel', { id: 's2' });
    td = addStep(td, '  ', { id: 's3' });
    expect(td.steps.map((x) => x.id)).toEqual(['s1', 's2']);
    td = toggleStep(td, 's1', 'N');
    expect(stepProgress(td)).toEqual({ done: 1, total: 2 });
    td = renameStep(td, 's2', 'Hotel buchen');
    td = moveStep(td, 1, 0);
    expect(td.steps.map((x) => x.text)).toEqual(['Hotel buchen', 'Route']);
    expect(moveStep(td, 0, -1)).toBe(td);
    td = removeStep(td, 's1');
    expect(td.steps).toHaveLength(1);
  });
  it('stops at the maximum', () => {
    let td = mk('x', 'b');
    for (let i = 0; i < MAX_STEPS + 5; i++) td = addStep(td, `s${i}`, { id: `i${i}` });
    expect(td.steps).toHaveLength(MAX_STEPS);
  });
  it('a to-do that repeats starts its steps again', () => {
    let td = mk('Putzen', 'c', { due: today, repeat: { every: 'week' } });
    td = toggleStep(addStep(td, 'Kette', { id: 'k' }), 'k', 'N');
    const next = tick(td, { today });
    expect(next.steps[0].done).toBe(null);
    expect(next.doneAt).toBe(null);
  });
  it('newTodo keeps given steps and links', () => {
    const td = newTodo({ text: 'x', steps: [{ id: '1', text: 'a', done: null }], links: [{ kind: 'trip', ref: 't1', label: 'Alpen' }] }, { id: 'z' });
    expect(td.steps).toHaveLength(1);
    expect(td.links).toHaveLength(1);
  });
});

describe('Gehört zu (N3)', () => {
  it('adds a link once and removes it', () => {
    let td = mk('Kette ölen', 'd');
    td = addLink(td, { kind: 'bike', ref: 'b1', label: 'Gravel' });
    td = addLink(td, { kind: 'bike', ref: 'b1', label: 'Gravel' });
    td = addLink(td, { kind: 'nope', ref: 'x' });
    td = addLink(td, { kind: 'trip', ref: '' });
    expect(td.links).toHaveLength(1);
    expect(removeLink(td, 'bike', 'b1').links).toEqual([]);
  });
  it('finds the open to-dos of a trip, a bike or a note', () => {
    const a = addLink(mk('A', 'e'), { kind: 'trip', ref: 't1', label: 'Alpen' });
    const b = { ...addLink(mk('B', 'f'), { kind: 'trip', ref: 't1' }), doneAt: 'N' };
    const c = addLink(mk('C', 'g'), { kind: 'note', ref: 'n1' });
    expect(todosFor([a, b, c], 'trip', 't1').map((x) => x.text)).toEqual(['A']);
    expect(todosFor([a, b, c], 'note', 'n1').map((x) => x.text)).toEqual(['C']);
    expect(todosFor([a, b, c], 'bike', 'x')).toEqual([]);
  });
  it('names a link live, or by its label when the thing is gone', () => {
    const l = { kind: 'trip', ref: 't1', label: 'Alt' };
    expect(linkName(l, { trips: [{ id: 't1', title: 'Neu' }] })).toBe('Neu');
    expect(linkName(l, { trips: [] })).toBe('Alt');
  });
});

describe('Verschieben (F2)', () => {
  it('moves a to-do within its group and the group shows it that way', () => {
    const all = [mk('A', 'h', { due: today }), mk('B', 'ii', { due: today }), mk('C', 'jjj', { due: today })];
    expect(groupTodos(all, today).today.map((x) => x.text)).toEqual(['A', 'B', 'C']);
    const moved = reorderGroup(all, ['h', 'ii', 'jjj'], 2, 0);
    expect(groupTodos(moved, today).today.map((x) => x.text)).toEqual(['C', 'A', 'B']);
    expect(reorderGroup(all, ['h', 'ii', 'jjj'], 0, -1)).toBe(all);
  });
  it('a to-do pushed to tomorrow loses its hand-made place', () => {
    const td = { ...mk('A', 'k', { due: today, remind: { at: '18:00', before: 0 } }), pos: 10 };
    expect(postponeChanges(td, today)).toEqual({ due: '2026-11-06', remind: { at: '18:00', before: 0 }, pos: null });
  });
});
