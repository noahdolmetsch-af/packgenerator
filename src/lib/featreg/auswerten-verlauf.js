// «Auswerten neu» Teil 3 (Noah 24.11.2026 «1b 2a 3b 4a 5a», «über die jahre verteilt», Entwurf C «Cockpit»): Auswerten › Verlauf
export default {
  features: [
    { id: 'f.auswertenverlauf', group: 'active', title: 'Analysis: Course', text: 'The tab «Course» of Analysis: HRV, resting pulse and sleep over 4 weeks to 2 years with your own usual range of the last 12 months behind them, your normal year by year, and two patterns of your nights (the hour you went to bed, the night after a long ride). Every group needs at least 15 nights. Observation, not a cause.', href: '#/auswerten/verlauf', words: 'auswerten verlauf hrv ruhepuls schlaf jahre normal eigenes normal band ueblich bettzeit lange fahrt muster naechte zusammenhaenge cockpit course years usual range bedtime pattern', moment: 'app' },
  ],
  howto: { 'f.auswertenverlauf': ['Open Analysis and tap the tab «Course».', 'Pick 4 weeks, 12 weeks, 6 months or 2 years and point at a day for its value.', 'Scroll to «Your normal over the years» and see how it moved.'] },
  handbook: {
    'f.auswertenverlauf': {
      on: null,
      steps: ['Open Analysis and tap the tab «Course».', 'Pick 4 weeks, 12 weeks, 6 months or 2 years and point at a day for its value.', 'Scroll to «Your normal over the years» and see how it moved.'],
      example: 'Example: your HRV band in 2024 lay lower than in 2026; the nights after a ride over 3 h show 62 ms against 71 ms without a ride.',
    },
  },
  home: { 'f.auswertenverlauf': '#/auswerten/verlauf' },
};
