// «Lange Wörter überall umbrechen» (Noah «2a», Durchklick Etappe 3): one rule on the page ground, not one per page
export default {
  title: 'Long words break everywhere',
  lead: 'A name or a note of one very long word is broken at the edge on every page.',
  points: [{ text: 'Very long words no longer push a page sideways', go: { href: '#/', where: 'Every page.' } }],
  small: [],
  test: ['Open Trips › Packing and write one very long word without spaces as a note: the page stays as wide as the screen.', 'Do the same with the name of a gear item: the line breaks at the edge.'],
  since: [],
  de: {
    'Long words break everywhere': 'Lange Wörter brechen überall um',
    'A name or a note of one very long word is broken at the edge on every page.': 'Ein Name oder eine Notiz aus einem sehr langen Wort wird auf jeder Seite am Rand umgebrochen.',
    'Very long words no longer push a page sideways': 'Sehr lange Wörter schieben eine Seite nicht mehr zur Seite',
    'Every page.': 'Jede Seite.',
    'Open Trips › Packing and write one very long word without spaces as a note: the page stays as wide as the screen.': 'Öffne Touren › Packen und schreibe ein sehr langes Wort ohne Leerzeichen als Notiz: Die Seite bleibt so breit wie der Bildschirm.',
    'Do the same with the name of a gear item: the line breaks at the edge.': 'Mach dasselbe mit dem Namen eines Materialteils: Die Zeile bricht am Rand um.',
  },
};
