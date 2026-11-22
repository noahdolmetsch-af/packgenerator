// «Bausteine öffnet schneller» (Noah 05.11.2026 «Idee A: Tempo-Runde für Seiten», Thread «Umsetzen Tempo-Runde für Seiten»)
export default {
  title: 'Building blocks opens faster',
  lead: 'The empty building blocks are built only when you open their fold.',
  points: [{ text: 'Material › Building blocks: the page shows up sooner, the fold with the empty blocks works as before', go: { href: '#/blocks', steps: [{ sel: '[data-empty-blocks] > summary' }] } }],
  small: [{ box: 'new', text: 'About 400 elements less on the page until you open the fold' }],
  test: ['Open Building blocks: the filled blocks of «Depending on the situation» are there at once.', 'Tap the line «n empty building blocks»: the empty blocks show up and can be filled as before.'],
  since: [],
  de: {
    'Building blocks opens faster': 'Bausteine öffnet schneller',
    'The empty building blocks are built only when you open their fold.': 'Die leeren Bausteine entstehen erst, wenn du ihr Feld öffnest.',
    'Material › Building blocks: the page shows up sooner, the fold with the empty blocks works as before': 'Material › Bausteine: Die Seite steht früher, das Feld mit den leeren Bausteinen funktioniert wie bisher',
    'About 400 elements less on the page until you open the fold': 'Rund 400 Elemente weniger auf der Seite, bis du das Feld öffnest',
    'Open Building blocks: the filled blocks of «Depending on the situation» are there at once.': 'Öffne Bausteine: Die gefüllten Bausteine von «Je nach Lage» sind gleich da.',
    'Tap the line «n empty building blocks»: the empty blocks show up and can be filled as before.': 'Tippe auf die Zeile «n leere Bausteine»: Die leeren Bausteine erscheinen und lassen sich wie bisher füllen.',
  },
};
