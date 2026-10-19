// Paket N #68: Ich › Was kommt, the packages of the plan in three groups.
import { describe, it, expect } from 'vitest';
import { PACKAGES, cmpVersion, packagesNow } from '../src/lib/wascommt.js';

describe('Was kommt', () => {
  it('compares versions by number', () => {
    expect(cmpVersion('0.149.0', '0.150.0')).toBe(-1);
    expect(cmpVersion('0.150.0', '0.150.0')).toBe(0);
    expect(cmpVersion('1.0.0', '0.999.9')).toBe(1);
  });

  it('puts a package live once the app reaches its version', () => {
    const list = [{ key: 'A', version: '0.10.0' }, { key: 'B', version: '0.12.0', work: true }, { key: 'C', version: null, work: true }, { key: 'D', version: null }];
    expect(packagesNow('0.11.0', list)).toEqual({ live: [list[0]], work: [list[1], list[2]], later: [list[3]] });
    expect(packagesNow('0.12.0', list).live.map((p) => p.key)).toEqual(['A', 'B']);
  });

  it('has each package once, with a title and a text', () => {
    expect(new Set(PACKAGES.map((p) => p.key)).size).toBe(PACKAGES.length);
    for (const p of PACKAGES) expect(p.title && p.sub).toBeTruthy();
  });
});
