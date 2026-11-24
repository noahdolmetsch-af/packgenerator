// «Live-Seite ruhiger» (Noah 23.11.2026 «a», Thread «Live-Navigation»)
export default {
  title: 'A calmer live page',
  lead: 'Before the start, the card «Ready for the ride?» closes by itself once the map and the voice are set.',
  points: [
    { text: 'The card «Ready for the ride?» is one line when the map is on the phone and the voice is on; a tap on it opens it again, with «Ride with OsmAnd instead?»', go: { href: '#/live', where: 'Shows on the live page before the start.' } },
    { text: 'While something is missing, the card stays open and offers «Keep the map» and «Switch the voice on»', go: { href: '#/live', where: 'Shows on the live page before the start.' } },
  ],
  test: ['Open the live page of a tour with a route: the card «Ready for the ride?» is open and shows what is missing.', 'Tap «Switch the voice on» and keep the map: the card closes to one line «Map and voice are set.»', 'Tap the line: the card opens again.'],
  since: [],
  de: {
    'A calmer live page': 'Eine ruhigere Live-Seite',
    'Before the start, the card «Ready for the ride?» closes by itself once the map and the voice are set.': 'Vor dem Start klappt die Karte «Bereit für unterwegs?» von selbst zu, sobald Karte und Sprache bereit sind.',
    'The card «Ready for the ride?» is one line when the map is on the phone and the voice is on; a tap on it opens it again, with «Ride with OsmAnd instead?»': 'Die Karte «Bereit für unterwegs?» ist eine Zeile, wenn die Karte auf dem Handy ist und die Sprache an; ein Tipp öffnet sie wieder, mit «Lieber mit OsmAnd fahren?»',
    'While something is missing, the card stays open and offers «Keep the map» and «Switch the voice on»': 'Solange etwas fehlt, bleibt die Karte offen und bietet «Karte speichern» und «Sprache einschalten» an',
    'Shows on the live page before the start.': 'Zeigt sich auf der Live-Seite vor dem Start.',
    'Open the live page of a tour with a route: the card «Ready for the ride?» is open and shows what is missing.': 'Öffne die Live-Seite einer Tour mit Route: die Karte «Bereit für unterwegs?» ist offen und zeigt, was fehlt.',
    'Tap «Switch the voice on» and keep the map: the card closes to one line «Map and voice are set.»': 'Tippe «Sprache einschalten» und speichere die Karte: die Karte klappt zu einer Zeile «Karte und Sprache sind bereit.» zu.',
    'Tap the line: the card opens again.': 'Tippe die Zeile: die Karte öffnet sich wieder.',
  },
};
