// v0.48.0 «Teile pro Velo»: one part list (spec + care), the bikeSpecs import, the comparison table.
// Fictional bike only (test_data_gtp_ «Bergziege»), never a real spec sheet.
import { describe, it, expect } from 'vitest';
import { ensureParts, PART, PARTS, isMore } from '../src/lib/care.js';
import { withVisits } from '../src/lib/workshop.js';
import { isSpecsFile, specEntries, findBike, planSpecs, applySpecs, partKeys, geoKey, readValue, compareRows, setSpec, specValue, areaWeight, hasSpecs } from '../src/lib/bikespecs.js';

const P = 'test_data_gtp_';
const goat = () => ({
  id: `${P}goat`, name: `${P} Bergziege 29`, type: 'hardtail', km: 2100,
  parts: [{ key: 'chain', model: 'Kettenwerk K11', history: [{ date: '2026-09-01', km: 2000, action: 'service', result: 'done' }] }],
});
const FILE = {
  kind: 'bikeSpecs',
  bike: `${P} bergziege 29`,
  parts: [
    { area: 'Antrieb', part: 'Kette', model: 'Kettenwerk K12', weightG: 250 },
    { area: 'Antrieb', part: 'Kassette', model: 'Zahnkranz 10-50', weightG: '380 g', attrs: { Ritzel: '10-50', Übersetzung: '500 %' } },
    { area: 'Bremsen', part: 'Scheibenbremse', model: 'Stopper 4', weightG: 500, attrs: { Kolben: 4 } },
    { area: 'Bremsen', part: 'Bremsscheiben', model: 'Rundling', attrs: { 'Durchmesser vorne': 180, 'Durchmesser hinten': '160 mm' } },
    { area: 'Räder', part: 'Laufräder', model: 'Rundum 29', attrs: { Laufradgrösse: '29"', 'Achsdimension vorne': '15x110', 'Achsdimension hinten': '12x148' } },
    { area: 'Räder', part: 'Reifen vorne', model: 'Greif 2.4', attrs: { Breite: '2.4' } },
    { area: 'Räder', part: 'Reifen hinten', model: 'Roll 2.25', attrs: { Breite: '2.25' } },
    { area: 'Rahmen', part: 'Gabel', model: 'Federling 120', attrs: { Federweg: 120, Offset: '44 mm' } },
    { area: 'Cockpit', part: 'Cockpit/Lenker+Vorbau', model: 'Bügel 760', dims: '760 mm, 50 mm' },
    { area: 'Zubehör', part: 'Klingel', model: 'Ding', weightG: 30 },
    { area: 'Cockpit', part: 'Sattelstütze', model: 'Hebel 150', attrs: { Hub: 150, Klemmdurchmesser: 31.6, Gewinde: 'M5' } },
  ],
  geometry: { Stack: 620, Reach: '455', Lenkwinkel: '66,5°', Tretlager_Offset: 55, 'Tretlager-Offset': 60 },
};

