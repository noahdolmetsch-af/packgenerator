// UI-Test 26.10.2026 T6 «Touren- und Strava-Zahlen nennen ihren Zeitraum» (G2-04, G2-06): the Touren head says «… ridden in 12 months · … wait for your review», the Strava card names its period and the total, the heatmap sum names its years, list rows take km and Hm from linked Strava rides
export default {
  title: 'Numbers with their period',
  lead: 'Every number on Tours says which time it counts.',
  points: [{ text: 'Tours: «… ridden in 12 months · … wait for your review»', href: '#/trips', go: 'f.tripstate' }],
  small: [{ box: 'nicer', text: 'The trip list shows the km of linked Strava rides', go: 'f.tripstate' }, { box: 'nicer', text: 'The heatmap sum names its year', go: 'f.heatmap' }],
  test: ['Open Tours: under the title it says «… planned · … ridden in 12 months · … wait for your review».', 'On the phone, «Rides from Strava» names its period and the total.'],
  since: [],
  de: {
    'Numbers with their period': 'Zahlen mit Zeitraum',
    'Every number on Tours says which time it counts.': 'Jede Zahl auf Touren sagt, welche Zeit sie zählt.',
    'Tours: «… ridden in 12 months · … wait for your review»': 'Touren: «… gefahren in 12 Monaten · … warten auf deinen Rückblick»',
    'The trip list shows the km of linked Strava rides': 'Die Tourenliste zeigt die km der verknüpften Strava-Fahrten',
    'The heatmap sum names its year': 'Die Summe der Heatmap nennt ihr Jahr',
    'Open Tours: under the title it says «… planned · … ridden in 12 months · … wait for your review».': 'Öffne Touren: Unter dem Titel steht «… geplant · … gefahren in 12 Monaten · … warten auf deinen Rückblick».',
    'On the phone, «Rides from Strava» names its period and the total.': 'Am Handy nennt «Fahrten aus Strava» den Zeitraum und das Total.',
  },
};
