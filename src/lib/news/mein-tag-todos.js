// «Mein Tag» (Noah 23.11.2026 «dreimal ja»): step 3, the tab «To-dos»
export default {
  title: 'Your to-dos on My day',
  lead: '«My day» has a second tab: all open to-dos in one list.',
  points: [
    { text: 'Tap «To-dos» on «My day»: late, today, this week, later and without a date, with the to-dos of Remember and the ones you put on a day', go: 'f.meintodos' },
    { text: 'Write a to-do and press Enter, tick it off, give it «Today», change or delete it, each with «Undo»', go: 'f.meintodos' },
  ],
  since: ['f.meintodos'],
  test: ['Open Plan › Week › «My day» and tap «To-dos».', 'Write «Call the garage» and press Enter: it appears under «Without date».', 'Tap «Today» next to it: it moves to «Today». Tap the circle: it is ticked off and «Undo» brings it back.'],
  de: {
    'Your to-dos on My day': 'Deine To-dos auf Mein Tag',
    '«My day» has a second tab: all open to-dos in one list.': '«Mein Tag» hat einen zweiten Reiter: alle offenen To-dos in einer Liste.',
    'Tap «To-dos» on «My day»: late, today, this week, later and without a date, with the to-dos of Remember and the ones you put on a day': 'Tippe auf «Mein Tag» «To-dos»: überfällig, heute, diese Woche, später und ohne Datum, mit den To-dos aus Merken und denen, die du auf einen Tag legst',
    'Write a to-do and press Enter, tick it off, give it «Today», change or delete it, each with «Undo»': 'Schreib ein To-do und drücke Enter, hake es ab, gib ihm «Heute», ändere oder lösche es, jedes mit «Rückgängig»',
    'Open Plan › Week › «My day» and tap «To-dos».': 'Öffne Planen › Woche › «Mein Tag» und tippe «To-dos».',
    'Write «Call the garage» and press Enter: it appears under «Without date».': 'Schreib «Garage anrufen» und drücke Enter: es steht unter «Ohne Datum».',
    'Tap «Today» next to it: it moves to «Today». Tap the circle: it is ticked off and «Undo» brings it back.': 'Tippe daneben «Heute»: es rutscht nach «Heute». Tippe den Kreis: es ist abgehakt, und «Rückgängig» holt es zurück.',
  },
};
