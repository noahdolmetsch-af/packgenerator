// «Tourenvorschläge: Zahlen beim Hovern» (Noah 23.11.2026 «mouseover soll gleich wichtigste daten zeigen»)
export default {
  title: 'Tour suggestions: numbers on the map',
  lead: 'Point at a dot on the map and you see the main numbers of the tour: km, time and climb.',
  points: [
    { text: 'The mouse over a dot shows a small card with the title, km, time at your pace, climb and the levels; the line of that tour gets thick and the others pale', go: { href: '#/trips/vorschlaege', steps: [{ sel: '[data-vs-view="map"]' }, { sel: '[data-vs-karte]' }], where: 'Trips › Dreams › Tour suggestions, «Map»: point at a dot.' } },
    { text: 'On a phone the first tap on a dot shows the card, the second tap opens the tour', go: null },
  ],
  small: [],
  test: ['Open Trips › Dreams › Tour suggestions › «Map» and point at a dot: a card shows km, time and climb.', 'Move away: the card goes. Click the dot: the tour opens.', 'On a phone: tap a dot once for the card, tap again to open the tour.'],
  since: [],
  de: {
    'Tour suggestions: numbers on the map': 'Tourenvorschläge: Zahlen auf der Karte',
    'Point at a dot on the map and you see the main numbers of the tour: km, time and climb.': 'Zeige auf der Karte auf einen Punkt und du siehst die wichtigsten Zahlen der Tour: km, Zeit und Höhenmeter.',
    'The mouse over a dot shows a small card with the title, km, time at your pace, climb and the levels; the line of that tour gets thick and the others pale': 'Die Maus über einem Punkt zeigt eine kleine Karte mit Titel, km, Zeit in deinem Tempo, Höhenmetern und den Stufen; die Linie dieser Tour wird dick und die anderen werden blass',
    'Trips › Dreams › Tour suggestions, «Map»: point at a dot.': 'Touren › Träume › Tourenvorschläge, «Karte»: zeige auf einen Punkt.',
    'On a phone the first tap on a dot shows the card, the second tap opens the tour': 'Am Handy zeigt der erste Tipp auf einen Punkt die Karte, der zweite öffnet die Tour',
    'Open Trips › Dreams › Tour suggestions › «Map» and point at a dot: a card shows km, time and climb.': 'Öffne Touren › Träume › Tourenvorschläge › «Karte» und zeige auf einen Punkt: eine Karte zeigt km, Zeit und Höhenmeter.',
    'Move away: the card goes. Click the dot: the tour opens.': 'Geh weg: die Karte verschwindet. Klicke den Punkt: die Tour öffnet sich.',
    'On a phone: tap a dot once for the card, tap again to open the tour.': 'Am Handy: tippe einmal auf einen Punkt für die Karte, nochmals, um die Tour zu öffnen.',
  },
};
