// «Haken und Rhythmus» (Noah 22.11.2026 «a, aber sicherstellen, dass keine vergangenen daten verloren gehen», S5): the ticks are evaluated in the Sports year
export default {
  title: 'Ticks and rhythm in the Sports year',
  lead: 'The page «Ticks evaluated» is part of the Sports year now. Nothing is lost: every tick shows there.',
  points: [
    { text: 'At the bottom of the Sports year: «Ticks and rhythm» with the same tiles and analyses as before, for the period you chose, for all activities or one', go: { href: '#/auswerten/sportjahr', steps: [{ sel: '[data-sj-rhythm]' }], where: 'At the very bottom of the page. Pick «Year» above.' } },
    { text: 'Meditation, sauna, the ride to work and every Strava unit count there too', go: 'f.sportjahr' },
    { text: 'The old address leads to the Sports year; the answers of the check questions keep their own tab «Answers evaluated»', go: 'f.tickreview' },
  ],
  small: [{ box: 'new', text: 'In the Sports year you pick the period with the same switch as everywhere in Analysis' }],
  test: ['Open Analysis › Sports year, tap «Year» and scroll to the end: «Ticks and rhythm».', 'Pick «Meditation» in the list: the tiles and cards show only its ticks.'],
  since: [],
  de: {
    'Ticks and rhythm in the Sports year': 'Haken und Rhythmus im Sportjahr',
    'The page «Ticks evaluated» is part of the Sports year now. Nothing is lost: every tick shows there.': 'Die Seite «Haken ausgewertet» gehört jetzt zum Sportjahr. Es geht nichts verloren: jeder Haken steht dort.',
    'At the bottom of the Sports year: «Ticks and rhythm» with the same tiles and analyses as before, for the period you chose, for all activities or one': 'Ganz unten im Sportjahr: «Haken und Rhythmus» mit denselben Kacheln und Auswertungen wie bisher, für den gewählten Zeitraum, für alle Aktivitäten oder eine',
    'Meditation, sauna, the ride to work and every Strava unit count there too': 'Meditation, Sauna, der Arbeitsweg und jede Strava-Einheit zählen dort auch',
    'The old address leads to the Sports year; the answers of the check questions keep their own tab «Answers evaluated»': 'Die alte Adresse führt zum Sportjahr; die Antworten der Check-Fragen haben ihren eigenen Reiter «Antworten ausgewertet»',
    'In the Sports year you pick the period with the same switch as everywhere in Analysis': 'Im Sportjahr wählst du den Zeitraum mit demselben Schalter wie überall in Auswerten',
    'At the very bottom of the page. Pick «Year» above.': 'Ganz unten auf der Seite. Wähle oben «Jahr».',
    'Open Analysis › Sports year, tap «Year» and scroll to the end: «Ticks and rhythm».': 'Öffne Auswerten › Sportjahr, tippe auf «Jahr» und scrolle ans Ende: «Haken und Rhythmus».',
    'Pick «Meditation» in the list: the tiles and cards show only its ticks.': 'Wähle in der Liste «Meditation»: die Kacheln und Karten zeigen nur ihre Haken.',
  },
};
