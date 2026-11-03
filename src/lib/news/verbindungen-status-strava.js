// «Status aller Verbindungen», Teil 2 Strava (Noah 03.11.2026 «1a 2 fitbit, strava, google dann abgleich und alle anderen 3a»)
export default {
  title: 'Strava shows what it is doing',
  lead: 'While Strava fetches, the page says since when and how many rides have come. A fetch stops by itself after 2 minutes, without losing anything.',
  points: [{ text: 'When a fetch fails, the page also says when the last one worked', go: { href: '#/bikes?tab=care&view=strava', where: 'Strava page, next to «Fetch now»: shows while a fetch runs or after one failed.' } }],
  small: [],
  test: ['Open Strava and tap «Fetch now»: a line says «Strava: fetching …» with the seconds.', 'If a fetch failed, the red line ends with «Last successful fetch: …».'],
  since: [],
  de: {
    'Strava shows what it is doing': 'Strava zeigt, was es gerade tut',
    'While Strava fetches, the page says since when and how many rides have come. A fetch stops by itself after 2 minutes, without losing anything.': 'Während Strava holt, steht auf der Seite seit wann und wie viele Fahrten schon da sind. Nach 2 Minuten hört das Holen von selbst auf, ohne dass etwas verloren geht.',
    'When a fetch fails, the page also says when the last one worked': 'Wenn das Holen scheitert, steht auch da, wann es zuletzt geklappt hat',
    'Strava page, next to «Fetch now»: shows while a fetch runs or after one failed.': 'Strava-Seite, neben «Jetzt holen»: erscheint während des Holens oder nach einem Fehler.',
    'Open Strava and tap «Fetch now»: a line says «Strava: fetching …» with the seconds.': 'Öffne Strava und tippe «Jetzt holen»: Eine Zeile sagt «Strava: holt …» mit den Sekunden.',
    'If a fetch failed, the red line ends with «Last successful fetch: …».': 'Ist das Holen gescheitert, endet die rote Zeile mit «Zuletzt erfolgreich geholt: …».',
  },
};
