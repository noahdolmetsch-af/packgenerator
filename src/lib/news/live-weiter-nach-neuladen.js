// Live Navigation (Noah 28.10.2026, phone test): after a reload the ride did not go on by itself.
export default {
  title: 'The ride goes on after a reload',
  lead: 'When the app loads anew in the middle of a ride, the ride now goes on by itself for up to 3 hours after the last GPS point (before: 20 minutes).',
  points: [{ text: 'After a long stop the live map opens with your ride running', href: '#/live' }],
  small: [{ box: 'fixed', text: 'A ride no longer waits behind «Continue the ride from …» after a stop' }],
  test: ['Start a ride on the live map, stand still a while with the screen off.', 'Reload the page: the map shows the ride running and «Die App hatte neu geladen».'],
  since: [],
  de: {
    'The ride goes on after a reload': 'Fahrt läuft nach dem Neuladen weiter',
    'When the app loads anew in the middle of a ride, the ride now goes on by itself for up to 3 hours after the last GPS point (before: 20 minutes).': 'Lädt die App mitten in einer Fahrt neu, geht die Fahrt jetzt bis 3 Stunden nach dem letzten GPS-Punkt von selbst weiter (vorher 20 Minuten).',
    'After a long stop the live map opens with your ride running': 'Nach einem langen Halt öffnet die Live-Karte mit laufender Fahrt',
    'A ride no longer waits behind «Continue the ride from …» after a stop': 'Eine Fahrt wartet nach einem Halt nicht mehr hinter «Fahrt von … weiterführen»',
    'Start a ride on the live map, stand still a while with the screen off.': 'Auf der Live-Karte eine Fahrt starten, eine Weile mit Bildschirm aus stehen.',
    'Reload the page: the map shows the ride running and «Die App hatte neu geladen».': 'Seite neu laden: die Karte zeigt die laufende Fahrt und «Die App hatte neu geladen».',
  },
};
