// v0.55.0 «Bausteine neu + Bausteine prüfen» (Noah, Trello 9.10.2026, 4a–10b): the one-time update of
// the building blocks (blocksplit.js), the trip block logic (context.js, blockplan.js) and the pure
// helpers of «Bausteine prüfen» (blockcheck.js). Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect, afterEach } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { splitItem, splitAll, splitSets, splitTemplate, needsSplit, needsSplitUpdate, settle, reviewOpen, prefillKey, COLD_DEFAULT, SPLIT_MARKER, REVIEW_KEY, splitRerunAfterImport } from '../src/lib/blocksplit.js';
import { applyUpdates, blockSplit2026, blocksAfterImport } from '../src/lib/updates.js';
import { restoreBackup } from '../src/lib/backup.js';
import { applyContext, contextSets, contextEntries, activeBlocks, nightChoice, nightFields, nightName, OFFER_ONLY, rideSets } from '../src/lib/context.js';
import { ridesIntoDark } from '../src/lib/blockplan.js';
import { buildBikeTrip } from '../src/lib/dayride.js';
import { toggleSet } from '../src/lib/trips.js';
import { linkTemplate, templateEntries, TEMPLATES_KEY } from '../src/lib/templates.js';
import { checkSteps, missingFor, blockTotal, blockMembers, withBlock } from '../src/lib/blockcheck.js';
import { blockKeys, blockOrder, STANDARD } from '../src/lib/blocks2026.js';
import { allSets } from '../src/lib/sets.js';
import { blockKind } from '../src/lib/gear/comes.js';
import { lang } from '../src/lib/i18n.svelte.js';

afterEach(() => (lang.v = 'en'));

const P = 'test_data_gtp_';
const it_ = (id, f = {}) => ({ id: `${P}${id}`, name: `${P} ${id}`, category: 'elec', ownership: 'owned', role: null, sets: [], defaultBag: 'seat', domains: ['bikepacking'], weightG: 100, qty: 1, ...f });

/** Items as before v0.55.0, with the old keys. */
const OLD = [
  it_('BAG', { name: `${P} Sleeping bag`, category: 'sleep', sets: ['sleep'] }),
  it_('TOWEL', { name: `${P} Towel`, category: 'hyg', sets: ['base'] }),
  it_('TENT', { name: `${P} Tent 1P`, category: 'sleep', sets: ['sleep'] }),
  it_('PEGS', { name: `${P} Zeltheringe`, category: 'sleep', sets: ['base'] }),
  it_('PUFFY', { name: `${P} Down jacket`, category: 'offbike', sets: ['warm'] }),
  it_('GLOVES', { name: `${P} Gloves`, category: 'rain', sets: ['warm'], coldBelow: 5 }),
  it_('LAMP', { name: `${P} Head lamp`, category: 'light', sets: ['light'] }),
  it_('LINER', { name: `${P} Silk liner`, category: 'sleep', sets: ['lodging'] }),
  it_('PANTS', { name: `${P} Training trousers`, category: 'offbike', sets: ['lodging'] }),
  it_('SPRAY', { name: `${P} Insect spray`, category: 'hyg', sets: ['lodging'] }),
  it_('STOVE', { name: `${P} Stove`, category: 'cook', sets: ['cook'] }),
  it_('AID', { name: `${P} First aid kit`, category: 'hyg', sets: ['firstaid'] }),
  it_('TUBE', { name: `${P} Spare tube`, category: 'tools' }),
  it_('BANK', { name: `${P} Power bank`, category: 'elec' }),
  it_('GPS', { name: `${P} GPS unit`, category: 'elec' }),
  it_('GEL', { name: `${P} Gel`, category: 'food' }),
  it_('BOTTLE', { name: `${P} Bottle`, category: 'food', waterL: 0.75 }),
  it_('CREAM', { name: `${P} Chamois cream`, category: 'hyg' }),
  it_('HOME', { name: `${P} Spare multitool`, category: 'tools', role: 'optional' }),
  it_('WISH', { name: `${P} Pump`, category: 'tools', ownership: 'wishlist' }),
  it_('RAIN', { name: `${P} Rain jacket`, category: 'rain', sets: ['u-regen'] }),
];
const byId = (list) => Object.fromEntries(list.map((i) => [i.id.replace(P, ''), i]));

