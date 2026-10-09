// v0.42.0 "Excel Schritt 2 und Kleiderschrank": the wardrobe, the onion check, the temperature kits,
// the border offset and step 2 of the import (kits, blocks, tasks, old trips). Fictional data only.
import { describe, it, expect } from 'vitest';
import { wardrobe, isClothing, guessLayer, guessZone, zoneGroup, tempRange, coldest, ridingHours, rainChance, withRainPct, isWet, clothingOffset, felt, chooseKit, kitFits, kitPlan, onionCheck, tempKits } from '../src/lib/wardrobe.js';
import { planStep2, buildStep2, similarBlock, tripSortDate, eventOf, validateStep2, hasStep2, withoutStep2, itemFinder } from '../src/lib/importstep2.js';
import { validateGearImport } from '../src/lib/gearimport.js';
import { prepFor, isLongTour, PREP_LIST } from '../src/lib/care.js';

const P = 'test_data_gtp_';
const item = (id, name, f = {}) => ({ id, name: `${P} ${name}`, category: 'onbike', weightG: 100, qty: 1, ownership: 'owned', sets: [], domains: ['bikepacking'], ...f });

const ITEMS = [
  item('C1', 'Merino Langarm', { layer: 'base', zone: 'torso', tempMin: 4, tempMax: 15, sourceId: 'M0001' }),
  item('C2', 'Thermotrikot', { layer: 'mid', zone: 'torso', tempMin: 4, tempMax: 12, sourceId: 'M0002' }),
  item('C3', 'Regenjacke leicht', { layer: 'outer', zone: 'torso', tempClass: 'mittel', category: 'rain', sourceId: 'M0003' }),
  item('C4', 'Weste winddicht', { layer: 'outer', zone: 'torso', tempMin: 8, tempMax: 20, sourceId: 'M0004' }),
  item('C5', 'Beinlinge dünn', { layer: 'mid', zone: 'legs', tempMin: 8, tempMax: 15, sourceId: 'M0005', mergedIds: ['M0050'] }),
  item('C6', 'Trägerhose kurz', { layer: 'base', zone: 'legs', tempMin: 12, tempMax: 30, sourceId: 'M0006' }),
  item('C7', 'Langfingerhandschuhe', { layer: 'accessory', zone: 'hands', tempMin: 4, tempMax: 14, sourceId: 'M0007' }),
  item('C8', 'Buff Merino', { layer: 'accessory', zone: 'neck', tempMin: 0, tempMax: 15, sourceId: 'M0008' }),
  item('C9', 'Stirnband', { layer: 'accessory', zone: 'head', tempMin: 4, tempMax: 12, sourceId: 'M0009', weightG: 25 }),
  item('C10', 'Unterhemd ärmellos', { domains: ['everyday'] }),
  item('C11', 'Windhose', {}),
  item('E1', 'Velocomputer', { category: 'elec', sourceId: 'M0101' }),
  item('E2', 'Powerbank', { category: 'elec', sourceId: 'M0102' }),
  item('E3', 'Ladekabel', { category: 'elec', sourceId: 'M0103' }),
  item('E4', 'Stirnlampe', { category: 'light', sourceId: 'M0104' }),
  item('G1', 'Alte Jacke', { ownership: 'gone', layer: 'outer', zone: 'torso' }),
];

