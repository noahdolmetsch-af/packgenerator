// v0.33.0 (finding 5, stage 2): the data on building blocks. The one-time update in updates.js
// (after toolsAlways2026, idempotent, never loses data), the backup import, the write paths (Gear,
// debrief) and the places that read item.sets with the key 'standard' in it. Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { applyUpdates, blocks2026, blocksAfterImport, UPDATES, toolsAlways2026, templatesLinked2026 } from '../src/lib/updates.js';
import { BLOCKS_MARKER, STANDARD, inStandard, leaveHome, blockKeys } from '../src/lib/blocks2026.js';
import { TEMPLATES_KEY } from '../src/lib/templates.js';
import { matches, weighPriority } from '../src/lib/gear.js';
import { layerOf } from '../src/lib/layers.js';
import { alwaysKeep } from '../src/lib/learn.js';
import { suggestions, applyDebrief, newDebrief } from '../src/lib/debrief.js';
import { allSets, setName, startBlocks, templateBlocks, addSetEntries } from '../src/lib/sets.js';
import { rowReasons } from '../src/lib/reasons.js';
import { lang } from '../src/lib/i18n.svelte.js';

lang.v = 'en';
const item = (id, f = {}) => ({ id: `test_data_gtp_${id}`, name: `test_data_gtp_ ${id}`, category: 'elec', ownership: 'owned', role: null, sets: [], defaultBag: 'top', domains: ['bikepacking'], ...f });

let n = 0;
async function freshDb(items, settings = []) {
  const db = createDb(`stage2-${++n}`);
  await db.items.bulkPut(items);
  if (settings.length) await db.settings.bulkPut(settings);
  return db;
}

describe('the one-time update blocks2026 in updates.js', () => {
  it('runs after toolsAlways2026, only the linked templates of v0.39.0 come after it', () => {
    // v0.55.0: «Bausteine neu» (blockSplit2026) runs last, after the linked templates.
    expect(UPDATES.at(-3)).toBe(blocks2026);
    expect(UPDATES.at(-2)).toBe(templatesLinked2026);
    expect(UPDATES.indexOf(toolsAlways2026)).toBeLessThan(UPDATES.indexOf(blocks2026));
  });

  it('moves role standard / always onto the block Standard, optional onto leaveHome; worn and all other fields stay', async () => {
    const items = [
      item('STD', { role: 'standard', weightG: 120, note: 'keep me' }),
      item('ALW', { always: true, sets: ['sleep'] }),
      item('WRN', { role: 'worn', defaultBag: 'top' }),
      item('OPT', { role: 'optional' }),
      item('PLAIN'),
      item('TUBE', { name: 'test_data_gtp_ spare tube', category: 'tools' }),
    ];
    const tpl = { id: 'tpl-gtp', name: 'test_data_gtp_ Loop', entries: items.map((i) => ({ itemId: i.id, slot: 'top', qty: 1 })) };
    const db = await freshDb(items, [{ key: TEMPLATES_KEY, value: [tpl] }]);
    await applyUpdates(db);
    const got = Object.fromEntries((await db.items.toArray()).map((i) => [i.id.replace('test_data_gtp_', ''), i]));
    expect(got.STD).toMatchObject({ role: 'standard', sets: [STANDARD], weightG: 120, note: 'keep me' });
    expect(got.ALW).toMatchObject({ always: true, sets: ['sleep', STANDARD, 'bivy'] }); // v0.55.0: + Bivouac
    expect(got.WRN).toEqual(items[2]); // worn: nothing changes, also no defaultBag 'body'
    expect(got.OPT).toMatchObject({ role: 'optional', leaveHome: true, sets: [] });
    expect(got.PLAIN).toEqual(items[4]);
    // toolsAlways2026 ran first, so the spare tube is in Standard too
    expect(got.TUBE).toMatchObject({ always: true, sets: [STANDARD, 'repair'] }); // v0.55.0: tools → Repair
    expect((await db.settings.get(BLOCKS_MARKER))?.value).toBeTruthy();
    const [t] = (await db.settings.get(TEMPLATES_KEY)).value;
    // v0.55.0: the old block Sleep became Bivouac; the same entries (the blocks' items come first)
    const byItem = (a, b) => a.itemId.localeCompare(b.itemId);
    expect([...t.entries].sort(byItem)).toEqual([...tpl.entries].sort(byItem));
    expect(t.blocks).toContain(STANDARD);
  });

  it('idempotent: a second run (also without the marker) changes nothing', async () => {
    const db = await freshDb([item('STD', { role: 'standard' }), item('OPT', { role: 'optional' })]);
    await applyUpdates(db);
    const once = await db.items.toArray();
    expect((await blocks2026(db)).items).toEqual([]);
    await db.settings.delete(BLOCKS_MARKER);
    expect((await blocks2026(db)).items).toEqual([]);
    expect(await db.items.toArray()).toEqual(once);
  });

  it('an empty device waits for data (no marker yet)', async () => {
    const db = createDb(`stage2-${++n}`);
    await blocks2026(db);
    expect(await db.settings.get(BLOCKS_MARKER)).toBeUndefined();
  });

  it('a later "Take it along again" (leaveHome false) is not undone by the update', async () => {
    const db = await freshDb([item('OPT', { role: 'optional', leaveHome: false })]);
    await applyUpdates(db);
    expect(leaveHome(await db.items.get('test_data_gtp_OPT'))).toBe(false);
  });
});

