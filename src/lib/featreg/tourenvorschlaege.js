// «Tourenvorschläge» (Noah 05.11.2026 «a b, Mockup ja», «1a 2a 3a»): Pilot mit fünf Mountainbike-Touren aus SchweizMobil
export default {
  features: [
    { id: 'f.tourvorschlag', group: 'before', title: 'Tour suggestions', text: 'Mountain bike tours from the official network of SchweizMobil (pilot: five tours in Zurich and Grisons). Filter by region, difficulty and time; each tour says why it is suggested, shows the height and the ground, and can be kept as a dream or saved as GPX.', href: '#/trips/vorschlaege', words: 'tourenvorschlag vorschlag vorschläge touren mountainbike mtb schweizmobil singletrail trail gpx region schwierigkeit schnee neu für dich', moment: 'planen' },
  ],
  howto: { 'f.tourvorschlag': ['Open Trips › Dreams › Tour suggestions.', 'Choose the region, the difficulty and the time, then open a tour.', 'Read «Why this suggestion?» and tap «Keep as a dream» or «Save GPX».'] },
  handbook: {
    'f.tourvorschlag': {
      on: null,
      steps: ['Open Trips › Dreams › Tour suggestions.', 'Choose the region, the difficulty and the time, then open a tour.', 'Read «Why this suggestion?» and tap «Keep as a dream» or «Save GPX».'],
      example: 'Example: «Flims» (23 km, +840 m, medium fitness, easy skill) in Grisons, with its height profile and the ground along the way.',
    },
  },
  home: { 'f.tourvorschlag': '#/trips/vorschlaege' },
};
