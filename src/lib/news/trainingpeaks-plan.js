// «TrainingPeaks-Plan» (Noah 19.11.2026 «1a 2b 3a 4a 5b»): the workouts planned in TrainingPeaks become planned sessions
export default {
  title: 'TrainingPeaks plan in your week',
  lead: 'Paste your TrainingPeaks calendar link once: the workouts planned there show in your week plan.',
  points: [
    { text: 'Add your TrainingPeaks calendar link under Me › Connections', go: 'f.trainingpeaks' },
    { text: 'The planned workouts stand in Training › My week, marked «TP»', go: { href: '#/flow/training', where: 'Training › My week, on the day of the workout, once a TrainingPeaks link is added.' } },
  ],
  small: [
    { box: 'new', text: 'A session you change, tick or take out stays as you have it; the link stays on this device and is shown hidden' },
  ],
  test: [
    'Open Me › Connections and find the card «TrainingPeaks plan»: it says where to find the link in TrainingPeaks.',
    'Paste the calendar link (https:// or webcal://) and tap «Test and add»: the number of planned sessions shows.',
    'Open Training › My week: the planned workouts stand on their days with «TP».',
  ],
  since: ['f.trainingpeaks'],
  de: {
    'TrainingPeaks plan in your week': 'TrainingPeaks-Plan in deiner Woche',
    'Paste your TrainingPeaks calendar link once: the workouts planned there show in your week plan.': 'Füge deinen TrainingPeaks-Kalender-Link einmal ein: Die dort geplanten Trainings erscheinen in deinem Wochenplan.',
    'Add your TrainingPeaks calendar link under Me › Connections': 'TrainingPeaks-Kalender-Link unter Ich › Verbindungen hinzufügen',
    'The planned workouts stand in Training › My week, marked «TP»': 'Die geplanten Trainings stehen in Training › Meine Woche, markiert mit «TP»',
    'Training › My week, on the day of the workout, once a TrainingPeaks link is added.': 'Training › Meine Woche, am Tag des Trainings, sobald ein TrainingPeaks-Link hinzugefügt ist.',
    'A session you change, tick or take out stays as you have it; the link stays on this device and is shown hidden': 'Eine Einheit, die du änderst, abhakst oder herausnimmst, bleibt, wie du sie hast; der Link bleibt auf diesem Gerät und wird verborgen angezeigt',
    'Open Me › Connections and find the card «TrainingPeaks plan»: it says where to find the link in TrainingPeaks.': 'Öffne Ich › Verbindungen und such die Karte «TrainingPeaks-Plan»: Sie sagt, wo du den Link in TrainingPeaks findest.',
    'Paste the calendar link (https:// or webcal://) and tap «Test and add»: the number of planned sessions shows.': 'Füge den Kalender-Link (https:// oder webcal://) ein und tippe «Testen und hinzufügen»: Die Zahl der geplanten Einheiten erscheint.',
    'Open Training › My week: the planned workouts stand on their days with «TP».': 'Öffne Training › Meine Woche: Die geplanten Trainings stehen an ihren Tagen mit «TP».',
  },
};
