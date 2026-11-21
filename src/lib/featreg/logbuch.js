// «Verbesserungs-Logbuch» (Noah 21.11.2026 «freigabe», Thread «Neue Verbesserungen finden», Schritt L1): Ich › Logbuch
export default {
  features: [
    { id: 'f.logbuch', group: 'data', title: 'Improvement log', text: 'Write down what bothers you or is missing in the app, with the kind, how urgent it is and the page: a wrong text, a missing hint, a block in the wrong place. Stays on this device and goes into your backup.', href: '#/me/logbuch', words: 'logbuch verbessern nervt fehlt fehler text hinweis erklärung anordnung layout idee merker notiz', moment: 'app' },
  ],
  howto: { 'f.logbuch': ['Open Me and tap «Improvement log».', 'Tap «New entry», pick a kind and write one sentence.', 'Filter by group, tap «Done» when it is changed, or «Change» to edit it.'] },
  handbook: {
    'f.logbuch': {
      on: null,
      steps: ['Open Me and tap «Improvement log».', 'Tap «New entry», pick a kind and write one sentence.', 'Filter by group, tap «Done» when it is changed, or «Change» to edit it.'],
      example: 'Example: kind «Change text», page #/flow/training, block «Week 47»: «Instead of 4 blocks of 12 min it should say 4 × 12 min.»',
    },
  },
  home: { 'f.logbuch': '#/me/logbuch' },
};
