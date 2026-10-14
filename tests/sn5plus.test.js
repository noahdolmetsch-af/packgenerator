// SN5+ «SN5 plus» (Noah 13.10.2026, answers 1a 2a 3a 4a 5b): Favoriten and Import prüfen.
// Fictional data only (test_data_gtp_ names).
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { favoritesByDomain } from '../src/lib/domains.js';
import { favBars, oftenTaken, lastTrips, favBlock, favDrift, favIdsOf, withFavIds, saveFavBlock, takeDrift, MIN_TRIPS } from '../src/lib/favplus.js';
import { suggestBag, BAG_BY_CATEGORY, importWeight, changeLines, importRecord, pushHistory, undoPlan, gearGrams, KEEP, HISTORY } from '../src/lib/gear/importplus.js';
import { planGearImport, buildWrites, newItem, SKIP } from '../src/lib/gearimport.js';
import { stageImport, applyImport, undoEntry, importHistory, undoImport, setPlace, UNDO } from '../src/lib/gear/importdb.js';
import { SETS_KEY, allSets } from '../src/lib/sets.js';
import { CATEGORIES, BAG } from '../src/lib/gear.js';
import { undoBulk } from '../src/lib/gear/bulk.js';

const N = (s) => `test_data_gtp_${s}`;
const item = (id, fields = {}) => ({ id, name: N(id), category: 'tools', weightG: 100, qty: 1, ownership: 'owned', role: null, sets: [], domains: ['bikepacking'], ...fields });
const trip = (id, startDate, ids, fields = {}) => ({ id, title: N(id), startDate, days: 1, entries: ids.map((itemId) => ({ itemId, slot: 'seat', qty: 1 })), ...fields });
const TODAY = '2026-10-09';

describe('F1 the bar per trip kind', () => {
  it('the heaviest kind is the full bar, the others in proportion', () => {
    const items = [item('A', { favorite: true, weightG: 1200 }), item('B', { favorite: true, weightG: 380, domains: ['weekend'] }), item('C', { favorite: true, weightG: 380, domains: ['weekend'] })];
    const bars = favBars(favoritesByDomain(items));
    expect(bars).toEqual({ bikepacking: 1, weekend: 760 / 1200 });
  });
  it('no weight at all: every bar is empty, never NaN', () => {
    expect(favBars([{ key: 'ski', grams: 0 }])).toEqual({ ski: 0 });
    expect(favBars([])).toEqual({});
  });
});

describe('F2 «Oft dabei»', () => {
  const items = [item('OFT'), item('HALF'), item('LESS'), item('STAR', { favorite: true }), item('WISH', { ownership: 'wishlist' }), item('SKI')];
  const trips = [
    trip('t1', '2026-09-01', ['OFT', 'HALF', 'STAR', 'WISH']),
    trip('t2', '2026-09-10', ['OFT', 'HALF', 'LESS', 'STAR', 'WISH']),
    trip('t3', '2026-09-20', ['OFT', 'STAR']),
    trip('t4', '2026-10-01', ['OFT']),
    trip('future', '2026-11-01', ['LESS', 'LESS']), // not taken place yet
    trip('skipped', '2026-09-05', ['LESS'], { skipped: true }),
    trip('ski1', '2026-02-01', ['SKI'], { domain: 'ski' }), // one ski trip only: says nothing about «often»
  ];
  it('on at least half of the trips of a kind, without a star, owned', () => {
    const rows = oftenTaken(items, trips, TODAY);
    expect(rows.map((r) => [r.item.id, r.n, r.of, r.domain])).toEqual([
      ['OFT', 4, 4, 'bikepacking'],
      ['HALF', 2, 4, 'bikepacking'],
    ]);
  });
  it('just under half is not «often»; a kind needs MIN_TRIPS trips', () => {
    expect(MIN_TRIPS).toBe(2);
    const five = [...trips, trip('t5', '2026-10-05', ['OFT'])];
    expect(oftenTaken(items, five, TODAY).map((r) => r.item.id)).toEqual(['OFT']); // HALF: 2 of 5
    expect(oftenTaken(items, trips, TODAY).some((r) => r.item.id === 'SKI')).toBe(false);
    expect(oftenTaken(items, [...trips, trip('ski2', '2026-03-01', ['SKI'], { domain: 'ski' })], TODAY).find((r) => r.item.id === 'SKI')).toMatchObject({ n: 2, of: 2, domain: 'ski' });
  });
  it('«Nicht mehr vorschlagen» leaves it out; no trips: nothing', () => {
    expect(oftenTaken(items, trips, TODAY, { off: ['OFT'] }).map((r) => r.item.id)).toEqual(['HALF']);
    expect(oftenTaken(items, [], TODAY)).toEqual([]);
  });
});

