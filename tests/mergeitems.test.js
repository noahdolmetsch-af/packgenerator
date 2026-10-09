// v0.37.1 "Zusammenlegen": merge a double or a collection item into the imported item(s).
// Every name here is fictional (test_data_gtp_).
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { mergePlan, mergeItems, mergeFields, swapEntries, isOpenTrip } from '../src/lib/gear/mergeitems.js';
import { undoBulk } from '../src/lib/gear/bulk.js';
import { counterparts, counterpartScore, tokenOverlap, planGearImport, remaining } from '../src/lib/gearimport.js';
import { tripFromTemplate } from '../src/lib/templates.js';
import { newTrip, alwaysEntries } from '../src/lib/trips.js';
import { addSetEntries } from '../src/lib/sets.js';
import { contextEntries } from '../src/lib/context.js';
import { TEMPLATES_KEY } from '../src/lib/templates.js';
import { SETS_KEY } from '../src/lib/sets.js';

const NOW = '2026-10-09T10:00:00.000Z';
const TODAY = '2026-10-09';
const N = (s) => `test_data_gtp_${s}`;
const it0 = (id, name, category, extra = {}) => ({ id, name, category, weightG: null, qty: 1, ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'], defaultBag: 'top', ...extra });

const ITEMS = [
  it0('OB01', N('Garmin-Halterung (rüttelfest)'), 'onbike', { weightG: 40, weightStatus: 'measured', note: N('alt'), favorite: true, lists: ['bike'], sets: ['standard', 'u-rain'], always: true, role: 'standard', domains: ['velo'] }),
  it0('EL20', N('Garmin Halterung'), 'elec', { sourceId: 'M0210', note: '', domains: ['bikepacking'], lists: ['daily'] }),
  it0('FO01', N('Snack (Biber/Banane/Nüsse)'), 'food', { sets: ['base'], weightG: 300 }),
  it0('FO10', N('Biber'), 'food', { sourceId: 'M0301', weightG: 90 }),
  it0('FO11', N('Banane'), 'food', { sourceId: 'M0302' }),
  it0('FO12', N('Nüsse'), 'food', { sourceId: 'M0303', note: N('eigene Notiz') }),
  it0('TA02', N('Satteltasche alt'), 'bags'),
  it0('TA20', N('Satteltasche'), 'bags', { sourceId: 'M0400' }),
  it0('WL01', N('Leichtere Halterung'), 'onbike', { ownership: 'wishlist', replaces: 'OB01' }),
  it0('XX01', N('Altes Ding'), 'lux', { ownership: 'gone' }),
];
const trip = (id, startDate, entries, extra = {}) => ({ id, title: N(id), startDate, days: 1, bikeId: 'b1', setup: { top: 'bag-top', seat: 'bag-TA02' }, entries, ready: [], status: 'planned', ...extra });
const TRIPS = [
  trip('past', '2026-09-01', [{ itemId: 'OB01', slot: 'mounted', qty: 1, packed: true }, { itemId: 'FO01', slot: 'top', qty: 2, packed: true }]),
  trip('next', '2026-10-20', [{ itemId: 'OB01', slot: 'mounted', qty: 1, packed: true }, { itemId: 'FO01', slot: 'top', qty: 2, packed: true }, { itemId: 'FO11', slot: 'frame', qty: 1, packed: false }], { ready: [{ id: 'r1', label: 'x', itemId: 'OB01' }] }),
  trip('ended', '2026-10-09', [{ itemId: 'OB01', slot: 'mounted', qty: 1 }], { finished: true }),
  trip('debriefed', '2026-10-15', [{ itemId: 'OB01', slot: 'mounted', qty: 1 }]),
];
const TEMPLATES = [{ id: 'tpl-1', name: N('Pendeln'), setup: {}, entries: [{ itemId: 'OB01', slot: 'mounted', qty: 1 }, { itemId: 'FO01', slot: 'top', qty: 3 }, { itemId: 'FO10', slot: 'frame', qty: 1 }], ready: [] }];
const SETS = [{ key: 'u-rain', name: N('Regen'), qty: { OB01: 2 } }, { key: 'base', qty: { FO01: 2 } }];
const BAGS = [{ id: 'bag-TA02', name: N('Satteltasche alt'), slot: 'seat', itemId: 'TA02', pieces: 1 }];
const BIKES = [{ id: 'b1', name: N('Velo'), slots: ['seat', 'top'], setup: { seat: 'bag-TA02', top: 'bag-top' }, fixtures: ['OB01'] }];
const LEARN = [{ id: 1, rule: N('Halterung prüfen'), itemIds: ['OB01'] }];
const DEBRIEFS = [{ tripId: 'debriefed', status: 'done' }];

const state = () => structuredClone({ items: ITEMS, trips: TRIPS, debriefs: DEBRIEFS, templates: TEMPLATES, sets: SETS, containers: BAGS, bikes: BIKES, learnings: LEARN });
const opts = { now: NOW, today: TODAY };

describe('merge plan (pure)', () => {
  it('a double: templates, building blocks, bike fixtures, learnings, other items and open trips point to the target', () => {
    const p = mergePlan(state(), 'OB01', ['EL20'], opts);
    expect(p.targets).toEqual(['EL20']);
    expect(p.templates[0].entries.map((e) => e.itemId)).toEqual(['EL20', 'FO01', 'FO10']);
    expect(p.templates[0].entries[0]).toMatchObject({ slot: 'mounted', qty: 1 });
    expect(p.sets.find((s) => s.key === 'u-rain').qty).toEqual({ EL20: 2 });
    expect(p.bikes[0].fixtures).toEqual(['EL20']);
    expect(p.learnings[0].itemIds).toEqual(['OB01', 'EL20']);
    expect(p.items.find((i) => i.id === 'WL01').replaces).toBe('EL20');
    const next = p.trips.find((t) => t.id === 'next');
    expect(next.entries[0]).toEqual({ itemId: 'EL20', slot: 'mounted', qty: 1, packed: true });
    expect(next.ready[0].itemId).toBe('EL20');
  });

  it('past, ended and debriefed trips stay untouched', () => {
    const p = mergePlan(state(), 'OB01', ['EL20'], opts);
    expect(p.trips.map((t) => t.id)).toEqual(['next']);
    expect(isOpenTrip(TRIPS[0], new Set(), TODAY)).toBe(false);
    expect(isOpenTrip(TRIPS[2], new Set(), TODAY)).toBe(false);
    expect(isOpenTrip(TRIPS[3], new Set(['debriefed']), TODAY)).toBe(false);
    expect(isOpenTrip(TRIPS[1], new Set(), TODAY)).toBe(true);
  });

  it('the target keeps its values; only empty fields are filled, flags OR-ed, lists, areas and blocks joined', () => {
    const p = mergePlan(state(), 'OB01', ['EL20'], opts);
    const t = p.items.find((i) => i.id === 'EL20');
    expect(t).toMatchObject({ name: N('Garmin Halterung'), category: 'elec', sourceId: 'M0210', note: N('alt'), favorite: true, weightG: 40, weightStatus: 'measured', always: true, role: 'standard', mergedFrom: ['OB01'] });
    expect(t.lists).toEqual(['daily', 'bike']);
    expect(t.domains).toEqual(['bikepacking', 'velo']);
    expect(t.sets).toEqual(['standard', 'u-rain']);
    // never overwrite: a target with its own note and weight keeps them
    const own = mergeFields({ ...ITEMS[1], note: 'mine', weightG: 12 }, ITEMS[0], NOW);
    expect(own).toMatchObject({ note: 'mine', weightG: 12 });
    // a target that stays at home does not become Standard
    const home = mergeFields({ ...ITEMS[1], leaveHome: true }, ITEMS[0], NOW);
    expect(home.sets).toEqual(['u-rain']);
    expect(home.always).toBeUndefined();
  });

  it('the old item is archived, not deleted', () => {
    const p = mergePlan(state(), 'OB01', ['EL20'], opts);
    expect(p.items.find((i) => i.id === 'OB01')).toMatchObject({ ownership: 'gone', archivedFrom: 'owned', archivedAt: NOW, archivedBy: 'merge', mergedInto: ['EL20'], name: ITEMS[0].name });
  });

  it('a collection: each piece gets the reference with the same amount', () => {
    const p = mergePlan(state(), 'FO01', ['FO10', 'FO11', 'FO12'], opts);
    // the template already had Biber: it keeps its own entry; the others take the place and amount
    expect(p.templates[0].entries).toEqual([
      { itemId: 'OB01', slot: 'mounted', qty: 1 },
      { itemId: 'FO11', slot: 'top', qty: 3 },
      { itemId: 'FO12', slot: 'top', qty: 3 },
      { itemId: 'FO10', slot: 'frame', qty: 1 },
    ]);
    const next = p.trips.find((t) => t.id === 'next');
    // Banane was on the trip already (its own entry stays); the new pieces start unpacked
    expect(next.entries.filter((e) => e.itemId.startsWith('FO'))).toEqual([
      { itemId: 'FO10', slot: 'top', qty: 2, packed: false },
      { itemId: 'FO12', slot: 'top', qty: 2, packed: false },
      { itemId: 'FO11', slot: 'frame', qty: 1, packed: false },
    ]);
    expect(p.sets.find((s) => s.key === 'base').qty).toEqual({ FO10: 2, FO11: 2, FO12: 2 });
    for (const id of ['FO10', 'FO11', 'FO12']) expect(p.items.find((i) => i.id === id).sets).toEqual(['base']);
    expect(p.items.find((i) => i.id === 'FO10').weightG).toBe(90); // own weight kept
    expect(p.items.find((i) => i.id === 'FO11').weightG).toBe(300); // empty: filled
    expect(p.items.find((i) => i.id === 'FO12').note).toBe(N('eigene Notiz'));
  });

  it('a bag link moves to the target; nothing for a missing, gone or same target; idempotent', () => {
    const p = mergePlan(state(), 'TA02', ['TA20'], opts);
    expect(p.containers).toEqual([{ ...BAGS[0], itemId: 'TA20' }]);
    expect(mergePlan(state(), 'OB01', ['NOPE', 'XX01', 'OB01'], opts)).toBeNull();
    expect(mergePlan(state(), 'NOPE', ['EL20'], opts)).toBeNull();
    const s = state();
    s.items = s.items.map((i) => (i.id === 'OB01' ? { ...i, ownership: 'gone', mergedInto: ['EL20'] } : i));
    expect(mergePlan(s, 'OB01', ['EL20'], opts)).toBeNull();
  });

  it('swapEntries leaves a list without the old item as it is', () => {
    const list = [{ itemId: 'A' }];
    expect(swapEntries(list, 'Z', ['B'])).toBe(list);
  });
});

describe('merge in the database, with undo', () => {
  let db;
  beforeEach(async () => {
    db = createDb(`gtp-merge-${Math.random()}`);
    await db.items.bulkPut(ITEMS);
    await db.trips.bulkPut(TRIPS);
    await db.debriefs.bulkPut(DEBRIEFS);
    await db.settings.bulkPut([{ key: TEMPLATES_KEY, value: TEMPLATES }, { key: SETS_KEY, value: SETS }]);
    await db.containers.bulkPut(BAGS);
    await db.bikes.bulkPut(BIKES);
    await db.learnings.bulkPut(LEARN);
  });
  const dump = async () => ({
    items: await db.items.toArray(), trips: await db.trips.toArray(), settings: await db.settings.toArray(),
    containers: await db.containers.toArray(), bikes: await db.bikes.toArray(), learnings: await db.learnings.toArray(), debriefs: await db.debriefs.toArray(),
  });

  it('writes everything in one go; the past trip is untouched; a second run changes nothing; undo restores exactly', async () => {
    const before = await dump();
    const snap = await mergeItems(db, 'OB01', ['EL20'], opts);
    expect(snap.merge).toEqual({ oldId: 'OB01', targets: ['EL20'] });
    expect((await db.items.get('OB01')).ownership).toBe('gone');
    expect(await db.items.count()).toBe(ITEMS.length);
    expect(await db.trips.get('past')).toEqual(TRIPS[0]);
    expect((await db.trips.get('next')).entries[0].itemId).toBe('EL20');
    expect((await db.settings.get(TEMPLATES_KEY)).value[0].entries[0].itemId).toBe('EL20');
    expect((await db.bikes.get('b1')).fixtures).toEqual(['EL20']);
    const after = await dump();
    expect(await mergeItems(db, 'OB01', ['EL20'], opts)).toBeNull();
    expect(await dump()).toEqual(after);
    await undoBulk(db, snap);
    expect(await dump()).toEqual(before);
  });

  it('undo of a collection merge restores the template and the sets setting', async () => {
    const before = await dump();
    const snap = await mergeItems(db, 'FO01', ['FO10', 'FO11', 'FO12'], opts);
    expect((await db.settings.get(SETS_KEY)).value.find((s) => s.key === 'base').qty).toEqual({ FO10: 2, FO11: 2, FO12: 2 });
    await undoBulk(db, snap);
    expect(await dump()).toEqual(before);
  });
});

describe('archived items never come into a new trip', () => {
  const live = [it0('A', 'a', 'food'), it0('G', 'g', 'food', { ownership: 'gone', sets: ['standard', 'base', 'u-rain'], always: true, role: 'standard' })];
  const bike = { id: 'b1', name: 'B', slots: ['top', 'seat'], setup: { top: 'bag-top', seat: 'bag-seat' } };

  it('not from a template, a copy of the last trip, Standard, a building block or the context', () => {
    const tpl = { id: 't', entries: [{ itemId: 'A', slot: 'top', qty: 1 }, { itemId: 'G', slot: 'top', qty: 1 }], ready: [] };
    expect(tripFromTemplate({ title: 'x', startDate: '2026-11-01', days: 1, bike }, tpl, live, 1).entries.map((e) => e.itemId)).toEqual(['A']);
    const last = { id: 'old', bikeId: 'b1', startDate: '2026-09-01', entries: [{ itemId: 'A', slot: 'top', qty: 1 }, { itemId: 'G', slot: 'top', qty: 1 }] };
    expect(newTrip({ title: 'x', startDate: '2026-11-01', days: 1, bike }, [last], live, 1).entries.map((e) => e.itemId)).toEqual(['A']);
    expect(alwaysEntries(live, [], bike.setup)).toEqual([]);
    expect(addSetEntries({ entries: [], setup: bike.setup }, live, { key: 'u-rain' }).added).toEqual([]);
    expect(contextEntries({ entries: [], overnight: 'outdoor', setup: bike.setup }, live).some((e) => e.itemId === 'G')).toBe(false);
  });

  it('an existing trip keeps the archived item', () => {
    const p = mergePlan({ items: [...live, it0('B', 'b', 'food')], trips: [{ id: 't', startDate: '2026-12-01', entries: [{ itemId: 'G', slot: 'top', qty: 1 }] }] }, 'A', ['B'], opts);
    expect(p.trips).toEqual([]);
  });
});

describe('the proposed counterpart', () => {
  const pool = [
    it0('FO01', N('Snack (Biber/Banane/Nüsse)'), 'food'),
    it0('FO10', N('Biber'), 'food', { sourceId: 'M1' }),
    it0('FO11', N('Banane'), 'food', { sourceId: 'M2' }),
    it0('FO12', N('Nüsse'), 'food', { sourceId: 'M3' }),
    it0('EL20', N('Garmin Halterung'), 'elec', { sourceId: 'M0210' }),
    it0('OB01', N('Garmin-Halterung (rüttelfest, Alu)'), 'onbike'),
    it0('WZ01', N('Minipumpe / CO2 + Pumpenkopf'), 'tools'),
    it0('WZ10', N('Minipumpe'), 'tools', { sourceId: 'M4' }),
    it0('WZ11', N('CO2 Kartusche'), 'tools', { sourceId: 'M5' }),
    it0('WZ12', N('Pumpenkopf'), 'tools', { sourceId: 'M6' }),
    it0('SL01', N('Schlafsack'), 'sleep', { sourceId: 'M7' }),
    it0('SL02', N('Bivy'), 'sleep'),
    it0('XX01', N('Biber alt'), 'food', { ownership: 'gone', sourceId: 'M9' }),
  ];
  const ids = (item) => counterparts(item, pool, { imported: true }).map((x) => x.item.id);

  it('a double under another name, also in another category', () => {
    expect(ids(pool[5])[0]).toBe('EL20');
  });

  it('a collection proposes its pieces (up to 3), never gone items or itself', () => {
    expect(ids(pool[0]).sort()).toEqual(['FO10', 'FO11', 'FO12']);
    expect(ids(pool[6]).sort()).toEqual(['WZ10', 'WZ11', 'WZ12']);
  });

  it('nothing alike: no proposal (the search is there); token overlap and scores', () => {
    expect(ids(pool[11])).toEqual([]);
    expect(tokenOverlap('Garmin Halter', 'Garmin Halterung (Alu)')).toBe(1);
    expect(counterpartScore(pool[1], pool[1])).toBe(1);
    expect(counterparts(pool[11], pool).length).toBe(0);
  });
});

describe('after an apply, the items it took are not "Nicht im Import"', () => {
  it('remaining() remembers them', () => {
    const items = [it0('A', N('Kocher'), 'cook', { sourceId: 'S1' }), it0('B', N('Taschenbuch'), 'lux')];
    const data = { kind: 'gear-import', version: 1, items: [{ sourceId: 'S1', name: N('Kocher'), category: 'cook' }, { sourceId: 'S2', name: N('Taschenbüchlein'), category: 'lux' }] };
    const rest = remaining(data, ['S1'], ['A']);
    expect(rest.appliedItemIds).toEqual(['A']);
    expect(planGearImport(rest, items, []).notIn.map((i) => i.id)).not.toContain('A');
  });
});
