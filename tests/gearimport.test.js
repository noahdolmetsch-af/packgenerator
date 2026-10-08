// v0.36.0: "Import prüfen", the safe gear import. Every name here is fictional (test_data_gtp_).
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { createDb } from '../src/lib/db.js';
import {
  isGearImportFile, validateGearImport, normalizeName, nameSimilarity, resolveCategory, mapAreas, match, enrich, newItem,
  planGearImport, buildWrites, planLearnings, isoDate, remaining,
} from '../src/lib/gearimport.js';
import { stageImport, getStaged, applyImport, undoImport, lastApplied, archiveItems, decide, STAGED } from '../src/lib/gear/importdb.js';
import { undoBulk } from '../src/lib/gear/bulk.js';
import { learningsFor } from '../src/lib/debrief.js';
import { inDomain, TRIP_DOMAINS, DOMAIN } from '../src/lib/domains.js';
import { LAST_IMPORT } from '../src/lib/backup.js';

const NOW = '2026-10-08T10:00:00.000Z';
const N = (s) => `test_data_gtp_${s}`;
const app = (id, name, category, extra = {}) => ({ id, name, category, weightG: null, qty: 1, ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'], ...extra });
const imp = (sourceId, name, category, extra = {}) => ({ sourceId, mergedIds: [], name, category, qty: 1, areas: [], ...extra });

const ITEMS = [
  app('KL28', N('Merino Langarmshirt'), 'onbike', { weightG: 180, note: 'Lieblingsshirt' }),
  app('OB06', N('Daunenjacke'), 'offbike', { weightG: 320 }),
  app('EL05', N('Stirnlampe'), 'light', { weightG: 90 }),
  app('KO02', N('Trinkflasche 0.75L'), 'cook'),
  app('SL01', N('Schlafsack'), 'sleep', { weightG: 700, sets: ['sleep'] }),
  app('LX01', N('Taschenbuch'), 'lux'),
  app('TA09', N('Altes Zelt'), 'sleep', { ownership: 'gone' }),
];

describe('the file', () => {
  it('knows a gear import file and its version', () => {
    expect(isGearImportFile({ kind: 'gear-import', version: 1, items: [] })).toBe(true);
    expect(isGearImportFile({ kind: 'favorites', rows: [] })).toBe(false);
    expect(validateGearImport({ kind: 'gear-import', version: 1, items: [] })).toEqual([]);
    expect(validateGearImport({ kind: 'gear-import', version: 2, items: [] })[0]).toMatch(/newer version/);
    expect(validateGearImport({ kind: 'gear-import', items: [] })[0]).toMatch(/no version/);
  });
});

describe('names and words', () => {
  it('normalises: lowercase, umlauts to base letters, no punctuation, sizes apart', () => {
    expect(normalizeName('Trinkflasche 0.5L')).toEqual({ text: 'trinkflasche', words: ['trinkflasche'], sizes: ['0.5l'] });
    expect(normalizeName('Überschuhe (M), Gore!').text).toBe('gore uberschuhe');
    expect(normalizeName('Überschuhe (M), Gore!').sizes).toEqual(['m']);
    expect(normalizeName(N('Fussball')).text).toBe('fussball');
    expect(normalizeName('Straße').text).toBe('strasse');
  });

  it('similarity: same words in another order are equal, one typo stays high, other things low', () => {
    expect(nameSimilarity('Gore Regenjacke', 'Regenjacke Gore')).toBe(1);
    expect(nameSimilarity('Regenjacke Gore', 'Regenjake Gore')).toBeGreaterThanOrEqual(0.6);
    expect(nameSimilarity('Stirnlampe', 'Schlafsack')).toBeLessThan(0.5);
  });

  it('categories: key, English or German name, ID prefix; unknown stays as it is', () => {
    expect(resolveCategory('onbike')).toBe('onbike');
    expect(resolveCategory('Velobekleidung')).toBe('onbike');
    expect(resolveCategory('Sleep')).toBe('sleep');
    expect(resolveCategory('KL')).toBe('onbike');
    expect(resolveCategory('Paddeln')).toBe('Paddeln');
    expect(resolveCategory('')).toBe('');
  });

  it('areas: Velo, Wandern, Alltag, Reisen map to the app; Ski and Weekend stay', () => {
    expect(mapAreas(['Velo', 'Bikepacking', 'Wandern', 'Reisen', 'Alltag', 'Ski', 'Weekend', 'velo'])).toEqual(['velo', 'bikepacking', 'hiking', 'travel', 'everyday', 'ski', 'weekend']);
    for (const k of ['velo', 'hiking', 'everyday', 'ski', 'weekend', 'travel', 'bikepacking']) expect(DOMAIN[k], k).toBeTruthy();
    // Velo and Everyday are areas of items, no trip area; a bike trip takes the Velo items.
    expect(TRIP_DOMAINS.map((d) => d.key)).not.toContain('velo');
    expect(TRIP_DOMAINS.map((d) => d.key)).toContain('hiking');
    expect(inDomain({ domains: ['velo'] }, 'bikepacking')).toBe(true);
    expect(inDomain({ domains: ['hiking'] }, 'bikepacking')).toBe(false);
  });
});

describe('matching', () => {
  it('1. a sourceId (or an old app ID in mergedIds) is "Schon da"', () => {
    const items = [...ITEMS, app('EL09', N('Powerbank'), 'elec', { sourceId: 'M0042' })];
    const { rows } = match([imp('M0042', N('Akku 20000'), 'elec'), imp('M0100', N('Ganz anders'), 'lux', { mergedIds: ['OB06'] })], items);
    expect(rows.map((r) => [r.kind, r.item?.id, r.via])).toEqual([['same', 'EL09', 'id'], ['same', 'OB06', 'id']]);
  });

  it('2. exact name in the same category, or very similar: "Schon da"', () => {
    const { rows } = match([imp('M1', N('merino langarmshirt'), 'onbike'), imp('M2', N('Stirnlampe!'), 'Licht')], ITEMS);
    expect(rows.map((r) => [r.kind, r.item?.id, r.via])).toEqual([['same', 'KL28', 'name'], ['same', 'EL05', 'name']]);
  });

  it('medium similarity: "Unsicher" with at most 3 candidates; nothing alike: "Neu"', () => {
    const { rows } = match([imp('M3', N('Daunenjacke leicht Kapuze'), 'offbike'), imp('M4', N('Kompass'), 'tools')], ITEMS);
    expect(rows[0].kind).toBe('unsure');
    expect(rows[0].candidates[0].item.id).toBe('OB06');
    expect(rows[0].candidates.length).toBeLessThanOrEqual(3);
    expect(rows[1].kind).toBe('fresh');
  });

  it('another category or another size is never "Schon da" by name', () => {
    const { rows } = match([imp('M5', N('Schlafsack'), 'lux'), imp('M6', N('Trinkflasche 0.5L'), 'cook')], ITEMS);
    expect(rows.map((r) => r.kind)).toEqual(['unsure', 'unsure']);
  });

  it('3. one app item is matched at most once: two imports on it are both "Unsicher"', () => {
    const { rows, notIn } = match([imp('M7', N('Stirnlampe'), 'light'), imp('M8', N('Stirnlampe'), 'light')], ITEMS);
    expect(rows.map((r) => r.kind)).toEqual(['unsure', 'unsure']);
    expect(rows[0].reason).toBe('twice');
    expect(rows[0].candidates[0].item.id).toBe('EL05');
    expect(notIn.map((i) => i.id)).not.toContain('EL05');
  });

  it('"Nicht im Import": app items the file does not name, never the archived ones', () => {
    const { notIn } = match([imp('M1', N('Merino Langarmshirt'), 'onbike')], ITEMS);
    expect(notIn.map((i) => i.id)).toEqual(['OB06', 'EL05', 'KO02', 'SL01', 'LX01']);
  });

  it('an archived item is matched by its ID only, not by its name', () => {
    expect(match([imp('M9', N('Altes Zelt'), 'sleep')], ITEMS).rows[0].kind).toBe('fresh');
    expect(match([imp('M9', N('Zelt'), 'sleep', { mergedIds: ['TA09'] })], ITEMS).rows[0].item.id).toBe('TA09');
  });
});

describe('"Schon da" only fills empty fields (the app item is the master)', () => {
  it('never overwrites name, weight, category, quantity, ownership or building blocks', () => {
    const item = ITEMS[4]; // sleeping bag, 700 g, in the block "sleep"
    const { changes } = enrich(item, imp('M10', N('Schlafsack Daune'), 'lux', { weightG: 999, qty: 3, owned: false, optional: true, areas: ['Wandern'], zone: 'torso', tempMin: -5, tempMax: 10, tempClass: 'kalt', rule: 'nur im Herbst', notes: 'Komfort -2' }), NOW);
    for (const f of ['name', 'weightG', 'category', 'qty', 'ownership', 'sets', 'leaveHome']) expect(changes, f).not.toHaveProperty(f);
    expect(changes).toMatchObject({ sourceId: 'M10', domains: ['bikepacking', 'hiking'], zone: 'torso', tempMin: -5, tempMax: 10, tempClass: 'kalt', rule: 'nur im Herbst', note: 'Komfort -2' });
  });

  it('fills a missing weight, adds a note under the old one, keeps a field that is set', () => {
    const { changes, adds } = enrich({ ...ITEMS[3], zone: 'hands' }, imp('M11', N('Trinkflasche'), 'cook', { weightG: 95, zone: 'feet', notes: 'Deckel klemmt' }), NOW);
    expect(changes).toMatchObject({ weightG: 95, weightStatus: 'logbook' });
    expect(changes).not.toHaveProperty('zone');
    expect(adds.map((a) => a.field)).toEqual(['sourceId', 'weightG', 'note']);
    const note = enrich(ITEMS[0], imp('M1', 'x', 'onbike', { notes: 'Waschen kalt' }), NOW).changes.note;
    expect(note).toBe('Lieblingsshirt\nWaschen kalt');
  });

  it('a new item: wishlist when not owned, the new fields, the source ID, the next free ID', () => {
    const it2 = newItem(imp('M12', N('Packraft'), 'Komfort & Luxus', { owned: false, optional: true, areas: ['Reisen'], layer: 'outer', weightG: '2300', qty: 1, mergedIds: ['X-7'] }), ITEMS, NOW);
    expect(it2).toMatchObject({ id: 'LX02', name: N('Packraft'), category: 'lux', ownership: 'wishlist', leaveHome: true, domains: ['travel'], layer: 'outer', weightG: 2300, weightStatus: 'logbook', sourceId: 'M12', mergedIds: ['X-7'] });
  });
});

const FILE = {
  kind: 'gear-import',
  version: 1,
  created: '2026-10-08',
  items: [
    imp('M0001', N('Merino Langarmshirt'), 'onbike', { zone: 'torso', layer: 'base', notes: 'Waschen kalt' }), // same, by name
    imp('M0002', N('Stirnlampe'), 'light', { weightG: 50, rule: 'nur bei Nachtfahrt' }), // same, weight stays 90
    imp('M0003', N('Kompass'), 'tools', { weightG: 30, areas: ['Wandern'] }), // new
    imp('M0004', N('Packraft'), 'lux', { owned: false }), // new, wishlist
    imp('M0005', N('Daunenjacke leicht Kapuze'), 'offbike'), // unsure
  ],
  learnings: [
    { sourceId: 'L01', date: '2021-06-12', topic: 'Kleidung', text: 'Bei Regen zuerst die Hände schützen', condition: 'unter 10 °C', recommendation: 'Überhandschuhe', exceptions: '', reason: 'kalte Finger' },
    { sourceId: 'L02', date: '', topic: 'Schlafen', text: 'Matte immer testen' },
  ],
};

describe('plan and writes', () => {
  it('the plan sorts the file into the three groups and the learnings', () => {
    const p = planGearImport(FILE, ITEMS, [], NOW);
    expect(p.same.map((r) => r.item.id)).toEqual(['KL28', 'EL05']);
    expect(p.fresh.map((r) => r.item.name)).toEqual([N('Kompass'), N('Packraft')]);
    expect(p.unsure.map((r) => r.key)).toEqual(['M0005']);
    expect(p.learnings.add.length).toBe(2);
  });

  it('applies the safe ones, leaves the undecided unsure, and a decision is applied too', () => {
    const w = buildWrites(FILE, ITEMS, [], {}, NOW);
    expect(w.counts).toMatchObject({ enriched: 2, added: 2, wishlist: 1, open: 1 });
    expect(w.done).toEqual(['M0001', 'M0002', 'M0003', 'M0004']);
    expect(w.items.find((i) => i.id === 'EL05')).toMatchObject({ weightG: 90, rule: 'nur bei Nachtfahrt', sourceId: 'M0002' });
    const w2 = buildWrites(FILE, ITEMS, [], { M0005: 'OB06' }, NOW);
    expect(w2.counts.merged).toBe(1);
    expect(w2.items.find((i) => i.id === 'OB06')).toMatchObject({ sourceId: 'M0005', name: N('Daunenjacke'), weightG: 320 });
    const w3 = buildWrites(FILE, ITEMS, [], { M0005: 'new' }, NOW);
    expect(w3.counts.added).toBe(3);
    expect(remaining(FILE, w.done).items.map((i) => i.sourceId)).toEqual(['M0005']);
  });

  it('a re-import changes nothing and adds nothing (sourceId first)', () => {
    const w = buildWrites(FILE, ITEMS, [], { M0005: 'new' }, NOW);
    const after = ITEMS.map((i) => w.items.find((x) => x.id === i.id) ?? i).concat(w.items.filter((x) => !ITEMS.some((i) => i.id === x.id)));
    const learned = w.learnings.add;
    // Renamed in the file since: still found by the sourceId.
    const again = buildWrites({ ...FILE, items: FILE.items.map((x) => ({ ...x, name: `${x.name} neu` })) }, after, learned, { M0005: 'new' }, '2026-10-09T10:00:00.000Z');
    expect(again.items).toEqual([]);
    expect(again.counts).toMatchObject({ added: 0, enriched: 0, unchanged: 5, learningsAdded: 0, learningsUpdated: 0 });
  });
});

describe('learnings', () => {
  it('keep their original date, source "import", and are matched by sourceId', () => {
    const p = planLearnings(FILE.learnings, [{ id: 4, topic: 'x', rule: 'y' }], NOW);
    expect(p.add[0]).toMatchObject({ id: 5, sourceId: 'L01', rule: 'Bei Regen zuerst die Hände schützen', action: 'Überhandschuhe', condition: 'unter 10 °C', reason: 'kalte Finger', date: '2021-06-12', createdAt: '2021-06-12T12:00:00.000Z', source: 'import' });
    expect(p.add[1]).toMatchObject({ id: 6, date: '', createdAt: null });
    const again = planLearnings([{ sourceId: 'L01', text: 'anders', reason: 'neu' }], [{ ...p.add[0], reason: '' }], NOW);
    expect(again.add).toEqual([]);
    expect(again.update).toEqual([{ id: 5, changes: { reason: 'neu' } }]);
    expect(isoDate('3.5.2024')).toBe('2024-05-03');
  });

  it('are not all "new" for the 30-day boost; a debrief learning of today still is', () => {
    const p = planLearnings(FILE.learnings, [], NOW);
    const own = { id: 9, topic: 'Debrief', rule: 'test_data_gtp_ frisch', priority: 'low', createdAt: NOW };
    const top = learningsFor(null, [...p.add, own], 1, new Date(NOW));
    expect(top[0].id).toBe(9);
    const recent = planLearnings([{ sourceId: 'L03', date: '2026-10-01', text: 'test_data_gtp_ neu' }], [], NOW).add[0];
    expect(learningsFor(null, [...p.add, recent], 1, new Date(NOW))[0].sourceId).toBe('L03');
  });
});

describe('database: stage, apply with a backup, undo, archive', () => {
  let db;
  beforeEach(async () => {
    db = createDb(`gtp-import-${Math.random()}`);
    await db.items.bulkPut(ITEMS);
    await db.trips.put({ id: 'test_data_gtp_trip', title: 'test_data_gtp_ Tour', entries: [{ itemId: 'LX01', slot: 'seat', qty: 1 }] });
  });

  it('nothing changes in the gear until applied; then the items are there', async () => {
    expect(await stageImport(db, { kind: 'gear-import', version: 9, items: [] })).not.toEqual([]);
    expect(await stageImport(db, FILE, 'test_data_gtp_liste.json', NOW)).toEqual([]);
    expect(await db.items.count()).toBe(ITEMS.length);
    await decide(db, 'M0005', 'new');
    const counts = await applyImport(db, NOW);
    expect(counts).toMatchObject({ added: 3, enriched: 2, open: 0 });
    expect(await db.items.count()).toBe(ITEMS.length + 3);
    expect(await getStaged(db)).toBeUndefined();
    expect((await db.items.get('KL28')).zone).toBe('torso');
    expect(await db.learnings.count()).toBe(2);
  });

  it('undecided "Unsicher" items stay staged; a second apply changes nothing more', async () => {
    await stageImport(db, FILE, 'f.json', NOW);
    await applyImport(db, NOW);
    expect((await getStaged(db)).data.items.map((i) => i.sourceId)).toEqual(['M0005']);
    const before = await db.items.toArray();
    await stageImport(db, FILE, 'f.json', NOW);
    const counts = await applyImport(db, '2026-10-09T10:00:00.000Z');
    expect(counts).toMatchObject({ added: 0, enriched: 0, learningsAdded: 0 });
    expect(await db.items.toArray()).toEqual(before);
  });

  it('"Rückgängig" restores the backup exactly and stages the file again', async () => {
    await db.table('meta').put({ key: LAST_IMPORT, at: '2026-01-01T00:00:00.000Z', from: null });
    const before = { items: await db.items.toArray(), learnings: await db.learnings.toArray(), trips: await db.trips.toArray() };
    await stageImport(db, FILE, 'f.json', NOW);
    await decide(db, 'M0005', 'OB06');
    await applyImport(db, NOW);
    expect(await lastApplied(db)).toMatchObject({ at: NOW, name: 'f.json' });
    await undoImport(db);
    expect(await db.items.toArray()).toEqual(before.items);
    expect(await db.learnings.toArray()).toEqual(before.learnings);
    expect(await db.trips.toArray()).toEqual(before.trips);
    expect((await db.table('meta').get(LAST_IMPORT)).at).toBe('2026-01-01T00:00:00.000Z');
    expect((await getStaged(db)).decisions).toEqual({ M0005: 'OB06' });
    expect(await lastApplied(db)).toBeNull();
    expect(await db.table('meta').get(STAGED)).toBeTruthy();
  });

  it('archiving keeps the item (ownership gone), the trip stays complete, undo brings it back', async () => {
    const snap = await archiveItems(db, ['LX01', 'TA09'], NOW);
    expect(await db.items.get('LX01')).toMatchObject({ ownership: 'gone', archivedFrom: 'owned', archivedBy: 'import' });
    expect(await db.items.count()).toBe(ITEMS.length);
    expect((await db.trips.get('test_data_gtp_trip')).entries[0].itemId).toBe('LX01');
    await undoBulk(db, snap);
    expect((await db.items.get('LX01')).ownership).toBe('owned');
  });
});