describe('F3 «zuletzt dabei»', () => {
  it('the newest trip that took place with the item; none: missing', () => {
    const trips = [trip('old', '2026-09-01', ['A', 'B']), trip('new', '2026-10-07', ['A']), trip('next', '2026-10-20', ['A', 'C']), trip('skip', '2026-10-08', ['B'], { skipped: true })];
    const last = lastTrips(trips, TODAY);
    expect(last.A).toMatchObject({ date: '2026-10-07', trip: { id: 'new' } });
    expect(last.B).toMatchObject({ date: '2026-09-01', trip: { id: 'old' } });
    expect(last.C).toBeUndefined(); // only on a trip still to come: «noch auf keiner Tour»
  });
});

describe('F4 «Als Baustein speichern»: a copy, and the hint when the stars change', () => {
  const items = [item('P', { favorite: true }), item('F', { favorite: true }), item('R', { favorite: true }), item('W', { favorite: true, domains: ['weekend'] }), item('X')];
  it('makes an own block with the chosen favourites; it remembers all favourites of the kind', () => {
    const res = favBlock([], items, 'bikepacking', ['P', 'F'], N('Favoriten Bikepacking'), 'now');
    const rec = res.value.find((s) => s.key === res.key);
    expect(rec).toMatchObject({ name: N('Favoriten Bikepacking'), fav: { domain: 'bikepacking', ids: ['F', 'P', 'R'], at: 'now' } });
    expect(res.items.map((i) => i.id)).toEqual(['P', 'F']);
    expect(res.items.every((i) => i.sets.includes(res.key))).toBe(true);
    expect(allSets(res.value).find((s) => s.key === res.key).fav.domain).toBe('bikepacking');
    expect(favBlock(res.value, items, 'bikepacking', ['P'], N('Favoriten Bikepacking')).error).toBe('taken');
  });
  it('no change: no hint; a new star and a star taken away: n changes; R (left out on purpose) is no change', () => {
    const res = favBlock([], items, 'bikepacking', ['P', 'F'], N('Fav'));
    const set = res.value.find((s) => s.key === res.key);
    const now = items.map((i) => res.items.find((c) => c.id === i.id) ?? i);
    expect(favDrift(set, now)).toMatchObject({ n: 0 });
    const later = now.map((i) => (i.id === 'X' ? { ...i, favorite: true } : i.id === 'F' ? { ...i, favorite: null } : i));
    const d = favDrift(set, later);
    expect(d).toMatchObject({ add: ['X'], drop: ['F'], n: 2, now: ['P', 'R', 'X'] });
    // after the tap the block remembers today's favourites: no hint any more
    const value = withFavIds(res.value, res.key, d.now);
    const moved = later.map((i) => (i.id === 'X' ? { ...i, sets: [res.key] } : i.id === 'F' ? { ...i, sets: [] } : i));
    expect(favDrift(value.find((s) => s.key === res.key), moved).n).toBe(0);
    expect(favDrift({ key: 'u-x' }, items)).toBeNull(); // a block not made from favourites
    expect(favIdsOf(items, 'weekend')).toEqual(['W']);
  });
  it('in the database: save, then take the changes over with one Undo', async () => {
    const db = createDb(`gtp-sn5p-fav-${Math.random()}`);
    await db.items.bulkPut(items);
    const made = await saveFavBlock(db, 'bikepacking', ['P', 'F', 'R'], N('Fav DB'));
    const key = made.key;
    expect((await db.items.get('P')).sets).toEqual([key]);
    await db.items.update('X', { favorite: true });
    await db.items.update('R', { favorite: null });
    const rec = (await db.settings.get(SETS_KEY)).value.find((s) => s.key === key);
    expect(favDrift({ ...rec, key }, await db.items.toArray()).n).toBe(2);
    const res = await takeDrift(db, key);
    expect(res.n).toBe(2);
    expect((await db.items.get('X')).sets).toEqual([key]);
    expect((await db.items.get('R')).sets).toEqual([]);
    expect((await db.items.get('R')).favorite).toBeNull(); // the stars stay as they are
    await undoBulk(db, res.snap);
    expect((await db.items.get('X')).sets).toEqual([]);
    expect((await db.items.get('R')).sets).toEqual([key]);
    // «nein»: nothing moves, the hint goes
    const kept = await takeDrift(db, key, { keep: true });
    expect(kept.n).toBe(0);
    expect((await db.items.get('X')).sets).toEqual([]);
    const after = (await db.settings.get(SETS_KEY)).value.find((s) => s.key === key);
    expect(favDrift({ ...after, key }, await db.items.toArray()).n).toBe(0);
  });
});

