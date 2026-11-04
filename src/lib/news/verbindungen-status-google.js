// «Status aller Verbindungen», Teil 3 Google Kalender und Aufgaben (Noah 03.11.2026 «1a 2 fitbit, strava, google dann abgleich und alle anderen 3a»)
export default {
  title: 'Google shows what it is doing',
  lead: 'While Google fetches your calendar and tasks, the page says since when. A fetch stops by itself after 2 minutes.',
  points: [{ text: 'When a fetch fails, the page also says when the last one worked', go: { href: '#/me/agenda', where: 'Appointments and tasks, on the card «From Google»: shows while a fetch runs or after one failed.' } }],
  small: [],
  test: ['Open Appointments and tasks and tap «Fetch now»: a line says «Google: fetching …» with the seconds.', 'If a fetch failed, the red line ends with «Last successful fetch: …».'],
  since: [],
  de: {
    'Google shows what it is doing': 'Google zeigt, was es gerade tut',
    'While Google fetches your calendar and tasks, the page says since when. A fetch stops by itself after 2 minutes.': 'Während Google Kalender und Aufgaben holt, steht auf der Seite seit wann. Nach 2 Minuten hört das Holen von selbst auf.',
    'When a fetch fails, the page also says when the last one worked': 'Wenn das Holen scheitert, steht auch da, wann es zuletzt geklappt hat',
    'Appointments and tasks, on the card «From Google»: shows while a fetch runs or after one failed.': 'Termine und Aufgaben, auf der Karte «Von Google»: erscheint während des Holens oder nach einem Fehler.',
    'Open Appointments and tasks and tap «Fetch now»: a line says «Google: fetching …» with the seconds.': 'Öffne Termine und Aufgaben und tippe «Jetzt holen»: Eine Zeile sagt «Google: holt …» mit den Sekunden.',
    'If a fetch failed, the red line ends with «Last successful fetch: …».': 'Ist das Holen gescheitert, endet die rote Zeile mit «Zuletzt erfolgreich geholt: …».',
  },
};
