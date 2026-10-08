// v0.28.0 (AP25): templates learn from experience, traceably; first aid only with a night; tools always.
// Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect, afterEach } from 'vitest';
import { buildBikeTrip } from '../src/lib/dayride.js';
import { applyContext, contextTrip, contextSets } from '../src/lib/context.js';
import { rowReasons } from '../src/lib/reasons.js';
import { templateHints, applyTemplateHint, rejectTemplateHint, hintResting, REJECT_FOR } from '../src/lib/debrief.js';
import { ballast, packBadges } from '../src/lib/packhints.js';
import { weatherCounts, alwaysKeep, tripContext } from '../src/lib/learn.js';
import { knowCards, templateHintCount } from '../src/lib/know.js';
import { createDb } from '../src/lib/db.js';
import { firstAid2026, toolsAlways2026 } from '../src/lib/updates.js';
import { lang } from '../src/lib/i18n.svelte.js';

afterEach(() => (lang.v = 'en'));

const P = 'test_data_gtp_';
const it_ = (id, f = {}) => ({ id, name: `${P} ${id}`, ownership: 'owned', role: null, sets: [], defaultBag: 'seat', domains: ['bikepacking'], ...f });

/* ---------- 1. first aid only with a night ---------- */
describe('first aid comes with a night only', () => {
  const items = [
    it_('JERSEY', { role: 'worn', defaultBag: 'body' }),
    it_('AIDKIT', { sets: ['firstaid'], role: 'standard' }),
    it_('BLISTER', { sets: ['firstaid'], always: true }),
    it_('AIDPLUS', { sets: ['firstaid'] }),
    it_('BRUSH', { sets: ['lodging'] }),
    it_('SLEEPBAG', { sets: ['sleep'] }),
  ];
  const bike = { id: 'b1', name: `${P} Gravel`, setup: { seat: 'bs', frame: 'bf' } };
  const draft = { title: `${P} trip`, startDate: '2026-10-11', days: 1 };
  const base = { hours: 2, cook: false, wx: { min: 6, max: 12, rain: 'none' }, event: false };
  const ids = (t) => t.entries.map((e) => e.itemId).sort();

  it('contextSets brings first aid for lodging and outdoor, never without a night', () => {
    expect(contextSets({ overnight: 'none' })).not.toContain('firstaid');
    expect(contextSets({ overnight: 'lodging' })).toContain('firstaid');
    expect(contextSets({ overnight: 'outdoor' })).toContain('firstaid');
  });

  it('a day ride has no first aid item, even standard or "On every trip"', () => {
    const day = buildBikeTrip({ draft, bike, start: 'standard', items, fields: { ...base, overnight: 'none' } }, 1);
    expect(ids(day)).toEqual(['JERSEY']);
  });

  it('a day ride copied from a lodging trip leaves the first aid at home', () => {
    const lodging = buildBikeTrip({ draft: { ...draft, days: 2 }, bike, start: 'standard', items, fields: { ...base, overnight: 'lodging' } }, 1);
    expect(ids(lodging)).toEqual(['AIDKIT', 'AIDPLUS', 'BLISTER', 'BRUSH', 'JERSEY']);
    const day = buildBikeTrip({ draft, bike, start: 'last', trips: [lodging], items, fields: { ...base, overnight: 'none' } }, 2);
    expect(ids(day)).toEqual(['JERSEY']);
  });

  it('a 1-night outdoor trip has it, with the reason line', () => {
    const out = buildBikeTrip({ draft: { ...draft, days: 2 }, bike, start: 'standard', items, fields: { ...base, overnight: 'outdoor' } }, 1);
    expect(ids(out)).toEqual(expect.arrayContaining(['AIDKIT', 'AIDPLUS', 'BLISTER', 'SLEEPBAG']));
    const r = rowReasons(out, items);
    expect(r.AIDPLUS.line).toBe('First aid from 1 night');
    lang.v = 'de';
    expect(rowReasons(out, items).AIDPLUS.line).toBe('Erste Hilfe ab 1 Nacht');
  });

  it('a day trip from a template that contains first aid starts without it', () => {
    const tpl = { id: 'tpA', name: `${P} Tpl`, entries: [{ itemId: 'AIDPLUS', slot: 'seat', qty: 1 }, { itemId: 'JERSEY', slot: 'body', qty: 1 }], overnight: 'lodging' };
    const day = buildBikeTrip({ draft, bike, start: 'tpA', templates: [tpl], items, fields: { ...base, overnight: 'none' } }, 3);
    expect(ids(day)).toEqual(['JERSEY']);
    const night = buildBikeTrip({ draft: { ...draft, days: 2 }, bike, start: 'tpA', templates: [tpl], items, fields: { ...base, overnight: 'lodging' } }, 4);
    expect(ids(night)).toContain('AIDPLUS');
  });

  it('night → none takes away what the night brought, keeps what was added by hand', () => {
    const t = buildBikeTrip({ draft: { ...draft, days: 2 }, bike, start: 'standard', items, fields: { ...base, overnight: 'lodging' } }, 1);
    // Noah put the blister kit on by hand (no src): it stays.
    const mine = { ...t, entries: t.entries.map((e) => (e.itemId === 'BLISTER' ? { itemId: e.itemId, slot: e.slot, qty: 1, packed: false } : e)) };
    const changed = applyContext({ ...mine, overnight: 'none' }, items, mine);
    const left = changed.entries.map((e) => e.itemId);
    expect(left).not.toContain('AIDPLUS');
    expect(left).toContain('BLISTER');
  });

  it('an old trip without a known overnight stay is untouched', () => {
    const old = { id: 'old', entries: [{ itemId: 'AIDPLUS', slot: 'seat', qty: 1 }] };
    expect(contextTrip(old, items)).toBe(old);
    expect(applyContext(old, items)).toEqual({});
  });
});

