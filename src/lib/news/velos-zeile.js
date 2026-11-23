// «Velos: eine Zeile über den Karten» (Noah 23.11.2026 «1-5 a», Punkt 1): the count and the order stand once, over the cards
export default {
  title: 'Bikes: one line over the cards',
  lead: 'Over the bike cards one line now says «Your bikes 4» and where to change the order and the standard bike. The workshop is one line while it is empty, and the bike below the cards says «Chosen bike».',
  points: [{ text: 'Change the order and the standard bike from the line over the bike cards', go: { href: '#/bikes', steps: [{ sel: '[data-order-open]' }], where: 'Bikes: the line «Your bikes» over the cards, on the right.' } }],
  small: [{ box: 'new', text: '«Chosen bike» over the name of the bike below the cards' }],
  test: ['Open Bikes: over the cards stands «Your bikes» with the number, and on the right «Change the order and the standard bike».', 'Tap it: the window with the order and the standard bike opens.', 'Without a workshop visit, «Workshop: no visit yet · To the workshop» is one line. Below the cards the bike you chose says «Chosen bike» over its name.'],
  since: [],
  de: {
    'Bikes: one line over the cards': 'Velos: eine Zeile über den Karten',
    'Over the bike cards one line now says «Your bikes 4» and where to change the order and the standard bike. The workshop is one line while it is empty, and the bike below the cards says «Chosen bike».': 'Über den Velo-Karten sagt jetzt eine Zeile «Deine Velos 4» und wo du die Reihenfolge und das Standard-Velo änderst. Die Werkstatt ist eine Zeile, solange sie leer ist, und das Velo unter den Karten heisst «Gewähltes Velo».',
    'Change the order and the standard bike from the line over the bike cards': 'Reihenfolge und Standard-Velo änderst du in der Zeile über den Velo-Karten',
    'Bikes: the line «Your bikes» over the cards, on the right.': 'Velos: die Zeile «Deine Velos» über den Karten, rechts.',
    '«Chosen bike» over the name of the bike below the cards': '«Gewähltes Velo» über dem Namen des Velos unter den Karten',
    'Open Bikes: over the cards stands «Your bikes» with the number, and on the right «Change the order and the standard bike».': 'Öffne Velos: über den Karten steht «Deine Velos» mit der Zahl, rechts «Reihenfolge und Standard-Velo ändern».',
    'Tap it: the window with the order and the standard bike opens.': 'Tippe darauf: das Fenster mit der Reihenfolge und dem Standard-Velo öffnet sich.',
    'Without a workshop visit, «Workshop: no visit yet · To the workshop» is one line. Below the cards the bike you chose says «Chosen bike» over its name.': 'Ohne Werkstattbesuch ist «Werkstatt: noch kein Besuch · Zur Werkstatt» eine Zeile. Unter den Karten steht über dem Namen des gewählten Velos «Gewähltes Velo».',
  },
};
