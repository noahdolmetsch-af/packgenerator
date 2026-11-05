/**
 * «Erfolgsrezepte» (Noah 04.11.2026, Persönliches Lernen Idee 5, Runde 1 «5a»): after a tour that went well you
 * keep what worked as a recipe: breakfast, start time, food on the way, pace. A recipe belongs next to the templates
 * (Templates › Recipes); in Planen you can look one up for the next trip. Nothing is saved by itself and nothing is
 * advised: a recipe says what you wrote, the app never says why it worked.
 *
 * Recipes live in the settings table (key RECIPES_KEY), so backups include them; a trip may carry `recipeId`.
 * Pure (no database, no clock). Tested in tests/rezept.test.js.
 */
export const RECIPES_KEY = 'recipes';
export const RECIPE_ID_FIELD = 'recipeId';
export const TEXT_MAX = 120;
export const NAME_MAX = 60;
/** The four things a recipe keeps, in the order they are shown; labels are English keys for t(). */
export const PARTS = [
  { key: 'breakfast', label: 'Breakfast', hint: 'e.g. porridge with banana, two coffees' },
  { key: 'start', label: 'Start time', hint: 'e.g. 07:30' },
  { key: 'food', label: 'Food on the way', hint: 'e.g. a bar every hour, a proper lunch' },
  { key: 'pace', label: 'Pace', hint: 'e.g. 22 km/h on the flat, slow on the climbs' },
];

const clip = (v, n) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, n) : '');
/** «7:30» or «07:30» → «07:30»; anything else → ''. */
export function timeOf(v) {
  const m = /^(\d{1,2})[:.](\d{2})$/.exec(typeof v === 'string' ? v.trim() : '');
  if (!m) return '';
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h <= 23 && min <= 59 ? `${String(h).padStart(2, '0')}:${m[2]}` : '';
}

/** A recipe made whole: { id, name, tripId?, breakfast, start, food, pace, createdAt }, or null without a name or any part. */
export function cleanRecipe(r) {
  if (!r || typeof r !== 'object' || typeof r.id !== 'string' || !r.id) return null;
  const name = clip(r.name, NAME_MAX);
  const out = { id: r.id, name, breakfast: clip(r.breakfast, TEXT_MAX), start: timeOf(r.start), food: clip(r.food, TEXT_MAX), pace: clip(r.pace, TEXT_MAX), ...(typeof r.tripId === 'string' && r.tripId ? { tripId: r.tripId } : {}), createdAt: typeof r.createdAt === 'string' ? r.createdAt : '' };
  return name && PARTS.some((p) => out[p.key]) ? out : null;
}
export const recipesOf = (rec) => (Array.isArray(rec) ? rec.map(cleanRecipe).filter(Boolean) : []);

/** A new recipe from the form; the name falls back to the trip's name. null while there is nothing to keep. */
export const newRecipe = ({ id, name, trip = null, parts, now }) => cleanRecipe({ id, name: name || trip?.title || '', tripId: trip?.id, ...parts, createdAt: now });
export const addRecipe = (list, r) => (r ? [...recipesOf(list), r] : recipesOf(list));
/** Change a recipe; a change that would leave it empty is refused (the list stays). */
export function changeRecipe(list, id, patch) {
  const cur = recipesOf(list);
  return cur.map((r) => (r.id === id ? cleanRecipe({ ...r, ...patch }) ?? r : r));
}
export const removeRecipe = (list, id) => recipesOf(list).filter((r) => r.id !== id);
/** The recipe of a trip (by recipeId), or null. */
export const recipeOfTrip = (list, trip) => recipesOf(list).find((r) => r.id === trip?.[RECIPE_ID_FIELD]) ?? null;
/** The recipes made from a tour, newest first. */
export const fromTrip = (list, tripId) => recipesOf(list).filter((r) => r.tripId === tripId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
/** The filled parts of a recipe as [{ key, label, value }]. */
export const linesOf = (r) => PARTS.filter((p) => r?.[p.key]).map((p) => ({ key: p.key, label: p.label, value: r[p.key] }));
