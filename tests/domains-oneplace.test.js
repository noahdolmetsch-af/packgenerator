// Data cleanup 14.10.2026 (Noah 4a): everything per area lives on the area in domains.js. These checks
// pin that the pages still get exactly what they got from their own lists before.
import { describe, it, expect } from 'vitest';
import { DOMAINS, TRIP_DOMAINS, packsFor } from '../src/lib/domains.js';
import { AREA_MAP } from '../src/lib/gearimport.js';
import { wantFor } from '../src/lib/backpacks.js';
import { examplesFor } from '../src/lib/packgroups.js';
import { ALL_OF } from '../src/lib/checks.js';
import DE from '../src/lib/i18n/de/index.js';

describe('areas in one place', () => {
  it('import words: the same map as the old list in gearimport.js', () => {
    expect(AREA_MAP).toEqual({
      velo: 'velo', bike: 'velo', bikepacking: 'bikepacking', wandern: 'hiking', hiking: 'hiking', reisen: 'travel', travel: 'travel',
      alltag: 'everyday', everyday: 'everyday', ski: 'ski', skitour: 'ski', weekend: 'weekend', wochenende: 'weekend',
    });
  });

  it('bag litres: the same as the old PACK_WANTS, and a new trip gets its bags without them', () => {
    expect(wantFor('hiking', 0)).toEqual({ min: 12, max: 15 });
    expect([wantFor('weekend', 0), wantFor('weekend', 1), wantFor('travel', 0), wantFor('travel', 1)]).toEqual(Array(4).fill({ min: 18, max: 22 }));
    expect(wantFor('ski', 0)).toEqual({ min: 25, max: 35 });
    for (const d of DOMAINS) for (const p of packsFor(d.key)) expect('want' in p).toBe(false);
  });

  it('in sight in New trip: cycling, ski touring, hiking; every trip area has an icon, a name for «Gilt für» and German words', () => {
    expect(TRIP_DOMAINS.filter((d) => d.sport).map((d) => d.key)).toEqual(['bikepacking', 'ski', 'hiking']);
    for (const d of TRIP_DOMAINS) {
      expect(d.icon, d.key).toBeTruthy();
      expect(DE[ALL_OF[d.key]], d.key).toBeTruthy();
      expect(DE[d.sportName ?? d.name], d.key).toBeTruthy();
    }
    expect(examplesFor('weekend')).toEqual([]);
  });
});
