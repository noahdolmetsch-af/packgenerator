// «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»), PR 9: three more charts of Aktiv (Meditation: minutes per week
// and month, hours of the day; Training: look back) follow the same rules as the others
export default {
  title: 'Meditation and training look back: charts you can point at',
  lead: 'Minutes per week, per month and per hour, and the hours per week of your training show exact numbers, with an axis and a table.',
  points: [
    { text: 'Point at a week, a month or an hour for its exact numbers; tap it for what is behind', href: '#/flow/act/meditation/rueckblick', go: 'f.medreview' },
    { text: 'The training look back shows the hours of every zone for a week, and the plan as a line', href: '#/flow/training', go: 'f.training' },
    { text: '«As table» lists the same numbers under every chart', href: '#/flow/act/meditation/rueckblick', go: 'f.medreview' },
  ],
  test: [
    'Open Aktiv › Meditation › Look back, scroll to «Minutes per week» and point at a bar (or use the arrow keys): week, minutes and goal appear above the chart.',
    'Tap a week: a window shows its minutes; «Week before» and «Next week» walk through the chart.',
    'Open Aktiv › Training, scroll to «Look back» and tap a week: the hours of every zone.',
  ],
  since: [],
  de: {
    'Meditation and training look back: charts you can point at': 'Rückblick Meditation und Training: Diagramme zum Antippen',
    'Minutes per week, per month and per hour, and the hours per week of your training show exact numbers, with an axis and a table.': 'Minuten pro Woche, Monat und Stunde sowie die Stunden pro Woche beim Training zeigen genaue Zahlen, mit Achse und Tabelle.',
    'Point at a week, a month or an hour for its exact numbers; tap it for what is behind': 'Zeig auf eine Woche, einen Monat oder eine Stunde für die genauen Zahlen; tippe sie an für das Dahinter',
    'The training look back shows the hours of every zone for a week, and the plan as a line': 'Der Trainings-Rückblick zeigt die Stunden jeder Zone einer Woche und den Plan als Linie',
    '«As table» lists the same numbers under every chart': '«Als Tabelle» listet unter jedem Diagramm dieselben Zahlen',
    'Open Aktiv › Meditation › Look back, scroll to «Minutes per week» and point at a bar (or use the arrow keys): week, minutes and goal appear above the chart.': 'Öffne Aktiv › Meditation › Rückblick, scrolle zu «Minuten pro Woche» und zeig auf einen Balken (oder nimm die Pfeiltasten): Woche, Minuten und Ziel stehen über dem Diagramm.',
    'Tap a week: a window shows its minutes; «Week before» and «Next week» walk through the chart.': 'Tippe eine Woche an: ein Fenster zeigt ihre Minuten; «Woche davor» und «Nächste Woche» führen durch das Diagramm.',
    'Open Aktiv › Training, scroll to «Look back» and tap a week: the hours of every zone.': 'Öffne Aktiv › Training, scrolle zu «Rückblick» und tippe eine Woche an: die Stunden jeder Zone.',
  },
};
