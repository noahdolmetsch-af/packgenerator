// «Versteckte Funktionen» Schritt 8 (Noah 03.11.2026 «1a», plan «freigabe»): «All here» on top of Plan
export default {
  title: 'All here: everyday planning on one field',
  lead: 'On top of Plan, shopping list, cooking, contracts, friends, mini tools, documents and photo album are one tap away, not only under Me.',
  points: [
    { text: 'The field «All here» on top of Plan shows 18 functions as tiles', go: { href: '#/week', steps: [{ sel: '[data-all-here]' }] } },
    { text: 'Change the order or hide tiles with «Change», as on the other areas', go: { href: '#/week', steps: [{ sel: '[data-all-here-edit]' }] } },
  ],
  small: [],
  test: ['Open Plan: under the week title you see «All here» with tiles like «Shopping list» and «With friends». Tap one: its page opens.', 'Tap «Change» and hide a tile; tap «Undo» in the message: the tile is back.'],
  since: [],
  de: {
    'All here: everyday planning on one field': 'Alles hier: der Alltag auf einem Feld',
    'On top of Plan, shopping list, cooking, contracts, friends, mini tools, documents and photo album are one tap away, not only under Me.': 'Oben bei Planen sind Einkaufsliste, Kochen, Verträge, Freunde, Mini-Tools, Dokumente und Fotoalbum einen Tipp entfernt, nicht nur unter Ich.',
    'The field «All here» on top of Plan shows 18 functions as tiles': 'Das Feld «Alles hier» oben bei Planen zeigt 18 Funktionen als Kacheln',
    'Change the order or hide tiles with «Change», as on the other areas': 'Reihenfolge ändern oder Kacheln ausblenden mit «Ändern», wie bei den anderen Bereichen',
    'Open Plan: under the week title you see «All here» with tiles like «Shopping list» and «With friends». Tap one: its page opens.': 'Öffne Planen: Unter dem Wochentitel steht «Alles hier» mit Kacheln wie «Einkaufsliste» und «Mit Freunden». Tippe eine an: Ihre Seite öffnet sich.',
    'Tap «Change» and hide a tile; tap «Undo» in the message: the tile is back.': 'Tippe «Ändern» und blende eine Kachel aus; tippe «Rückgängig» in der Meldung: Die Kachel ist zurück.',
  },
};
