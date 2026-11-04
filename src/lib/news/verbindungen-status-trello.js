// «Status aller Verbindungen», Teil 4 Trello (Noah 03.11.2026 «1a 2 fitbit, strava, google dann abgleich und alle anderen 3a»)
export default {
  title: 'Trello shows what it is doing',
  lead: 'While Trello syncs, the box says since when. A call without an answer stops by itself.',
  points: [{ text: 'When Trello fails, the box also says when the last sync worked', go: { href: '#/calendar', where: 'Plan › Remember, in the box «Trello»: shows while it syncs or after it failed (only when Trello is connected).' } }],
  small: [],
  test: ['Open Plan › Remember with Trello connected and tap «Sync now»: a line says «Trello: fetching …» with the seconds.', 'If it failed, the red line ends with «Last successful fetch: …».'],
  since: [],
  de: {
    'Trello shows what it is doing': 'Trello zeigt, was es gerade tut',
    'While Trello syncs, the box says since when. A call without an answer stops by itself.': 'Während Trello abgleicht, steht in der Box seit wann. Ein Aufruf ohne Antwort hört von selbst auf.',
    'When Trello fails, the box also says when the last sync worked': 'Wenn Trello scheitert, steht in der Box auch, wann der letzte Abgleich geklappt hat',
    'Plan › Remember, in the box «Trello»: shows while it syncs or after it failed (only when Trello is connected).': 'Planen › Merken, in der Box «Trello»: erscheint während des Abgleichs oder nach einem Fehler (nur wenn Trello verbunden ist).',
    'Open Plan › Remember with Trello connected and tap «Sync now»: a line says «Trello: fetching …» with the seconds.': 'Öffne Planen › Merken mit verbundenem Trello und tippe «Jetzt abgleichen»: Eine Zeile sagt «Trello: holt …» mit den Sekunden.',
    'If it failed, the red line ends with «Last successful fetch: …».': 'Ist es gescheitert, endet die rote Zeile mit «Zuletzt erfolgreich geholt: …».',
  },
};
