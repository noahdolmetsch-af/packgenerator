// «Neuer Schwung» Laden und leere Seiten (Noah 27.10.2026 «1a 2a 3a», blocks B8 and B11): an empty page shows a small
// drawn sheet that writes itself, loading placeholders shimmer warm and fade in. Off with «Reduce motion».
export default {
  title: 'Empty pages greet you',
  lead: 'An empty page now shows a small drawing instead of a lonely icon.',
  points: [{ text: 'An empty list (e.g. Trips without a trip) shows a drawn sheet with its icon', href: '#/trips', go: { href: '#/trips', where: 'On Trips without a trip: the drawn sheet.' } }],
  small: [{ box: 'nicer', text: 'While a page loads, its grey placeholders shimmer warm and fade in softly', go: { href: '#/trips', where: 'Reload the app: the grey placeholders shimmer warm.' } }],
  test: ['Open Notes and search for «xyz»: under «Nothing found.» a drawn sheet with a magnifier appears and its lines draw themselves.', 'Open a page on a slow connection: the grey placeholders shimmer softly before the content comes.'],
  since: [],
  de: {
    'On Trips without a trip: the drawn sheet.': 'Auf Touren ohne Tour: das gezeichnete Blatt.',
    'Reload the app: the grey placeholders shimmer warm.': 'App neu laden: die grauen Platzhalter schimmern warm.',
    'Empty pages greet you': 'Leere Seiten grüssen dich',
    'An empty page now shows a small drawing instead of a lonely icon.': 'Eine leere Seite zeigt jetzt eine kleine Zeichnung statt nur eines Symbols.',
    'An empty list (e.g. Trips without a trip) shows a drawn sheet with its icon': 'Eine leere Liste (z. B. Touren ohne Tour) zeigt ein gezeichnetes Blatt mit ihrem Symbol',
    'While a page loads, its grey placeholders shimmer warm and fade in softly': 'Während eine Seite lädt, schimmern die grauen Platzhalter warm und erscheinen sanft',
    'Open Notes and search for «xyz»: under «Nothing found.» a drawn sheet with a magnifier appears and its lines draw themselves.': 'Öffne Notizen und suche nach «xyz»: bei «Nichts gefunden.» erscheint ein gezeichnetes Blatt mit Lupe, die Linien zeichnen sich selbst.',
    'Open a page on a slow connection: the grey placeholders shimmer softly before the content comes.': 'Öffne eine Seite bei langsamem Netz: die grauen Platzhalter schimmern sanft, bevor der Inhalt kommt.',
  },
};
