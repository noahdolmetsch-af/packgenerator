// UI-Test 26.10.2026 T4 «Eine Serien-Rechnung» (G1-03, G2-05): home/series-data.js readSeries is the one series for the year row, the tile, the milestones page and the milestone check, with Strava bike rides; an empty week says «Nothing entered yet» and what Fitbit measured
export default {
  title: 'One series',
  lead: 'Today and Milestones count the same series, Strava rides included.',
  points: [{ text: 'The series counts weeks with a Strava ride too', href: '#/flow/milestones' }],
  small: [{ box: 'nicer', text: 'An empty week says «Nothing entered yet» and what Fitbit measured' }],
  test: ['Today, «This week»: with nothing entered it says «Nothing entered yet · Fitbit measured … active zone min».', 'Analyse › Milestones: «Series over everything» shows the same number as the tile on Today.'],
  since: [],
  de: {
    'One series': 'Eine Serie',
    'Today and Milestones count the same series, Strava rides included.': 'Heute und Meilensteine zählen dieselbe Serie, mit den Strava-Fahrten.',
    'The series counts weeks with a Strava ride too': 'Die Serie zählt auch Wochen mit einer Strava-Fahrt',
    'An empty week says «Nothing entered yet» and what Fitbit measured': 'Eine leere Woche sagt «Noch nichts eingetragen» und was Fitbit gemessen hat',
    'Today, «This week»: with nothing entered it says «Nothing entered yet · Fitbit measured … active zone min».': 'Heute, «Diese Woche»: Ist nichts eingetragen, steht «Noch nichts eingetragen · Fitbit hat … Aktivzonen-Minuten gemessen».',
    'Analyse › Milestones: «Series over everything» shows the same number as the tile on Today.': 'Auswerten › Meilensteine: «Serie über alles» zeigt dieselbe Zahl wie die Kachel auf Heute.',
  },
};
