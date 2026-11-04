// «Kochen» Online-Shop-Link (Noah 29.10.2026): a search link per ingredient to Migros or Coop
export default {
  title: 'Search ingredients online',
  lead: 'Choose Migros or Coop in a recipe and every ingredient gets a link to the shop search.',
  points: [
    { text: 'A recipe has «Search online»: choose Migros or Coop, then every ingredient has a link to its search', href: '#/me/alltag/kochen', go: 'f.cook' },
  ],
  small: [{ box: 'new', text: 'The links only open the shop in your browser; nothing is sent from the app, and the choice can be switched off', go: 'f.cook' }],
  test: ['Open Planen › Alltag › Kochen › any recipe and tap «Migros» under the ingredients.', 'Each ingredient shows a small link; it opens the Migros search for that ingredient.', 'Tap «Migros» again: the links are gone.'],
  since: [],
  de: {
    'Search ingredients online': 'Zutaten online suchen',
    'Choose Migros or Coop in a recipe and every ingredient gets a link to the shop search.': 'Wähle in einem Rezept Migros oder Coop, dann bekommt jede Zutat einen Link zur Suche im Shop.',
    'A recipe has «Search online»: choose Migros or Coop, then every ingredient has a link to its search': 'Ein Rezept hat «Online suchen»: wähle Migros oder Coop, dann hat jede Zutat einen Link zu ihrer Suche',
    'The links only open the shop in your browser; nothing is sent from the app, and the choice can be switched off': 'Die Links öffnen nur den Shop im Browser; die App sendet nichts, und die Wahl lässt sich ausschalten',
    'Open Planen › Alltag › Kochen › any recipe and tap «Migros» under the ingredients.': 'Öffne Planen › Alltag › Kochen › ein Rezept und tippe unter den Zutaten auf «Migros».',
    'Each ingredient shows a small link; it opens the Migros search for that ingredient.': 'Jede Zutat zeigt einen kleinen Link; er öffnet die Migros-Suche für diese Zutat.',
    'Tap «Migros» again: the links are gone.': 'Tippe nochmals «Migros»: die Links sind weg.',
  },
};
