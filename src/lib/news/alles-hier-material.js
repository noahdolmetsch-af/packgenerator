// «Versteckte Funktionen» Schritt 4 (Noah 03.11.2026 «1a», plan «freigabe»): «All here» on top of Gear
export default {
  title: 'All here: every gear function on one field',
  lead: 'On top of Gear, building blocks, wardrobe, favourites, wishlist, supplies, power budget and the lending list are one tap away.',
  points: [
    { text: 'The field «All here» on top of Gear shows 14 functions as tiles', go: { href: '#/gear', steps: [{ sel: '[data-all-here]' }] } },
    { text: 'Change the order or hide tiles with «Change», as on Bikes and gear', go: { href: '#/gear', steps: [{ sel: '[data-all-here-edit]' }] } },
  ],
  small: [],
  test: ['Open Gear: on top you see «All here» with tiles like «Building blocks» and «Supplies». Tap one: its page opens.', 'Tap «Change» and hide a tile; tap «Undo» in the message: the tile is back.'],
  since: [],
  de: {
    'All here: every gear function on one field': 'Alles hier: jede Material-Funktion auf einem Feld',
    'On top of Gear, building blocks, wardrobe, favourites, wishlist, supplies, power budget and the lending list are one tap away.': 'Oben bei Material sind Bausteine, Kleiderschrank, Favoriten, Wunschliste, Vorrat, Strombudget und Leihliste einen Tipp entfernt.',
    'The field «All here» on top of Gear shows 14 functions as tiles': 'Das Feld «Alles hier» oben bei Material zeigt 14 Funktionen als Kacheln',
    'Change the order or hide tiles with «Change», as on Bikes and gear': 'Reihenfolge ändern oder Kacheln ausblenden mit «Ändern», wie bei Velos und Material',
    'Open Gear: on top you see «All here» with tiles like «Building blocks» and «Supplies». Tap one: its page opens.': 'Öffne Material: Oben steht «Alles hier» mit Kacheln wie «Bausteine» und «Vorrat». Tippe eine an: Ihre Seite öffnet sich.',
    'Tap «Change» and hide a tile; tap «Undo» in the message: the tile is back.': 'Tippe «Ändern» und blende eine Kachel aus; tippe «Rückgängig» in der Meldung: Die Kachel ist zurück.',
  },
};
