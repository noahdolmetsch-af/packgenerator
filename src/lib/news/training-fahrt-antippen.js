// «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»), PR 7: the charts of one ride (power curve, cadence, power zones,
// similar rides, endurance check, home loop) follow the same rules as the others
export default {
  title: 'Training, one ride: charts you can point at',
  lead: 'The charts of a ride show exact numbers, with an axis and a table.',
  points: [
    { text: 'Point at a bar, a duration or a ride for its exact numbers; tap it for what is behind', go: 'f.training' },
    { text: 'Power curve, cadence, power zones, endurance check and home loop have an axis with round steps', go: 'f.training' },
    { text: '«As table» lists the same numbers; similar rides show them when you point at a dot', go: 'f.training' },
  ],
  test: [
    'Open Aktiv › Training, open a ride with a power meter and scroll to «Power curve»: point at a duration (or use the arrow keys) and the watts appear above the chart.',
    'Tap a bar of «Power zones» or «Cadence»: a window shows the minutes or the share; «Lower zone» and «Higher zone» walk through the chart.',
    'Tap «As table» above a chart: the same numbers as rows.',
  ],
  since: [],
  de: {
    'Training, one ride: charts you can point at': 'Training, eine Fahrt: Diagramme zum Antippen',
    'The charts of a ride show exact numbers, with an axis and a table.': 'Die Diagramme einer Fahrt zeigen genaue Zahlen, mit Achse und Tabelle.',
    'Point at a bar, a duration or a ride for its exact numbers; tap it for what is behind': 'Zeig auf einen Balken, eine Dauer oder eine Fahrt für die genauen Zahlen; tippe sie an für das Dahinter',
    'Power curve, cadence, power zones, endurance check and home loop have an axis with round steps': 'Leistungskurve, Trittfrequenz, Leistungsbereiche, Ausdauer-Check und Hausrunde haben eine Achse mit runden Stufen',
    '«As table» lists the same numbers; similar rides show them when you point at a dot': '«Als Tabelle» listet dieselben Zahlen; bei ähnlichen Fahrten erscheinen sie, wenn du auf einen Punkt zeigst',
    'Open Aktiv › Training, open a ride with a power meter and scroll to «Power curve»: point at a duration (or use the arrow keys) and the watts appear above the chart.': 'Öffne Aktiv › Training, öffne eine Fahrt mit Leistungsmesser und scrolle zu «Leistungskurve»: zeig auf eine Dauer (oder nimm die Pfeiltasten), die Watt stehen über dem Diagramm.',
    'Tap a bar of «Power zones» or «Cadence»: a window shows the minutes or the share; «Lower zone» and «Higher zone» walk through the chart.': 'Tippe einen Balken bei «Leistungsbereiche» oder «Trittfrequenz» an: ein Fenster zeigt die Minuten oder den Anteil; «Tiefere Zone» und «Höhere Zone» führen durch das Diagramm.',
    'Tap «As table» above a chart: the same numbers as rows.': 'Tippe über einem Diagramm auf «Als Tabelle»: dieselben Zahlen als Zeilen.',
  },
};
