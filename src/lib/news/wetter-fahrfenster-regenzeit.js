// «Fahrfenster» and the weather card now name the same time for the rain (Fund aus dem Live-Test, 23.11.2026)
export default {
  title: 'One rain time on Today',
  lead: 'The ride window and the weather card now say the same time for the start of the rain.',
  points: [
    { text: 'The card «Ride window» says «Dry until …» with the same time as «Rain from …» in the weather card', go: { href: '#/', steps: [{ sel: '[data-heute-fenster]' }], where: 'Today › under the weather card, on a day with rain later and while it is still dry.' } },
  ],
  small: [],
  test: ['Open Today on a day with rain later: the weather card says «Rain from …».', 'Look at the card «Ride window»: «Dry until …» names the same time.'],
  since: [],
  de: {
    'One rain time on Today': 'Eine Regenzeit auf Heute',
    'The ride window and the weather card now say the same time for the start of the rain.': 'Das Fahrfenster und die Wetterkarte nennen jetzt dieselbe Zeit für den Beginn des Regens.',
    'The card «Ride window» says «Dry until …» with the same time as «Rain from …» in the weather card': 'Die Karte «Fahrfenster» sagt «Trocken bis …» mit derselben Zeit wie «Regen ab …» in der Wetterkarte',
    'Today › under the weather card, on a day with rain later and while it is still dry.': 'Heute › unter der Wetterkarte, an einem Tag mit Regen später und solange es noch trocken ist.',
    'Open Today on a day with rain later: the weather card says «Rain from …».': 'Öffne Heute an einem Tag mit Regen später: Die Wetterkarte sagt «Regen ab …».',
    'Look at the card «Ride window»: «Dry until …» names the same time.': 'Schau auf die Karte «Fahrfenster»: «Trocken bis …» nennt dieselbe Zeit.',
  },
};
