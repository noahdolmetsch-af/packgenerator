// «Diagramme zum Antippen» K3 (Noah 27.10.2026 «1-5 a»): «Form und Erholung» › Was heute zählt: 7 days per row,
// a tap opens the days with the normal, the points and why, one value to compare, «Als Tabelle»
export default {
  title: 'What counts today, day by day',
  lead: 'Every row of «What counts today» shows its last 7 days and opens them with a tap.',
  points: [
    { text: 'Each row has a small line of the last 7 days', href: '#/flow/form', go: 'f.form' },
    { text: 'Tap a row: 7 or 30 days, your normal, the points and why', go: 'f.form' },
    { text: 'Compare with a second value, each with its own axis', go: 'f.form' },
  ],
  small: [{ box: 'nicer', text: 'With 7 days the number stands at every point; «As table» lists value, normal and points', go: 'f.form' }],
  test: [
    'Open Auswerten › Form und Erholung: each row of «Was heute zählt» has a small line of 7 days.',
    'Tap «Ruhepuls»: a window shows 7 days with a number at each point, your normal as a dashed line and why it gives points.',
    'Tap «Schlaf» under «Vergleichen mit», then «30 Tage»: a second line with its own axis on the right, a month long.',
  ],
  since: [],
  de: {
    'What counts today, day by day': 'Was heute zählt, Tag für Tag',
    'Every row of «What counts today» shows its last 7 days and opens them with a tap.': 'Jede Zeile von «Was heute zählt» zeigt ihre letzten 7 Tage und öffnet sie mit einem Tipp.',
    'Each row has a small line of the last 7 days': 'Jede Zeile hat eine kleine Linie der letzten 7 Tage',
    'Tap a row: 7 or 30 days, your normal, the points and why': 'Tippe eine Zeile an: 7 oder 30 Tage, dein Normal, die Punkte und warum',
    'Compare with a second value, each with its own axis': 'Vergleiche mit einem zweiten Wert, jeder mit eigener Achse',
    'With 7 days the number stands at every point; «As table» lists value, normal and points': 'Bei 7 Tagen steht die Zahl an jedem Punkt; «Als Tabelle» listet Wert, Normal und Punkte',
    'Open Auswerten › Form und Erholung: each row of «Was heute zählt» has a small line of 7 days.': 'Öffne Auswerten › Form und Erholung: jede Zeile von «Was heute zählt» hat eine kleine Linie mit 7 Tagen.',
    'Tap «Ruhepuls»: a window shows 7 days with a number at each point, your normal as a dashed line and why it gives points.': 'Tippe «Ruhepuls» an: ein Fenster zeigt 7 Tage mit einer Zahl an jedem Punkt, dein Normal als gestrichelte Linie und warum es Punkte gibt.',
    'Tap «Schlaf» under «Vergleichen mit», then «30 Tage»: a second line with its own axis on the right, a month long.': 'Tippe unter «Vergleichen mit» auf «Schlaf», dann «30 Tage»: eine zweite Linie mit eigener Achse rechts, einen Monat lang.',
  },
};
