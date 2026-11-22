// «Geschafft» (Noah 19.11.2026 «1-5a», Thread «Training erfassen vereinfachen», T1 und T2): die Seite nach dem Abhaken
export default {
  features: [
    { id: 'f.geschafft', group: 'active', title: 'Done page', text: 'After you tick something, this page shows what you did, how often this week, the week in hours and days, the weekly goals still open and, with Strava numbers, the last time next to it. On Active a tap on a tile ticks and opens it; duration and feeling are optional chips. It only counts and looks; one tap takes the tick back.', href: '#/flow/geschafft', words: 'geschafft abgehakt erledigt training woche stunden tage wochenziele vergleich letztes mal rueckgaengig dauer gefuehl leicht gut hart duration feeling done ticked week hours goals compare last time undo', moment: 'koerper' },
  ],
  howto: { 'f.geschafft': ['Tap a tile on Active: it ticks and this page opens.', 'Choose the duration and how it was, if you like; both are optional.', 'Tap «Back to Active», «All numbers of this training» or «Undo».'] },
  handbook: {
    'f.geschafft': {
      on: null,
      steps: ['Tap a tile on Active: it ticks and this page opens.', 'Choose the duration and how it was, if you like; both are optional.', 'Tap «Back to Active», «All numbers of this training» or «Undo».'],
      example: 'Example: tap «Run», pick 45 min and «good»: «Time 2 this week», 2:12 h on 3 days.',
    },
  },
  home: { 'f.geschafft': '#/flow/geschafft' },
};