/* ---------- 2. tools always, 3. weather, 5. reject, 6. newest wins, 7. source ---------- */
const items = [
  it_('JACKET', { category: 'offbike' }),
  it_('TUBE', { category: 'tools' }),
  it_('LIGHTX', { category: 'light', always: true }),
  it_('RAINP', { category: 'rain', rain: 'yes' }),
  it_('ARMW', { category: 'onbike', coldBelow: 10 }),
  it_('GLOVES', { category: 'onbike', defaultBag: 'frame' }),
];
const all = ['JACKET', 'TUBE', 'LIGHTX', 'RAINP', 'ARMW'];
const tpl = { id: 'tpl1', name: `${P} Weekend`, entries: all.map((itemId) => ({ itemId, slot: 'seat', qty: 1 })) };
const trip = (n, date, wx, extra = {}) => ({ id: `t${n}`, title: `${P} Trip ${n}`, startDate: date, days: 2, overnight: 'lodging', wx, entries: all.map((itemId) => ({ itemId })), ...extra });
const dry = { min: 6, max: 12, rain: 'none' };
const trips = [trip(1, '2026-06-01', dry), trip(2, '2026-07-01', dry), trip(3, '2026-08-01', { min: 8, max: 14, rain: 'rain' })];
const unusedAll = Object.fromEntries(all.map((id) => [id, 'unused']));
const deb = (n, its = unusedAll, missing = []) => ({ tripId: `t${n}`, status: 'done', items: its, missing });
const three = [deb(1), deb(2), deb(3)];

describe('tools and "On every trip" are never ballast nor taken out', () => {
  it('alwaysKeep', () => {
    expect(alwaysKeep(items[1])).toBe(true);
    expect(alwaysKeep(items[2])).toBe(true);
    expect(alwaysKeep(items[0])).toBe(false);
  });
  it('no out hint for the tube or the always light', () => {
    const h = templateHints(tpl, trips, three, items).map((x) => x.id);
    expect(h).toContain('out:JACKET');
    expect(h).not.toContain('out:TUBE');
    expect(h).not.toContain('out:LIGHTX');
  });
  it('no ballast row and no "not used" badge', () => {
    const next = { id: 'nx', startDate: '2026-10-20', entries: all.map((itemId) => ({ itemId, slot: 'seat', qty: 1 })) };
    const rows = ballast(next, items, trips, three).rows.map((r) => r.itemId);
    expect(rows).toContain('JACKET');
    expect(rows).not.toContain('TUBE');
    expect(rows).not.toContain('LIGHTX');
    const b = packBadges(next, trips, three, {}, items);
    expect(b.JACKET?.map((x) => x.key)).toEqual(['unused']);
    expect(b.TUBE).toBeUndefined();
    expect(b.LIGHTX).toBeUndefined();
  });
});