describe('the wardrobe (#/wardrobe)', () => {
  it('knows clothing by category, layer or zone; gone items never', () => {
    expect(isClothing(ITEMS[0])).toBe(true);
    expect(isClothing(item('X', 'Zelt', { category: 'sleep' }))).toBe(false);
    expect(isClothing(item('X', 'Etwas', { category: 'sleep', zone: 'head' }))).toBe(true);
    expect(isClothing(ITEMS.find((i) => i.id === 'G1'))).toBe(false);
  });

  it('groups by layer first, then by zone; the import zones fold into five', () => {
    const w = wardrobe(ITEMS, 'all');
    expect(w.layers.map((l) => l.key)).toEqual(['base', 'mid', 'outer', 'accessory']);
    const acc = w.layers.find((l) => l.key === 'accessory');
    expect(acc.zones.map((z) => z.key)).toEqual(['hands', 'head']); // neck → head
    expect(zoneGroup('arms')).toBe('upper');
    // v0.45.0 (decision 10): C10 is everyday only, so not under Alle any more.
    expect(w.unsorted.map((u) => u.item.id).sort()).toEqual(['C11']);
  });

  it('guesses layer and zone from the name (the guess is only preselected)', () => {
    expect([guessLayer('Unterhemd ärmellos'), guessZone('Unterhemd ärmellos')]).toEqual(['base', 'upper']);
    expect([guessLayer('Windhose'), guessZone('Windhose')]).toEqual(['outer', 'legs']);
    expect([guessLayer('Mütze unter Helm'), guessZone('Mütze unter Helm')]).toEqual(['accessory', 'head']);
    const w = wardrobe(ITEMS, 'all');
    expect(w.unsorted.find((u) => u.item.id === 'C11')).toMatchObject({ layer: null, guessLayer: 'outer', guessZone: 'legs' });
  });

  it('filters by use: Velo, Alltag, Alle', () => {
    expect(wardrobe(ITEMS, 'velo').all.some((i) => i.id === 'C10')).toBe(false);
    expect(wardrobe(ITEMS, 'everyday').all.map((i) => i.id)).toEqual(['C10']);
    expect(wardrobe(ITEMS, 'all').n).toBe(10); // v0.45.0 (decision 10): without the everyday-only C10
  });

  it('shows a range, or below / above for an open end', () => {
    expect(tempRange(4, 15)).toBe('4–15 °C');
    expect(tempRange(null, 4)).toBe('below 4 °C');
    expect(tempRange(25, null)).toBe('above 25 °C');
    expect(tempRange(null, null)).toBe('');
  });
});

/* ---------- temperature ---------- */

const hourly = (temps, pcts = [], rest = 10) => ({ t: Array.from({ length: 24 }, (_, h) => temps[h] ?? rest), p: Array.from({ length: 24 }, (_, h) => pcts[h] ?? 0) });
const trip = (f = {}) => ({ id: 'tr', startDate: '2026-10-17', days: 2, hours: 6, entries: [], wx: { min: 6, max: 14, rain: 'none' }, ...f });

describe('the coldest riding hour (answer 5)', () => {
  it('rides from 08:00 for the hours per day, on every day', () => {
    const h = ridingHours(trip());
    expect(h).toHaveLength(12);
    expect(h[0]).toEqual({ date: '2026-10-17', hour: 8 });
    expect(h.at(-1)).toEqual({ date: '2026-10-18', hour: 13 });
    expect(ridingHours(trip({ rideStart: ['06:30'] }))[0].hour).toBe(6);
  });

  it('takes the coldest riding hour, not the night', () => {
    const t1 = trip({ forecast: { days: [{ date: '2026-10-17', hourly: hourly({ 3: -2, 8: 7, 9: 9 }) }, { date: '2026-10-18', hourly: hourly({ 8: 11 }) }] } });
    expect(coldest(t1)).toEqual({ c: 7, from: 'hour', date: '2026-10-17', hour: 8 });
  });

  it('without hourly data: the minimum temperature', () => {
    expect(coldest(trip())).toEqual({ c: 6, from: 'min' });
    expect(coldest(trip({ wx: null }))).toBeNull();
  });

  it('rain chance: the max % over the riding hours, stored on the forecast; from 30 % it is wet', () => {
    const t1 = trip({ forecast: { days: [{ date: '2026-10-17', rainPct: 80, hourly: hourly({}, { 2: 90, 10: 40 }) }] } });
    expect(rainChance(t1)).toBe(40);
    expect(withRainPct(t1.forecast, t1).rainPct).toBe(40);
    expect(isWet(t1)).toBe(true);
    expect(isWet(trip({ forecast: { days: [{ date: '2026-10-17', rainPct: 20 }] } }))).toBe(false);
    expect(rainChance(trip({ forecast: { days: [{ date: '2026-10-17', rainPct: 20 }, { date: '2026-10-18', rainPct: 35 }] } }))).toBe(35);
  });
});

