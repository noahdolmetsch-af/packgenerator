// «Geschafft» (Noah 19.11.2026 «1-5a», Thread «Training erfassen vereinfachen», T1): die Seite nach dem Abhaken
export default {
  features: [
    { id: 'f.geschafft', group: 'active', title: 'Done page', text: 'After you tick something, this page shows what you did, how often this week, the week in hours and days, the weekly goals still open and, with Strava numbers, the last time next to it. It only counts and looks; one tap takes the tick back.', href: '#/flow/geschafft', words: 'geschafft abgehakt erledigt training woche stunden tage wochenziele vergleich letztes mal rueckgaengig done ticked week hours goals compare last time undo', moment: 'koerper' },
  ],
  howto: { 'f.geschafft': ['Tick an activity on Active; in the message tap «What you did».', 'Read how often this week, the hours and days of the week and the goals still open.', 'Tap «Back to Active», «All numbers of this training» or «Undo».'] },
  handbook: {
    'f.geschafft': {
      on: null,
      steps: ['Tick an activity on Active; in the message tap «What you did».', 'Read how often this week, the hours and days of the week and the goals still open.', 'Tap «Back to Active», «All numbers of this training» or «Undo».'],
      example: 'Example: after a run it says «Time 2 this week», 2:12 h on 3 days and one weekly goal still open.',
    },
  },
  home: { 'f.geschafft': '#/flow/geschafft' },
};
