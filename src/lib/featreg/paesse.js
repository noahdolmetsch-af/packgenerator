// «Pässe sammeln» (Noah 03.11.2026 «E und F», Paket E, Idee 24)
export default {
  features: [
    { id: 'f.passes', group: 'after', title: 'Passes', text: 'The passes you rode over as yellow signs with height and day; rides suggest them, you collect them, add your own, change and remove them.', href: '#/debrief/paesse', words: 'pässe sammeln pass passschild gelb schild furka grimsel gotthard susten nufenen sammlung höhe col alpen', moment: 'zurueck' },
  ],
  howto: { 'f.passes': ['Open Trips › Look back › Passes.', 'Tap «Collect» at a suggested pass, or «Add a pass» for one of your own.', 'The yellow sign with name, height and day is in your collection.'] },
  handbook: {
    'f.passes': {
      on: null,
      steps: ['Open Trips › Look back › Passes.', 'Tap «Collect» at a suggested pass, or «Add a pass» for one of your own.', 'The yellow sign with name, height and day is in your collection.'],
      example: 'Example: a ride over the Furka → «Furka, 2429 m, 4 July» as a yellow sign.',
    },
  },
  home: { 'f.passes': '#/debrief/paesse' },
};
