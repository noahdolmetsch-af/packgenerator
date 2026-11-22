// «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»), PR 14: the small bars of the Rückblick (Relative Effort, load, trips compared, pace) follow the same rules as the other charts
export default {
  title: 'The small bars of the look back: charts you can point at',
  lead: 'Relative Effort, load, the trip comparison and your pace show exact values and a table.',
  points: [
    { text: 'Point at a bar for its value; tap it for the trip', href: '#/debrief/pace', go: { href: '#/debrief/pace', steps: [{ sel: '[data-chart="pace-time"]' }], where: 'Look back › Your pace, once you have five rides.' } },
    { text: '«As table» lists the trips with their numbers', href: '#/debrief/pace', go: { href: '#/debrief/pace', steps: [{ sel: '[data-chart="pace-time"]' }], where: 'Look back › Your pace, once you have five rides.' } },
  ],
  test: [
    'Open Look back › Your pace (it needs five rides) and point at a bar of «Speed per ride»: the ride and its km/h appear above the chart.',
    'Tap a bar: a window shows the value and the average; «Earlier one» and «Later one» walk through the bars.',
    'Tap «As table»: the rides are listed with their values, the newest first. The same works for «Relative Effort» and «Load» in the card «Heart rate and power» and in «Trips compared».',
  ],
  since: [],
  de: {
    'The small bars of the look back: charts you can point at': 'Die kleinen Balken im Rückblick: Diagramme zum Antippen',
    'Relative Effort, load, the trip comparison and your pace show exact values and a table.': 'Relative Effort, Belastung, der Tourenvergleich und dein Tempo zeigen genaue Werte und eine Tabelle.',
    'Point at a bar for its value; tap it for the trip': 'Zeig auf einen Balken für den Wert; tippe ihn an für die Tour',
    '«As table» lists the trips with their numbers': '«Als Tabelle» listet die Touren mit ihren Zahlen',
    'Look back › Your pace, once you have five rides.': 'Rückblick › Dein Tempo, sobald du fünf Fahrten hast.',
    'Open Look back › Your pace (it needs five rides) and point at a bar of «Speed per ride»: the ride and its km/h appear above the chart.': 'Öffne Rückblick › Dein Tempo (es braucht fünf Fahrten) und zeig auf einen Balken von «Geschwindigkeit pro Fahrt»: Fahrt und km/h stehen über dem Diagramm.',
    'Tap a bar: a window shows the value and the average; «Earlier one» and «Later one» walk through the bars.': 'Tippe einen Balken an: ein Fenster zeigt den Wert und den Durchschnitt; «Der davor» und «Der danach» führen durch die Balken.',
    'Tap «As table»: the rides are listed with their values, the newest first. The same works for «Relative Effort» and «Load» in the card «Heart rate and power» and in «Trips compared».': 'Tippe «Als Tabelle»: die Fahrten stehen mit ihren Werten da, die neueste zuerst. Dasselbe geht bei «Relative Effort» und «Belastung» in der Karte «Puls und Leistung» und bei «Touren im Vergleich».',
  },
};
