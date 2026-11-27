// «Wertliste» (Warteliste 7; Noah 22.11.2026 «1-5 a»): all velos and gear with their price, as a PDF for the insurance
export default {
  features: [
    { id: 'f.wertliste', group: 'bike', title: 'List of values', text: 'All your velos and your gear with their price on one page, as a PDF for the insurance; add missing prices right in the list.', href: '#/gear/wertliste', words: 'wertliste versicherung inventar preis velos material pdf diebstahl neupreis kaufpreis schaden', moment: 'velo' },
  ],
  howto: { 'f.wertliste': ['Open the theft sheet of a bike and tap «List of values», or Gear › List of values.', 'Un-tick what you do not want, filter «Only above CHF 50» and type the missing prices.', 'Tap «Make PDF», then «Share or save»; a copy is kept in Me › Documents › Insurance.'] },
  handbook: {
    'f.wertliste': {
      on: 'Needs velos or gear; prices are typed in the list.',
      steps: ['Open the theft sheet of a bike and tap «List of values», or Gear › List of values.', 'Un-tick what you do not want, filter «Only above CHF 50» and type the missing prices.', 'Tap «Make PDF», then «Share or save»; a copy is kept in Me › Documents › Insurance.'],
      example: 'Example: 3 velos and 41 pieces of gear, CHF 9 480, 5 without a price; the PDF names them and says «price paid, not the current value».',
    },
  },
  home: { 'f.wertliste': '#/gear/wertliste' },
};
