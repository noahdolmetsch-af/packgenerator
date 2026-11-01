// v0.83.0 «Ausstattung» (Noah 11.10.2026, A1–A5 a): every part of a bike in groups with name, details,
// weight and price; empty parts folded; totals and the top 3 by price; the price in the spec import;
// the address of «Ausstattung» and «Compare bikes». Fictional bike, pure functions.
import './setup/de.js'; // this test needs the German texts
import { describe, it, expect } from 'vitest';
import { equipmentGroups, equipmentTotals, setPartBasics, partDetails } from '../src/lib/equipment.js';
import { planSpecs, applySpecs } from '../src/lib/bikespecs.js';
import { parseBikesHash, bikesHash } from '../src/lib/bikes.js';
import { AREAS } from '../src/lib/care.js';

const bike = () => ({
  id: 'test_data_gtp_goat',
  name: 'test_data_gtp_ Bergziege 29',
  type: 'fully',
  parts: [
    { key: 'cassette', model: 'test_data_gtp_ Zahnkranz 10-51', weightG: 410, priceChf: 260, attrs: { cogs: '12' }, history: [] },
    { key: 'chain', model: 'test_data_gtp_ Glied 12', weightG: 250, history: [] },
    { key: 'brakeF', model: 'test_data_gtp_ Stopper 4', weightG: 250, priceChf: 180, attrs: { pistons: '4' }, history: [] },
    { key: 'rotorF', model: 'test_data_gtp_ Rundling', attrs: { dia: 180 }, material: 'Stahl', history: [] },
    { key: 'frame', model: 'test_data_gtp_ Rahmen Carbon', weightG: 1520, priceChf: 1900, history: [] },
  ],
});

describe('Ausstattung: groups like Canyon (A1a, A2a)', () => {
  const groups = equipmentGroups(bike());
  const g = (a) => groups.find((x) => x.area === a);

  it('one group per area in the order of the part list, the check points left out', () => {
    expect(groups.map((x) => x.area)).toEqual(AREAS.map((a) => a.key).filter((k) => k !== 'checks' && groups.some((x) => x.area === k)));
    expect(groups.some((x) => x.area === 'checks')).toBe(false);
  });

  it('a part with a name is a row with category, name, details, weight and price', () => {
    const drive = g('drive');
    expect(drive.rows.map((r) => r.key)).toEqual(['cassette', 'chain']);
    expect(drive.rows[0]).toMatchObject({ model: 'test_data_gtp_ Zahnkranz 10-51', weightG: 410, priceChf: 260, details: '12' });
    expect(drive.rows[1].priceChf).toBeNull();
    expect(g('brakes').rows.find((r) => r.key === 'rotorF').details).toBe('180 mm · Stahl');
  });

  it('parts without a name fold into the group’s empty list (A2a)', () => {
    const drive = g('drive');
    expect(drive.empty.length).toBeGreaterThan(0);
    expect(drive.empty.every((r) => r.model === '')).toBe(true);
    expect(drive.empty.map((r) => r.key)).toContain('shifting');
  });

  it('each group sums weight and price of its named parts (A3a)', () => {
    expect(g('drive')).toMatchObject({ count: 2, weightG: 660, priceChf: 260 });
    expect(g('brakes')).toMatchObject({ count: 2, weightG: 250, priceChf: 180 });
  });
});

describe('Ausstattung: totals and the most expensive parts (A3a, A4a)', () => {
  it('sums every group, counts the missing prices, keeps the top 3 by price', () => {
    const tot = equipmentTotals(equipmentGroups(bike()));
    expect(tot).toMatchObject({ count: 5, weightG: 2430, priceChf: 2340, noPrice: 2, noWeight: 1 });
    expect(tot.top.map((r) => r.key)).toEqual(['frame', 'cassette', 'brakeF']);
  });
});

describe('Ausstattung: one part edited in the sheet', () => {
  it('name, weight and price are stored; an empty value clears it', () => {
    const { parts } = setPartBasics(bike(), 'chain', { model: ' test_data_gtp_ Glied 12+ ', weightG: 245, priceChf: 45 });
    expect(parts.find((p) => p.key === 'chain')).toMatchObject({ model: 'test_data_gtp_ Glied 12+', weightG: 245, priceChf: 45 });
    const cleared = setPartBasics(bike(), 'cassette', { model: 'test_data_gtp_ Zahnkranz 10-51', weightG: null, priceChf: null }).parts.find((p) => p.key === 'cassette');
    expect(cleared.weightG).toBeUndefined();
    expect(cleared.priceChf).toBeUndefined();
    expect(cleared.history).toEqual([]);
  });

  it('the details line skips empty attributes', () => {
    expect(partDetails({ key: 'cassette', attrs: { cogs: '', range: '10-51' } })).toBe('10-51');
  });
});

describe('Ausstattung: the price in the spec import (A3a)', () => {
  it('«Preis» fills priceChf; a pair splits it in half like the weight', () => {
    const plan = planSpecs(bike(), { bike: 'x', parts: [{ part: 'Kette', preis: 45 }, { part: 'Scheibenbremse', price: 360 }], geometry: {}, fit: {} });
    const out = applySpecs(bike(), plan);
    expect(out.parts.find((p) => p.key === 'chain').priceChf).toBe(45);
    expect(out.parts.find((p) => p.key === 'brakeR').priceChf).toBe(180);
    expect(plan.conflicts.some((c) => c.field === 'priceChf' && c.key === 'brakeF')).toBe(false);
  });
});

describe('Ausstattung and «Compare bikes» addresses (A1a, A5a)', () => {
  it('tab=compare is the equipment, &view=all the comparison', () => {
    expect(parseBikesHash('#/bikes?tab=compare')).toEqual({ tab: 'compare', bike: null, open: false });
    expect(parseBikesHash('#/bikes?tab=compare&view=all').view).toBe('all');
    expect(bikesHash({ tab: 'compare', view: 'all' })).toBe('#/bikes?tab=compare&view=all');
    expect(bikesHash({ tab: 'compare', bike: 'b1' })).toBe('#/bikes?tab=compare&bike=b1');
    expect(bikesHash({ tab: 'setup', view: 'all' })).toBe('#/bikes');
  });
});
