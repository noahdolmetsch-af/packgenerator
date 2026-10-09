// v0.45.0 "Kleiderschrank 2": warm to cold, the gaps, the everyday filter, the offset reset, the
// outfit of the day and a kit from an outfit; plus the two import page fixes. Fictional data only.
import { describe, it, expect } from 'vitest';
import {
  wardrobe,
  warmToCold,
  tempKey,
  inUse,
  everydayOnly,
  wardrobeGaps,
  gapWish,
  GAP_RULES,
  COVER_TO,
  clothingOffset,
  offsetRecord,
  resetOffset,
  offsetLine,
  outfitFor,
  kitFromOutfit,
  rangeAround,
  chooseKit,
  tempKits,
  CLOTHING_OFFSET,
} from '../src/lib/wardrobe.js';
import { allSets } from '../src/lib/sets.js';
import { stagedStatus, appliedNothing } from '../src/lib/gearimport.js';
import { wishReason } from '../src/lib/insights.js';

const P = 'test_data_gtp_';
const item = (id, name, f = {}) => ({ id, name: `${P}${name}`, category: 'onbike', weightG: 100, qty: 1, ownership: 'owned', sets: [], domains: ['bikepacking'], ...f });

const KIT = [
  item('KL01', 'Jersey short', { layer: 'base', zone: 'torso', tempMin: 15, tempMax: 30 }),
  item('KL02', 'Merino long', { layer: 'base', zone: 'torso', tempMin: 2, tempMax: 15 }),
  item('KL03', 'Base no range', { layer: 'base', zone: 'torso' }),
  item('KL04', 'Base class cold', { layer: 'base', zone: 'torso', tempClass: 'kalt' }),
  item('KL05', 'Thermo jersey', { layer: 'mid', zone: 'torso', tempMin: -5, tempMax: 10 }),
  item('KL06', 'Winter jacket', { layer: 'outer', zone: 'torso', tempMin: -10, tempMax: 5, rain: 'rain' }),
  item('KL07', 'Bib shorts', { layer: 'base', zone: 'legs', tempMin: 12, tempMax: 30 }),
  item('KL08', 'Winter tights', { layer: 'mid', zone: 'legs', tempMin: -5, tempMax: 8 }),
  item('KL09', 'Summer mitts', { layer: 'accessory', zone: 'hands', tempMin: 15, tempMax: 30 }),
  item('KL10', 'Light gloves', { layer: 'accessory', zone: 'hands', tempMin: 7, tempMax: 15 }),
  item('KL11', 'Cap thermo', { layer: 'accessory', zone: 'head', tempMin: -5, tempMax: 10 }),
  item('KL12', 'Socks merino', { layer: 'accessory', zone: 'feet', tempMin: 5, tempMax: 15 }),
  item('KL13', 'Office shirt', { layer: 'base', zone: 'torso', tempMin: -20, tempMax: 30, domains: ['everyday'] }),
  item('KL14', 'Town scarf', { layer: 'accessory', zone: 'neck', domains: ['everyday', 'velo'] }),
];

describe('warm to cold within a zone (decision 1)', () => {
  it('reads the range, an open border and the class', () => {
    expect(tempKey(KIT[0])).toEqual({ lo: 15, hi: 30 });
    expect(tempKey({ tempMax: 4 })).toEqual({ lo: -Infinity, hi: 4 });
    expect(tempKey({ tempClass: 'warm' })).toEqual({ lo: 15, hi: Infinity });
    expect(tempKey({})).toBeNull();
  });
  it('sorts the warm-weather piece first, then colder; no range last, then by name', () => {
    const base = wardrobe(KIT, 'velo').layers.find((l) => l.key === 'base').zones.find((z) => z.key === 'upper');
    expect(base.items.map((i) => i.id)).toEqual(['KL01', 'KL02', 'KL04', 'KL03']);
    const a = item('A', 'b', {});
    const b = item('B', 'a', {});
    expect([a, b].sort(warmToCold).map((i) => i.id)).toEqual(['B', 'A']);
    expect([item('X', 'x', { tempMin: 0, tempMax: 10 }), item('Y', 'y', { tempMin: 5, tempMax: 10 })].sort(warmToCold).map((i) => i.id)).toEqual(['Y', 'X']);
  });
});

