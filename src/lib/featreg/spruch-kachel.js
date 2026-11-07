// «Spruch zum Einstieg» PR 1 (Noah 07.11.2026 «Bau spruch pr1»): the tile «Saying» on Today. Its home is Heute (#/).
export default {
  features: [
    { id: 'f.spruch', group: 'data', title: 'Saying|tile', text: 'One short sentence on Today in Bernese German, built from your own numbers: weather, zone minutes, sleep and resting pulse, your next trip. A new one at each start, «New saying» gives the next, «Why?» shows the number behind it.', href: '#/', words: 'spruch motivation einstieg heute kachel berndeutsch mundart satz zonenminuten wetter schlaf ruhepuls tour', moment: 'app' },
  ],
  howto: { 'f.spruch': ['Open Today.', 'Read the tile «Saying».', 'Tap «Why?» to see the number behind it, «New saying» for the next.'] },
  handbook: {
    'f.spruch': {
      on: null,
      steps: ['Look at the tile «Saying» on Today (under the card «Your moment»).', 'Tap «Why?» to see the number behind the sentence.', 'Tap «New saying» for the next one.'],
      example: 'Example: 73 of 150 zone minutes → a sentence about the rest of the week.',
    },
  },
  home: { 'f.spruch': '#/' },
};
