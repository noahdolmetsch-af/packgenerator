// Mini-Tools «Fair auslosen» (Noah 28.10.2026, idea 9): fair picks, orders and groups. Fictional data only.
import { describe, it, expect } from 'vitest';
import { newDraw, drawNow, withEntry, countsOf, makeGroups, resultText, namesOf } from '../src/lib/mini/los.js';

// a fixed random function
const seq = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const T = (s, v = {}) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k]));
const people = ['A', 'B', 'C', 'D'].map((name) => ({ name }));

describe('fair draw', () => {
  it('everybody cooks once before anybody cooks twice', () => {
    let d = newDraw({ title: 'Wer kocht?', mode: 'one', people });
    const rnd = seq(7);
    const picked = [];
    for (let i = 0; i < 8; i++) {
      const h = drawNow(d, undefined, rnd, `2026-11-0${(i % 9) + 1}T08:00:00Z`);
      picked.push(h.pick[0]);
      d = withEntry(d, h);
    }
    expect(new Set(picked.slice(0, 4)).size).toBe(4);
    expect(new Set(picked.slice(4, 8)).size).toBe(4);
    expect(Object.values(countsOf(d))).toEqual([2, 2, 2, 2]);
  });
  it('an order puts the ones who led least in front', () => {
    let d = newDraw({ title: 'Vorne im Wind', mode: 'order', people });
    d = withEntry(d, { id: 'x', at: 'x', order: ['p1', 'p2', 'p3', 'p4'] });
    const h = drawNow(d, undefined, seq(3));
    expect(h.order).toHaveLength(4);
    expect(h.order.at(-1)).toBe('p1');
  });
  it('groups of two avoid last time pairs; a single one joins a group', () => {
    let d = newDraw({ title: 'Zelte', mode: 'groups', size: 2, people });
    d = withEntry(d, { id: 'x', at: 'x', groups: [['p1', 'p2'], ['p3', 'p4']] });
    const g = makeGroups(d, ['p1', 'p2', 'p3', 'p4'], seq(5));
    const pairs = g.map((x) => [...x].sort().join('|'));
    expect(pairs).not.toContain('p1|p2');
    expect(pairs).not.toContain('p3|p4');
    const odd = makeGroups(newDraw({ title: 'Z', mode: 'groups', size: 2, people: [...people, { name: 'E' }] }), ['p1', 'p2', 'p3', 'p4', 'p5'], seq(2));
    expect(odd.map((x) => x.length).sort()).toEqual([2, 3]);
    expect(resultText(d, { groups: [['p1', 'p3']] }, T)).toBe('Zelte\nGroup 1: A, C');
    expect(namesOf(d, ['p9'])).toEqual(['?']);
  });
});

describe('freshId', () => {
  it('never repeats an id that is taken, even with the same clock', async () => {
    const { freshId } = await import('../src/lib/mini/los.js');
    const a = freshId('p');
    const b = freshId('p', [a]);
    const c = freshId('p', [a, b]);
    expect(new Set([a, b, c]).size).toBe(3);
  });
});
