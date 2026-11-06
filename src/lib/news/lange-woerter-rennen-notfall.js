// «Lange Wörter» (Durchklick Etappe 3, E3-004 und E3-005): a very long word in a race name or on the emergency card is broken at the edge
export default {
  title: 'Long words in race names and the emergency card',
  lead: 'A race name or an emergency-card line of one very long word no longer pushes the page sideways.',
  points: [
    { text: 'The title of a race breaks at the edge of the screen', go: { href: '#/race', where: 'Trips › Races, open a race.' } },
    { text: 'The preview of the emergency card breaks a very long name', go: { href: '#/mountain/qr', where: 'Mountain › Emergency card, next to the QR code.' } },
  ],
  small: [],
  test: ['Open Trips › Races and make a race with one very long word as its name: the page stays as wide as the screen.', 'Open Mountain › Emergency card and type one very long word as the name: the page stays as wide as the screen.'],
  since: [],
  de: {
    'Long words in race names and the emergency card': 'Lange Wörter in Rennnamen und Notfallkarte',
    'A race name or an emergency-card line of one very long word no longer pushes the page sideways.': 'Ein Rennname oder eine Zeile der Notfallkarte aus einem sehr langen Wort schiebt die Seite nicht mehr zur Seite.',
    'The title of a race breaks at the edge of the screen': 'Der Titel eines Rennens bricht am Bildschirmrand um',
    'Trips › Races, open a race.': 'Touren › Rennen, öffne ein Rennen.',
    'The preview of the emergency card breaks a very long name': 'Die Vorschau der Notfallkarte bricht einen sehr langen Namen um',
    'Mountain › Emergency card, next to the QR code.': 'Berg › Notfallkarte, neben dem QR-Code.',
    'Open Trips › Races and make a race with one very long word as its name: the page stays as wide as the screen.': 'Öffne Touren › Rennen und lege ein Rennen mit einem sehr langen Wort als Namen an: Die Seite bleibt so breit wie der Bildschirm.',
    'Open Mountain › Emergency card and type one very long word as the name: the page stays as wide as the screen.': 'Öffne Berg › Notfallkarte und schreibe ein sehr langes Wort als Namen: Die Seite bleibt so breit wie der Bildschirm.',
  },
};
