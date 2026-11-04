// «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»), PR 6: the four charts «Analysen über die Wochen» of
// Training › Woche (load per week, fitness and form, power curve, efficiency) follow the same rules as the others
export default {
  title: 'Training, weeks: charts you can point at',
  lead: 'The four charts over the weeks show exact numbers, with an axis and a table.',
  points: [
    { text: 'Point at a week (or a duration, or a day) for its exact numbers; tap it for what is behind', go: 'f.training' },
    { text: 'Every chart has an axis with round steps, and «As table» lists the same numbers', go: 'f.training' },
    { text: 'A tapped week shows its activities, each a link to the activity', go: 'f.training' },
  ],
  test: [
    'Open Aktiv › Training › Woche, scroll to «Load per week» and point at a bar (or use the arrow keys): the load and the activities of that week appear above the chart.',
    'Tap a week: a window shows its activities; «Week before» and «Next week» walk through the chart.',
    'Tap «As table» above a chart: the same numbers as rows.',
  ],
  since: [],
  de: {
    'Training, weeks: charts you can point at': 'Training, Wochen: Diagramme zum Antippen',
    'The four charts over the weeks show exact numbers, with an axis and a table.': 'Die vier Diagramme über die Wochen zeigen genaue Zahlen, mit Achse und Tabelle.',
    'Point at a week (or a duration, or a day) for its exact numbers; tap it for what is behind': 'Zeig auf eine Woche (oder Dauer, oder einen Tag) für die genauen Zahlen; tippe sie an für das Dahinter',
    'Every chart has an axis with round steps, and «As table» lists the same numbers': 'Jedes Diagramm hat eine Achse mit runden Stufen, «Als Tabelle» listet dieselben Zahlen',
    'A tapped week shows its activities, each a link to the activity': 'Eine angetippte Woche zeigt ihre Aktivitäten, jede ein Link zur Aktivität',
    'Open Aktiv › Training › Woche, scroll to «Load per week» and point at a bar (or use the arrow keys): the load and the activities of that week appear above the chart.': 'Öffne Aktiv › Training › Woche, scrolle zu «Belastung pro Woche» und zeig auf einen Balken (oder nimm die Pfeiltasten): Belastung und Aktivitäten dieser Woche stehen über dem Diagramm.',
    'Tap a week: a window shows its activities; «Week before» and «Next week» walk through the chart.': 'Tippe eine Woche an: ein Fenster zeigt ihre Aktivitäten; «Woche davor» und «Nächste Woche» führen durch das Diagramm.',
    'Tap «As table» above a chart: the same numbers as rows.': 'Tippe über einem Diagramm auf «Als Tabelle»: dieselben Zahlen als Zeilen.',
  },
};
