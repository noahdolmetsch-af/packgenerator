// Paket Y «Lernen» (Noah 20.10.2026 «2a»): how a ride felt at which weather, made-up notes.
import { describe, it, expect } from 'vitest';
import { feelsOf, addFeel, removeFeel, feelHints } from '../src/lib/wetter/gefuehl.js';

const line = (tmin, extra = {}) => ({ tmin, tmax: tmin + 6, feelsMin: tmin - 1, windMax: 20, rainFrom: null, ...extra });
describe('feel', () => {
  it('adds one note per day, made safe', () => {
    let l = addFeel([], { day: '2026-10-01', line: line(7), feel: 'cold', parts: ['hands', 'nose'], wore: ' dünne Handschuhe ' }, 1);
    expect(l[0]).toMatchObject({ tmin: 6, feel: 'cold', parts: ['hands'], wore: 'dünne Handschuhe' });
    l = addFeel(l, { day: '2026-10-01', line: line(7), feel: 'ok' }, 2);
    expect(l).toHaveLength(1);
    expect(addFeel(l, { day: '2026-10-02', line: null, feel: 'ok' })).toBe(l);
    expect(feelsOf([{ day: 'x', feel: 'ok', tmin: 3 }, { day: '2026-10-03', feel: 'ok', tmin: 3 }, null])).toHaveLength(1);
    expect(removeFeel(l, l[0].id)).toEqual([]);
  });
  it('suggests from similar rides, newest first', () => {
    let l = [];
    l = addFeel(l, { day: '2026-09-01', line: line(8), feel: 'cold', parts: ['hands'] }, 1);
    l = addFeel(l, { day: '2026-09-10', line: line(9), feel: 'ok', wore: 'Winterhandschuhe' }, 2);
    l = addFeel(l, { day: '2026-09-20', line: line(20), feel: 'warm' }, 3);
    const h = feelHints(l, 6);
    expect(h.off.map((x) => x.day)).toEqual(['2026-09-01']);
    expect(h.ok.wore).toBe('Winterhandschuhe');
    expect(feelHints(l, null)).toEqual({ off: [], ok: null });
  });
});
