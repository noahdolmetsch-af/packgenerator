// Mini-Tools «Essen und Unverträglichkeiten» (Noah 28.10.2026, idea 7): answers, counting, shopping list. Fictional data only.
import { describe, it, expect } from 'vitest';
import { foodQuestion, readFood, cleanFoodAnswer, countFood, itemFor, shoppingList, shoppingText, MENUS } from '../src/lib/mini/essen.js';

const T = (s) => s;
const pasta = MENUS.find((m) => m.key === 'pasta');
const breakfast = MENUS.find((m) => m.key === 'breakfast');

describe('food question', () => {
  it('cleans question and answers', () => {
    expect(foodQuestion({ title: '' })).toBeNull();
    const q = foodQuestion({ title: ' Hüttenabend ', day: '2026-11-20' });
    expect(q).toMatchObject({ kind: 'food', title: 'Hüttenabend', day: '2026-11-20' });
    expect(readFood({ ...q, pk: 'k' }).pk).toBe('k');
    expect(readFood({ ...q, kind: 'poll', pk: 'k' })).toBeNull();
    expect(cleanFoodAnswer({ name: 'A', diets: ['gf', 'vegan', 'x'], size: 'q', n: 9 })).toEqual({ name: 'A', diets: ['veg', 'vegan', 'gf'], other: '', size: 'm', n: 6 });
  });
  it('counts people and diets', () => {
    const c = countFood([cleanFoodAnswer({ name: 'A', diets: ['veg'], n: 2 }), cleanFoodAnswer({ name: 'B', diets: ['gf'], other: 'Sellerie' })]);
    expect(c.people).toBe(3);
    expect(c.diets.veg).toBe(2);
    expect(c.diets.gf).toBe(1);
    expect(c.notes).toEqual([{ name: 'B', other: 'Sellerie' }]);
  });
});

describe('shopping list', () => {
  it('swaps for diets; vegan counts as vegetarian and lactose-free', () => {
    const cheese = pasta.items.find((i) => i.name === 'Grated cheese');
    expect(itemFor(cheese, ['vegan'])).toEqual({ name: 'Yeast flakes', q: 5 });
    expect(itemFor(cheese, ['lf'])).toEqual({ name: 'Lactose-free grated cheese', q: 20 });
    const milk = breakfast.items.find((i) => i.name === 'Milk');
    expect(itemFor(milk, ['vegan']).name).toBe('Oat drink');
  });
  it('adds up portions and rounds up', () => {
    const rows = [cleanFoodAnswer({ name: 'A' }), cleanFoodAnswer({ name: 'B', size: 'l' }), cleanFoodAnswer({ name: 'C', diets: ['gf'], n: 2 })];
    const l = shoppingList(pasta, rows);
    expect(l.find((x) => x.name === 'Pasta')).toEqual({ name: 'Pasta', unit: 'g', q: 300 }); // 125 + 168.75 → 300 (>200: 50 g steps)
    expect(l.find((x) => x.name === 'Gluten-free pasta')).toEqual({ name: 'Gluten-free pasta', unit: 'g', q: 250 });
    expect(shoppingText('Einkauf', l.slice(0, 1), T)).toBe('Einkauf\n- 300 g Pasta');
  });
});
