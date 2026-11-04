// «Windfahne beim Wetter» (Noah 03.11.2026, Paket D, Idee 15): how the vane is drawn from direction and speed.
import { describe, it, expect } from 'vitest';
import { levelOf, vaneOf } from '../src/lib/wetter/vane.js';

describe('wind vane', () => {
  it('has four strengths', () => {
    expect([0, 4.9, 5, 14.9, 15, 29.9, 30, 80].map(levelOf)).toEqual(['calm', 'calm', 'light', 'light', 'fresh', 'fresh', 'strong', 'strong']);
    expect(levelOf(null)).toBe('calm');
    expect(levelOf('x')).toBe('calm');
  });
  it('points where the wind blows to, north up', () => {
    expect(vaneOf(270, 20).angle).toBe(0); // from the west → to the east
    expect(vaneOf(0, 20).angle).toBe(90); // from the north → to the south (down)
    expect(vaneOf(90, 20).angle).toBe(180); // from the east → to the west
    expect(vaneOf(180, 20).angle).toBe(-90); // from the south → to the north (up)
    expect(vaneOf(-90, 20).angle).toBe(0); // -90° is west: negative degrees count round
    expect(vaneOf(360, 20).angle).toBe(90);
  });
  it('flutters harder and longer with more wind, and stands still in a calm', () => {
    const [c, l, f, s] = [2, 10, 20, 40].map((k) => vaneOf(0, k));
    expect(c.amp).toBe(0);
    expect(c.calm).toBe(true);
    expect([l.amp, f.amp, s.amp]).toEqual([...[l.amp, f.amp, s.amp]].sort((a, b) => a - b));
    expect(l.len).toBeLessThan(s.len);
    expect(s.dur).toBeLessThan(l.dur);
  });
  it('without a direction there is no vane (the plain icon shows)', () => {
    for (const d of [null, undefined, '', 'north', NaN]) expect(vaneOf(d, 20), String(d)).toBeNull();
  });
});
