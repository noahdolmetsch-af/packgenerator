// «Gewitter-Hinweis mit Uhrzeit» (Noah 04.11.2026 «5 alle»): the spans of possible thunderstorms. Fictional place.
import { describe, it, expect } from 'vitest';
import { thunderSpans } from '../src/lib/wetter/gewitter.js';

const H = 36e5;
const t0 = Date.UTC(2026, 6, 14, 6); // 14.07.2026 06:00 UTC, offset 0 (made-up summer day)
const hour = (i, o = {}) => ({ ms: t0 + i * H, code: 3, cape: 0, rainP: 5, rainMm: 0, ...o });
const storm = (i, p = 70) => hour(i, { code: 95, rainP: p });
const core = (hs) => ({ offset: 0, hours: hs });
const flat = (n = 40) => Array.from({ length: n }, (_, i) => hour(i));

describe('thunderSpans', () => {
  it('finds nothing on a calm day', () => {
    expect(thunderSpans(core(flat()), t0)).toEqual([]);
  });
  it('joins hours next to each other into one span with its end', () => {
    const hs = flat();
    hs[9] = storm(9, 60);
    hs[10] = storm(10, 80);
    hs[11] = storm(11, 40);
    const s = thunderSpans(core(hs), t0);
    expect(s).toHaveLength(1);
    expect(s[0]).toMatchObject({ from: t0 + 9 * H, to: t0 + 12 * H, rainP: 80, day: 'today' });
  });
  it('keeps two storms with a long dry gap apart and names tomorrow', () => {
    const hs = flat();
    hs[8] = storm(8);
    hs[16] = storm(16); // 22:00
    hs[30] = storm(30); // tomorrow noon
    const s = thunderSpans(core(hs), t0);
    expect(s.map((x) => x.day)).toEqual(['today', 'today', 'tomorrow']);
    expect(s).toHaveLength(3);
  });
  it('counts a high energy with a high rain chance as thundery (the core rule)', () => {
    const hs = flat();
    hs[5] = hour(5, { cape: 1200, rainP: 60 });
    expect(thunderSpans(core(hs), t0)).toHaveLength(1);
  });
  it('looks only 36 hours ahead', () => {
    const hs = flat(60);
    hs[50] = storm(50);
    expect(thunderSpans(core(hs), t0)).toEqual([]);
  });
});
