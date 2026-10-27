// «Genaue Werte» in Analyse (Noah 27.10.2026: exakte Daten statt Schätzungen an ungenauen Skalen)
export default {
  title: 'Exact values in every Analyse chart',
  lead: 'Every chart has round, labelled steps with grid lines, and a tap shows the exact value.',
  points: [
    { text: 'An axis with round numbers and the unit (e.g. 0, 50, 100, 150 km; 6 h, 7 h, 8 h), with thin grid lines', href: '#/auswerten/analyse' },
    { text: 'Tap a day, week, month or hour: its exact values stand above the chart', href: '#/auswerten/analyse' },
    { text: 'Few points: the number stands right at the point', href: '#/auswerten/analyse' },
  ],
  small: [],
  test: [
    'Open Auswerten › Analyse and scroll to «Velos: km und Verschleiss»: left of the lines stand 0, 50, 100 … km.',
    'Tap a week in that chart: the exact km of each bike stand above it.',
    'Tap a tile, e.g. «Ruhepuls», then a day in the chart: the exact value with bpm appears.',
  ],
  since: [],
  de: {
    'Exact values in every Analyse chart': 'Genaue Werte in allen Analyse-Diagrammen',
    'Every chart has round, labelled steps with grid lines, and a tap shows the exact value.':
      'Jedes Diagramm hat runde, beschriftete Stufen mit Gitterlinien, und ein Tipp zeigt den genauen Wert.',
    'An axis with round numbers and the unit (e.g. 0, 50, 100, 150 km; 6 h, 7 h, 8 h), with thin grid lines':
      'Eine Achse mit runden Zahlen und Einheit (z. B. 0, 50, 100, 150 km; 6 h, 7 h, 8 h), mit feinen Gitterlinien',
    'Tap a day, week, month or hour: its exact values stand above the chart': 'Tippe auf einen Tag, eine Woche, einen Monat oder eine Stunde: Die genauen Werte stehen über dem Diagramm',
    'Few points: the number stands right at the point': 'Wenige Punkte: Die Zahl steht direkt am Punkt',
    'Open Auswerten › Analyse and scroll to «Velos: km und Verschleiss»: left of the lines stand 0, 50, 100 … km.':
      'Öffne Auswerten › Analyse und scrolle zu «Velos: km und Verschleiss»: Links neben den Linien stehen 0, 50, 100 … km.',
    'Tap a week in that chart: the exact km of each bike stand above it.': 'Tippe in diesem Diagramm auf eine Woche: Darüber stehen die genauen km jedes Velos.',
    'Tap a tile, e.g. «Ruhepuls», then a day in the chart: the exact value with bpm appears.':
      'Tippe auf eine Kachel, z. B. «Ruhepuls», dann auf einen Tag im Diagramm: Der genaue Wert mit bpm erscheint.',
  },
};