const KITS = [
  { key: 'u-k1', name: 'Winter', minC: null, maxC: 4 },
  { key: 'u-k2', name: 'Kühl', minC: 4, maxC: 15 },
  { key: 'u-k3', name: 'Übergang', minC: 10, maxC: 20 },
  { key: 'u-k6', name: 'Hitze', minC: 25, maxC: null },
  { key: 'u-regen', name: 'Regen' },
];

describe('temperature kits (answers 4, 5)', () => {
  it('only blocks with a range are kits; open ends work', () => {
    expect(tempKits(KITS).map((k) => k.key)).toEqual(['u-k1', 'u-k2', 'u-k3', 'u-k6']);
    expect(kitFits(KITS[0], -10)).toBe(true);
    expect(kitFits(KITS[3], 35)).toBe(true);
  });

  it('picks the kit that fits; when two fit, the colder one', () => {
    expect(chooseKit(KITS, 7).key).toBe('u-k2');
    expect(chooseKit(KITS, 12).key).toBe('u-k2'); // K2 and K3 both fit: the colder one
    expect(chooseKit(KITS, 18).key).toBe('u-k3');
    expect(chooseKit(KITS, -5).key).toBe('u-k1');
    expect(chooseKit(KITS, 22).key).toBe('u-k3'); // none fits: the nearest
    expect(chooseKit([], 10)).toBeNull();
  });

  it('the coldest hour decides when the day range fits two kits', () => {
    const t1 = trip({ wx: { min: 9, max: 19 }, forecast: { days: [{ date: '2026-10-17', hourly: hourly({ 8: 16, 9: 17 }, [], 18) }, { date: '2026-10-18', hourly: hourly({ 8: 16 }, [], 18) }] } });
    expect(chooseKit(KITS, coldest(t1).c).key).toBe('u-k3'); // 16 °C at 8: Übergang
    expect(chooseKit(KITS, coldest(trip({ wx: { min: 9, max: 19 } })).c).key).toBe('u-k2'); // min 9 °C
  });

  it('kitPlan: what is in, what is missing', () => {
    const items = ITEMS.map((i) => (['C1', 'C5', 'C9'].includes(i.id) ? { ...i, sets: ['u-k2'] } : i));
    const p = kitPlan(KITS[1], trip({ entries: [{ itemId: 'C1', slot: 'body', qty: 1 }] }), items);
    expect(p.have.map((i) => i.id)).toEqual(['C1']);
    expect(p.add.map((i) => i.id)).toEqual(['C5', 'C9']);
  });
});

describe('the border offset (answer 6)', () => {
  const d = (clothing, doneAt) => ({ status: 'done', clothing, doneAt });
  it('1 °C per answer, at most ±3, from all saved debriefs', () => {
    expect(clothingOffset([])).toBe(0);
    expect(clothingOffset([d('cold', '1'), d('cold', '2')])).toBe(2);
    expect(clothingOffset([d('cold', '1'), d('cold', '2'), d('cold', '3'), d('cold', '4'), d('cold', '5')])).toBe(3);
    expect(clothingOffset([d('cold', '1'), d('cold', '2'), d('cold', '3'), d('cold', '4'), d('warm', '5')])).toBe(2);
    expect(clothingOffset([d('warm', '1'), d('fit', '2'), { status: 'draft', clothing: 'warm' }])).toBe(-1);
  });
  it('a positive offset counts the temperature colder: the kit borders move up', () => {
    expect(felt(16, 2)).toBe(14);
    expect(chooseKit(KITS, 16, 0).key).toBe('u-k3');
    expect(chooseKit(KITS, 16, 2).key).toBe('u-k2');
  });
});

