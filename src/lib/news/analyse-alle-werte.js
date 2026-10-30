// «Analyse: alle Werte» (Noah 27.10.2026 «alle holen, zumindest optional anzeigen»): the app fetches every further
// value Google Health gives (VO₂max, distance, floors, climb, weight, body fat, pulse per hour, Fitbit workouts …)
export default {
  title: 'All Fitbit values on Analyse',
  lead: 'The app now also fetches VO₂max, distance, floors, pulse over the day, Fitbit workouts and more.',
  points: [
    { text: 'New tiles on Analyse: VO₂max, distance and climb of the watch, floors, hourly activity, pulse over the day, active and sitting minutes, Fitbit workouts, weight and body fat', go: 'f.analyse' },
    { text: '«Also values without data» shows every value, also the ones without a day yet', go: { href: '#/auswerten/analyse', steps: [{ sel: '[data-all]' }] } },
  ],
  small: [{ box: 'new', text: 'The next Fitbit fetch takes the last 90 days again, once, so the new values fill in', go: { href: '#/me', where: 'At the next fetch in Ich › Fitbit.' } }],
  test: [
    'Open Ich › Fitbit and tap «Jetzt holen». Wait until it says the values came.',
    'Open Auswerten › Analyse: under Herz you see «VO₂max (Cardio-Fitness)» and «Puls über den Tag», under Bewegung «Distanz (Uhr)», «Stockwerke» and «Stündliche Aktivität».',
    'Tap «Auch Werte ohne Daten» at the top: dashed tiles show every value without data, e.g. «Schlafindex» or the Garmin values.',
  ],
  since: [],
  de: {
    'At the next fetch in Ich › Fitbit.': 'Beim nächsten Abruf unter Ich › Fitbit.',
    'All Fitbit values on Analyse': 'Alle Fitbit-Werte in der Analyse',
    'The app now also fetches VO₂max, distance, floors, pulse over the day, Fitbit workouts and more.': 'Die App holt jetzt auch VO₂max, Distanz, Stockwerke, Puls über den Tag, Fitbit-Trainings und mehr.',
    'New tiles on Analyse: VO₂max, distance and climb of the watch, floors, hourly activity, pulse over the day, active and sitting minutes, Fitbit workouts, weight and body fat':
      'Neue Kacheln in der Analyse: VO₂max, Distanz und Höhenmeter der Uhr, Stockwerke, stündliche Aktivität, Puls über den Tag, aktive Minuten und Sitzzeit, Fitbit-Trainings, Gewicht und Körperfett',
    '«Also values without data» shows every value, also the ones without a day yet': '«Auch Werte ohne Daten» zeigt jeden Wert, auch die noch ohne einen Tag',
    'The next Fitbit fetch takes the last 90 days again, once, so the new values fill in': 'Der nächste Fitbit-Abruf holt einmal die letzten 90 Tage neu, damit die neuen Werte aufgefüllt werden',
    'Open Ich › Fitbit and tap «Jetzt holen». Wait until it says the values came.': 'Öffne Ich › Fitbit und tippe «Jetzt holen». Warte, bis die Werte angekommen sind.',
    'Open Auswerten › Analyse: under Herz you see «VO₂max (Cardio-Fitness)» and «Puls über den Tag», under Bewegung «Distanz (Uhr)», «Stockwerke» and «Stündliche Aktivität».':
      'Öffne Auswerten › Analyse: Unter Herz siehst du «VO₂max (Cardio-Fitness)» und «Puls über den Tag», unter Bewegung «Distanz (Uhr)», «Stockwerke» und «Stündliche Aktivität».',
    'Tap «Auch Werte ohne Daten» at the top: dashed tiles show every value without data, e.g. «Schlafindex» or the Garmin values.':
      'Tippe oben auf «Auch Werte ohne Daten»: Gestrichelte Kacheln zeigen jeden Wert ohne Daten, z. B. «Schlafindex» oder die Garmin-Werte.',
  },
};
