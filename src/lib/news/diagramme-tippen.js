// «Diagramme zum Antippen» + «Genaue Werte» (Noah 27.10.2026 «1-5 a»): the three charts of «Haken ausgewertet»
// get a labelled axis, the exact numbers when pointing, a window behind every bar and «Als Tabelle»
export default {
  title: 'Charts you can tap',
  lead: 'The charts of your ticks show exact numbers and open what is behind a bar.',
  points: [
    { text: 'Point at a week or day: its exact numbers stand in the line above the chart', href: '#/flow/auswertung', go: 'f.tickreview' },
    { text: 'Tap a bar: a window shows its days and activities, with «Next week» inside', go: 'f.tickreview' },
    { text: '«As table» shows the same numbers as rows', go: 'f.tickreview' },
  ],
  small: [{ box: 'nicer', text: 'Each chart has a value axis with round steps, starting at 0', go: 'f.tickreview' }],
  test: [
    'Open Auswerten › Haken ausgewertet and point at a bar of «Haken pro Woche»: the line above shows its numbers.',
    'Tap the bar: the window lists the seven days; «Nächste Woche» walks on, ✕ closes it.',
    'Tap «Als Tabelle»: the weeks stand as rows, newest first.',
  ],
  since: [],
  de: {
    'Charts you can tap': 'Diagramme zum Antippen',
    'The charts of your ticks show exact numbers and open what is behind a bar.': 'Die Diagramme deiner Haken zeigen genaue Zahlen und öffnen, was hinter einem Balken steckt.',
    'Point at a week or day: its exact numbers stand in the line above the chart': 'Zeig auf eine Woche oder einen Tag: die genauen Zahlen stehen in der Zeile über dem Diagramm',
    'Tap a bar: a window shows its days and activities, with «Next week» inside': 'Tippe auf einen Balken: ein Fenster zeigt Tage und Aktivitäten, mit «Nächste Woche» darin',
    '«As table» shows the same numbers as rows': '«Als Tabelle» zeigt dieselben Zahlen als Zeilen',
    'Each chart has a value axis with round steps, starting at 0': 'Jedes Diagramm hat eine Achse mit runden Schritten ab 0',
    'Open Auswerten › Haken ausgewertet and point at a bar of «Haken pro Woche»: the line above shows its numbers.': 'Öffne Auswerten › Haken ausgewertet und zeig auf einen Balken bei «Haken pro Woche»: die Zeile darüber zeigt seine Zahlen.',
    'Tap the bar: the window lists the seven days; «Nächste Woche» walks on, ✕ closes it.': 'Tippe auf den Balken: das Fenster zeigt die sieben Tage; «Nächste Woche» blättert weiter, ✕ schliesst.',
    'Tap «Als Tabelle»: the weeks stand as rows, newest first.': 'Tippe auf «Als Tabelle»: die Wochen stehen als Zeilen, die neuste zuoberst.',
  },
};
