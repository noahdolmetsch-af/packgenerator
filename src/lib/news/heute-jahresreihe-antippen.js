// «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»), PR 10: the 12 months row of Heute follows the same rules as the other charts
export default {
  title: 'The 12 months on Today: a chart you can point at',
  lead: 'The km of the last 12 months now have an axis, show exact numbers and open a month with a tap.',
  points: [
    { text: 'Point at a month for its km; tap it to see the month and go to the look back', href: '#/debrief', go: { href: '#/', steps: [{ sel: '[data-year-row]' }] } },
    { text: '«As table» lists the 12 months under the chart', href: '#/debrief', go: { href: '#/', steps: [{ sel: '[data-year-row]' }] } },
  ],
  test: [
    'Open Today, find the row «Last 12 months» and point at a bar (or use the arrow keys): month and km appear above the chart.',
    'Tap a month: a window shows its km; «Month before» and «Next month» walk through the year.',
    'Tap «As table»: the 12 months are listed with their km.',
  ],
  since: [],
  de: {
    'The 12 months on Today: a chart you can point at': 'Die 12 Monate auf Heute: ein Diagramm zum Antippen',
    'The km of the last 12 months now have an axis, show exact numbers and open a month with a tap.': 'Die km der letzten 12 Monate haben jetzt eine Achse, zeigen genaue Zahlen und öffnen mit einem Tipp den Monat.',
    'Point at a month for its km; tap it to see the month and go to the look back': 'Zeig auf einen Monat für seine km; tippe ihn an für den Monat und den Weg zum Rückblick',
    '«As table» lists the 12 months under the chart': '«Als Tabelle» listet unter dem Diagramm die 12 Monate',
    'Open Today, find the row «Last 12 months» and point at a bar (or use the arrow keys): month and km appear above the chart.': 'Öffne Heute, such die Reihe «Letzte 12 Monate» und zeig auf einen Balken (oder nimm die Pfeiltasten): Monat und km stehen über dem Diagramm.',
    'Tap a month: a window shows its km; «Month before» and «Next month» walk through the year.': 'Tippe einen Monat an: ein Fenster zeigt seine km; «Monat davor» und «Nächster Monat» führen durchs Jahr.',
    'Tap «As table»: the 12 months are listed with their km.': 'Tippe «Als Tabelle»: die 12 Monate stehen mit ihren km da.',
  },
};
