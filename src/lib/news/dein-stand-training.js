// «Neue Ordnung» V4b2 (Noah 22.11.2026 «2a»): the card «Your status» on Training › Week
export default {
  title: '«Your status» on Training',
  lead: 'Under your week stands one quiet card: how ready you are, the hours of this week, your resting pulse and the next race.',
  points: [
    { text: 'Each line is one tap away from where it is looked at in Auswerten; lines without data are left out', go: { href: '#/flow/training', steps: [{ sel: '[data-section="stand"]' }], where: 'Open Week › Training and scroll below «My week». The card «Your status» stands as soon as there is something to say, for example a training goal.' } },
  ],
  small: [],
  test: [
    'Open Week › Training and set an hour goal («Set a goal»): the card «Your status» shows this week against the goal.',
    'Tap that line: the week in review opens.',
  ],
  since: [],
  de: {
    '«Your status» on Training': '«Dein Stand» auf Training',
    'Under your week stands one quiet card: how ready you are, the hours of this week, your resting pulse and the next race.': 'Unter deiner Woche steht eine ruhige Karte: wie bereit du bist, die Stunden dieser Woche, dein Ruhepuls und das nächste Rennen.',
    'Each line is one tap away from where it is looked at in Auswerten; lines without data are left out': 'Jede Zeile führt mit einem Tipp dorthin, wo sie in Auswerten angeschaut wird; Zeilen ohne Daten fehlen',
    'Open Week › Training and scroll below «My week». The card «Your status» stands as soon as there is something to say, for example a training goal.': 'Öffne Woche › Training und scrolle unter «Meine Woche». Die Karte «Dein Stand» steht, sobald es etwas zu sagen gibt, zum Beispiel ein Trainingsziel.',
    'Open Week › Training and set an hour goal («Set a goal»): the card «Your status» shows this week against the goal.': 'Öffne Woche › Training und setze ein Stundenziel («Ziel setzen»): die Karte «Dein Stand» zeigt diese Woche gegen das Ziel.',
    'Tap that line: the week in review opens.': 'Tippe diese Zeile: der Wochenrückblick öffnet sich.',
  },
};
