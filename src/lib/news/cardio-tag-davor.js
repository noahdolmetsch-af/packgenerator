// «Am Tag davor» (Noah 07.11.2026 «alle A–F», Idee F): the column counts the Fitbit workouts too
export default {
  title: 'The day before, complete',
  lead: 'The column «Day before» now also shows your Fitbit workouts, not only ticks and rides.',
  points: [{ text: 'See what you did the day before a high or low value', go: { href: '#/auswerten/analyse/cardioLoad', steps: [{ sel: '.days table' }], where: 'Analyse › a value (e.g. Cardio load) › table «Days», last column.' } }],
  small: [],
  test: ['Open Analyse › Cardio load and look at the table «Days»: in the last column a workout of your Fitbit stands next to your ticks and rides.', '«Nothing recorded» now means that no source knows of anything on that day.'],
  since: [],
  de: {
    'The day before, complete': 'Der Tag davor, vollständig',
    'The column «Day before» now also shows your Fitbit workouts, not only ticks and rides.': 'Die Spalte «Tag davor» zeigt jetzt auch deine Fitbit-Trainings, nicht nur Haken und Fahrten.',
    'See what you did the day before a high or low value': 'Sieh, was du am Tag vor einem hohen oder tiefen Wert gemacht hast',
    'Analyse › a value (e.g. Cardio load) › table «Days», last column.': 'Analyse › ein Wert (z. B. Cardio-Belastung) › Tabelle «Tage», letzte Spalte.',
    'Open Analyse › Cardio load and look at the table «Days»: in the last column a workout of your Fitbit stands next to your ticks and rides.': 'Öffne Analyse › Cardio-Belastung und schau die Tabelle «Tage» an: in der letzten Spalte steht ein Training deiner Fitbit neben deinen Haken und Fahrten.',
    '«Nothing recorded» now means that no source knows of anything on that day.': '«Nichts erfasst» heisst jetzt, dass keine Quelle an dem Tag etwas kennt.',
  },
};
