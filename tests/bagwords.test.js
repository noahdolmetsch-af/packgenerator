import { describe, it, expect } from 'vitest';
import { bagWords, placeWords } from '../src/lib/bikes/bagwords.js';
import { bikeSetup } from '../src/lib/bikes.js';
import { weightByPlace } from '../src/lib/touren.js';
import { tripStats } from '../src/lib/trips.js';

// UI-Test 26.10.2026 T7: bags, bottle cages and «On me» are counted the same way everywhere. Fictional data.
describe('bag words', () => {
  it('names bottle cages apart from bags', () => {
    expect(bagWords(3, 2)).toBe('1 bag, 2 bottle cages');
    expect(bagWords(3)).toBe('3 bags');
    expect(bagWords(2, 2)).toBe('2 bottle cages');
  });

  it('the bike head counts the cages apart; they weigh nothing on top of the bike', () => {
    const bike = { id: 'b', slots: ['cage1', 'cage2', 'tool'], setup: { cage1: 'c1', cage2: 'c2', tool: 'tb' } };
    const bags = [{ id: 'c1', slot: 'cage1', weightG: 32 }, { id: 'c2', slot: 'cage2', weightG: 32 }, { id: 'tb', slot: 'tool', weightG: 20 }];
    const s = bikeSetup(bike, bags, []);
    expect([s.bagCount, s.cageCount, s.bagsG]).toEqual([3, 2, 20]);
  });

  it('a trip says where its things are: bags on the bike, then the worn places, the bike and you', () => {
    const zones = [
      { key: 'frame', entries: [{}] }, { key: 'top', entries: [{}] }, { key: 'cage2', entries: [] },
      { key: 'carry', worn: true, zone: { name: 'Back' }, entries: [{}] }, { key: 'mounted', entries: [{}] }, { key: 'body', entries: [{}] },
    ];
    expect(placeWords(zones)).toBe('2 bags, plus Back, on the bike and on you');
    expect(placeWords([{ key: 'p1', entries: [{}] }, { key: 'body', entries: [{}] }], { bike: false })).toBe('1 bag');
  });
});

describe('weight by place: one «On me», bags with their food', () => {
  it('the worn places and the worn bags count on me, as in the drawing (onMeG)', () => {
    const items = [
      { id: 'j', name: 'Jacket', weightG: 300, category: 'clothing', ownership: 'owned' },
      { id: 'w', name: 'Water', weightG: 500, waterL: 0.5, category: 'food', ownership: 'owned' },
      { id: 't', name: 'Tube', weightG: 100, category: 'repair', ownership: 'owned' },
      { id: 'bar', name: 'Bar', weightG: 50, category: 'food', ownership: 'owned' },
    ];
    const bags = [{ id: 'hb', slot: 'hip', weightG: 120 }, { id: 'fb', slot: 'frame', weightG: 150 }];
    const trip = { setup: { hip: 'hb', frame: 'fb' }, entries: [{ itemId: 'j', slot: 'body' }, { itemId: 'w', slot: 'hip' }, { itemId: 't', slot: 'frame' }, { itemId: 'bar', slot: 'frame', qty: 2 }] };
    const stats = tripStats(trip, items, bags, null, 0);
    const byId = Object.fromEntries(items.map((i) => [i.id, i]));
    const eats = (i) => i.category === 'food';
    const w = weightByPlace(stats, byId, eats);
    const body = w.rows.find((r) => r.key === 'body');
    expect(body.g + (w.foodByPlace.body ?? 0)).toBe(stats.onMeG);
    expect(w.rows.find((r) => r.key === 'hip')).toBeUndefined();
    expect(w.rows.find((r) => r.key === 'frame').g + w.foodByPlace.frame).toBe(stats.zones.find((z) => z.key === 'frame').grams);
    expect(w.total).toBe(stats.packG);
  });
});
