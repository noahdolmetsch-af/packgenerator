// «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): the charts of the page «Körperwerte» and of every sport page
// (Aktiv › Fokus) follow the same rules as the others: an axis with round steps, the exact numbers of a day when
// pointing, a tap opens the day, «Als Tabelle»
export default {
  title: 'Body values and sport pages: charts you can point at',
  lead: 'Every chart on «Körperwerte» and on the sport pages shows the exact numbers.',
  points: [
    { text: 'Point at a day for its exact numbers; tap it to see the day and its rides', go: 'f.ownbody' },
    { text: 'Every chart has an axis with round steps, and «As table» lists the same numbers', go: 'f.ownbody' },
    { text: 'A day without a value stays a gap in the line, never a fall to 0', go: 'f.ownbody' },
  ],
  test: [
    'Open Aktiv › Körperwerte and point at a day (or use the arrow keys): the numbers of that day appear above the chart.',
    'Tap a day: a window shows the day; «Day before» and «Next day» walk through the chart.',
    'Tap «As table» above the chart: the same numbers as rows.',
  ],
  since: [],
  de: {
    'Body values and sport pages: charts you can point at': 'Körperwerte und Sportseiten: Diagramme zum Antippen',
    'Every chart on «Körperwerte» and on the sport pages shows the exact numbers.': 'Jedes Diagramm auf «Körperwerte» und auf den Sportseiten zeigt die genauen Zahlen.',
    'Point at a day for its exact numbers; tap it to see the day and its rides': 'Zeig auf einen Tag für die genauen Zahlen; tippe ihn an für den Tag und seine Fahrten',
    'Every chart has an axis with round steps, and «As table» lists the same numbers': 'Jedes Diagramm hat eine Achse mit runden Stufen, «Als Tabelle» listet dieselben Zahlen',
    'A day without a value stays a gap in the line, never a fall to 0': 'Ein Tag ohne Wert bleibt eine Lücke in der Linie, nie ein Absturz auf 0',
    'Open Aktiv › Körperwerte and point at a day (or use the arrow keys): the numbers of that day appear above the chart.': 'Öffne Aktiv › Körperwerte und zeig auf einen Tag (oder nimm die Pfeiltasten): die Zahlen dieses Tages stehen über dem Diagramm.',
    'Tap a day: a window shows the day; «Day before» and «Next day» walk through the chart.': 'Tippe einen Tag an: ein Fenster zeigt den Tag; «Tag davor» und «Nächster Tag» führen durch das Diagramm.',
    'Tap «As table» above the chart: the same numbers as rows.': 'Tippe über dem Diagramm auf «Als Tabelle»: dieselben Zahlen als Zeilen.',
  },
};
