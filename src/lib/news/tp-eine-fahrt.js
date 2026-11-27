// «Eine Fahrt erfüllt eine Einheit» (Noah 27.11.2026, Thread «TrainingPeaks-Einheiten korrekt übernehmen»): one ride ticked every planned session of the same sport on that day
export default {
  title: 'One ride fulfils one planned session',
  lead: 'A ride you did now ticks only the one planned session it fits, not every session of that sport on that day.',
  points: [
    { text: 'Training › My week: when two sessions of the same sport are planned on one day, a ride you did ticks only the one it fits (same start time, else the closest length); the other stays open', go: { href: '#/flow/training', where: 'Training › My week, on a day with two planned sessions of one sport.' } },
  ],
  small: [{ box: 'new', text: 'My week, the week review and the weekly total count a ride once' }],
  test: [
    'Open Training › My week on a day with two planned sessions of the same sport and one ride done.',
    'Only the session that fits the ride is ticked; the other one stays open and can be ticked by hand.',
  ],
  since: [],
  de: {
    'One ride fulfils one planned session': 'Eine Fahrt erfüllt eine geplante Einheit',
    'A ride you did now ticks only the one planned session it fits, not every session of that sport on that day.': 'Eine gefahrene Fahrt hakt nur noch die eine geplante Einheit ab, zu der sie passt, nicht jede Einheit dieser Sportart am Tag.',
    'Training › My week: when two sessions of the same sport are planned on one day, a ride you did ticks only the one it fits (same start time, else the closest length); the other stays open': 'Training › Meine Woche: Sind an einem Tag zwei Einheiten derselben Sportart geplant, hakt eine gefahrene Fahrt nur die eine ab, zu der sie passt (gleiche Startzeit, sonst die nächste Dauer); die andere bleibt offen',
    'Training › My week, on a day with two planned sessions of one sport.': 'Training › Meine Woche, an einem Tag mit zwei geplanten Einheiten einer Sportart.',
    'My week, the week review and the weekly total count a ride once': 'Meine Woche, die Wochenrückschau und die Wochensumme zählen eine Fahrt nur einmal',
    'Open Training › My week on a day with two planned sessions of the same sport and one ride done.': 'Öffne Training › Meine Woche an einem Tag mit zwei geplanten Einheiten derselben Sportart und einer gefahrenen Fahrt.',
    'Only the session that fits the ride is ticked; the other one stays open and can be ticked by hand.': 'Nur die Einheit, die zur Fahrt passt, ist abgehakt; die andere bleibt offen und kann von Hand abgehakt werden.',
  },
};
