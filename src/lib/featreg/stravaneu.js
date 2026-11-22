// «Aktivität anlegen?» (Noah 21.11.2026 «4a», Thread «Sportjahr», S7): Meine Sportarten, Strava ohne Sportart
export default {
  features: [
    { id: 'f.stravaneu', group: 'data', title: 'Strava sport without an activity', text: 'When Strava has sports (hiking, swimming …) you have no activity for, «My sports» asks once: make a sport of it and the Strava activities count back in time, in your goals and in the sports year. The new sport has no goal. «Do not ask» says no for good. Both can be undone.', href: '#/flow/sports', words: 'strava aktivitaet anlegen sportart ohne wandern schwimmen skitour rueckwirkend zaehlen nicht fragen make sport hiking swimming without activity count', moment: 'app' },
  ],
  howto: { 'f.stravaneu': ['Open My sports; the card at the top asks about each Strava sport without an activity.', 'Tap «Make sport» or «Do not ask».', 'Change the new sport in its editor, or undo it right after.'] },
  handbook: {
    'f.stravaneu': {
      on: null,
      steps: ['Open My sports; the card at the top asks about each Strava sport without an activity.', 'Tap «Make sport» or «Do not ask».', 'Change the new sport in its editor, or undo it right after.'],
      example: 'Example: hiking from Strava becomes the sport «Wandern» with 9 activities counted.',
    },
  },
  home: { 'f.stravaneu': '#/flow/sports' },
};
