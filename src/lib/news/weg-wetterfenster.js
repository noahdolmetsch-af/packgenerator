// «Weg zum Ziel» › Wetterfenster (Noah 05.11.2026 «4a», Entwurf G3): from 7 days before the start, the days around it
export default {
  title: 'Way to the goal: weather window',
  lead: 'From a week before the start, a strip shows which days around it stay dry.',
  points: [
    { text: 'A week before the start the way shows the rain chance of the days around the start day and says whether your start is in a dry window', go: { href: '#/trips/weg', where: 'Trips › Way to the goal, in the last week before the start day of a way with a tour that has a saved forecast.' } },
  ],
  test: ['Open Trips › Way to the goal, in a way whose start day is at most a week away and whose tour has a saved forecast.', 'The card «Weather window for the start» shows the days with their rain chance and one calm sentence; the start day has a frame.'],
  since: [],
  de: {
    'Way to the goal: weather window': 'Weg zum Ziel: Wetterfenster',
    'From a week before the start, a strip shows which days around it stay dry.': 'Ab einer Woche vor dem Start zeigt ein Streifen, welche Tage rund um den Start trocken bleiben.',
    'A week before the start the way shows the rain chance of the days around the start day and says whether your start is in a dry window': 'Eine Woche vor dem Start zeigt der Weg die Regenchance der Tage rund um den Starttag und sagt, ob dein Start in einem trockenen Fenster liegt',
    'Trips › Way to the goal, in the last week before the start day of a way with a tour that has a saved forecast.': 'Touren › Weg zum Ziel, in der letzten Woche vor dem Starttag eines Weges, dessen Tour eine gespeicherte Vorhersage hat.',
    'Open Trips › Way to the goal, in a way whose start day is at most a week away and whose tour has a saved forecast.': 'Öffne Touren › Weg zum Ziel, in einem Weg, dessen Starttag höchstens eine Woche entfernt ist und dessen Tour eine gespeicherte Vorhersage hat.',
    'The card «Weather window for the start» shows the days with their rain chance and one calm sentence; the start day has a frame.': 'Die Karte «Wetterfenster zum Start» zeigt die Tage mit ihrer Regenchance und einen ruhigen Satz; der Starttag hat einen Rahmen.',
  },
};
