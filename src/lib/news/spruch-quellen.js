// «Spruch zum Einstieg» PR 2 (Noah 07.11.2026 «bau spruch pr2»): more sources and a second wording for each sentence
export default {
  title: 'More sayings on Today',
  lead: 'The tile «Saying» now also knows your steps, weeks in a row, bike km, a year ago, the fog and your quotes.',
  points: [
    { text: 'The tile «Saying» uses your steps, weeks in a row, bike km of the year and the trip of a year ago', go: { href: '#/', steps: [{ sel: '[data-section="spruch"]' }] } },
    { text: 'Every few sentences a quote of «Cushion time» comes, in High German; with all quotes off and no numbers the tile says why it is empty', go: { href: '#/', steps: [{ sel: '[data-spruch-new]' }] } },
  ],
  small: [
    { box: 'new', text: 'Each sentence has a second wording, so the same number sounds different later' },
    { box: 'new', text: 'The fog clearing at your home place gets its own sentence' },
  ],
  test: [
    'Open Today and tap «New saying» a few times on the tile «Saying»: more kinds of sentences appear.',
    'Tap «Why?» on a new sentence: the number behind it is shown.',
  ],
  de: {
    'More sayings on Today': 'Mehr Sprüche auf Heute',
    'The tile «Saying» now also knows your steps, weeks in a row, bike km, a year ago, the fog and your quotes.': 'Die Kachel «Spruch» kennt jetzt auch deine Schritte, Wochen in Folge, Velo-Kilometer, das Vorjahr, den Nebel und deine Zitate.',
    'The tile «Saying» uses your steps, weeks in a row, bike km of the year and the trip of a year ago': 'Die Kachel «Spruch» nutzt deine Schritte, Wochen in Folge, Velo-Kilometer des Jahres und die Tour von vor einem Jahr',
    'Every few sentences a quote of «Cushion time» comes, in High German; with all quotes off and no numbers the tile says why it is empty': 'Alle paar Sätze kommt ein Zitat aus der «Kissenzeit» auf Hochdeutsch; ohne Zitate und ohne Zahlen sagt die Kachel, warum sie leer ist',
    'Each sentence has a second wording, so the same number sounds different later': 'Jeder Satz hat eine zweite Formulierung, so klingt dieselbe Zahl später anders',
    'The fog clearing at your home place gets its own sentence': 'Der abziehende Nebel an deinem Wohnort bekommt einen eigenen Satz',
    'Open Today and tap «New saying» a few times on the tile «Saying»: more kinds of sentences appear.': 'Öffne Heute und tippe auf der Kachel «Spruch» einige Male auf «Neuer Spruch»: es erscheinen mehr Arten von Sätzen.',
    'Tap «Why?» on a new sentence: the number behind it is shown.': 'Tippe bei einem neuen Satz auf «Warum?»: die Zahl dahinter erscheint.',
  },
};
