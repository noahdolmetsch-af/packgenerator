// «Kochen» Schritt 4 (Noah 28.10.2026 «4a»): approximate kcal, carbohydrates, protein and fat per portion
export default {
  title: 'Nutrition values for cooking',
  lead: 'Every recipe shows about how much energy, carbohydrates, protein and fat one portion has.',
  points: [
    { text: 'A recipe shows kcal, carbohydrates, protein and fat per portion (about)', href: '#/me/alltag/kochen', go: 'f.cook' },
    { text: 'The list and the tips of the day show the kcal of each recipe', href: '#/me/alltag/kochen', go: 'f.cook' },
  ],
  small: [{ box: 'new', text: 'The values are rounded typical values added up from the ingredients; your own recipes show none', go: 'f.cook' }],
  test: ['Open Planen › Alltag › Kochen › «Overnight Oats mit Banane»: «Pro Portion (ungefähr)» shows kcal, Kohlenhydrate, Eiweiss and Fett.', 'Tap «+» for 2 portions: the values stay the same, they are for one portion.', 'In the list each recipe shows its kcal.'],
  since: [],
  de: {
    'Nutrition values for cooking': 'Nährwerte beim Kochen',
    'Every recipe shows about how much energy, carbohydrates, protein and fat one portion has.': 'Jedes Rezept zeigt ungefähr, wie viel Energie, Kohlenhydrate, Eiweiss und Fett eine Portion hat.',
    'A recipe shows kcal, carbohydrates, protein and fat per portion (about)': 'Ein Rezept zeigt kcal, Kohlenhydrate, Eiweiss und Fett pro Portion (ungefähr)',
    'The list and the tips of the day show the kcal of each recipe': 'Die Liste und die Tipps des Tages zeigen die kcal jedes Rezepts',
    'The values are rounded typical values added up from the ingredients; your own recipes show none': 'Die Werte sind gerundete Richtwerte, aus den Zutaten zusammengezählt; deine eigenen Rezepte zeigen keine',
    'Open Planen › Alltag › Kochen › «Overnight Oats mit Banane»: «Pro Portion (ungefähr)» shows kcal, Kohlenhydrate, Eiweiss and Fett.': 'Öffne Planen › Alltag › Kochen › «Overnight Oats mit Banane»: «Pro Portion (ungefähr)» zeigt kcal, Kohlenhydrate, Eiweiss und Fett.',
    'Tap «+» for 2 portions: the values stay the same, they are for one portion.': 'Tippe «+» für 2 Portionen: die Werte bleiben gleich, sie gelten für eine Portion.',
    'In the list each recipe shows its kcal.': 'In der Liste zeigt jedes Rezept seine kcal.',
  },
};
