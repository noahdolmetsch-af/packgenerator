// «Unterwegs hat immer eine Überschrift» (Noah «3a», Durchklick Etappe 3): the empty page «On the way» gets its title
export default {
  title: 'A title on «On the way»',
  lead: 'Without a trip, «On the way» now starts with its title, like the other pages.',
  points: [{ text: 'Without a trip on the way, the page says «On the way» at the top', go: { href: '#/ride', where: 'On the way, when no trip is running.' } }],
  small: [],
  test: ['Open On the way when no trip is running.', 'The title «On the way» stands at the top, then the line that says why it is empty.'],
  since: [],
  de: {
    'A title on «On the way»': 'Eine Überschrift auf «Unterwegs»',
    'Without a trip, «On the way» now starts with its title, like the other pages.': 'Ohne Tour beginnt «Unterwegs» jetzt mit seiner Überschrift, wie die anderen Seiten.',
    'Without a trip on the way, the page says «On the way» at the top': 'Ohne Tour unterwegs steht oben auf der Seite «Unterwegs»',
    'On the way, when no trip is running.': 'Unterwegs, wenn keine Tour läuft.',
    'Open On the way when no trip is running.': 'Öffne Unterwegs, wenn keine Tour läuft.',
    'The title «On the way» stands at the top, then the line that says why it is empty.': 'Oben steht die Überschrift «Unterwegs», darunter die Zeile, warum die Seite leer ist.',
  },
};
