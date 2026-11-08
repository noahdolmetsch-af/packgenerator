import { describe, it, expect } from 'vitest';
import { ringHrefs, goalHref, TICKS_HREF } from '../src/lib/flow/ringweg.js';

const st = (id, ring, paused = false) => ({ act: { id, ring, paused } });

describe('ringweg: Ringe und Wochenziele als Wege (Aktiv)', () => {
  it('ein Ring mit genau einer Sportart führt zu deren Wert, mehrere zur Haken-Auswertung', () => {
    const h = ringHrefs([st('meditation', 'mind'), st('sauna', 'rest'), st('walk', 'rest'), st('ride', 'move'), st('run', 'move')]);
    expect(h.mind).toBe('#/auswerten/analyse/act%3Ameditation?zeit=w');
    expect(h.rest).toBe(TICKS_HREF);
    expect(h.move).toBe(TICKS_HREF);
  });
  it('ein Ring ohne Sportart führt zur Haken-Auswertung, pausierte zählen nicht', () => {
    expect(ringHrefs([]).mind).toBe(TICKS_HREF);
    expect(ringHrefs([st('a', 'mind', true), st('b', 'mind')]).mind).toBe('#/auswerten/analyse/act%3Ab?zeit=w');
  });
  it('ein Wochenziel führt zu seinem Wert, Velo-km zu den Velo-Kilometern, eine verschwundene Sportart nirgends hin', () => {
    expect(goalHref({ goal: { kind: 'act', actId: 'yoga' } })).toBe('#/auswerten/analyse/act%3Ayoga?zeit=w');
    expect(goalHref({ goal: { kind: 'km' } })).toBe('#/auswerten/analyse/km%3Abike?zeit=w');
    expect(goalHref({ goal: { kind: 'act', actId: 'x' }, missing: true })).toBeNull();
    expect(goalHref(null)).toBeNull();
  });
});