describe('backup import: old data gets the update again', () => {
  const oldFile = { tables: { items: [item('STD', { role: 'standard' })], settings: [] } };
  const newFile = { tables: { items: [item('STD', { role: 'standard', sets: [STANDARD] })], settings: [{ key: BLOCKS_MARKER, value: 'x' }] } };

  it('an old file: the marker goes, tidyData (applyUpdates) migrates it', async () => {
    const db = await freshDb([], [{ key: BLOCKS_MARKER, value: 'before' }]);
    await db.items.bulkPut(oldFile.tables.items); // what restoreBackup (merge) wrote
    expect(await blocksAfterImport(db, oldFile, 'merge')).toBe(true);
    await applyUpdates(db);
    expect((await db.items.get('test_data_gtp_STD')).sets).toEqual([STANDARD]);
  });

  it('a file from v0.33.0 on: the marker stays', async () => {
    const db = await freshDb(newFile.tables.items, newFile.tables.settings);
    expect(await blocksAfterImport(db, newFile, 'replace')).toBe(false);
    expect(await db.settings.get(BLOCKS_MARKER)).toBeTruthy();
  });
});

describe('the key standard on item.sets moves nothing it should not', () => {
  const alw = item('ALW', { always: true });
  const migrated = { ...alw, sets: [STANDARD] };

  it('gear filters, weighPriority and layerOf answer the same before and after', () => {
    for (const role of ['none', 'night', 'standard', 'worn', 'optional']) expect([role, matches(migrated, { role })]).toEqual([role, matches(alw, { role })]);
    expect(matches(migrated, { role: 'night' })).toBe(false);
    expect(weighPriority(migrated)).toBe(weighPriority(alw));
    expect(layerOf(migrated)).toEqual(layerOf(alw));
    expect(blockKeys({ sets: [STANDARD, 'bivy'] })).toEqual(['bivy']);
    expect(blockKeys({ sets: [STANDARD, 'sleep'] })).toEqual([]); // v0.55.0: an old key is no block
  });

  it('the filter "Stays at home" reads the new mark; "Take it along again" wins over an old role', () => {
    expect(matches(item('A', { leaveHome: true }), { role: 'optional' })).toBe(true);
    expect(matches(item('B', { role: 'optional', leaveHome: false }), { role: 'optional' })).toBe(false);
  });

  it('Standard is never a building block of its own: not listed, not offered, not counted twice', () => {
    expect(allSets([]).some((s) => s.key === STANDARD)).toBe(false);
    expect(setName(allSets([]), STANDARD)).toBe('Standard');
    lang.v = 'de';
    expect(setName(allSets([]), STANDARD)).not.toBe('standard');
    lang.v = 'en';
    const items = [item('S1', { sets: [STANDARD] }), item('S2', { role: 'standard', sets: [STANDARD] }), item('R', { sets: ['u-gtp-rain'] })];
    const sets = [{ key: STANDARD, name: 'Standard' }, { key: 'u-gtp-rain', name: 'test_data_gtp_ Rain' }];
    const ids = items.map((i) => i.id);
    const std = [items[0].id, items[1].id];
    expect(startBlocks(ids, std, sets, items).map((s) => s.key)).toEqual(['u-gtp-rain']);
    expect(templateBlocks(ids, std, sets, items)).toMatchObject({ standard: true, single: 0 });
    expect(templateBlocks(ids, std, sets, items).blocks.map((s) => s.key)).toEqual(['u-gtp-rain']);
  });

  it('a row added by a block never says "from standard"', () => {
    const i = item('X', { sets: [STANDARD, 'u-gtp-rain'] });
    const trip = { entries: [], setup: { top: 'bag' } };
    const { entries } = addSetEntries(trip, [i], { key: 'u-gtp-rain' });
    const why = rowReasons({ ...trip, entries }, [i], [{ key: 'u-gtp-rain', name: 'test_data_gtp_ Rain' }])[i.id].line;
    expect(why).not.toMatch(/standard/i);
  });
});

