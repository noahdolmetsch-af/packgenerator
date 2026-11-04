// «Status aller Verbindungen», Teil 5 Übersicht (Noah 03.11.2026 «3a»)
export default {
  title: 'Every connection in one list',
  lead: 'Me › Connections shows for each connection what it is doing, why a fetch failed and when it last worked. Trello is in the list now too.',
  points: [{ text: 'A failed or running fetch shows right under its connection', go: { href: '#/me/connections', where: 'Me › Connections, under the connection: shows only while it runs or after a fetch failed.' } }],
  small: [{ box: 'new', text: 'Trello has a row in the list of connections', go: { href: '#/me/connections', steps: [{ sel: '[data-conn="trello"]' }] } }],
  test: ['Open Me › Connections: Strava, Fitbit, Google Calendar and Tasks and Trello are listed, each with its last fetch.', 'Tap «Fetch now» on a connection and come back: while it runs, a line says since when.'],
  since: [],
  de: {
    'Every connection in one list': 'Alle Verbindungen in einer Liste',
    'Me › Connections shows for each connection what it is doing, why a fetch failed and when it last worked. Trello is in the list now too.': 'Ich › Verbindungen zeigt bei jeder Verbindung, was sie gerade tut, warum ein Holen scheiterte und wann es zuletzt klappte. Trello steht jetzt auch in der Liste.',
    'A failed or running fetch shows right under its connection': 'Ein laufendes oder gescheitertes Holen steht direkt unter der Verbindung',
    'Me › Connections, under the connection: shows only while it runs or after a fetch failed.': 'Ich › Verbindungen, unter der Verbindung: erscheint nur während des Holens oder nach einem Fehler.',
    'Trello has a row in the list of connections': 'Trello hat eine Zeile in der Liste der Verbindungen',
    'Open Me › Connections: Strava, Fitbit, Google Calendar and Tasks and Trello are listed, each with its last fetch.': 'Öffne Ich › Verbindungen: Strava, Fitbit, Google Kalender und Aufgaben und Trello stehen da, jede mit ihrem letzten Holen.',
    'Tap «Fetch now» on a connection and come back: while it runs, a line says since when.': 'Tippe bei einer Verbindung «Jetzt holen» und komm zurück: Während es läuft, sagt eine Zeile seit wann.',
  },
};
