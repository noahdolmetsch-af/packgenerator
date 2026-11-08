// «Meine Datenquellen» (Noah 07.11.2026 «1a», Tour A–Z, Schritt 0): wo die Zahlen herkommen, wie frisch sie sind, wo Lücken sind
export default {
  features: [
    { id: 'f.quellen', group: 'data', title: 'My data sources', text: 'Where your numbers come from: Fitbit, Strava, your daily answers, tours and bikes. Each shows what is held, how fresh it is and where days are missing, and the page names the limits of the data.', href: '#/auswerten/quellen', words: 'datenquellen quellen woher zahlen frisch lücken stand fitbit strava wi gaht tagescheck touren velos wetter kosten grenzen data sources gaps fresh', moment: 'app' },
  ],
  howto: { 'f.quellen': ['Open Me › Connections and tap «See where your numbers come from».', 'Read each line: what is held and how fresh it is.', 'Tap a line to open the place where that source is set up.'] },
  handbook: {
    'f.quellen': {
      on: null,
      steps: ['Open Me › Connections and tap «See where your numbers come from».', 'Read each line: what is held and how fresh it is.', 'Tap a line to open the place where that source is set up.'],
      example: 'Example: «Fitbit: values up to 6 Nov · 3 days without a value in the last 14 days».',
    },
  },
  home: { 'f.quellen': '#/auswerten/quellen' },
};
