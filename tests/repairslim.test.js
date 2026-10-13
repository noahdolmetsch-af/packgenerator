import { describe, it, expect } from 'vitest';
import { SLIM_MAX, needsSlim, roadRank, slimSuggest, applySlim, undoSlim, newTripOff, repairItems } from '../src/lib/repairslim.js';

// v0.123.0 «Neue Tour Teil 2», B5 «Reparatur unterwegs»: fictional workshop only.
const it0 = (id, name, weightG, extra = {}) => ({ id, name, weightG, category: 'tools', ownership: 'owned', sets: ['repair'], ...extra });
const WORKSHOP = [
  it0('t1', 'test_data_gtp_ Ersatzschlauch', 110),
  it0('t2', 'test_data_gtp_ Minipumpe', 90),
  it0('t3', 'test_data_gtp_ Multitool', 160),
  it0('t4', 'test_data_gtp_ Reifenheber 2×', 20),
  it0('t5', 'test_data_gtp_ Kettenschloss', 5),
  it0('t6', 'test_data_gtp_ Flickzeug', 15),
  it0('t7', 'test_data_gtp_ Tubeless-Würste', 30),
  it0('t8', 'test_data_gtp_ Kabelbinder 5×', 10),
  it0('t9', 'test_data_gtp_ Standpumpe', 1600),
  it0('t10', 'test_data_gtp_ Kettennieter', 120),
  it0('t11', 'test_data_gtp_ Drehmomentschlüssel', 310),
  it0('t12', 'test_data_gtp_ Montageständer', 4200),
  it0('t13', 'test_data_gtp_ Kettenöl gross', 300),
  it0('t14', 'test_data_gtp_ Ventilschlüssel', 8),
  it0('t15', 'test_data_gtp_ Schwerer Koffer', 900),
  it0('w1', 'test_data_gtp_ Wunschpumpe', 80, { ownership: 'wish' }),
  it0('o1', 'test_data_gtp_ Jacke', 300, { sets: [], category: 'onbike' }),
];

describe('Reparatur unterwegs (B5)', () => {
  it('needs slimming only above 8 owned parts', () => {
    expect(SLIM_MAX).toBe(8);
    expect(repairItems(WORKSHOP).length).toBe(15);
    expect(needsSlim(WORKSHOP)).toBe(true);
    expect(needsSlim(WORKSHOP.slice(0, 8))).toBe(false);
    expect(needsSlim([])).toBe(false);
  });
  it('workshop tools and heavy unnamed things never go on the ride', () => {
    for (const id of ['t9', 't10', 't11', 't12', 't13', 't15']) expect(roadRank(WORKSHOP.find((i) => i.id === id)), id).toBe(Infinity);
    expect(roadRank(WORKSHOP[0])).toBe(0); // the tube first
  });
  it('suggests the 8 ride parts, ride parts first, never a wish', () => {
    const s = slimSuggest(WORKSHOP);
    expect(s.picked).toEqual(['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8']);
    expect(s.rows.length).toBe(15);
    expect(s.rows.slice(0, 8).map((i) => i.id)).toEqual(s.picked);
    expect(s.rows.some((i) => i.id === 'w1')).toBe(false);
  });
  it('keeps the chosen parts, takes Repair off the rest (they stay in Gear), undo puts them back', () => {
    const keep = ['t1', 't2', 't3'];
    const r = applySlim(WORKSHOP, keep, '2026-10-13T10:00:00Z');
    expect(r.workshop.length).toBe(12);
    expect(r.items.every((i) => !i.sets.includes('repair') && i.updatedAt === '2026-10-13T10:00:00Z')).toBe(true);
    expect(r.workshop).not.toContain('t1');
    const after = WORKSHOP.map((i) => r.items.find((x) => x.id === i.id) ?? i);
    expect(repairItems(after).map((i) => i.id)).toEqual(keep);
    const back = undoSlim(after, r.workshop, '2026-10-13T10:01:00Z');
    expect(back.length).toBe(12);
    expect(back.every((i) => i.sets.includes('repair'))).toBe(true);
    expect(undoSlim(WORKSHOP, r.workshop)).toEqual([]); // nothing to undo when they are in it
  });
  it('never more than 8', () => {
    expect(applySlim(WORKSHOP, ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9'])).toEqual({ items: [], workshop: [] });
  });
  it('a new trip: a slim Repair comes (a suggestion), a full one stays off; Charging always off', () => {
    expect(newTripOff(WORKSHOP)).toEqual(['repair', 'charge']);
    expect(newTripOff(WORKSHOP.slice(0, 8))).toEqual(['charge']);
  });
});
