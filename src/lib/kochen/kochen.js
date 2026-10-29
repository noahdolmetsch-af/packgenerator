/**
 * «Kochen» (Noah 28.10.2026 «1b 2a 3a 4a 5a»): the pure part of Ich › Alltag › Kochen. The app's own
 * recipes (rezepte.js) and the person's own recipes of Freie Zeit (collections of type «recipes») in one
 * list, a filter by meal, portions, and the lines for the shopping list. No database and no clock here
 * (tests/kochen.test.js).
 */
import { RECIPES, MEALS, STD_GROUPS, scaled } from './rezepte.js';

export const PREFS_KEY = 'kochen.prefs';
export const KOCHEN_HASH = '#/me/alltag/kochen';
export const OWN = 'own:';

/** The filters of the list, in this order. */
export const FILTERS = [{ key: 'all', label: 'All' }, ...MEALS, { key: 'own', label: 'My recipes' }];

/**
 * The saved choices: { hidden: [recipe ids], groups: null (the standard ones) | [{ id, std?, name? }],
 * member: { [recipe id]: [group ids] } (only recipes the person put in or out of a group) }.
 */
export function prefsOf(v) {
  const strs = (a) => (Array.isArray(a) ? a.filter((x) => typeof x === 'string') : []);
  const groups = Array.isArray(v?.groups) ? v.groups.filter((g) => g && typeof g.id === 'string' && (g.std || String(g.name ?? '').trim())) : null;
  const member = {};
  for (const [k, ids] of Object.entries(v?.member && typeof v.member === 'object' ? v.member : {})) member[k] = strs(ids);
  return { hidden: strs(v?.hidden), groups, member };
}

/* ---------- groups (Noah 28.10.2026: «sinnvolle gruppen erstellen», Gruppen überall) ---------- */

const STD = Object.fromEntries(STD_GROUPS.map((g) => [g.key, g]));

/** The groups in their order: [{ id, std (key or null), name (typed, or null), label (English standard name) }]. */
export function groupsOf(prefs) {
  const p = prefsOf(prefs);
  const list = p.groups ?? STD_GROUPS.map((g) => ({ id: g.key, std: g.key }));
  return list.filter((g) => !g.std || STD[g.std]).map((g) => ({ id: g.id, std: g.std ?? null, name: String(g.name ?? '').trim() || null, label: g.std ? STD[g.std].label : null }));
}
/** The name to show: the typed one as it is, a standard one translated by tr. */
export const groupName = (g, tr = (s) => s) => g.name ?? tr(g.label);

/** The groups a recipe is in (ids): the person's choice, else the standard ones. */
export function groupsOfRecipe(prefs, id) {
  const p = prefsOf(prefs);
  if (p.member[id]) return p.member[id];
  return STD_GROUPS.filter((g) => g.ids.includes(id)).map((g) => g.key);
}
/** The recipe ids in a group (app recipes and own ones). */
export function idsIn(prefs, gid, own = []) {
  return [...RECIPES, ...own].map((x) => x.id).filter((id) => groupsOfRecipe(prefs, id).includes(gid));
}

const listOf = (p) => groupsOf(p).map(({ id, std, name }) => ({ id, ...(std ? { std } : {}), ...(name ? { name } : {}) }));

/** Puts a recipe in a group or takes it out. → prefs */
export function setRecipeGroup(prefs, id, gid, on) {
  const p = prefsOf(prefs);
  const cur = groupsOfRecipe(p, id).filter((x) => x !== gid);
  return { ...p, member: { ...p.member, [id]: on ? [...cur, gid] : cur } };
}
/** A new own group at the end. → prefs */
export function addGroup(prefs, name, id) {
  const p = prefsOf(prefs);
  const v = String(name ?? '').trim().slice(0, 40);
  if (!v) return p;
  return { ...p, groups: [...listOf(p), { id, name: v }] };
}
/** A new name (empty = back to the standard name of a standard group). → prefs */
export function renameGroup(prefs, gid, name) {
  const p = prefsOf(prefs);
  const v = String(name ?? '').trim().slice(0, 40);
  return { ...p, groups: listOf(p).map((g) => (g.id === gid ? (v ? { ...g, name: v } : g.std ? { id: g.id, std: g.std } : g) : g)) };
}
/** Deletes a group; its recipes stay (in «All»), or go to the group `to` as well. → prefs */
export function deleteGroup(prefs, gid, to = '', own = []) {
  let p = prefsOf(prefs);
  if (to && to !== gid) for (const id of idsIn(p, gid, own)) p = setRecipeGroup(p, id, to, true);
  return { ...p, groups: listOf(p).filter((g) => g.id !== gid) };
}
/** Moves a group to place `to`. → prefs */
export function moveGroup(prefs, gid, to) {
  const p = prefsOf(prefs);
  const list = listOf(p);
  const from = list.findIndex((g) => g.id === gid);
  if (from < 0) return p;
  const [g] = list.splice(from, 1);
  list.splice(Math.max(0, Math.min(to, list.length)), 0, g);
  return { ...p, groups: list };
}
/** The standard groups again (own groups go; who is in which group stays). → prefs */
export const resetGroups = (prefs) => ({ ...prefsOf(prefs), groups: null });

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

/** «g:meat» → the group filter of group 'meat'. */
export const GROUP_FILTER = 'g:';

/**
 * The list for a filter: the app's recipes (without the hidden ones) and, for «all» and «own», the own
 * ones; «g:<id>» = the recipes of a group (own ones too).
 */
export function listFor(filter = 'all', { hidden = [], own = [], prefs = null } = {}) {
  const off = new Set(hidden);
  const app = RECIPES.filter((x) => !off.has(x.id));
  if (filter === 'own') return own;
  if (filter === 'all') return [...app, ...own];
  if (filter.startsWith(GROUP_FILTER)) {
    const ids = new Set(idsIn(prefs, filter.slice(GROUP_FILTER.length), own));
    return [...app, ...own].filter((x) => ids.has(x.id));
  }
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