describe('the update: the old keys onto the new blocks (Noah 5a–9a)', () => {
  const up = splitAll({ items: OLD, templates: [], sets: [{ key: 'u-regen', name: `${P} Regen` }, { key: 'sleep', qty: { [`${P}BAG`]: 2 } }] });
  const got = byId(up.items);

  it('Base and Sleep → Bivouac; a tent, pegs → Tent', () => {
    expect(got.BAG.sets).toEqual(['sleep', 'bivy']);
    expect(got.TOWEL.sets).toEqual(['base', 'bivy', 'hygiene']);
    expect(got.TENT.sets).toEqual(['sleep', 'tent']);
    expect(got.PEGS.sets).toEqual(['base', 'tent']);
  });

  it('Warm → a temperature rule: 10 °C when there is none, an own value stays', () => {
    expect(got.PUFFY).toMatchObject({ coldBelow: COLD_DEFAULT, sets: ['warm'] });
    expect(got.GLOVES).toMatchObject({ coldBelow: 5, sets: ['warm'] });
    expect(up.review.cold).toEqual([`${P}PUFFY`]);
  });

  it('Light → Light; Lodging → Hotel/hut by its words, else Hotel/hut for now and «noch zuordnen»', () => {
    expect(got.LAMP.sets).toEqual(['light', 'lights']);
    expect(got.LINER.sets).toEqual(['lodging', 'hotel']);
    expect(got.PANTS.sets).toEqual(['lodging', 'hotel']); // evening clothes (off-bike)
    expect(got.SPRAY.sets).toContain('hotel');
    expect(up.review.unassigned).toEqual([`${P}SPRAY`]);
  });

  it('new blocks start empty but for obvious category matches, each a suggestion', () => {
    expect(got.TUBE.sets).toEqual(['repair']);
    expect(got.BANK.sets).toEqual(['charge']);
    expect(got.GPS.sets).toEqual([]); // electronics, but no charging thing
    expect(got.GEL.sets).toEqual(['food']);
    expect(got.BOTTLE.sets).toEqual([]); // water is no Verpflegung block item
    expect(got.CREAM.sets).toEqual(['hygiene']);
    expect(got.AID.sets).toEqual(['firstaid']); // first aid stays first aid (10b), not hygiene
    expect(got.HOME.sets).toEqual([]); // stays at home
    expect(got.WISH.sets).toEqual([]); // a wish
    expect(up.review.suggested).toMatchObject({ repair: [`${P}TUBE`], charge: [`${P}BANK`], food: [`${P}GEL`], tent: [`${P}TENT`, `${P}PEGS`], bivy: [`${P}TOWEL`] });
    expect(up.review.suggested.hygiene).toEqual([`${P}TOWEL`, `${P}SPRAY`, `${P}CREAM`]);
  });

  it('no item is lost, no field goes, the old keys stay (older versions)', () => {
    expect(up.items.map((i) => i.id)).toEqual(OLD.map((i) => i.id));
    for (const [n, i] of up.items.entries()) {
      for (const k of Object.keys(OLD[n])) if (k !== 'sets' && k !== 'coldBelow') expect([i.id, k, i[k]]).toEqual([i.id, k, OLD[n][k]]);
      for (const k of OLD[n].sets) expect(i.sets).toContain(k);
    }
    expect(got.RAIN.sets).toEqual(['u-regen']); // own blocks untouched
  });

  it('is idempotent: a second run changes nothing; a later start only maps old keys, no new prefills', () => {
    const again = splitAll({ items: up.items, templates: up.templates, sets: up.sets, review: up.review }, { first: false });
    expect(again.changedItems).toEqual([]);
    expect(again.items.every((i, n) => i === up.items[n])).toBe(true);
    expect(needsSplitUpdate({ items: up.items })).toBe(false);
    const first = splitAll({ items: up.items, templates: [], sets: up.sets }, { first: true });
    expect(first.changedItems).toEqual([]); // every migrated item carries split2026
    // an item taken out of Bivouac afterwards stays out
    const out = up.items.map((i) => (i.id === `${P}BAG` ? { ...i, sets: ['sleep'] } : i));
    expect(splitAll({ items: out, templates: [], sets: [] }, { first: false }).items.find((i) => i.id === `${P}BAG`).sets).toEqual(['sleep']);
    // a new item made after the update is not prefilled on a later start
    expect(splitItem(it_('NEW', { category: 'tools' }), { prefill: true }).item.sets).toEqual(['repair']);
    expect(splitAll({ items: [it_('NEW', { category: 'tools' })] }, { first: false }).changedItems).toEqual([]);
  });

  it('amounts in an old block move with their items', () => {
    expect(up.sets.find((s) => s.key === 'bivy')).toEqual({ key: 'bivy', qty: { [`${P}BAG`]: 2 } });
    expect(up.sets.find((s) => s.key === 'sleep')).toEqual({ key: 'sleep', qty: { [`${P}BAG`]: 2 } }); // kept
    expect(splitSets([], new Map())).toEqual([]);
  });

  it('the old keys are no blocks for the app any more', () => {
    expect(blockKeys({ sets: ['sleep', 'warm', 'light', 'lodging', 'base'] })).toEqual([]);
    expect(blockOrder(OLD)).not.toContain('sleep');
    expect(allSets([{ key: 'sleep', qty: {} }]).some((s) => s.key === 'sleep')).toBe(false);
    expect(needsSplit(OLD[0])).toBe(true);
  });
});

