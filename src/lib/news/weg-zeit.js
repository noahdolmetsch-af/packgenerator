// «Weg zum Ziel»: Reicht die Zeit? (Idee 2b, Noah 05.11.2026, Entwurf G)
export default {
  title: 'Way to the goal: is there enough time?',
  lead: 'A card shows if the weeks to the start are enough for the plan.',
  points: [
    { text: 'The card «Is there enough time?» compares the weeks to the start with the weeks the plan needs and, when the time is short, suggests a later start day', go: { href: '#/trips/weg', where: 'Trips › Way to the goal, in a way with a start day.' } },
  ],
  test: ['Open Trips › Way to the goal, in a way whose start day is far away: the card «Is there enough time?» says the time is enough.', 'Move the start day to next week: the card says the time is short and offers a later start day. Tap it: the card says it is tight.'],
  since: [],
  de: {
    'Way to the goal: is there enough time?': 'Weg zum Ziel: Reicht die Zeit?',
    'A card shows if the weeks to the start are enough for the plan.': 'Eine Karte zeigt, ob die Wochen bis zum Start für den Plan reichen.',
    'The card «Is there enough time?» compares the weeks to the start with the weeks the plan needs and, when the time is short, suggests a later start day': 'Die Karte «Reicht die Zeit?» vergleicht die Wochen bis zum Start mit den Wochen, die der Plan braucht, und schlägt bei knapper Zeit einen späteren Starttag vor',
    'Trips › Way to the goal, in a way with a start day.': 'Touren › Weg zum Ziel, in einem Weg mit Starttag.',
    'Open Trips › Way to the goal, in a way whose start day is far away: the card «Is there enough time?» says the time is enough.': 'Öffne Touren › Weg zum Ziel, in einem Weg mit weit entferntem Starttag: Die Karte «Reicht die Zeit?» sagt, dass die Zeit reicht.',
    'Move the start day to next week: the card says the time is short and offers a later start day. Tap it: the card says it is tight.': 'Setze den Starttag auf nächste Woche: Die Karte sagt, dass die Zeit knapp bemessen ist, und bietet einen späteren Starttag an. Tippe darauf: Die Karte sagt, dass es knapp ist.',
  },
};
