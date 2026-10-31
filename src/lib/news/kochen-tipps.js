// «Kochen» Schritt 3 (Noah 28.10.2026 «3a», «4a»): tips of the day for every meal and the short start
export default {
  title: 'Tips of the day for cooking',
  lead: 'Every day a new simple suggestion for breakfast, lunch and dinner.',
  points: [
    { text: 'At the top of Cooking: one tip per meal, with «Another suggestion», «Like it» and «Never show again»', href: '#/me/alltag/kochen', go: 'f.cook' },
    { text: 'A recipe comes again only when all the others have been suggested', href: '#/me/alltag/kochen', go: 'f.cook' },
  ],
  small: [
    { box: 'new', text: 'A short start asks what you don\'t eat and how long you want to cook; «Change» opens it again any time', go: 'f.cook' },
    { box: 'new', text: '«Liked» in the list shows the recipes you marked', go: 'f.cook' },
  ],
  test: ['Open Planen › Alltag › Kochen: the short start asks what you don\'t eat. Tap «Fisch», «10 Min» and «Vorschläge zeigen».', 'Under «Tipps des Tages» tap «Anderer Vorschlag» at lunch: a new recipe appears, at most 10 minutes.', 'Tap «Mag ich», then the filter «Mag ich» in the list: the recipe is there.'],
  since: [],
  de: {
    'Tips of the day for cooking': 'Tipps des Tages zum Kochen',
    'Every day a new simple suggestion for breakfast, lunch and dinner.': 'Jeden Tag ein neuer einfacher Vorschlag für Frühstück, Mittag- und Abendessen.',
    'At the top of Cooking: one tip per meal, with «Another suggestion», «Like it» and «Never show again»': 'Oben bei Kochen: ein Tipp pro Mahlzeit, mit «Anderer Vorschlag», «Mag ich» und «Nie mehr zeigen»',
    'A recipe comes again only when all the others have been suggested': 'Ein Rezept kommt erst wieder, wenn alle anderen dran waren',
    "A short start asks what you don't eat and how long you want to cook; «Change» opens it again any time": 'Ein kurzer Start fragt, was du nicht isst und wie lange du kochen willst; «Ändern» öffnet ihn jederzeit wieder',
    '«Liked» in the list shows the recipes you marked': '«Mag ich» in der Liste zeigt die Rezepte, die du markiert hast',
    "Open Planen › Alltag › Kochen: the short start asks what you don't eat. Tap «Fisch», «10 Min» and «Vorschläge zeigen».": 'Öffne Planen › Alltag › Kochen: der kurze Start fragt, was du nicht isst. Tippe auf «Fisch», «10 Min» und «Vorschläge zeigen».',
    'Under «Tipps des Tages» tap «Anderer Vorschlag» at lunch: a new recipe appears, at most 10 minutes.': 'Tippe unter «Tipps des Tages» beim Zmittag auf «Anderer Vorschlag»: ein neues Rezept erscheint, höchstens 10 Minuten.',
    'Tap «Mag ich», then the filter «Mag ich» in the list: the recipe is there.': 'Tippe auf «Mag ich», dann in der Liste auf den Filter «Mag ich»: das Rezept ist dort.',
  },
};
