// «Sammel-Wand» (Neuer Schwung, Idee F, Noah 05.11.2026 «A, B, F und G jetzt»)
export default {
  features: [
    { id: 'f.collectwall', group: 'after', title: 'Collection wall', text: 'Stamps, passes, summits, new ground and stars on one page: a few of each and what was added lately. Only to look at, with no goal and no count of what is missing; every shelf is changed where it lives.', href: '#/debrief/sammlung', words: 'sammel wand sammlung sammeln stempel pässe gipfel gipfelbuch neuland sterne übersicht alles gesammelt trophäen vitrine regal', moment: 'zurueck' },
  ],
  howto: { 'f.collectwall': ['Open Trips › Look back › Collection wall.', 'Look at «Added lately» and the shelves: tour pass, passes, summit book, new ground, stars.', 'Tap «All» on a shelf to open its full list and change things there.'] },
  handbook: {
    'f.collectwall': {
      on: null,
      steps: ['Open Trips › Look back › Collection wall.', 'Read the numbers on top and «Added lately»; each one leads to its list.', 'Tap «All» on a shelf to add, change or remove things in the place where they live.'],
      example: 'Example: 3 stamps, 2 passes (Furka, 2429 m), 1 summit and 14 municipalities on one page.',
    },
  },
  home: { 'f.collectwall': '#/debrief/sammlung' },
};
