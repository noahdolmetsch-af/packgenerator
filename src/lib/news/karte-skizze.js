// «Karte der App» als Skizze (Noah 23.11.2026 «1a 2b 3a 4a 5a», Schritte 1 und 4): die Orte der Leiste, jede Seite ein Punkt, Filter «Noch nie geöffnet»
export default {
  title: 'The map of the app as a sketch',
  lead: 'The map shows the places of the bar with every page as a point, and what you have not opened yet.',
  points: [
    { text: 'Every page is a point: filled if you opened it, a ring if never, a star if new', go: { href: '#/me/karte', steps: [{ sel: '[data-am-point]' }], where: 'Me › Map of the app, or «All areas» at the end of Today.' } },
    { text: 'The filter «Never opened» shows what you do not know yet', go: { href: '#/me/karte', steps: [{ sel: '[data-am-filter="never"]' }], where: 'Me › Map of the app › Never opened.' } },
  ],
  small: [{ box: 'new', text: '«All areas» at the end of Today leads to the map; the catalogue is one tap further' }, { box: 'new', text: 'The search names the place of a page like the bar does, for example Analysis › Rides for the milestones' }],
  test: ['Open Me › Map of the app: the places of the bar, each with its pages as points.', 'Tap «Never opened»: only the pages you have not opened stay.', 'Open a page from a point, come back: its point is filled.'],
  since: [],
  de: {
    'The map of the app as a sketch': 'Die Karte der App als Skizze',
    'The map shows the places of the bar with every page as a point, and what you have not opened yet.': 'Die Karte zeigt die Orte der Leiste mit jeder Seite als Punkt und was du noch nicht geöffnet hast.',
    'Every page is a point: filled if you opened it, a ring if never, a star if new': 'Jede Seite ist ein Punkt: gefüllt, wenn du sie geöffnet hast, ein Ring, wenn noch nie, ein Stern, wenn neu',
    'Me › Map of the app, or «All areas» at the end of Today.': 'Ich › Karte der App oder «Alle Bereiche» am Ende von Heute.',
    'The filter «Never opened» shows what you do not know yet': 'Der Filter «Noch nie geöffnet» zeigt, was du noch nicht kennst',
    'Me › Map of the app › Never opened.': 'Ich › Karte der App › Noch nie geöffnet.',
    '«All areas» at the end of Today leads to the map; the catalogue is one tap further': '«Alle Bereiche» am Ende von Heute führt zur Karte; der Katalog ist einen Tipp weiter',
    'The search names the place of a page like the bar does, for example Analysis › Rides for the milestones': 'Die Suche nennt den Ort einer Seite wie die Leiste, zum Beispiel Auswerten › Fahrten für die Meilensteine',
    'Open Me › Map of the app: the places of the bar, each with its pages as points.': 'Öffne Ich › Karte der App: die Orte der Leiste, jeder mit seinen Seiten als Punkten.',
    'Tap «Never opened»: only the pages you have not opened stay.': 'Tippe auf «Noch nie geöffnet»: nur die Seiten bleiben, die du noch nicht geöffnet hast.',
    'Open a page from a point, come back: its point is filled.': 'Öffne eine Seite über einen Punkt und komm zurück: ihr Punkt ist gefüllt.',
  },
};
