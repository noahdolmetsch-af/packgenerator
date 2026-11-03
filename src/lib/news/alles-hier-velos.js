// «Versteckte Funktionen» Schritt 3 (Noah 03.11.2026 «1a», plan «freigabe»): «All here» on top of Bikes and gear
export default {
  title: 'All here: every bike function on one field',
  lead: 'On top of Bikes and gear, every function of the area is one tap away: wear, workshop, spare parts, season and more.',
  points: [
    { text: 'The field «All here» on top of Bikes and gear shows 20 functions as tiles', go: { href: '#/bikes', steps: [{ sel: '[data-all-here]' }] } },
    { text: '«Change»: move tiles with arrows or the handle, hide what you do not need (with Undo), «As at the start» resets', go: { href: '#/bikes', steps: [{ sel: '[data-all-here-edit]' }] } },
  ],
  small: [],
  test: ['Open Bikes and gear: on top you see «All here» with tiles like «Wear» and «Workshop». Tap one: its page opens.', 'Tap «Change», move a tile up with the arrow and hide one; tap «Undo» in the message: the tile is back.'],
  since: [],
  de: {
    'All here: every bike function on one field': 'Alles hier: jede Velo-Funktion auf einem Feld',
    'On top of Bikes and gear, every function of the area is one tap away: wear, workshop, spare parts, season and more.': 'Oben bei Velos und Material ist jede Funktion des Bereichs einen Tipp entfernt: Verschleiss, Werkstatt, Ersatzteile, Saison und mehr.',
    'The field «All here» on top of Bikes and gear shows 20 functions as tiles': 'Das Feld «Alles hier» oben bei Velos und Material zeigt 20 Funktionen als Kacheln',
    '«Change»: move tiles with arrows or the handle, hide what you do not need (with Undo), «As at the start» resets': '«Ändern»: Kacheln mit Pfeilen oder dem Griff verschieben, Unnötiges ausblenden (mit Rückgängig), «Wie am Anfang» setzt zurück',
    'Open Bikes and gear: on top you see «All here» with tiles like «Wear» and «Workshop». Tap one: its page opens.': 'Öffne Velos und Material: Oben steht «Alles hier» mit Kacheln wie «Verschleiss» und «Werkstatt». Tippe eine an: Ihre Seite öffnet sich.',
    'Tap «Change», move a tile up with the arrow and hide one; tap «Undo» in the message: the tile is back.': 'Tippe «Ändern», schiebe eine Kachel mit dem Pfeil nach oben und blende eine aus; tippe «Rückgängig» in der Meldung: Die Kachel ist zurück.',
  },
};
