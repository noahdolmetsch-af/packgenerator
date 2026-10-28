/**
 * «Kochen» (Noah 28.10.2026 «1b 2a 3a 4a 5a», thread «Einfache Kochrezepte»): the app's own very simple
 * recipes. Written for this app (no copied texts): at most 6 ingredients and 20 minutes, things from a
 * normal Swiss supermarket. Salt, pepper and water are not on the ingredient lists.
 *
 * Each text is written as [English, German] once; RECIPES carries the English text (the app's source
 * language, shown with t()) and DE the German texts for i18n/de/kochen.js. No database here
 * (tests/kochen.test.js).
 *
 * Ingredient tags say what a person might not eat (for «What you don't eat», a later step):
 * meat, fish, dairy, egg, nuts, gluten, spicy.
 */

/* ---------- ingredients: [English, German, tags] ---------- */
const ING = {
  oats: ['Rolled oats', 'Haferflocken', ['gluten']],
  milk: ['Milk', 'Milch', ['dairy']],
  banana: ['Banana', 'Banane', []],
  honey: ['Honey', 'Honig', []],
  eggs: ['Eggs', 'Eier', ['egg']],
  bread: ['Bread', 'Brot', ['gluten']],
  toast: ['Toast bread', 'Toastbrot', ['gluten']],
  butter: ['Butter', 'Butter', ['dairy']],
  yogurt: ['Plain yogurt', 'Joghurt nature', ['dairy']],
  greekYogurt: ['Greek yogurt', 'Griechischer Joghurt', ['dairy']],
  berries: ['Frozen berries', 'Tiefkühl-Beeren', []],
  muesli: ['Muesli', 'Müesli', ['gluten', 'nuts']],
  granola: ['Granola', 'Knuspermüesli', ['gluten', 'nuts']],
  peanutButter: ['Peanut butter', 'Erdnussbutter', ['nuts']],
  apple: ['Apple', 'Apfel', []],
  cinnamon: ['Cinnamon', 'Zimt', []],
  cheeseSlices: ['Cheese slices', 'Käse in Scheiben', ['dairy']],
  gratedCheese: ['Grated cheese', 'Reibkäse', ['dairy']],
  tomato: ['Tomato', 'Tomate', []],
  cherryTomatoes: ['Cherry tomatoes', 'Cherrytomaten', []],
  avocado: ['Avocado', 'Avocado', []],
  quark: ['Quark', 'Quark', ['dairy']],
  walnuts: ['Walnuts', 'Baumnüsse', ['nuts']],
  raisins: ['Raisins', 'Rosinen', []],
  cottage: ['Cottage cheese', 'Hüttenkäse', ['dairy']],
  cucumber: ['Cucumber', 'Gurke', []],
  ham: ['Ham', 'Schinken', ['meat']],
  riceCakes: ['Rice cakes', 'Reiswaffeln', []],
  creamCheese: ['Cream cheese', 'Frischkäse', ['dairy']],
  jam: ['Jam', 'Konfitüre', []],
  mango: ['Frozen mango', 'Tiefkühl-Mango', []],
  coconutFlakes: ['Desiccated coconut', 'Kokosraspeln', []],
  bacon: ['Bacon strips', 'Speckstreifen', ['meat']],
  tortilla: ['Tortilla wraps', 'Tortilla-Fladen', ['gluten']],
  chickenSlices: ['Cooked chicken strips', 'Gekochte Pouletstreifen', ['meat']],
  lettuce: ['Mixed salad leaves', 'Blattsalat-Mischung', []],
  tuna: ['Tuna in water', 'Thon in Wasser', ['fish']],
  corn: ['Sweetcorn', 'Mais', []],
  oliveOil: ['Olive oil', 'Olivenöl', []],
  oil: ['Cooking oil', 'Bratöl', []],
  couscous: ['Couscous', 'Couscous', ['gluten']],
  feta: ['Feta', 'Feta', ['dairy']],
  passata: ['Passata', 'Passata', []],
  stock: ['Stock cube', 'Bouillonwürfel', []],
  cream: ['Cream', 'Rahm', ['dairy']],
  beans: ['Kidney beans', 'Kidneybohnen', []],
  olives: ['Black olives', 'Schwarze Oliven', []],
  pasta: ['Pasta (e.g. penne)', 'Teigwaren (z. B. Penne)', ['gluten']],
  spaghetti: ['Spaghetti', 'Spaghetti', ['gluten']],
  mozzarella: ['Mozzarella', 'Mozzarella', ['dairy']],
  miniMozzarella: ['Mini mozzarella', 'Mini-Mozzarella', ['dairy']],
  pesto: ['Basil pesto', 'Basilikum-Pesto', ['dairy', 'nuts']],
  hummus: ['Hummus', 'Hummus', []],
  carrots: ['Carrots', 'Rüebli', []],
  pita: ['Pita bread', 'Pitabrot', ['gluten']],
  noodles: ['Instant noodles', 'Instant-Nudeln', ['gluten']],
  spinach: ['Frozen leaf spinach', 'Tiefkühl-Blattspinat', []],
  parmesan: ['Parmesan', 'Parmesan', ['dairy']],
  croutons: ['Croutons', 'Croûtons', ['gluten']],
  caesar: ['Caesar dressing', 'Caesar-Sauce', ['dairy', 'egg']],
  potatoes: ['Small potatoes', 'Kleine Kartoffeln', []],
  chives: ['Chives', 'Schnittlauch', []],
  lentils: ['Red lentils', 'Rote Linsen', []],
  coconutMilk: ['Coconut milk', 'Kokosmilch', []],
  curryPaste: ['Curry paste', 'Currypaste', ['spicy']],
  curry: ['Curry powder', 'Currypulver', []],
  turkey: ['Turkey breast slices', 'Truthahnbrust in Scheiben', ['meat']],
  onion: ['Onion', 'Zwiebel', []],
  vinegar: ['Vinegar', 'Essig', []],
  falafel: ['Frozen falafel', 'Tiefkühl-Falafel', []],
  ricePouch: ['Cooked rice (pouch)', 'Fertigreis (Beutel)', []],
  mayo: ['Mayonnaise', 'Mayonnaise', ['egg']],
  cervelat: ['Cervelat', 'Cervelat', ['meat']],
  gherkins: ['Gherkins', 'Essiggurken', []],
  peas: ['Frozen peas', 'Tiefkühl-Erbsen', []],
  soy: ['Soy sauce', 'Sojasauce', ['gluten']],
  vegMix: ['Frozen vegetable mix', 'Tiefkühl-Gemüsemischung', []],
  wokMix: ['Frozen stir-fry vegetables', 'Tiefkühl-Wokgemüse', []],
  chicken: ['Chicken breast', 'Pouletbrust', ['meat']],
  chickenStrips: ['Chicken strips (raw)', 'Poulet-Geschnetzeltes', ['meat']],
  garlic: ['Garlic', 'Knoblauch', []],
  chili: ['Chili flakes', 'Chiliflocken', ['spicy']],
  choppedTomatoes: ['Chopped tomatoes (can)', 'Gehackte Tomaten (Dose)', []],
  chiliSpice: ['Chili spice mix', 'Chili-Gewürz', ['spicy']],
  gnocchi: ['Gnocchi', 'Gnocchi', ['gluten']],
  roesti: ['Rösti (pack)', 'Rösti (Packung)', []],
  tortellini: ['Tortellini', 'Tortellini', ['gluten', 'dairy']],
  chickpeas: ['Chickpeas (can)', 'Kichererbsen (Dose)', []],
  salmon: ['Salmon fillet', 'Lachsfilet', ['fish']],
  broccoli: ['Frozen broccoli', 'Tiefkühl-Brokkoli', []],
  lemon: ['Lemon', 'Zitrone', []],
  mince: ['Minced beef', 'Rindshackfleisch', ['meat']],
  paprika: ['Paprika powder', 'Paprikapulver', []],
  polenta: ['Quick polenta', 'Schnellkoch-Polenta', []],
  pepper: ['Red pepper', 'Rote Peperoni', []],
  sweetChili: ['Sweet chili sauce', 'Sweet-Chili-Sauce', ['spicy']],
};