describe('I3 a bag for a new item from its category', () => {
  it('every category has a suggestion (bags none); it is a real bag', () => {
    for (const c of CATEGORIES) expect(c.key in BAG_BY_CATEGORY, c.key).toBe(true);
    for (const v of Object.values(BAG_BY_CATEGORY)) if (v) expect(BAG[v], v).toBeTruthy();
    expect(suggestBag('light')).toBe('top');
    expect(suggestBag('rain')).toBe('seat');
    expect(suggestBag('tools')).toBe('frame');
    expect(suggestBag('bags')).toBeNull();
    expect(suggestBag('unknown')).toBe('seat');
  });
  it('a new item gets it; a chosen category or bag wins, a bag can be taken away', () => {
    const imp = { sourceId: 'S1', name: N('Stirnlampe'), category: 'light', weightG: 85 };
    expect(newItem(imp, [], 'now').defaultBag).toBe('top');
    expect(newItem(imp, [], 'now', { category: 'elec' })).toMatchObject({ category: 'elec', defaultBag: 'top' });
    expect(newItem(imp, [], 'now', { category: 'rain' })).toMatchObject({ category: 'rain', defaultBag: 'seat' });
    expect(newItem(imp, [], 'now', { bag: 'frame' }).defaultBag).toBe('frame');
    expect(newItem(imp, [], 'now', { bag: null }).defaultBag).toBeNull();
    const file = { kind: 'gear-import', version: 1, items: [imp] };
    expect(planGearImport(file, [], [], 'now', { S1: { bag: 'bar' } }).fresh[0].item.defaultBag).toBe('bar');
    expect(buildWrites(file, [], [], {}, 'now', { S1: { category: 'elec', bag: 'body' } }).items[0]).toMatchObject({ category: 'elec', defaultBag: 'body' });
  });
});

const FILE = {
  kind: 'gear-import',
  version: 1,
  items: [
    { sourceId: 'S1', name: N('Regenhose leicht'), category: 'rain', weightG: 230, owned: true },
    { sourceId: 'S2', name: N('Kettenoel klein'), category: 'tools', weightG: 60, owned: true },
    { sourceId: 'S3', name: N('Ersatzspeichen'), category: 'tools', owned: true },
    { sourceId: 'S4', name: N('Packraft'), category: 'lux', weightG: 2400, owned: false },
    { sourceId: 'S5', name: N('Sonnencreme'), category: 'hyg', weightG: 60, areas: ['Alltag'], notes: 'LSF 50, kleine Tube' },
    { sourceId: 'S6', name: N('Multitool'), category: 'tools', weightG: 150, areas: ['Wochenende'] },
  ],
};
const HAVE = [item('HY01', { name: N('Sonnencreme'), category: 'hyg', weightG: null }), item('TO01', { name: N('Multitool'), weightG: 150 }), item('SL01', { name: N('Schlafsack'), category: 'sleep', weightG: 650 }), item('WL01', { name: N('Wunschzelt'), ownership: 'wishlist', weightG: 900 })];

describe('I1 the weight before and after', () => {
  it('counts the new owned items taken and weights filled in; names the unweighed', () => {
    const plan = planGearImport(FILE, HAVE, [], 'now');
    const w = importWeight(plan, HAVE, {});
    expect(w.before).toBe(800); // 150 + 650; the wishlist and unweighed do not count
    expect(w.delta).toBe(230 + 60 + 60); // new rain trousers and oil, the sun cream gets its 60 g; the packraft is a wish
    expect(w.after).toBe(1150);
    expect(w.unweighed).toEqual([N('Ersatzspeichen')]);
  });
  it('a new item tapped off does not count', () => {
    const plan = planGearImport(FILE, HAVE, [], 'now');
    expect(importWeight(plan, HAVE, { S1: SKIP }).delta).toBe(120);
    expect(importWeight(plan, HAVE, { S1: SKIP, S3: SKIP }).unweighed).toEqual([]);
    expect(gearGrams(HAVE)).toBe(800);
  });
});

