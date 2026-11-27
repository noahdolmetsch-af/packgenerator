// «Wie war's? als Liste» (Noah 27.11.2026 «1a 2a 3b», Thread «Wie war's? nach Fitbit-Aktivität reparieren»): all open workouts as a list, Undo after every answer
export default {
  title: '«How was it?» as a list',
  lead: 'All workouts waiting for your answer stand in one small list, and every answer can be taken back.',
  points: [
    { text: 'The open workouts of the last 3 days stand one under the other, the newest three first, with «Show n more»', go: 'f.feel' },
    { text: 'After every answer a note says «Kept» for 8 seconds, with «Undo»', go: 'f.feel' },
    { text: 'Your answers to the bike workouts of your watch count in «Felt effort of rides» of Auswerten, like the ones for Strava', go: 'f.feel' },
  ],
  small: [],
  test: ['On Active (several workouts waiting) the card «Wie war’s?» shows them as a list; tap «gut» on one: «Gespeichert: «gut»» with «Rückgängig».', 'Tap «Rückgängig»: the workout is in the list again.'],
  since: [],
  de: {
    '«How was it?» as a list': '«Wie war’s?» als Liste',
    'All workouts waiting for your answer stand in one small list, and every answer can be taken back.': 'Alle Trainings, die auf deine Antwort warten, stehen in einer kleinen Liste, und jede Antwort kann zurückgenommen werden.',
    'The open workouts of the last 3 days stand one under the other, the newest three first, with «Show n more»': 'Die offenen Trainings der letzten 3 Tage stehen untereinander, die neusten drei zuerst, dazu «n weitere zeigen»',
    'After every answer a note says «Kept» for 8 seconds, with «Undo»': 'Nach jeder Antwort steht 8 Sekunden «Gespeichert» mit «Rückgängig»',
    'Your answers to the bike workouts of your watch count in «Felt effort of rides» of Auswerten, like the ones for Strava': 'Deine Antworten zu den Rad-Trainings deiner Uhr zählen in Auswerten bei «Gefühlte Anstrengung der Fahrten», wie die zu Strava',
    'On Active (several workouts waiting) the card «Wie war’s?» shows them as a list; tap «gut» on one: «Gespeichert: «gut»» with «Rückgängig».': 'Auf Aktiv (mit mehreren wartenden Trainings) zeigt die Karte «Wie war’s?» sie als Liste; tippe bei einem «gut»: «Gespeichert: «gut»» mit «Rückgängig».',
    'Tap «Rückgängig»: the workout is in the list again.': 'Tippe «Rückgängig»: das Training steht wieder in der Liste.',
  },
};
