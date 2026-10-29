// Mini-Tools «Anmeldeliste mit Warteliste» (Noah 28.10.2026, idea 4): the list, places and waiting list. Fictional data only.
import { describe, it, expect } from 'vitest';
import { listQuestion, readList, cleanListAnswer, seats, placeState, freeOf, listText, PLACES_MAX } from '../src/lib/mini/liste.js';

const T = (s, v = {}) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k]));

describe('the sign-up list', () => {
  it('cleans the list and keeps places in their range', () => {
    const q = listQuestion({ title: '  Werkstatt-Abend ', day: '2026-11-12', time: '19:00', where: 'Garage', places: 6 });
    expect(q).toMatchObject({ kind: 'list', title: 'Werkstatt-Abend', day: '2026-11-12', time: '19:00', places: 6 });
    expect(listQuestion({ title: 'X', places: 500 }).places).toBe(PLACES_MAX);
    expect(listQuestion({ title: 'X', places: 0 }).places).toBe(1);
    expect(listQuestion({ title: 'X', time: '19:00' }).time).toBe('');
    expect(listQuestion({ title: '' })).toBeNull();
    expect(readList({ ...q, pk: 'k' }).pk).toBe('k');
    expect(readList({ ...q, kind: 'poll', pk: 'k' })).toBeNull();
    expect(cleanListAnswer({ name: ' Test ', note: 'bringe Kuchen' })).toEqual({ name: 'Test', note: 'bringe Kuchen' });
  });

  it('gives places in the order people came in first; the rest wait', () => {
    const rows = [
      { a: 'c', name: 'C', t0: '2026-11-02T08:02:00Z' },
      { a: 'a', name: 'A', t0: '2026-11-02T08:00:00Z' },
      { a: 'b', name: 'B', t0: '2026-11-02T08:01:00Z' },
    ];
    const s = seats(rows, 2);
    expect(s.yes.map((r) => r.name)).toEqual(['A', 'B']);
    expect(s.wait.map((r) => r.name)).toEqual(['C']);
    expect(placeState(2, 2)).toEqual({ state: 'yes', n: 2 });
    expect(placeState(4, 2)).toEqual({ state: 'wait', n: 2 });
    expect(freeOf(3, 2)).toBe(0);
    expect(freeOf(1, 5)).toBe(4);
    expect(listText({ title: 'Ausfahrt', places: 2 }, s, T)).toBe('Ausfahrt\nSigned up (2 of 2):\n1. A\n2. B\nWaiting list:\n1. C');
  });
});
