import { describe, it, expect } from 'vitest';
import { addGroup, renameGroup, toggleCollapsed, moveGroup, removeGroup, inGroup, sections, filterActs } from '../src/lib/flow/sportgroups.js';

const G = [{ id: 'a', name: 'Kraft' }, { id: 'b', name: 'Erholung' }];
const acts = [
  { id: '1', name: 'Gym', group: 'a' },
  { id: '2', name: 'Sauna', group: 'b' },
  { id: '3', name: 'Laufen' },
  { id: '4', name: 'Yoga', group: 'gone' },
];

describe('groups of sports', () => {
  it('adds, renames, folds, moves and removes', () => {
    expect(addGroup([], '  Alltag ', 'x')).toEqual([{ id: 'x', name: 'Alltag' }]);
    expect(addGroup(G, '   ')).toBe(G);
    expect(renameGroup(G, 'a', ' Stark ')[0].name).toBe('Stark');
    expect(renameGroup(G, 'a', '')).toBe(G);
    expect(toggleCollapsed(G, 'b')[1].collapsed).toBe(true);
    expect(moveGroup(G, 'b', -1).map((g) => g.id)).toEqual(['b', 'a']);
    expect(moveGroup(G, 'a', -1)).toBe(G);
    expect(removeGroup(G, 'a').map((g) => g.id)).toEqual(['b']);
  });
  it('puts sports in sections; an unknown group counts as none', () => {
    expect(inGroup(acts, G, 'a').map((a) => a.id)).toEqual(['1']);
    expect(inGroup(acts, G, null).map((a) => a.id)).toEqual(['3', '4']);
    const s = sections(acts, G);
    expect(s.map((x) => x.group?.id ?? null)).toEqual(['a', 'b', null]);
    expect(sections(acts, [])).toEqual([{ group: null, acts }]);
  });
  it('searches by name and filters «open today»', () => {
    expect(filterActs(acts, { q: ' gy ' }).map((a) => a.id)).toEqual(['1']);
    const st = { 2: { open: true } };
    expect(filterActs(acts, { open: true }, (a) => a.name, (id) => st[id]).map((a) => a.id)).toEqual(['2']);
    expect(filterActs(acts, {}).length).toBe(4);
  });
});