describe('Alltag only (decision 10)', () => {
  it('an everyday-only piece is only under Alltag; Everyday plus another area is everywhere', () => {
    expect(everydayOnly(KIT[12])).toBe(true);
    expect(everydayOnly(KIT[13])).toBe(false);
    expect(everydayOnly(item('Z', 'z', { domains: [] }))).toBe(false);
    expect(inUse(KIT[12], 'all')).toBe(false);
    expect(inUse(KIT[12], 'velo')).toBe(false);
    expect(inUse(KIT[12], 'everyday')).toBe(true);
    for (const u of ['all', 'velo', 'everyday']) expect(inUse(KIT[13], u)).toBe(true);
    expect(inUse(item('S', 'ski', { domains: ['ski'] }), 'all')).toBe(true);
    expect(wardrobe(KIT, 'all').all.some((i) => i.id === 'KL13')).toBe(false);
  });
});

describe('the gaps (decision 2)', () => {
  it('a full wardrobe has no gap down to 0 °C', () => {
    const full = [...KIT, item('KL20', 'Winter gloves', { layer: 'accessory', zone: 'hands', tempMin: -5, tempMax: 5 }), item('KL21', 'Overshoes', { layer: 'accessory', zone: 'feet', tempMin: -5, tempMax: 8 })];
    expect(wardrobeGaps(full)).toEqual([]);
  });
  it('names the place and the lowest owned border', () => {
    const gaps = wardrobeGaps(KIT);
    expect(gaps.map((g) => g.key)).toEqual(['hands', 'feet']);
    expect(gaps[0]).toMatchObject({ layer: 'accessory', zone: 'hands', below: 7, text: 'No gloves below {n} °C', wished: null });
    expect(gaps[1].below).toBe(5);
  });
  it('nothing owned there: the temperature the place is needed from; wishes do not cover', () => {
    const only = KIT.filter((i) => i.zone !== 'hands');
    const wish = item('KL30', 'Wish gloves', { layer: 'accessory', zone: 'hands', ownership: 'wishlist' });
    const g = wardrobeGaps([...only, wish]).find((x) => x.key === 'hands');
    expect(g.below).toBe(GAP_RULES.find((r) => r.key === 'hands').from);
    expect(g.wished.id).toBe('KL30');
  });
  it('the offset widens the band; everyday-only pieces never count', () => {
    expect(COVER_TO).toBe(0);
    // Without the base layers of unknown warmth: the merino (from 2 °C) covers 0 °C, not −3 °C felt.
    const known = KIT.filter((i) => !['KL03', 'KL04'].includes(i.id));
    expect(wardrobeGaps(known).map((g) => g.key)).toEqual(['hands', 'feet']);
    expect(wardrobeGaps(known, { offset: 3 }).map((g) => g.key)).toEqual(['base', 'hands', 'feet']);
    expect(wardrobeGaps(known, { offset: 3 })[0].below).toBe(2);
    const office = [item('E', 'Office', { layer: 'base', zone: 'torso', tempMin: -20, domains: ['everyday'] })];
    expect(wardrobeGaps(office).some((g) => g.key === 'base')).toBe(true);
  });
  it('a wish from a gap has name, zone, layer and the reason; none when one is there', () => {
    const g = wardrobeGaps(KIT)[0];
    const w = gapWish(g, KIT, { name: 'Warm gloves', reason: 'No gloves below 7 °C', now: '2026-10-09T08:00:00Z' });
    expect(w).toMatchObject({ id: 'KL01'.replace('01', '15'), name: 'Warm gloves', ownership: 'wishlist', layer: 'accessory', zone: 'hands', note: 'No gloves below 7 °C', from: 'wardrobe', category: 'onbike' });
    expect(wishReason(w, KIT, [], []).reasons).toContain('No gloves below 7 °C');
    expect(gapWish({ ...g, wished: KIT[0] }, KIT)).toBeNull();
    // After the wish the gap shows it instead of the button.
    expect(wardrobeGaps([...KIT, w]).find((x) => x.key === 'hands').wished.id).toBe(w.id);
  });
  it('the wardrobe keeps a layer and zone that only has a gap', () => {
    const noFeet = KIT.filter((i) => i.zone !== 'feet');
    const gaps = wardrobeGaps(noFeet);
    const acc = wardrobe(noFeet, 'velo', { gaps }).layers.find((l) => l.key === 'accessory');
    const feet = acc.zones.find((z) => z.key === 'feet');
    expect(feet.items).toEqual([]);
    expect(feet.gap.key).toBe('feet');
  });
});

