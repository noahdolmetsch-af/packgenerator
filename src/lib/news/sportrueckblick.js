// «Rückblick pro Sportart» (Noah 21.11.2026 «ich möchte alle entwürfe 1-3 umsetzen», S4): the year of one sport
export default {
  title: 'The year of one sport',
  lead: 'Tap a sport in the sports year and see its hours, units, average duration and distance against the year before.',
  points: [
    { text: 'Every sport under «Where did the time go?» opens its own year: hours per month, where the units come from and the best values', go: 'f.sportrueckblick' },
    { text: 'The page of a sport has a card «Your year» that leads there', go: { href: '#/auswerten/sportjahr', steps: [{ sel: '[data-sj-where]' }], where: 'Shows when there is a unit in the chosen period. Pick «Year» above.' } },
  ],
  small: [],
  test: ['Open Analysis › Sports year, tap «Year» and then a sport under «Where did the time go?».', 'Read the numbers against the year before and the best values at the bottom.'],
  since: ['f.sportrueckblick'],
  de: {
    'The year of one sport': 'Das Jahr einer Sportart',
    'Tap a sport in the sports year and see its hours, units, average duration and distance against the year before.': 'Tippe im Sportjahr auf eine Sportart und sieh ihre Stunden, Einheiten, durchschnittliche Dauer und Strecke gegen das Vorjahr.',
    'Every sport under «Where did the time go?» opens its own year: hours per month, where the units come from and the best values': 'Jede Sportart unter «Wo ging die Zeit hin?» öffnet ihr eigenes Jahr: Stunden pro Monat, woher die Einheiten kommen und die Bestwerte',
    'The page of a sport has a card «Your year» that leads there': 'Die Seite einer Sportart hat eine Karte «Dein Jahr», die dorthin führt',
    'Open Analysis › Sports year, tap «Year» and then a sport under «Where did the time go?».': 'Öffne Auswerten › Sportjahr, tippe auf «Jahr» und dann unter «Wo ging die Zeit hin?» auf eine Sportart.',
    'Read the numbers against the year before and the best values at the bottom.': 'Lies die Zahlen gegen das Vorjahr und unten die Bestwerte.',
  },
};
