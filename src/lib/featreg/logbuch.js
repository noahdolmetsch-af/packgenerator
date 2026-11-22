// «Verbesserungs-Logbuch» (Noah 21.11.2026 «freigabe», Thread «Neue Verbesserungen finden», Schritt L1): Ich › Logbuch
export default {
  features: [
    { id: 'f.logbuch', group: 'data', title: 'Improvement log', text: 'Write down what bothers you or is missing in the app, right where you see it: tap «Improve» on any page, tap the block, pick the kind and say or write one sentence. Page, block, time and device are kept with it. «Copy the order» makes one text of the open entries for the chat. «Kinds and groups» lets you rename the kinds and put them in your order. Stays on this device and goes into your backup.', href: '#/me/logbuch', words: 'logbuch verbessern nervt fehlt fehler text hinweis erklärung anordnung layout idee merker notiz', moment: 'app' },
  ],
  howto: { 'f.logbuch': ['Tap «Improve» on a page, then the block you mean, and write one sentence.', 'Open Me › Improvement log: filter by group, tap «Done» when it is changed.', 'Tap «Copy the order» and paste the text in the chat.'] },
  handbook: {
    'f.logbuch': {
      on: null,
      steps: ['Tap «Improve» on a page, then the block you mean, and write one sentence.', 'Open Me › Improvement log: filter by group, tap «Done» when it is changed.', 'Tap «Copy the order» and paste the text in the chat.'],
      example: 'Example: «Improve» on the training page, block «Week 47», kind «Change text».',
    },
  },
  home: { 'f.logbuch': '#/me/logbuch' },
};