describe('the onion check (answers 2, 3, 12)', () => {
  const on = (...ids) => ids.map((itemId) => ({ itemId, slot: 'body', qty: 1 }));
  it('shows a gap with the best owned item', () => {
    const r = onionCheck(trip({ entries: on('C1', 'C2', 'C4', 'C7', 'C8') }), ITEMS);
    expect(r.c).toBe(6);
    const legs = r.rows.find((x) => x.key === 'legs');
    expect(legs.ok).toBe(false);
    expect(legs.fix?.id).toBe('C5'); // Beinlinge (8–15) beat the short bibs (12–30)
    expect(r.rows.find((x) => x.key === 'base').ok).toBe(true);
    expect(r.gaps).toBeGreaterThanOrEqual(1);
  });

  it('a short item does not cover the cold: Trägerhose kurz at 6 °C is a gap', () => {
    const r = onionCheck(trip({ entries: on('C1', 'C6') }), ITEMS);
    expect(r.rows.find((x) => x.key === 'legs').ok).toBe(false);
  });

  it('from 30 % rain the outer layer must keep rain out', () => {
    const wet = trip({ wx: { min: 16, max: 22, rain: 'none', rainPct: 40 }, entries: on('C1', 'C4') });
    const outer = onionCheck(wet, ITEMS).rows.find((x) => x.key === 'outer');
    expect(outer).toMatchObject({ ok: false, rain: true });
    expect(outer.fix.id).toBe('C3');
    const dry = trip({ wx: { min: 16, max: 22, rain: 'none', rainPct: 10 }, entries: on('C1') });
    expect(onionCheck(dry, ITEMS).rows.map((x) => x.key)).toEqual(['base']);
  });

  it('the offset makes the onion colder', () => {
    const t1 = trip({ wx: { min: 13, max: 20 }, entries: on('C1') });
    expect(onionCheck(t1, ITEMS).rows.some((x) => x.key === 'hands')).toBe(false);
    expect(onionCheck(t1, ITEMS, 3).rows.find((x) => x.key === 'hands').ok).toBe(false);
  });

  it('nothing to check without a temperature or without any layered clothing', () => {
    expect(onionCheck(trip({ wx: null }), ITEMS)).toBeNull();
    expect(onionCheck(trip(), [item('X', 'Zelt', { category: 'sleep' })])).toBeNull();
  });
});

/* ---------- step 2 of the import ---------- */

const FILE = {
  kind: 'gear-import',
  version: 1,
  items: [],
  kits: [
    { id: 'K1', name: `${P} Winter`, minC: null, maxC: 4, items: ['M0001', 'M0002', 'M0007'], note: '' },
    { id: 'K2', name: `${P} Kühl`, minC: 4, maxC: 15, items: ['M0001', 'M0050', 'M0009', 'M9999'], note: 'Schichten' },
  ],
  blocks: [
    { id: 'B01', name: `${P} Elektronik`, items: ['M0101', 'M0102', 'M0103', 'M0104'], note: '' },
    { id: 'F01', name: `${P} Licht`, items: ['M0104', 'M0102'], note: '' },
    { id: 'B02', name: `${P} Kochen leicht`, items: ['M0001', 'X1'], note: '' },
  ],
  tasks: [
    { id: 'A001', text: `${P} Velo-Service buchen`, group: 'Velo' },
    { id: 'A002', text: `${P} Startnummer abholen`, group: 'Event' },
  ],
  oldTrips: [
    { id: 'T001', name: `${P} Gravel-Event`, date: '2022-09-10', note: 'Startnummer vergessen.\nVerpflegung alle 2 h.' },
    { id: 'T002', name: `${P} Herbstrunde`, date: null, note: 'Regen ab Mittag.' },
    { id: 'T003', name: `${P} Jura`, date: '2022', note: '' },
  ],
};
// The app already has a block "Elektronik" with E1, E2, E3 (3 of the 4 items of B01 → 75 %).
const SETS = [{ key: 'u-elek', name: `${P} Elektronik alt` }];
const withElek = ITEMS.map((i) => (['E1', 'E2', 'E3'].includes(i.id) ? { ...i, sets: ['u-elek'] } : i));
const DATA = { items: withElek, sets: SETS, tasks: [{ id: 7, area: 'Preparation', task: 'Old task', leadWeeks: 1 }], events: [] };

