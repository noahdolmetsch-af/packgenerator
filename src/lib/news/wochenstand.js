// «Wochenstand» (Noah 24.11.2026 «1-3»): one quiet line on the week card, Outdoors and meditation of the finished week
export default {
  title: 'Your week: Outdoors and meditation',
  lead: 'The week card on Sunday evening says on how many days you were outdoors and meditated.',
  points: [
    { text: 'One quiet line «Outdoors on 5 of 7 days · Meditation on 3 days», only to look at, never a grade', go: { href: '#/', steps: [{ sel: '[data-wk-stand]' }], where: 'Today › the week card, from Sunday 17:00 to Monday 12:00, under «Active on … days».' } },
  ],
  small: [{ box: 'new', text: 'Without a challenge or a meditation the part is simply not there' }],
  test: [
    'On Sunday evening open Today: the week card shows the line with Outdoors and meditation.',
    'Check against your week: the days with enough minutes outdoors, the days with a meditation.',
  ],
  since: [],
  de: {
    'Your week: Outdoors and meditation': 'Deine Woche: Draussen und Meditation',
    'The week card on Sunday evening says on how many days you were outdoors and meditated.': 'Die Wochenkarte am Sonntagabend sagt, an wie vielen Tagen du draussen warst und meditiert hast.',
    'One quiet line «Outdoors on 5 of 7 days · Meditation on 3 days», only to look at, never a grade': 'Eine ruhige Zeile «Draussen an 5 von 7 Tagen · Meditation an 3 Tagen», nur zum Anschauen, nie eine Wertung',
    'Today › the week card, from Sunday 17:00 to Monday 12:00, under «Active on … days».': 'Heute › die Wochenkarte, von Sonntag 17 Uhr bis Montag 12 Uhr, unter «In Bewegung an … Tagen».',
    'Without a challenge or a meditation the part is simply not there': 'Ohne Challenge oder Meditation fehlt der Teil einfach',
    'On Sunday evening open Today: the week card shows the line with Outdoors and meditation.': 'Öffne am Sonntagabend Heute: die Wochenkarte zeigt die Zeile mit Draussen und Meditation.',
    'Check against your week: the days with enough minutes outdoors, the days with a meditation.': 'Vergleiche mit deiner Woche: die Tage mit genug Minuten draussen, die Tage mit einer Meditation.',
  },
};
