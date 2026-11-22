// «KI entfernen, Schritt 7» (Noah 20.11.2026 «a»): die Seite «KI-Helfer» mit Helfer-Code, Limit und Modell ist weg
export default {
  title: 'The page «AI helper» is gone',
  lead: 'No helper code, no monthly limit, no «Helper» tile: everything that asked Claude through the helper is removed.',
  points: [
    { text: 'Me has no row «AI helper» any more, and the menu, the search and «What is coming» no longer list it', go: null },
    { text: 'The tile «Helper» is gone from Today and from the catalog of tiles; an old wall that still held it shows without it', go: null },
    { text: 'The week in review has no card «Copy for Claude» any more', go: { href: '#/flow/review', where: 'Active › Week › Week in review.' } },
  ],
  small: [],
  test: [
    'Open Me: no row «AI helper» between Language and Search.',
    'Open Today › «Add a tile»: no tile «Helper» in the catalog.',
    'Open Active › Week › Week in review: the numbers, the strip and the highlights show, no card «Copy for Claude».',
  ],
  since: [],
  de: {
    'The page «AI helper» is gone': 'Die Seite «KI-Helfer» ist weg',
    'No helper code, no monthly limit, no «Helper» tile: everything that asked Claude through the helper is removed.': 'Kein Helfer-Code, kein Monatslimit, keine Kachel «Helfer»: alles, was über den Helfer bei Claude nachfragte, ist entfernt.',
    'Me has no row «AI helper» any more, and the menu, the search and «What is coming» no longer list it': 'In Ich gibt es keine Zeile «KI-Helfer» mehr, und das Menü, die Suche und «Was kommt» führen sie nicht mehr auf',
    'The tile «Helper» is gone from Today and from the catalog of tiles; an old wall that still held it shows without it': 'Die Kachel «Helfer» ist von Heute und aus dem Katalog der Kacheln verschwunden; eine alte Wand, die sie noch hatte, zeigt sie nicht mehr',
    'The week in review has no card «Copy for Claude» any more': 'Der Wochenrückblick hat keine Karte «Kopieren für Claude» mehr',
    'Active › Week › Week in review.': 'Aktiv › Woche › Wochenrückblick.',
    'Open Me: no row «AI helper» between Language and Search.': 'Öffne Ich: keine Zeile «KI-Helfer» zwischen Sprache und Suche.',
    'Open Today › «Add a tile»: no tile «Helper» in the catalog.': 'Öffne Heute › «Kachel hinzufügen»: keine Kachel «Helfer» im Katalog.',
    'Open Active › Week › Week in review: the numbers, the strip and the highlights show, no card «Copy for Claude».': 'Öffne Aktiv › Woche › Wochenrückblick: die Zahlen, der Streifen und die Höhepunkte zeigen sich, keine Karte «Kopieren für Claude».',
  },
};
