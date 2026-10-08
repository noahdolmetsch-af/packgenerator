// v0.25.0 (M3): the trip decides the packing list (context.js). Fictional items only.
import { describe, it, expect } from 'vitest';
import { contextSets, contextEntries, applyContext, contextTrip, carryHint, contextSummary, hasContext } from '../src/lib/context.js';
import { newTrip, standardEntries } from '../src/lib/trips.js';
import { layerSuggest } from '../src/lib/layers.js';
import { reviewRows } from '../src/lib/preparation.js';

const it_ = (id, f = {}) => ({ id, name: `test_data_gtp_ ${id}`, ownership: 'owned', role: null, sets: [], defaultBag: 'seat', domains: ['bikepacking'], ...f });
const items = [
  it_('JERSEY', { role: 'worn', defaultBag: 'body' }),
  it_('TOOL', { role: 'standard', defaultBag: 'frame' }),
  it_('GEL', { role: 'standard', defaultBag: 'top', perHours: 1, maxQty: 8 }),
  it_('BAR', { role: 'standard', defaultBag: 'top', perHours: 3 }),
  it_('BOTTLE', { role: 'standard', defaultBag: 'frame', perHours: 3, maxQty: 2 }),
  it_('BRUSH', { sets: ['base', 'lodging'], defaultBag: 'top' }),
  it_('TOWEL', { sets: ['base'] }),
  it_('SHOWER', { sets: ['lodging'], defaultBag: 'top' }),
  it_('SLEEPBAG', { sets: ['sleep'] }),
  it_('PUFFY', { sets: ['warm'] }),
  it_('STOVE', { sets: ['cook'] }),
  it_('LIGHT', { sets: ['light'] }),
  it_('ARMS', { coldBelow: 15 }),
  it_('RAINJ', { rain: 'yes' }),
  it_('OVERSHOE', { rain: 'optional' }),
  it_('WISH', { sets: ['sleep'], ownership: 'wishlist' }),
];
const bike = { id: 'b', name: 'test_data_gtp_ MTB', setup: { seat: 'bs', frame: 'bf', top: 'bt' } };
const make = (ctx, trips = []) => contextTrip({ ...newTrip({ title: 'test_data_gtp_ trip', startDate: '2026-10-10', days: ctx.days ?? 1, bike, overnight: ctx.overnight }, trips, items, 1), ...ctx }, items, { fromCopy: trips.length > 0 });
const ids = (t) => t.entries.map((e) => e.itemId).sort();
const qty = (t, id) => t.entries.find((e) => e.itemId === id)?.qty;

describe('context sets', () => {
  it('none brings nothing, lodging its set, outdoor base, sleep, warm and cook only when cooking', () => {
    expect(contextSets({ overnight: 'none' })).toEqual([]);
    expect(contextSets({})).toEqual([]);
    expect(contextSets({ overnight: 'lodging' })).toEqual(['lodging', 'firstaid']); // v0.28.0: first aid with every night
    expect(contextSets({ overnight: 'outdoor' })).toEqual(['base', 'sleep', 'warm', 'firstaid']);
    expect(contextSets({ overnight: 'outdoor', cook: true })).toEqual(['base', 'sleep', 'warm', 'cook', 'firstaid']);
    expect(hasContext({ overnight: 'none' })).toBe(true);
    expect(hasContext({})).toBe(false);
  });
});

