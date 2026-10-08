/**
 * v0.37.0 "Backpacks" (Noah, 8.10.2026, answers 1a–5a). All data is made up (test_data_gtp_ names).
 * Worn places Back ('carry') and Hip ('hip') count to "On me", not to the bike, its bags or the wheels;
 * real backpacks are suggested by litres and areas; the litre note never warns on unknown data;
 * old trips with 'carry' keep working; a vest can be clothing and a bag.
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, afterEach } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { SLOT, WORN_SLOTS, isWornSlot, isWornBag, placesOf, bagsFor, bikeSetup, containerWeight } from '../src/lib/bikes.js';
import { tripStats, axleLoad, switchBike, absorbBags, bagItemIds, ensureTrips, packSteps, slotFor } from '../src/lib/trips.js';
import { bikeChoice } from '../src/lib/choice.js';
import { newPackTrip } from '../src/lib/domains.js';
import { suggestPacks, suggestBack, rankBags, wantFor, fitScore, litreWarning, choosePack, genericPacks, alsoBagRecord, alsoBagOf, setAlsoBag, isUltra } from '../src/lib/backpacks.js';
import { t, lang } from '../src/lib/i18n.svelte.js';
import DE from '../src/lib/i18n/de/index.js';

afterEach(() => (lang.v = 'en'));

const P = 'test_data_gtp_';
const it_ = (id, extra) => ({ id, name: `${P}${id}`, category: 'elec', weightG: 100, qty: 1, ownership: 'owned', role: null, sets: [], ...extra });
const items = [
  it_('A', { weightG: 400 }),
  it_('B', { weightG: 300 }),
  it_('JAC', { category: 'onbike', weightG: 200, role: 'worn' }),
  it_('GEL', { category: 'food', weightG: 50 }),
  it_('SEATBAG', { category: 'bags', weightG: 350 }),
  it_('VEST', { category: 'onbike', weightG: 180, domains: ['bikepacking'] }),
];
const byId = Object.fromEntries(items.map((i) => [i.id, i]));
const bags = [
  { id: 'bag-seat', name: `${P}Seat pack`, slot: 'seat', itemId: 'SEATBAG', pieces: 1, volumeL: 10 },
  { id: 'bag-hip', name: `${P}Hip bag`, slot: 'hip', itemId: null, weightG: 120, pieces: 1, volumeL: 2 },
  { id: 'bag-run15', name: `${P}Running vest`, slot: 'carry', itemId: null, weightG: 290, pieces: 1, volumeL: 15, domains: ['hiking', 'bikepacking'] },
];
const bike = { id: `${P}bike`, name: 'Test bike', weightG: 10000, slots: ['seat', 'frame'], setup: { seat: 'bag-seat', carry: 'bag-run15', hip: 'bag-hip' } };
const trip = {
  id: 'trip-1',
  bikeId: bike.id,
  setup: { ...bike.setup },
  entries: [
    { itemId: 'A', slot: 'seat', qty: 1 },
    { itemId: 'B', slot: 'carry', qty: 1 },
    { itemId: 'GEL', slot: 'hip', qty: 2 },
    { itemId: 'JAC', slot: 'body', qty: 1 },
  ],
};

describe('worn places', () => {
  it('Back keeps the key carry, Hip is new; both are worn and on every bike', () => {
    expect(WORN_SLOTS).toEqual(['carry', 'hip']);
    expect(SLOT.carry.worn && SLOT.hip.worn).toBe(true);
    expect(isWornSlot('seat')).toBe(false);
    expect(placesOf({ slots: ['seat'] }).map((s) => s.key)).toEqual(['seat', 'carry', 'hip']);
    lang.v = 'de';
    expect([t(SLOT.carry.name), t(SLOT.hip.name), t(SLOT.carry.where), t(SLOT.hip.where)]).toEqual(['Rücken', 'Hüfte', 'Rucksack oder Weste', 'Hüfttasche']);
  });

  it('a worn place offers every worn bag, its own first; a bike place only its own', () => {
    expect(bagsFor('hip', bags).map((b) => b.id)).toEqual(['bag-hip', 'bag-run15']);
    expect(bagsFor('carry', bags).map((b) => b.id)).toEqual(['bag-run15', 'bag-hip']);
    expect(bagsFor('seat', bags).map((b) => b.id)).toEqual(['bag-seat']);
    expect(isWornBag(bags[1])).toBe(true);
    expect(isWornBag(bags[0])).toBe(false);
  });

  it('a bag without a gear item has its own weight; one with an item takes the item weight', () => {
    expect(containerWeight(bags[1], byId)).toBe(120);
    expect(containerWeight(bags[0], byId)).toBe(350);
    expect(containerWeight({ id: 'x', itemId: null }, byId)).toBe(null);
  });
});

describe('weights: worn bags count to the body, not to the bike', () => {
  const s = tripStats(trip, items, bags, bike, 64000);

  it('items on Back and Hip and the worn bags are On me', () => {
    // On me: JAC 200 + B 300 (Back) + vest bag 290 + hip bag 120; GEL 2 × 50 on the hip is food.
    expect(s.wornG).toBe(200 + 300 + 290 + 120);
    expect(s.wornBagsG).toBe(410);
    expect(s.onMeG).toBe(200 + 300 + 100 + 410);
    expect(s.consumablesG).toBe(100);
  });

  it('the bike luggage has only the bike places', () => {
    expect(s.baseG).toBe(400);
    expect(s.gearG).toBe(400);
    expect(s.bagsG).toBe(350); // only the seat pack
  });

  it('nothing is counted twice: base + worn + food = gear + on me, system = all of it', () => {
    expect(s.baseG + s.wornG + s.consumablesG).toBe(s.gearG + s.onMeG);
    expect(s.systemG).toBe(s.gearG + s.onMeG + s.bagsG + s.bikeG + s.riderG);
    expect(s.systemG).toBe(400 + 300 + 100 + 200 + 410 + 350 + 10000 + 64000);
  });

  it('the load per wheel leaves out Back and Hip', () => {
    const axle = axleLoad(s, byId);
    expect(axle.front + axle.rear).toBe(400 + 350);
  });

  it('an unweighed worn bag is counted as missing On me, not in the bags', () => {
    const b2 = bags.map((b) => (b.id === 'bag-hip' ? { ...b, weightG: null } : b));
    const s2 = tripStats(trip, items, b2, bike, 64000);
    expect([s2.wornBagsMissing, s2.bagsMissing]).toEqual([1, 0]);
    expect(s2.wornMissing).toBe(1);
  });

  it('the bike setup and the bike comparison leave the worn bags out', () => {
    const set = bikeSetup(bike, bags, items);
    expect([set.bagCount, set.bagsG, set.volumeL, set.wornCount, set.wornG]).toEqual([1, 350, 10, 2, 410]);
    expect(set.rows.map((r) => r.slot.key)).toEqual(['seat', 'frame', 'carry', 'hip']);
    const [row] = bikeChoice(trip, [bike], { containers: bags, items, today: '2026-10-08' });
    expect(row.bagsG).toBe(350);
  });

  it('a new item never lands on Back or Hip by itself', () => {
    expect(slotFor('frame', { carry: 'bag-run15' })).toBe('body');
  });
});

describe("migration of 'carry'", () => {
  const old = { id: 'trip-old', bikeId: bike.id, setup: { seat: 'bag-seat', carry: 'bag-run15' }, ready: [], entries: [{ itemId: 'B', slot: 'carry', qty: 1, packed: true }, { itemId: 'A', slot: 'seat', qty: 1, packed: false }] };

  it('an old trip with things on carry keeps them, now as Back, counted On me', () => {
    const s = tripStats(old, items, bags, bike, 0);
    const z = s.zones.find((x) => x.key === 'carry');
    expect(z.entries).toEqual([old.entries[0]]);
    expect(z.worn).toBe(true);
    lang.v = 'de';
    expect(t(z.zone.name)).toBe('Rücken');
    expect(packSteps(s).map((x) => x.title)).toContain('Rücken');
  });

  it('the start-up step leaves such a trip as it is', async () => {
    const db = createDb(`${P}carry-${Math.random()}`);
    await db.bikes.put(bike);
    await db.containers.bulkPut(bags);
    await db.trips.put(old);
    expect(await ensureTrips(db)).toBe(0);
    expect(await db.trips.get('trip-old')).toEqual(old);
    db.close();
  });

  it('another bike keeps the worn bags and the items on them', () => {
    const other = { id: 'other', name: 'Other', setup: { seat: 'bag-seat' } };
    const ch = switchBike(old, other);
    expect(ch.setup).toEqual({ seat: 'bag-seat', carry: 'bag-run15' });
    expect(ch.entries).toEqual(old.entries);
  });

  it('an old bag on carry is a worn bag and still fits Back', () => {
    const oldBag = { id: 'bag-TA10', itemId: 'TA10', slot: 'carry' };
    expect(isWornBag(oldBag)).toBe(true);
    expect(bagsFor('carry', [oldBag]).length).toBe(1);
  });
});

describe('real backpacks for a trip without a bike', () => {
  const packs = [
    { id: 'bag-r12', name: `${P}Pack A`, slot: 'carry', volumeL: 12, domains: [] },
    { id: 'bag-r15', name: `${P}Pack B`, slot: 'carry', volumeL: 15, domains: ['hiking'] },
    { id: 'bag-d20', name: `${P}Pack C`, slot: 'carry', volumeL: 20 },
    { id: 'bag-p20', name: `${P}Pack D`, slot: 'carry', volumeL: 20 },
    { id: 'bag-x30', name: `${P}Pack E`, slot: 'carry', volumeL: 30 },
    { id: 'bag-seat', name: `${P}Seat`, slot: 'seat', volumeL: 15, domains: ['hiking'] },
  ];

  it('hiking: a 12 or 15 L pack, the one made for hiking first; never a bike bag', () => {
    const t1 = newPackTrip({ title: 'Walk', startDate: '2026-11-01', days: 1, domain: 'hiking' }, [], [], 1);
    expect(wantFor('hiking', 0)).toEqual({ min: 12, max: 15 });
    expect(suggestPacks(t1, packs)).toEqual([{ key: 'pack', bagId: 'bag-r15' }]);
    expect(rankBags(packs, wantFor('hiking', 0), 'hiking').map((r) => r.bag.id)).toEqual(['bag-r15', 'bag-r12']);
  });

  it('weekend and world trip: two different 20 L bags', () => {
    for (const domain of ['weekend', 'travel']) {
      const t1 = newPackTrip({ title: 'Away', startDate: '2026-11-01', days: 2, domain }, [], [], 1);
      const s = suggestPacks(t1, packs);
      expect(s.map((r) => r.bagId).sort()).toEqual(['bag-d20', 'bag-p20']);
    }
  });

  it('matches by litres and areas, not by names', () => {
    const renamed = packs.map((b) => ({ ...b, name: 'Zzz' }));
    const t1 = newPackTrip({ title: 'Walk', startDate: '2026-11-01', days: 1, domain: 'hiking' }, [], [], 1);
    expect(suggestPacks(t1, renamed)).toEqual([{ key: 'pack', bagId: 'bag-r15' }]);
    expect(fitScore({ slot: 'carry', volumeL: 40, domains: ['hiking'] }, wantFor('hiking', 0), 'hiking')).toBe(1);
    expect(fitScore({ slot: 'carry', volumeL: null }, wantFor('hiking', 0), 'hiking')).toBe(0);
  });

  it('no fitting bag: no suggestion; an area without its own want looks near its generic litres', () => {
    const t1 = newPackTrip({ title: 'Walk', startDate: '2026-11-01', days: 1, domain: 'hiking' }, [], [], 1);
    expect(suggestPacks(t1, [packs[4]])).toEqual([{ key: 'pack', bagId: null }]);
    expect(wantFor('ski', 0)).toEqual({ min: 25, max: 35 });
  });

  it('choosing a real pack: name, litres and weight from the bag; the generic one stays as fallback', () => {
    const t1 = newPackTrip({ title: 'Walk', startDate: '2026-11-01', days: 1, domain: 'hiking' }, [], [], 1);
    const withA = { ...t1, entries: [{ itemId: 'A', slot: 'pack', qty: 1 }], ...choosePack(t1, 'pack', 'bag-run15') };
    expect(withA.packs[0]).toMatchObject({ key: 'pack', name: 'Backpack 30 L', bagId: 'bag-run15' });
    expect(genericPacks(withA)).toEqual([]);
    const s = tripStats(withA, items, bags, null, null);
    const z = s.zones.find((x) => x.key === 'pack');
    expect(z.bag).toMatchObject({ id: 'bag-run15', volumeL: 15, real: true, pack: true });
    expect(s.bagsG).toBe(290);
    expect(s.baseG).toBe(400);
    // back to the generic pack, and a deleted bag falls back as well
    expect(choosePack(withA, 'pack', null).packs[0]).toEqual({ key: 'pack', name: 'Backpack 30 L', volumeL: 30 });
    const gone = tripStats(withA, items, [], null, null).zones.find((x) => x.key === 'pack');
    expect(gone.bag).toMatchObject({ id: 'pack-pack', volumeL: 30, pack: true });
    expect(gone.bag.real).toBeUndefined();
  });

  it('an older trip with generic packs keeps working and is marked for "Choose a real backpack"', () => {
    const t0 = { id: 'old', domain: 'weekend', packs: [{ key: 'bag', name: 'Travel bag', volumeL: null }, { key: 'day', name: 'Daypack', volumeL: null }], entries: [{ itemId: 'A', slot: 'day', qty: 1 }] };
    expect(genericPacks(t0).length).toBe(2);
    const s = tripStats(t0, items, bags, null, null);
    expect(s.zones.map((z) => z.key)).toEqual(['body', 'bag', 'day']);
    expect(s.bagsG).toBe(0);
    lang.v = 'de';
    expect(t('Choose a real backpack')).toBe('Echten Rucksack wählen');
  });

  it('an ultra race on the bike: the running vest on Back, only when Back is empty', () => {
    const race = { ...trip, event: true, days: 3, setup: { seat: 'bag-seat' } };
    expect(isUltra(race)).toBe(true);
    expect(suggestBack(race, bags)?.id).toBe('bag-run15');
    expect(suggestBack({ ...race, setup: { carry: 'bag-hip' } }, bags)).toBe(null);
    expect(suggestBack({ ...race, event: false }, bags)).toBe(null);
    expect(isUltra({ event: true, days: 1, hours: 4 })).toBe(false);
  });
});

describe('litre note', () => {
  const zone = (cap, entries) => ({ key: 'pack', bag: cap == null ? null : { volumeL: cap }, entries });
  const vol = { V5: { volumeL: 5 }, V8: { volumeL: 8 }, NONE: { volumeL: null }, ZERO: { volumeL: 0 } };

  it('warns only when the known litres already need more than the bag holds', () => {
    expect(litreWarning(zone(12, [{ itemId: 'V5', qty: 1 }, { itemId: 'V8', qty: 1 }]), vol)).toEqual({ need: 13, cap: 12, known: 2, count: 2 });
    expect(litreWarning(zone(12, [{ itemId: 'V5', qty: 3 }, { itemId: 'NONE' }]), vol)).toMatchObject({ need: 15, cap: 12 });
  });

  it('never warns on unknown data', () => {
    expect(litreWarning(zone(null, [{ itemId: 'V8', qty: 3 }]), vol)).toBe(null); // bag without litres
    expect(litreWarning(zone(0, [{ itemId: 'V8', qty: 3 }]), vol)).toBe(null);
    expect(litreWarning(zone(2, [{ itemId: 'NONE', qty: 9 }, { itemId: 'ZERO' }]), vol)).toBe(null); // items without litres
    expect(litreWarning(zone(12, [{ itemId: 'V5' }, { itemId: 'NONE', qty: 20 }]), vol)).toBe(null); // known part fits: no guess
    expect(litreWarning(zone(12, [{ itemId: 'V5', qty: 2 }]), vol)).toBe(null); // exactly fits under: 10 of 12
    expect(litreWarning(zone(12, []), vol)).toBe(null);
  });

  it('the German line has the numbers', () => {
    lang.v = 'de';
    expect(t('over {cap} L', { cap: 12 })).toBe('über 12 L');
    expect(DE['The items with known litres need {need} L; the bag holds {cap} L.']).toMatch(/\{need\}.*\{cap\}/);
  });
});

describe('a vest that is clothing and a bag', () => {
  const vest = byId.VEST;

  it('the bag record points to the item and keeps it an item', () => {
    const rec = alsoBagRecord(vest, 6);
    expect(rec).toMatchObject({ id: 'bag-also-VEST', slot: 'carry', itemId: 'VEST', volumeL: 6, alsoItem: true, pieces: 1 });
    expect(bagsFor('carry', [rec])).toEqual([rec]);
    // not taken out of the lists like a normal bag item
    expect(bagItemIds([rec, bags[0]])).toEqual(new Set(['SEATBAG']));
    const tr = absorbBags({ setup: {}, entries: [{ itemId: 'VEST', slot: 'body' }] }, [rec]);
    expect(tr.entries).toEqual([{ itemId: 'VEST', slot: 'body' }]);
    expect(tr.setup).toEqual({});
  });

  it('on Back and on the list: its weight counts once, On me', () => {
    const rec = alsoBagRecord(vest, 6);
    const tw = { id: 'v', setup: { carry: rec.id }, entries: [{ itemId: 'VEST', slot: 'body', qty: 1 }, { itemId: 'B', slot: 'carry', qty: 1 }] };
    const s = tripStats(tw, items, [rec], bike, 0);
    expect(s.wornG).toBe(180 + 300);
    expect(s.wornBagsG).toBe(0);
    const s2 = tripStats({ ...tw, entries: [tw.entries[1]] }, items, [rec], bike, 0);
    expect(s2.wornG).toBe(300 + 180); // only as a bag: the bag carries the weight
  });

  it('switching it on and off keeps the item and every trip entry; places get empty', async () => {
    const db = createDb(`${P}vest-${Math.random()}`);
    await db.items.put(vest);
    await db.bikes.put({ ...bike, setup: {} });
    await setAlsoBag(db, vest, true, 6);
    expect(alsoBagOf('VEST', await db.containers.toArray())).toMatchObject({ volumeL: 6, alsoItem: true });
    await db.bikes.update(bike.id, { 'setup.carry': 'bag-also-VEST' });
    await db.trips.put({ id: 'tv', setup: { carry: 'bag-also-VEST' }, entries: [{ itemId: 'VEST', slot: 'body', qty: 1, packed: false }] });
    await db.trips.put({ id: 'tw', domain: 'hiking', packs: [{ key: 'pack', name: 'Backpack 30 L', volumeL: 30, bagId: 'bag-also-VEST' }], entries: [] });
    await setAlsoBag(db, vest, true, 7); // update litres, same record
    expect((await db.containers.toArray()).filter((c) => c.itemId === 'VEST').length).toBe(1);
    await setAlsoBag(db, vest, false);
    expect(await db.containers.count()).toBe(0);
    expect(await db.items.get('VEST')).toEqual(vest);
    expect((await db.bikes.get(bike.id)).setup.carry).toBe(null);
    const tv = await db.trips.get('tv');
    expect(tv.setup.carry).toBe(null);
    expect(tv.entries).toEqual([{ itemId: 'VEST', slot: 'body', qty: 1, packed: false }]);
    expect((await db.trips.get('tw')).packs).toEqual([{ key: 'pack', name: 'Backpack 30 L', volumeL: 30 }]);
    db.close();
  });
});

describe('German texts of 0.37', () => {
  it('no ß and no long dashes', async () => {
    const own = (await import('../src/lib/i18n/de/backpacks.js')).default;
    for (const [en, de] of Object.entries(own)) {
      expect(de, en).not.toMatch(/[ß—]/);
      expect(DE[en]).toBe(de);
    }
  });
});