/* ---------- units: [English, German] ---------- */
export const UNITS = {
  g: ['g', 'g'],
  ml: ['ml', 'ml'],
  pc: ['piece', 'Stück'],
  pcs: ['pieces', 'Stück'],
  tbsp: ['tbsp', 'EL'],
  tsp: ['tsp', 'TL'],
  slice: ['slice', 'Scheibe'],
  slices: ['slices', 'Scheiben'],
  can: ['can', 'Dose'],
  cans: ['cans', 'Dosen'],
  pinch: ['pinch', 'Prise'],
  handful: ['handful', 'Handvoll'],
  handfuls: ['handfuls', 'Handvoll'],
  pack: ['pack', 'Packung'],
  packs: ['packs', 'Packungen'],
};
/** Units with their own plural (piece → pieces). */
const PLURAL = { pc: 'pcs', slice: 'slices', can: 'cans', handful: 'handfuls', pack: 'packs' };

/** The meals of a day, in this order. */
export const MEALS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
];

/* ---------- the recipes ----------
 * r(id, meals, minutes, [title en, de], ingredients [[key, amount, unit]], steps [[en, de, minutes, timer?]])
 * A step with timer: true offers a timer of its minutes when cooking. */
const SRC = [];
const r = (id, meals, min, title, ing, steps) => SRC.push({ id, meals, min, title, ing, steps });

