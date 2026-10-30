/**
 * «Kochen» step 3 (Noah 28.10.2026 «3a», «4a»): one tip per meal and day, «Another suggestion», «Like it»,
 * «Never show again», and the short start (what you don't eat, the longest time you want to cook). A recipe
 * comes again only when all the other fitting ones have been suggested. Pure: no database, no clock (the
 * day comes in as 'YYYY-MM-DD'; tests/kochtipps.test.js).
 */
import { RECIPES, MEALS } from './rezepte.js';
import { prefsOf } from './kochen.js';

/** What a person may not eat: the tags of the ingredients (rezepte.js), in this order. */
export const TASTE_TAGS = [
  { tag: 'fish', label: 'Fish' },
  { tag: 'meat', label: 'Meat' },
  { tag: 'dairy', label: 'Milk' },
  { tag: 'egg', label: 'Egg' },
  { tag: 'nuts', label: 'Nuts' },
  { tag: 'gluten', label: 'Gluten' },
  { tag: 'spicy', label: 'Spicy' },
];
/** The longest cooking times to choose from (0 = no limit). */
export const MAX_MINUTES = [10, 20, 30];

/** Does the recipe fit the person's taste? (no tag they don't eat, not longer than their limit) */
export function fits(recipe, prefs) {
  const p = prefsOf(prefs);
  if (p.maxMin && recipe.min > p.maxMin) return false;
  return !recipe.ingredients.some((i) => i.tags.some((t) => p.dislikes.includes(t)));
}
/** The recipes that may be suggested for a meal. */
export const candidates = (meal, prefs, recipes = RECIPES) => {
  const p = prefsOf(prefs);
  return recipes.filter((r) => r.meals.includes(meal) && !p.hidden.includes(r.id) && fits(r, p));
};

// a small fixed hash, so the same day gives the same tip on every device
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** One new pick for `meal`: not yet seen, liked ones first; when all were seen, the round starts again. → prefs */
export function pickMeal(prefs, meal, day, recipes = RECIPES) {
  const p = prefsOf(prefs);
  const all = candidates(meal, p, recipes);
  const cur = p.tips.pick[meal];
  let seen = p.tips.seen[meal];
  let pool = all.filter((r) => !seen.includes(r.id) && r.id !== cur);
  if (!pool.length) {
    seen = [];
    pool = all.filter((r) => r.id !== cur);
    if (!pool.length) pool = all; // only one recipe fits: it stays
  }
  if (!pool.length) {
    const { [meal]: _, ...rest } = p.tips.pick;
    return { ...p, tips: { ...p.tips, day, pick: rest, seen: { ...p.tips.seen, [meal]: [] } } };
  }
  const liked = pool.filter((r) => p.liked.includes(r.id));
  const from = liked.length ? liked : pool;
  const r = from[hash(`${day}|${meal}|${seen.length}|${cur ?? ''}`) % from.length];
  return { ...p, tips: { ...p.tips, day, pick: { ...p.tips.pick, [meal]: r.id }, seen: { ...p.tips.seen, [meal]: [...new Set([...seen, r.id])] } } };
}

/**
 * Makes sure there is a fitting tip for every meal today: a new day gets new picks; a pick that was hidden or
 * no longer fits (new taste) is replaced. Returns the same object when nothing changes.
 */
export function ensureTips(prefs, day, recipes = RECIPES) {
  let p = prefsOf(prefs);
  const newDay = p.tips.day !== day;
  let changed = false;
  for (const m of MEALS) {
    const cur = p.tips.pick[m.key];
    const ok = !newDay && cur && candidates(m.key, p, recipes).some((r) => r.id === cur);
    if (ok) continue;
    const q = pickMeal(newDay ? { ...p, tips: { ...p.tips, pick: { ...p.tips.pick, [m.key]: undefined } } } : p, m.key, day, recipes);
    p = q;
    changed = true;
  }
  if (!changed && !newDay) return prefs;
  return { ...p, tips: { ...p.tips, day } };
}

/** «Like it» on or off. → prefs */
export function toggleLike(prefs, id) {
  const p = prefsOf(prefs);
  return { ...p, liked: p.liked.includes(id) ? p.liked.filter((x) => x !== id) : [...p.liked, id] };
}
/** «What you don't eat»: a tag on or off. → prefs */
export function toggleDislike(prefs, tag) {
  const p = prefsOf(prefs);
  return { ...p, dislikes: p.dislikes.includes(tag) ? p.dislikes.filter((x) => x !== tag) : [...p.dislikes, tag] };
}
/** The longest cooking time (0 = no limit). → prefs */
export const setMaxMin = (prefs, min) => ({ ...prefsOf(prefs), maxMin: Math.max(0, Math.round(Number(min) || 0)) });
/** The short start was answered or skipped. → prefs */
export const markAsked = (prefs) => ({ ...prefsOf(prefs), asked: true });

/** The recipe of today's tip for a meal, or null. */
export const tipOf = (prefs, meal, recipes = RECIPES) => {
  const id = prefsOf(prefs).tips.pick[meal];
  return recipes.find((r) => r.id === id) ?? null;
};
/** How many recipes still fit the taste (for «nothing fits»). */
export const fitCount = (prefs, recipes = RECIPES) => recipes.filter((r) => fits(r, prefs)).length;
