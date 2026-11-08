// «Analyse in Reitern» (Noah 03.11.2026 «1a»): one part of the page at a time
export default {
  title: 'Analysis in tabs',
  lead: 'The long Analyse page is now split into tabs, and «Data from» and «Period» sit at the top.',
  points: [{ text: 'Pick a part: Overview, Own diagram, Comparisons, Records and runs, Bikes or All values', go: { href: '#/auswerten/analyse', steps: [{ sel: '[data-tab="rekorde"]' }], where: 'Auswerten › Analyse, the row of tabs under «Data from».' } }],
  small: [],
  test: ['Open Auswerten › Analyse: a row of tabs sits under «Data from» and «Period».', 'Tap «Records and runs»: only records and runs show, not the whole page.', 'Tap «All values»: the tiles with Heart, Sleep and the rest show.'],
  since: [],
  de: {
    'Analysis in tabs': 'Analyse in Reitern',
    'The long Analyse page is now split into tabs, and «Data from» and «Period» sit at the top.': 'Die lange Analyse-Seite ist jetzt in Reiter geteilt, und «Daten aus» und «Zeitraum» stehen oben.',
    'Pick a part: Overview, Own diagram, Comparisons, Records and runs, Bikes or All values': 'Wähle einen Teil: Übersicht, Eigenes Diagramm, Vergleiche, Rekorde und Serien, Velos oder Alle Werte',
    'Auswerten › Analyse, the row of tabs under «Data from».': 'Auswerten › Analyse, die Reiter unter «Daten aus».',
    'Open Auswerten › Analyse: a row of tabs sits under «Data from» and «Period».': 'Öffne Auswerten › Analyse: unter «Daten aus» und «Zeitraum» steht eine Reihe von Reitern.',
    'Tap «Records and runs»: only records and runs show, not the whole page.': 'Tippe auf «Rekorde und Serien»: nur Rekorde und Serien erscheinen, nicht die ganze Seite.',
    'Tap «All values»: the tiles with Heart, Sleep and the rest show.': 'Tippe auf «Alle Werte»: die Kacheln mit Herz, Schlaf und dem Rest erscheinen.',
  },
};
