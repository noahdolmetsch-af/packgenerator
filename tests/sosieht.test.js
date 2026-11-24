// «So sieht's aus» (Noah 23.11.2026 «1-5a», Frage 5a): the line in the empty card of the four main pages
import { describe, it, expect } from 'vitest';
import DE from '../src/lib/i18n/de/index.js';
import { SOSIEHT, SOSIEHT_AREAS, SAMPLE_TRIP_ID } from '../src/lib/firststart/sosieht.js';

describe('So sieht\'s aus', () => {
  it('has the four main pages, each with a page to go back to and German texts', () => {
    expect(SOSIEHT_AREAS).toEqual(['trips', 'pack', 'gear', 'bikes']);
    for (const a of SOSIEHT_AREAS) {
      const c = SOSIEHT[a];
      expect(c.hash, a).toMatch(/^#\//);
      for (const k of [c.title, c.sub]) expect(DE[k] ?? DE[k.replace(/\|[a-z]+$/, '')], k).toBeTruthy();
    }
    for (const k of ['How it looks', 'See a sample']) expect(DE[k], k).toBeTruthy();
  });
  it('only Pack opens the example trip, and it is the trip of the first start', () => {
    expect(SOSIEHT_AREAS.filter((a) => SOSIEHT[a].trip)).toEqual(['pack']);
    expect(SAMPLE_TRIP_ID).toBe('ex-trip');
  });
});
