// UI-Test 26.10.2026 T7 «Gewichte gleich gezählt»: bikes/bagwords.js names bags and bottle cages apart (cages count in the bike weight), «On me» shows the same total everywhere, worn places merge into the body, the shares add up to 100 %, the wardrobe says how much is sorted
export default {
  title: 'Weights counted the same',
  lead: 'Bags, bottle cages and «On me» are counted the same way on every page.',
  points: [{ text: 'Bottle cages are no longer counted as bags; they sit in the bike weight', href: '#/bikes?tab=rig', go: 'f.velosetup' }, { text: '«On me» shows the same weight in Pack and in the weight card', href: '#/pack', go: 'f.onion' }],
  small: [{ box: 'fixed', text: 'The shares in the weight bar add up to exactly 100 %', go: null }, { box: 'nicer', text: 'The wardrobe says how many pieces are sorted and how many are still open', go: 'f.wardrobe' }],
  test: ['Bike › Setup: the line says «1 bag, 2 bottle cages», and the cages say «in the bike weight».', 'Pack a tour: «On me» shows the same kg as the weight card, and the shares add up to 100 %.'],
  since: [],
  de: {
    'Weights counted the same': 'Gewichte gleich gezählt',
    'Bags, bottle cages and «On me» are counted the same way on every page.': 'Taschen, Flaschenhalter und «Am Körper» zählen auf jeder Seite gleich.',
    'Bottle cages are no longer counted as bags; they sit in the bike weight': 'Flaschenhalter zählen nicht mehr als Taschen; sie stecken im Velogewicht',
    '«On me» shows the same weight in Pack and in the weight card': '«Am Körper» zeigt in Packen und in der Gewichtskarte dasselbe Gewicht',
    'The shares in the weight bar add up to exactly 100 %': 'Die Anteile im Gewichtsbalken ergeben genau 100 %',
    'The wardrobe says how many pieces are sorted and how many are still open': 'Der Kleiderschrank sagt, wie viele Stücke eingeordnet sind und wie viele noch offen',
    'Bike › Setup: the line says «1 bag, 2 bottle cages», and the cages say «in the bike weight».': 'Velo › Setup: Die Zeile sagt «1 Tasche, 2 Flaschenhalter», bei den Haltern steht «im Velogewicht».',
    'Pack a tour: «On me» shows the same kg as the weight card, and the shares add up to 100 %.': 'Packe eine Tour: «Am Körper» zeigt dieselben kg wie die Gewichtskarte, die Anteile ergeben 100 %.',
  },
};
