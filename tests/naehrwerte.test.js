// «Kochen» step 4 (Noah 28.10.2026 «4a»): approximate nutrition per portion
import { describe, it, expect } from 'vitest';
import { RECIPES } from '../src/lib/kochen/rezepte.js';
import { nutritionOf, nutritionById, gramsOf, NUTRIENT_KEYS } from '../src/lib/kochen/naehrwerte.js';

describe('nutrition per portion', () => {
  it('every ingredient of every recipe is in the table, with a weight for its unit', () => {
    const keys = new Set(RECIPES.flatMap((r) => r.ingredients.map((i) => i.key)));
    for (const k of keys) expect(NUTRIENT_KEYS, k).toContain(k);
    for (const k of NUTRIENT_KEYS) expect(keys.has(k), `${k} is not used any more`).toBe(true);
    for (const r of RECIPES) for (const i of r.ingredients) expect(gramsOf(i.key, i.amount, i.unit), `${r.id} ${i.key} ${i.unit}`).not.toBeNull();
  });
  it('every recipe has plausible values for one portion', () => {
    for (const r of RECIPES) {
      const n = nutritionOf(r);
      expect(n, r.id).not.toBeNull();
      expect(n.kcal, r.id).toBeGreaterThanOrEqual(100);
      expect(n.kcal, r.id).toBeLessThanOrEqual(1100);
      // the grams of carbs, protein and fat give about the energy (4, 4 and 9 kcal; alcohol and fibre aside)
      const calc = n.carbs * 4 + n.protein * 4 + n.fat * 9;
      expect(Math.abs(calc - n.kcal) / n.kcal, r.id).toBeLessThan(0.2);
    }
  });
  it('a known recipe adds up', () => {
    const oats = nutritionOf(RECIPES.find((r) => r.id === 'overnight-oats'));
    // 50 g oats, 150 ml milk, 1 banana, 1 tsp honey
    expect(oats.kcal).toBe(Math.round((50 * 3.7 + 150 * 0.64 + 120 * 0.9 + 7 * 3.05) / 5) * 5);
    expect(oats.carbs).toBeGreaterThan(50);
    expect(nutritionById('overnight-oats')).toEqual(oats);
  });
  it('own recipes and unknown ingredients give no values (no guessing)', () => {
    expect(nutritionOf({ own: true, lines: ['x'] })).toBeNull();
    expect(nutritionOf(null)).toBeNull();
    expect(nutritionOf({ ingredients: [{ key: 'nope', amount: 1, unit: 'g' }] })).toBeNull();
  });
});
