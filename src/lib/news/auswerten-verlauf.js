// «Auswerten neu» Teil 3 (Noah 24.11.2026 «1b 2a 3b 4a 5a», Entwurf C «Cockpit»): the tab «Verlauf» of Auswerten
export default {
  title: 'Analysis ends with Course',
  lead: 'The tab «Course» of Analysis shows your values over time, your normal over the years and what your data shows about your nights.',
  points: [
    { text: 'HRV, resting pulse and sleep with your own usual range behind the line, from 4 weeks to 2 years', go: { href: '#/auswerten/verlauf', steps: [{ sel: '[data-verlauf-chart="hrv"]' }], where: 'Analysis › Course: the three lines.' } },
    { text: 'Your normal year by year, and two patterns of your nights (bedtime, a long ride), each only with 15 nights or more', go: { href: '#/auswerten/verlauf', steps: [{ sel: '[data-verlauf-years]' }], where: 'Analysis › Course: «Your normal over the years».' } },
  ],
  small: [{ box: 'nicer', text: 'The tabs «Body», «How you are» and «Own diagram» are now one tab «Course»; every page is a chip in it, with its old address' }],
  test: ['Open Analysis › Course: three lines (HRV, resting pulse, sleep) with a soft band behind them.', 'Switch to 2 years: the lines show a point per week.', 'Scroll down: «Your normal over the years» shows one band per year, and «What your data shows» the two patterns.'],
  since: ['f.auswertenverlauf'],
  de: {
    'Analysis ends with Course': 'Auswerten endet mit Verlauf',
    'The tab «Course» of Analysis shows your values over time, your normal over the years and what your data shows about your nights.': 'Der Reiter «Verlauf» in Auswerten zeigt deine Werte über die Zeit, dein Normal über die Jahre und was deine Daten über deine Nächte zeigen.',
    'HRV, resting pulse and sleep with your own usual range behind the line, from 4 weeks to 2 years': 'HRV, Ruhepuls und Schlaf mit deinem eigenen Üblichen hinter der Linie, von 4 Wochen bis 2 Jahre',
    'Your normal year by year, and two patterns of your nights (bedtime, a long ride), each only with 15 nights or more': 'Dein Normal Jahr für Jahr und zwei Muster deiner Nächte (Bettzeit, eine lange Fahrt), jedes nur ab 15 Nächten',
    'Analysis › Course: the three lines.': 'Auswerten › Verlauf: die drei Linien.',
    'Analysis › Course: «Your normal over the years».': 'Auswerten › Verlauf: «Dein Normal über die Jahre».',
    'The tabs «Body», «How you are» and «Own diagram» are now one tab «Course»; every page is a chip in it, with its old address': 'Die Reiter «Körper», «Wi gaht\'s?» und «Eigenes Diagramm» sind jetzt ein Reiter «Verlauf»; jede Seite ist ein Chip darin, mit ihrer alten Adresse',
    'Open Analysis › Course: three lines (HRV, resting pulse, sleep) with a soft band behind them.': 'Öffne Auswerten › Verlauf: drei Linien (HRV, Ruhepuls, Schlaf) mit einem weichen Band dahinter.',
    'Switch to 2 years: the lines show a point per week.': 'Wechsle zu 2 Jahre: die Linien zeigen einen Punkt pro Woche.',
    'Scroll down: «Your normal over the years» shows one band per year, and «What your data shows» the two patterns.': 'Scrolle nach unten: «Dein Normal über die Jahre» zeigt ein Band pro Jahr und «Was deine Daten zeigen» die zwei Muster.',
  },
};