describe('templates that held an old block (tpl.blocks)', () => {
  const items = OLD.filter((i) => ['BAG', 'TENT', 'TOWEL', 'LINER', 'PUFFY', 'TUBE'].includes(i.id.replace(P, '')));
  const tpl = linkTemplate({ id: 'tpl', name: `${P} Bivvy`, blocks: ['sleep', 'base', 'warm'], entries: items.filter((i) => i.id !== `${P}LINER`).map((i) => ({ itemId: i.id, slot: 'seat', qty: 1 })) }, items, []);

  it('get the new blocks with exactly the same items', () => {
    const up = splitAll({ items, templates: [tpl], sets: [] });
    const [t] = up.templates;
    expect(t.blocks).toEqual(['bivy', 'tent']);
    const ids = (list) => list.map((e) => e.itemId).sort();
    expect(ids(templateEntries(t, up.items, up.sets))).toEqual(ids(templateEntries(tpl, items, [])));
    expect(t.extras.map((x) => x.itemId).sort()).toEqual([`${P}PUFFY`, `${P}TUBE`].sort()); // the old Warm item is an extra now
    expect(splitTemplate(t, { before: up.items, after: up.items })).toBe(t); // idempotent
  });

  it('a template of Lodging gets Hotel/hut', () => {
    const lodg = { id: 'tpl2', name: `${P} Hut`, blocks: ['lodging'], entries: [{ itemId: `${P}LINER`, slot: 'seat', qty: 1 }] };
    const up = splitAll({ items, templates: [lodg] });
    expect(up.templates[0].blocks).toEqual(['hotel']);
  });
});

describe('the update in the database (updates.js) and old backups', () => {
  let n = 0;
  const fresh = async (items, settings = []) => {
    const db = createDb(`v0550-${++n}`);
    await db.items.bulkPut(structuredClone(items));
    if (settings.length) await db.settings.bulkPut(settings);
    return db;
  };

  it('runs once with a marker and a review list; a second run writes nothing', async () => {
    const db = await fresh(OLD);
    await applyUpdates(db);
    expect((await db.settings.get(SPLIT_MARKER))?.value).toBeTruthy();
    expect((await db.items.get(`${P}BAG`)).sets).toContain('bivy');
    const review = (await db.settings.get(REVIEW_KEY)).value;
    expect(review.cold).toEqual([`${P}PUFFY`]);
    expect(review.unassigned).toEqual([`${P}SPRAY`]);
    const snap = await db.items.toArray();
    expect(await blockSplit2026(db)).toEqual({ items: [], templates: [] });
    expect(await db.items.toArray()).toEqual(snap);
    expect(await db.items.count()).toBe(OLD.length);
  });

  it('an old backup (replace, no marker) is migrated again, with its prefills', async () => {
    const db = await fresh([it_('X')]);
    await applyUpdates(db);
    const file = { app: 'pack-generator', schemaVersion: 6, exportedAt: '2026-09-01T00:00:00.000Z', tables: { items: structuredClone(OLD), settings: [{ key: 'update.blocks2026', value: '2026-09-01' }] } };
    expect(splitRerunAfterImport(file, 'replace')).toBe(true);
    await restoreBackup(db, file, 'replace');
    await blocksAfterImport(db, file, 'replace');
    await applyUpdates(db);
    expect((await db.items.get(`${P}TUBE`)).sets).toEqual(['standard', 'repair']); // the old file also gets toolsAlways2026 again (v0.28.0)
    expect((await db.items.get(`${P}LAMP`)).sets).toEqual(['light', 'lights']);
    expect(await db.items.count()).toBe(OLD.length);
  });

  it('an old item merged in later is mapped on the next start, without new prefills', async () => {
    const db = await fresh([it_('X')]);
    await applyUpdates(db);
    await db.items.bulkPut([it_('OLDBAG', { category: 'sleep', sets: ['sleep'] }), it_('NEWTOOL', { category: 'tools' })]);
    await applyUpdates(db);
    expect((await db.items.get(`${P}OLDBAG`)).sets).toEqual(['sleep', 'bivy']);
    expect((await db.items.get(`${P}NEWTOOL`)).sets).toEqual([]);
  });
});