describe('import step 2: the file format', () => {
  it('accepts the optional lists and checks them', () => {
    expect(validateGearImport(FILE)).toEqual([]);
    expect(validateGearImport({ ...FILE, kits: 'x' })).toEqual(['The list "kits" in the file is not a list.']);
    expect(validateStep2({ blocks: [{ name: 'x' }] })).toEqual(['Every entry of "blocks" needs an id.']);
    expect(hasStep2(FILE)).toBe(true);
    expect(hasStep2({ items: [] })).toBe(false);
  });

  it('finds items by sourceId, mergedIds or ID; unknown ids are only listed', () => {
    const find = itemFinder(ITEMS);
    expect(find('M0050').id).toBe('C5');
    expect(find('C9').id).toBe('C9');
    expect(find('M9999')).toBeNull();
    const plan = planStep2(FILE, DATA);
    expect(plan.notFound.sort()).toEqual(['M9999', 'X1']);
    expect(plan.kits[1]).toMatchObject({ id: 'K2', minC: 4, maxC: 15, itemIds: ['C1', 'C5', 'C9'], notFound: ['M9999'], status: 'new' });
    expect(plan.kits[0].minC).toBeNull();
  });
});

describe('import step 2: the ≥ 70 % check', () => {
  it('a block with ≥ 70 % of the same items gets the choice, the others are new', () => {
    expect(similarBlock(['E1', 'E2', 'E3', 'E4'], withElek, SETS)).toMatchObject({ key: 'u-elek', both: 3, of: 4, share: 0.75 });
    const plan = planStep2(FILE, DATA);
    expect(plan.blocks.map((b) => [b.id, b.status])).toEqual([['B01', 'similar'], ['F01', 'new'], ['B02', 'new']]);
  });

  it('a block that shares 2 of 3 items (67 %) is new', () => {
    const file = { ...FILE, blocks: [{ id: 'B09', name: 'x', items: ['M0101', 'M0102'] }] };
    expect(similarBlock(['E1', 'E2'], withElek, SETS).share).toBeCloseTo(0.667, 2);
    expect(planStep2(file, DATA).blocks[0].status).toBe('new');
  });

  it('Zusammenlegen adds the items to the block and remembers the id; Weglassen leaves it out', () => {
    const merged = buildStep2(FILE, DATA, {}, '2026-10-09T10:00:00Z');
    const elek = merged.sets.find((s) => s.key === 'u-elek');
    expect(elek.mergedIds).toEqual(['B01']);
    expect(merged.items.find((i) => i.id === 'E4').sets).toContain('u-elek');
    expect(merged.counts).toMatchObject({ kits: 2, merged: 1, blocks: 2, tasks: 2, oldTrips: 3, notFound: 2 });
    const skipped = buildStep2(FILE, DATA, { B01: 'skip' });
    expect(skipped.counts.skipped).toBe(1);
    expect(skipped.sets.find((s) => s.key === 'u-elek').mergedIds).toBeUndefined();
    const fresh = buildStep2(FILE, DATA, { B01: 'new' });
    expect(fresh.sets.filter((s) => s.sourceId === 'B01')).toHaveLength(1);
  });

  it('kits become building blocks with their range', () => {
    const w = buildStep2(FILE, DATA);
    const k2 = w.sets.find((s) => s.sourceId === 'K2');
    expect(k2).toMatchObject({ name: `${P} Kühl`, minC: 4, maxC: 15, note: 'Schichten' });
    expect(w.sets.find((s) => s.sourceId === 'K1')).toMatchObject({ minC: null, maxC: 4 });
    expect(w.items.find((i) => i.id === 'C5').sets).toContain(k2.key);
  });
});

/** Apply a build to the data, like importdb.js does. */
const apply = (data, w) => {
  const byId = new Map(data.items.map((i) => [i.id, i]));
  for (const i of w.items) byId.set(i.id, i);
  const tasks = new Map(data.tasks.map((x) => [x.id, x]));
  for (const x of w.tasks) tasks.set(x.id, x);
  const events = new Map(data.events.map((x) => [x.id, x]));
  for (const x of w.events) events.set(x.id, x);
  return { items: [...byId.values()], sets: w.sets, tasks: [...tasks.values()], events: [...events.values()] };
};

