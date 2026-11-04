// «Licht in der Nacht» (Noah 03.11.2026, Paket D, Idee 20): how dark the night light is, and when it shows.
import { describe, it, expect } from 'vitest';
import { FADE_MIN, nightStrength, nightLightOn, beamDeg } from '../src/lib/live/nightlight.js';

const H = 36e5;
const MIN = 6e4;
const light = (rise, set, now) => ({ rise, set, dark: now < rise || now > set });

describe('night strength', () => {
  const rise = 7 * H;
  const set = 17 * H;
  it('is 0 by day', () => {
    for (const now of [rise + 1, 12 * H, set - 1]) expect(nightStrength(light(rise, set, now), now)).toBe(0);
  });
  it('grows over the half hour after sunset and then stays 1', () => {
    expect(nightStrength(light(rise, set, set + 1), set + 1)).toBeGreaterThan(0);
    expect(nightStrength(light(rise, set, set + (FADE_MIN / 2) * MIN), set + (FADE_MIN / 2) * MIN)).toBeCloseTo(0.5, 5);
    expect(nightStrength(light(rise, set, set + FADE_MIN * MIN), set + FADE_MIN * MIN)).toBe(1);
    expect(nightStrength(light(rise, set, 23 * H), 23 * H)).toBe(1);
  });
  it('shrinks over the last half hour before sunrise', () => {
    const now = rise - (FADE_MIN / 3) * MIN;
    expect(nightStrength(light(rise, set, now), now)).toBeCloseTo(1 / 3, 5);
    expect(nightStrength(light(rise, set, 3 * H), 3 * H)).toBe(1);
  });
  it('is 0 without a light answer', () => {
    expect(nightStrength(null, 1)).toBe(0);
    expect(nightStrength({ dark: true }, 1)).toBe(0);
  });
});

describe('night light on', () => {
  it('shows only in the dark, when switched on and not with the battery saver', () => {
    expect(nightLightOn({ strength: 0.4 })).toBe(true);
    expect(nightLightOn({ strength: 0 })).toBe(false);
    expect(nightLightOn({ strength: 1, enabled: false })).toBe(false);
    expect(nightLightOn({ strength: 1, battery: true })).toBe(false);
  });
});

describe('cone direction', () => {
  it('points up when the map turns with you, else where you ride', () => {
    expect(beamDeg({ rotated: true, deg: 120 })).toBe(0);
    expect(beamDeg({ rotated: false, deg: 120.4 })).toBe(120);
    expect(beamDeg({ rotated: false, deg: null })).toBe(0);
    expect(beamDeg({})).toBe(0);
  });
});
