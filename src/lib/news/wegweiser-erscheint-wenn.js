// «Wegweiser statt Katalog» PR 23 (plan Noah 01.11.2026 «freigabe»): functions that show only in the right situation say so on their page
export default {
  title: 'Functions that wait for their moment',
  lead: 'At the end of a page, a quiet fold says which functions appear only in the right situation.',
  points: [
    {
      text: 'End of Packen, Touren, Bike care, On the way: «Only in the right situation» with «Appears when …»',
      go: { href: '#/trips', steps: [{ sel: '[data-erscheint-wenn-fold] > summary' }], where: 'Shows at the end of the page while one of its functions is not on screen.' },
    },
  ],
  small: [{ box: 'new', text: '«Show it in the example» starts the example trip on the right day', go: { href: '#/pack', steps: [{ sel: '[data-erscheint-wenn-fold] > summary' }], where: 'Shows in the fold at the end of Packen.' } }],
  test: [
    'Open Touren and scroll to the end: the fold «Only in the right situation» lists «Arrive well» with when it appears.',
    'Open Packen, open the fold and tap «Show it in the example»: Me opens the playground.',
  ],
  since: [],
  de: {
    'Functions that wait for their moment': 'Funktionen, die auf ihren Moment warten',
    'At the end of a page, a quiet fold says which functions appear only in the right situation.': 'Am Ende einer Seite sagt ein ruhiger Klappteil, welche Funktionen nur in der passenden Lage erscheinen.',
    'End of Packen, Touren, Bike care, On the way: «Only in the right situation» with «Appears when …»': 'Ende von Packen, Touren, Velopflege, Unterwegs: «Nur in der passenden Lage» mit «Erscheint, wenn …»',
    'Shows at the end of the page while one of its functions is not on screen.': 'Erscheint am Ende der Seite, solange eine ihrer Funktionen gerade nicht zu sehen ist.',
    '«Show it in the example» starts the example trip on the right day': '«Im Beispiel zeigen» startet die Beispiel-Tour am passenden Tag',
    'Shows in the fold at the end of Packen.': 'Erscheint im Klappteil am Ende von Packen.',
    'Open Touren and scroll to the end: the fold «Only in the right situation» lists «Arrive well» with when it appears.': 'Öffne Touren und scrolle ans Ende: der Klappteil «Nur in der passenden Lage» nennt «Gut ankommen» mit dem Moment, in dem es erscheint.',
    'Open Packen, open the fold and tap «Show it in the example»: Me opens the playground.': 'Öffne Packen, klapp den Teil auf und tippe auf «Im Beispiel zeigen»: Ich öffnet die Spielwiese.',
  },
};