describe('the offset in the header and its reset (decision 8)', () => {
  const d = (at, clothing) => ({ status: 'done', doneAt: at, clothing });
  const list = [d('2026-09-01', 'cold'), d('2026-09-10', 'cold'), d('2026-10-01', 'warm')];
  it('says it in words, nothing at 0', () => {
    expect(offsetLine(2)).toEqual({ text: 'You run cold: {n} °C', n: '+2' });
    expect(offsetLine(-1)).toEqual({ text: 'You run warm: {n} °C', n: '−1' });
    expect(offsetLine(0)).toBeNull();
  });
  it('a reset starts at 0 and the old answers do not come back', () => {
    expect(clothingOffset(list)).toBe(1);
    const reset = resetOffset('2026-10-05T00:00:00Z');
    expect(reset).toMatchObject({ key: CLOTHING_OFFSET, value: 0, resetAt: '2026-10-05T00:00:00Z' });
    const after = offsetRecord(reset, [...list, d('2026-10-08T00:00:00Z', 'cold')], '2026-10-08T00:00:00Z');
    expect(after).toMatchObject({ value: 1, resetAt: '2026-10-05T00:00:00Z' });
    expect(offsetRecord(null, list, 'x')).toEqual({ key: CLOTHING_OFFSET, value: 1, at: 'x' });
  });
});

describe('what do I wear today (decision 9)', () => {
  const hours = (t, p = 0) => ({ t: Array(24).fill(t), p: Array(24).fill(p) });
  const fc = (t, p = 0) => ({ days: [{ date: '2026-10-09', min: t - 2, max: t + 4, hourly: hours(t, p) }] });
  it('one piece per needed row, the legs always', () => {
    const o = outfitFor(fc(4), KIT, { date: '2026-10-09', start: 8, hours: 2 });
    expect(o.c).toBe(4);
    expect(o.rows.map((r) => r.key)).toEqual(['base', 'mid', 'outer', 'legs', 'hands', 'head', 'feet']);
    const by = Object.fromEntries(o.rows.map((r) => [r.key, r.item?.id ?? null]));
    expect(by).toMatchObject({ base: 'KL02', mid: 'KL05', outer: 'KL06', legs: 'KL08', head: 'KL11', feet: 'KL12' });
    expect(by.hands).toBeNull(); // the light gloves (from 7 °C) are not warm enough at 4 °C: a gap row
  });
  it('a warm day: base and legs only; the offset makes it colder', () => {
    const warm = outfitFor(fc(22), KIT, { date: '2026-10-09' });
    expect(warm.rows.map((r) => [r.key, r.item?.id])).toEqual([['base', 'KL01'], ['legs', 'KL07']]);
    const felt = outfitFor(fc(16), KIT, { date: '2026-10-09', offset: 3 });
    expect(felt.c).toBe(13);
    expect(felt.rows.map((r) => r.key)).toContain('mid');
  });
  it('rain wants a waterproof outer layer; no forecast for the day: null', () => {
    const wet = outfitFor(fc(16, 60), KIT, { date: '2026-10-09' });
    expect(wet.wet).toBe(true);
    expect(wet.rows.find((r) => r.key === 'outer').item?.id).toBe('KL06');
    expect(outfitFor(fc(16), KIT, { date: '2026-10-10' })).toBeNull();
    expect(outfitFor(null, KIT, { date: '2026-10-09' })).toBeNull();
  });
  it('without hourly values the minimum of the day', () => {
    const o = outfitFor({ days: [{ date: '2026-10-09', min: 9, max: 15 }] }, KIT, { date: '2026-10-09' });
    expect(o).toMatchObject({ c: 9, from: 'min' });
  });
});

