// «Tourenpass mit Stempel» (Noah 03.11.2026 «E und F», Paket E, Idee 18)
export default {
  features: [
    { id: 'f.tourpass', group: 'after', title: 'Tour pass with stamps', text: 'After the look back of a trip the app offers a stamp with place, day and km for your tour pass; over time a collection. Add your own, change and remove them.', href: '#/debrief/tourenpass', words: 'tourenpass stempel stempeln pass sammlung abstempeln stamp ort tour erinnerung', moment: 'zurueck' },
  ],
  howto: { 'f.tourpass': ['Save the look back of a trip.', 'Tap «Stamp» in the box «A stamp for your tour pass?» (change the place if you like).', 'Open Trips › Look back › Tour pass: the stamp is in your collection.'] },
  handbook: {
    'f.tourpass': {
      on: null,
      steps: ['Save the look back of a trip.', 'Tap «Stamp» in the box «A stamp for your tour pass?» (change the place if you like).', 'Open Trips › Look back › Tour pass: the stamp is in your collection.'],
      example: 'Example: «Test Pass Loop», 12 Oct 2026, 84 km as a round green stamp.',
    },
  },
  home: { 'f.tourpass': '#/debrief/tourenpass' },
};
