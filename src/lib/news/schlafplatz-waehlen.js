// «Schlafplatz wählen» (Noah 02.11.2026 «2a und b», «ok schlafplatz»): in the night sheet choose your own bed, navigate there, keep an emergency bed
export default {
  title: 'Choose your bed',
  lead: 'In the night sheet you pick where you sleep, from a list or on the map, and keep an emergency bed.',
  points: [
    { text: 'The night sheet lists other places to sleep nearby: roofs first when it rains, beds when it is cold; choose one as your bed', href: '#/live', go: 'f.live' },
    { text: 'Navigate to a place to sleep with one tap, or keep it as your emergency bed (with Undo)', href: '#/live', go: 'f.live' },
  ],
  small: [{ box: 'new', text: 'You can also choose the bed by tapping the map' }],
  test: ['Start the live map, tap «⋯» › «Night sheet» › «Change»: a list of places to sleep appears.', 'Tap «Choose» on one: it shows as «My bed». Tap «Keep as emergency bed» on another: it shows as «Emergency bed».'],
  since: [],
  de: {
    'Choose your bed': 'Wähle dein Bett',
    'In the night sheet you pick where you sleep, from a list or on the map, and keep an emergency bed.': 'Im Nacht-Blatt wählst du, wo du schläfst, aus einer Liste oder auf der Karte, und merkst dir ein Notfall-Bett.',
    'The night sheet lists other places to sleep nearby: roofs first when it rains, beds when it is cold; choose one as your bed': 'Das Nacht-Blatt listet andere Schlafplätze in der Nähe: bei Regen zuerst Dächer, bei Kälte Betten; wähle eines als dein Bett',
    'Navigate to a place to sleep with one tap, or keep it as your emergency bed (with Undo)': 'Mit einem Tipp zum Schlafplatz navigieren oder ihn als Notfall-Bett merken (mit Rückgängig)',
    'You can also choose the bed by tapping the map': 'Das Bett lässt sich auch mit einem Tipp auf die Karte wählen',
    'Start the live map, tap «⋯» › «Night sheet» › «Change»: a list of places to sleep appears.': 'Live-Karte starten, «⋯» › «Nacht-Blatt» › «Ändern»: Eine Liste mit Schlafplätzen erscheint.',
    'Tap «Choose» on one: it shows as «My bed». Tap «Keep as emergency bed» on another: it shows as «Emergency bed».': 'Bei einem «Wählen» antippen: Er steht als «Mein Bett». Bei einem anderen «Als Notfall-Bett merken»: Er steht als «Notfall-Bett».',
  },
};
