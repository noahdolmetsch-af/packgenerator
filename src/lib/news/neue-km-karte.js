// «Neue Kilometer auf der Karte» (Noah 27.11.2026 «1 2 3 4 5 6 7», Punkt 7, Thread «Neuland-Seite verbessern»)
export default {
  title: 'New kilometres on the map',
  lead: 'Under «New kilometres» a map shows where the new stretches of a year are.',
  points: [
    { text: 'The card «New kilometres» on New ground has a map: the roads you rode for the first time, in one colour, for the year you choose or for all years', go: { href: '#/neuland', steps: [{ sel: '[data-nk-map]' }] } },
    { text: 'The map zooms like the others: + and −, two fingers, the wheel, full screen', go: { href: '#/neuland', steps: [{ sel: '[data-nk-map]' }] } },
  ],
  small: [{ box: 'nicer', text: 'The map starts with Switzerland, or with the area of your new stretches if you were mostly elsewhere' }],
  test: [
    'Open New ground and scroll to the end: the card «New kilometres» with the bars per year.',
    'Under «Where it was new» pick a year: the new stretches of that year show on the map.',
    'Tap «All years»: all new stretches show. Zoom in with + to see single roads.',
  ],
  since: [],
  de: {
    'New kilometres on the map': 'Neue Kilometer auf der Karte',
    'Under «New kilometres» a map shows where the new stretches of a year are.': 'Unter «Neue Kilometer» zeigt eine Karte, wo die neuen Strecken eines Jahres liegen.',
    'The card «New kilometres» on New ground has a map: the roads you rode for the first time, in one colour, for the year you choose or for all years': 'Die Karte «Neue Kilometer» in Neuland hat eine Karte: die Strassen, die du zum ersten Mal gefahren bist, in einer Farbe, für das gewählte Jahr oder alle Jahre',
    'The map zooms like the others: + and −, two fingers, the wheel, full screen': 'Die Karte zoomt wie die anderen: + und −, zwei Finger, Mausrad, Vollbild',
    'The map starts with Switzerland, or with the area of your new stretches if you were mostly elsewhere': 'Die Karte beginnt mit der Schweiz, oder mit dem Gebiet deiner neuen Strecken, wenn du meist anderswo warst',
    'Open New ground and scroll to the end: the card «New kilometres» with the bars per year.': 'Öffne Neuland und scrolle ans Ende: die Karte «Neue Kilometer» mit den Balken je Jahr.',
    'Under «Where it was new» pick a year: the new stretches of that year show on the map.': 'Wähle unter «Wo es neu war» ein Jahr: die neuen Strecken dieses Jahres erscheinen auf der Karte.',
    'Tap «All years»: all new stretches show. Zoom in with + to see single roads.': 'Tippe «Alle Jahre»: alle neuen Strecken erscheinen. Zoome mit + hinein, um einzelne Strassen zu sehen.',
  },
};
