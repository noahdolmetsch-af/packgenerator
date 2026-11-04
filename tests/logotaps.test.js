// «Geheimnis im Logo» (Idee 29): the fifth quick tap on «PG» triggers, a pause starts the count again.
import { describe, it, expect } from 'vitest';
import { makeTapCounter, TAPS_NEEDED, TAP_GAP_MS } from '../src/lib/logo/taps.js';

describe('logo taps', () => {
  it('fires on the fifth quick tap and then starts over', () => {
    const tap = makeTapCounter();
    const hits = [0, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800].map((t) => tap(t));
    expect(hits).toEqual([false, false, false, false, true, false, false, false, false, true]);
  });
  it('a pause longer than the gap starts the count again', () => {
    const tap = makeTapCounter();
    [0, 300, 600, 900].forEach((t) => tap(t));
    expect(tap(900 + TAP_GAP_MS + 1)).toBe(false); // the fifth tap came too late: counts as the first
    expect([1, 2, 3].map((k) => tap(3000 + k * 100))).toEqual([false, false, false]);
    expect(tap(3400)).toBe(true);
  });
  it('needs five', () => {
    expect(TAPS_NEEDED).toBe(5);
  });
});
