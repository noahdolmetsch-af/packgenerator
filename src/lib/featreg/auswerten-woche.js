// «Auswerten neu» Teil 2 (Noah 24.11.2026 «1b 2a 3b 4a 5a», Entwurf B «Wochenbericht»): Auswerten › Woche
export default {
  features: [
    { id: 'f.auswertenwoche', group: 'active', title: 'Analysis: Week', text: 'The tab «Week» of Analysis: one sentence about the week, month or year (hours, units, days, against the period before), the hours by sport as bars, how you recovered against your own usual range of the last 12 months, and the longest units. Same hours as the Sports year. Only to look at.', href: '#/auswerten/woche', words: 'auswerten woche wochenbericht monat jahr stunden einheiten tage sportarten balken erholung hrv ruhepuls schlaf normal laengste einheiten weekly report week month year hours recovery usual range', moment: 'app' },
  ],
  howto: { 'f.auswertenwoche': ['Open Analysis and tap the tab «Week».', 'Page back with ‹ › or switch to Month or Year, and read the sentence at the top.', 'Check under «How you recovered» where your HRV, resting pulse and sleep stood.'] },
  handbook: {
    'f.auswertenwoche': {
      on: null,
      steps: ['Open Analysis and tap the tab «Week».', 'Page back with ‹ › or switch to Month or Year, and read the sentence at the top.', 'Check under «How you recovered» where your HRV, resting pulse and sleep stood.'],
      example: 'Example: 7 h 20 in 5 units on 4 days, 12 % more than the week before; your sleep stood in your usual range.',
    },
  },
  home: { 'f.auswertenwoche': '#/auswerten/woche' },
};
