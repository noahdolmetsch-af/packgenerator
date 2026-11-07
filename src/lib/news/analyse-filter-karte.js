// «Analyse: Filter nur wo er wirkt» (Noah 07.11.2026 «3a», Thread «UI-Test Analyse»): the card «Data from / Period» per tab, one line on a phone
export default {
  title: 'Analysis: the filter only where it works',
  lead: 'The card «Data from / Period» now shows only what the tab you are on uses. On a phone it is one line that opens the choices.',
  points: [
    { text: 'Each tab of the Analysis shows only the choices it uses (sources, period, empty values)', go: { href: '#/auswerten/analyse', steps: [{ sel: '[data-tab="rekorde"]' }], where: 'Auswerten › Analyse, the card above the tabs.' } },
    { text: 'On a phone the card is one line, «30 days · 5 sources», and opens with a tap', go: { href: '#/auswerten/analyse', steps: [{ sel: '[data-filter-toggle]' }], where: 'Auswerten › Analyse on a phone, above the tabs.' } },
  ],
  small: [{ box: 'new', text: 'Own diagram and Comparisons have their own periods: a line says where to choose them', go: { href: '#/auswerten/analyse', steps: [{ sel: '[data-tab="diagramm"]' }, { sel: '[data-filter-note]' }], where: 'Auswerten › Analyse › Own diagram, above the tabs.' } }],
  test: ['Open Auswerten › Analyse › Records and runs: the card shows only «Period», no sources.', 'Open Own diagram: no card, one line says that you choose the period in the diagram.', 'On a phone: Overview shows «30 days · 5 sources»; a tap opens sources and period.'],
  since: [],
  de: {
    'Analysis: the filter only where it works': 'Analyse: der Filter nur dort, wo er wirkt',
    'The card «Data from / Period» now shows only what the tab you are on uses. On a phone it is one line that opens the choices.': 'Die Karte «Daten aus / Zeitraum» zeigt jetzt nur, was der Reiter braucht, auf dem du bist. Am Handy ist sie eine Zeile, die die Auswahl öffnet.',
    'Each tab of the Analysis shows only the choices it uses (sources, period, empty values)': 'Jeder Reiter der Analyse zeigt nur die Auswahl, die er braucht (Quellen, Zeitraum, leere Werte)',
    'On a phone the card is one line, «30 days · 5 sources», and opens with a tap': 'Am Handy ist die Karte eine Zeile, «30 Tage · 5 Quellen», und öffnet sich mit einem Tipp',
    'Own diagram and Comparisons have their own periods: a line says where to choose them': 'Eigenes Diagramm und Vergleiche haben eigene Zeiträume: eine Zeile sagt, wo du sie wählst',
    'Auswerten › Analyse, the card above the tabs.': 'Auswerten › Analyse, die Karte über den Reitern.',
    'Auswerten › Analyse on a phone, above the tabs.': 'Auswerten › Analyse am Handy, über den Reitern.',
    'Auswerten › Analyse › Own diagram, above the tabs.': 'Auswerten › Analyse › Eigenes Diagramm, über den Reitern.',
    'Open Auswerten › Analyse › Records and runs: the card shows only «Period», no sources.': 'Öffne Auswerten › Analyse › Rekorde und Serien: die Karte zeigt nur «Zeitraum», keine Quellen.',
    'Open Own diagram: no card, one line says that you choose the period in the diagram.': 'Öffne Eigenes Diagramm: keine Karte, eine Zeile sagt, dass du den Zeitraum im Diagramm wählst.',
    'On a phone: Overview shows «30 days · 5 sources»; a tap opens sources and period.': 'Am Handy: Überblick zeigt «30 Tage · 5 Quellen»; ein Tipp öffnet Quellen und Zeitraum.',
  },
};
