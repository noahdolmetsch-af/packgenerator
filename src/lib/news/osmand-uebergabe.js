// «Mit OsmAnd fahren» (Noah 23.11.2026 «1a»): one tap hands the route over to OsmAnd
export default {
  title: 'Ride with OsmAnd',
  lead: 'Before the start the live page can hand the route over to OsmAnd with one tap.',
  points: [
    { text: 'New row «Ride with OsmAnd instead?» on the card «Ready for the ride?»: the route and its stops as a GPX file for OsmAnd', go: { href: '#/live', where: 'Shows on the live page before the start, on a tour with a route.' } },
  ],
  small: [{ box: 'new', text: 'The line below the row says what to tap in OsmAnd', go: { href: '#/live', where: 'Shows after you tapped «Ride with OsmAnd».' } }],
  test: ['Open the live page of a tour with a route and find the row «Ride with OsmAnd instead?» on the card «Ready for the ride?».', 'Tap «Ride with OsmAnd»: the share list opens (or the file is saved) and a line says what to do next.'],
  since: [],
  de: {
    'Ride with OsmAnd': 'Mit OsmAnd fahren',
    'Before the start the live page can hand the route over to OsmAnd with one tap.': 'Vor dem Start kann die Live-Seite die Strecke mit einem Tipp an OsmAnd übergeben.',
    'New row «Ride with OsmAnd instead?» on the card «Ready for the ride?»: the route and its stops as a GPX file for OsmAnd': 'Neue Zeile «Lieber mit OsmAnd fahren?» auf der Karte «Bereit für unterwegs?»: die Strecke mit ihren Stopps als GPX-Datei für OsmAnd',
    'Shows on the live page before the start, on a tour with a route.': 'Zeigt sich auf der Live-Seite vor dem Start, bei einer Tour mit Strecke.',
    'The line below the row says what to tap in OsmAnd': 'Die Zeile darunter sagt, was du in OsmAnd antippst',
    'Shows after you tapped «Ride with OsmAnd».': 'Zeigt sich, nachdem du «Mit OsmAnd fahren» getippt hast.',
    'Open the live page of a tour with a route and find the row «Ride with OsmAnd instead?» on the card «Ready for the ride?».': 'Die Live-Seite einer Tour mit Strecke öffnen und auf der Karte «Bereit für unterwegs?» die Zeile «Lieber mit OsmAnd fahren?» finden.',
    'Tap «Ride with OsmAnd»: the share list opens (or the file is saved) and a line says what to do next.': '«Mit OsmAnd fahren» tippen: die Teilen-Liste öffnet sich (oder die Datei wird gespeichert) und eine Zeile sagt, was als Nächstes zu tun ist.',
  },
};
