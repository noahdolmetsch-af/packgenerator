// «Was ziehe ich an? selbst anpassen» step 3 (Noah 27.10.2026 «4a»): your own borders, «you get cold»,
// lighter or warmer first; the same rule on Today and in Pack. Fictional data only.
import { describe, it, expect } from 'vitest';
import { ONION_LIMITS, wearRule, stepLimit, ruleChanged, outfitFor, onionCheck, best, FEELS } from '../src/lib/wardrobe.js';
import { WHY_LIMITS } from '../src/lib/home/wearday.js';

const P = 'test_data_gtp_';
const item = (id, f = {}) => ({ id, name: `${P}${id}`, category: 'onbike', weightG: 100, qty: 1, ownership: 'owned', sets: [], domains: ['bikepacking'], ...f });
const ITEMS = [
  item('B1', { layer: 'base', zone: 'torso', tempMin: 5, tempMax: 25 }),
  item('M1', { layer: 'mid', zone: 'torso', tempMin: 8, tempMax: 18 }),
  item('M2', { layer: 'mid', zone: 'torso', tempMin: 0, tempMax: 18 }),
  item('L1', { layer: 'base', zone: 'legs', tempMin: 0, tempMax: 15 }),
  item('H1', { layer: 'accessory', zone: 'hands', tempMin: 0, tempMax: 14 }),
];
const DATE = '2026-10-27';
const fc = (c) => ({ days: [{ date: DATE, min: c, max: c, hourly: { t: Array(24).fill(c), p: Array(24).fill(0) } }] });
const keys = (o) => o.rows.map((r) => r.key);

describe('the rule', () => {
  it('standard without a record, the same borders as «Why so?»', () => {
    expect(wearRule(null)).toEqual({ limits: ONION_LIMITS, feel: 'normal', shift: 0, prefer: 'light' });
    for (const [k, n] of Object.entries(WHY_LIMITS)) expect(ONION_LIMITS[k]).toBe(n);
    expect(ruleChanged(null)).toBe(false);
  });
  it('a border steps by 1 °C and leaves the record when back at the standard', () => {
    const v = stepLimit({}, 'hands', 2);
    expect(v).toEqual({ limits: { hands: 14 } });
    expect(wearRule(v).limits.hands).toBe(14);
    expect(ruleChanged(v)).toBe(true);
    expect(stepLimit(v, 'hands', -2)).toEqual({});
    expect(wearRule({ limits: { mid: 99 } }).limits.mid).toBe(30);
  });
  it('feel and prefer', () => {
    expect(wearRule({ feel: 'cold' }).shift).toBe(FEELS.cold);
    expect(wearRule({ feel: 'x' }).feel).toBe('normal');
    expect(wearRule({ prefer: 'warm' }).prefer).toBe('warm');
  });
});

describe('the rule changes the suggestion', () => {
  it('a higher border brings the row sooner, on Today and in Pack', () => {
    const rule = wearRule(stepLimit({}, 'hands', 2));
    expect(keys(outfitFor(fc(13), ITEMS, { date: DATE }))).not.toContain('hands');
    expect(keys(outfitFor(fc(13), ITEMS, { date: DATE, rule }))).toContain('hands');
    const trip = { startDate: DATE, days: 1, hours: 2, rideStart: ['08:00'], forecast: fc(13), entries: [{ itemId: 'B1' }] };
    expect(onionCheck(trip, ITEMS, 0, rule).rows.find((r) => r.key === 'hands')).toMatchObject({ need: true, below: 14 });
    expect(onionCheck(trip, ITEMS, 0).rows.find((r) => r.key === 'hands')).toBeUndefined();
  });
  it('warmer first picks the lower border', () => {
    expect(best([ITEMS[1], ITEMS[2]], 10).id).toBe('M1');
    expect(best([ITEMS[1], ITEMS[2]], 10, 'warm').id).toBe('M2');
    expect(outfitFor(fc(10), ITEMS, { date: DATE, rule: wearRule({ prefer: 'warm' }) }).rows.find((r) => r.key === 'mid').item.id).toBe('M2');
  });
});
