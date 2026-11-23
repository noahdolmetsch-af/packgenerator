// «Mein Tag» (Noah 23.11.2026 «ja», «freigabe»): step 1, one day as a timeline that only reads
export default {
  title: 'My day',
  lead: 'A new page shows one day as a timeline, made from what you already planned.',
  points: [
    { text: 'Plan › Week › «My day»: sessions, dates, to-dos and trips of a day with their time', go: 'f.meintag' },
    { text: 'What has no time yet stands above the timeline; a tap opens an entry where it lives', go: 'f.meintag' },
  ],
  test: ['Open Plan › Week and tap the chip «My day»: today as a timeline.', 'Tap another day above: its entries stand with their time.', 'Tap an entry: it opens where it lives.'],
  since: ['f.meintag'],
  de: {
    'My day': 'Mein Tag',
    'A new page shows one day as a timeline, made from what you already planned.': 'Eine neue Seite zeigt einen Tag als Zeitleiste, gemacht aus dem, was du schon geplant hast.',
    'Plan › Week › «My day»: sessions, dates, to-dos and trips of a day with their time': 'Planen › Woche › «Mein Tag»: Einheiten, Termine, To-dos und Touren eines Tages mit ihrer Zeit',
    'What has no time yet stands above the timeline; a tap opens an entry where it lives': 'Was noch keine Zeit hat, steht über der Zeitleiste; ein Tipp öffnet einen Eintrag dort, wo er lebt',
    'Open Plan › Week and tap the chip «My day»: today as a timeline.': 'Öffne Planen › Woche und tippe auf «Mein Tag»: heute als Zeitleiste.',
    'Tap another day above: its entries stand with their time.': 'Tippe oben auf einen anderen Tag: seine Einträge stehen mit ihrer Zeit da.',
    'Tap an entry: it opens where it lives.': 'Tippe einen Eintrag an: er öffnet sich dort, wo er lebt.',
  },
};
