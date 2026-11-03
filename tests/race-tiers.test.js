import { describe, it, expect } from 'vitest';
import { raceOf } from '../src/lib/race/race.js';

describe('raceOf: the three goals', () => {
  it('are empty texts until written, and keep what was written', () => {
    expect(raceOf({}, null).tiers).toEqual({ vision: '', super: '', least: '' });
    expect(raceOf({ tiers: { vision: 'A', least: 'C' } }, null).tiers).toEqual({ vision: 'A', super: '', least: 'C' });
  });
});
