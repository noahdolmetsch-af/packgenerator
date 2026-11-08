// «Erinnerungen aufs Handy» in vier Gruppen (Impeccable-Test 08.11.2026, 7b-08; Noah «alles»): every switch
// of KINDS sits in exactly one group, a group names only switches that exist, and the German names exist.
import { describe, it, expect } from 'vitest';
import { KINDS, PUSH_GROUPS } from '../src/lib/push/schedule.js';
import de from '../src/lib/i18n/de/index.js';

describe('the groups of the push page', () => {
  it('has every switch in exactly one group, and no switch that does not exist', () => {
    const all = PUSH_GROUPS.flatMap((g) => g.keys);
    const keys = KINDS.map((k) => k.key);
    expect([...all].sort()).toEqual([...keys].sort());
    expect(new Set(all).size).toBe(all.length);
  });

  it('has four groups with a German name each', () => {
    expect(PUSH_GROUPS.map((g) => g.key)).toEqual(['tour', 'weather', 'bike', 'day']);
    for (const g of PUSH_GROUPS) expect(de[g.label], g.label).toBeTruthy();
    expect(PUSH_GROUPS.map((g) => de[g.label])).toEqual(['Rund um die Tour', 'Wetter und Licht', 'Velos und Material', 'Alltag']);
  });

  it('has the count line in German', () => {
    expect(de['{n} of {m} on']).toBe('{n} von {m} an');
    expect(de['All off']).toBe('Alles aus');
  });
});
