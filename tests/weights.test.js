/**
 * v0.22.0 (AP04, test case PF14): honest weights. Unknown is not zero: every sum adds up only the
 * known weights and says how many are missing; a weight of 0 g is known; several pieces count
 * once per piece; a fully weighed list shows the plain sum. All data here is made up.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { sumKnown, knownWeight, weightText, gearStats, formatWeight } from '../src/lib/gear.js';
import { tripStats, axleLoad, axleSplit } from '../src/lib/trips.js';
import { bikeWeightKind } from '../src/lib/bikes.js';
import { bikeChoice } from '../src/lib/choice.js';
import { tripRows } from '../src/lib/insights.js';
import { debriefCounts } from '../src/lib/debrief.js';
import { lang } from '../src/lib/i18n.svelte.js';

afterEach(() => (lang.v = 'en'));

const it_ = (id, extra) => ({ id, name: id, category: 'elec', weightG: 100, qty: 1, ownership: 'owned', role: null, sets: [], ...extra });
const bike = { id: 'test_data_gtp_bike', name: 'Test bike', weightG: 12000, weightNote: '', slots: ['seat', 'top'], setup: { seat: 'bag-seat', top: 'bag-top' } };
const bags = [
  { id: 'bag-seat', slot: 'seat', itemId: 'BAG1', volumeL: 10 },
  { id: 'bag-top', slot: 'top', itemId: 'BAG2', volumeL: 1 },
];

describe('PF14: sums with unknown weights', () => {
  it('adds up only known weights and counts the unknown ones', () => {
    expect(sumKnown([450, null, undefined, 0, 50])).toEqual({ g: 500, missing: 2, n: 5 });
    expect(sumKnown([])).toEqual({ g: 0, missing: 0, n: 0 });
  });

  it('0 g is a known weight, null is not', () => {
    expect(sumKnown([0, 0])).toEqual({ g: 0, missing: 0, n: 2 });
    expect(sumKnown([null])).toEqual({ g: 0, missing: 1, n: 1 });
  });

  it('labels a sum with gaps as "known", a complete one plainly', () => {
    expect(knownWeight(2690, 0)).toBe('2.69 kg');
    expect(knownWeight(2690, 7)).toBe('known: 2.69 kg');
    expect(weightText(2690, 7)).toBe('known: 2.69 kg · 7 not weighed');
    expect(weightText(2690, 0)).toBe('2.69 kg');
    lang.v = 'de';
    expect(knownWeight(2690, 7)).toBe('bekannt: 2.69 kg');
    expect(weightText(2690, 7)).toBe('bekannt: 2.69 kg · 7 nicht gewogen');
  });

  it('Gear: the gear weight says how many non-food items are not weighed', () => {
    const items = [
      it_('A', { weightG: 1000 }),
      it_('B', { weightG: null }),
      it_('C', { weightG: 0 }), // weighed: 0 g (e.g. a sticker)
      it_('D', { weightG: 450, qty: 2 }), // a pair: 900 g
      it_('F', { category: 'food', weightG: null }),
      it_('W', { weightG: null, ownership: 'wishlist' }), // not owned: not counted
    ];
    const s = gearStats(items);
    expect(s.total).toBe(1900);
    expect(s.totalMissing).toBe(1);
    expect(s.consumablesMissing).toBe(1);
    expect(s.unweighed).toBe(2);
    expect(knownWeight(s.total, s.totalMissing)).toBe(`known: ${formatWeight(1900)}`);
  });

  it('Gear: fully weighed shows the plain sum', () => {
    const s = gearStats([it_('A', { weightG: 1000 }), it_('B', { weightG: 0 })]);
    expect([s.total, s.totalMissing, s.unweighed]).toEqual([1000, 0, 0]);
    expect(knownWeight(s.total, s.totalMissing)).toBe('1 kg');
  });
});

describe('PF14: the four figures on the Pack page', () => {
  const items = [
    it_('WORN', { weightG: 200 }),
    it_('WORN0', { weightG: null }),
    it_('TOOL', { weightG: 300 }),
    it_('TENT', { weightG: null }),
    it_('PAIR', { weightG: 450 }),
    it_('GEL', { category: 'food', weightG: null }),
    it_('BAR', { category: 'food', weightG: 50 }),
    it_('BAG1', { category: 'bags', weightG: 400 }),
    it_('BAG2', { category: 'bags', weightG: null }),
  ];
  const trip = {
    setup: bike.setup,
    entries: [
      { itemId: 'WORN', slot: 'body', qty: 1, packed: true },
      { itemId: 'WORN0', slot: 'body', qty: 1 },
      { itemId: 'GEL', slot: 'body', qty: 3 },
      { itemId: 'TOOL', slot: 'seat', qty: 1, packed: true },
      { itemId: 'TENT', slot: 'seat', qty: 1 },
      { itemId: 'PAIR', slot: 'top', qty: 2 },
      { itemId: 'BAR', slot: 'top', qty: 2 },
    ],
  };

  it('every figure has its own missing count', () => {
    const s = tripStats(trip, items, bags, bike, 64000);
    expect([s.baseG, s.baseMissing]).toEqual([300 + 900, 1]); // TENT
    expect([s.wornG, s.wornMissing]).toEqual([200, 1]); // WORN0
    expect([s.consumablesG, s.consumablesMissing]).toEqual([100, 1]); // GEL
    expect([s.bagsG, s.bagsMissing]).toEqual([400, 1]); // BAG2
    expect(s.unweighed).toBe(3);
    expect(s.baseMissing + s.wornMissing + s.consumablesMissing).toBe(s.unweighed);
    expect(s.gearMissing + s.onMeMissing).toBe(s.unweighed);
    // System: 3 items + 1 bag; bike and rider are known.
    expect(s.systemMissing).toBe(4);
    expect(s.systemG).toBe(1200 + 200 + 100 + 400 + 12000 + 64000);
  });

  it('several pieces count once per piece', () => {
    const s = tripStats(trip, items, bags, bike, 64000);
    expect(s.zones.find((z) => z.key === 'top').grams).toBe(2 * 450 + 2 * 50);
  });

  it('a bike or rider without a weight is missing in the system weight, not 0 kg', () => {
    const s = tripStats(trip, items, bags, { ...bike, weightG: null }, null);
    expect(s.systemMissing).toBe(4 + 2);
    expect(s.bikeKind).toBe('missing');
  });

  it('fully weighed: no missing count anywhere', () => {
    const all = items.map((i) => ({ ...i, weightG: i.weightG ?? 10 }));
    const s = tripStats(trip, all, bags, bike, 64000);
    expect([s.unweighed, s.baseMissing, s.wornMissing, s.consumablesMissing, s.bagsMissing, s.systemMissing]).toEqual([0, 0, 0, 0, 0, 0]);
    expect(knownWeight(s.baseG, s.baseMissing)).toBe(formatWeight(s.baseG));
  });

  it('on the list, packed and still to pack are different numbers', () => {
    const s = tripStats(trip, items, bags, bike, 64000);
    expect([s.count, s.packed, s.toPack]).toEqual([7, 2, 5]);
  });
});

describe('PF14: front / rear split is an estimate when weights are missing', () => {
  const box = (x) => ({ box: { x, w: 100 } });
  it('exact percent when all is weighed', () => {
    const a = axleLoad({ zones: [{ key: 'seat', grams: 1000, unweighed: 0, bag: null, zone: box(100) }, { key: 'bar', grams: 1300, unweighed: 0, bag: null, zone: box(540) }] }, {});
    expect(a.estimate).toBe(false);
    expect(axleSplit(a)).toEqual({ front: 57, rear: 43, estimate: false });
  });
  it('rounded to 5 % and marked when an item is not weighed', () => {
    const a = axleLoad({ zones: [{ key: 'seat', grams: 1000, unweighed: 2, bag: null, zone: box(100) }, { key: 'bar', grams: 1300, unweighed: 0, bag: null, zone: box(540) }] }, {});
    expect(a).toMatchObject({ missing: 2, estimate: true });
    expect(axleSplit(a)).toEqual({ front: 55, rear: 45, estimate: true });
  });
  it('a bag without a weight also makes it an estimate', () => {
    const a = axleLoad({ zones: [{ key: 'seat', grams: 1000, unweighed: 0, bag: { slot: 'seat', itemId: 'X' }, zone: box(100) }] }, {});
    expect(a).toMatchObject({ missing: 1, estimate: true });
  });
  it('nothing on the bike: no split', () => {
    expect(axleSplit({ front: 0, rear: 0 })).toBe(null);
  });
});

describe('PF14: bike weight measured or estimated', () => {
  it('tells the three cases apart', () => {
    expect(bikeWeightKind({ weightG: 12000, weightNote: '' })).toBe('measured');
    expect(bikeWeightKind({ weightG: 9000, weightNote: '9 kg from Strava (estimate). Weigh it.' })).toBe('estimate');
    expect(bikeWeightKind({ weightG: null, weightNote: 'About 13 kg (logbook). Weigh it.' })).toBe('missing');
    expect(bikeWeightKind(null)).toBe('missing');
  });
  it('Compare bikes: bags without a weight are counted, no "lightest" from gaps', () => {
    const items = [it_('BAG1', { weightG: 400 }), it_('BAG2', { weightG: null })];
    const other = { ...bike, id: 'test_data_gtp_b2', weightG: 9000, weightNote: '9 kg from Strava (estimate)', setup: { seat: 'bag-seat' } };
    const rows = bikeChoice({ id: 't', bikeId: bike.id, entries: [] }, [bike, other], { containers: bags, items, today: '2026-10-07' });
    expect(rows.map((r) => [r.totalG, r.missing, r.bikeKind, r.lightest])).toEqual([
      [12400, 1, 'measured', false],
      [9400, 0, 'estimate', false],
    ]);
    const full = bikeChoice({ id: 't', bikeId: bike.id, entries: [] }, [other], { containers: bags, items, today: '2026-10-07' });
    expect(full[0].lightest).toBe(true);
  });
});

describe('PF14: debrief sums', () => {
  const items = [it_('A', { weightG: 500 }), it_('B', { weightG: null }), it_('C', { weightG: 200 })];
  const trip = { id: 'test_data_gtp_trip', title: 'Test', startDate: '2026-09-01', entries: [{ itemId: 'A', qty: 1 }, { itemId: 'B', qty: 1 }, { itemId: 'C', qty: 2 }] };
  const d = { tripId: trip.id, status: 'done', items: { A: 'unused', B: 'unused' }, missing: [] };
  it('not-used weight says how many items have no weight', () => {
    expect(debriefCounts(d, trip, items)).toMatchObject({ unused: 2, unusedG: 500, unusedUnweighed: 1 });
  });
  it('trips compared: packed and not-used sums with their gaps', () => {
    const [r] = tripRows([trip], [d], items);
    expect(r).toMatchObject({ packedG: 900, packedMissing: 1, unusedG: 500, unusedMissing: 1 });
  });
});
