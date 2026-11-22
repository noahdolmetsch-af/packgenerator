// «Jahre vergleichen» (Noah 21.11.2026 «ich möchte alle entwürfe 1-3 umsetzen», S9): die Jahre nebeneinander im Sportjahr
export default {
  title: 'Years side by side',
  lead: 'In the sports year, «Everything» now puts every year next to the others. Only to look at, nothing is graded.',
  points: [
    { text: 'Hours, units, best week and best month of every year', go: { href: '#/auswerten/sportjahr', steps: [{ sel: '[data-period-bar] [data-key="all"]' }, { sel: '[data-sj-years]' }], where: 'Pick «Everything» above. It shows from two years on.' } },
    { text: 'Summer and winter: the biggest sports of each season over all years', go: { href: '#/auswerten/sportjahr', steps: [{ sel: '[data-period-bar] [data-key="all"]' }, { sel: '[data-sj-season]' }], where: 'Pick «Everything» above. It shows from two years on.' } },
  ],
  small: [],
  test: ['Open Analysis › Sports year and tap «Everything».', 'Read the hours of every year and the biggest sports of summer and winter.'],
  since: [],
  de: {
    'Years side by side': 'Die Jahre nebeneinander',
    'In the sports year, «Everything» now puts every year next to the others. Only to look at, nothing is graded.': 'Im Sportjahr stellt «Alles» jetzt jedes Jahr neben die anderen. Nur zum Anschauen, nichts wird bewertet.',
    'Hours, units, best week and best month of every year': 'Stunden, Einheiten, beste Woche und bester Monat jedes Jahres',
    'Pick «Everything» above. It shows from two years on.': 'Wähle oben «Alles». Es erscheint ab zwei Jahren.',
    'Summer and winter: the biggest sports of each season over all years': 'Sommer und Winter: die grössten Sportarten jeder Saison über alle Jahre',
    'Open Analysis › Sports year and tap «Everything».': 'Öffne Auswerten › Sportjahr und tippe auf «Alles».',
    'Read the hours of every year and the biggest sports of summer and winter.': 'Lies die Stunden jedes Jahres und die grössten Sportarten von Sommer und Winter.',
  },
};
