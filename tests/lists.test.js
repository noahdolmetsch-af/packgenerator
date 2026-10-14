// Eigene Listen (Noah 14.10.2026 «1a und b 2 b 3a», «4 ok 5 ok»): lists with or without boxes, pinned to a place.
import { describe, it, expect } from 'vitest';
import { newList, addPoint, togglePoint, removePoint, resetPoints, pointsOf, openCount, pinnedTo, cleanPin, PIN_PLACES, ideaRotation, weakest, tipHidden, IDEAS_ID, ideasList } from '../src/lib/lists.js';

const NOW = '2026-10-14T10:00:00.000Z';

describe('lists', () => {
  it('a list needs a name; a trip pin needs its trip', () => {
    expect(newList({ name: '  ' }, { id: 'a' })).toBeNull();
    const l = newList({ name: ' Einkauf ', pin: { place: 'trips' } }, { id: 'a', now: NOW });
    expect(l).toMatchObject({ id: 'a', name: 'Einkauf', check: true, pin: null, items: [] });
    expect(cleanPin({ place: 'trips', tripId: 't1' })).toEqual({ place: 'trips', tripId: 't1' });
    expect(cleanPin({ place: 'gear', tripId: 't1' })).toEqual({ place: 'gear' });
    expect(cleanPin({ place: 'moon' })).toBeNull();
    expect(PIN_PLACES.map((p) => p.key)).toEqual(['trips', 'gear', 'bikes', 'active', 'balance']);
  });

  it('points: add, tick (ticked ones last), remove, empty all boxes', () => {
    let l = newList({ name: 'Packen' }, { id: 'a', now: NOW });
    l = addPoint(l, 'Brot', { id: 'p1', now: NOW });
    l = addPoint(l, '', { id: 'p0' });
    l = addPoint(l, 'Käse', { id: 'p2', now: NOW });
    expect(l.items.map((x) => x.id)).toEqual(['p1', 'p2']);
    l = togglePoint(l, 'p1', NOW);
    expect(pointsOf(l).map((x) => x.id)).toEqual(['p2', 'p1']);
    expect(openCount(l)).toBe(1);
    l = resetPoints(l);
    expect(openCount(l)).toBe(2);
    l = removePoint(l, 'p2');
    expect(l.items.map((x) => x.id)).toEqual(['p1']);
  });

  it('notes only: no box, every point counts, the order stays', () => {
    let l = newList({ name: 'Notizen', check: false }, { id: 'n' });
    l = addPoint(addPoint(l, 'a', { id: '1' }), 'b', { id: '2' });
    l = togglePoint(l, '1');
    expect(openCount(l)).toBe(2);
    expect(pointsOf(l).map((x) => x.id)).toEqual(['1', '2']);
  });

  it('pinned lists: by place, and a trip only on its own trip', () => {
    const lists = [newList({ name: 'A', pin: { place: 'gear' } }, { id: 'a' }), newList({ name: 'B', pin: { place: 'trips', tripId: 't1' } }, { id: 'b' }), newList({ name: 'C' }, { id: 'c' })];
    expect(pinnedTo(lists, 'gear').map((l) => l.id)).toEqual(['a']);
    expect(pinnedTo(lists, 'trips', 't1').map((l) => l.id)).toEqual(['b']);
    expect(pinnedTo(lists, 'trips', 't2')).toEqual([]);
  });

  it('«Meine Ideen»: pinned to Balance; dated ideas first in the rotation; «Nicht jetzt» for 7 days; weakest first', () => {
    expect(ideasList('Meine Ideen', NOW)).toMatchObject({ id: IDEAS_ID, pin: { place: 'balance' } });
    let l = ideasList('Meine Ideen', NOW);
    l = addPoint(l, 'alt', { id: '1', now: '2026-10-01T00:00:00Z' });
    l = addPoint(l, 'neu', { id: '2', now: '2026-10-10T00:00:00Z' });
    l = addPoint(l, 'Chasseral', { id: '3', now: '2026-10-02T00:00:00Z', date: '2026-10-17', area: 'nature' });
    l = togglePoint(addPoint(l, 'fertig', { id: '4' }), '4');
    expect(ideaRotation(l).map((x) => x.id)).toEqual(['3', '2', '1']);
    expect(tipHidden({ fun: '2026-10-10' }, 'fun', '2026-10-16')).toBe(true);
    expect(tipHidden({ fun: '2026-10-10' }, 'fun', '2026-10-17')).toBe(false);
    expect(weakest([{ key: 'a', value: 50 }, { key: 'b', value: null }, { key: 'c', value: 20 }]).map((c) => c.key)).toEqual(['c', 'a']);
  });
});

import { suggestKind, listFrom } from '../src/lib/merken/quick.js';
describe('quick field (PL1, «3a»)', () => {
  it('suggests a list, a note or a to-do', () => {
    expect(suggestKind('')).toBeNull();
    expect(suggestKind('Liste Einkauf')).toBe('list');
    expect(suggestKind('Brot, Käse, Äpfel')).toBe('list');
    expect(suggestKind('Pumpe fehlt im Velo')).toBe('note');
    expect(suggestKind('Schaltauge bestellen')).toBe('todo');
  });
  it('takes the name and points of a list', () => {
    expect(listFrom('Liste Einkauf: Brot, Käse')).toEqual({ name: 'Einkauf', points: ['Brot', 'Käse'] });
    expect(listFrom('Brot, Käse, Äpfel')).toEqual({ name: '', points: ['Brot', 'Käse', 'Äpfel'] });
    expect(listFrom('Liste Werkstatt')).toEqual({ name: 'Werkstatt', points: [] });
  });
});
