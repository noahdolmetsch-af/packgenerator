// «Status aller Verbindungen», Teil 1 Fitbit (Noah 03.11.2026 «1a 2 fitbit, strava, google dann abgleich und alle anderen 3a»)
export default {
  title: 'Fitbit shows what it is doing',
  lead: 'While Fitbit fetches, the card says since when and how many days are done. A fetch stops by itself after 2 minutes.',
  points: [{ text: 'When a fetch fails, the card also says when the last one worked', go: { href: '#/me/fitbit', where: 'Me › Fitbit, on the card with your values: shows while a fetch runs or after one failed.' } }],
  small: [],
  test: ['Open Me › Fitbit and tap «Fetch now»: a line says «Fitbit: fetching …» with the seconds.', 'If a fetch failed, the red line ends with «Last successful fetch: …».'],
  since: [],
  de: {
    'Fitbit shows what it is doing': 'Fitbit zeigt, was es gerade tut',
    'While Fitbit fetches, the card says since when and how many days are done. A fetch stops by itself after 2 minutes.': 'Während Fitbit holt, steht auf der Karte seit wann und wie viele Tage schon da sind. Nach 2 Minuten hört das Holen von selbst auf.',
    'When a fetch fails, the card also says when the last one worked': 'Wenn das Holen scheitert, steht auch da, wann es zuletzt geklappt hat',
    'Me › Fitbit, on the card with your values: shows while a fetch runs or after one failed.': 'Ich › Fitbit, auf der Karte mit deinen Werten: erscheint während des Holens oder nach einem Fehler.',
    'Open Me › Fitbit and tap «Fetch now»: a line says «Fitbit: fetching …» with the seconds.': 'Öffne Ich › Fitbit und tippe «Jetzt holen»: Eine Zeile sagt «Fitbit: holt …» mit den Sekunden.',
    'If a fetch failed, the red line ends with «Last successful fetch: …».': 'Ist das Holen gescheitert, endet die rote Zeile mit «Zuletzt erfolgreich geholt: …».',
  },
};
