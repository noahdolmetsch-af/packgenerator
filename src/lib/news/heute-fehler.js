// «Heute: kleine Fehler» (Noah 04.11.2026 «1 und 3», Punkt 3): greeting spelled the same, names in «Diese Woche» whole, «Velo im Monat» says what the % compares to
export default {
  title: 'Today: three small fixes',
  lead: 'The greeting and «Wi gaht\'s?» are spelled the same, «This week» shows whole names, and «Bike this month» says what its percentage compares to.',
  points: [
    { text: '«Wi gaht\'s?» is spelled the same in the greeting and in the question', go: { href: '#/', steps: [{ sel: '[data-hello-tap]' }] } },
    { text: '«This week»: the activities of each day stand in full lines instead of «Ten…»', go: { href: '#/', steps: [{ sel: '[data-week-list]' }] } },
    { text: 'The tile «Bike this month» says what the percentage compares to', go: { href: '#/', steps: [{ sel: '[data-section="month"]' }] } },
  ],
  small: [],
  test: [
    'Open Today: the greeting reads «…, wi gaht\'s?», tap it: the question below it is «Wi gaht\'s?» too.',
    'Look at «This week»: activities of a day are written out in full lines under the days.',
    'Look at the tile «Bike this month»: under the percentage it says «Same days in …: … km».',
  ],
  since: [],
  de: {
    'Today: three small fixes': 'Heute: drei kleine Korrekturen',
    'The greeting and «Wi gaht\'s?» are spelled the same, «This week» shows whole names, and «Bike this month» says what its percentage compares to.': 'Der Gruss und «Wi gaht\'s?» sind gleich geschrieben, «Diese Woche» zeigt ganze Namen, und «Velo in diesem Monat» sagt, womit die Prozent verglichen werden.',
    '«Wi gaht\'s?» is spelled the same in the greeting and in the question': '«Wi gaht\'s?» ist im Gruss und in der Frage gleich geschrieben',
    '«This week»: the activities of each day stand in full lines instead of «Ten…»': '«Diese Woche»: Die Aktivitäten jedes Tages stehen in ganzen Zeilen statt «Ten…»',
    'The tile «Bike this month» says what the percentage compares to': 'Die Kachel «Velo in diesem Monat» sagt, womit die Prozent verglichen werden',
    'Open Today: the greeting reads «…, wi gaht\'s?», tap it: the question below it is «Wi gaht\'s?» too.': 'Öffne Heute: Der Gruss lautet «…, wi gaht\'s?», tippe ihn an: Die Frage darunter heisst auch «Wi gaht\'s?».',
    'Look at «This week»: activities of a day are written out in full lines under the days.': 'Schau «Diese Woche» an: Die Aktivitäten eines Tages stehen in ganzen Zeilen unter den Tagen.',
    'Look at the tile «Bike this month»: under the percentage it says «Same days in …: … km».': 'Schau die Kachel «Velo in diesem Monat» an: Unter den Prozent steht «Gleiche Tage im …: … km».',
    'Same days in {month}: {km} km': 'Gleiche Tage im {month}: {km} km',
  },
};