/* ---------- the trip ---------- */
const bike = { id: 'b', name: `${P} Gravel`, setup: { seat: 'bs', frame: 'bf', top: 'bt' } };
const NEW = splitAll({ items: [...OLD, it_('PILLOW', { name: `${P} Pillow`, category: 'lux', sets: ['comfort'] }), it_('NUMBER', { name: `${P} Race number`, category: 'docs', sets: ['race'] })] }).items;
const make = (fields, days = 2) => buildBikeTrip({ draft: { title: `${P} Trip`, startDate: '2026-12-10', days }, bike, start: 'standard', items: NEW, fields: { hours: 4, cook: false, wx: null, event: false, ...fields } }, 1);
const ids = (t) => t.entries.map((e) => e.itemId.replace(P, '')).sort();

describe('the night: one choice (8a)', () => {
  it('Bivouac, Bivouac + tent or Hotel/hut', () => {
    expect(nightChoice({ overnight: 'outdoor', tent: false })).toBe('bivy');
    expect(nightChoice({ overnight: 'outdoor' })).toBe('tent'); // older trips and templates: "Outdoor (tent, bivvy)"
    expect(nightChoice({ overnight: 'outdoor', tent: true })).toBe('tent');
    expect(nightChoice({ overnight: 'lodging' })).toBe('hotel');
    expect(nightChoice({})).toBeNull();
    expect(nightFields('tent')).toEqual({ overnight: 'outdoor', tent: true });
    expect(nightName({ overnight: 'outdoor', tent: true })).toBe('Bivouac + tent');
  });

  it('Tent always comes together with Bivouac', () => {
    const tent = make({ overnight: 'outdoor', tent: true });
    expect(ids(tent)).toEqual(expect.arrayContaining(['BAG', 'TENT', 'PEGS', 'TOWEL']));
    const bivy = make({ overnight: 'outdoor', tent: false });
    expect(ids(bivy)).toContain('BAG');
    expect(ids(bivy)).not.toContain('TENT');
    expect(ids(bivy)).not.toContain('PEGS');
    const hotel = make({ overnight: 'lodging' });
    expect(ids(hotel)).toEqual(expect.arrayContaining(['LINER', 'PANTS', 'AID']));
    expect(ids(hotel)).not.toContain('BAG');
    expect(contextSets({ overnight: 'lodging', tent: true })).not.toContain('tent'); // only with a night outdoors
  });
});

