/**
 * Mini-Tools «Essen und Unverträglichkeiten» (Noah 28.10.2026, idea 7): before a group trip or a hut evening ask
 * who eats what: diets, allergies, how hungry. The app counts it and turns a menu into a shopping list with the
 * right swaps (gluten-free pasta, oat drink …). Pure, tested in tests/mini-essen.test.js.
 * All names are English keys for t().
 */
export const KIND_FOOD = 'food';
/** The diets people can tick. */
export const DIETS = [
  { key: 'veg', label: 'Vegetarian' },
  { key: 'vegan', label: 'Vegan' },
  { key: 'gf', label: 'Gluten-free' },
  { key: 'lf', label: 'Lactose-free' },
  { key: 'nuts', label: 'No nuts' },
  { key: 'pork', label: 'No pork' },
  { key: 'fish', label: 'No fish' },
];
const DIET_KEYS = new Set(DIETS.map((d) => d.key));
/** How hungry: a factor for the amounts. */
export const SIZES = [
  { key: 's', label: 'Small portion', f: 0.75 },
  { key: 'm', label: 'Normal portion', f: 1 },
  { key: 'l', label: 'Big portion', f: 1.35 },
];
const SIZE_F = Object.fromEntries(SIZES.map((s) => [s.key, s.f]));
export const PEOPLE_MAX = 6;

/**
 * Menus: per normal portion. alt: swaps, the first that fits one of the person's diets wins
 * (vegan also counts as vegetarian and lactose-free).
 */
export const MENUS = [
  {
    key: 'pasta',
    label: 'Pasta evening',
    items: [
      { name: 'Pasta', q: 125, unit: 'g', alt: [{ when: ['gf'], name: 'Gluten-free pasta' }] },
      { name: 'Tomato sauce', q: 100, unit: 'g' },
      { name: 'Grated cheese', q: 20, unit: 'g', alt: [{ when: ['vegan'], name: 'Yeast flakes', q: 5 }, { when: ['lf'], name: 'Lactose-free grated cheese' }] },
      { name: 'Salad', q: 60, unit: 'g' },
      { name: 'Bread', q: 60, unit: 'g', alt: [{ when: ['gf'], name: 'Gluten-free bread' }] },
    ],
  },
  {
    key: 'grill',
    label: 'Barbecue',
    items: [
      { name: 'Sausages', q: 2, unit: 'pcs', alt: [{ when: ['veg', 'vegan'], name: 'Vegetable skewers' }, { when: ['pork'], name: 'Chicken sausages' }] },
      { name: 'Potato salad', q: 150, unit: 'g', alt: [{ when: ['vegan'], name: 'Potato salad without mayonnaise' }] },
      { name: 'Grill vegetables', q: 150, unit: 'g' },
      { name: 'Bread', q: 80, unit: 'g', alt: [{ when: ['gf'], name: 'Gluten-free bread' }] },
    ],
  },
  {
    key: 'breakfast',
    label: 'Breakfast',
    items: [
      { name: 'Bread', q: 100, unit: 'g', alt: [{ when: ['gf'], name: 'Gluten-free bread' }] },
      { name: 'Butter', q: 15, unit: 'g', alt: [{ when: ['vegan', 'lf'], name: 'Margarine' }] },
      { name: 'Jam', q: 30, unit: 'g' },
      { name: 'Cheese', q: 40, unit: 'g', alt: [{ when: ['vegan'], name: 'Vegan spread' }, { when: ['lf'], name: 'Lactose-free cheese' }] },
      { name: 'Muesli', q: 60, unit: 'g', alt: [{ when: ['gf'], name: 'Gluten-free muesli' }, { when: ['nuts'], name: 'Muesli without nuts' }] },
      { name: 'Milk', q: 2, unit: 'dl', alt: [{ when: ['vegan', 'lf'], name: 'Oat drink' }] },
    ],
  },
];

const clip = (s, max) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
export const cleanName = (s) => clip(s, 40);
const isDay = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);

/** The question as sealed into the link → object, or null (no title). */
export function foodQuestion({ title, note = '', by = '', day = '' }) {
  const out = { v: 1, kind: KIND_FOOD, title: clip(title, 80), note: clip(note, 200), by: cleanName(by), day: isDay(day) ? day : '' };
  return out.title ? out : null;
}
export function readFood(obj) {
  if (!obj || obj.kind !== KIND_FOOD || typeof obj.pk !== 'string') return null;
  const q = foodQuestion(obj);
  return q ? { ...q, pk: obj.pk } : null;
}

/** One answer: { name, diets: [keys], other: allergies in words, size: s|m|l, n: people 1–6 }. */
export function cleanFoodAnswer({ name = '', diets = [], other = '', size = 'm', n = 1 }) {
  const d = [...new Set((Array.isArray(diets) ? diets : []).filter((k) => DIET_KEYS.has(k)))];
  if (d.includes('vegan') && !d.includes('veg')) d.unshift('veg');
  const people = Math.min(PEOPLE_MAX, Math.max(1, Math.round(Number(n)) || 1));
  return { name: cleanName(name), diets: DIETS.map((x) => x.key).filter((k) => d.includes(k)), other: clip(other, 160), size: SIZE_F[size] ? size : 'm', n: people };
}

/** rows → { people, diets: { key: people }, notes: [{ name, other }] }. */
export function countFood(rows) {
  const diets = Object.fromEntries(DIETS.map((d) => [d.key, 0]));
  let people = 0;
  const notes = [];
  for (const r of rows) {
    const n = Math.max(1, Number(r.n) || 1);
    people += n;
    for (const k of r.diets ?? []) if (k in diets) diets[k] += n;
    if (r.other) notes.push({ name: r.name, other: r.other });
  }
  return { people, diets, notes };
}

/** The item a person with these diets gets: { name, q } (vegan counts as vegetarian and lactose-free). */
export function itemFor(item, diets) {
  const set = new Set(diets);
  if (set.has('vegan')) set.add('veg').add('lf');
  const alt = (item.alt ?? []).find((a) => a.when.some((w) => set.has(w)));
  return { name: alt?.name ?? item.name, q: alt?.q ?? item.q };
}

const roundUp = (q, unit) => {
  if (unit === 'g') return q > 200 ? Math.ceil(q / 50) * 50 : Math.ceil(q / 10) * 10;
  return Math.ceil(q);
};

/** A menu for all rows → [{ name, q, unit }] (same name added up, rounded up, base items first). */
export function shoppingList(menu, rows) {
  const sum = new Map();
  for (const item of menu.items) {
    for (const r of rows) {
      const f = (SIZE_F[r.size] ?? 1) * Math.max(1, Number(r.n) || 1);
      const x = itemFor(item, r.diets ?? []);
      const k = `${x.name}|${item.unit}`;
      sum.set(k, { name: x.name, unit: item.unit, q: (sum.get(k)?.q ?? 0) + x.q * f });
    }
  }
  return [...sum.values()].map((x) => ({ ...x, q: roundUp(x.q, x.unit) }));
}

/** The shopping list as text. T: the app's t(). */
export const shoppingText = (title, list, T) => [title, ...list.map((x) => `- ${x.q} ${T(x.unit)} ${T(x.name)}`)].join('\n');