describe('one part list for every bike', () => {
  it('gives every bike the whole template, front and rear separate, the old parts only with a history', () => {
    const keys = ensureParts({ type: 'gravel', parts: [] }).map((p) => p.key);
    for (const k of ['frame', 'shock', 'fork', 'brakeF', 'brakeR', 'rotorF', 'rotorR', 'wheelF', 'wheelR', 'tyres', 'grips', 'seatpost', 'charger']) expect(keys).toContain(k);
    expect(keys).not.toContain('brakes');
    expect(keys).not.toContain('wheels');
    expect(keys).not.toContain('linkage');
    const old = ensureParts({ type: 'gravel', parts: [{ key: 'wheels', model: '', history: [{ date: '2026-01-01', action: 'service' }] }] }).map((p) => p.key);
    expect(old).toContain('wheels');
    expect(old).toContain('wheelF');
    // A visit that still names the old part brings it back, so its history stays.
    const view = withVisits({ type: 'gravel', id: 'b', parts: [] }, [{ id: 'v', bikeId: 'b', date: '2026-02-01', parts: [{ part: 'brakes', action: 'service' }] }]);
    expect(view.parts.find((p) => p.key === 'brakes').history).toHaveLength(1);
  });

  it('keeps the parts and the history that were there', () => {
    const parts = ensureParts(goat());
    expect(parts.find((p) => p.key === 'chain')).toMatchObject({ model: 'Kettenwerk K11' });
    expect(parts.find((p) => p.key === 'chain').history).toHaveLength(1);
    expect(parts.length).toBeGreaterThan(25);
  });

  it('shows the key parts and puts the rest under More', () => {
    expect(isMore(PART.frame)).toBe(true);
    expect(isMore(PART.cassette)).toBe(false);
    expect(isMore({ key: 'own-bell' })).toBe(true);
    expect(PARTS.filter((p) => p.spec && !p.more).map((p) => p.key)).toEqual(['cassette', 'shifting', 'shifter', 'crank', 'bb', 'chain', 'brakeF', 'brakeR', 'rotorF', 'rotorR', 'wheelF', 'wheelR', 'tyres', 'grips', 'seatpost']);
  });
});

describe('the bikeSpecs import', () => {
  it('knows the file and finds the bike by its name', () => {
    expect(isSpecsFile(FILE)).toBe(true);
    expect(isSpecsFile({ kind: 'gear' })).toBe(false);
    expect(findBike([goat(), { id: 'x', name: 'Other' }], FILE.bike).id).toBe(`${P}goat`);
    expect(findBike([goat()], 'nothing')).toBe(null);
    expect(specEntries({ kind: 'bikeSpecs', bikes: [{ bike: 'a' }, { bike: 'b' }] })).toHaveLength(2);
  });

  it('reads part names, pairs and numbers', () => {
    expect(partKeys('Bremsscheiben')).toEqual(['rotorF', 'rotorR']);
    expect(partKeys('Bremsscheibe hinten')).toEqual(['rotorR']);
    expect(partKeys('Scheibenbremse')).toEqual(['brakeF', 'brakeR']);
    expect(partKeys('Lenker + Vorbau')).toEqual(['cockpit']);
    expect(partKeys('Ladegerät')).toEqual(['charger']);
    expect(geoKey('Lenkwinkel')).toBe('headAngle');
    expect(geoKey('Tretlager-Offset')).toBe('bbDrop');
    expect(readValue('66,5°', true)).toBe(66.5);
    expect(readValue('15x110', true)).toBe('15x110');
  });

  it('fills the empty fields, maps one entry to front and rear, asks before overwriting', () => {
    const plan = planSpecs(goat(), specEntries(FILE)[0]);
    const fill = (id) => plan.fills.find((c) => c.id === id)?.value;
    expect(plan.conflicts.map((c) => c.id)).toEqual(['part:chain:model']);
    expect(fill('part:brakeF:model')).toBe('Stopper 4');
    expect(fill('part:brakeR:attrs.pistons')).toBe(4);
    expect(fill('part:brakeF:weightG')).toBe(250); // one weight for the pair, split
    expect(fill('part:rotorF:attrs.dia')).toBe(180);
    expect(fill('part:rotorR:attrs.dia')).toBe(160);
    expect(fill('part:wheelF:attrs.axle')).toBe('15x110');
    expect(fill('part:wheelR:attrs.axle')).toBe('12x148');
    expect(fill('part:wheelR:attrs.size')).toBe('29"');
    expect(fill('part:tyres:model')).toBe('Greif 2.4');
    expect(fill('part:tyres:attrs.modelR')).toBe('Roll 2.25');
    expect(fill('part:tyres:attrs.widthF')).toBe('2.4');
    expect(fill('part:tyres:attrs.widthR')).toBe('2.25');
    expect(fill('part:fork:attrs.travel')).toBe(120);
    expect(fill('part:fork:attrs.offset')).toBe(44);
    expect(fill('part:cockpit:attrs.dims')).toBe('760 mm, 50 mm');
    expect(fill('part:seatpost:attrs.travel')).toBe(150);
    expect(fill('geo:headAngle:value')).toBe(66.5);
    expect(fill('geo:reach:value')).toBe(455);
    expect(plan.added).toEqual(['Klingel']);
    expect(plan.unknown).toEqual(['Seatpost: Gewinde', 'Tretlager_Offset']);
  });

  it('keeps a filled field unless allowed, never touches the history', () => {
    const bike = goat();
    const plan = planSpecs(bike, specEntries(FILE)[0]);
    const kept = applySpecs(bike, plan);
    const chain = kept.parts.find((p) => p.key === 'chain');
    expect(chain.model).toBe('Kettenwerk K11');
    expect(chain.weightG).toBe(250);
    expect(chain.history).toHaveLength(1);
    expect(kept.parts.find((p) => p.key === 'own-klingel')).toMatchObject({ name: 'Klingel', area: 'extras', model: 'Ding', weightG: 30 });
    expect(kept.geometry).toMatchObject({ stack: 620, reach: 455, headAngle: 66.5 });
    const over = applySpecs(bike, plan, new Set(['part:chain:model']));
    expect(over.parts.find((p) => p.key === 'chain').model).toBe('Kettenwerk K12');
    // The same file again: nothing new, nothing to ask.
    const again = planSpecs({ ...bike, ...over }, specEntries(FILE)[0]);
    expect(again.fills).toEqual([]);
    expect(again.conflicts).toEqual([]);
  });
});

