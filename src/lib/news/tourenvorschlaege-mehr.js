// «Tourenvorschläge: dreimal so viele Touren» (Noah 24.11.2026 «ziel 3 mal so viele touren»): alle Etappen des Netzes und Tagestouren daraus.
export default {
  title: 'Tour suggestions: three times as many tours',
  lead: 'The tour suggestions now hold every stage of the official mountain bike network and day tours made of two or three stages.',
  points: [
    { text: 'Over 470 stages instead of 200: with «Medium» and «Easy» switched on you find the whole network, in every canton that has data', go: { href: '#/trips/vorschlaege', steps: [{ sel: '[data-vs-view="list"]' }], where: 'Trips › Dreams › Tour suggestions: the filters, group «Fitness».' } },
    { text: 'Day tours: two or three stages of the same route that follow each other make one longer tour («Zurich → Einsiedeln, 2 stages»); they are as hard as their hardest stage', go: { href: '#/trips/vorschlaege', steps: [{ sel: '[data-vs-view="list"]' }], where: 'Trips › Dreams › Tour suggestions: tours with «2 stages» or «3 stages» under the title.' } },
  ],
  small: [],
  test: ['Open Trips › Dreams › Tour suggestions › «List»: the number of tours is higher than before. Under the filters switch «Medium» and «Easy» on: it grows to over 600.', 'Look for a tour with «2 stages» under the title and open it: the map shows the whole line, and km and climb are the sum of the stages.'],
  since: [],
  de: {
    'Tour suggestions: three times as many tours': 'Tourenvorschläge: dreimal so viele Touren',
    'The tour suggestions now hold every stage of the official mountain bike network and day tours made of two or three stages.': 'Die Tourenvorschläge enthalten jetzt jede Etappe des offiziellen Mountainbike-Netzes und Tagestouren aus zwei oder drei Etappen.',
    'Over 470 stages instead of 200: with «Medium» and «Easy» switched on you find the whole network, in every canton that has data': 'Über 470 Etappen statt 200: mit «Mittel» und «Leicht» siehst du das ganze Netz, in jedem Kanton, für den es Daten gibt',
    'Trips › Dreams › Tour suggestions: the filters, group «Fitness».': 'Touren › Träume › Tourenvorschläge: die Filter, Gruppe «Kondition».',
    'Day tours: two or three stages of the same route that follow each other make one longer tour («Zurich → Einsiedeln, 2 stages»); they are as hard as their hardest stage': 'Tagestouren: zwei oder drei aufeinanderfolgende Etappen derselben Route ergeben eine längere Tour («Zürich → Einsiedeln, 2 Etappen»); sie sind so schwer wie ihre schwerste Etappe',
    'Trips › Dreams › Tour suggestions: tours with «2 stages» or «3 stages» under the title.': 'Touren › Träume › Tourenvorschläge: Touren mit «2 Etappen» oder «3 Etappen» unter dem Titel.',
    'Open Trips › Dreams › Tour suggestions › «List»: the number of tours is higher than before. Under the filters switch «Medium» and «Easy» on: it grows to over 600.': 'Öffne Touren › Träume › Tourenvorschläge › «Liste»: die Zahl der Touren ist höher als vorher. Schalte unter den Filtern «Mittel» und «Leicht» ein: sie wächst auf über 600.',
    'Look for a tour with «2 stages» under the title and open it: the map shows the whole line, and km and climb are the sum of the stages.': 'Suche eine Tour mit «2 Etappen» unter dem Titel und öffne sie: die Karte zeigt die ganze Linie, und km und Aufstieg sind die Summe der Etappen.',
  },
};