describe('an outfit as a temperature kit (decision 5)', () => {
  it('makes a building block with a range; Pack chooses it', () => {
    const r = kitFromOutfit([], KIT, { name: `${P}Cool morning`, minC: '2', maxC: '8', ids: ['KL02', 'KL05', 'KL08'] }, 'now');
    expect(r.value).toEqual([{ key: `u-${P.replace(/_/g, '-')}cool-morning`.replace(/-+/g, '-'), name: `${P}Cool morning`, minC: 2, maxC: 8 }]);
    expect(r.items.map((i) => i.id)).toEqual(['KL02', 'KL05', 'KL08']);
    expect(r.items.every((i) => i.sets.includes(r.key) && i.updatedAt === 'now')).toBe(true);
    const kits = tempKits(allSets(r.value));
    expect(kits).toHaveLength(1);
    expect(chooseKit(kits, 5)?.key).toBe(r.key);
  });
  it('an open border, a minus sign and the errors', () => {
    expect(kitFromOutfit([], KIT, { name: 'x', maxC: '−2', ids: ['KL06'] }).value[0]).toMatchObject({ maxC: -2 });
    expect(kitFromOutfit([], KIT, { name: 'x', minC: '', maxC: '', ids: ['KL06'] })).toEqual({ error: 'range' });
    expect(kitFromOutfit([], KIT, { name: 'x', minC: 9, maxC: 3, ids: ['KL06'] })).toEqual({ error: 'range' });
    expect(kitFromOutfit([], KIT, { name: 'x', minC: 1, ids: [] })).toEqual({ error: 'none' });
    expect(kitFromOutfit([], KIT, { name: ' ', minC: 1, ids: ['KL06'] })).toEqual({ error: 'empty' });
    expect(kitFromOutfit([{ key: 'u-x', name: 'x' }], KIT, { name: 'X', minC: 1, ids: ['KL06'] })).toEqual({ error: 'taken' });
    expect(rangeAround(4.4)).toEqual({ minC: 1, maxC: 7 });
    expect(rangeAround(null)).toEqual({ minC: '', maxC: '' });
  });
});

describe('import page fixes (0.45)', () => {
  it('the status line follows the last apply', () => {
    expect(stagedStatus({ at: '2026-10-09T07:00:00Z' }, null)).toEqual({ text: 'nothing applied yet', at: null });
    expect(stagedStatus({ at: '2026-10-09T07:00:00Z' }, { at: '2026-10-09T07:45:00Z' })).toEqual({ text: 'applied {when}', at: '2026-10-09T07:45:00Z' });
    // an older apply of an earlier file does not count for a newly chosen one
    expect(stagedStatus({ at: '2026-10-09T08:00:00Z' }, { at: '2026-10-09T07:45:00Z' }).at).toBeNull();
    expect(stagedStatus({ at: 'a', step1At: '2026-10-09T09:00:00Z' }, null).at).toBe('2026-10-09T09:00:00Z');
  });
  it('an apply that changed nothing', () => {
    expect(appliedNothing({ enriched: 0, merged: 0, added: 0, learningsAdded: 0, learningsUpdated: 0, unchanged: 9 })).toBe(true);
    expect(appliedNothing({ enriched: 1 })).toBe(false);
    expect(appliedNothing({ learningsUpdated: 1 })).toBe(false);
  });
});