describe('compare bikes', () => {
  it('one row per field and attribute, the key values on top, differences marked', () => {
    const a = { ...goat(), ...applySpecs(goat(), planSpecs(goat(), specEntries(FILE)[0])) };
    const b = { id: 'b', name: `${P} Flachland`, type: 'gravel', parts: [{ key: 'chain', model: 'Kettenwerk K12', history: [] }], geometry: { reach: 455, stack: 600 } };
    const c = compareRows([a, b]);
    expect(c.top.map((r) => r.label)).toEqual(['Travel front', 'Travel rear', 'Stack', 'Reach', 'Wheel size']);
    expect(c.top.find((r) => r.label === 'Stack')).toMatchObject({ values: [620, 600], differ: true });
    expect(c.top.find((r) => r.label === 'Reach')).toMatchObject({ values: [455, 455], differ: false });
    const drive = c.main.find((g) => g.area === 'drive');
    expect(drive.rows.find((r) => r.id === 'chain:model')).toMatchObject({ values: ['Kettenwerk K11', 'Kettenwerk K12'], differ: true });
    expect(drive.rows.find((r) => r.id === 'cassette:model').values).toEqual(['Zahnkranz 10-50', null]);
    expect(c.geo.rows).toHaveLength(11); // v0.65.0: the saddle height moved to the fit rows
    expect(c.more.find((g) => g.area === 'extras').rows.some((r) => r.key === 'own-klingel')).toBe(true);
    expect(areaWeight(a, 'brakes')).toMatchObject({ g: 500, known: 2 });
    expect(hasSpecs(b)).toBe(true);
    expect(hasSpecs({ parts: [] })).toBe(false);
  });

  it('sets and clears one value', () => {
    const b = goat();
    const upd = setSpec(b, 'grips', 'attrs.x', null);
    expect(upd.parts).toBeTruthy();
    const m = { ...b, ...setSpec(b, 'grips', 'model', 'Halt 1') };
    expect(specValue(m, 'grips', 'model')).toBe('Halt 1');
    const g = { ...b, ...setSpec(b, 'geo', 'stack', 610) };
    expect(specValue(g, 'geo', 'stack')).toBe(610);
    expect(setSpec(g, 'geo', 'stack', '').geometry.stack).toBeUndefined();
  });
});