describe('import step 2: idempotent', () => {
  it('a second import of the same file adds nothing', () => {
    const once = apply(DATA, buildStep2(FILE, DATA, { B01: 'merge' }));
    const plan = planStep2(FILE, once);
    expect(plan.kits.every((k) => k.status === 'same')).toBe(true);
    expect(plan.blocks.every((b) => b.status === 'same')).toBe(true);
    expect(plan.tasks).toMatchObject({ total: 2, same: 2, add: [], update: [] });
    expect(plan.oldTrips).toMatchObject({ total: 3, same: 3, add: [] });
    const twice = buildStep2(FILE, once);
    expect(twice.sets).toHaveLength(once.sets.length);
    expect(twice.items).toEqual([]);
    expect(twice.tasks).toEqual([]);
    expect(twice.events).toEqual([]);
    expect(twice.counts).toMatchObject({ kits: 0, blocks: 0, merged: 0, tasks: 0, oldTrips: 0, kitsSame: 2, blocksSame: 3 });
  });

  it('a changed task text is updated in place, not added', () => {
    const once = apply(DATA, buildStep2(FILE, DATA));
    const file = { ...FILE, tasks: [{ id: 'A001', text: `${P} Velo-Service früh buchen`, group: 'Velo' }] };
    const w = buildStep2(file, once);
    expect(w.tasks).toHaveLength(1);
    expect(w.tasks[0]).toMatchObject({ sourceId: 'A001', task: `${P} Velo-Service früh buchen` });
    expect(w.tasks[0].id).toBe(once.tasks.find((x) => x.sourceId === 'A001').id);
  });

  it('the step-2 lists leave the staged file after applying', () => {
    expect(hasStep2(withoutStep2(FILE))).toBe(false);
  });
});

describe('import step 2: tasks and old trips', () => {
  const w = buildStep2(FILE, DATA);
  it('tasks become one preparation list, numbered after the tasks there are', () => {
    expect(w.tasks.map((x) => [x.id, x.sourceId, x.list, x.area])).toEqual([
      [8, 'A001', PREP_LIST, 'Preparation'],
      [9, 'A002', PREP_LIST, 'Preparation'],
    ]);
  });

  it('the list shows only for events or bikepacking trips of more than 4 nights', () => {
    const tasks = [...DATA.tasks, ...w.tasks];
    const base = { startDate: '2026-11-01', days: 2, overnight: 'outdoor', entries: [] };
    expect(prepFor(base, tasks, '2026-10-09')).toEqual([]);
    expect(prepFor({ ...base, event: true }, tasks, '2026-10-09').map((r) => r.task.id).sort()).toEqual([7, 8, 9]);
    const long = { ...base, days: 6 };
    expect(isLongTour(long)).toBe(true);
    expect(prepFor(long, tasks, '2026-10-09').map((r) => r.task.id).sort()).toEqual([8, 9]); // the old task stays for events
    expect(isLongTour({ ...base, days: 5 })).toBe(false); // 4 nights
    expect(isLongTour({ ...long, packs: [] })).toBe(false); // no bike
    expect(isLongTour({ ...long, domain: 'travel' })).toBe(false);
    expect(isLongTour({ ...long, overnight: 'none' })).toBe(false);
  });

  it('old trips become read-only Logbook notes, marked from Excel; a year sorts after its full dates', () => {
    expect(w.events.map((e) => e.id)).toEqual(['xl-T001', 'xl-T002', 'xl-T003']);
    expect(eventOf(FILE.oldTrips[0])).toMatchObject({ source: 'excel', readOnly: true, sortDate: '2022-09-10', note: 'Startnummer vergessen.\nVerpflegung alle 2 h.' });
    expect(tripSortDate('2022')).toBe('2022-00');
    expect(tripSortDate(null)).toBe('');
    const sorted = ['2022-09-10', tripSortDate('2022'), '2022-03-01', tripSortDate('2023')].sort((a, b) => b.localeCompare(a));
    expect(sorted).toEqual(['2023-00', '2022-09-10', '2022-03-01', '2022-00']);
  });
});