describe('a new trip with its context', () => {
  it('day ride 2 h, no overnight: no night items, gel 2, nothing open to decide', () => {
    const t = make({ hours: 2, overnight: 'none' });
    expect(ids(t)).toEqual(['BAR', 'BOTTLE', 'GEL', 'JERSEY', 'TOOL']);
    expect(qty(t, 'GEL')).toBe(Math.ceil(2 / 1));
    expect(qty(t, 'BAR')).toBe(1);
    expect(reviewRows(t, items).filter((r) => r.selected)).toEqual([]);
  });

  it('chilly and rain go straight into the list (6b), the optional overshoes stay a choice', () => {
    const t = make({ hours: 2, overnight: 'none', wx: { min: 4, max: 12, rain: 'rain' } });
    expect(ids(t)).toEqual(expect.arrayContaining(['ARMS', 'RAINJ']));
    expect(ids(t)).not.toContain('OVERSHOE');
    expect(t.entries.find((e) => e.itemId === 'ARMS').src).toBe('context');
    expect(reviewRows(t, items).filter((r) => r.selected)).toEqual([]);
  });

  it('outdoor with cooking brings base, sleep, warm and cook, not lodging-only items or wishlist', () => {
    const t = make({ days: 2, hours: 5, overnight: 'outdoor', cook: true });
    expect(ids(t)).toEqual(expect.arrayContaining(['BRUSH', 'TOWEL', 'SLEEPBAG', 'PUFFY', 'STOVE']));
    expect(ids(t)).not.toContain('SHOWER');
    expect(ids(t)).not.toContain('WISH');
    expect(ids(t)).not.toContain('LIGHT');
    expect(t.sets).toMatchObject({ sleep: true, warm: true, cook: true });
    expect(make({ days: 2, overnight: 'outdoor' }).entries.some((e) => e.itemId === 'STOVE')).toBe(false);
  });

  it('lodging brings only the lodging set', () => {
    const t = make({ days: 2, overnight: 'lodging' });
    expect(ids(t)).toEqual(expect.arrayContaining(['BRUSH', 'SHOWER']));
    for (const id of ['TOWEL', 'SLEEPBAG', 'PUFFY', 'STOVE']) expect(ids(t)).not.toContain(id);
    expect(t.sets).toMatchObject({ sleep: false, warm: false, cook: false });
  });

  it('8a: 2 days × 6 h at 1 per 3 h → 4 bars; capped bottles and multi-day food get "buy on the way?"', () => {
    const t = make({ days: 2, hours: 6, overnight: 'lodging' });
    expect(qty(t, 'BAR')).toBe(4);
    expect(qty(t, 'GEL')).toBe(8); // 12 → maxQty 8
    expect(qty(t, 'BOTTLE')).toBe(2); // 4 → maxQty 2
    expect(carryHint(t, items).map((i) => i.id).sort()).toEqual(['BAR', 'BOTTLE', 'GEL']);
    // A day ride: only what hits maxQty.
    const d = make({ hours: 9, overnight: 'none' });
    expect(carryHint(d, items).map((i) => i.id).sort()).toEqual(['BOTTLE', 'GEL']);
    expect(carryHint(make({ hours: 2, overnight: 'none' }), items)).toEqual([]);
  });

  it('a copy of the last outdoor trip leaves the night items at home on a day ride', () => {
    const last = make({ days: 2, overnight: 'outdoor', cook: true });
    const t = make({ hours: 2, overnight: 'none' }, [{ ...last, bikeId: 'b', startDate: '2026-10-01' }]);
    for (const id of ['BRUSH', 'TOWEL', 'SLEEPBAG', 'PUFFY', 'STOVE']) expect(ids(t)).not.toContain(id);
  });

  it('keeps the v0.24.0 rule without an overnight value', () => {
    expect(standardEntries(items, bike.setup, { overnight: true }).some((e) => e.itemId === 'TOWEL')).toBe(true);
    expect(newTrip({ title: 'x', days: 2, bike }, [], items, 1).entries.some((e) => e.itemId === 'TOWEL')).toBe(true);
    expect(newTrip({ title: 'x', days: 2, bike, overnight: 'lodging' }, [], items, 1).entries.some((e) => e.itemId === 'TOWEL')).toBe(false);
  });
});

