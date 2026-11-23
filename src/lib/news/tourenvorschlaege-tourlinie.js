// «Tourenvorschläge: Tourlinie und Kartengrund» (Noah 23.11.2026 «die tourlinie … kaum zu erkennen. mehr kartenvarianten»)
export default {
  title: 'Tour suggestions: a clear line and a choice of map',
  lead: 'On the page of a suggested tour the line is thick and strongly coloured, with km marks, and the map ground is a visible choice.',
  points: [
    { text: 'The tour line is thick, orange and framed in white, with big start and end and a number every few km', go: { href: '#/trips/vorschlaege/sm-33', steps: [{ sel: '[data-vs-map]' }], where: 'Trips › Dreams › Tour suggestions › a tour: the map.' } },
    { text: 'Under the map you choose the ground: national map, winter map, aerial photo, OpenStreetMap, cycling map or OpenTopoMap', go: { href: '#/trips/vorschlaege/sm-33', steps: [{ sel: '[data-vs-grounds]' }] } },
  ],
  small: [],
  test: ['Open a tour in Tour suggestions: the line on the map stands out and has numbers (km).', 'Under the map tap «Aerial photo»: the map changes. Tap «Automatic» to go back.'],
  since: [],
  de: {
    'Tour suggestions: a clear line and a choice of map': 'Tourenvorschläge: eine klare Linie und die Wahl der Karte',
    'On the page of a suggested tour the line is thick and strongly coloured, with km marks, and the map ground is a visible choice.': 'Auf der Seite einer vorgeschlagenen Tour ist die Linie dick und kräftig gefärbt, mit km-Marken, und der Kartengrund ist eine sichtbare Wahl.',
    'The tour line is thick, orange and framed in white, with big start and end and a number every few km': 'Die Tourlinie ist dick, orange und weiss eingerahmt, mit grossem Start und Ziel und einer Zahl alle paar km',
    'Trips › Dreams › Tour suggestions › a tour: the map.': 'Touren › Träume › Tourenvorschläge › eine Tour: die Karte.',
    'Under the map you choose the ground: national map, winter map, aerial photo, OpenStreetMap, cycling map or OpenTopoMap': 'Unter der Karte wählst du den Grund: Landeskarte, Winterkarte, Luftbild, OpenStreetMap, Velokarte oder OpenTopoMap',
    'Open a tour in Tour suggestions: the line on the map stands out and has numbers (km).': 'Öffne in den Tourenvorschlägen eine Tour: die Linie auf der Karte fällt auf und hat Zahlen (km).',
    'Under the map tap «Aerial photo»: the map changes. Tap «Automatic» to go back.': 'Tippe unter der Karte «Luftbild»: die Karte ändert sich. Tippe «Automatisch», um zurückzugehen.',
  },
};
