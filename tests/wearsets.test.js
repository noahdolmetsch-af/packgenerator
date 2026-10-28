// «Kleider-Sets», step 2 of «Was ziehe ich an? selbst anpassen» (Noah 27.10.2026 «1a 2a oder b 3a 5a»).
// Fictional data only.
import { describe, it, expect } from 'vitest';
import { outfitFor, chooseKit, tempKits } from '../src/lib/wardrobe.js';
import { WEAR_PRESETS, presetKey } from '../src/lib/wearpresets.js';
import { allSets } from '../src/lib/sets.js';
import { NONE, applyDay, dayChoice, dayRecord, withPick, withSet } from '../src/lib/home/wearday.js';
import { AUTO, seedPlan, wearSets, matchSet, activeSet, orderedSets, setOutfit, setRowPlan, fillPlan, rangePlan, readC } from '../src/lib/home/wearsets.js';

const P = 'test_data_gtp_';
const item = (id, name, f = {}) => ({ id, name: `${P}${name}`, category: 'onbike', weightG: 100, qty: 1, ownership: 'owned', sets: [], domains: ['bikepacking'], ...f });
const ITEMS = [
  item('B1', 'Base sleeveless', { layer: 'base', zone: 'torso', tempMin: 5, tempMax: 25 }),
  item('B2', 'Jersey short', { layer: 'base', zone: 'torso', tempMin: 16, tempMax: 35 }),
  item('M1', 'Long jersey thin', { layer: 'mid', zone: 'torso', tempMin: 10, tempMax: 18 }),
  item('M2', 'Long jersey thick', { layer: 'mid', zone: 'torso', tempMin: 2, tempMax: 12 }),
  item('O1', 'Wind vest', { layer: 'outer', zone: 'torso', tempMin: 0, tempMax: 14 }),
  item('O2', 'Rain jacket', { layer: 'outer', zone: 'torso', tempMin: 0, tempMax: 20, rain: 'rain' }),
  item('L1', 'Bib long', { layer: 'base', zone: 'legs', tempMin: 0, tempMax: 12 }),
  item('L2', 'Bib short', { layer: 'base', zone: 'legs', tempMin: 14, tempMax: 35 }),
  item('H1', 'Gloves long', { layer: 'accessory', zone: 'hands', tempMin: 0, tempMax: 12 }),
  item('E1', 'Office shirt', { layer: 'base', zone: 'torso', domains: ['everyday'] }),
];
const DATE = '2026-10-27';
const fc = (c) => ({ days: [{ date: DATE, min: c, max: c + 6, hourly: { t: Array(24).fill(c), p: Array(24).fill(0) } }] });

describe('the nine sample sets (3a)', () => {
  it('are made once, with the pieces the onion picks at their temperature', () => {
    const plan = seedPlan([], ITEMS, 'now');
    expect(plan.added).toBe(9);
    expect(plan.value.map((s) => s.preset)).toEqual(WEAR_PRESETS.map((p) => p.preset));
    const inSet = (key) => plan.items.filter((i) => i.sets.includes(key)).map((i) => i.id).sort();
    expect(inSet(presetKey('short'))).toEqual(['B2', 'L2']);
    expect(inSet(presetKey('long'))).toEqual(['B1', 'H1', 'L1', 'M2', 'O1']);
    expect(inSet(presetKey('everyday'))).toContain('E1');
    expect(plan.items.find((i) => i.id === 'O2').sets).toContain(presetKey('rain'));
    // again: nothing new; a deleted one stays away (seeding runs once, see WEAR_SEEDED)
    expect(seedPlan(plan.value, plan.items).added).toBe(0);
  });
  it('show their label until renamed, and keep range and rain', () => {
    const { value } = seedPlan([], []);
    const sets = wearSets(value);
    expect(sets).toHaveLength(9);
    expect(sets.find((s) => s.key === presetKey('long'))).toMatchObject({ name: 'Long top and bottom', minC: 5, maxC: 12 });
    expect(sets.find((s) => s.key === presetKey('rain')).rain).toBe(true);
    const renamed = value.map((s) => (s.key === presetKey('long') ? { ...s, name: `${P}Herbst` } : s));
    expect(allSets(renamed).find((s) => s.key === presetKey('long')).name).toBe(`${P}Herbst`);
  });
});

describe('which set fits (1a)', () => {
  const sets = wearSets(seedPlan([], []).value);
  it('by temperature, rain below 18 °C', () => {
    expect(matchSet(sets, 8, false).preset).toBe('long');
    expect(matchSet(sets, 15, false).preset).toBe('between');
    expect(matchSet(sets, 22, false).preset).toBe('short');
    expect(matchSet(sets, -3, false).preset).toBe('cold');
    expect(matchSet(sets, 33, false).preset).toBe('hot');
    expect(matchSet(sets, 10, true).preset).toBe('rain');
    expect(matchSet(sets, 24, true).preset).toBe('short');
  });
  it('your own kit comes before a sample set, in Pack too (5a)', () => {
    const own = { key: 'u-herbst', name: `${P}Herbst`, minC: 4, maxC: 15 };
    const value = [...seedPlan([], []).value, own];
    expect(matchSet(wearSets(value), 8).key).toBe('u-herbst');
    expect(chooseKit(tempKits(value), 8).key).toBe('u-herbst');
  });
  it('your choice of the day, Automatic, and the chip order', () => {
    const m = matchSet(sets, 8);
    expect(activeSet(sets, undefined, m).preset).toBe('long');
    expect(activeSet(sets, AUTO, m)).toBeNull();
    expect(activeSet(sets, presetKey('camp'), m).preset).toBe('camp');
    expect(orderedSets(sets, m)[0].key).toBe(m.key);
    expect(dayChoice(dayRecord(DATE, withSet({ pick: {}, add: [] }, AUTO)), DATE).set).toBe(AUTO);
    expect(withPick(withSet({ pick: {}, add: [] }, 'x'), 'mid', 'M1').set).toBe('x');
  });
});