/* Breakfast */
r('overnight-oats', ['breakfast'], 5, ['Overnight oats with banana', 'Overnight Oats mit Banane'], [['oats', 50, 'g'], ['milk', 150, 'ml'], ['banana', 1, 'pc'], ['honey', 1, 'tsp']], [
  ['Put the oats and the milk in a jar or bowl and stir.', 'Haferflocken und Milch in ein Glas oder eine Schüssel geben und umrühren.', 1],
  ['Cover it and put it in the fridge overnight (or at least 1 hour).', 'Zudecken und über Nacht in den Kühlschrank stellen (oder mindestens 1 Stunde).', 1],
  ['In the morning, slice the banana on top.', 'Am Morgen die Banane in Scheiben darauf schneiden.', 2],
  ['Add the honey. Done.', 'Den Honig darüber geben. Fertig.', 1],
]);
r('scrambled-eggs', ['breakfast'], 7, ['Scrambled eggs on toast', 'Rührei auf Toast'], [['eggs', 2, 'pcs'], ['bread', 2, 'slices'], ['butter', 1, 'tsp']], [
  ['Crack the eggs into a bowl, add a pinch of salt and whisk with a fork.', 'Die Eier in eine Schüssel schlagen, eine Prise Salz dazu und mit einer Gabel verquirlen.', 1],
  ['Toast the bread.', 'Das Brot toasten.', 2],
  ['Melt the butter in a pan on medium heat.', 'Die Butter in einer Pfanne bei mittlerer Hitze schmelzen.', 1],
  ['Pour in the eggs and stir slowly until they are just set.', 'Die Eier hineingiessen und langsam rühren, bis sie gerade fest sind.', 3, true],
  ['Put the eggs on the toast. Done.', 'Das Rührei auf das Brot geben. Fertig.', 0],
]);
r('yogurt-berries', ['breakfast'], 3, ['Yogurt with berries and muesli', 'Joghurt mit Beeren und Müesli'], [['greekYogurt', 150, 'g'], ['berries', 1, 'handful'], ['muesli', 3, 'tbsp']], [
  ['Put the yogurt in a bowl.', 'Den Joghurt in eine Schale geben.', 1],
  ['Add the frozen berries; they thaw in a few minutes.', 'Die gefrorenen Beeren dazu geben; sie tauen in ein paar Minuten auf.', 1],
  ['Sprinkle the muesli on top. Done.', 'Das Müesli darüber streuen. Fertig.', 1],
]);
r('pb-banana-toast', ['breakfast'], 4, ['Peanut butter banana toast', 'Toast mit Erdnussbutter und Banane'], [['bread', 2, 'slices'], ['peanutButter', 2, 'tbsp'], ['banana', 1, 'pc']], [
  ['Toast the bread.', 'Das Brot toasten.', 2],
  ['Spread the peanut butter on it.', 'Die Erdnussbutter darauf streichen.', 1],
  ['Slice the banana on top. Done.', 'Die Banane in Scheiben darauf legen. Fertig.', 1],
]);
r('apple-porridge', ['breakfast'], 8, ['Porridge with apple and cinnamon', 'Porridge mit Apfel und Zimt'], [['oats', 50, 'g'], ['milk', 250, 'ml'], ['apple', 1, 'pc'], ['cinnamon', 1, 'pinch']], [
  ['Put the oats and the milk in a small pot.', 'Haferflocken und Milch in eine kleine Pfanne geben.', 1],
  ['Bring it to a boil, then cook on low heat and stir now and then.', 'Aufkochen, dann bei kleiner Hitze kochen und ab und zu rühren.', 5, true],
  ['Meanwhile cut the apple into small pieces.', 'Inzwischen den Apfel in kleine Stücke schneiden.', 2],
  ['Put the porridge in a bowl, add the apple and the cinnamon. Done.', 'Den Porridge in eine Schale geben, Apfel und Zimt darauf. Fertig.', 0],
]);
r('cheese-tomato-bread', ['breakfast', 'lunch'], 4, ['Bread with cheese and tomato', 'Brot mit Käse und Tomate'], [['bread', 2, 'slices'], ['cheeseSlices', 2, 'slices'], ['tomato', 1, 'pc']], [
  ['Put the cheese on the bread.', 'Den Käse auf das Brot legen.', 1],
  ['Slice the tomato and put it on top.', 'Die Tomate in Scheiben schneiden und darauf legen.', 2],
  ['A little salt and pepper. Done.', 'Wenig Salz und Pfeffer. Fertig.', 1],
]);
r('avocado-egg-toast', ['breakfast'], 8, ['Avocado toast with a fried egg', 'Avocado-Toast mit Spiegelei'], [['bread', 2, 'slices'], ['avocado', 1, 'pc'], ['eggs', 1, 'pc'], ['oil', 1, 'tsp']], [
  ['Toast the bread.', 'Das Brot toasten.', 2],
  ['Cut the avocado in half, take out the stone and mash it on the bread with a fork.', 'Die Avocado halbieren, den Stein entfernen und mit einer Gabel auf dem Brot zerdrücken.', 2],
  ['Heat the oil in a pan and fry the egg.', 'Das Öl in einer Pfanne erhitzen und das Ei darin braten.', 3, true],
  ['Put the egg on top, a little salt. Done.', 'Das Ei darauf legen, wenig Salz. Fertig.', 0],
]);
r('quark-honey', ['breakfast'], 3, ['Quark with apple, honey and walnuts', 'Quark mit Apfel, Honig und Baumnüssen'], [['quark', 150, 'g'], ['apple', 1, 'pc'], ['honey', 1, 'tbsp'], ['walnuts', 1, 'handful']], [
  ['Put the quark in a bowl and stir in a little milk or water so it gets creamy.', 'Den Quark in eine Schale geben und mit wenig Milch oder Wasser cremig rühren.', 1],
  ['Cut the apple into small pieces and add it.', 'Den Apfel in kleine Stücke schneiden und dazu geben.', 1],
  ['Honey and walnuts on top. Done.', 'Honig und Baumnüsse darüber. Fertig.', 1],
]);
r('banana-smoothie', ['breakfast'], 4, ['Banana smoothie', 'Bananen-Smoothie'], [['banana', 1, 'pc'], ['milk', 250, 'ml'], ['oats', 2, 'tbsp'], ['peanutButter', 1, 'tbsp']], [
  ['Peel the banana and break it into pieces.', 'Die Banane schälen und in Stücke brechen.', 1],
  ['Put everything in a blender or a tall cup.', 'Alles in einen Mixer oder einen hohen Becher geben.', 1],
  ['Blend until smooth. Done.', 'Fein pürieren. Fertig.', 2],
]);
r('bircher', ['breakfast'], 5, ['Quick Bircher muesli', 'Schnelles Birchermüesli'], [['oats', 50, 'g'], ['yogurt', 150, 'g'], ['milk', 50, 'ml'], ['apple', 1, 'pc'], ['raisins', 1, 'tbsp']], [
  ['Stir the oats with the yogurt and the milk.', 'Haferflocken mit Joghurt und Milch verrühren.', 1],
  ['Grate the apple into it with the peel (or cut it small).', 'Den Apfel mit Schale hinein raffeln (oder klein schneiden).', 2],
  ['Add the raisins and stir. Let it stand 2 minutes. Done.', 'Rosinen dazu und umrühren. 2 Minuten stehen lassen. Fertig.', 2, true],
]);
r('banana-pancakes', ['breakfast'], 12, ['Banana pancakes with three ingredients', 'Bananen-Pancakes aus drei Zutaten'], [['banana', 1, 'pc'], ['eggs', 2, 'pcs'], ['oats', 4, 'tbsp'], ['oil', 1, 'tsp']], [
  ['Mash the banana in a bowl with a fork.', 'Die Banane in einer Schüssel mit einer Gabel zerdrücken.', 2],
  ['Add the eggs and the oats and stir well.', 'Eier und Haferflocken dazu geben und gut verrühren.', 1],
  ['Heat the oil in a pan on medium heat.', 'Das Öl in einer Pfanne bei mittlerer Hitze erhitzen.', 1],
  ['Put small piles of batter in the pan and fry 2 minutes on each side.', 'Kleine Häufchen Teig in die Pfanne geben und pro Seite 2 Minuten braten.', 8, true],
]);
r('cottage-bread', ['breakfast', 'lunch'], 4, ['Bread with cottage cheese and cucumber', 'Brot mit Hüttenkäse und Gurke'], [['bread', 2, 'slices'], ['cottage', 100, 'g'], ['cucumber', 0.5, 'pc']], [
  ['Spread the cottage cheese on the bread.', 'Den Hüttenkäse auf das Brot streichen.', 1],
  ['Slice the cucumber thinly and put it on top.', 'Die Gurke in dünne Scheiben schneiden und darauf legen.', 2],
  ['Salt and pepper. Done.', 'Salz und Pfeffer. Fertig.', 1],
]);
r('cheese-omelette', ['breakfast', 'dinner'], 8, ['Cheese omelette', 'Käse-Omelette'], [['eggs', 3, 'pcs'], ['gratedCheese', 30, 'g'], ['butter', 1, 'tsp']], [
  ['Whisk the eggs with a pinch of salt.', 'Die Eier mit einer Prise Salz verquirlen.', 1],
  ['Melt the butter in a pan on medium heat and pour in the eggs.', 'Die Butter in einer Pfanne bei mittlerer Hitze schmelzen und die Eier hineingiessen.', 1],
  ['Let it set without stirring.', 'Ohne Rühren stocken lassen.', 3, true],
  ['Sprinkle the cheese on one half, fold the other half over it. Done.', 'Den Käse auf eine Hälfte streuen, die andere Hälfte darüber klappen. Fertig.', 1],
]);
r('ham-cheese-toast', ['breakfast', 'lunch'], 8, ['Ham and cheese toast', 'Schinken-Käse-Toast'], [['toast', 2, 'slices'], ['ham', 1, 'slice'], ['cheeseSlices', 2, 'slices'], ['butter', 1, 'tsp']], [
  ['Put the ham and the cheese between the two slices of toast.', 'Schinken und Käse zwischen die zwei Toastscheiben legen.', 1],
  ['Spread a little butter on the outside.', 'Aussen wenig Butter darauf streichen.', 1],
  ['Fry it in a pan 3 minutes on each side until the cheese melts.', 'In einer Pfanne pro Seite 3 Minuten braten, bis der Käse schmilzt.', 6, true],
]);
r('rice-cakes', ['breakfast'], 2, ['Rice cakes with cream cheese and jam', 'Reiswaffeln mit Frischkäse und Konfitüre'], [['riceCakes', 3, 'pcs'], ['creamCheese', 2, 'tbsp'], ['jam', 1, 'tbsp']], [
  ['Spread the cream cheese on the rice cakes.', 'Den Frischkäse auf die Reiswaffeln streichen.', 1],
  ['A little jam on top. Done.', 'Wenig Konfitüre darauf. Fertig.', 1],
]);
r('boiled-eggs', ['breakfast'], 10, ['Boiled eggs with buttered bread', 'Gekochte Eier mit Butterbrot'], [['eggs', 2, 'pcs'], ['bread', 2, 'slices'], ['butter', 1, 'tbsp']], [
  ['Bring water to a boil in a small pot.', 'In einer kleinen Pfanne Wasser aufkochen.', 3],
  ['Put the eggs in with a spoon and cook them 7 minutes.', 'Die Eier mit einem Löffel hineinlegen und 7 Minuten kochen.', 7, true],
  ['Meanwhile spread the butter on the bread.', 'Inzwischen die Butter auf das Brot streichen.', 1],
  ['Rinse the eggs with cold water and peel them. Done.', 'Die Eier kalt abschrecken und schälen. Fertig.', 1],
]);
r('granola-bowl', ['breakfast'], 2, ['Granola with milk and banana', 'Knuspermüesli mit Milch und Banane'], [['granola', 50, 'g'], ['milk', 200, 'ml'], ['banana', 1, 'pc']], [
  ['Put the granola in a bowl and pour the milk over it.', 'Das Knuspermüesli in eine Schale geben und die Milch darüber giessen.', 1],
  ['Slice the banana on top. Done.', 'Die Banane in Scheiben darauf schneiden. Fertig.', 1],
]);
r('mango-yogurt', ['breakfast'], 3, ['Yogurt with mango and coconut', 'Joghurt mit Mango und Kokos'], [['yogurt', 180, 'g'], ['mango', 1, 'handful'], ['coconutFlakes', 1, 'tbsp'], ['oats', 2, 'tbsp']], [
  ['Put the yogurt in a bowl.', 'Den Joghurt in eine Schale geben.', 1],
  ['Add the frozen mango; it thaws in a few minutes.', 'Die gefrorene Mango dazu geben; sie taut in ein paar Minuten auf.', 1],
  ['Oats and coconut on top. Done.', 'Haferflocken und Kokos darüber. Fertig.', 1],
]);
r('butter-jam', ['breakfast'], 2, ['Bread with butter and jam', 'Butterbrot mit Konfitüre'], [['bread', 2, 'slices'], ['butter', 1, 'tbsp'], ['jam', 2, 'tbsp']], [
  ['Spread the butter on the bread.', 'Die Butter auf das Brot streichen.', 1],
  ['Jam on top. Done.', 'Konfitüre darauf. Fertig.', 1],
]);
r('eggs-bacon', ['breakfast'], 8, ['Fried eggs with bacon', 'Spiegeleier mit Speck'], [['eggs', 2, 'pcs'], ['bacon', 50, 'g'], ['bread', 1, 'slice']], [
  ['Fry the bacon in a pan without oil until crisp.', 'Den Speck ohne Öl in einer Pfanne knusprig braten.', 3, true],
  ['Push it to the side and crack the eggs into the pan.', 'An den Rand schieben und die Eier in die Pfanne schlagen.', 1],
  ['Fry until the white is firm.', 'Braten, bis das Eiweiss fest ist.', 3, true],
  ['Serve with the bread. Done.', 'Mit dem Brot servieren. Fertig.', 0],
]);

