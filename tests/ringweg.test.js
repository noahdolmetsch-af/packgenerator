import { describe, it, expect } from 'vitest';
import { ringHrefs, ringParts, goalHref, TICKS_HREF } from '../src/lib/flow/ringweg.js';

const st = (id, ring, paused = false, extra = {}) => ({ act: { id, ring, paused }, ...extra });

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

  it('ringParts: the sports of a ring with their own stand; resting sports do not count for Move and Recovery', () => {
    const p = ringParts([st('ride', 'move', false, { stand: { n: 2, of: 4 } }), st('run', 'move', false, { met: true, stand: { n: 1, of: 1 } }), st('ski', 'move', false, { resting: true }), st('sauna', 'rest')]);
    expect(p.move.map((x) => [x.act.id, x.n, x.of, x.met])).toEqual([['ride', 2, 4, false], ['run', 1, 1, true]]);
    expect(p.move[0].href).toBe('#/auswerten/analyse/act%3Aride?zeit=w');
    expect(p.rest).toHaveLength(1);
    expect(p.mind).toEqual([]);
  });
  it('a ring whose only other sport rests leads straight to the one that counts', () => {
    expect(ringHrefs([st('ride', 'move'), st('ski', 'move', false, { resting: true })]).move).toBe('#/auswerten/analyse/act%3Aride?zeit=w');
  });
});
