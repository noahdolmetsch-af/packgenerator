// «Dauer nachtragen» für Tourtage (Noah 21.11.2026 22:47): Tourtage ohne Zeit kommen in die Liste, keine Schätzung
export default {
  title: 'Add the duration of tour days',
  lead: 'Days of a ski or hiking tour without a Strava activity and without minutes are asked about: how long? Until you answer they count nothing.',
  points: [
    { text: 'In «Add the duration»: «Tour … on …: how long?» with 1, 2, 3 or 4 hours or an own number, with Undo', go: { href: '#/flow/sports', steps: [{ sel: '[data-nachtragen]' }] } },
  ],
  small: [],
  test: ['Open Active › My activities › «Add the duration»: a day of a past tour without Strava appears as «Tour … on …: how long?».', 'Tap 3 h (180 min): the day counts in the sports year with exactly that time. «Undo» takes it back.'],
  since: [],
  de: {
    'Add the duration of tour days': 'Dauer der Tourtage nachtragen',
    'Days of a ski or hiking tour without a Strava activity and without minutes are asked about: how long? Until you answer they count nothing.': 'Tage einer Ski- oder Wandertour ohne Strava-Aktivität und ohne Minuten werden erfragt: wie lange? Bis du antwortest, zählen sie nichts.',
    'In «Add the duration»: «Tour … on …: how long?» with 1, 2, 3 or 4 hours or an own number, with Undo': 'Bei «Dauer nachtragen»: «Tour … am …: wie lange?» mit 1, 2, 3 oder 4 Stunden oder einer eigenen Zahl, mit Rückgängig',
    'Open Active › My activities › «Add the duration»: a day of a past tour without Strava appears as «Tour … on …: how long?».': 'Öffne Aktiv › Meine Aktivitäten › «Dauer nachtragen»: Ein Tag einer vergangenen Tour ohne Strava steht als «Tour … am …: wie lange?» da.',
    'Tap 3 h (180 min): the day counts in the sports year with exactly that time. «Undo» takes it back.': 'Tippe auf 180 Min: Der Tag zählt im Sportjahr mit genau dieser Zeit. «Rückgängig» nimmt es zurück.',
  },
};