describe('I2 what «Schon da» gets and what stays', () => {
  it('«+ Reiseart», «+ Notiz», the weight when it had none; never the source ID', () => {
    const plan = planGearImport(FILE, HAVE, [], 'now');
    const sun = changeLines(plan.same.find((r) => r.item.id === 'HY01'));
    expect(sun.adds.map((a) => a.field)).toEqual(['weightG', 'domains', 'note']);
    expect(sun.adds.find((a) => a.field === 'domains').value).toEqual(['everyday']);
    expect(sun.adds.find((a) => a.field === 'note').value).toBe('LSF 50, kleine Tube');
    expect(sun.stays).toEqual([{ field: 'name' }, { field: 'category' }]); // its weight is new, so it is not «stays»
    const tool = changeLines(plan.same.find((r) => r.item.id === 'TO01'));
    expect(tool.adds).toEqual([{ field: 'domains', value: ['weekend'] }]);
    expect(tool.stays).toEqual([{ field: 'weightG', value: 150 }, { field: 'name' }, { field: 'category' }]);
    expect(changeLines({ item: HAVE[2], adds: [{ field: 'sourceId', value: 'S9' }] }).adds).toEqual([]);
  });
});

describe('I4 / 5b: each of the last three imports can be undone', () => {
  it('a record keeps what was added and the values changed; the history keeps three', () => {
    const pre = [item('A', { note: '' }), item('B')];
    const written = [{ ...pre[0], note: 'neu', domains: ['bikepacking', 'everyday'], sourceId: 'S1', updatedAt: 'T1' }, item('NEW1', { updatedAt: 'T1', weightG: 40 })];
    const rec = importRecord({ at: 'T1', name: 'liste.json', counts: { added: 1, enriched: 1 }, pre, written });
    expect(rec.added).toEqual([{ id: 'NEW1', name: N('NEW1'), updatedAt: 'T1' }]);
    expect(rec.changed).toEqual([{ id: 'A', name: N('A'), before: { note: '', domains: ['bikepacking'] }, after: { note: 'neu', domains: ['bikepacking', 'everyday'], sourceId: 'S1' }, absent: ['sourceId'] }]);
    expect(rec.counts).toEqual({ added: 1, completed: 1, wishlist: 0 });
    expect(rec.grams).toBe(40);
    let list = [];
    for (const at of ['1', '2', '3', '4']) list = pushHistory(list, { id: at, at });
    expect(list.map((e) => e.id)).toEqual(['4', '3', '2']);
    expect(KEEP).toBe(3);
  });
  it('undo takes back only what nobody changed since, and names the rest', () => {
    const entry = {
      added: [{ id: 'N1', name: 'n1', updatedAt: 'T1' }, { id: 'N2', name: 'n2', updatedAt: 'T1' }, { id: 'N3', name: 'n3', updatedAt: 'T1' }],
      changed: [{ id: 'A', name: 'a', before: { note: '' }, after: { note: 'neu', sourceId: 'S1' }, absent: ['sourceId'] }],
      learnAdded: [{ id: 7, rule: 'r' }],
      learnChanged: [],
    };
    const items = [item('N1', { updatedAt: 'T1' }), item('N2', { updatedAt: 'T9' }), item('N3', { updatedAt: 'T1' }), item('A', { note: 'selbst geschrieben', sourceId: 'S1' })];
    const p = undoPlan(entry, { items, learnings: [{ id: 7, rule: 'r' }], trips: [trip('t', '2026-10-01', ['N3'])] }, 'NOW');
    expect(p.delItems).toEqual(['N1']);
    expect(p.kept.map((k) => [k.id, k.why])).toEqual([['N2', 'changed'], ['N3', 'trip'], ['A', 'changed']]);
    // the source ID it set goes, the note written since stays
    expect(p.putItems).toHaveLength(1);
    expect(p.putItems[0]).not.toHaveProperty('sourceId');
    expect(p.putItems[0]).toMatchObject({ note: 'selbst geschrieben', updatedAt: 'NOW' });
    expect(p.delLearn).toEqual([7]);
  });

  let db;
  beforeEach(() => {
    db = createDb(`gtp-sn5p-imp-${Math.random()}`);
  });
  const file = (n, items) => ({ kind: 'gear-import', version: 1, items: items.map((x, i) => ({ sourceId: `F${n}-${i}`, owned: true, ...x })) });
  async function apply(data, name, at) {
    expect(await stageImport(db, data, name, at)).toEqual([]);
    return applyImport(db, at);
  }

  it('three imports, the oldest undone first: its items go, the later ones stay; a conflict stays and is named', async () => {
    await db.items.bulkPut([item('TO01', { name: N('Multitool'), weightG: 150 })]);
    await apply(file(1, [{ name: N('Erste Lampe'), category: 'light', weightG: 85 }, { name: N('Multitool'), category: 'tools', notes: 'Bit-Satz' }]), 'eins.json', '2026-10-01T10:00:00.000Z');
    await apply(file(2, [{ name: N('Zweite Jacke'), category: 'rain', weightG: 300 }]), 'zwei.json', '2026-10-02T10:00:00.000Z');
    await apply(file(3, [{ name: N('Dritte Pumpe'), category: 'tools', weightG: 90 }]), 'drei.json', '2026-10-03T10:00:00.000Z');
    const hist = await importHistory(db);
    expect(hist.map((e) => e.name)).toEqual(['drei.json', 'zwei.json', 'eins.json']);
    expect(hist[2]).toMatchObject({ counts: { added: 1, completed: 1 }, grams: 85 });
    const lamp = (await db.items.toArray()).find((i) => i.name === N('Erste Lampe'));
    expect(lamp.defaultBag).toBe('top'); // I3: the suggested bag
    // An edit after the first import: the multitool's note changed by hand.
    const tool = await db.items.get('TO01');
    expect(tool.note).toBe('Bit-Satz');
    await db.items.update('TO01', { note: 'Bit-Satz, selbst ergänzt' });
    // Undo the OLDEST import.
    const res = await undoEntry(db, hist[2].id, '2026-10-04T10:00:00.000Z');
    const names = (await db.items.toArray()).map((i) => i.name).sort();
    expect(names).toEqual([N('Dritte Pumpe'), N('Multitool'), N('Zweite Jacke')]);
    expect(res.kept.map((k) => k.id)).toEqual(['TO01']);
    const after = await db.items.get('TO01');
    expect(after.note).toBe('Bit-Satz, selbst ergänzt'); // the later edit stays
    expect(after.sourceId).toBeUndefined(); // what nobody touched since went back
    expect(await db.table('meta').get(UNDO)).toBeUndefined(); // the full backup would bring the import back
    const hist2 = await importHistory(db);
    expect(hist2[2]).toMatchObject({ undone: '2026-10-04T10:00:00.000Z', kept: [{ id: 'TO01', why: 'changed' }] });
    await expect(undoEntry(db, hist[2].id)).rejects.toThrow();
    // Then the middle one: its jacket goes, the newest import stays.
    await undoEntry(db, hist[1].id);
    expect((await db.items.toArray()).map((i) => i.name).sort()).toEqual([N('Dritte Pumpe'), N('Multitool')]);
    // And the newest.
    await undoEntry(db, hist[0].id);
    expect((await db.items.toArray()).map((i) => i.name)).toEqual([N('Multitool')]);
  });

  it('an item a later import completed stays when the earlier import that added it is undone', async () => {
    await apply(file(1, [{ name: N('Kompass'), category: 'tools' }]), 'eins.json', '2026-10-01T10:00:00.000Z');
    const kompass = (await db.items.toArray())[0];
    await apply({ kind: 'gear-import', version: 1, items: [{ sourceId: 'F1-0', name: N('Kompass'), category: 'tools', weightG: 35 }] }, 'zwei.json', '2026-10-02T10:00:00.000Z');
    expect((await db.items.get(kompass.id)).weightG).toBe(35);
    const [newest, oldest] = await importHistory(db);
    const res = await undoEntry(db, oldest.id);
    expect(res.kept).toEqual([{ id: kompass.id, name: N('Kompass'), why: 'changed' }]);
    expect(await db.items.get(kompass.id)).toBeTruthy();
    // the newer one can still be undone: its weight goes back to none
    await undoEntry(db, newest.id);
    expect((await db.items.get(kompass.id)).weightG).toBeNull();
  });

  it('the full «Rückgängig» of the newest import also takes it out of the list; a chosen bag is applied', async () => {
    await stageImport(db, file(1, [{ name: N('Lampe'), category: 'light', weightG: 85 }]), 'eins.json', '2026-10-01T09:00:00.000Z');
    await setPlace(db, 'F1-0', { bag: 'bar' });
    await applyImport(db, '2026-10-01T10:00:00.000Z');
    expect((await db.items.toArray())[0].defaultBag).toBe('bar');
    expect((await db.table('meta').get(HISTORY)).list).toHaveLength(1);
    await undoImport(db);
    expect(await db.items.count()).toBe(0);
    expect(await importHistory(db)).toEqual([]);
  });
});
