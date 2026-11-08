// «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»), PR 13: the power curve of the Rückblick card «Puls und Leistung» follows the same rules as the other charts
export default {
  title: 'The power curve of a trip: a chart you can point at',
  lead: 'In the look back of a trip with a power meter, the power curve shows exact watts and a table.',
  points: [
    { text: 'Point at a duration for its watts; tap it for the duration', href: '#/debrief', go: { href: '#/debrief', steps: [{ sel: '[data-heart-power]' }], where: 'Look back of a trip with a power meter › Body and performance › Power › Power curve.' } },
    { text: '«As table» lists the best power per duration', href: '#/debrief', go: { href: '#/debrief', steps: [{ sel: '[data-heart-power]' }], where: 'Look back of a trip with a power meter › Body and performance › Power › Power curve.' } },
  ],
  test: [
    'Open the look back of a trip with a power meter, group «Body and performance», and point at the power curve: the duration and its watts appear above it.',
    'Tap a duration: a window shows the best power over it (and W/kg when your weight is known); «Shorter duration» and «Longer duration» walk through them.',
    'Tap «As table»: the five durations are listed with their watts.',
  ],
  since: [],
  de: {
    'The power curve of a trip: a chart you can point at': 'Die Leistungskurve einer Tour: ein Diagramm zum Antippen',
    'In the look back of a trip with a power meter, the power curve shows exact watts and a table.': 'Im Rückblick einer Tour mit Leistungsmesser zeigt die Leistungskurve genaue Watt und eine Tabelle.',
    'Point at a duration for its watts; tap it for the duration': 'Zeig auf eine Dauer für ihre Watt; tippe sie an für die Dauer',
    '«As table» lists the best power per duration': '«Als Tabelle» listet die beste Leistung pro Dauer',
    'Look back of a trip with a power meter › Body and performance › Power › Power curve.': 'Rückblick einer Tour mit Leistungsmesser › Körper und Leistung › Leistung › Leistungskurve.',
    'Open the look back of a trip with a power meter, group «Body and performance», and point at the power curve: the duration and its watts appear above it.': 'Öffne den Rückblick einer Tour mit Leistungsmesser, Gruppe «Körper und Leistung», und zeig auf die Leistungskurve: Dauer und Watt stehen darüber.',
    'Tap a duration: a window shows the best power over it (and W/kg when your weight is known); «Shorter duration» and «Longer duration» walk through them.': 'Tippe eine Dauer an: ein Fenster zeigt die beste Leistung darüber (und W/kg, wenn dein Gewicht bekannt ist); «Kürzere Dauer» und «Längere Dauer» führen durch sie.',
    'Tap «As table»: the five durations are listed with their watts.': 'Tippe «Als Tabelle»: die fünf Dauern stehen mit ihren Watt da.',
  },
};
