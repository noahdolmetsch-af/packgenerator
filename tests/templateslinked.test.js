// v0.39.0 (AP28, "Vorlagen neu"): templates linked to building blocks. The one-time update keeps
// every template's content identical (Noah 2a), a changed block changes the templates (3a),
// "without" and extras (1a), usage (7a), "long not used" with Keep (6a), deleting a block keeps its
// items, and a trip from a template takes the template's area, also without a bike. Fictional data only.
import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { splitAll } from '../src/lib/blocksplit.js';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { templatesLinked2026, LINKED_MARKER } from '../src/lib/updates.js';
import {
  TEMPLATES_KEY, linkTemplate, linkEntries, templateItems, templateEntries, sameEntries, syncTemplate, templateUse, isStale, templateAreas,
  tripFromTemplate, saveTemplates, loadTemplates, saveTripAsTemplate, templateParts, dropBlock, templatesWith, blankTemplate, templateWeight, isLinked,
} from '../src/lib/templates.js';
import { deleteSet, assignSet, setQtyIn } from '../src/lib/gear/assign.js';
import { blocksLine } from '../src/lib/sets.js';
import { applyDebrief } from '../src/lib/debrief.js';
import { lang } from '../src/lib/i18n.svelte.js';

lang.v = 'en';
const fixture = (name) => JSON.parse(readFileSync(new URL(`./e2e/${name}`, import.meta.url), 'utf8'));
const settingOf = (d, key) => d.tables.settings.find((r) => r.key === key)?.value;
const FIX = fixture('templates-fixture.json');
const items0 = FIX.tables.items;
const sets0 = settingOf(FIX, 'sets');
const tpls0 = settingOf(FIX, TEMPLATES_KEY);
const byId = (list, id) => list.find((x) => x.id === id);
const ids = (list) => list.map((e) => e.itemId).sort();
const P = 'test_data_gtp_';

let n = 0;
async function dbWith(items, settings) {
  const db = createDb(`tpl-linked-${++n}`);
  await db.items.bulkPut(structuredClone(items));
  await db.settings.bulkPut(structuredClone(settings));
  return db;
}

describe('the one-time update: identical content (Noah 2a)', () => {
  const fixtures = ['templates-fixture.json', 'gear-fixture.json', 'pf-fixture.json'].map((f) => [f, fixture(f)]);
  for (const [file, d] of fixtures) {
    for (const tpl of settingOf(d, TEMPLATES_KEY) ?? []) {
      it(`${file}: ${tpl.name} gives exactly its old entries (ids, place, amount)`, () => {
        const linked = linkTemplate(tpl, d.tables.items, settingOf(d, 'sets') ?? []);
        expect(isLinked(linked)).toBe(true);
        expect(sameEntries(templateEntries(linked, d.tables.items, settingOf(d, 'sets') ?? []), tpl.entries)).toBe(true);
        expect(linked.entries).toEqual(tpl.entries); // the snapshot stays untouched
        expect(linked.domain).toBe(tpl.domain ?? 'bikepacking'); // older templates: bikepacking
        expect(linked.createdAt).toBe(tpl.updatedAt ?? null);
      });
    }
  }

  it('a block item the template does not have is saved as "without", the rest as extras', () => {
    // Sun cream (HY01) came into Standard after the template was saved (the finding of the proposal).
    const items = items0.map((i) => (i.id === 'HY01' ? { ...i, role: 'standard' } : i));
    const feier = linkTemplate(byId(tpls0, 'tpl-feier'), items, sets0);
    expect(feier.blocks).toEqual(['standard']);
    expect(feier.without).toEqual({ standard: ['HY01'] });
    expect(feier.extras).toEqual([{ itemId: 'FO01', qty: 1 }]);
    expect(blocksLine(templateParts(feier, sets0))).toBe('Standard + 1 extra');
    const jura = linkTemplate(byId(tpls0, 'tpl-jura'), items, sets0);
    // v0.55.0 «Bausteine neu»: the old blocks Sleep and Light become Bivouac and Light (blocksplit.js), same items.
    const up = splitAll({ items, templates: [jura], sets: sets0 });
    expect(blocksLine(templateParts(up.templates[0], up.sets))).toBe('Standard + Bivouac + Light + Regen + 1 extra');
    expect(sameEntries(templateEntries(up.templates[0], up.items, up.sets), templateEntries(jura, items, sets0))).toBe(true);
  });

  it('runs once in one transaction with a marker; a second run changes nothing', async () => {
    const db = await dbWith(items0, FIX.tables.settings);
    const first = await templatesLinked2026(db);
    expect(first.sort()).toEqual(tpls0.map((x) => x.id).sort());
    expect((await db.settings.get(LINKED_MARKER))?.value).toBeTruthy();
    const after = await loadTemplates(db);
    for (const tpl of tpls0) expect(byId(after, tpl.id).entries).toEqual(tpl.entries);
    expect(await templatesLinked2026(db)).toEqual([]);
    expect(await loadTemplates(db)).toEqual(after);
  });

  it('links a template that comes later without the new fields (an old backup), and only that one', async () => {
    const db = await dbWith(items0, FIX.tables.settings);
    await templatesLinked2026(db);
    const list = await loadTemplates(db);
    const old = { id: 'tpl-old', name: `${P} old`, setup: {}, entries: [{ itemId: 'FO01', slot: 'top', qty: 2 }], ready: [], updatedAt: '2025-01-01T00:00:00.000Z' };
    await db.settings.put({ key: TEMPLATES_KEY, value: [...list, old] });
    expect(await templatesLinked2026(db)).toEqual(['tpl-old']);
    const got = byId(await loadTemplates(db), 'tpl-old');
    expect(got.extras).toEqual([{ itemId: 'FO01', qty: 2 }]);
    expect(got.entries).toEqual(old.entries);
  });
});

