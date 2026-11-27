// «Ankunfts-Bericht» (Noah 26.11.2026 «1a 2a 3a 4a»): Am Ende der Strecke zeigt die Live-Karte, wie die Fahrt war.
export default {
  title: 'Arrival report',
  lead: 'At the end of the route the live map shows how the ride went.',
  points: [{ text: 'Live map: at the goal a report shows time, rest against the plan, phone battery and the time in the dark; «Later» folds it away', go: { href: '#/live', where: 'Shows on the live map when you reach the end of a route you rode.' } }],
  test: ['Ride a route to its end with the live map running.', 'At the goal the report appears by itself; «Later» folds it away and «Show the arrival report» brings it back.'],
  since: [],
  de: {
    'Arrival report': 'Ankunfts-Bericht',
    'At the end of the route the live map shows how the ride went.': 'Am Ende der Strecke zeigt die Live-Karte, wie die Fahrt war.',
    'Live map: at the goal a report shows time, rest against the plan, phone battery and the time in the dark; «Later» folds it away': 'Live-Karte: am Ziel zeigt ein Bericht Zeit, Pause gegen Plan, Handy-Akku und die Zeit im Dunkeln; «Später» klappt ihn zu',
    'Shows on the live map when you reach the end of a route you rode.': 'Zeigt sich auf der Live-Karte, wenn du das Ende einer gefahrenen Strecke erreichst.',
    'Ride a route to its end with the live map running.': 'Fahre eine Strecke mit laufender Live-Karte bis zum Ende.',
    'At the goal the report appears by itself; «Later» folds it away and «Show the arrival report» brings it back.': 'Am Ziel erscheint der Bericht von selbst; «Später» klappt ihn zu, «Ankunfts-Bericht ansehen» bringt ihn zurück.',
  },
};
