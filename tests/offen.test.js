// «Frag die App merkt sich Fragen» (S6, Noah 21.11.2026 «5a»): pure rules and the device-only storage.
import { describe, it, expect } from 'vitest';
import { noteOpen, dropOpen, hasOpen, cleanOpen, loadOpen, saveOpen, keyOf, OPEN_KEY, MAX_OPEN } from '../src/lib/assistent/offen.js';

const mem = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), has: (k) => m.has(k) };
};

describe('noting a question', () => {
  it('keeps the newest first and counts the same question once', () => {
    let l = noteOpen([], 'Wie viele Nächte draussen?', '2026-11-20');
    l = noteOpen(l, 'Wann war ich beim Service?', '2026-11-21');
    l = noteOpen(l, '  wie viele   nächte DRAUSSEN? ', '2026-11-22');
    expect(l.map((e) => e.q)).toEqual(['Wie viele Nächte draussen?', 'Wann war ich beim Service?']);
    expect(l[0].n).toBe(2);
    expect(l[0].day).toBe('2026-11-22');
  });

  it('ignores too short questions and keeps at most 20', () => {
    expect(noteOpen([], 'ab', '2026-11-20')).toEqual([]);
    const l = Array.from({ length: 25 }, (_, i) => `Frage Nummer ${i}`).reduce((s, q) => noteOpen(s, q, '2026-11-20'), []);
    expect(l).toHaveLength(MAX_OPEN);
    expect(l[0].q).toBe('Frage Nummer 24');
  });

  it('drops a question and knows whether one is on the list', () => {
    const l = noteOpen([], 'Wie warm wird es?', '2026-11-20');
    expect(hasOpen(l, 'wie  warm wird es?')).toBe(true);
    expect(dropOpen(l, keyOf('Wie warm wird es?'))).toEqual([]);
  });
});

describe('storage on this device', () => {
  it('writes and reads back, and an empty list leaves no key', () => {
    const s = mem();
    const l = noteOpen([], 'Wie warm wird es?', '2026-11-20');
    saveOpen(l, s);
    expect(loadOpen(s)).toEqual(l);
    saveOpen([], s);
    expect(s.has(OPEN_KEY)).toBe(false);
  });

  it('survives broken content and a storage that throws', () => {
    const s = mem();
    s.setItem(OPEN_KEY, '{kaputt');
    expect(loadOpen(s)).toEqual([]);
    expect(cleanOpen([{ q: 'ok ok', n: 'x' }, null, { q: 5 }, { q: 'a' }])).toEqual([{ key: 'ok ok', q: 'ok ok', n: 1, day: '' }]);
    const bad = { getItem: () => { throw new Error('no'); }, setItem: () => { throw new Error('no'); }, removeItem: () => { throw new Error('no'); } };
    expect(loadOpen(bad)).toEqual([]);
    expect(() => saveOpen(noteOpen([], 'Wie warm wird es?', 'x'), bad)).not.toThrow();
  });

  it('is not part of the database: the key is a local pg. key', () => {
    expect(OPEN_KEY.startsWith('pg.')).toBe(true);
  });
});
