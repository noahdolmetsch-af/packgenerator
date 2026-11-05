// «Ein Murmeltier als Begleiter» (Idee 28): the one marmot has its four states and is switchable.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { OPS, opOf } from '../src/lib/bedienung.js';

const src = readFileSync(new URL('../src/lib/murmeltier/Murmeltier.svelte', import.meta.url), 'utf8');

describe('marmot', () => {
  it('draws sit, sleep, peek and whistle', () => {
    for (const s of ["'sit'", "'sleep'", "'peek'", "'whistle'"]) expect(src, s).toContain(s);
  });
  it('is a switch in Bedienung, on by default', () => {
    expect(OPS.find((o) => o.key === 'murmeltier')?.on).toBe(true);
    expect(opOf('murmeltier', null)).toBe(true);
    expect(opOf('murmeltier', '0')).toBe(false);
  });
});
