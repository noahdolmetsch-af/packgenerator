// «Quick Links» (Noah 28.10.2026 «1a 2a 3a 4a 5a»): the pins and their groups (lib/quick/quicklinks.js).
import { describe, it, expect } from 'vitest';
import { FEATURE } from '../src/lib/features.js';
import {
  STARTER, QUICK_KEYS, starter, cleanQuick, deviceKind, otherKind, groupLabel, pinLabel, pinsIn, isPinned, shownGroups,
  addPin, removePin, editPin, movePin, addGroup, renameGroup, deleteGroup, moveGroup, findForPin,
} from '../src/lib/quick/quicklinks.js';

describe('Quick Links', () => {
  it('starts with 20 suggestions in five groups, each a function of the catalogue', () => {
    const s = starter();
    expect(s.groups).toHaveLength(5);
    expect(s.pins).toHaveLength(20);
    expect(STARTER.flatMap((g) => g.pins).every((f) => FEATURE[f])).toBe(true);
    expect(new Set(s.pins.map((p) => p.id)).size).toBe(20);
  });

  it('nothing stored: the suggestions; a broken record too; unknown functions are left out', () => {
    expect(cleanQuick(null).pins).toHaveLength(20);
    expect(cleanQuick({ groups: 'x' }).pins).toHaveLength(20);
    const s = cleanQuick({ groups: [{ id: 'g1', name: 'Mine' }], pins: [{ id: 'a', feature: 'f.live', group: 'g1' }, { id: 'b', feature: 'f.gone', group: 'g1' }, { id: 'c', feature: 'f.sos', group: 'nope' }] });
    expect(s.pins.map((p) => p.id)).toEqual(['a', 'c']);
    expect(s.pins[1].group).toBe(''); // a group that no longer exists: «Without a group»
  });

  it('keeps one record per kind of device', () => {
    expect(QUICK_KEYS.phone).not.toBe(QUICK_KEYS.computer);
    expect(otherKind('phone')).toBe('computer');
    expect(deviceKind({ matchMedia: () => ({ matches: true }) })).toBe('phone');
    expect(deviceKind({ matchMedia: () => ({ matches: false }) })).toBe('computer');
    expect(deviceKind(null)).toBe('computer');
  });

  it('names: a typed name is never translated, a suggested group is', () => {
    const tr = (k) => `DE:${k}`;
    expect(groupLabel({ std: 'Before the trip', name: '' }, tr)).toBe('DE:Before the trip');
    expect(groupLabel({ std: 'Before the trip', name: 'Morgens' }, tr)).toBe('Morgens');
    expect(groupLabel(null, tr)).toBe('DE:Without a group|quick');
    expect(pinLabel({ feature: 'f.live', name: '' }, tr)).toBe(`DE:${FEATURE['f.live'].title}`);
    expect(pinLabel({ feature: 'f.live', name: 'Karte' }, tr)).toBe('Karte');
  });

  it('pins: add once, edit, move, unpin', () => {
    let s = starter();
    const g = s.groups[0].id;
    s = addPin(s, 'f.heatmap', g);
    expect(pinsIn(s, g).filter((p) => p.feature === 'f.heatmap')).toHaveLength(0); // already pinned elsewhere
    s = addPin(s, 'f.race', g);
    expect(isPinned(s, 'f.race')).toBe(true);
    expect(pinsIn(s, g).at(-1).feature).toBe('f.race');
    const id = pinsIn(s, g).at(-1).id;
    s = editPin(s, id, { name: '  Rennen  ', note: 'Mai' });
    expect(s.pins.find((p) => p.id === id)).toMatchObject({ name: 'Rennen', note: 'Mai' });
    s = editPin(s, id, { group: 'nope' });
    expect(s.pins.find((p) => p.id === id).group).toBe(g);
    const n = pinsIn(s, g).length;
    s = movePin(s, g, n - 1, 0);
    expect(pinsIn(s, g)[0].id).toBe(id);
    expect(movePin(s, g, 0, 99)).toBe(s);
    s = removePin(s, id);
    expect(isPinned(s, 'f.race')).toBe(false);
  });

  it('groups: add, rename (empty: back to its own name), order, delete without losing a pin', () => {
    let s = starter();
    s = addGroup(s, '  Winter ');
    const w = s.groups.at(-1);
    expect(w.name).toBe('Winter');
    expect(addGroup(s, '   ')).toBe(s);
    s = renameGroup(s, s.groups[0].id, 'Vorher');
    expect(s.groups[0].name).toBe('Vorher');
    s = renameGroup(s, s.groups[0].id, '');
    expect(s.groups[0].name).toBe('');
    expect(renameGroup(s, w.id, '').groups.at(-1).name).toBe('Winter'); // an own group keeps a name
    s = moveGroup(s, s.groups.length - 1, 0);
    expect(s.groups[0].id).toBe(w.id);
    const first = s.groups[1].id;
    const count = pinsIn(s, first).length;
    const d = deleteGroup(s, first, w.id);
    expect(d.pins).toHaveLength(s.pins.length);
    expect(pinsIn(d, w.id)).toHaveLength(count);
    const none = deleteGroup(s, first, null);
    expect(pinsIn(none, '')).toHaveLength(count);
    expect(shownGroups(none).at(-1)).toBe(null); // «Without a group» shows last
  });

  it('finds functions by their words', () => {
    const all = [{ id: 'a', title: 'Chain wear', text: 'x', words: 'kette' }, { id: 'b', title: 'Weather', text: 'y', words: 'wetter' }];
    expect(findForPin(all, 'kette').map((f) => f.id)).toEqual(['a']);
    expect(findForPin(all, '')).toEqual([]);
  });
});
