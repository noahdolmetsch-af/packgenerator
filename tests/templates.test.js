import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { applyUpdates } from '../src/lib/updates.js';
import { templateFrom, tripFromTemplate, upsert, loadTemplates, saveTripAsTemplate, templateDefaults } from '../src/lib/templates.js';

const trip = {
  id: 'trip-1', title: 'daily commute', bikeId: 'factor-ls', startDate: '2026-10-04',
  setup: { top: 'bag-top', frame: 'bag-frame' },
  entries: [{ itemId: 'A', slot: 'frame', qty: 2, packed: true }, { itemId: 'B', slot: 'body', qty: 1, packed: true }, { itemId: 'GONE', slot: 'top', qty: 1 }],
  ready: [{ id: 'kit', label: 'Helmet', done: true }, { id: 'a1', label: 'AirPods', itemId: 'EL13' }],
  ride: 'daily', hours: 2, sets: { light: true }, wx: { min: 4, max: 12, rain: 'rain' },
  purpose: { top: 'Quick access' },
};
const items = [
  { id: 'A', ownership: 'owned', defaultBag: 'frame' },
  { id: 'B', ownership: 'owned', defaultBag: 'body' },
  { id: 'C', ownership: 'owned', defaultBag: 'top', always: true },
];

describe('templates', () => {
  it('keeps bags, items, checks, ride and night, but not weather or ticks', () => {
    const t = templateFrom(trip, { id: 'tpl-1', name: ' Daily commute ', now: 'x' });
    expect(t).toMatchObject({ name: 'Daily commute', setup: trip.setup, ride: 'daily', hours: 2, sets: { light: true } });
    expect(t.entries[0]).toEqual({ itemId: 'A', slot: 'frame', qty: 2 });
    expect(t.ready).toEqual([{ id: 'kit', label: 'Helmet' }]);
    expect(t).not.toHaveProperty('wx');
    // v0.26.1 (Noah 17b): the bike and the days now stay with the template.
    expect(t).toMatchObject({ bikeId: 'factor-ls', days: 1, overnight: null, cook: false });
    expect(t.entries.some((e) => 'packed' in e)).toBe(false);
  });

  it('starts a trip on another bike: its bags where it has places, items into matching bags', () => {
    const t = templateFrom(trip, { id: 'tpl-1', name: 'Daily commute' });
    const bike = { id: 'scott', name: 'Scott', slots: ['seat', 'top'], setup: { seat: 'bag-seat', top: 'bag-top-scott' } };
    const n = tripFromTemplate({ title: 'Commute Monday', startDate: '2026-10-05', days: 1, bike }, t, items, 5);
    expect(n.setup).toEqual({ seat: 'bag-seat', top: 'bag-top' }); // no frame place on this bike
    expect(n.entries).toEqual([
      { itemId: 'A', slot: 'seat', qty: 2, packed: false },
      { itemId: 'B', slot: 'body', qty: 1, packed: false },
      { itemId: 'C', slot: 'top', qty: 1, packed: false },
    ]);
    expect(n.ready).toEqual([{ id: 'kit', label: 'Helmet', done: false }]);
    expect(n).toMatchObject({ ride: 'daily', hours: 2, sets: { light: true }, templateId: 'tpl-1', bikeId: 'scott' });
    expect(n.wx).toBeUndefined();
    expect(n.purpose).toEqual({ top: 'Quick access' }); // what a bag is for comes along
  });

  it('upsert replaces by id or adds', () => {
    expect(upsert([{ id: 'a', name: 'x' }], { id: 'a', name: 'y' })).toEqual([{ id: 'a', name: 'y' }]);
    expect(upsert([{ id: 'a' }], { id: 'b' }).length).toBe(2);
  });

  it('makes the first template "Daily commute" from that trip, once', async () => {
    const db = createDb('tpl-test');
    await db.items.bulkPut(items);
    await db.trips.put(trip);
    await applyUpdates(db);
    const list = await loadTemplates(db);
    expect(list.map((t) => t.name)).toEqual(['Daily commute']);
    expect((await db.trips.get('trip-1')).templateId).toBe('tpl-daily-commute');
    await db.settings.put({ key: 'templates', value: [] });
    await applyUpdates(db);
    expect(await loadTemplates(db)).toEqual([]); // deleted by Noah: stays deleted
  });
});