describe('a later change (9b)', () => {
  it('lodging → outdoor: night items come, lodging-only items go, own entries and manual amounts stay', () => {
    const t = make({ days: 2, hours: 3, overnight: 'lodging' });
    // Noah adds the light by hand, ticks the toothbrush as packed and sets 5 gels himself.
    t.entries.push({ itemId: 'LIGHT', slot: 'top', qty: 1, packed: false });
    t.entries = t.entries.map((e) => (e.itemId === 'BRUSH' ? { ...e, packed: true } : e.itemId === 'GEL' ? { ...e, qty: 5, qtyManual: true } : e));
    const next = { ...t, overnight: 'outdoor' };
    const ch = applyContext(next, items, t);
    const after = { ...next, ...ch };
    expect(ids(after)).toEqual(expect.arrayContaining(['TOWEL', 'SLEEPBAG', 'PUFFY', 'LIGHT', 'BRUSH']));
    expect(ids(after)).not.toContain('SHOWER');
    expect(after.entries.find((e) => e.itemId === 'BRUSH').packed).toBe(true);
    expect(qty(after, 'GEL')).toBe(5);
    expect(ch.sets).toMatchObject({ sleep: true, warm: true });
  });

  it('shorter or longer amounts follow, an entry without src context is never removed', () => {
    const t = make({ hours: 6, overnight: 'none', wx: { min: 4, max: 12, rain: 'none' } });
    expect(qty(t, 'BAR')).toBe(2);
    // Noah adds a towel by hand: it stays when the context changes.
    t.entries.push({ itemId: 'TOWEL', slot: 'seat', qty: 1, packed: false });
    const warm = { ...t, hours: 2, wx: { min: 16, max: 24, rain: 'none' } };
    const after = { ...warm, ...applyContext(warm, items, t) };
    expect(qty(after, 'BAR')).toBe(1);
    expect(qty(after, 'GEL')).toBe(2);
    expect(ids(after)).not.toContain('ARMS'); // came with the cold, goes with it
    expect(ids(after)).toContain('TOWEL');
    expect(ids(after)).toContain('TOOL');
  });

  it('an old trip without overnight is never changed', () => {
    const old = { id: 'o', days: 2, hours: 6, entries: [{ itemId: 'BAR', slot: 'top', qty: 1 }], setup: bike.setup };
    expect(applyContext({ ...old, wx: { min: 0, max: 4, rain: 'rain' } }, items, old)).toEqual({});
    expect(contextTrip(old, items)).toBe(old);
  });

  it('nothing changes when the context stays the same', () => {
    const t = make({ hours: 2, overnight: 'none' });
    expect(applyContext({ ...t, title: 'other' }, items, t)).toEqual({});
  });
});

describe('layers per day', () => {
  it('hours are per day: amounts for the whole trip', () => {
    const one = layerSuggest({ hours: 6, days: 1, entries: [] }, items).find((r) => r.id === 'BAR');
    const two = layerSuggest({ hours: 6, days: 2, entries: [] }, items).find((r) => r.id === 'BAR');
    expect([one.qty, two.qty]).toEqual([2, 4]);
  });
});

describe('"Your packing list" summary', () => {
  it('counts the start and names amounts, weather, sets and what is left out', () => {
    const trip = { days: 1, hours: 2, overnight: 'none', wx: { min: 4, max: 12, rain: 'none' }, setup: bike.setup };
    const start = standardEntries(items, bike.setup, { overnight: false });
    const s = contextSummary(start, trip, items);
    expect(s.start).toBe(start.length);
    expect(s.amounts.map((a) => [a.item.id, a.qty])).toEqual([['GEL', 2]]);
    expect(s.weather.map((i) => i.id)).toEqual(['ARMS']);
    expect(s.sets).toEqual([]);
    expect(s.left).toEqual(['overnight', 'event']);
    const o = contextSummary(start, { ...trip, days: 2, overnight: 'outdoor', cook: true, event: true }, items);
    expect(o.sets).toEqual([{ key: 'base', n: 2 }, { key: 'sleep', n: 1 }, { key: 'warm', n: 1 }, { key: 'cook', n: 1 }, { key: 'firstaid', n: 0 }]);
    expect(o.left).toEqual([]);
  });
});
