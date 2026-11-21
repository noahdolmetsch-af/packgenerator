// «Neue Ordnung» Schritt V4b (Noah 21.11.2026 «V4 ok»): Training › Woche als Zeitplan mit Uhrzeit und freiem Slot
export default {
  title: 'Training week as a schedule',
  lead: 'Your training week now shows every day with times, and the free slot of a day opens a new session.',
  points: [
    { text: 'Every day lists your sessions, TrainingPeaks, suggestions of the weekly plan and your dates in order of time', go: { href: '#/flow/training', steps: [], where: 'Week › Training, the card «My week».' } },
    { text: 'The free slot of a day («free 11:00–13:00») opens «New session» with a start time, all your sports and your remembered tours', go: { href: '#/flow/training', steps: [], where: 'Week › Training › My week › a free slot.' } },
  ],
  small: [],
  test: [
    'Open Week › Training: under «My week» every day shows what is planned, with the time first.',
    'Tap the free slot of a day: «New session» opens with the start time of the slot and your sports as chips.',
    'Choose a sport, set minutes and save: the session stands in the day at its time.',
  ],
  since: [],
  de: {
    'Training week as a schedule': 'Trainingswoche als Zeitplan',
    'Your training week now shows every day with times, and the free slot of a day opens a new session.': 'Deine Trainingswoche zeigt jeden Tag mit Uhrzeiten, und der freie Slot eines Tages öffnet eine neue Einheit.',
    'Every day lists your sessions, TrainingPeaks, suggestions of the weekly plan and your dates in order of time': 'Jeder Tag listet deine Einheiten, TrainingPeaks, Vorschläge des Wochenplans und deine Termine in der Reihenfolge der Uhrzeit',
    'Week › Training, the card «My week».': 'Woche › Training, die Karte «Meine Woche».',
    'The free slot of a day («free 11:00–13:00») opens «New session» with a start time, all your sports and your remembered tours': 'Der freie Slot eines Tages («frei 11:00–13:00») öffnet «Neue Einheit» mit Startzeit, allen deinen Sportarten und deinen gemerkten Touren',
    'Week › Training › My week › a free slot.': 'Woche › Training › Meine Woche › ein freier Slot.',
    'Open Week › Training: under «My week» every day shows what is planned, with the time first.': 'Öffne Woche › Training: unter «Meine Woche» zeigt jeder Tag, was geplant ist, mit der Uhrzeit vorn.',
    'Tap the free slot of a day: «New session» opens with the start time of the slot and your sports as chips.': 'Tippe den freien Slot eines Tages: «Neue Einheit» öffnet sich mit der Startzeit des Slots und deinen Sportarten als Chips.',
    'Choose a sport, set minutes and save: the session stands in the day at its time.': 'Wähle eine Sportart, stelle die Minuten ein und speichere: Die Einheit steht im Tag zu ihrer Uhrzeit.',
  },
};
