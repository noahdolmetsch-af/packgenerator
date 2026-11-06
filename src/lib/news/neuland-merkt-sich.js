// «Neuland rechnet nicht jedes Mal neu» (Noah 05.11.2026 «Idee A: Tempo-Runde für Seiten», Thread «Umsetzen Tempo-Runde für Seiten»)
export default {
  title: 'Neuland no longer works everything out again',
  lead: 'The app remembers which municipalities, passes and lakes your rides reached, as long as nothing changed.',
  points: [{ text: 'Neuland, Today and Dreams open sooner after the first time: the finds are worked out once', go: { href: '#/neuland' } }],
  small: [{ box: 'new', text: 'A new ride, a moved place or another day is noticed at once: then it is worked out again' }],
  test: ['Open Neuland, go back to Today and open Neuland again: the page shows up without stuttering.', 'Add a place to one of your own collections that lies on a ride: it is ticked as before.'],
  since: [],
  de: {
    'Neuland no longer works everything out again': 'Neuland rechnet nicht mehr jedes Mal alles neu',
    'The app remembers which municipalities, passes and lakes your rides reached, as long as nothing changed.': 'Die App merkt sich, welche Gemeinden, Pässe und Seen deine Fahrten erreicht haben, solange sich nichts ändert.',
    'Neuland, Today and Dreams open sooner after the first time: the finds are worked out once': 'Neuland, Heute und Träume öffnen ab dem zweiten Mal früher: Die Funde werden einmal gerechnet',
    'A new ride, a moved place or another day is noticed at once: then it is worked out again': 'Eine neue Fahrt, ein verschobener Ort oder ein anderer Tag wird sofort bemerkt: Dann wird neu gerechnet',
    'Open Neuland, go back to Today and open Neuland again: the page shows up without stuttering.': 'Öffne Neuland, gehe zurück zu Heute und öffne Neuland nochmals: Die Seite erscheint ohne Ruckeln.',
    'Add a place to one of your own collections that lies on a ride: it is ticked as before.': 'Füge einer eigenen Sammlung einen Ort hinzu, der auf einer Fahrt liegt: Er wird wie bisher abgehakt.',
  },
};
