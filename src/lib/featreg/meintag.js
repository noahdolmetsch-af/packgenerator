// «Mein Tag» (Noah 23.11.2026 «ja», «freigabe», «1a 2a 3a»): one day as a timeline, step 1 «Tag lesen»
export default {
  features: [
    { id: 'f.meintag', group: 'active', title: 'My day', text: 'One day as a timeline: sessions, dates, to-dos, trips and holidays with their time, the weather of the day and what has no time yet. It shows what Woche, Today and Tick off show, nothing is stored twice.', href: '#/day', words: 'mein tag tagesplan zeitleiste tag plan heute stunden uhrzeit tagesübersicht', moment: 'planen' },
  ],
  howto: { 'f.meintag': ['Open Plan › Week and tap the chip «My day».', 'Pick a day above; read the timeline, what has no time stands above it.', 'Tap an entry to open it where it lives; your own dates and to-dos open a small window to change or delete them.', 'Tap «Add an entry» to plan something, drag the grip of your own entry to another time or onto another day, drag its lower edge for the length.'] },
  handbook: {
    'f.meintag': {
      on: null,
      steps: ['Open Plan › Week and tap the chip «My day».', 'Pick a day above; read the timeline, what has no time stands above it.', 'Tap an entry to open it where it lives; your own dates and to-dos open a small window to change or delete them.', 'Tap «Add an entry» to plan something, drag the grip of your own entry to another time or onto another day, drag its lower edge for the length.'],
      example: 'Example: 07:00 yoga, 12:00 dentist, 17:30 shopping, and «Call the garage» without a time above the timeline.',
    },
  },
  home: { 'f.meintag': '#/day' },
};