describe('linked to the blocks (Noah 3a)', () => {
  const regen = () => linkTemplate(byId(tpls0, 'tpl-regen'), items0, sets0);

  it('an item put into a block comes into every template with that block; taken out, it goes', () => {
    const tpl = regen();
    const more = [...items0.map((i) => (i.id === 'FO01' ? { ...i, sets: ['u-regen'] } : i))];
    expect(ids(templateItems(tpl, more, sets0))).toContain('FO01');
    const less = items0.map((i) => (i.id === 'RA05' ? { ...i, sets: [] } : i));
    expect(ids(templateItems(tpl, less, sets0))).not.toContain('RA05');
  });

  it('the amount of a block item follows the block; an own amount in the template wins', () => {
    const tpl = regen();
    const sets = [{ key: 'u-regen', name: 'Regen', qty: { RA05: 2 } }];
    expect(templateItems(tpl, items0, sets).find((e) => e.itemId === 'RA05').qty).toBe(2);
    expect(templateItems({ ...tpl, qty: { RA05: 3 } }, items0, sets).find((e) => e.itemId === 'RA05').qty).toBe(3);
  });

  it('through the database: a block change rewrites the entries snapshot of the templates', async () => {
    const db = await dbWith(items0, FIX.tables.settings);
    await templatesLinked2026(db);
    await assignSet(db, ['FO01'], 'u-regen');
    const list = await loadTemplates(db);
    expect(ids(byId(list, 'tpl-regen').entries)).toContain('FO01');
    await setQtyIn(db, 'u-regen', 'RA03', 2);
    expect(byId(await loadTemplates(db), 'tpl-regen').entries.find((e) => e.itemId === 'RA03').qty).toBe(2);
  });
});

