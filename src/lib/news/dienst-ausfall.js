// «Wenn ein Dienst ausfällt» (Noah 02.11.2026 «1a danach 3 und 4», 4a): one calm sentence when weather or Strava cannot be reached
export default {
  title: 'When a service is not there',
  lead: 'If the weather or Strava cannot be reached, the app says one calm sentence and you keep working.',
  points: [{ text: 'Weather and Strava say «cannot be reached right now. You can keep working.» instead of an error number', go: null }],
  small: [],
  test: [
    'Switch the phone to flight mode and search a home place on Today: «Weather» cannot be reached, you can keep working.',
    'Everything else on Today still opens.',
  ],
  since: [],
  de: {
    'When a service is not there': 'Wenn ein Dienst nicht da ist',
    'If the weather or Strava cannot be reached, the app says one calm sentence and you keep working.': 'Wenn das Wetter oder Strava nicht erreichbar sind, sagt die App einen ruhigen Satz, und du arbeitest weiter.',
    'Weather and Strava say «cannot be reached right now. You can keep working.» instead of an error number': 'Wetter und Strava sagen «ist gerade nicht erreichbar. Du kannst trotzdem weiterarbeiten.» statt einer Fehlernummer',
    'Switch the phone to flight mode and search a home place on Today: «Weather» cannot be reached, you can keep working.': 'Schalte das Handy in den Flugmodus und suche auf Heute einen Wohnort: «Wetter» ist nicht erreichbar, du kannst weiterarbeiten.',
    'Everything else on Today still opens.': 'Alles andere auf Heute öffnet sich weiter.',
  },
};
