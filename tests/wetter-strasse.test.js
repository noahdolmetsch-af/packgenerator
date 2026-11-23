// «Strasse nass oder trocken» (Wetter-Ausbau F, Noah 22.11.2026 «a»): the road after rain, from the weather core.
import { describe, it, expect } from 'vitest';
import { roadState, dryHours } from '../src/lib/wetter/strasse.js';

const H = 36e5;
const t0 = Date.UTC(2026, 10, 22, 0, 0); // 22.11.2026 00:00 UTC (fictional place)
// 48 hours from t0 - 24 h; rain: { hourIndexFromT0: mm }
const core = (rain = {}, temp = 8, wind = 10) => ({ hours: Array.from({ length: 48 }, (_, i) => ({ ms: t0 + (i - 24) * H, rainMm: rain[i - 24] ?? 0, temp, wind })) });

describe('dryHours', () => {
  it('needs less time when warm and more when cold', () => {
    expect(dryHours(20, 5)).toBe(2);
    expect(dryHours(12, 5)).toBe(3);
    expect(dryHours(6, 5)).toBe(5);
    expect(dryHours(3, 5)).toBe(8);
  });
  it('is quicker in wind and never dries under 2 degrees', () => {
    expect(dryHours(12, 25)).toBe(2);
    expect(dryHours(1, 5)).toBe(Infinity);
    expect(dryHours(null, 5)).toBe(4);
  });
});

describe('roadState', () => {
  it('says nothing when it did not rain for a day', () => expect(roadState(core(), t0 + 10 * H)).toBeNull());
  it('says it rains now', () => expect(roadState(core({ 9: 1.2 }), t0 + 9 * H + 600000)).toEqual({ kind: 'raining' }));
  it('says wet until about when the road is dry', () => {
    // rain until 07:00 (hour 6 is the last wet one), 8 degrees: 5 hours after 07:00
    const s = roadState(core({ 5: 0.6, 6: 0.4 }), t0 + 8 * H);
    expect(s).toEqual({ kind: 'wet', until: t0 + 12 * H });
  });
  it('says dry again a few hours later, and quiet after twelve hours', () => {
    const c = core({ 5: 0.6, 6: 0.4 });
    expect(roadState(c, t0 + 13 * H)).toEqual({ kind: 'dry', since: t0 + 12 * H });
    expect(roadState(c, t0 + 22 * H)).toBeNull();
  });
  it('says wet without an end in the cold', () => expect(roadState(core({ 5: 0.6 }, 0.5), t0 + 8 * H)).toEqual({ kind: 'wet', until: null }));
  it('does not count a drizzle under 0.2 mm', () => expect(roadState(core({ 5: 0.1 }), t0 + 8 * H)).toBeNull());
  it('is null without hours', () => {
    expect(roadState(null, t0)).toBeNull();
    expect(roadState({ hours: [] }, t0)).toBeNull();
  });
});