describe('without and extras (Noah 1a)', () => {
  it('a member left out stays out, also when the block changes; an extra keeps its amount', () => {
    const base = { ...blankTemplate({ id: 't1', name: 'x' }), blocks: ['standard', 'u-regen'], without: { 'u-regen': ['RA04'] }, extras: [{ itemId: 'FO01', qty: 3 }] };
    const got = templateItems(base, items0, sets0);
    expect(ids(got)).not.toContain('RA04');
    expect(got.find((e) => e.itemId === 'FO01')).toMatchObject({ qty: 3, block: null });
    expect(got.find((e) => e.itemId === 'RA03').block).toBe('u-regen');
  });

  it('an item in two blocks comes once; left out of one block, it still comes from the other', () => {
    const items = items0.map((i) => (i.id === 'LI03' ? { ...i, sets: ['light', 'u-regen'] } : i));
    const tpl = { ...blankTemplate({ id: 't2', name: 'x' }), blocks: ['light', 'u-regen'], without: { light: ['LI03'] } };
    expect(templateItems(tpl, items, sets0).filter((e) => e.itemId === 'LI03')).toHaveLength(1);
  });

  it('an older writer (debrief "take out", "put in") becomes without and extras on save', () => {
    const tpl = linkTemplate(byId(tpls0, 'tpl-regen'), items0, sets0);
    const out = { ...tpl, entries: tpl.entries.filter((e) => e.itemId !== 'RA04') };
    const saved = syncTemplate(out, tpl, items0, sets0);
    expect(saved.without['u-regen']).toEqual(['RA04']);
    const inn = { ...saved, entries: [...saved.entries, { itemId: 'SL01', slot: 'seat', qty: 1 }] };
    const saved2 = syncTemplate(inn, saved, items0, sets0);
    expect(saved2.extras.map((x) => x.itemId)).toContain('SL01');
    expect(ids(saved2.entries)).toEqual(ids(inn.entries));
  });

  it('a page that changes the linked fields and saves a fresh snapshot is no older writer', () => {
    const tpl = linkTemplate(byId(tpls0, 'tpl-feier'), items0, sets0);
    const next = { ...tpl, blocks: [...tpl.blocks, 'u-regen'] };
    const fresh = { ...next, entries: templateEntries(next, items0, sets0) };
    const saved = syncTemplate(fresh, tpl, items0, sets0);
    expect(saved.without ?? {}).toEqual(tpl.without ?? {});
    expect(ids(saved.entries)).toEqual(expect.arrayContaining(['RA03', 'RA04', 'RA05']));
  });

  it('the debrief "Update template" goes through the same path', () => {
    const tpl = linkTemplate(byId(tpls0, 'tpl-feier'), items0, sets0);
    const trip = { id: 'tr', title: 't', entries: [{ itemId: 'FO01', slot: 'top', qty: 1 }], templateId: tpl.id };
    const out = applyDebrief({ items: { FO01: 'unused' }, missing: [], note: '' }, trip, items0, [], [tpl], [`template:${tpl.id}`]);
    const saved = syncTemplate(out.templates[0], tpl, items0, sets0);
    expect(saved.extras).toEqual([]);
  });

  it('linkEntries puts other places and amounts into slots and qty, and gives the entries back', () => {
    const tpl = { ...blankTemplate({ id: 't3', name: 'x' }), blocks: ['u-regen'], setup: { seat: 'bag-TA01', top: 'bag-TA03' } };
    const want = [{ itemId: 'RA03', slot: 'top', qty: 2 }, { itemId: 'RA04', slot: 'seat', qty: 1 }, { itemId: 'RA05', slot: 'top', qty: 1 }];
    const linked = linkEntries(tpl, want, items0, sets0);
    expect(linked.slots).toEqual({ RA03: 'top' });
    expect(linked.qty).toEqual({ RA03: 2 });
    expect(sameEntries(linked.entries, want)).toBe(true);
  });
});

describe('usage (Noah 7a) and long not used (6a)', () => {
  const today = '2026-10-09';
  const tpl = { id: 'tpl-x', createdAt: '2024-01-01T00:00:00.000Z' };
  const trip = (id, startDate, f = {}) => ({ id, startDate, templateId: 'tpl-x', ...f });

  it('counts trips started or ridden, not planned or skipped ones', () => {
    const use = templateUse(tpl, [trip('a', '2026-09-01'), trip('b', '2026-10-09'), trip('c', '2026-10-20'), trip('d', '2026-08-01', { skipped: true }), { ...trip('e', '2026-08-02'), templateId: 'other' }], today);
    expect(use.n).toBe(2);
    expect(use.last).toBe('2026-10-09');
  });

  it('is long not used after 12 months without a trip; Keep rests it for 12 months; archived never', () => {
    expect(isStale(tpl, [trip('a', '2025-10-08')], today)).toBe(true);
    expect(isStale(tpl, [trip('a', '2025-10-10')], today)).toBe(false);
    expect(isStale(tpl, [], today)).toBe(true); // never used, made long ago
    expect(isStale({ ...tpl, keptAt: '2026-01-01T10:00:00.000Z' }, [], today)).toBe(false);
    expect(isStale({ ...tpl, keptAt: '2025-09-01T10:00:00.000Z' }, [], today)).toBe(true);
    expect(isStale({ ...tpl, archivedAt: '2026-10-01T00:00:00.000Z' }, [], today)).toBe(false);
    expect(isStale({ id: 'n', createdAt: '2026-09-01T00:00:00.000Z' }, [], today)).toBe(false);
  });

  it('the area switch shows only areas with templates (Noah 5a)', () => {
    expect(templateAreas([{ domain: 'hiking' }, {}, { domain: 'bikepacking' }, { domain: 'ski', archivedAt: 'x' }])).toEqual([{ key: 'bikepacking', n: 2 }, { key: 'hiking', n: 1 }]);
  });
});

