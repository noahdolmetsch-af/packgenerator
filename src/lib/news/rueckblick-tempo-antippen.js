// «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»), PR 11: «Pace over the months» of the look back follows the same rules as the other charts
export default {
  title: 'Pace over the months: a chart you can point at',
  lead: 'The pace per month has an axis, shows exact numbers and opens a month with a tap.',
  points: [
    { text: 'Point at a month for its pace, rides and heart rate; tap it for every value of the month', href: '#/debrief/pace', go: { href: '#/debrief/pace', steps: [{ sel: '[data-months]' }] } },
    { text: '«As table» lists all months with pace, rides, heart rate and power', href: '#/debrief/pace', go: { href: '#/debrief/pace', steps: [{ sel: '[data-months]' }] } },
  ],
  test: [
    'Open Look back › Your pace, scroll to «Pace over the months» and point at a bar (or use the arrow keys): month, km/h, rides and heart rate appear above the chart.',
    'Tap a month: a window shows every value of it; «Month before» and «Next month» walk through the months.',
    'Tap «As table»: all months are listed, the newest first.',
  ],
  since: [],
  de: {
    'Pace over the months: a chart you can point at': 'Tempo über die Monate: ein Diagramm zum Antippen',
    'The pace per month has an axis, shows exact numbers and opens a month with a tap.': 'Das Tempo pro Monat hat eine Achse, zeigt genaue Zahlen und öffnet mit einem Tipp den Monat.',
    'Point at a month for its pace, rides and heart rate; tap it for every value of the month': 'Zeig auf einen Monat für Tempo, Fahrten und Puls; tippe ihn an für alle Werte des Monats',
    '«As table» lists all months with pace, rides, heart rate and power': '«Als Tabelle» listet alle Monate mit Tempo, Fahrten, Puls und Leistung',
    'Open Look back › Your pace, scroll to «Pace over the months» and point at a bar (or use the arrow keys): month, km/h, rides and heart rate appear above the chart.': 'Öffne Rückblick › Dein Tempo, scrolle zu «Tempo über die Monate» und zeig auf einen Balken (oder nimm die Pfeiltasten): Monat, km/h, Fahrten und Puls stehen über dem Diagramm.',
    'Tap a month: a window shows every value of it; «Month before» and «Next month» walk through the months.': 'Tippe einen Monat an: ein Fenster zeigt alle seine Werte; «Monat davor» und «Nächster Monat» führen durch die Monate.',
    'Tap «As table»: all months are listed, the newest first.': 'Tippe «Als Tabelle»: alle Monate stehen da, der neueste zuerst.',
  },
};