describe('weather items only count on trips with their weather', () => {
  it('weatherCounts: rain, cold, unknown', () => {
    const rain = items[3];
    const cold = items[4];
    expect(weatherCounts(rain, { wx: { min: 5, max: 9, rain: 'none' } })).toBe(false);
    expect(weatherCounts(rain, { wx: { min: 5, max: 9, rain: 'showers' } })).toBe(true);
    expect(weatherCounts(rain, {})).toBe(false);
    expect(weatherCounts(cold, { wx: { min: 10, max: 15, rain: 'none' } })).toBe(false);
    expect(weatherCounts(cold, { wx: { min: 9, max: 15, rain: 'none' } })).toBe(true);
    expect(weatherCounts(cold, { wx: { rain: 'rain' } })).toBe(false);
    expect(weatherCounts(items[0], {})).toBe(true);
  });
  it('rain trousers unused on 2 dry trips and 1 wet one: no hint (only 1 counts)', () => {
    const h = templateHints(tpl, trips, three, items);
    expect(h.map((x) => x.id)).not.toContain('out:RAINP');
    // arm warmers below 10 °C: all three trips were 6–14 °C, so all count
    expect(h.find((x) => x.id === 'out:ARMW')).toMatchObject({ count: 3, of: 3 });
  });
  it('a dry trip neither counts nor ends the streak', () => {
    const wet = (n, date) => trip(n, date, { min: 12, max: 20, rain: 'rain' });
    const ts = [wet(1, '2026-05-01'), wet(2, '2026-06-01'), trip(3, '2026-07-01', { min: 12, max: 20, rain: 'none' }), wet(4, '2026-08-01')];
    const ds = [deb(1), deb(2), deb(3, { ...unusedAll, RAINP: 'used' }), deb(4)];
    const h = templateHints(tpl, ts, ds, items).find((x) => x.id === 'out:RAINP');
    expect(h).toMatchObject({ count: 3, of: 3 });
    expect(h.trips.map((x) => x.id)).toEqual(['t4', 't2', 't1']);
    // ballast and badges skip it the same way
    const next = { id: 'nx', startDate: '2026-10-20', entries: [{ itemId: 'RAINP', slot: 'seat', qty: 1 }] };
    expect(ballast(next, items, ts, ds).rows.map((r) => [r.itemId, r.n])).toEqual([['RAINP', 3]]);
    expect(packBadges(next, ts, ds, {}, items).RAINP.map((x) => x.label)).toEqual(['3× not used']);
  });
  it('cold item: a warm trip is skipped in ballast', () => {
    const ts = [trip(1, '2026-05-01', { min: 5, max: 9, rain: 'none' }), trip(2, '2026-06-01', { min: 18, max: 25, rain: 'none' }), trip(3, '2026-07-01', { min: 4, max: 9, rain: 'none' })];
    const ds = [deb(1), deb(2, { ARMW: 'used' }), deb(3)];
    const next = { id: 'nx', startDate: '2026-10-20', entries: [{ itemId: 'ARMW', slot: 'seat', qty: 1 }] };
    expect(ballast(next, items, ts, ds).rows.map((r) => r.n)).toEqual([2]);
  });
});

describe('traceable source (count of, trips with context)', () => {
  it('each hint names its trips with days, night and weather', () => {
    const h = templateHints(tpl, trips, three, items).find((x) => x.id === 'out:JACKET');
    expect(h).toMatchObject({ kind: 'out', itemId: 'JACKET', count: 3, of: 3 });
    expect(h.trips.map((x) => x.id)).toEqual(['t3', 't2', 't1']);
    expect(h.trips[0]).toMatchObject({ title: `${P} Trip 3`, startDate: '2026-08-01', ctx: '2 days · Lodging · 8–14 °C, rain' });
    lang.v = 'de';
    expect(tripContext(trips[0])).toBe('2 Tage · Unterkunft · 6–12 °C');
    expect(tripContext({ days: 1, overnight: 'none' })).toBe('1 Tag · Ohne Nacht · Wetter unbekannt');
  });
  it('in: missing on 2 of 3 trips', () => {
    const ds = [deb(1, {}, [{ id: 'm1', name: 'Gloves', itemId: 'GLOVES' }]), deb(2, {}), deb(3, {}, [{ id: 'm2', name: 'Gloves', itemId: 'GLOVES' }])];
    const h = templateHints(tpl, trips, ds, items).find((x) => x.id === 'in:GLOVES');
    expect(h).toMatchObject({ count: 2, of: 3 });
    expect(h.trips.map((x) => x.id)).toEqual(['t3', 't1']);
  });
});

