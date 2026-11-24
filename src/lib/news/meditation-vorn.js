// «Meditation und Challenges vorn» (Noah 23.11.2026 «1-3a», Leitfaden «Meditation wieder stärker nach vorn»): one line in the block «Tick off today»
export default {
  title: 'Meditation and challenge up front',
  lead: 'Under «Tick off today» one line shows your outdoor minutes and the meditation, with a start button each.',
  points: [
    { text: 'Outdoors: minutes of today against the goal, with «+30 min» (Undo), while the challenge runs', go: { href: '#/', steps: [{ sel: '[data-cl-outdoor]' }], where: 'Today › Tick off today, last line of the block.' } },
    { text: 'Meditation: days in a row, «still open today» and the start button right there', go: { href: '#/', steps: [{ sel: '[data-cl-med]' }] } },
  ],
  small: [{ box: 'new', text: 'The big cards «Outdoors» and «Meditation» stay further down as the details' }],
  test: [
    'Open Today: at the bottom of «Tick off today» stands the line with Outdoors and Meditation.',
    'Tap «+30 min»: the minutes of today grow by 30; «Undo» takes them back.',
    'Tap the start button of the meditation: the session starts like on the card.',
  ],
  since: [],
  de: {
    'Meditation and challenge up front': 'Meditation und Challenge vorn',
    'Under «Tick off today» one line shows your outdoor minutes and the meditation, with a start button each.': 'Unter «Heute abhaken» zeigt eine Zeile deine Draussen-Minuten und die Meditation, je mit einem Knopf.',
    'Outdoors: minutes of today against the goal, with «+30 min» (Undo), while the challenge runs': 'Draussen: die Minuten von heute gegen das Ziel, mit «+30 Min» (Rückgängig), solange die Challenge läuft',
    'Today › Tick off today, last line of the block.': 'Heute › Heute abhaken, letzte Zeile im Block.',
    'Meditation: days in a row, «still open today» and the start button right there': 'Meditation: Tage in Folge, «heute noch offen» und gleich der Startknopf',
    'The big cards «Outdoors» and «Meditation» stay further down as the details': 'Die grossen Karten «Draussen» und «Meditation» bleiben weiter unten als Details',
    'Open Today: at the bottom of «Tick off today» stands the line with Outdoors and Meditation.': 'Öffne Heute: unten in «Heute abhaken» steht die Zeile mit Draussen und Meditation.',
    'Tap «+30 min»: the minutes of today grow by 30; «Undo» takes them back.': 'Tippe «+30 Min»: die Minuten von heute wachsen um 30; «Rückgängig» nimmt sie zurück.',
    'Tap the start button of the meditation: the session starts like on the card.': 'Tippe den Startknopf der Meditation: die Sitzung startet wie auf der Karte.',
  },
};
