// «Erwartung und Erlebnis» (Noah 04.11.2026 «1a», Persönliches Lernen Idee 1)
export default {
  features: [
    { id: 'f.expectfelt', group: 'before', title: 'How hard will it be?', text: 'Guess how hard a bike tour will be, from 1 to 10. After the ride the tour page puts your guess next to how it felt, and from three tours on says whether your guesses lean one way.', href: '#/pack', words: 'erwartung erlebnis schätzen anstrengend gefühlte anstrengung vorher nachher vergleich realistisch planen lernen', moment: 'planen' },
  ],
  howto: { 'f.expectfelt': ['Open a bike tour in Planen: «How hard will it be?».', 'Tap a number from 1 to 10 before you go.', 'After the ride the tour page shows your guess next to how it felt.'] },
  handbook: {
    'f.expectfelt': {
      on: 'Needs a bike tour. After the ride, the answer to «How hard was your ride?» (own or from Strava).',
      steps: ['Open a bike tour in Planen and tap a number under «How hard will it be?».', 'After the ride say how it felt on the tour page, or under Aktiv › Training.', 'The tour page shows both side by side; from three tours on also whether your guesses lean one way.'],
      example: 'Example: guessed 5, felt 7 → «2 points harder than you guessed». Only a description, never a reason.',
    },
  },
  home: { 'f.expectfelt': '#/pack' },
};
