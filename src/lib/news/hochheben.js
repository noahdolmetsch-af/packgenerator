// «Neuer Schwung» B19 «Hochheben beim Sortieren» (Noah 27.10.2026 «ich möchte b13 bis b24 alle umsetzen»): the held
// row lifts with a shadow, the others glide aside, a short buzz when it lands
export default {
  title: 'Rows lift when you sort',
  lead: 'Drag a row: it lifts, the others make room.',
  points: [{ text: 'The row you hold lifts with a shadow above the others, in every list you can sort', href: '#/me/lists?categories', go: 'f.editall' }],
  small: [{ box: 'nicer', text: 'The other rows glide aside more softly; the phone buzzes briefly when the row lands', go: null }],
  test: ['Open Ich › Listen und Typen › Kategorien and hold the handle ⠿ of a row.', 'The row lifts with a shadow; drag it down and let go: it stays at its new place.'],
  since: [],
  de: {
    'Rows lift when you sort': 'Zeilen heben sich beim Sortieren',
    'Drag a row: it lifts, the others make room.': 'Ziehst du eine Zeile, hebt sie sich, die anderen machen Platz.',
    'The row you hold lifts with a shadow above the others, in every list you can sort': 'Die Zeile, die du hältst, hebt sich mit Schatten über die anderen, in jeder sortierbaren Liste',
    'The other rows glide aside more softly; the phone buzzes briefly when the row lands': 'Die anderen Zeilen gleiten weicher zur Seite; das Handy vibriert kurz, wenn die Zeile landet',
    'Open Ich › Listen und Typen › Kategorien and hold the handle ⠿ of a row.': 'Öffne Ich › Listen und Typen › Kategorien und halte den Griff ⠿ einer Zeile.',
    'The row lifts with a shadow; drag it down and let go: it stays at its new place.': 'Die Zeile hebt sich mit Schatten; zieh sie nach unten und lass los: sie bleibt am neuen Platz.',
  },
};
