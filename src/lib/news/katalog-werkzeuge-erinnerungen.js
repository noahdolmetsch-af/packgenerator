// «Heute als Begleiter» PR 2 (Noah 28.10.2026 «ok freigabe»): 8 functions that had no line in «What the app can do»
export default {
  title: 'Found in the catalogue',
  lead: 'Five tools and three phone reminders now have their own line in «What the app can do».',
  points: [
    { text: 'Calculator, units, time zones, compass and phrases abroad', href: '#/me/tools', go: 'f.calc' },
    { text: 'Light alarm, parts worn and race registration', href: '#/me/push', go: 'f.lightpush' },
  ],
  small: [{ box: 'new', text: 'The search finds them by their German words too' }],
  test: ['Open Me › What the app can do and search «Kompass».', 'Tap the line: the toolbox opens at the compass.', 'Search «Licht-Wecker»: it leads to Reminders on the phone.'],
  since: ['f.calc', 'f.units', 'f.zones', 'f.compasstool', 'f.phrases', 'f.lightpush', 'f.wearpush', 'f.racepush'],
  de: {
    'Found in the catalogue': 'Neu im Katalog',
    'Five tools and three phone reminders now have their own line in «What the app can do».': 'Fünf Werkzeuge und drei Erinnerungen aufs Handy haben jetzt eine eigene Zeile in «Was die App kann».',
    'Calculator, units, time zones, compass and phrases abroad': 'Rechner, Masse, Zeitzonen, Kompass und Sätze im Ausland',
    'Light alarm, parts worn and race registration': 'Licht-Wecker, Teile abgenutzt und Anmeldung zum Rennen',
    'The search finds them by their German words too': 'Die Suche findet sie auch mit deutschen Wörtern',
    'Open Me › What the app can do and search «Kompass».': 'Öffne Ich › Was die App kann und suche «Kompass».',
    'Tap the line: the toolbox opens at the compass.': 'Tippe auf die Zeile: Der Werkzeugkasten öffnet beim Kompass.',
    'Search «Licht-Wecker»: it leads to Reminders on the phone.': 'Suche «Licht-Wecker»: Die Zeile führt zu Erinnerungen aufs Handy.',
  },
};
