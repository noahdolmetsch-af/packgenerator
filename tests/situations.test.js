import { describe, it, expect } from 'vitest';
import { SITUATIONS, SITUATION_KEYS, applySituation, situationOf } from '../src/lib/map/situations.js';
import { ALL_KEYS } from '../src/lib/map/poisearch.js';
import { NO_FILTER } from '../src/lib/map/poifilter.js';

describe('Suchvorschläge · situation buttons', () => {
  it('has the 14 situations, each with known kinds and a German name', async () => {
    const de = (await import('../src/lib/i18n/de/index.js')).default;
    expect(SITUATIONS).toHaveLength(14);
    expect(new Set(SITUATION_KEYS).size).toBe(14);
    for (const s of SITUATIONS) {
      expect(de[s.name], s.name).toBeTruthy();
      expect(s.kinds.length, s.key).toBeGreaterThan(0);
      for (const k of s.kinds) expect(ALL_KEYS, `${s.key}: ${k}`).toContain(k);
    }
  });
  it('switches on its kinds and its filter, the rest of your filter stays', () => {
    const r = applySituation('hunger', { ...NO_FILTER, ahead: true, detourKm: 2 });
    expect(r.kinds).toEqual(['bakery', 'shop', 'food']);
    expect(r.filter).toMatchObject({ open: 'now', ahead: true, detourKm: 2 });
    expect(applySituation('rain').filter.rain).toBe(true);
    expect(applySituation('nope')).toBe(null);
  });
  it('knows which situation the switched-on kinds are', () => {
    expect(situationOf(['food', 'bakery', 'shop'])).toBe('hunger');
    expect(situationOf(['station', 'bus', 'transit'])).toBe('home');
    expect(situationOf(['water'])).toBe('');
  });
});
