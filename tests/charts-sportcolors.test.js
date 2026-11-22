// «Gleiche Farben für gleiche Dinge» (Noah 21.11.2026 «1a»): a sport keeps its colour whatever its rank.
import { describe, it, expect } from 'vitest';
import { sportColour, PALETTE } from '../src/lib/charts/sportcolors.js';

describe('sportColour', () => {
  it('gives the same colour to the same sport, also as a Strava type', () => {
    expect(sportColour('bike')).toBe(sportColour('strava:Ride'));
    expect(sportColour('run')).toBe(sportColour('strava:Run'));
    expect(sportColour('hike')).toBe(sportColour('strava:Hike'));
  });
  it('keeps the main sports apart', () => {
    const c = ['bike', 'run', 'hike', 'tennis', 'hockey', 'swim', 'strava:AlpineSki'].map(sportColour);
    expect(new Set(c).size).toBe(c.length);
  });
  it('gives any other sport a stable colour from the palette', () => {
    expect(sportColour('curling')).toBe(sportColour('curling'));
    expect(PALETTE).toContain(sportColour('curling'));
    expect(PALETTE).toContain(sportColour(undefined));
  });
});
