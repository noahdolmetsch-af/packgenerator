import { describe, it, expect } from 'vitest';
import { wxDiff } from '../src/lib/wxdiff.js';

// «Wetter gedreht» (C2): fictional kits and items.
const kitWarm = { key: 'k-warm', name: 'Warm', minC: 12, maxC: 40 };
const kitCold = { key: 'k-cold', name: 'Cold', minC: -20, maxC: 11 };
const gear = (id, set) => ({ id, name: id, sets: [set], ownership: 'owned', category: 'Clothing' });
const items = [gear('shorts', 'k-warm'), gear('jacket', 'k-cold'), gear('gloves', 'k-cold')];
const gap = (haveMin, fcMin, haveRain = 'none', fcRain = 'none') => ({ have: { min: haveMin, max: haveMin + 5, rain: haveRain }, fc: { min: fcMin, max: fcMin + 5, rain: fcRain } });

describe('wxDiff', () => {
  it('colder: the cold kit comes in, the warm items can go', () => {
    const d = wxDiff(gap(15, 4), [kitWarm, kitCold], items, [{ itemId: 'shorts' }], 0);
    expect(d.add.map((i) => i.id).sort()).toEqual(['gloves', 'jacket']);
    expect(d.leave.map((i) => i.id)).toEqual(['shorts']);
    expect(d.rain).toBe(null);
  });
  it('items already on the trip are not offered again', () => {
    const d = wxDiff(gap(15, 4), [kitWarm, kitCold], items, [{ itemId: 'jacket' }], 0);
    expect(d.add.map((i) => i.id)).toEqual(['gloves']);
  });
  it('same kit but rain coming: only the rain line', () => {
    const d = wxDiff(gap(15, 14, 'none', 'rain'), [kitWarm, kitCold], items, [], 0);
    expect(d.add).toEqual([]);
    expect(d.rain).toBe('more');
  });
  it('nothing changes: null', () => {
    expect(wxDiff(gap(15, 14), [kitWarm, kitCold], items, [], 0)).toBe(null);
    expect(wxDiff(null)).toBe(null);
  });
});