describe('Light in the dark (7a)', () => {
  const place = { lat: 47.4, lon: 8.5 };
  const cet = () => 60;
  it('the ride goes into the dark: from its start for its hours against sunset and sunrise', () => {
    expect(ridesIntoDark({ startDate: '2026-12-10', days: 1, hours: 4, rideStart: ['14:00'] }, place, cet)).toBe(true);
    expect(ridesIntoDark({ startDate: '2026-06-20', days: 1, hours: 3, rideStart: ['09:00'] }, place, () => 120)).toBe(false);
    expect(ridesIntoDark({ startDate: '2026-06-20', days: 1, hours: 3 }, place, () => 120)).toBe(false); // 08:00 start
    expect(ridesIntoDark({ startDate: '2026-12-10', days: 1, rideStart: ['14:00'] }, place, cet)).toBe(false); // hours only assumed
    expect(ridesIntoDark({ startDate: '2026-12-10', days: 1, hours: 4, rideStart: ['14:00'] }, null, cet)).toBe(false); // no place
    expect(ridesIntoDark({ startDate: '2026-06-20', days: 1, hours: 30, nonstop: true }, null, cet)).toBe(true);
  });

  it('Light comes with the dark, with or without a night, and stays deselectable per trip', () => {
    expect(ids(make({ overnight: 'none', dark: true }, 1))).toContain('LAMP');
    expect(ids(make({ overnight: 'none', dark: false }, 1))).not.toContain('LAMP');
    expect(ids(make({ overnight: 'outdoor', dark: true }))).toContain('LAMP');
    const off = make({ overnight: 'none', dark: true, sets: { lights: false } }, 1);
    expect(ids(off)).not.toContain('LAMP');
    expect(activeBlocks(off)).not.toContain('lights');
    // and back on in Pack
    const on = toggleSet(off, NEW, 'lights', true, { active: activeBlocks(off) });
    expect(on.entries.some((e) => e.itemId === `${P}LAMP`)).toBe(true);
  });
});

describe('Repair, Charging, Race, Comfort (9a)', () => {
  it('a later change of an older trip brings only the ride blocks it switches on, not Repair and Charging with the weather', () => {
    const made = make({ overnight: 'none' }, 1);
    const RIDE_IDS = ['TUBE', 'BANK', 'LAMP'];
    const before = { ...made, entries: made.entries.filter((e) => !RIDE_IDS.includes(e.itemId.replace(P, ''))) }; // made before v0.55.0
    const after = (next) => (applyContext(next, NEW, before).entries ?? before.entries).map((e) => e.itemId.replace(P, ''));
    const wet = after({ ...before, wx: { min: 10, max: 18, rain: 'rain' } });
    expect(wet).not.toContain('TUBE');
    expect(wet).not.toContain('BANK');
    const dark = after({ ...before, dark: true });
    expect(dark).toContain('LAMP'); // Light: switched on by this change
    expect(dark).not.toContain('TUBE');
  });

  it('repair and charge are suggested on every ride, each can be taken off', () => {
    const t = make({ overnight: 'none' }, 1);
    expect(ids(t)).toEqual(expect.arrayContaining(['TUBE', 'BANK']));
    expect(t.entries.find((e) => e.itemId === `${P}TUBE`).src).toBe('context');
    expect(ids(make({ overnight: 'none', sets: { repair: false } }, 1))).not.toContain('TUBE');
    expect(rideSets({ sets: { charge: false } })).toEqual(['repair']);
  });

  it('race only on a trip marked as an event', () => {
    expect(ids(make({ overnight: 'none', event: true }, 1))).toContain('NUMBER');
    expect(ids(make({ overnight: 'none', event: false }, 1))).not.toContain('NUMBER');
  });

  it('Comfort is never packed by itself, whatever the trip', () => {
    expect(OFFER_ONLY).toEqual(['comfort']);
    for (const f of [{ overnight: 'none' }, { overnight: 'outdoor', tent: true, cook: true, dark: true, event: true }, { overnight: 'lodging' }]) {
      expect(contextSets(f)).not.toContain('comfort');
      expect(ids(make(f))).not.toContain('PILLOW');
    }
    expect(contextEntries({ overnight: 'outdoor', entries: [] }, NEW).some((e) => e.itemId === `${P}PILLOW`)).toBe(false);
  });

  it('the kinds of blocks', () => {
    expect(['bivy', 'tent', 'hotel', 'cook', 'firstaid'].map(blockKind)).toEqual(['night', 'night', 'night', 'night', 'night']);
    expect(['repair', 'charge', 'lights', 'race'].map(blockKind)).toEqual(['ride', 'ride', 'ride', 'ride']);
    expect(['food', 'hygiene', 'comfort', 'u-regen'].map(blockKind)).toEqual(['add', 'add', 'add', 'add']);
    expect(blockKind(STANDARD)).toBe('always');
  });
});

