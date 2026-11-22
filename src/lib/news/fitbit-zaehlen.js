// «Zählen?» für Fitbit-Trainings (Noah 21.11.2026, Klügere Auswertungen K4): nur als Vorschlag, nie still
export default {
  title: 'Fitbit workouts as a suggestion',
  lead: 'Your watch knows workouts that have no tick, like tennis or ice hockey. The app asks once: count it, or not.',
  points: [
    { text: 'New card «Count?» in «My activities»: one tap makes the tick with the minutes of the workout, with Undo', go: { href: '#/flow/sports', steps: [{ sel: '[data-fitbit-zaehlen]' }], where: 'Training › My activities › the card «Count?» (shows when a Fitbit workout waits)' } },
  ],
  small: [{ box: 'new', text: '«Count all» does a whole sport at once; «Do not count» leaves a workout out for good' }],
  test: ['Open Active › My activities: if your watch knows workouts without a tick, the card «Count?» lists them by sport, newest first.', 'Tap «Count» on one: it is ticked with its minutes. Tap «Undo» within a few seconds: it is gone again.'],
  since: [],
  de: {
    'Training › My activities › the card «Count?» (shows when a Fitbit workout waits)': 'Training › Meine Aktivitäten › die Karte «Zählen?» (erscheint, wenn ein Fitbit-Training wartet)',
    'Fitbit workouts as a suggestion': 'Fitbit-Trainings als Vorschlag',
    'Your watch knows workouts that have no tick, like tennis or ice hockey. The app asks once: count it, or not.': 'Deine Uhr kennt Trainings ohne Haken, etwa Tennis oder Eishockey. Die App fragt einmal: zählen oder nicht.',
    'New card «Count?» in «My activities»: one tap makes the tick with the minutes of the workout, with Undo': 'Neue Karte «Zählen?» in «Meine Aktivitäten»: Ein Tipp legt den Haken mit den Minuten des Trainings an, mit Rückgängig',
    '«Count all» does a whole sport at once; «Do not count» leaves a workout out for good': '«Alle zählen» macht eine ganze Sportart auf einmal; «Nicht zählen» lässt ein Training für immer weg',
    'Open Active › My activities: if your watch knows workouts without a tick, the card «Count?» lists them by sport, newest first.': 'Öffne Aktiv › Meine Aktivitäten: Kennt deine Uhr Trainings ohne Haken, listet die Karte «Zählen?» sie nach Sportart auf, neueste zuerst.',
    'Tap «Count» on one: it is ticked with its minutes. Tap «Undo» within a few seconds: it is gone again.': 'Tippe bei einem auf «Zählen»: Es wird mit seinen Minuten abgehakt. Tippe in ein paar Sekunden auf «Rückgängig»: Es ist wieder weg.',
  },
};
