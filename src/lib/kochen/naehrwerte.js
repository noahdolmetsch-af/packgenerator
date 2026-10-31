/**
 * «Kochen» step 4 (Noah 28.10.2026 «4a»): approximate nutrition per portion (kcal, carbohydrates, protein,
 * fat) of every recipe, added up from its ingredients. The numbers per ingredient are rounded typical values
 * for the plain product (per 100 g or 100 ml, dry for pasta, rice, oats, lentils), written for the app by
 * hand, not copied from a database; so everything is shown as «about». No database and no clock here
 * (tests/naehrwerte.test.js checks every ingredient and unit of every recipe).
 */
import { RECIPES } from './rezepte.js';

/** key: [kcal, carbs g, protein g, fat g] per 100 g (or 100 ml), then the grams of one unit where it is not g/ml. */
const N = {
  oats: [370, 60, 13, 7, { tbsp: 10 }],
  milk: [64, 5, 3.3, 3.6, { tbsp: 15 }],
  banana: [90, 20, 1, 0.3, { pc: 120 }],
  honey: [305, 76, 0.3, 0, { tsp: 7, tbsp: 21 }],
  eggs: [143, 0.7, 12.6, 9.5, { pc: 55 }],
  bread: [250, 48, 8, 2, { slice: 40 }],
  butter: [740, 0, 0.7, 82, { tsp: 5, tbsp: 14 }],
  greekYogurt: [100, 4, 9, 5],
  berries: [45, 8, 0.8, 0.4, { handful: 60 }],
  muesli: [360, 64, 9, 6, { tbsp: 10 }],
  peanutButter: [600, 12, 25, 50, { tbsp: 16 }],
  apple: [52, 12, 0.3, 0.2, { pc: 150 }],
  cinnamon: [250, 55, 4, 1.2, { pinch: 0.5 }],
  cheeseSlices: [330, 1, 24, 25, { slice: 20 }],
  tomato: [18, 3, 0.9, 0.2, { pc: 100 }],
  avocado: [160, 2, 2, 15, { pc: 150 }],
  oil: [880, 0, 0, 99, { tsp: 4.5, tbsp: 14 }],
  quark: [70, 4, 12, 0.3],
  walnuts: [650, 7, 15, 65, { handful: 30, tbsp: 8 }],
  yogurt: [62, 5, 3.5, 3.3, { tbsp: 15 }],
  raisins: [300, 70, 3, 0.5, { tbsp: 10 }],
  cottage: [98, 3.4, 11, 4.3],
  cucumber: [14, 2.5, 0.7, 0.1, { pc: 300 }],
  gratedCheese: [380, 1, 26, 30],
  toast: [270, 50, 8, 3.5, { slice: 25 }],
  ham: [110, 1, 19, 3.5, { slice: 20 }],
  riceCakes: [380, 80, 8, 3, { pc: 9 }],
  creamCheese: [250, 3, 6, 23, { tbsp: 20 }],
  jam: [250, 60, 0.5, 0.1, { tbsp: 20 }],
  granola: [430, 64, 9, 15],
  mango: [60, 13, 0.8, 0.4, { handful: 60 }],
  coconutFlakes: [650, 6, 6, 64, { tbsp: 7 }],
  bacon: [450, 0.5, 14, 43],
  tortilla: [300, 50, 8, 7, { pc: 60 }],
  chickenSlices: [105, 1, 21, 2],
  lettuce: [15, 2, 1.4, 0.2, { handful: 40 }],
  tuna: [130, 0, 28, 1.5, { can: 112 }],
  corn: [80, 15, 3, 1.2],
  oliveOil: [884, 0, 0, 100, { tbsp: 14 }],
  couscous: [360, 72, 12, 1.8],
  cherryTomatoes: [18, 3, 0.9, 0.2, { pc: 15 }],
  feta: [260, 1, 15, 21],
  passata: [30, 5, 1.5, 0.3, { tbsp: 15 }],
  stock: [250, 25, 10, 12, { pc: 11 }],
  cream: [300, 3, 2.5, 31, { tbsp: 15 }],
  beans: [90, 12, 6, 0.5, { can: 240 }],
  olives: [150, 1, 1, 15, { handful: 30 }],
  pasta: [360, 72, 12, 1.5],
  miniMozzarella: [250, 1, 18, 19],
  pesto: [460, 4, 6, 46, { tbsp: 15 }],
  mozzarella: [250, 1, 18, 19, { pc: 125 }],
  hummus: [230, 12, 7, 17],
  carrots: [41, 8, 0.9, 0.2, { pc: 80 }],
  pita: [275, 55, 9, 1.2, { pc: 60 }],
  noodles: [360, 70, 10, 6, { pack: 85 }],
  spinach: [23, 1, 3, 0.4, { handful: 30 }],
  parmesan: [430, 0, 36, 30],
  croutons: [420, 70, 12, 10, { handful: 20 }],
  caesar: [300, 5, 1.5, 30, { tbsp: 15 }],
  potatoes: [77, 17, 2, 0.1],
  chives: [30, 1, 3, 0.7, { handful: 10 }],
  lentils: [350, 50, 25, 1.5],
  coconutMilk: [190, 3, 2, 19],
  curry: [325, 55, 14, 14, { tsp: 2 }],
  turkey: [105, 1, 21, 2, { slice: 20 }],
  onion: [40, 9, 1.1, 0.1, { pc: 100 }],
  vinegar: [20, 0.6, 0, 0, { tbsp: 15 }],
  falafel: [330, 32, 13, 17, { pc: 25 }],
  ricePouch: [140, 30, 3, 0.5, { pack: 125 }],
  mayo: [700, 2, 1, 77, { tbsp: 15 }],
  cervelat: [300, 1, 12, 28, { pc: 100 }],
  gherkins: [15, 2.5, 0.5, 0.2, { pc: 15 }],
  peas: [80, 12, 5, 0.4, { handful: 40 }],
  soy: [60, 5, 8, 0.1, { tbsp: 15 }],
  vegMix: [35, 5, 2, 0.4],
  chicken: [120, 0, 22, 3],
  spaghetti: [360, 72, 12, 1.5],
  garlic: [140, 28, 6, 0.5, { pc: 4 }],
  chili: [40, 7, 2, 0.4, { pinch: 0.5 }],
  choppedTomatoes: [20, 4, 1, 0.2, { can: 400 }],
  chiliSpice: [280, 50, 13, 14, { tsp: 3 }],
  gnocchi: [150, 32, 3.5, 0.5],
  roesti: [150, 17, 2, 8, { pack: 250 }],
  tortellini: [280, 45, 12, 6],
  chickpeas: [120, 18, 7, 2.5, { can: 240 }],
  curryPaste: [120, 12, 3, 7, { tbsp: 20 }],
  salmon: [200, 0, 20, 13, { pc: 120 }],
  broccoli: [34, 4, 3, 0.4],
  lemon: [30, 5, 1, 0.3, { pc: 80 }],
  mince: [250, 0, 18, 20],
  wokMix: [35, 5, 2, 0.4],
  paprika: [280, 50, 14, 13, { tsp: 3 }],
  polenta: [355, 75, 8, 1.5],
  chickenStrips: [110, 0, 22, 2],
  pepper: [28, 5, 1, 0.3, { pc: 150 }],
  sweetChili: [220, 52, 0.5, 0, { tbsp: 18 }],
  minuteSteaks: [130, 0, 22, 4],
  bratwurst: [300, 2, 12, 27, { pc: 130 }],
  herbButter: [700, 1, 1, 76, { tbsp: 14 }],
  greenBeans: [30, 4, 2, 0.2],
  risottoRice: [350, 78, 7, 0.7],
  smokedSalmon: [180, 0, 25, 9],
  chocolate: [540, 55, 6, 32],
  vanillaSugar: [390, 97, 0, 0, { tsp: 8 }],
  sugar: [400, 100, 0, 0, { tsp: 4, tbsp: 12 }],
  iceCream: [200, 24, 3.5, 10, { pc: 50 }],
  cocoa: [380, 10, 20, 22, { tbsp: 8 }],
  orangeJuice: [45, 10, 0.7, 0.2],
  skyr: [63, 4, 11, 0.2],
  quinoa: [360, 64, 14, 6],
  lentilsCan: [100, 14, 7, 0.6, { can: 240 }],
  sweetPotato: [86, 20, 1.6, 0.1, { pc: 200 }],
  flour: [350, 73, 10, 1],
  maple: [260, 67, 0, 0, { tbsp: 20 }],
  zucchini: [17, 3, 1.2, 0.3, { pc: 200 }],
  mustard: [70, 5, 4, 4, { tbsp: 15 }],
  halloumi: [320, 2, 22, 25, { pack: 125 }],
  cornCobs: [100, 20, 3, 1.5, { pc: 150 }],
  zopf: [300, 50, 9, 6, { slice: 50 }],
  croissants: [400, 45, 8, 21, { pc: 55 }],
  patties: [250, 0, 17, 20, { pc: 100 }],
  buns: [280, 50, 9, 4, { pc: 60 }],
  ketchup: [100, 25, 1.5, 0.1, { tbsp: 17 }],
  wienerli: [270, 2, 11, 25, { pc: 50 }],
  hotdogBuns: [280, 50, 9, 4, { pc: 55 }],
  nuggets: [250, 16, 13, 15, { pc: 20 }],
  fries: [150, 22, 2.5, 6],
  kebabMeat: [200, 3, 18, 13],
};