describe('«Bausteine prüfen» (4a)', () => {
  const up = splitAll({ items: OLD, templates: [], sets: [] });

  it('steps: still to assign, temperature rules, then Standard and every block', () => {
    const steps = checkSteps(up.items, [], up.review);
    expect(steps.slice(0, 3).map((s) => [s.kind, s.key])).toEqual([['unassigned', 'hotel'], ['cold', null], ['block', STANDARD]]);
    expect(steps.slice(3).map((s) => s.key)).toEqual(allSets([]).map((s) => s.key));
    expect(checkSteps(up.items, [], null)[0].kind).toBe('block');
  });

  it('probably missing: same category or a telling word; not what stays at home or water', () => {
    expect(missingFor('repair', up.items).map((i) => i.id)).toEqual([]); // the tube is in it, the wish and the spare at home are not offered
    const items = up.items.map((i) => (i.id === `${P}TUBE` ? { ...i, sets: [] } : i));
    expect(missingFor('repair', items).map((i) => i.id)).toEqual([`${P}TUBE`]);
    expect(missingFor('food', up.items).map((i) => i.id)).toEqual([]);
    expect(missingFor('charge', up.items).map((i) => i.id)).toEqual([]); // GPS: no charging word
    expect(missingFor(STANDARD, up.items)).toEqual([]);
    // not offered: a bag ("Top tube bag" is no tube), a tent outside Tent, a "light" gilet for Light
    const more = [...up.items, it_('TTB', { name: `${P} Top tube bag`, category: 'bags' }), it_('GILET', { name: `${P} Light gilet`, category: 'rain' }), it_('TENT2', { name: `${P} Tent 2P`, category: 'sleep' }), it_('REAR', { name: `${P} Rear light`, category: 'elec' })];
    expect(missingFor('repair', more).map((i) => i.id)).toEqual([]);
    expect(missingFor('bivy', more).map((i) => i.id)).not.toContain(`${P}TENT2`);
    expect(missingFor('tent', more).map((i) => i.id)).toEqual([`${P}TENT2`]);
    expect(missingFor('lights', more).map((i) => i.id)).toEqual([`${P}REAR`]);
  });

  it('a block total is honest; food counts apart', () => {
    const food = blockMembers('food', up.items);
    expect(blockTotal(null, food)).toMatchObject({ g: 0, n: 1, food: { g: 100, missing: 0 } });
    const bivy = blockMembers('bivy', up.items);
    expect(blockTotal(null, bivy)).toMatchObject({ g: 200, missing: 0, n: 2 });
  });

  it('settle takes ids off the right list; nothing left means done', () => {
    const r = settle(up.review, [`${P}TUBE`], { key: 'repair' });
    expect(r.suggested.repair).toBeUndefined();
    expect(r.cold).toEqual(up.review.cold);
    const c = settle(r, [`${P}PUFFY`], { list: 'cold' });
    expect(c.cold).toEqual([]);
    expect(reviewOpen(c)).toBe(true);
    const all = settle(c, up.items.map((i) => i.id));
    expect(reviewOpen(all)).toBe(false);
    expect(withBlock(['a'], 'b', true)).toEqual(['a', 'b']);
    expect(withBlock(['a', 'b'], 'b', false)).toEqual(['a']);
  });

  it('prefill is only for the obvious categories', () => {
    expect(prefillKey(it_('T', { category: 'tools' }))).toBe('repair');
    expect(prefillKey(it_('C', { category: 'elec', name: `${P} USB-C Kabel` }))).toBe('charge');
    expect(prefillKey(it_('L', { category: 'light' }))).toBeNull();
    expect(prefillKey(it_('F', { category: 'food', waterL: 1 }))).toBeNull();
  });
});

describe('German words', () => {
  it('the night and the blocks', () => {
    lang.v = 'de';
    expect(allSets([]).map((s) => s.name)).toEqual(['Biwak', 'Zelt', 'Hotel/Hütte', 'Nacht: Kochen', 'Erste Hilfe', 'Reparatur', 'Laden', 'Licht', 'Rennen', 'Verpflegung', 'Hygiene', 'Komfort']);
  });
});
