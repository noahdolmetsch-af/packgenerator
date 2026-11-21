// «Sportjahr» (Noah 21.11.2026 «1 a dann b», Thread «Sportjahr», S3): everything you did in hours, all sports together
export default {
  title: 'Your sports year',
  lead: 'One page for everything you did: Strava and your ticks together, in hours, by sport, with the year before.',
  points: [
    { text: 'New tab «Sportjahr» in Analysis: week, month, year or everything, with hours, units, days with training and sports', go: 'f.sportjahr' },
    { text: 'The bars show the hours per month by sport, a dashed line the same months of the year before', go: { href: '#/auswerten/sportjahr', steps: [{ sel: '[data-chart="sportjahr"]' }], where: 'Shows when there is a unit in the chosen period. Pick «Year» above.' } },
    { text: '«Where did the time go?» switches between hours, units, days and km; records, streaks and the weeks with training follow', go: { href: '#/auswerten/sportjahr', steps: [{ sel: '[data-sj-where]' }], where: 'Shows when there is a unit in the chosen period. Pick «Year» above.' } },
  ],
  small: [{ box: 'new', text: 'Where no time was measured, the usual duration of the sport counts and says «ca.»', go: { href: '#/auswerten/sportjahr', steps: [{ sel: '[data-sj-totals]' }], where: 'Shows when a unit has no measured time. Pick «Year» above.' } }],
  test: ['Open Analysis › Sports year and tap «Year».', 'Read the hours at the top, then tap «km» under «Where did the time go?».'],
  since: ['f.sportjahr'],
  de: {
    'Your sports year': 'Dein Sportjahr',
    'One page for everything you did: Strava and your ticks together, in hours, by sport, with the year before.': 'Eine Seite für alles, was du gemacht hast: Strava und deine Haken zusammen, in Stunden, nach Sportart, mit dem Vorjahr.',
    'New tab «Sportjahr» in Analysis: week, month, year or everything, with hours, units, days with training and sports': 'Neuer Reiter «Sportjahr» in Auswerten: Woche, Monat, Jahr oder Alles, mit Stunden, Einheiten, Tagen mit Training und Sportarten',
    'The bars show the hours per month by sport, a dashed line the same months of the year before': 'Die Balken zeigen die Stunden pro Monat nach Sportart, eine gestrichelte Linie dieselben Monate des Vorjahrs',
    '«Where did the time go?» switches between hours, units, days and km; records, streaks and the weeks with training follow': '«Wo ging die Zeit hin?» schaltet zwischen Stunden, Einheiten, Tagen und km um; danach folgen Rekorde, Serien und die Wochen mit Training',
    'Where no time was measured, the usual duration of the sport counts and says «ca.»': 'Wo keine Zeit gemessen wurde, zählt die übliche Dauer der Sportart und steht als «ca.»',
    'Shows when there is a unit in the chosen period. Pick «Year» above.': 'Erscheint, wenn es im gewählten Zeitraum eine Einheit gibt. Wähle oben «Jahr».',
    'Shows when a unit has no measured time. Pick «Year» above.': 'Erscheint, wenn eine Einheit keine gemessene Zeit hat. Wähle oben «Jahr».',
    'Open Analysis › Sports year and tap «Year».': 'Öffne Auswerten › Sportjahr und tippe auf «Jahr».',
    'Read the hours at the top, then tap «km» under «Where did the time go?».': 'Lies oben die Stunden und tippe dann unter «Wo ging die Zeit hin?» auf «km».',
  },
};
