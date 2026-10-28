// «Kochen» (Noah 28.10.2026 «1b 2a 3a 4a 5a»): the app's own recipes and the pure part of Planen › Alltag › Kochen
import { describe, it, expect } from 'vitest';
import { RECIPES, MEALS, INGREDIENTS, DE, scaled, roundAmount } from '../src/lib/kochen/rezepte.js';
import { listFor, ownRecipes, findRecipe, fmtAmount, ingredientRows, shoppingLines, recipeOfHash, recipeHref, prefsOf, hiddenRecipes, FILTERS } from '../src/lib/kochen/kochen.js';
import DEALL from '../src/lib/i18n/de/index.js';

describe('the recipes', () => {
  it('60 recipes with their own ids, every meal has at least 15', () => {
    expect(RECIPES.length).toBe(60);
    expect(new Set(RECIPES.map((r) => r.id)).size).toBe(60);
    for (const m of MEALS) expect(RECIPES.filter((r) => r.meals.includes(m.key)).length).toBeGreaterThanOrEqual(15);
  });
  it('very simple: at most 6 ingredients, at most 20 minutes, 2 to 5 steps', () => {
    for (const r of RECIPES) {
      expect(r.ingredients.length, r.id).toBeLessThanOrEqual(6);
      expect(r.min, r.id).toBeLessThanOrEqual(20);
      expect(r.steps.length, r.id).toBeGreaterThanOrEqual(2);
      expect(r.steps.length, r.id).toBeLessThanOrEqual(5);
      for (const i of r.ingredients) expect(INGREDIENTS[i.key], `${r.id} ${i.key}`).toBeTruthy();
    }
  });
  it('every text has its German one in the app', () => {
    for (const r of RECIPES) {
      expect(DEALL[r.title], r.title).toBeTruthy();
      for (const s of r.steps) expect(DEALL[s.text], s.text).toBe(DE[s.text]);
      for (const i of r.ingredients) expect(DEALL[i.name], i.name).toBeTruthy();
    }
    for (const f of FILTERS) expect(DEALL[f.label], f.label).toBeTruthy();
  });
  it('portions scale the amounts and the unit word', () => {
    const banana = { name: 'Banana', amount: 1, unit: 'pc' };
    expect(scaled(banana, 1)).toEqual({ name: 'Banana', amount: 1, unit: 'pc' });
    expect(scaled(banana, 3)).toEqual({ name: 'Banana', amount: 3, unit: 'pcs' });
    expect(scaled({ name: 'Eggs', amount: 2, unit: 'pcs' }, 1).unit).toBe('pcs');
    expect(scaled({ name: 'Cucumber', amount: 0.5, unit: 'pc' }, 1)).toEqual({ name: 'Cucumber', amount: 0.5, unit: 'pc' });
    expect(roundAmount(37.4)).toBe(37);
    expect(fmtAmount(0.5)).toBe('½');
    expect(fmtAmount(1.5)).toBe('1½');
    expect(fmtAmount(100)).toBe('100');
  });
});

describe('the page', () => {
  const oats = findRecipe('overnight-oats');
  it('the shopping lines for two portions', () => {
    expect(shoppingLines(oats, 2)).toEqual(['Rolled oats, 100 g', 'Milk, 300 ml', 'Banana, 2 pieces', 'Honey, 2 tsp']);
    expect(ingredientRows(oats, 1)[2]).toEqual({ name: 'Banana', amount: '1', unit: 'piece' });
  });
  it('filters by meal, hides, and lists own recipes of Free time', () => {
    const own = ownRecipes(
      [
        { id: 'e1', coll: 'c1', title: 'Grandma soup', data: { ingredients: ['Leek', 'Stock'], steps: '1. Cut the leek\n2. Cook it' } },
        { id: 'e2', coll: 'c2', title: 'A place', data: {} },
      ],
      [{ id: 'c1', type: 'recipes' }, { id: 'c2', type: 'places' }],
    );
    expect(own).toEqual([{ id: 'own:e1', own: true, entryId: 'e1', coll: 'c1', title: 'Grandma soup', lines: ['Leek', 'Stock'], steps: [{ text: 'Cut the leek' }, { text: 'Cook it' }] }]);
    expect(listFor('own', { own })).toEqual(own);
    expect(listFor('all', { own }).length).toBe(61);
    const breakfast = listFor('breakfast', { hidden: ['overnight-oats'] });
    expect(breakfast.some((r) => r.id === 'overnight-oats')).toBe(false);
    expect(breakfast.every((r) => r.meals.includes('breakfast'))).toBe(true);
    expect(hiddenRecipes(['overnight-oats']).map((r) => r.id)).toEqual(['overnight-oats']);
    expect(findRecipe('own:e1', own).title).toBe('Grandma soup');
    expect(shoppingLines(findRecipe('own:e1', own))).toEqual(['Leek', 'Stock']);
  });
  it('addresses and saved choices', () => {
    expect(recipeOfHash(recipeHref('own:e1'))).toBe('own:e1');
    expect(recipeOfHash('#/me/alltag/kochen')).toBe('');
    expect(prefsOf(null)).toEqual({ hidden: [] });
    expect(prefsOf({ hidden: ['a', 3] })).toEqual({ hidden: ['a'] });
  });
});
