// «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»), PR 8: the curve of an own measure on a sport page (Gym: leg press,
// Sauna: rounds, a pace …) follows the same rules as the other charts
export default {
  title: 'Your own measures: the curve you can point at',
  lead: 'The curve of an own measure on a sport page shows exact values, with an axis and a table.',
  points: [
    { text: 'Point at a value on the curve for its exact number and day; tap it for the details', href: '#/flow/sports', go: 'f.sportpage' },
    { text: 'The curve has an axis with round steps and the number at each point', href: '#/flow/sports', go: 'f.sportpage' },
    { text: '«As table» lists the values with sets and repetitions', href: '#/flow/sports', go: 'f.sportpage' },
  ],
  test: [
    'Open a sport page (for example Gym), add a measure and enter two or more values under «Your progress».',
    'Point at a point on the curve (or use the arrow keys): the day and the exact value appear above the curve.',
    'Tap a point: a window shows the value; tap «As table» above the curve for all values as rows.',
  ],
  since: [],
  de: {
    'Your own measures: the curve you can point at': 'Deine eigenen Messwerte: die Kurve zum Antippen',
    'The curve of an own measure on a sport page shows exact values, with an axis and a table.': 'Die Kurve eines eigenen Messwerts auf einer Sportseite zeigt genaue Werte, mit Achse und Tabelle.',
    'Point at a value on the curve for its exact number and day; tap it for the details': 'Zeig auf einen Wert der Kurve für die genaue Zahl und den Tag; tippe ihn an für die Einzelheiten',
    'The curve has an axis with round steps and the number at each point': 'Die Kurve hat eine Achse mit runden Stufen und die Zahl an jedem Punkt',
    '«As table» lists the values with sets and repetitions': '«Als Tabelle» listet die Werte mit Sätzen und Wiederholungen',
    'Open a sport page (for example Gym), add a measure and enter two or more values under «Your progress».': 'Öffne eine Sportseite (zum Beispiel Gym), lege einen Messwert an und trage unter «Dein Fortschritt» zwei oder mehr Werte ein.',
    'Point at a point on the curve (or use the arrow keys): the day and the exact value appear above the curve.': 'Zeig auf einen Punkt der Kurve (oder nimm die Pfeiltasten): Tag und genauer Wert stehen über der Kurve.',
    'Tap a point: a window shows the value; tap «As table» above the curve for all values as rows.': 'Tippe einen Punkt an: ein Fenster zeigt den Wert; tippe über der Kurve auf «Als Tabelle» für alle Werte als Zeilen.',
  },
};
