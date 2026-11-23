// «Tourenvorschläge: Karte oben» (Noah 23.11.2026: die Karte gross und gut sichtbar)
export default {
  title: 'Tour suggestions: the map on top',
  lead: 'In the map view the map now stands right under the title, the filters below it.',
  points: [
    { text: 'The map of the tours is big and the first thing you see; the filters moved below it', go: { href: '#/trips/vorschlaege', steps: [{ sel: '[data-vs-view="map"]' }, { sel: '[data-vs-karte]' }], where: 'Trips › Dreams › Tour suggestions, «Map».' } },
  ],
  small: [],
  test: ['Open Trips › Dreams › Tour suggestions and tap «Map»: the map is right under the title.', 'Scroll down: the filters are below the map. Tap «List»: the filters are on top again.'],
  since: [],
  de: {
    'Tour suggestions: the map on top': 'Tourenvorschläge: die Karte oben',
    'In the map view the map now stands right under the title, the filters below it.': 'In der Kartenansicht steht die Karte jetzt gleich unter dem Titel, die Filter darunter.',
    'The map of the tours is big and the first thing you see; the filters moved below it': 'Die Karte der Touren ist gross und das Erste, was du siehst; die Filter sind darunter',
    'Trips › Dreams › Tour suggestions, «Map».': 'Touren › Träume › Tourenvorschläge, «Karte».',
    'Open Trips › Dreams › Tour suggestions and tap «Map»: the map is right under the title.': 'Öffne Touren › Träume › Tourenvorschläge und tippe «Karte»: die Karte steht gleich unter dem Titel.',
    'Scroll down: the filters are below the map. Tap «List»: the filters are on top again.': 'Scrolle nach unten: die Filter sind unter der Karte. Tippe «Liste»: die Filter sind wieder oben.',
  },
};
