// «Kuhglocken» (Geheimmenü H1): the notes of the bell sound are quiet, short and in order; no sound where the browser has none.
import { describe, it, expect } from 'vitest';
import { notes, bellLength, ringBells, BELLS, STROKES } from '../src/lib/logo/kuhglocke.js';
import { OPS, opOf } from '../src/lib/bedienung.js';

describe('cow bells', () => {
  it('rings two bells in turn, from a deeper to a higher one', () => {
    expect(BELLS).toHaveLength(2);
    expect(BELLS[0].hz).toBeLessThan(BELLS[1].hz);
    expect(new Set(STROKES.map((s) => s.bell))).toEqual(new Set([0, 1]));
  });
  it('is quiet (every note far below full volume) and short (under 4 s)', () => {
    for (const n of notes()) {
      expect(n.gain).toBeGreaterThan(0);
      expect(n.gain).toBeLessThanOrEqual(0.06);
      expect(n.at).toBeGreaterThanOrEqual(0);
    }
    expect(bellLength()).toBeLessThan(4);
  });
  it('the strokes get quieter and never start before the one before', () => {
    for (let i = 1; i < STROKES.length; i++) {
      expect(STROKES[i].at).toBeGreaterThan(STROKES[i - 1].at);
      expect(STROKES[i].vol).toBeLessThan(STROKES[i - 1].vol);
    }
  });
  it('makes no sound and throws nothing where there is no audio', () => {
    expect(ringBells()).toBe(false);
  });
  it('the switch is off until the person turns it on', () => {
    expect(OPS.find((o) => o.key === 'kuhglocke')?.on).toBe(false);
    expect(opOf('kuhglocke', null)).toBe(false);
    expect(opOf('kuhglocke', '1')).toBe(true);
  });
});
