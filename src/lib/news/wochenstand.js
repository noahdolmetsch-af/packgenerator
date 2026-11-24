// «Wochenstand» and «The best window today» (Noah 24.11.2026 «1-3»): two quiet lines on Today
export default {
  title: 'Your week and the best window today',
  lead: 'The week card says on how many days you were outdoors and meditated, and under Outdoors one sentence tells when it is dry.',
  points: [
    { text: 'One quiet line «Outdoors on 5 of 7 days · Meditation on 3 days», only to look at, never a grade', go: { href: '#/', steps: [{ sel: '[data-wk-stand]' }], where: 'Today › the week card, from Sunday 17:00 to Monday 12:00, under «Active on … days».' } },
    { text: 'Under Outdoors one quiet sentence from the hourly rain: «Dry until 19:00 today», or when it gets dry', go: { href: '#/', steps: [{ sel: '[data-cl-window]' }], where: 'Today › Tick off today, under the line Outdoors (only while the challenge runs and the day is open, with a home place).' } },
  ],
  small: [{ box: 'new', text: 'Without a challenge or a meditation the part is simply not there' }],
  test: [
    'On Sunday evening open Today: the week card shows the line with Outdoors and meditation.',
    'Check against your week: the days with enough minutes outdoors, the days with a meditation.',
    'During the day open Today: under «Outdoors» stands when it stays dry or when it gets dry.',
  ],
  since: [],
  de: {
    'Your week and the best window today': 'Deine Woche und das beste Fenster heute',
    'The week card says on how many days you were outdoors and meditated, and under Outdoors one sentence tells when it is dry.': 'Die Wochenkarte sagt, an wie vielen Tagen du draussen warst und meditiert hast, und unter Draussen steht ein Satz, wann es trocken ist.',
    'Under Outdoors one quiet sentence from the hourly rain: «Dry until 19:00 today», or when it gets dry': 'Unter Draussen ein ruhiger Satz aus dem Stundenwetter: «Heute trocken bis 19 Uhr» oder wann es trocken wird',
    'Today › Tick off today, under the line Outdoors (only while the challenge runs and the day is open, with a home place).': 'Heute › Heute abhaken, unter der Zeile Draussen (nur solange die Challenge läuft, der Tag offen ist und ein Wohnort gesetzt ist).',
    'During the day open Today: under «Outdoors» stands when it stays dry or when it gets dry.': 'Öffne tagsüber Heute: unter «Draussen» steht, wie lange es trocken bleibt oder wann es trocken wird.',
    'One quiet line «Outdoors on 5 of 7 days · Meditation on 3 days», only to look at, never a grade': 'Eine ruhige Zeile «Draussen an 5 von 7 Tagen · Meditation an 3 Tagen», nur zum Anschauen, nie eine Wertung',
    'Today › the week card, from Sunday 17:00 to Monday 12:00, under «Active on … days».': 'Heute › die Wochenkarte, von Sonntag 17 Uhr bis Montag 12 Uhr, unter «In Bewegung an … Tagen».',
    'Without a challenge or a meditation the part is simply not there': 'Ohne Challenge oder Meditation fehlt der Teil einfach',
    'On Sunday evening open Today: the week card shows the line with Outdoors and meditation.': 'Öffne am Sonntagabend Heute: die Wochenkarte zeigt die Zeile mit Draussen und Meditation.',
    'Check against your week: the days with enough minutes outdoors, the days with a meditation.': 'Vergleiche mit deiner Woche: die Tage mit genug Minuten draussen, die Tage mit einer Meditation.',
  },
};