describe('the newest trip wins (5b)', () => {
  it('a missing on the newest trip ends the out streak', () => {
    const ts = [...trips, trip(4, '2026-09-01', dry, { entries: [] })];
    const ds = [...three, deb(4, {}, [{ id: 'm', name: 'Jacket', itemId: 'JACKET' }])];
    expect(templateHints(tpl, ts, ds, items).map((x) => x.id)).not.toContain('out:JACKET');
  });
  it('a used on the newest trip ends it too', () => {
    const ts = [...trips, trip(4, '2026-09-01', dry)];
    expect(templateHints(tpl, ts, [...three, deb(4, { ...unusedAll, JACKET: 'used' })], items).map((x) => x.id)).not.toContain('out:JACKET');
  });
  it('in is not suggested when a newer trip had it on and it was not used', () => {
    const ts = [...trips, trip(4, '2026-09-01', dry, { entries: [{ itemId: 'GLOVES' }] })];
    const ds = [deb(1, {}, [{ id: 'm1', name: 'Gloves', itemId: 'GLOVES' }]), deb(2, {}, [{ id: 'm2', name: 'Gloves', itemId: 'GLOVES' }]), deb(3, {}), deb(4, { GLOVES: 'unused' })];
    expect(templateHints(tpl, ts, ds, items).map((x) => x.id)).not.toContain('in:GLOVES');
    // used on the newer trip: still suggested
    expect(templateHints(tpl, ts, [...ds.slice(0, 3), deb(4, {})], items).map((x) => x.id)).toContain('in:GLOVES');
  });
});

describe('Not now (4a) and the history', () => {
  it('a rejected hint rests until 3 more debriefs are done', () => {
    const h = templateHints(tpl, trips, three, items).find((x) => x.id === 'out:JACKET');
    const t2 = rejectTemplateHint(tpl, h, 3, '2026-10-08T10:00:00.000Z');
    expect(t2.entries).toEqual(tpl.entries);
    expect(t2.hintLog).toEqual([{ hintId: 'out:JACKET', kind: 'out', itemId: 'JACKET', name: `${P} JACKET`, decision: 'rejected', at: '2026-10-08T10:00:00.000Z', doneCount: 3, trips: ['t3', 't2', 't1'], tripTitles: [`${P} Trip 3`, `${P} Trip 2`, `${P} Trip 1`] }]);
    expect(templateHints(t2, trips, three, items).map((x) => x.id)).not.toContain('out:JACKET');
    expect(templateHints(t2, trips, three, items, { all: true }).map((x) => x.id)).toContain('out:JACKET');
    const more = (n) => Array.from({ length: n }, (_, i) => ({ tripId: `x${i}`, status: 'done', items: {}, missing: [] }));
    expect(hintResting(t2, 'out:JACKET', 3 + REJECT_FOR - 1)).toBe(true);
    expect(templateHints(t2, trips, [...three, ...more(2)], items).map((x) => x.id)).not.toContain('out:JACKET');
    expect(templateHints(t2, trips, [...three, ...more(3)], items).map((x) => x.id)).toContain('out:JACKET');
  });
  it('applying still works and is logged; old trips never change', () => {
    const before = structuredClone(trips);
    const h = templateHints(tpl, trips, three, items).find((x) => x.id === 'out:JACKET');
    const t2 = applyTemplateHint(tpl, h, items, '2026-10-08T11:00:00.000Z', 3);
    expect(t2.entries.map((e) => e.itemId)).not.toContain('JACKET');
    expect(t2.hintLog.at(-1)).toMatchObject({ hintId: 'out:JACKET', decision: 'applied', doneCount: 3, trips: ['t3', 't2', 't1'] });
    expect(trips).toEqual(before);
    // without a count it works as before, no log
    expect(applyTemplateHint(tpl, h, items).hintLog).toBeUndefined();
  });
});

