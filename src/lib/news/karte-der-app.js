// «Pfad auf jeder Seite» Schritt 5 (Noah 28.10.2026 «1a und c und d alle»): Map of the app
export default {
  title: 'Map of the app',
  lead: 'One page shows every place of the app with its functions and their path.',
  points: [
    { text: 'Me › Map of the app lists the places (Trips, Gear, Bikes, Active, Me) and under each one its functions, with the path place › function', go: { href: '#/me/karte', steps: [{ sel: '[data-appmap]' }] } },
    { text: 'The search narrows the map; a tap on a line goes to that function', go: { href: '#/me/karte' } },
  ],
  small: [{ box: 'new', text: 'The map is made from the catalogue, so a new function appears on it by itself' }],
  test: ['Open Me › Map of the app: the places are listed with the number of their functions.', 'Type «backup» in the search: the matching lines show their path. Tap one to go there.'],
  since: ['f.appmap'],
  de: {
    'Map of the app': 'Karte der App',
    'One page shows every place of the app with its functions and their path.': 'Eine Seite zeigt jeden Bereich der App mit seinen Funktionen und deren Pfad.',
    'Me › Map of the app lists the places (Trips, Gear, Bikes, Active, Me) and under each one its functions, with the path place › function': 'Ich › Karte der App listet die Bereiche (Touren, Ausrüstung, Velos, Aktiv, Ich) und darunter ihre Funktionen, mit dem Pfad Bereich › Funktion',
    'The search narrows the map; a tap on a line goes to that function': 'Die Suche grenzt die Karte ein; ein Tipp auf eine Zeile führt zu dieser Funktion',
    'The map is made from the catalogue, so a new function appears on it by itself': 'Die Karte entsteht aus dem Katalog, eine neue Funktion erscheint also von selbst darauf',
    'Open Me › Map of the app: the places are listed with the number of their functions.': 'Öffne Ich › Karte der App: Die Bereiche stehen mit der Zahl ihrer Funktionen da.',
    'Type «backup» in the search: the matching lines show their path. Tap one to go there.': 'Tippe «Backup» in die Suche: Die passenden Zeilen zeigen ihren Pfad. Tippe auf eine, um dorthin zu gehen.',
  },
};
