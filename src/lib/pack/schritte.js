/**
 * «Packen in Schritten» (Warteliste 4; Noah 22.11.2026 «2a», «3a»): the packing list as one step after the other: Kleider, Schlafen,
 * Essen, Technik, Velo, Prüfen. The order is fixed at first and can be changed with arrows (kept in the settings); the view («Steps» or the
 * whole list by bags or categories) is kept too. Nothing is a new table: a step is a group of the list, the tick is the tick of the list.
 * Pure; CalmPack.svelte draws it. Tested in tests/pack-schritte.test.js.
 */

/** The steps, in the first order: key, name (English key for t()) and the categories of the list that belong to it. */
export const STEPS = [
  { key: 'clothes', name: 'Clothes', cats: ['onbike', 'rain', 'offbike', 'shoes'] },
  { key: 'sleep', name: 'Sleeping', cats: ['sleep', 'hyg'] },
  { key: 'food', name: 'Food and water', cats: ['food', 'cook'] },
  { key: 'tech', name: 'Tech and charging', cats: ['elec', 'light'] },
  { key: 'bike', name: 'Bike and repair', cats: ['tools', 'bike', 'bags'] },
  { key: 'check', name: 'Check', cats: ['docs', 'lux'] }, // and everything without a place above, also categories of your own
];
export const STEP = Object.fromEntries(STEPS.map((s) => [s.key, s]));
export const SETTING = 'pack.steps';

/** Which step a category belongs to: the one that names it, else «check» (an own category or none lands there, nothing is lost). */
export const stepOfCategory = (cat) => STEPS.find((s) => s.cats.includes(cat))?.key ?? 'check';

/** The stored choice { view: 'steps' | 'bags' | 'category', order: [step keys] }, anything unknown left out. */
export function cleanChoice(v) {
  const view = ['steps', 'bags', 'category'].includes(v?.view) ? v.view : null;
  const order = Array.isArray(v?.order) ? v.order.filter((k, n, a) => STEP[k] && a.indexOf(k) === n) : [];
  return { view, order };
}

/** The steps in the person's order; a step that is not in the order yet follows in the first order. */
export function orderedSteps(order = []) {
  const known = order.filter((k) => STEP[k]);
  return [...known, ...STEPS.map((s) => s.key).filter((k) => !known.includes(k))].map((k) => STEP[k]);
}

/**
 * One step up (dir -1) or down (+1) in the order; the order is complete after it. `visible`: the steps that show in this list: the step
 * swaps with the nearest shown one (a step with nothing in it is no neighbour you can see).
 */
export function moveStep(order, key, dir, visible = null) {
  const keys = orderedSteps(order).map((s) => s.key);
  const i = keys.indexOf(key);
  let j = i + dir;
  while (visible && j >= 0 && j < keys.length && !visible.includes(keys[j])) j += dir;
  if (i < 0 || j < 0 || j >= keys.length) return keys;
  [keys[i], keys[j]] = [keys[j], keys[i]];
  return keys;
}

/** Which view a list opens in: the remembered one, else Steps for a list with nothing packed yet and the bags for one that is under way. */
export function viewOf(choice, entries = []) {
  if (choice?.view) return choice.view;
  return entries.some((e) => e.packed) ? 'bags' : 'steps';
}

/**
 * The step groups of a list in the shape of the other groups ({ key, zone: { name }, entries, step }): the steps with something in them,
 * in the order, with the entries (stats.zones[].entries) sorted into the step of their category.
 */
export function stepGroups(zones, items, order = []) {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const entries = zones.flatMap((z) => z.entries);
  return orderedSteps(order)
    .map((s) => ({ key: `step-${s.key}`, step: s.key, zone: { name: s.name }, entries: entries.filter((e) => stepOfCategory(byId[e.itemId]?.category) === s.key) }))
    .filter((g) => g.entries.length);
}

/** The group that comes after this one («Next: Food and water»), or null for the last one. */
export const nextGroup = (groups, key) => groups[groups.findIndex((g) => g.key === key) + 1] ?? null;
