// «Karte der Tourenvorschläge: kleinere Punkte» (Noah 25.11.2026 «die Punkte sind viel zu gross, gerade auf dem Handy»): kleinere Punkte, Zoom auf den Kanton.
export default {
  title: 'Tour map: smaller dots',
  lead: 'On the map of the tour suggestions the dots are smaller, and tapping a canton zooms in.',
  points: [
    { text: 'Smaller dots and thinner lines: with all 600 tours the map is readable again, also on the phone', go: { href: '#/trips/vorschlaege', steps: [{ sel: '[data-vs-view="map"]' }], where: 'Trips › Dreams › Tour suggestions › «Map».' } },
    { text: 'Tap a canton and the map zooms to it, with the weather rings; «Whole Switzerland» takes you back', go: { href: '#/trips/vorschlaege', steps: [{ sel: '[data-vs-view="map"]' }], where: 'Trips › Dreams › Tour suggestions › «Map»: tap the letters of a canton.' } },
  ],
  small: [{ box: 'new', text: 'With over 200 tours on the whole map there are no weather rings; they come back when you tap a canton or filter' }],
  test: ['Open Trips › Dreams › Tour suggestions › «Map»: the dots are small and the numbers of the cantons can be read.', 'Tap the letters «GR»: the map zooms to Graubünden and the button «Whole Switzerland» appears. Tap it: the whole country is back.'],
  since: [],
  de: {
    'Tour map: smaller dots': 'Tourenkarte: kleinere Punkte',
    'On the map of the tour suggestions the dots are smaller, and tapping a canton zooms in.': 'Auf der Karte der Tourenvorschläge sind die Punkte kleiner, und ein Tipp auf einen Kanton zoomt hinein.',
    'Smaller dots and thinner lines: with all 600 tours the map is readable again, also on the phone': 'Kleinere Punkte und dünnere Linien: mit allen 600 Touren ist die Karte wieder lesbar, auch am Handy',
    'Trips › Dreams › Tour suggestions › «Map».': 'Touren › Träume › Tourenvorschläge › «Karte».',
    'Tap a canton and the map zooms to it, with the weather rings; «Whole Switzerland» takes you back': 'Tippe auf einen Kanton, dann zoomt die Karte hinein, mit den Wetter-Ringen; «Ganze Schweiz» bringt dich zurück',
    'Trips › Dreams › Tour suggestions › «Map»: tap the letters of a canton.': 'Touren › Träume › Tourenvorschläge › «Karte»: tippe auf die Buchstaben eines Kantons.',
    'With over 200 tours on the whole map there are no weather rings; they come back when you tap a canton or filter': 'Bei über 200 Touren auf der ganzen Karte gibt es keine Wetter-Ringe; sie kommen zurück, wenn du einen Kanton antippst oder filterst',
    'Open Trips › Dreams › Tour suggestions › «Map»: the dots are small and the numbers of the cantons can be read.': 'Öffne Touren › Träume › Tourenvorschläge › «Karte»: die Punkte sind klein und die Zahlen der Kantone lassen sich lesen.',
    'Tap the letters «GR»: the map zooms to Graubünden and the button «Whole Switzerland» appears. Tap it: the whole country is back.': 'Tippe auf die Buchstaben «GR»: die Karte zoomt auf Graubünden, und der Knopf «Ganze Schweiz» erscheint. Tippe darauf: das ganze Land ist zurück.',
  },
};