/* Lunch */
r('chicken-wrap', ['lunch'], 10, ['Wrap with chicken and salad', 'Wrap mit Poulet und Salat'], [['tortilla', 2, 'pcs'], ['chickenSlices', 100, 'g'], ['lettuce', 1, 'handful'], ['tomato', 1, 'pc'], ['yogurt', 3, 'tbsp']], [
  ['Stir the yogurt with a pinch of salt and pepper: that is your sauce.', 'Den Joghurt mit einer Prise Salz und Pfeffer verrühren: das ist deine Sauce.', 1],
  ['Warm the wraps for 30 seconds in a dry pan.', 'Die Fladen 30 Sekunden in einer Pfanne ohne Öl wärmen.', 1],
  ['Slice the tomato.', 'Die Tomate in Scheiben schneiden.', 2],
  ['Spread the sauce on the wraps, add salad, tomato and chicken.', 'Die Sauce auf die Fladen streichen, Salat, Tomate und Poulet darauf.', 3],
  ['Fold in the sides and roll them up. Done.', 'Die Seiten einschlagen und aufrollen. Fertig.', 2],
]);
r('tuna-corn-salad', ['lunch'], 8, ['Tuna and sweetcorn salad', 'Thon-Mais-Salat'], [['tuna', 1, 'can'], ['corn', 140, 'g'], ['tomato', 1, 'pc'], ['cucumber', 0.5, 'pc'], ['oliveOil', 1, 'tbsp']], [
  ['Drain the tuna and the sweetcorn.', 'Thon und Mais abtropfen lassen.', 1],
  ['Cut the tomato and the cucumber into small pieces.', 'Tomate und Gurke in kleine Stücke schneiden.', 4],
  ['Mix everything in a bowl with the oil, salt and pepper. Done.', 'Alles in einer Schüssel mit Öl, Salz und Pfeffer mischen. Fertig.', 2],
]);
r('couscous-salad', ['lunch'], 12, ['Couscous salad with feta', 'Couscous-Salat mit Feta'], [['couscous', 70, 'g'], ['cucumber', 0.5, 'pc'], ['cherryTomatoes', 8, 'pcs'], ['feta', 50, 'g'], ['oliveOil', 1, 'tbsp']], [
  ['Put the couscous in a bowl with a pinch of salt and pour 100 ml boiling water over it.', 'Den Couscous mit einer Prise Salz in eine Schüssel geben und 100 ml kochendes Wasser darüber giessen.', 1],
  ['Cover and wait 5 minutes.', 'Zudecken und 5 Minuten warten.', 5, true],
  ['Meanwhile cut the cucumber and the tomatoes small and crumble the feta.', 'Inzwischen Gurke und Tomaten klein schneiden und den Feta zerbröseln.', 4],
  ['Fluff the couscous with a fork, mix in everything with the oil. Done.', 'Den Couscous mit einer Gabel auflockern, alles mit dem Öl darunter mischen. Fertig.', 2],
]);
r('tomato-soup', ['lunch', 'dinner'], 10, ['Quick tomato soup', 'Schnelle Tomatensuppe'], [['passata', 400, 'g'], ['stock', 0.5, 'pc'], ['cream', 3, 'tbsp'], ['bread', 2, 'slices']], [
  ['Put the passata, 100 ml water and the stock cube in a pot.', 'Passata, 100 ml Wasser und den Bouillonwürfel in eine Pfanne geben.', 1],
  ['Bring it to a boil and let it simmer.', 'Aufkochen und leise köcheln lassen.', 5, true],
  ['Stir in the cream, add pepper.', 'Den Rahm einrühren, pfeffern.', 1],
  ['Serve with the bread. Done.', 'Mit dem Brot servieren. Fertig.', 1],
]);
r('quesadilla', ['lunch', 'dinner'], 10, ['Quesadilla with beans and cheese', 'Quesadilla mit Bohnen und Käse'], [['tortilla', 2, 'pcs'], ['gratedCheese', 60, 'g'], ['beans', 100, 'g'], ['corn', 50, 'g']], [
  ['Rinse and drain the beans and the sweetcorn.', 'Bohnen und Mais abspülen und abtropfen lassen.', 1],
  ['Put a wrap in a dry pan, spread half the cheese, the beans and the corn on it.', 'Einen Fladen in eine Pfanne ohne Öl legen, die Hälfte des Käses, die Bohnen und den Mais darauf verteilen.', 2],
  ['Add the rest of the cheese and put the second wrap on top.', 'Den Rest des Käses darüber und den zweiten Fladen darauf legen.', 1],
  ['Fry on medium heat, 3 minutes on each side. Cut it like a cake. Done.', 'Bei mittlerer Hitze pro Seite 3 Minuten braten. Wie einen Kuchen schneiden. Fertig.', 6, true],
]);
r('greek-salad', ['lunch'], 8, ['Greek salad', 'Griechischer Salat'], [['tomato', 2, 'pcs'], ['cucumber', 0.5, 'pc'], ['feta', 80, 'g'], ['olives', 1, 'handful'], ['oliveOil', 1, 'tbsp'], ['bread', 1, 'slice']], [
  ['Cut the tomatoes and the cucumber into chunks.', 'Tomaten und Gurke in grobe Stücke schneiden.', 4],
  ['Add the olives and break the feta over it.', 'Die Oliven dazu geben und den Feta darüber brechen.', 1],
  ['Oil, salt and pepper on top. Eat it with the bread. Done.', 'Öl, Salz und Pfeffer darüber. Mit dem Brot essen. Fertig.', 1],
]);
r('pasta-salad', ['lunch'], 15, ['Pasta salad with pesto', 'Teigwarensalat mit Pesto'], [['pasta', 80, 'g'], ['cherryTomatoes', 8, 'pcs'], ['miniMozzarella', 60, 'g'], ['pesto', 2, 'tbsp']], [
  ['Cook the pasta in salted water as written on the pack.', 'Die Teigwaren in Salzwasser kochen, wie auf der Packung steht.', 10, true],
  ['Meanwhile cut the tomatoes in half.', 'Inzwischen die Tomaten halbieren.', 2],
  ['Drain the pasta and rinse it briefly with cold water.', 'Die Teigwaren abgiessen und kurz kalt abspülen.', 1],
  ['Mix with the pesto, the tomatoes and the mozzarella. Done.', 'Mit Pesto, Tomaten und Mozzarella mischen. Fertig.', 2],
]);
r('caprese', ['lunch'], 5, ['Tomato mozzarella with bread', 'Tomaten-Mozzarella mit Brot'], [['tomato', 2, 'pcs'], ['mozzarella', 1, 'pc'], ['oliveOil', 1, 'tbsp'], ['bread', 2, 'slices']], [
  ['Slice the tomatoes and the mozzarella.', 'Tomaten und Mozzarella in Scheiben schneiden.', 3],
  ['Lay them on a plate, one after the other.', 'Abwechselnd auf einen Teller legen.', 1],
  ['Oil, salt and pepper on top. Eat with the bread. Done.', 'Öl, Salz und Pfeffer darüber. Mit dem Brot essen. Fertig.', 1],
]);
r('hummus-plate', ['lunch'], 5, ['Hummus with vegetables and pita', 'Hummus mit Gemüse und Pita'], [['hummus', 100, 'g'], ['carrots', 2, 'pcs'], ['cucumber', 0.5, 'pc'], ['pita', 1, 'pc']], [
  ['Warm the pita in the toaster or a dry pan.', 'Das Pitabrot im Toaster oder in einer Pfanne ohne Öl wärmen.', 2],
  ['Peel the carrots and cut them and the cucumber into sticks.', 'Die Rüebli schälen und mit der Gurke in Stängel schneiden.', 3],
  ['Dip everything in the hummus. Done.', 'Alles in den Hummus tunken. Fertig.', 0],
]);
r('noodle-soup', ['lunch'], 8, ['Noodle soup with egg and spinach', 'Nudelsuppe mit Ei und Spinat'], [['noodles', 1, 'pack'], ['eggs', 1, 'pc'], ['spinach', 1, 'handful']], [
  ['Bring the water to a boil as written on the noodle pack.', 'Das Wasser aufkochen, wie auf der Nudelpackung steht.', 3],
  ['Add the noodles, the spice and the frozen spinach.', 'Nudeln, Gewürz und den gefrorenen Spinat dazu geben.', 1],
  ['Crack the egg into the soup and let it cook without stirring.', 'Das Ei in die Suppe schlagen und ohne Rühren garen lassen.', 3, true],
  ['Pour into a bowl. Done.', 'In eine Schale giessen. Fertig.', 1],
]);
r('caesar-salad', ['lunch'], 8, ['Quick Caesar salad', 'Schneller Caesar Salad'], [['lettuce', 2, 'handfuls'], ['chickenSlices', 100, 'g'], ['parmesan', 20, 'g'], ['croutons', 1, 'handful'], ['caesar', 2, 'tbsp']], [
  ['Put the salad leaves in a bowl.', 'Den Salat in eine Schüssel geben.', 1],
  ['Add the chicken and the dressing and mix.', 'Poulet und Sauce dazu geben und mischen.', 2],
  ['Croutons on top and grate or shave the parmesan over it. Done.', 'Croûtons darüber und den Parmesan darüber reiben oder hobeln. Fertig.', 2],
]);
r('potatoes-quark', ['lunch', 'dinner'], 18, ['Potatoes with herb quark', 'Kartoffeln mit Kräuterquark'], [['potatoes', 300, 'g'], ['quark', 150, 'g'], ['chives', 1, 'handful']], [
  ['Wash the potatoes and cook them in salted water.', 'Die Kartoffeln waschen und in Salzwasser kochen.', 15, true],
  ['Meanwhile cut the chives and stir them into the quark with salt and pepper.', 'Inzwischen den Schnittlauch schneiden und mit Salz und Pfeffer unter den Quark rühren.', 3],
  ['Drain the potatoes. Eat them with the quark. Done.', 'Die Kartoffeln abgiessen. Mit dem Quark essen. Fertig.', 1],
]);
r('lentil-soup', ['lunch', 'dinner'], 20, ['Red lentil soup', 'Rote Linsensuppe'], [['lentils', 80, 'g'], ['coconutMilk', 200, 'ml'], ['stock', 1, 'pc'], ['curry', 1, 'tsp']], [
  ['Rinse the lentils in a sieve.', 'Die Linsen in einem Sieb abspülen.', 1],
  ['Put them in a pot with 300 ml water, the stock cube and the curry.', 'Mit 300 ml Wasser, dem Bouillonwürfel und dem Curry in eine Pfanne geben.', 1],
  ['Bring it to a boil and cook on low heat until the lentils are soft.', 'Aufkochen und bei kleiner Hitze kochen, bis die Linsen weich sind.', 15, true],
  ['Stir in the coconut milk and warm it briefly. Done.', 'Die Kokosmilch einrühren und kurz erwärmen. Fertig.', 2],
]);
r('turkey-sandwich', ['lunch'], 5, ['Turkey sandwich', 'Truthahn-Sandwich'], [['bread', 2, 'slices'], ['creamCheese', 2, 'tbsp'], ['turkey', 3, 'slices'], ['lettuce', 1, 'handful'], ['tomato', 1, 'pc']], [
  ['Spread the cream cheese on both slices.', 'Den Frischkäse auf beide Scheiben streichen.', 1],
  ['Slice the tomato.', 'Die Tomate in Scheiben schneiden.', 2],
  ['Put turkey, salad and tomato on one slice, the other on top. Done.', 'Truthahn, Salat und Tomate auf eine Scheibe, die andere darauf. Fertig.', 2],
]);
r('bean-salad', ['lunch'], 8, ['Bean and sweetcorn salad', 'Bohnen-Mais-Salat'], [['beans', 1, 'can'], ['corn', 140, 'g'], ['onion', 0.5, 'pc'], ['oliveOil', 1, 'tbsp'], ['vinegar', 1, 'tbsp']], [
  ['Rinse and drain the beans and the sweetcorn.', 'Bohnen und Mais abspülen und abtropfen lassen.', 2],
  ['Chop the onion finely.', 'Die Zwiebel fein hacken.', 3],
  ['Mix everything with oil, vinegar, salt and pepper. Done.', 'Alles mit Öl, Essig, Salz und Pfeffer mischen. Fertig.', 2],
]);
r('gschwellti', ['lunch', 'dinner'], 20, ['Boiled potatoes with cheese', 'Gschwellti mit Käse'], [['potatoes', 300, 'g'], ['cheeseSlices', 4, 'slices'], ['butter', 1, 'tbsp']], [
  ['Wash the potatoes and cook them with the skin in salted water.', 'Die Kartoffeln waschen und mit der Schale in Salzwasser kochen.', 18, true],
  ['Drain them and put them on a plate.', 'Abgiessen und auf einen Teller geben.', 1],
  ['Eat them with the cheese and a little butter. Done.', 'Mit Käse und wenig Butter essen. Fertig.', 1],
]);
r('falafel-pita', ['lunch'], 12, ['Pita with falafel', 'Pita mit Falafel'], [['falafel', 6, 'pcs'], ['pita', 1, 'pc'], ['yogurt', 3, 'tbsp'], ['cucumber', 0.5, 'pc']], [
  ['Heat the falafel in a pan with a little oil, turning them.', 'Die Falafel in einer Pfanne mit wenig Öl wärmen und wenden.', 8, true],
  ['Meanwhile cut the cucumber small and stir it into the yogurt with salt.', 'Inzwischen die Gurke klein schneiden und mit Salz unter den Joghurt rühren.', 3],
  ['Warm the pita, open it and fill it with falafel and sauce. Done.', 'Das Pitabrot wärmen, aufschneiden und mit Falafel und Sauce füllen. Fertig.', 1],
]);
r('rice-tuna', ['lunch'], 5, ['Rice with tuna and sweetcorn', 'Reis mit Thon und Mais'], [['ricePouch', 1, 'pack'], ['tuna', 1, 'can'], ['corn', 70, 'g'], ['mayo', 1, 'tbsp']], [
  ['Warm the rice as written on the pouch (often 2 minutes in the microwave).', 'Den Reis wärmen, wie auf dem Beutel steht (oft 2 Minuten in der Mikrowelle).', 2, true],
  ['Drain the tuna and the sweetcorn.', 'Thon und Mais abtropfen lassen.', 1],
  ['Mix everything with the mayonnaise. Done.', 'Alles mit der Mayonnaise mischen. Fertig.', 1],
]);
r('wurstsalat', ['lunch', 'dinner'], 10, ['Swiss sausage and cheese salad', 'Wurst-Käse-Salat'], [['cervelat', 1, 'pc'], ['cheeseSlices', 2, 'slices'], ['onion', 0.5, 'pc'], ['gherkins', 3, 'pcs'], ['oil', 1, 'tbsp'], ['vinegar', 1, 'tbsp']], [
  ['Peel the cervelat and cut it into thin slices or strips.', 'Den Cervelat schälen und in dünne Scheiben oder Streifen schneiden.', 3],
  ['Cut the cheese and the gherkins into strips, the onion into rings.', 'Käse und Essiggurken in Streifen, die Zwiebel in Ringe schneiden.', 4],
  ['Mix with oil, vinegar, salt and pepper. Done.', 'Mit Öl, Essig, Salz und Pfeffer mischen. Fertig.', 2],
]);

