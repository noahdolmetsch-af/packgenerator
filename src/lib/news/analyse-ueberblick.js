// «Analyse» M2 «Überblick» (Noah 27.10.2026 «alle Mockups 1:1»): numbers, calendar, ranking, ticks per week
export default {
  title: 'Analysis overview',
  lead: 'At the top of Analyse: the period at a glance, every day as a field, your activities as a ranking.',
  points: [
    { text: 'Numbers of the period: ticks, bike km, sleep, active zone minutes, resting pulse, longest run', go: 'f.analyse' },
    { text: 'Every day a field: darker means more ticked; a tap shows the day', go: 'f.analyse' },
    { text: 'Ranking of your activities against the same number of days before, and ticks per week', go: 'f.analyse' },
  ],
  small: [],
  test: [
    'Open Auswerten › Analyse: on top you see «Überblick» with the numbers.',
    'Tap a field in «Jeder Tag ein Feld»: the day opens.',
    'Look at «Rangliste»: each activity shows how often, and the change against before.',
  ],
  since: [],
  de: {
    'Analysis overview': 'Analyse-Überblick',
    'At the top of Analyse: the period at a glance, every day as a field, your activities as a ranking.':
      'Oben in Analyse: der Zeitraum auf einen Blick, jeder Tag als Feld, deine Aktivitäten als Rangliste.',
    'Numbers of the period: ticks, bike km, sleep, active zone minutes, resting pulse, longest run':
      'Zahlen des Zeitraums: Haken, Velo-km, Schlaf, Aktivzonen-Minuten, Ruhepuls, längste Serie',
    'Every day a field: darker means more ticked; a tap shows the day': 'Jeder Tag ein Feld: dunkler heisst mehr abgehakt; ein Tipp zeigt den Tag',
    'Ranking of your activities against the same number of days before, and ticks per week':
      'Rangliste deiner Aktivitäten gegen gleich viele Tage davor, und Haken pro Woche',
    'Open Auswerten › Analyse: on top you see «Überblick» with the numbers.': 'Öffne Auswerten › Analyse: Oben siehst du «Überblick» mit den Zahlen.',
    'Tap a field in «Jeder Tag ein Feld»: the day opens.': 'Tippe ein Feld in «Jeder Tag ein Feld» an: Der Tag öffnet sich.',
    'Look at «Rangliste»: each activity shows how often, and the change against before.':
      'Schau die «Rangliste» an: Jede Aktivität zeigt, wie oft, und die Änderung gegen davor.',
  },
};