describe('deleting a building block keeps its items in the templates', () => {
  it('pure: the block goes, its items stay as extras', () => {
    const tpl = linkTemplate(byId(tpls0, 'tpl-regen'), items0, sets0);
    const [after] = dropBlock([tpl], 'u-regen', items0, sets0);
    expect(after.blocks).toEqual(['standard']);
    expect(after.extras.map((x) => x.itemId).sort()).toEqual(['RA03', 'RA04', 'RA05']);
    expect(sameEntries(after.entries, templateEntries(tpl, items0, sets0))).toBe(true);
    expect(templatesWith([tpl], 'u-regen')).toHaveLength(1);
  });

  it('database: deleteSet keeps every item of every template, and Undo can bring the templates back', async () => {
    const db = await dbWith(items0, FIX.tables.settings);
    await templatesLinked2026(db);
    const before = await loadTemplates(db);
    const res = await deleteSet(db, 'u-regen');
    expect(res.snap.templates.value).toEqual(before);
    const items = await db.items.toArray();
    const sets = (await db.settings.get('sets')).value;
    for (const tpl of await loadTemplates(db)) {
      expect(tpl.blocks).not.toContain('u-regen');
      expect(sameEntries(templateEntries(tpl, items, sets), byId(before, tpl.id).entries)).toBe(true);
    }
  });
});

describe('a trip from a template', () => {
  const bike = FIX.tables.bikes[0];

  it('takes the area of the template and the items of its blocks and extras', () => {
    const tpl = linkTemplate(byId(tpls0, 'tpl-jura'), items0, sets0);
    const trip = tripFromTemplate({ title: 'x', startDate: '2026-10-20', days: 2, bike }, tpl, items0, 5, sets0);
    expect(trip.domain).toBe('bikepacking');
    expect(trip.bikeId).toBe(bike.id);
    expect(ids(trip.entries)).toEqual(expect.arrayContaining(ids(tpl.entries)));
    expect(trip.templateId).toBe('tpl-jura');
  });

  it('a hiking template without a bike makes a hiking trip with the area bags', () => {
    const tpl = { ...blankTemplate({ id: 'tpl-hike', name: `${P} Rigi`, domain: 'hiking' }), extras: [{ itemId: 'HK01', qty: 1 }, { itemId: 'HK02', qty: 1 }, { itemId: 'HK03', qty: 1 }] };
    const trip = tripFromTemplate({ title: 'Rigi', startDate: '2026-10-20', days: 1 }, tpl, items0, 6, sets0);
    expect(trip).toMatchObject({ domain: 'hiking', bikeId: null, bike: null, templateId: 'tpl-hike' });
    expect(trip.packs.map((p) => p.key)).toEqual(['pack']);
    expect(trip.entries.find((e) => e.itemId === 'HK03').slot).toBe('pack');
    expect(trip.entries.find((e) => e.itemId === 'HK01').slot).toBe('body');
    expect(trip.entries.some((e) => e.itemId === 'EL01')).toBe(false); // bike items stay out of a hike
    expect(Array.isArray(trip.ready)).toBe(true);
  });

  it('never adds an archived item (ownership gone), also as an extra', () => {
    const tpl = { ...blankTemplate({ id: 'tpl-g', name: 'g' }), extras: [{ itemId: 'FO01', qty: 1 }] };
    const items = items0.map((i) => (i.id === 'FO01' || i.id === 'EL02' ? { ...i, ownership: 'gone' } : i));
    const trip = tripFromTemplate({ title: 'x', startDate: '2026-10-20', days: 1, bike }, tpl, items, 7, sets0);
    expect(trip.entries.some((e) => e.itemId === 'FO01' || e.itemId === 'EL02')).toBe(false);
  });

  it('the weight counts the items of the blocks and extras', () => {
    const tpl = linkTemplate(byId(tpls0, 'tpl-regen'), items0, sets0);
    const w = templateWeight(tpl, items0, sets0);
    expect(w.n).toBe(tpl.entries.length);
    expect(w.missing).toBe(0);
  });
});

describe('"Save as template" finds the whole blocks', () => {
  it('a trip with Standard and Rain becomes Standard + Regen + extras', async () => {
    const db = await dbWith(items0, FIX.tables.settings);
    await templatesLinked2026(db);
    const tpl = linkTemplate(byId(tpls0, 'tpl-regen'), items0, sets0);
    const trip = { id: 'trip-x', domain: 'bikepacking', title: 'x', bikeId: bike0().id, setup: bike0().setup, entries: [...tpl.entries, { itemId: 'SL01', slot: 'seat', qty: 1 }], ready: [] };
    await db.trips.put(trip);
    const res = await saveTripAsTemplate(db, trip, `${P} new one`);
    const saved = byId(await loadTemplates(db), res.id);
    expect(saved.blocks).toEqual(expect.arrayContaining(['standard', 'u-regen']));
    expect(saved.extras.map((x) => x.itemId)).toEqual(['SL01']);
    expect(saved.domain).toBe('bikepacking');
    await saveTemplates(db, await loadTemplates(db)); // a plain save changes nothing
    expect(byId(await loadTemplates(db), res.id)).toEqual(saved);
  });
});
const bike0 = () => FIX.tables.bikes[0];
