// «Zahlen mit Weg» auf Aktiv (UI-Prüfung 07.11.2026, Noah «5a», A1): the rings and the week goals open their value in Analyse
export default {
  title: 'Rings and week goals lead somewhere',
  lead: 'On Aktiv, a tap on a ring or on a week goal opens the matching value in Analyse.',
  points: [{ text: 'Tap a week goal or a ring: its course in Analyse opens', go: { href: '#/flow', steps: [{ sel: '[data-ring-way="move"]' }], where: 'Aktiv › Rings (and My week goals above).' } }],
  small: [{ box: 'new', text: 'A ring with several sports leads to «Ticks evaluated»' }],
  test: ['Open Aktiv and tap a row under «Rings» (for example «Mindful»): the page of that value in Analyse opens, over 7 days.', 'Add a week goal on Aktiv and tap it: its value opens in Analyse.'],
  since: [],
  de: {
    'Rings and week goals lead somewhere': 'Ringe und Wochenziele führen weiter',
    'On Aktiv, a tap on a ring or on a week goal opens the matching value in Analyse.': 'In Aktiv öffnet ein Tipp auf einen Ring oder ein Wochenziel den passenden Wert in der Analyse.',
    'Tap a week goal or a ring: its course in Analyse opens': 'Tippe auf ein Wochenziel oder einen Ring: sein Verlauf in der Analyse öffnet sich',
    'Aktiv › Rings (and My week goals above).': 'Aktiv › Ringe (und darüber Meine Wochenziele).',
    'A ring with several sports leads to «Ticks evaluated»': 'Ein Ring mit mehreren Sportarten führt zu «Haken ausgewertet»',
    'Open Aktiv and tap a row under «Rings» (for example «Mindful»): the page of that value in Analyse opens, over 7 days.': 'Öffne Aktiv und tippe unter «Ringe» auf eine Zeile (zum Beispiel «Achtsam»): die Seite dieses Werts in der Analyse öffnet sich, über 7 Tage.',
    'Add a week goal on Aktiv and tap it: its value opens in Analyse.': 'Lege auf Aktiv ein Wochenziel an und tippe darauf: sein Wert öffnet sich in der Analyse.',
  },
};
