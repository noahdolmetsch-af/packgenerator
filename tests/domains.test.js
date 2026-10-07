import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { DOMAINS, hasBike, domainOf, itemDomains, inDomain, countByDomain, packSlot, domainEntries, newPackTrip, favoritesByDomain, readyKey, READY_BY_DOMAIN } from '../src/lib/domains.js';
import { tripStats, standardEntries, newTrip, packSteps, ensureTrips } from '../src/lib/trips.js';
import { matches } from '../src/lib/gear.js';
import { searchAll } from '../src/lib/search.js';

const it_ = (id, extra) => ({ id, name: id, category: 'elec', weightG: 100, qty: 1, ownership: 'owned', role: null, sets: [], defaultBag: 'top', ...extra });
const items = [
  it_('KL01', { role: 'worn', weightG: 200 }), // no domains: bikepacking
  it_('EL13', { role: 'standard', domains: ['bikepacking', 'weekend'] }),
  it_('WE01', { role: 'standard', domains: ['weekend'], weightG: 300, favorite: true, favNote: 'Never fails' }),
  it_('WE02', { role: 'worn', domains: ['weekend'], weightG: 400 }),
  it_('WE03', { role: 'optional', domains: ['weekend'] }),
  it_('FD01', { category: 'food', role: 'standard', domains: ['weekend'], weightG: 250 }),
  it_('GONE', { ownership: 'gone', favorite: true, domains: ['weekend'] }),
];