// «pcs» is «pc», «slices» is «slice» and so on; g and ml count one gram each
const BASE = { g: 'g', ml: 'g', pc: 'pc', pcs: 'pc', slice: 'slice', slices: 'slice', can: 'can', cans: 'can', pinch: 'pinch', handful: 'handful', handfuls: 'handful', pack: 'pack', packs: 'pack', tbsp: 'tbsp', tsp: 'tsp' };

/** The grams of `amount` of an ingredient in `unit`, or null when the table does not know it. */
export function gramsOf(key, amount, unit) {
  const row = N[key];
  const base = BASE[unit];
  if (!row || !base) return null;
  if (base === 'g') return amount;
  const per = row[4]?.[base];
  return per == null ? null : per * amount;
}

/** The ingredient keys the table knows (for the test). */
export const NUTRIENT_KEYS = Object.keys(N);

/**
 * The nutrition of a recipe PER PORTION: { kcal (to 5), carbs, protein, fat (grams, whole numbers) }, or null
 * for an own recipe (it has no amounts) or when an ingredient is missing from the table.
 */
export function nutritionOf(recipe) {
  if (!recipe || recipe.own || !recipe.ingredients?.length) return null;
  let kcal = 0;
  let carbs = 0;
  let protein = 0;
  let fat = 0;
  for (const i of recipe.ingredients) {
    const g = gramsOf(i.key, i.amount, i.unit);
    if (g == null) return null;
    const [k, c, p, f] = N[i.key];
    kcal += (k * g) / 100;
    carbs += (c * g) / 100;
    protein += (p * g) / 100;
    fat += (f * g) / 100;
  }
  return { kcal: Math.round(kcal / 5) * 5, carbs: Math.round(carbs), protein: Math.round(protein), fat: Math.round(fat) };
}

/** Per recipe id, for the lists (computed once). */
const CACHE = new Map();
export function nutritionById(id) {
  if (!CACHE.has(id)) CACHE.set(id, nutritionOf(RECIPES.find((r) => r.id === id)));
  return CACHE.get(id);
}
