// «Erfolgsrezepte» (Noah 04.11.2026 «5a», Persönliches Lernen Idee 5)
export default {
  features: [
    { id: 'f.recipes', group: 'after', title: 'Success recipes', text: 'After a tour that went well, keep what worked as a recipe: breakfast, start time, food and pace. Look one up in Planen for a next tour. All in your own words.', href: '#/pack/templates', words: 'rezept erfolgsrezept frühstück startzeit verpflegung tempo was hat geklappt gelungen tag rückblick vorlage', moment: 'zurueck' },
  ],
  howto: { 'f.recipes': ['Open the tour page of a tour whose Rückblick is written and tap «Save as a recipe».', 'Write breakfast, start time, food and pace; start and pace are filled in from the ride.', 'In Planen of a next tour put the recipe next to it; all recipes are under Templates.'] },
  handbook: {
    'f.recipes': {
      on: 'Needs a bike tour with a written Rückblick.',
      steps: ['Open the tour page (Trips) of a tour with a written Rückblick and tap «Save as a recipe».', 'Write what worked; start time and pace come from the ride when it has them. A recipe needs a name and one part.', 'In Planen of a next bike tour tap the recipe: it shows next to it. Change or delete recipes under Templates.'],
      example: 'Example: «Jura day»: breakfast porridge, start 07:30, a bar every hour, 22 km/h.',
    },
  },
  home: { 'f.recipes': '#/pack/templates' },
};