describe('the set on top of the suggestion', () => {
  const seeded = seedPlan([], ITEMS);
  const items = ITEMS.map((i) => seeded.items.find((x) => x.id === i.id) ?? i);
  const sets = wearSets(seeded.value);
  const out = outfitFor(fc(8), items, { date: DATE, start: 8, hours: 2 });
  it('its pieces first; a row it has nothing for comes from the app', () => {
    const between = sets.find((s) => s.preset === 'between');
    const rows = setOutfit(out, between, items).rows;
    expect(rows.find((r) => r.key === 'mid')).toMatchObject({ fromSet: true, light: false });
    expect(rows.find((r) => r.key === 'hands')).toMatchObject({ fromSet: false });
    expect(rows.find((r) => r.key === 'hands').item.id).toBe('H1');
  });
  it('a set piece that is too light says so', () => {
    const short = sets.find((s) => s.preset === 'short');
    const legs = setOutfit(out, short, items).rows.find((r) => r.key === 'legs');
    expect(legs).toMatchObject({ fromSet: true, light: true });
    expect(legs.item.id).toBe('L2');
  });
  it('a pick of the day still wins', () => {
    const long = sets.find((s) => s.preset === 'long');
    const rows = applyDay(setOutfit(out, long, items), items, { pick: { mid: 'M1' }, add: [] }).rows;
    expect(rows.find((r) => r.key === 'mid')).toMatchObject({ mine: true, fromSet: false });
    expect(rows.find((r) => r.key === 'base')).toMatchObject({ mine: false, fromSet: true });
  });
});

describe('a swap saved in the set (2b)', () => {
  const seeded = seedPlan([], ITEMS);
  const items = ITEMS.map((i) => seeded.items.find((x) => x.id === i.id) ?? i);
  const key = presetKey('long');
  it('the new piece in, the old one of that row out', () => {
    const p = setRowPlan(seeded.value, items, key, 'mid', 'M1', 'now');
    expect(p.items.map((i) => [i.id, i.sets.includes(key)]).sort()).toEqual([['M1', true], ['M2', false]]);
    expect(p.before.map((i) => i.id).sort()).toEqual(['M1', 'M2']);
  });
  it('none leaves the row out in the set, null gives it back to the app', () => {
    const off = setRowPlan(seeded.value, items, key, 'hands', NONE, 'now');
    expect(off.value.find((s) => s.key === key).off).toEqual(['hands']);
    expect(off.items.find((i) => i.id === 'H1').sets).not.toContain(key);
    const back = setRowPlan(off.value, items, key, 'hands', null, 'now');
    expect(back.value.find((s) => s.key === key).off).toBeUndefined();
    const out = outfitFor(fc(8), items, { date: DATE, start: 8, hours: 2 });
    const set = wearSets(off.value).find((s) => s.key === key);
    expect(setOutfit(out, set, items).rows.find((r) => r.key === 'hands')).toMatchObject({ item: null, setOff: true });
  });
  it('fill an empty set with what the window shows', () => {
    const empty = seedPlan([], []);
    const camp = presetKey('camp');
    const out = outfitFor(fc(8), ITEMS, { date: DATE, start: 8, hours: 2 });
    const p = fillPlan(empty.value, ITEMS, camp, out.rows, 'now');
    expect(p.items.map((i) => i.id).sort()).toEqual(out.rows.filter((r) => r.item).map((r) => r.item.id).sort());
    expect(p.items.every((i) => i.sets.includes(camp))).toBe(true);
  });
});

describe('the °C range of a set (Noah «2a»)', () => {
  const value = [{ key: 'w-long', name: 'Long', preset: 'long', minC: 5, maxC: 12 }, { key: 'w-rain', preset: 'rain', rain: true }];
  it('reads typed borders: empty is none, comma and minus work', () => {
    expect(readC('')).toBeUndefined();
    expect(readC(' 7 ')).toBe(7);
    expect(readC('−3')).toBe(-3);
    expect(readC('4,6')).toBe(5);
    expect(readC('warm')).toBeNaN();
  });
  it('changes only that set, keeps its other fields', () => {
    const r = rangePlan(value, 'w-long', '3', '14');
    expect(r.value[0]).toEqual({ key: 'w-long', name: 'Long', preset: 'long', minC: 3, maxC: 14 });
    expect(r.value[1]).toBe(value[1]);
  });
  it('an empty border is removed', () => {
    expect(rangePlan(value, 'w-long', '', '14').value[0]).toEqual({ key: 'w-long', name: 'Long', preset: 'long', maxC: 14 });
  });
  it('the new range is what the window and Pack use', () => {
    const two = [...value, { key: 'w-between', preset: 'between', minC: 12, maxC: 18 }];
    expect(matchSet(two, 13)?.key).toBe('w-between');
    expect(matchSet(rangePlan(two, 'w-long', '3', '14').value, 13)?.key).toBe('w-long');
  });
  it('refuses text and a «from» above «to»', () => {
    expect(rangePlan(value, 'w-long', 'x', '3')).toEqual({ error: 'number' });
    expect(rangePlan(value, 'w-long', '15', '3')).toEqual({ error: 'order' });
  });
});