/* ---------- 8. Home card ---------- */
describe('Home card: suggestions for your templates', () => {
  it('counts the visible hints, only when there are some', () => {
    const n = templateHintCount([tpl], trips, three, items);
    expect(n).toBe(templateHints(tpl, trips, three, items).length);
    expect(n).toBeGreaterThan(0);
    const card = knowCards({ today: '2026-10-08', templates: [tpl], trips, debriefs: three, items, homePlace: { lat: 1, lon: 1 } }).find((c) => c.key === 'templates');
    expect(card).toMatchObject({ prio: 3, data: { n } });
    expect(knowCards({ today: '2026-10-08', templates: [tpl], trips, debriefs: three.slice(0, 2), items }).some((c) => c.key === 'templates')).toBe(false);
    // all turned down: no card
    let quiet = tpl;
    for (const h of templateHints(tpl, trips, three, items)) quiet = rejectTemplateHint(quiet, h, 3);
    expect(knowCards({ today: '2026-10-08', templates: [quiet], trips, debriefs: three, items }).some((c) => c.key === 'templates')).toBe(false);
  });
});

/* ---------- the two one-time updates ---------- */
describe('one-time updates', () => {
  it('firstAid2026 adds the set by name, once, other sets stay', async () => {
    const db = createDb('ap25-firstaid');
    await db.items.bulkPut([
      { id: 'HYX1', name: `${P} Erste-Hilfe-Set`, ownership: 'owned', sets: ['base'] },
      { id: 'HYX2', name: `${P} First aid kit`, ownership: 'owned' },
      { id: 'HYX3', name: `${P} ErsteHilfe mini`, ownership: 'owned', sets: ['firstaid'] },
      { id: 'HYX4', name: `${P} Toothbrush`, ownership: 'owned', sets: [] },
    ]);
    expect((await firstAid2026(db)).sort()).toEqual(['HYX1', 'HYX2']);
    expect((await db.items.get('HYX1')).sets).toEqual(['base', 'firstaid']);
    expect((await db.items.get('HYX2')).sets).toEqual(['firstaid']);
    expect((await db.items.get('HYX4')).sets).toEqual([]);
    await db.items.update('HYX1', { sets: ['base'] }); // removed in the app later: stays removed
    expect(await firstAid2026(db)).toEqual([]);
    expect((await db.items.get('HYX1')).sets).toEqual(['base']);
  });

  it('toolsAlways2026 marks spare tube and tools by name, never overrides a choice', async () => {
    const db = createDb('ap25-tools');
    await db.items.bulkPut([
      { id: 'WZX1', name: `${P} Ersatzschlauch 29`, category: 'tools', ownership: 'owned' },
      { id: 'WZX2', name: `${P} Multi-tool`, category: 'tools', ownership: 'unclear', always: null },
      { id: 'WZX3', name: `${P} Tyre lever`, category: 'bike', ownership: 'owned' },
      { id: 'WZX4', name: `${P} Spare tube`, category: 'tools', ownership: 'owned', always: false },
      { id: 'WZX5', name: `${P} Spare tube`, category: 'tools', ownership: 'wishlist' },
      { id: 'WZX6', name: `${P} Inner tube`, category: 'lux', ownership: 'owned' },
      { id: 'WZX7', name: `${P} Chain oil`, category: 'tools', ownership: 'owned' },
    ]);
    expect((await toolsAlways2026(db)).sort()).toEqual(['WZX1', 'WZX2', 'WZX3']);
    expect((await db.items.get('WZX1')).always).toBe(true);
    expect((await db.items.get('WZX4')).always).toBe(false);
    expect((await db.items.get('WZX7')).always).toBeUndefined();
    expect(await toolsAlways2026(db)).toEqual([]);
  });

  it('do nothing (and stay pending) without items', async () => {
    const db = createDb('ap25-empty');
    expect(await firstAid2026(db)).toEqual([]);
    expect(await toolsAlways2026(db)).toEqual([]);
    expect(await db.settings.get('update.firstAid2026')).toBeUndefined();
  });
});