describe('11a in the debrief and the ballast: Standard means also the old "On every trip"', () => {
  const trip = { id: 'test_data_gtp_t', title: 'test_data_gtp_ Trip', startDate: '2026-10-01', days: 1, entries: [] };
  const items = [
    item('PHONE', { always: true, sets: [STANDARD] }),
    item('STD', { role: 'standard', sets: [STANDARD] }),
    item('TOOL', { category: 'tools', always: true, sets: [STANDARD] }),
    item('HELMET', { role: 'worn', always: true }),
  ];
  trip.entries = items.map((i) => ({ itemId: i.id, slot: 'top', qty: 1 }));
  const d = { ...newDebrief(trip, 'x'), weather: 'planned', items: Object.fromEntries(items.map((i) => [i.id, 'unused'])) };
  const past = (id) => ({ tripId: id, status: 'done', items: d.items });

  it('"leave at home" for Standard items after 3 trips; never tools, never On me', () => {
    const ids = suggestions(d, trip, items, [], [], [past('a'), past('b')]).map((s) => s.id);
    expect(ids).toContain('optional:test_data_gtp_PHONE');
    expect(ids).toContain('optional:test_data_gtp_STD');
    expect(ids).not.toContain('optional:test_data_gtp_TOOL');
    expect(ids).not.toContain('optional:test_data_gtp_HELMET');
  });

  it('applying it writes the new mark, takes it out of Standard and keeps role / always in step', () => {
    const out = applyDebrief(d, trip, items, [], [], ['optional:test_data_gtp_PHONE'], { now: 'N' });
    const [phone] = out.items;
    expect(phone).toMatchObject({ role: 'optional', leaveHome: true, always: false, sets: [], updatedAt: 'N' });
    expect(inStandard(phone)).toBe(false);
  });

  it('tools and worn items stay "never ballast"; Standard items can be ballast (Noah a)', () => {
    expect(alwaysKeep(item('T', { category: 'tools' }))).toBe(true);
    expect(alwaysKeep(item('W', { role: 'worn' }))).toBe(true);
    expect(alwaysKeep(item('S', { sets: [STANDARD] }))).toBe(false);
    expect(alwaysKeep(item('A', { always: true }))).toBe(false);
    expect(alwaysKeep(item('P'))).toBe(false);
  });
});
