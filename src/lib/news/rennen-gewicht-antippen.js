// «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»), PR 16: the weight along the route (Rennen › Vorbereiten) follows the same rules as the other charts
export default {
  title: 'Races: the weight along the route, a chart you can point at',
  lead: 'The weight curve of bike, bags, water and food shows exact kg per stretch and a table.',
  points: [
    { text: 'Point at a stretch of the route for its weight; tap it for the km', href: '#/race/race-sample', go: { href: '#/race/race-sample', steps: [{ sel: '[data-race-tab="prepare"]' }, { sel: '[data-chart="race-weight"]' }], where: 'Races › your race › Prepare › Total weight along the route.' } },
    { text: '«As table» lists the weight every few km', href: '#/race/race-sample', go: { href: '#/race/race-sample', steps: [{ sel: '[data-race-tab="prepare"]' }, { sel: '[data-chart="race-weight"]' }], where: 'Races › your race › Prepare › Total weight along the route › «As table».' } },
  ],
  test: [
    'Open Races › the sample race › Prepare › «Total weight along the route» and point at the line: the km and the kg appear above the chart.',
    'Tap the line: a window shows the weight at that km; «Earlier stretch» and «Later stretch» walk along the route.',
    'Tap «As table»: the km are listed with their weight.',
  ],
  since: [],
  de: {
    'Races: the weight along the route, a chart you can point at': 'Rennen: das Gewicht entlang der Route, ein Diagramm zum Antippen',
    'The weight curve of bike, bags, water and food shows exact kg per stretch and a table.': 'Die Gewichtskurve von Velo, Taschen, Wasser und Essen zeigt genaue kg pro Stelle und eine Tabelle.',
    'Point at a stretch of the route for its weight; tap it for the km': 'Zeig auf eine Stelle der Route für das Gewicht; tippe sie an für den Kilometer',
    '«As table» lists the weight every few km': '«Als Tabelle» listet das Gewicht alle paar km',
    'Races › your race › Prepare › Total weight along the route.': 'Rennen › dein Rennen › Vorbereiten › Gesamtgewicht entlang der Route.',
    'Races › your race › Prepare › Total weight along the route › «As table».': 'Rennen › dein Rennen › Vorbereiten › Gesamtgewicht entlang der Route › «Als Tabelle».',
    'Open Races › the sample race › Prepare › «Total weight along the route» and point at the line: the km and the kg appear above the chart.': 'Öffne Rennen › das Beispielrennen › Vorbereiten › «Gesamtgewicht entlang der Route» und zeig auf die Linie: Kilometer und kg stehen über dem Diagramm.',
    'Tap the line: a window shows the weight at that km; «Earlier stretch» and «Later stretch» walk along the route.': 'Tippe die Linie an: ein Fenster zeigt das Gewicht bei diesem Kilometer; «Weiter vorn» und «Weiter hinten» führen die Route entlang.',
    'Tap «As table»: the km are listed with their weight.': 'Tippe «Als Tabelle»: die Kilometer stehen mit ihrem Gewicht da.',
  },
};
