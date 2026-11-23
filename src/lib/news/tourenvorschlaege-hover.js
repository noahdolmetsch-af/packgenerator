// «Tourenvorschläge: Zahlen beim Hovern, klare Tourlinie, Kartengrund» (Noah 23.11.2026 «mouseover soll gleich wichtigste daten zeigen», «die tourlinie … kaum zu erkennen. mehr kartenvarianten»)
// Eine Datei für den ganzen PR (Version nach Reihenfolge auf main: eine Datei je PR).
export default {
  title: 'Tour suggestions: numbers on the map, a clear line, a choice of map',
  lead: 'Point at a dot on the map and you see km, time and climb. On the page of a tour the line is thick and the map ground is a visible choice.',
  points: [
    { text: 'The mouse over a dot shows a small card with the title, km, time at your pace, climb and the levels; the line of that tour gets thick and the others pale', go: { href: '#/trips/vorschlaege', steps: [{ sel: '[data-vs-view="map"]' }, { sel: '[data-vs-karte]' }], where: 'Trips › Dreams › Tour suggestions, «Map»: point at a dot.' } },
    { text: 'The tour line is thick, orange and framed in white, with big start and end and a number every few km', go: { href: '#/trips/vorschlaege/sm-33', steps: [{ sel: '[data-vs-map]' }], where: 'Trips › Dreams › Tour suggestions › a tour: the map.' } },
    { text: 'Under the map you choose the ground: national map, winter map, aerial photo, OpenStreetMap, cycling map or OpenTopoMap', go: { href: '#/trips/vorschlaege/sm-33', steps: [{ sel: '[data-vs-grounds]' }] } },
  ],
  small: [{ box: 'nicer', text: 'On a phone the first tap on a dot shows the card, the second tap opens the tour', go: null }],
  test: ['Open Trips › Dreams › Tour suggestions › «Map» and point at a dot: a card shows km, time and climb.', 'Open a tour: the line on the map stands out and has numbers (km).', 'Under the map tap «Aerial photo»: the map changes. Tap «Automatic» to go back.'],
  since: [],
  de: {
    'Tour suggestions: numbers on the map, a clear line, a choice of map': 'Tourenvorschläge: Zahlen auf der Karte, eine klare Linie, die Wahl der Karte',
    'Point at a dot on the map and you see km, time and climb. On the page of a tour the line is thick and the map ground is a visible choice.': 'Zeige auf der Karte auf einen Punkt und du siehst km, Zeit und Höhenmeter. Auf der Seite einer Tour ist die Linie dick und der Kartengrund eine sichtbare Wahl.',
    'The mouse over a dot shows a small card with the title, km, time at your pace, climb and the levels; the line of that tour gets thick and the others pale': 'Die Maus über einem Punkt zeigt eine kleine Karte mit Titel, km, Zeit in deinem Tempo, Höhenmetern und den Stufen; die Linie dieser Tour wird dick und die anderen werden blass',
    'Trips › Dreams › Tour suggestions, «Map»: point at a dot.': 'Touren › Träume › Tourenvorschläge, «Karte»: zeige auf einen Punkt.',
    'On a phone the first tap on a dot shows the card, the second tap opens the tour': 'Am Handy zeigt der erste Tipp auf einen Punkt die Karte, der zweite öffnet die Tour',
    'The tour line is thick, orange and framed in white, with big start and end and a number every few km': 'Die Tourlinie ist dick, orange und weiss eingerahmt, mit grossem Start und Ziel und einer Zahl alle paar km',
    'Trips › Dreams › Tour suggestions › a tour: the map.': 'Touren › Träume › Tourenvorschläge › eine Tour: die Karte.',
    'Under the map you choose the ground: national map, winter map, aerial photo, OpenStreetMap, cycling map or OpenTopoMap': 'Unter der Karte wählst du den Grund: Landeskarte, Winterkarte, Luftbild, OpenStreetMap, Velokarte oder OpenTopoMap',
    'Open Trips › Dreams › Tour suggestions › «Map» and point at a dot: a card shows km, time and climb.': 'Öffne Touren › Träume › Tourenvorschläge › «Karte» und zeige auf einen Punkt: eine Karte zeigt km, Zeit und Höhenmeter.',
    'Open a tour: the line on the map stands out and has numbers (km).': 'Öffne eine Tour: die Linie auf der Karte fällt auf und hat Zahlen (km).',
    'Under the map tap «Aerial photo»: the map changes. Tap «Automatic» to go back.': 'Tippe unter der Karte «Luftbild»: die Karte ändert sich. Tippe «Automatisch», um zurückzugehen.',
  },
};
