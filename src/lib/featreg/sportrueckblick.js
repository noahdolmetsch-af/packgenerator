// «Rückblick pro Sportart» (Noah 21.11.2026 «ich möchte alle entwürfe 1-3 umsetzen», S4): Auswerten › Sportjahr › eine Sportart
export default {
  features: [
    { id: 'f.sportrueckblick', group: 'data', title: 'Year of one sport', text: 'One sport of the sports year on its own page: hours, units, average duration and distance against the year before, the hours per month, where the units come from (Strava or by hand) and the best values. Open it from the sports year or from the card «Your year» on the page of a sport. Only to look at.', href: '#/auswerten/sportjahr', words: 'rueckblick sportart jahr stunden einheiten durchschnitt dauer strecke vorjahr bestwerte strava hand dein jahr year one sport hours units average duration distance best values', moment: 'app' },
  ],
  howto: { 'f.sportrueckblick': ['Open Analysis › Sports year and tap a sport under «Where did the time go?».', 'Read the hours, units and distance against the year before.', 'Look at the best values at the bottom.'] },
  handbook: {
    'f.sportrueckblick': {
      on: null,
      steps: ['Open Analysis › Sports year and tap a sport under «Where did the time go?».', 'Read the hours, units and distance against the year before.', 'Look at the best values at the bottom.'],
      example: 'Example: running shows 51 h and 51 units, and the year before next to each.',
    },
  },
  home: { 'f.sportrueckblick': '#/auswerten/sportjahr' },
};
