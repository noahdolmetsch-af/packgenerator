// «Mein Tag» (Noah 23.11.2026 «ja», «freigabe», «1a 2a 3a»): one day as a timeline, step 1 «Tag lesen»
export default {
  features: [
    { id: 'f.meintag', group: 'active', title: 'My day', text: 'One day as a timeline: sessions, dates, to-dos, trips and holidays with their time, the weather of the day and what has no time yet. It shows what Woche, Today and Tick off show, nothing is stored twice.', href: '#/day', words: 'mein tag tagesplan zeitleiste tag plan heute stunden uhrzeit tagesübersicht', moment: 'planen' },
    { id: 'f.meintodos', group: 'active', title: 'My to-dos', text: 'All open to-dos in one list on «My day»: late, today, this week, later and without a date. Write one, tick it off, give it a day or change and delete it. It shows the to-dos of Remember and the ones you put on a day, nothing is copied.', href: '#/day/todos', words: 'to-dos todo aufgaben liste offene erledigen abhaken merken tag verschieben mein tag', moment: 'planen' },
  ],
  howto: {
    'f.meintodos': ['Open «My day» and tap «To-dos».', 'Write a to-do and press Enter; tap the circle to tick it off.', 'Tap «Today» to move it to today; tap its words to change or delete it.'],
    'f.meintag': ['Open Plan › Week and tap the chip «My day».', 'Pick a day. «Add an entry» plans; tap an entry to open it, or change your own.', 'Drag your own entry by its grip to a new time or day; its lower edge sets the length.'] },
  handbook: {
    'f.meintodos': {
      on: null,
      steps: ['Open «My day» and tap «To-dos».', 'Write a to-do and press Enter; tap the circle to tick it off.', 'Tap «Today» to move it to today; tap its words to change or delete it.'],
      example: 'Example: «Call the garage» without a date waits in the list; on Friday you tap «Today» and tick it off in the evening.',
    },
    'f.meintag': {
      on: null,
      steps: ['Open Plan › Week and tap the chip «My day».', 'Pick a day. «Add an entry» plans; tap an entry to open it, or change your own.', 'Drag your own entry by its grip to a new time or day; its lower edge sets the length.'],
      example: 'Example: 07:00 yoga, 12:00 dentist, 17:30 shopping, and «Call the garage» without a time above the timeline.',
    },
  },
  home: { 'f.meintag': '#/day', 'f.meintodos': '#/day/todos' },
};
