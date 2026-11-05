// «Erfolgsrezepte» (Noah 04.11.2026 «5a», Persönliches Lernen Idee 5): keep what worked on a good tour as a recipe
export default {
  title: 'Success recipes',
  lead: 'After a tour that went well, keep what worked as a recipe: breakfast, start time, food and pace. All in your own words.',
  points: [
    { text: 'The tour page of a tour with a written Rückblick offers «Save as a recipe»; start time and pace are filled in from the ride', go: { href: '#/trips', where: 'Tour page of a bike tour whose Rückblick is written, under the guess card.' } },
    { text: 'In Planen of a next bike tour you can put a recipe next to it', go: { href: '#/pack', where: 'Packen, on a bike tour, once you have kept a recipe.' } },
    { text: 'All recipes are under Templates: change, rename or delete them, with Undo', go: { href: '#/pack/templates', where: 'Templates, at the bottom.' } },
  ],
  small: [{ box: 'new', text: 'A recipe is never saved by itself' }],
  test: ['Open the tour page of a tour with a written Rückblick: tap «Save as a recipe», write a breakfast and save.', 'Open Templates: the recipe stands at the bottom with what you wrote.', 'In Planen of a bike tour tap the recipe: its lines show next to the tour.'],
  since: ['f.recipes'],
  de: {
    'Success recipes': 'Erfolgsrezepte',
    'After a tour that went well, keep what worked as a recipe: breakfast, start time, food and pace. All in your own words.': 'Halte nach einer gelungenen Tour fest, was geklappt hat, als Rezept: Frühstück, Startzeit, Verpflegung und Tempo. Alles in deinen eigenen Worten.',
    'The tour page of a tour with a written Rückblick offers «Save as a recipe»; start time and pace are filled in from the ride': 'Die Tour-Seite einer Tour mit geschriebenem Rückblick bietet «Als Rezept speichern»; Startzeit und Tempo kommen aus der Fahrt',
    'Tour page of a bike tour whose Rückblick is written, under the guess card.': 'Tour-Seite einer Velotour mit geschriebenem Rückblick, unter der Schätzkarte.',
    'In Planen of a next bike tour you can put a recipe next to it': 'In Planen einer nächsten Velotour kannst du ein Rezept daneben legen',
    'Packen, on a bike tour, once you have kept a recipe.': 'Packen, bei einer Velotour, sobald du ein Rezept festgehalten hast.',
    'All recipes are under Templates: change, rename or delete them, with Undo': 'Alle Rezepte stehen unter Vorlagen: ändern, umbenennen oder löschen, mit Rückgängig',
    'Templates, at the bottom.': 'Vorlagen, ganz unten.',
    'A recipe is never saved by itself': 'Ein Rezept wird nie von selbst gespeichert',
    'Open the tour page of a tour with a written Rückblick: tap «Save as a recipe», write a breakfast and save.': 'Öffne die Tour-Seite einer Tour mit geschriebenem Rückblick: tipp «Als Rezept speichern», schreib ein Frühstück und speichere.',
    'Open Templates: the recipe stands at the bottom with what you wrote.': 'Öffne Vorlagen: das Rezept steht ganz unten, mit dem, was du geschrieben hast.',
    'In Planen of a bike tour tap the recipe: its lines show next to the tour.': 'Tipp in Planen einer Velotour das Rezept: seine Zeilen stehen neben der Tour.',
  },
};