describe('areas (package 5)', () => {
  it('has bikepacking plus three areas without a bike', () => {
    expect(DOMAINS.map((d) => d.key)).toEqual(['bikepacking', 'ski', 'weekend', 'travel']);
    expect(DOMAINS.filter((d) => d.bike).map((d) => d.key)).toEqual(['bikepacking']);
  });

  it('items without areas count as bikepacking; an item can be in several', () => {
    expect(itemDomains(items[0])).toEqual(['bikepacking']);
    expect(inDomain(items[1], 'weekend')).toBe(true);
    expect(inDomain(items[1], 'bikepacking')).toBe(true);
    expect(inDomain(items[2], 'bikepacking')).toBe(false);
    expect(countByDomain(items)).toEqual({ bikepacking: 2, weekend: 5 });
    expect(matches(items[2], { domain: 'weekend' })).toBe(true);
    expect(matches(items[0], { domain: 'weekend' })).toBe(false);
    expect(matches(items[0], { domain: '' })).toBe(true);
  });

  it('the bikepacking standard set leaves out items only for another area', () => {
    expect(standardEntries(items, { top: 'b' }).map((e) => e.itemId)).toEqual(['KL01', 'EL13']);
    const bike = { id: 'b', name: 'B', setup: { top: 'bag' } };
    expect(newTrip({ title: 'x', startDate: '', days: 1, bike }, [], items).domain).toBe('bikepacking');
  });

  it('a new weekend trip: own bags, no bike, the weekend items worn or in the first bag', () => {
    const t = newPackTrip({ title: ' Ticino ', startDate: '2026-11-01', days: 2, domain: 'weekend' }, [], items, 1000);
    expect(t).toMatchObject({ title: 'Ticino', domain: 'weekend', bikeId: null, setup: {}, copiedFrom: null });
    expect(t.packs.map((p) => p.key)).toEqual(['bag', 'day']);
    expect(hasBike(t)).toBe(false);
    expect(domainOf(t)).toBe('weekend');
    expect(t.entries).toEqual([
      { itemId: 'EL13', slot: 'bag', qty: 1, packed: false },
      { itemId: 'WE01', slot: 'bag', qty: 1, packed: false },
      { itemId: 'WE02', slot: 'body', qty: 1, packed: false },
      { itemId: 'FD01', slot: 'bag', qty: 1, packed: false },
    ]);
    expect(t.ready.map((r) => r.id)).toEqual(READY_BY_DOMAIN.weekend.map((r) => r.id));
    expect(t.ready.every((r) => !r.done)).toBe(true);
  });

  it('copies the last trip of the same area; an area without items starts empty', () => {
    const old = { id: 'w1', domain: 'weekend', startDate: '2026-05-01', packs: [{ key: 'bag', name: 'Travel bag' }, { key: 'day', name: 'Daypack' }], entries: [{ itemId: 'WE03', slot: 'day', qty: 2, packed: true }, { itemId: 'NOPE', slot: 'day', qty: 1, packed: true }] };
    const bikeTrip = { id: 'b1', domain: 'bikepacking', bikeId: 'x', startDate: '2026-09-01', entries: [{ itemId: 'KL01', slot: 'seat' }] };
    const t = newPackTrip({ title: 'Again', startDate: '', days: 1, domain: 'weekend' }, [old, bikeTrip], items);
    expect(t.copiedFrom).toBe('w1');
    expect(t.entries).toEqual([{ itemId: 'WE03', slot: 'day', qty: 2, packed: false }]);
    const ski = newPackTrip({ title: 'Ski', startDate: '', days: 1, domain: 'ski', readyStandard: [{ id: 'mine', label: 'Mine' }] }, [old, bikeTrip], items);
    expect(ski.entries).toEqual([]);
    expect(ski.packs).toEqual([{ key: 'pack', name: 'Backpack 30 L', volumeL: 30 }]);
    expect(ski.ready).toEqual([{ id: 'mine', label: 'Mine', done: false }]);
  });

  it('weights and packing day of a trip without a bike', () => {
    const t = newPackTrip({ title: 'W', startDate: '', days: 1, domain: 'travel' }, [], [it_('A', { role: 'standard', domains: ['travel'], weightG: 1000, volumeL: 30 }), it_('B', { role: 'worn', domains: ['travel'], weightG: 500 })]);
    const s = tripStats(t, [it_('A', { weightG: 1000, volumeL: 30 }), it_('B', { weightG: 500 })], [], null, 75000);
    expect(s.zones.map((z) => [z.key, z.bag?.name ?? null, z.noBag])).toEqual([['body', null, false], ['pack', 'Backpack 60 L', false], ['day', 'Daypack', false]]);
    expect(s.zones[1].bag.volumeL).toBe(60);
    expect(s.zones[1].vol).toBe(30);
    expect([s.baseG, s.wornG, s.bagsG, s.gearG + s.onMeG]).toEqual([1000, 500, 0, 1500]);
    expect(packSteps(s).map((x) => x.title)).toEqual(['Backpack 60 L', 'Wear and carry']);
  });

  it('packSlot and domainEntries', () => {
    const packs = [{ key: 'pack' }];
    expect(packSlot({ role: 'worn' }, packs)).toBe('body');
    expect(packSlot({ defaultBag: 'seat' }, packs)).toBe('pack');
    expect(packSlot({ defaultBag: 'seat' }, [])).toBe('body');
    expect(domainEntries(items, 'ski', packs)).toEqual([]);
  });

  it('start-up leaves trips without a bike alone', async () => {
    const db = createDb(`domains-${Math.random()}`);
    const t = newPackTrip({ title: 'W', startDate: '', days: 1, domain: 'weekend' }, [], items, 5);
    await db.trips.put(t);
    expect(await ensureTrips(db)).toBe(0);
    expect(await db.trips.get(t.id)).toEqual(t);
  });

  it('own standard ready check per area', () => {
    expect(readyKey('bikepacking')).toBe('readyStandard');
    expect(readyKey(undefined)).toBe('readyStandard');
    expect(readyKey('ski')).toBe('readyStandard.ski');
  });

  it('all my favourite things: by area, never gone, an item in two areas twice', () => {
    const fav = [...items, it_('BOTH', { favorite: true, domains: ['bikepacking', 'weekend'], category: 'sleep', qty: 2 })];
    const g = favoritesByDomain(fav);
    expect(g.map((x) => [x.key, x.items.map((i) => i.id)])).toEqual([
      ['bikepacking', ['BOTH']],
      ['weekend', ['WE01', 'BOTH']],
    ]);
    expect(g[1].grams).toBe(500);
    expect(favoritesByDomain([])).toEqual([]);
  });

  it('the search finds the favourites page', () => {
    const r = searchAll('favourite', { items });
    expect(r.at(-1)).toMatchObject({ kind: 'page', rows: [{ href: '#/favorites', sub: '1 item' }] });
  });
});
