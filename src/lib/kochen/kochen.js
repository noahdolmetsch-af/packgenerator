/**
 * «Kochen» (Noah 28.10.2026 «1b 2a 3a 4a 5a»): the pure part of Ich › Alltag › Kochen. The app's own
 * recipes (rezepte.js) and the person's own recipes of Freie Zeit (collections of type «recipes») in one
 * list, a filter by meal, portions, and the lines for the shopping list. No database and no clock here
 * (tests/kochen.test.js).
 */
import { RECIPES, MEALS, scaled } from './rezepte.js';

export const PREFS_KEY = 'kochen.prefs';
export const KOCHEN_HASH = '#/me/alltag/kochen';
export const OWN = 'own:';

/** The filters of the list, in this order. */
export const FILTERS = [{ key: 'all', label: 'All' }, ...MEALS, { key: 'own', label: 'My recipes' }];

/** The saved choices: { hidden: [recipe ids] }. */
export const prefsOf = (v) => ({ hidden: Array.isArray(v?.hidden) ? v.hidden.filter((x) => typeof x === 'string') : [] });

/** «#/me/alltag/kochen/pasta-tuna» → 'pasta-tuna'; the list → ''. */
export function recipeOfHash(hash) {
  const m = /^#\/me\/alltag\/kochen\/([^?]+)/.exec(String(hash ?? ''));
  if (!m) return '';
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return '';
  }
}
export const recipeHref = (id) => `${KOCHEN_HASH}/${encodeURIComponent(id)}`;

/**
 * The own recipes of Freie Zeit as recipes of this page: entries whose collection is of type «recipes».
 * → [{ id 'own:<entry id>', own: true, title, lines [ingredient lines], steps [{ text }], coll }]
 */
export function ownRecipes(entries = [], colls = []) {
  const ids = new Set(colls.filter((c) => c?.type === 'recipes' && !c.hidden).map((c) => c.id));
  return entries
    .filter((e) => e && ids.has(e.coll) && String(e.title ?? '').trim())
    .map((e) => ({
      id: `${OWN}${e.id}`,
      own: true,
      entryId: e.id,
      coll: e.coll,
      title: String(e.title).trim(),
      lines: (Array.isArray(e.data?.ingredients) ? e.data.ingredients : []).map((x) => String(x).trim()).filter(Boolean),
      steps: String(e.data?.steps ?? '')
        .split(/\r?\n/)
        .map((s) => s.replace(/^\s*(\d+[.)]|[-•*])\s*/, '').trim())
        .filter(Boolean)
        .map((text) => ({ text })),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** The list for a filter: the app's recipes (without the hidden ones) and, for «all» and «own», the own ones. */
export function listFor(filter = 'all', { hidden = [], own = [] } = {}) {
  const off = new Set(hidden);
  const app = RECIPES.filter((x) => !off.has(x.id));
  if (filter === 'own') return own;
  if (filter === 'all') return [...app, ...own];
  return app.filter((x) => x.meals.includes(filter));
}

/** The hidden recipes of the app, in their order. */
export const hiddenRecipes = (hidden = []) => RECIPES.filter((x) => hidden.includes(x.id));

/** A recipe by id: the app's or an own one. */
export function findRecipe(id, own = []) {
  if (!id) return null;
  if (id.startsWith(OWN)) return own.find((x) => x.id === id) ?? null;
  return RECIPES.find((x) => x.id === id) ?? null;
}

/** 0.5 → «½», 1.5 → «1½», 100 → «100». */
export function fmtAmount(n) {
  const whole = Math.floor(n);
  const half = Math.abs(n - whole - 0.5) < 1e-9;
  if (half) return whole ? `${whole}½` : '½';
  return String(n);
}

/**
 * The ingredients for `portions`, as rows to show: [{ name, amount ('½', '100'), unit }]; tr translates
 * the English words (t). Own recipes keep their lines as they are.
 */
export function ingredientRows(recipe, portions = 1, tr = (s) => s) {
  if (!recipe) return [];
  if (recipe.own) return recipe.lines.map((name) => ({ name, amount: '', unit: '' }));
  return recipe.ingredients.map((ing) => {
    const s = scaled(ing, portions);
    return { name: tr(s.name), amount: fmtAmount(s.amount), unit: tr(UNIT_WORD[s.unit] ?? s.unit) };
  });
}
// the English unit words (keys of rezepte.js UNITS)
const UNIT_WORD = { g: 'g', ml: 'ml', pc: 'piece', pcs: 'pieces', tbsp: 'tbsp', tsp: 'tsp', slice: 'slice', slices: 'slices', can: 'can', cans: 'cans', pinch: 'pinch', handful: 'handful', handfuls: 'handfuls', pack: 'pack', packs: 'packs' };

/** The lines for the shopping list, in the person's language: «Banane, 1 Stück». */
export function shoppingLines(recipe, portions = 1, tr = (s) => s) {
  return ingredientRows(recipe, portions, tr).map((r) => (r.amount ? `${r.name}, ${r.amount} ${r.unit}` : r.name));
}

/** The meals a recipe is for, as their English labels. */
export const mealLabels = (recipe) => (recipe?.meals ?? []).map((k) => MEALS.find((m) => m.key === k)?.label).filter(Boolean);
