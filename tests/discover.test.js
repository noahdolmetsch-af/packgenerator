import { describe, it, expect } from 'vitest';
import { discoverOf, putOff, bringBack, pickDiscover } from '../src/lib/home/discover.js';
import { FEATURES } from '../src/lib/features.js';
import { momentOfFeature } from '../src/lib/moment.js';

const day = '2026-10-30';
const of = (m) => FEATURES.filter((f) => momentOfFeature(f.id) === m);

describe('«Discover» on Today (PR 5)', () => {
  it('reads a stored record safely', () => {
    expect(discoverOf(null)).toEqual({ off: false, later: {} });
    expect(discoverOf({ off: true, later: { a: '2026-10-01', b: 3 } })).toEqual({ off: true, later: { a: '2026-10-01' } });
  });
  it('picks one function of the moment that was never used, the same all day', () => {
    const a = pickDiscover({ moment: 'packen', today: day });
    expect(a).not.toBeNull();
    expect(momentOfFeature(a.feature.id)).toBe('packen');
    expect(pickDiscover({ moment: 'packen', today: day }).feature.id).toBe(a.feature.id);
    expect(a.total).toBe(of('packen').length);
  });
  it('skips used functions, «Not for me» and «Later» (today only)', () => {
    const all = of('packen').map((f) => f.id);
    const a = pickDiscover({ moment: 'packen', today: day });
    const used = new Set([a.feature.id]);
    expect(pickDiscover({ moment: 'packen', today: day, used }).feature.id).not.toBe(a.feature.id);
    const not = { [a.feature.id]: { why: '', at: day } };
    expect(pickDiscover({ moment: 'packen', today: day, notForMe: not }).feature.id).not.toBe(a.feature.id);
    const rec = putOff(discoverOf(null), a.feature.id, day);
    expect(pickDiscover({ moment: 'packen', today: day, rec }).total).toBe(all.length - 1);
    expect(pickDiscover({ moment: 'packen', today: '2026-10-31', rec }).total).toBe(all.length);
    expect(bringBack(rec, a.feature.id).later).toEqual({});
  });
  it('is null when everything is used or the card is off', () => {
    expect(pickDiscover({ moment: 'packen', today: day, used: new Set(of('packen').map((f) => f.id)) })).toBeNull();
    expect(pickDiscover({ moment: 'packen', today: day, rec: { off: true, later: {} } })).toBeNull();
  });
});
