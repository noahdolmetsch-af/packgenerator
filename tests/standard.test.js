import { describe, it, expect } from 'vitest';
import { STANDARD_LISTS, STANDARD_LIST, standardSnapshot, overrideOf, isChanged, applyOverrides, visible, listFor, resetList, standardChanges } from '../src/lib/standard.js';
import { CATEGORIES } from '../src/lib/gear.js';
import { DOMAINS } from '../src/lib/domains.js';
import { CHECKS_BY_DOMAIN } from '../src/lib/checks.js';

const E = [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }, { id: 'c', name: 'Gamma' }];

describe('Standard register', () => {
  it('has unique list keys and every list has entries with unique ids', () => {
    const keys = STANDARD_LISTS.map((l) => l.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const l of STANDARD_LISTS) {
      const ids = l.entries().map((e) => e.id);
      expect(ids.length, l.key).toBeGreaterThan(0);
      expect(new Set(ids).size, l.key).toBe(ids.length);
      for (const e of l.entries()) expect(typeof e.name === 'string' && e.name.length > 0, `${l.key} ${e.id}`).toBe(true);
    }
  });
  it('reads each list from its one home instead of keeping a copy', () => {
    expect(listFor('categories').map((e) => e.id)).toEqual(CATEGORIES.map((c) => c.key));
    expect(listFor('domains').map((e) => e.id)).toEqual(DOMAINS.map((d) => d.key));
    for (const [kind, byDomain] of Object.entries(CHECKS_BY_DOMAIN)) for (const domain of Object.keys(byDomain)) expect(STANDARD_LIST[`checks.${kind}.${domain}`]).toBeTruthy();
  });
  it('stays neutral: none of the real bike names in the Standard (docs/daten.md rule 1)', () => {
    const text = JSON.stringify(standardSnapshot());
    for (const word of ['Scale', 'Spark', 'Canyon', 'Factor', 'Lux World']) expect(text).not.toContain(word);
  });
});

describe('overrides', () => {
  it('makes a stored value whole and drops broken parts', () => {
    expect(overrideOf(null)).toEqual({ names: {}, hidden: [], order: [], own: [] });
    expect(overrideOf({ names: { a: '  A2 ', b: '' }, hidden: ['a', 'a', 3], own: [{ id: 'x', name: ' ' }, { id: 'y', name: 'Own' }] })).toEqual({ names: { a: 'A2' }, hidden: ['a'], order: [], own: [{ id: 'y', name: 'Own' }] });
    expect(isChanged({})).toBe(false);
    expect(isChanged({ hidden: ['a'] })).toBe(true);
  });
  it('without overrides is the Standard', () => {
    expect(applyOverrides(E, undefined)).toEqual(E.map((e) => ({ id: e.id, name: e.name, std: e.name, own: false, renamed: false, hidden: false })));
  });
  it('renames, hides, adds own entries and keeps the Standard name', () => {
    const list = applyOverrides(E, { names: { b: 'Bravo' }, hidden: ['c'], own: [{ id: 'own-1', name: 'Tennis' }] });
    expect(list.map((e) => e.name)).toEqual(['Alpha', 'Bravo', 'Gamma', 'Tennis']);
    expect(list[1]).toMatchObject({ std: 'Beta', renamed: true });
    expect(list[3]).toMatchObject({ own: true, std: null, renamed: false });
    expect(visible(list).map((e) => e.id)).toEqual(['a', 'b', 'own-1']);
  });
  it('puts the chosen order first and the rest after it in Standard order', () => {
    expect(applyOverrides(E, { order: ['c', 'own-1'], own: [{ id: 'own-1', name: 'X' }] }).map((e) => e.id)).toEqual(['c', 'own-1', 'a', 'b']);
  });
  it('a name of an entry the Standard no longer has is ignored, an own entry with a Standard id is not doubled', () => {
    expect(applyOverrides(E, { names: { gone: 'Old' }, own: [{ id: 'a', name: 'Dup' }] }).map((e) => e.id)).toEqual(['a', 'b', 'c']);
  });
  it('reset takes only that list back to the Standard', () => {
    expect(resetList({ categories: { hidden: ['elec'] }, domains: { hidden: ['ski'] } }, 'categories')).toEqual({ domains: { hidden: ['ski'] } });
    expect(listFor('categories', { categories: { hidden: ['elec'] } }).find((e) => e.id === 'elec').hidden).toBe(true);
  });
});

describe('changes of the Standard (offered, never automatic)', () => {
  it('finds added, renamed and removed entries', () => {
    const before = { l: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }] };
    const after = { l: [{ id: 'a', name: 'A2' }, { id: 'c', name: 'C' }], fresh: [{ id: 'z', name: 'Z' }] };
    expect(standardChanges(before, after)).toEqual([
      { list: 'l', id: 'a', kind: 'renamed', name: 'A2', was: 'A' },
      { list: 'l', id: 'c', kind: 'added', name: 'C' },
      { list: 'l', id: 'b', kind: 'removed', name: 'B' },
    ]);
  });
  it('no change against itself', () => {
    expect(standardChanges(standardSnapshot(), standardSnapshot())).toEqual([]);
  });
});
