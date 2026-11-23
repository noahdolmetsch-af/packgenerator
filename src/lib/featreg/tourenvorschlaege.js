// «Tourenvorschläge» (Noah 05.11.2026 «a b, Mockup ja», «1a 2a 3a»): 100 Mountainbike-Touren aus SchweizMobil (zuerst fünf als Pilot)
export default {
  features: [
    { id: 'f.tourvorschlag', group: 'before', title: 'Tour suggestions', text: 'Mountain bike tours from the official network of SchweizMobil (100 tours that are hard for fitness, in every canton with official routes, nearest first). Filter by canton, fitness, skill and time; each tour says why it is suggested, shows the height and the ground, and can be kept as a dream or saved as GPX.', href: '#/trips/vorschlaege', words: 'tourenvorschlag vorschlag vorschläge touren mountainbike mtb schweizmobil singletrail trail gpx region schwierigkeit schnee neu für dich', moment: 'planen' },
  ],
  howto: { 'f.tourvorschlag': ['Open Trips › Dreams › Tour suggestions.', 'Choose the canton, the fitness, the skill and the time, then open a tour.', 'Read «Why this suggestion?» and tap «Keep as a dream» or «Save GPX».'] },
  handbook: {
    'f.tourvorschlag': {
      on: null,
      steps: ['Open Trips › Dreams › Tour suggestions.', 'Choose the canton, the fitness, the skill and the time, then open a tour.', 'Read «Why this suggestion?» and tap «Keep as a dream» or «Save GPX».'],
      example: 'Example: «Winterthur → Hulftegg» (44 km, +1250 m, hard fitness, medium skill) in Zurich, with profile and ground.',
    },
  },
  home: { 'f.tourvorschlag': '#/trips/vorschlaege' },
};