// v0.26.1 (AP18, Noah 16a/17b): update the template a trip came from, or save a new one; days,
// riding hours, overnight stay (+ cook) and bike come along as defaults for the next trip.
describe('template update or new (v0.26.1)', () => {
  const outdoor = { ...trip, id: 'trip-o', title: 'Jura', days: 3, hours: 5, overnight: 'outdoor', cook: true, bikeId: 'factor-ls', templateId: 'tpl-a' };
  const bikes = [{ id: 'factor-ls', name: 'Factor' }, { id: 'scott', name: 'Scott' }];

  it('keeps days, hours, overnight, cooking and bike, and offers them as defaults', () => {
    const tp = templateFrom(outdoor, { id: 'tpl-a', name: 'Jura' });
    expect(tp).toMatchObject({ days: 3, hours: 5, overnight: 'outdoor', cook: true, bikeId: 'factor-ls' });
    expect(templateDefaults(tp, bikes)).toEqual({ days: 3, hours: 5, overnight: 'outdoor', cook: true, bikeId: 'factor-ls' });
    // A bike that is gone is not offered; an older template without these values changes nothing.
    expect(templateDefaults(tp, [bikes[1]])).not.toHaveProperty('bikeId');
    expect(templateDefaults({ id: 'old', entries: [], hours: null }, bikes)).toEqual({});
    // The new trip is open: nothing packed, the overnight stay comes along.
    const n = tripFromTemplate({ title: 'Jura 2', startDate: '2026-11-01', days: 3, bike: { id: 'scott', name: 'Scott', slots: ['seat'], setup: { seat: 'bag-seat' } } }, tp, items, 9);
    expect(n.entries.every((e) => e.packed === false)).toBe(true);
    expect(n).toMatchObject({ overnight: 'outdoor', cook: true, days: 3, templateId: 'tpl-a' });
  });

  it('updates the template in place, or saves a new one; the trips stay as they are', async () => {
    const db = createDb('tpl-update-test');
    await db.items.bulkPut(items);
    await db.trips.bulkPut([outdoor, { ...trip, id: 'older', templateId: 'tpl-a' }]);
    await db.settings.put({ key: 'templates', value: [templateFrom({ ...trip, days: 1, bikeId: 'scott' }, { id: 'tpl-a', name: 'Jura' })] });
    const before = await db.trips.get('older');

    // Update «Jura»: same id, the trip's items, places, amounts, days, hours, overnight and bike.
    expect(await saveTripAsTemplate(db, outdoor, 'Jura', 'tpl-a')).toEqual({ id: 'tpl-a', name: 'Jura' });
    let list = await loadTemplates(db);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: 'tpl-a', days: 3, hours: 5, overnight: 'outdoor', cook: true, bikeId: 'factor-ls' });
    expect(list[0].entries).toEqual(outdoor.entries.map(({ itemId, slot, qty }) => ({ itemId, slot, qty })));

    // Save as new: a second template, the old one unchanged; a taken name is refused.
    expect(await saveTripAsTemplate(db, { ...outdoor, days: 2 }, 'Jura')).toEqual({ error: 'taken', name: 'Jura' });
    const out = await saveTripAsTemplate(db, { ...outdoor, days: 2 }, 'Jura short');
    list = await loadTemplates(db);
    expect(list.map((x) => [x.name, x.days])).toEqual([['Jura', 3], ['Jura short', 2]]);
    expect((await db.trips.get('trip-o')).templateId).toBe(out.id);
    expect(await db.trips.get('older')).toEqual(before); // older trips stay unchanged
  });
});
