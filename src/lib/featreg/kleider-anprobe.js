// «Anprobe» (Noah 21.11.2026 «1-5a 4b», Thread «Kleiderschrank wieder ins Zentrum rücken», Weg A)
export default {
  features: [
    { id: 'f.wardrobetryon', group: 'before', title: 'Try on', text: 'Pick a temperature, today, your next tour or your own, and see which piece of your wardrobe the onion takes for each place; swap with the arrows and pack it for the tour.', href: '#/wardrobe/tryon', words: 'anprobe kleiderschrank kleider anprobieren temperatur zwiebel tauschen packen schicht kälte regen', moment: 'packen' },
  ],
  howto: { 'f.wardrobetryon': ['Open the wardrobe and tap «Try on» at the end of the page.', 'Pick today, your tour or your own temperature; the pieces for every place appear.', 'Swap a piece with the arrows, then tap «Pack it for the tour».'] },
  handbook: {
    'f.wardrobetryon': {
      on: 'Needs clothing with a temperature, layer and body zone.',
      steps: ['Open the wardrobe and tap «Try on» at the end of the page.', 'Pick today, your tour or your own temperature; the pieces for every place appear.', 'Swap a piece with the arrows, then tap «Pack it for the tour».'],
      example: 'Example: at 5 °C the onion takes the rain jacket and the leg warmers; the hands show a gap, no glove is warm enough.',
    },
  },
  home: { 'f.wardrobetryon': '#/wardrobe/tryon' },
};