/* Dinner */
r('pasta-tuna', ['dinner'], 15, ['Pasta with tomatoes and tuna', 'Pasta mit Tomaten und Thon'], [['pasta', 100, 'g'], ['tuna', 1, 'can'], ['passata', 200, 'g'], ['oliveOil', 1, 'tbsp']], [
  ['Bring water to a boil with 1 teaspoon of salt.', 'Wasser mit 1 TL Salz aufkochen.', 2],
  ['Put the pasta in the boiling water and stir.', 'Die Pasta ins kochende Wasser geben und umrühren.', 9, true],
  ['Oil in a pan, add the passata and let it simmer gently.', 'Öl in die Pfanne, Passata dazu, leise köcheln.', 3],
  ['Drain the tuna and add it to the sauce.', 'Thon abtropfen und in die Sauce geben.', 1],
  ['Drain the pasta and mix it with the sauce. Done.', 'Pasta abgiessen, mit der Sauce mischen. Fertig.', 1],
]);
r('egg-fried-rice', ['dinner'], 12, ['Egg fried rice', 'Gebratener Reis mit Ei'], [['ricePouch', 1, 'pack'], ['eggs', 2, 'pcs'], ['peas', 1, 'handful'], ['soy', 1, 'tbsp'], ['oil', 1, 'tbsp']], [
  ['Heat the oil in a large pan.', 'Das Öl in einer grossen Pfanne erhitzen.', 1],
  ['Add the rice and the frozen peas and fry them, stirring.', 'Reis und gefrorene Erbsen dazu geben und unter Rühren braten.', 5, true],
  ['Push the rice to the side, crack in the eggs and stir them until set.', 'Den Reis an den Rand schieben, die Eier hineinschlagen und rühren, bis sie fest sind.', 3],
  ['Mix everything with the soy sauce. Done.', 'Alles mit der Sojasauce mischen. Fertig.', 1],
]);
r('veg-feta-pan', ['dinner'], 15, ['Pan vegetables with feta', 'Pfannengemüse mit Feta'], [['vegMix', 300, 'g'], ['feta', 80, 'g'], ['oliveOil', 1, 'tbsp'], ['bread', 1, 'slice']], [
  ['Heat the oil in a pan.', 'Das Öl in einer Pfanne erhitzen.', 1],
  ['Add the frozen vegetables and fry them, stirring now and then.', 'Das gefrorene Gemüse dazu geben und braten, ab und zu rühren.', 10, true],
  ['Salt and pepper, crumble the feta over it and let it melt a little.', 'Salzen, pfeffern, den Feta darüber bröseln und kurz schmelzen lassen.', 2],
  ['Eat it with the bread. Done.', 'Mit dem Brot essen. Fertig.', 0],
]);
r('pasta-pesto', ['dinner'], 12, ['Pasta with pesto', 'Pasta mit Pesto'], [['pasta', 100, 'g'], ['pesto', 2, 'tbsp'], ['parmesan', 20, 'g']], [
  ['Cook the pasta in salted water as written on the pack.', 'Die Pasta in Salzwasser kochen, wie auf der Packung steht.', 10, true],
  ['Keep a cup of the pasta water, then drain the pasta.', 'Eine Tasse Kochwasser aufheben, dann die Pasta abgiessen.', 1],
  ['Mix with the pesto and a little of the water, parmesan on top. Done.', 'Mit dem Pesto und wenig Kochwasser mischen, Parmesan darüber. Fertig.', 1],
]);
r('chicken-rice', ['dinner'], 20, ['Chicken with rice and vegetables', 'Poulet mit Reis und Gemüse'], [['chicken', 150, 'g'], ['ricePouch', 1, 'pack'], ['vegMix', 150, 'g'], ['soy', 1, 'tbsp'], ['oil', 1, 'tbsp']], [
  ['Cut the chicken into small pieces, salt it a little.', 'Das Poulet in kleine Stücke schneiden, leicht salzen.', 3],
  ['Heat the oil in a pan and fry the chicken until it is no longer pink inside.', 'Das Öl in einer Pfanne erhitzen und das Poulet braten, bis es innen nicht mehr rosa ist.', 7, true],
  ['Add the frozen vegetables and fry them with it.', 'Das gefrorene Gemüse dazu geben und mitbraten.', 5, true],
  ['Add the rice and the soy sauce and warm everything. Done.', 'Reis und Sojasauce dazu geben und alles wärmen. Fertig.', 3],
]);
r('aglio-olio', ['dinner'], 15, ['Spaghetti with garlic and oil', 'Spaghetti Aglio e Olio'], [['spaghetti', 100, 'g'], ['garlic', 2, 'pcs'], ['oliveOil', 3, 'tbsp'], ['chili', 1, 'pinch'], ['parmesan', 20, 'g']], [
  ['Cook the spaghetti in salted water as written on the pack.', 'Die Spaghetti in Salzwasser kochen, wie auf der Packung steht.', 10, true],
  ['Meanwhile slice the garlic thinly.', 'Inzwischen den Knoblauch in dünne Scheiben schneiden.', 2],
  ['Warm the oil with the garlic and the chili on low heat; the garlic must not get brown.', 'Das Öl mit Knoblauch und Chili bei kleiner Hitze wärmen; der Knoblauch darf nicht braun werden.', 2],
  ['Drain the spaghetti, mix them with the oil, parmesan on top. Done.', 'Die Spaghetti abgiessen, mit dem Öl mischen, Parmesan darüber. Fertig.', 1],
]);
r('chili-sin-carne', ['dinner'], 15, ['Quick bean chili', 'Schnelles Bohnen-Chili'], [['beans', 1, 'can'], ['corn', 140, 'g'], ['choppedTomatoes', 1, 'can'], ['chiliSpice', 1, 'tsp'], ['ricePouch', 1, 'pack']], [
  ['Rinse and drain the beans and the sweetcorn.', 'Bohnen und Mais abspülen und abtropfen lassen.', 2],
  ['Put them in a pot with the tomatoes and the spice, add salt.', 'Mit den Tomaten und dem Gewürz in eine Pfanne geben, salzen.', 1],
  ['Let it simmer.', 'Köcheln lassen.', 10, true],
  ['Warm the rice and eat it with the chili. Done.', 'Den Reis wärmen und mit dem Chili essen. Fertig.', 2],
]);
r('gnocchi-tomato', ['dinner'], 12, ['Gnocchi with tomato sauce and mozzarella', 'Gnocchi mit Tomatensauce und Mozzarella'], [['gnocchi', 250, 'g'], ['passata', 200, 'g'], ['mozzarella', 1, 'pc'], ['oliveOil', 1, 'tbsp']], [
  ['Warm the oil and the passata in a pan, add salt and pepper.', 'Öl und Passata in einer Pfanne wärmen, salzen und pfeffern.', 3],
  ['Cook the gnocchi in salted water until they float (about 2 minutes).', 'Die Gnocchi in Salzwasser kochen, bis sie oben schwimmen (etwa 2 Minuten).', 3, true],
  ['Lift them into the sauce with a slotted spoon.', 'Mit einer Schaumkelle in die Sauce geben.', 1],
  ['Tear the mozzarella over it, cover and let it melt. Done.', 'Den Mozzarella darüber zupfen, zudecken und schmelzen lassen. Fertig.', 3, true],
]);
r('roesti-egg', ['dinner'], 15, ['Rösti with a fried egg', 'Rösti mit Spiegelei'], [['roesti', 1, 'pack'], ['eggs', 2, 'pcs'], ['oil', 2, 'tbsp']], [
  ['Heat 1 tablespoon of oil in a pan and press the rösti flat in it.', '1 EL Öl in einer Pfanne erhitzen und die Rösti darin flach drücken.', 1],
  ['Fry on medium heat until golden below.', 'Bei mittlerer Hitze braten, bis sie unten goldbraun ist.', 6, true],
  ['Turn it with a plate and fry the other side.', 'Mit einem Teller wenden und die andere Seite braten.', 5, true],
  ['Fry the eggs in a second pan with the rest of the oil and put them on top. Done.', 'Die Eier in einer zweiten Pfanne mit dem restlichen Öl braten und darauf legen. Fertig.', 3],
]);
r('tortellini-cream', ['dinner'], 12, ['Tortellini with ham and peas', 'Tortellini mit Schinken und Erbsen'], [['tortellini', 250, 'g'], ['cream', 100, 'ml'], ['ham', 2, 'slices'], ['peas', 1, 'handful']], [
  ['Cook the tortellini in salted water as written on the pack.', 'Die Tortellini in Salzwasser kochen, wie auf der Packung steht.', 5, true],
  ['Meanwhile cut the ham into strips.', 'Inzwischen den Schinken in Streifen schneiden.', 2],
  ['Warm the cream with the ham and the frozen peas in a pan.', 'Den Rahm mit Schinken und gefrorenen Erbsen in einer Pfanne wärmen.', 3],
  ['Drain the tortellini and mix them into the sauce. Done.', 'Die Tortellini abgiessen und unter die Sauce mischen. Fertig.', 1],
]);
r('chickpea-curry', ['dinner'], 15, ['Chickpea curry', 'Kichererbsen-Curry'], [['chickpeas', 1, 'can'], ['coconutMilk', 200, 'ml'], ['curryPaste', 1, 'tbsp'], ['spinach', 2, 'handfuls'], ['ricePouch', 1, 'pack']], [
  ['Warm the curry paste in a pan for 1 minute, stirring.', 'Die Currypaste in einer Pfanne 1 Minute unter Rühren wärmen.', 1],
  ['Add the coconut milk, the drained chickpeas and the frozen spinach.', 'Kokosmilch, abgetropfte Kichererbsen und gefrorenen Spinat dazu geben.', 2],
  ['Let it simmer, add salt.', 'Köcheln lassen, salzen.', 8, true],
  ['Warm the rice and eat it with the curry. Done.', 'Den Reis wärmen und mit dem Curry essen. Fertig.', 2],
]);
r('salmon-rice', ['dinner'], 18, ['Salmon with rice and broccoli', 'Lachs mit Reis und Brokkoli'], [['salmon', 1, 'pc'], ['ricePouch', 1, 'pack'], ['broccoli', 150, 'g'], ['lemon', 0.5, 'pc'], ['oil', 1, 'tbsp']], [
  ['Cook the broccoli in salted water.', 'Den Brokkoli in Salzwasser kochen.', 6, true],
  ['Heat the oil in a pan and fry the salmon on the skin side, then turn it.', 'Das Öl in einer Pfanne erhitzen und den Lachs auf der Hautseite braten, dann wenden.', 8, true],
  ['Warm the rice.', 'Den Reis wärmen.', 2],
  ['Salt everything and squeeze the lemon over the salmon. Done.', 'Alles salzen und die Zitrone über den Lachs pressen. Fertig.', 1],
]);
r('mince-pasta', ['dinner'], 20, ['Pasta with meat sauce', 'Pasta mit Hackfleischsauce'], [['pasta', 100, 'g'], ['mince', 125, 'g'], ['passata', 250, 'g'], ['onion', 0.5, 'pc'], ['oil', 1, 'tbsp']], [
  ['Chop the onion finely.', 'Die Zwiebel fein hacken.', 3],
  ['Heat the oil and fry the mince and the onion until crumbly.', 'Das Öl erhitzen und Hackfleisch und Zwiebel krümelig braten.', 5, true],
  ['Add the passata, salt and pepper, and let it simmer.', 'Passata dazu, salzen, pfeffern und köcheln lassen.', 10, true],
  ['Meanwhile cook the pasta in salted water, drain it and mix. Done.', 'Inzwischen die Pasta in Salzwasser kochen, abgiessen und mischen. Fertig.', 2],
]);
r('fried-noodles', ['dinner'], 12, ['Fried noodles with vegetables', 'Gebratene Nudeln mit Gemüse'], [['noodles', 1, 'pack'], ['wokMix', 200, 'g'], ['soy', 2, 'tbsp'], ['eggs', 1, 'pc'], ['oil', 1, 'tbsp']], [
  ['Cook the noodles 3 minutes without the spice, then drain them.', 'Die Nudeln ohne Gewürz 3 Minuten kochen, dann abgiessen.', 3, true],
  ['Heat the oil and fry the frozen vegetables, stirring.', 'Das Öl erhitzen und das gefrorene Gemüse unter Rühren braten.', 5, true],
  ['Add the egg and stir until set.', 'Das Ei dazu geben und rühren, bis es fest ist.', 2],
  ['Add the noodles and the soy sauce and mix well. Done.', 'Nudeln und Sojasauce dazu geben und gut mischen. Fertig.', 2],
]);
r('shakshuka', ['dinner'], 18, ['Eggs in tomato sauce', 'Eier in Tomatensauce (Shakshuka)'], [['eggs', 2, 'pcs'], ['choppedTomatoes', 1, 'can'], ['onion', 0.5, 'pc'], ['paprika', 1, 'tsp'], ['bread', 2, 'slices'], ['oil', 1, 'tbsp']], [
  ['Chop the onion and fry it in the oil until soft.', 'Die Zwiebel hacken und im Öl weich braten.', 4],
  ['Add the tomatoes and the paprika, salt it and let it simmer.', 'Tomaten und Paprika dazu, salzen und köcheln lassen.', 6, true],
  ['Make two holes in the sauce and crack an egg into each.', 'Zwei Mulden in die Sauce drücken und in jede ein Ei schlagen.', 1],
  ['Cover and cook until the white is firm. Eat with the bread. Done.', 'Zudecken und garen, bis das Eiweiss fest ist. Mit dem Brot essen. Fertig.', 6, true],
]);
r('cheese-polenta', ['dinner'], 10, ['Cheese polenta', 'Käse-Polenta'], [['polenta', 60, 'g'], ['milk', 150, 'ml'], ['gratedCheese', 40, 'g'], ['butter', 1, 'tsp']], [
  ['Bring the milk, 150 ml water and a pinch of salt to a boil.', 'Milch, 150 ml Wasser und eine Prise Salz aufkochen.', 3],
  ['Stir in the polenta and cook on low heat, stirring.', 'Die Polenta einrühren und bei kleiner Hitze unter Rühren kochen.', 5, true],
  ['Stir in the cheese and the butter. Done.', 'Käse und Butter darunter rühren. Fertig.', 1],
]);
r('tortilla-pizza', ['dinner'], 15, ['Tortilla pizza', 'Tortilla-Pizza'], [['tortilla', 2, 'pcs'], ['passata', 4, 'tbsp'], ['mozzarella', 1, 'pc'], ['ham', 2, 'slices']], [
  ['Heat the oven to 220 degrees.', 'Den Ofen auf 220 Grad vorheizen.', 3],
  ['Lay the wraps on a baking tray and spread the passata on them.', 'Die Fladen auf ein Blech legen und die Passata darauf streichen.', 1],
  ['Tear the mozzarella and the ham over it, salt a little.', 'Mozzarella und Schinken darüber zupfen, wenig salzen.', 2],
  ['Bake until the cheese melts. Done.', 'Backen, bis der Käse schmilzt. Fertig.', 8, true],
]);
r('mac-cheese', ['dinner'], 15, ['Quick mac and cheese', 'Schnelle Mac and Cheese'], [['pasta', 100, 'g'], ['milk', 100, 'ml'], ['gratedCheese', 60, 'g'], ['butter', 1, 'tsp']], [
  ['Cook the pasta in salted water as written on the pack.', 'Die Teigwaren in Salzwasser kochen, wie auf der Packung steht.', 10, true],
  ['Drain the pasta and put it back into the pot.', 'Die Teigwaren abgiessen und zurück in die Pfanne geben.', 1],
  ['Add the milk, the cheese and the butter and stir on low heat until creamy. Done.', 'Milch, Käse und Butter dazu geben und bei kleiner Hitze cremig rühren. Fertig.', 3],
]);
r('chicken-cream', ['dinner'], 15, ['Chicken in paprika cream with rice', 'Poulet-Geschnetzeltes mit Paprika und Reis'], [['chickenStrips', 150, 'g'], ['cream', 100, 'ml'], ['paprika', 1, 'tsp'], ['ricePouch', 1, 'pack'], ['oil', 1, 'tbsp']], [
  ['Heat the oil and fry the chicken strips until they are no longer pink inside.', 'Das Öl erhitzen und das Geschnetzelte braten, bis es innen nicht mehr rosa ist.', 6, true],
  ['Add the paprika, salt and the cream and let it simmer.', 'Paprika, Salz und den Rahm dazu geben und köcheln lassen.', 4, true],
  ['Warm the rice and eat it with the chicken. Done.', 'Den Reis wärmen und mit dem Geschnetzelten essen. Fertig.', 2],
]);
r('veg-omelette', ['dinner'], 10, ['Omelette with pepper and cheese', 'Omelette mit Peperoni und Käse'], [['eggs', 3, 'pcs'], ['pepper', 0.5, 'pc'], ['gratedCheese', 30, 'g'], ['oil', 1, 'tsp']], [
  ['Cut the pepper into small pieces and fry it in the oil.', 'Die Peperoni in kleine Stücke schneiden und im Öl anbraten.', 4],
  ['Whisk the eggs with salt and pour them over the pepper.', 'Die Eier mit Salz verquirlen und über die Peperoni giessen.', 1],
  ['Cheese on top, cover and let it set. Done.', 'Käse darüber, zudecken und stocken lassen. Fertig.', 4, true],
]);
r('sweet-chili-chicken', ['dinner'], 15, ['Sweet chili chicken with rice', 'Sweet-Chili-Poulet mit Reis'], [['chickenStrips', 150, 'g'], ['sweetChili', 2, 'tbsp'], ['wokMix', 150, 'g'], ['ricePouch', 1, 'pack'], ['oil', 1, 'tbsp']], [
  ['Heat the oil and fry the chicken until it is no longer pink inside.', 'Das Öl erhitzen und das Poulet braten, bis es innen nicht mehr rosa ist.', 6, true],
  ['Add the frozen vegetables and fry them with it.', 'Das gefrorene Gemüse dazu geben und mitbraten.', 5, true],
  ['Stir in the sweet chili sauce and warm the rice. Done.', 'Die Sweet-Chili-Sauce einrühren und den Reis wärmen. Fertig.', 2],
]);

