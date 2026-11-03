// «Versteckte Funktionen» Schritt 7 (Noah 03.11.2026 «1a», plan «freigabe»): «All here» on top of Trips
export default {
  title: 'All here: every trip function on one field',
  lead: 'On top of Trips, templates, food plan, travel links, checks, races, ski tours and mountain and emergency are one tap away.',
  points: [
    { text: 'The field «All here» on top of Trips shows 13 functions as tiles', go: { href: '#/trips', steps: [{ sel: '[data-all-here]' }] } },
    { text: 'The row «More for your tours» keeps the komoot link; its other links are tiles now', go: { href: '#/trips', steps: [{ sel: '[data-quick="komoot"]' }] } },
  ],
  small: [],
  test: ['Open Trips: on top you see «All here» with tiles like «Templates» and «Ski tours». Tap one: its page opens.', 'Tap «Change» and hide a tile; tap «Undo» in the message: the tile is back.'],
  since: [],
  de: {
    'All here: every trip function on one field': 'Alles hier: jede Touren-Funktion auf einem Feld',
    'On top of Trips, templates, food plan, travel links, checks, races, ski tours and mountain and emergency are one tap away.': 'Oben bei Touren sind Vorlagen, Verpflegung, Reise-Links, Checks, Rennen, Skitouren sowie Berg und Notfall einen Tipp entfernt.',
    'The field «All here» on top of Trips shows 13 functions as tiles': 'Das Feld «Alles hier» oben bei Touren zeigt 13 Funktionen als Kacheln',
    'The row «More for your tours» keeps the komoot link; its other links are tiles now': 'Die Zeile «Mehr für deine Touren» behält den komoot-Link; ihre anderen Links sind jetzt Kacheln',
    'Open Trips: on top you see «All here» with tiles like «Templates» and «Ski tours». Tap one: its page opens.': 'Öffne Touren: Oben steht «Alles hier» mit Kacheln wie «Vorlagen» und «Skitouren». Tippe eine an: Ihre Seite öffnet sich.',
    'Tap «Change» and hide a tile; tap «Undo» in the message: the tile is back.': 'Tippe «Ändern» und blende eine Kachel aus; tippe «Rückgängig» in der Meldung: Die Kachel ist zurück.',
  },
};
