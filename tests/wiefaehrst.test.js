// «Wie fährst du?» (Noah 05.11.2026 «3a»): the way of riding is suggested from the kind of the bike.
import { describe, it, expect } from 'vitest';
import { suggestProfile, PROFILE_OF_KIND } from '../src/lib/live/wiefaehrst.js';
import { PROFILES, brouterUrl, valhallaUrl, BICYCLE_TYPE } from '../src/lib/reroute.js';

const A = { lat: 46.95, lon: 7.45 };
const B = { lat: 46.96, lon: 7.46 };

describe('suggestProfile', () => {
  it('road bike → short and paved, gravel bike → gravel, mountain bike → trails', () => {
    expect(suggestProfile({ id: 'b1', kind: 'road' })).toBe('fastbike');
    expect(suggestProfile({ id: 'b2', kind: 'gravel' })).toBe('gravel');
    expect(suggestProfile({ id: 'b3', kind: 'mtb' })).toBe('mtb');
  });
  it('reads the kind from the type text when the bike has no kind', () => {
    expect(suggestProfile({ id: 'x', type: 'test_data_gtp_ Hardtail' })).toBe('mtb');
    expect(suggestProfile({ id: 'y', type: 'test_data_gtp_ Rennvelo' })).toBe('fastbike');
  });
  it('without a bike there is no suggestion (the window starts as before)', () => {
    expect(suggestProfile(null)).toBeNull();
    expect(suggestProfile(undefined)).toBeNull();
  });
  it('every suggested profile is one the window offers and both routers know', () => {
    for (const p of Object.values(PROFILE_OF_KIND)) {
      expect(PROFILES.some((x) => x.key === p)).toBe(true);
      expect(brouterUrl([A, B], p)).toContain(`profile=${p}`);
      expect(BICYCLE_TYPE[p]).toBeTruthy();
      expect(valhallaUrl([A, B], p)).toContain(BICYCLE_TYPE[p]);
    }
  });
  it('the window offers four ways, the old default first', () => {
    expect(PROFILES.map((p) => p.key)).toEqual(['trekking', 'fastbike', 'gravel', 'mtb']);
  });
});
