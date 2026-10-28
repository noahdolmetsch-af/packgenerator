// «Kochen» (Noah 28.10.2026 «1b 2a 3a 4a 5a»): the app's own recipes and the pure part of Planen › Alltag › Kochen
import { describe, it, expect } from 'vitest';
import { RECIPES, MEALS, INGREDIENTS, DE, STD_GROUPS, scaled, roundAmount } from '../src/lib/kochen/rezepte.js';
import { listFor, ownRecipes, findRecipe, fmtAmount, ingredientRows, shoppingLines, recipeOfHash, recipeHref, prefsOf, hiddenRecipes, FILTERS, groupsOf, groupName, groupsOfRecipe, idsIn, setRecipeGroup, addGroup, renameGroup, deleteGroup, moveGroup, resetGroups } from '../src/lib/kochen/kochen.js';
import DEALL from '../src/lib/i18n/de/index.js';

describe('the recipes', () => {
  it('over 100 recipes with their own ids, every meal has at least 15', () => {
    expect(RECIPES.length).toBeGreaterThanOrEqual(100);
    expect(new Set(RECIPES.map((r) => r.id)).size).toBe(RECIPES.length);
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
    for (const g of STD_GROUPS) expect(DEALL[g.label], g.label).toBeTruthy();
  });
  it('the eleven groups of Noah, each with at least 4 recipes that exist', () => {
    expect(STD_GROUPS.map((g) => g.key)).toEqual(['meat', 'rice', 'dessert', 'shakes', 'power', 'protein', 'carbs', 'veggies', 'grill', 'brunch', 'fastfood']);
    const ids = new Set(RECIPES.map((r) => r.id));
    for (const g of STD_GROUPS) {
      expect(g.ids.length, g.key).toBeGreaterThanOrEqual(4);
      for (const id of g.ids) expect(ids.has(id), `${g.key} ${id}`).toBe(true);
    }
    // a meat recipe has meat in it, a veggie one has none
    const tagsOf = (id) => RECIPES.find((r) => r.id === id).ingredients.flatMap((i) => i.tags);
    for (const id of STD_GROUPS.find((g) => g.key === 'meat').ids) expect(tagsOf(id), id).toContain('meat');
    for (const id of STD_GROUPS.find((g) => g.key === 'veggies').ids) expect(tagsOf(id).some((x) => x === 'meat' || x === 'fish'), id).toBe(false);
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
    expect(listFor('all', { own }).length).toBe(RECIPES.length + 1);
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
    expect(prefsOf(null)).toEqual({ hidden: [], groups: null, member: {} });
    expect(prefsOf({ hidden: ['a', 3], member: { x: ['meat', 2] } })).toEqual({ hidden: ['a'], groups: null, member: { x: ['meat'] } });
  });
});

describe('the groups (Gruppen überall)', () => {
  const p0 = prefsOf(null);
  it('the standard groups, a group filter, in and out of a group', () => {
    expect(groupsOf(p0).map((g) => g.id)).toEqual(STD_GROUPS.map((g) => g.key));
    expect(groupName(groupsOf(p0)[0], (s) => `[${s}]`)).toBe('[Meat]');
    expect(listFor('g:grill', { prefs: p0 }).map((r) => r.id)).toEqual(STD_GROUPS.find((g) => g.key === 'grill').ids.slice().sort((a, b) => RECIPES.findIndex((r) => r.id === a) - RECIPES.findIndex((r) => r.id === b)));
    const p1 = setRecipeGroup(p0, 'pasta-pesto', 'grill', true);
    expect(groupsOfRecipe(p1, 'pasta-pesto')).toContain('grill');
    expect(idsIn(p1, 'grill')).toContain('pasta-pesto');
    const p2 = setRecipeGroup(p1, 'pasta-pesto', 'carbs', false);
    expect(groupsOfRecipe(p2, 'pasta-pesto')).toEqual(['grill']);
    expect(groupsOfRecipe(setRecipeGroup(p0, 'own:e1', 'meat', true), 'own:e1')).toEqual(['meat']);
  });
  it('add, rename (empty = standard name), sort, delete with or without a target, reset', () => {
    let p = addGroup(p0, '  For guests ', 'kg-1');
    expect(groupsOf(p).at(-1)).toEqual({ id: 'kg-1', std: null, name: 'For guests', label: null });
    p = renameGroup(p, 'meat', 'Fleischiges');
    expect(groupName(groupsOf(p)[0])).toBe('Fleischiges');
    expect(groupName(groupsOf(renameGroup(p, 'meat', ''))[0])).toBe('Meat');
    p = moveGroup(p, 'kg-1', 0);
    expect(groupsOf(p)[0].id).toBe('kg-1');
    const grill = idsIn(p, 'grill');
    const moved = deleteGroup(p, 'grill', 'kg-1');
    expect(groupsOf(moved).some((g) => g.id === 'grill')).toBe(false);
    for (const id of grill) expect(groupsOfRecipe(moved, id)).toContain('kg-1');
    const gone = deleteGroup(p, 'grill', '');
    expect(listFor('all', { prefs: gone }).length).toBe(RECIPES.length); // the recipes stay
    expect(groupsOf(resetGroups(gone)).map((g) => g.id)).toEqual(STD_GROUPS.map((g) => g.key));
  });
});