/* ---------- built for the app ---------- */
const DE_MAP = {};
const en = (pair) => {
  DE_MAP[pair[0]] = pair[1];
  return pair[0];
};

/** The ingredients: { key: { name (English), tags } }. */
export const INGREDIENTS = Object.fromEntries(Object.entries(ING).map(([k, [e, d, tags]]) => [k, { key: k, name: en([e, d]), tags }]));
for (const [e, d] of Object.values(UNITS)) DE_MAP[e] = d;

/**
 * All recipes: { id, meals, min, title, ingredients [{ key, name, amount, unit, tags }], steps [{ text, min, timer }] }.
 * Texts in English (show them with t()).
 */
export const RECIPES = SRC.map((x) => ({
  id: x.id,
  meals: x.meals,
  min: x.min,
  title: en(x.title),
  ingredients: x.ing.map(([key, amount, unit]) => ({ key, name: INGREDIENTS[key].name, amount, unit, tags: INGREDIENTS[key].tags })),
  steps: x.steps.map(([e, d, min, timer]) => ({ text: en([e, d]), min, timer: !!timer })),
}));

/** The German texts of all recipes (for i18n/de/kochen.js). */
export const DE = DE_MAP;

export const recipeById = (id) => RECIPES.find((x) => x.id === id) ?? null;

/** Round an amount for the eye: whole numbers above 10, halves below. */
export function roundAmount(n) {
  if (n >= 10) return Math.round(n);
  return Math.round(n * 2) / 2;
}

/**
 * One ingredient for `portions` people → { name, amount, unit } with the right unit word
 * (singular or plural key of UNITS; the caller translates).
 */
export function scaled(ing, portions = 1) {
  const amount = roundAmount(ing.amount * Math.max(1, portions));
  const base = Object.entries(PLURAL).find(([, p]) => p === ing.unit)?.[0] ?? ing.unit;
  const unit = PLURAL[base] && amount > 1 ? PLURAL[base] : base;
  return { name: ing.name, amount, unit };
}
