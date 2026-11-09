// «Fragen» (Plan «ganze App», Schritt 4a, Noah 08.11.2026 «D b»): der erste Reiter in Auswerten, sechs Fragen mit Antwort in einem Satz
export default {
  features: [
    { id: 'f.fragen', group: 'data', title: 'Questions about my data', text: 'Six questions about your own data, each answered in one sentence with the number and its limit: resting pulse, speed, your last tour, sleep after a ride, what is due on your bikes and this year against last. With too little data it says so and does not guess.', href: '#/auswerten/fragen', words: 'fragen daten antwort satz ruhepuls schneller tour schlaf velo fällig jahr vergleich beobachtung questions answers sentence resting pulse faster sleep due year', moment: 'app' },
  ],
  howto: { 'f.fragen': ['Open Analysis and tap the first tab «Questions».', 'Read the answer under a question: one sentence with the number and its limit.', 'Tap «Why? How it was counted» or «More about this» to see the numbers behind it.'] },
  handbook: {
    'f.fragen': {
      on: null,
      steps: ['Open Analysis and tap the first tab «Questions».', 'Read the answer under a question: one sentence with the number and its limit.', 'Tap «Why? How it was counted» or «More about this» to see the numbers behind it.'],
      example: 'Example: «In the last 90 days you ride 1.2 km/h faster on average than in the 90 days before.»',
    },
  },
  home: { 'f.fragen': '#/auswerten/fragen' },
};
