// «Planen 2a: Wochenplan mit Wetterfenster» (Noah 05.11.2026 «Planen 2a»): the best free and dry window of the week
export default {
  title: 'The best ride window of the week',
  lead: 'Plan › Week marks the best free and dry window and offers a round that fits.',
  points: [{ text: 'The window is marked on its day; one tap plans the ride', href: '#/week', go: 'f.freeslot' }],
  small: [
    { box: 'new', text: 'A 3-hour round when 3 hours are free and dry, else 2 hours', go: 'f.freeslot' },
    { box: 'new', text: 'Your own dates count too, not only your Google calendar', go: 'f.freeslot' },
  ],
  test: [
    'Open Plan › Week: the card on top names the best window of the week; its day carries a small bike mark.',
    'Tap «Plan the ride»: a date «Ride» appears on that day, and Undo takes it out again.',
  ],
  since: [],
  de: {
    'The best ride window of the week': 'Das beste Ausfahrt-Fenster der Woche',
    'Plan › Week marks the best free and dry window and offers a round that fits.': 'Planen › Woche markiert das beste freie, trockene Fenster und schlägt eine passende Runde vor.',
    'The window is marked on its day; one tap plans the ride': 'Das Fenster ist an seinem Tag markiert; ein Tipp plant die Fahrt ein',
    'A 3-hour round when 3 hours are free and dry, else 2 hours': 'Eine 3-Stunden-Runde, wenn 3 Stunden frei und trocken sind, sonst 2 Stunden',
    'Your own dates count too, not only your Google calendar': 'Auch deine eigenen Termine zählen, nicht nur dein Google-Kalender',
    'Open Plan › Week: the card on top names the best window of the week; its day carries a small bike mark.': 'Öffne Planen › Woche: die Karte oben nennt das beste Fenster der Woche; sein Tag trägt ein kleines Velo-Zeichen.',
    'Tap «Plan the ride»: a date «Ride» appears on that day, and Undo takes it out again.': 'Tippe auf «Fahrt einplanen»: an diesem Tag steht ein Termin «Ausfahrt», und «Rückgängig» nimmt ihn wieder heraus.',
  },
};
