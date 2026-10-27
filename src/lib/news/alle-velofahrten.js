// UI-Test 26.10.2026 T5 «Velo-Jahresziel = alle Fahrten» (G1-05, G2-03): Strava rides whose km sit in a bike's start km (kmbook inStartKm) count as ridden for the year goal, «Diese Woche», «Velo im Monat», the series and «Du heute»; the year goal names what it counts and links the rides that wait
export default {
  title: 'All bike rides',
  lead: 'The bike year goal counts every ride, as Today does.',
  points: [{ text: 'Year goals: rides inside a bike\'s start km count too', href: '#/flow/sports' }],
  small: [{ box: 'nicer', text: 'Under the goal: what is counted, and the Strava rides that wait for «OK»' }],
  test: ['Active › My sports › «Year goals»: the bike km count every ride; below it says what is counted.', 'Today: «This week» and «Bike this month» count the same rides.'],
  since: [],
  de: {
    'All bike rides': 'Alle Velofahrten',
    'The bike year goal counts every ride, as Today does.': 'Das Velo-Jahresziel zählt jede Fahrt, wie Heute.',
    'Year goals: rides inside a bike\'s start km count too': 'Jahresziele: auch Fahrten im Startwert eines Velos zählen',
    'Under the goal: what is counted, and the Strava rides that wait for «OK»': 'Unter dem Ziel: was zählt, und die Strava-Fahrten, die auf «Passt» warten',
    'Active › My sports › «Year goals»: the bike km count every ride; below it says what is counted.': 'Aktiv › Meine Sportarten › «Jahresziele»: Die Velo-km zählen jede Fahrt; darunter steht, was gezählt wird.',
    'Today: «This week» and «Bike this month» count the same rides.': 'Heute: «Diese Woche» und «Velo im Monat» zählen dieselben Fahrten.',
  },
};
