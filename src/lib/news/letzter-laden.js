// «Letzter offener Laden vor der Nacht» (Noah 02.11.2026 «4a», «das wichtigste Feature»): the live map names the last shop you reach open and before sunset
export default {
  title: 'Last open shop before the night',
  lead: 'On a ride with a route the live map names the last shop you reach while it is open and before sunset.',
  points: [
    { text: 'New card «Last open shop before the night» in «Stops»: name, km, arrival and closing time', href: '#/live', go: 'f.live' },
    { text: 'No open shop left before the night, or already dark: the nearest shop ahead', href: '#/live', go: 'f.live' },
  ],
  small: [{ box: 'new', text: 'A shop without known opening hours says «Not sure»', go: 'f.live' }],
  test: ['Start the live map with a route and open the panel: under «Stops» the card «Last open shop before the night» shows a shop.', 'Tap «Navigate» on the card: Google Maps or OsmAnd opens with the shop.'],
  since: [],
  de: {
    'Last open shop before the night': 'Letzter offener Laden vor der Nacht',
    'On a ride with a route the live map names the last shop you reach while it is open and before sunset.': 'Bei einer Fahrt mit Route nennt die Live-Karte den letzten Laden, den du offen und vor Sonnenuntergang erreichst.',
    'New card «Last open shop before the night» in «Stops»: name, km, arrival and closing time': 'Neue Karte «Letzter offener Laden vor der Nacht» unter «Stopps»: Name, km, Ankunft und Schliesszeit',
    'No open shop left before the night, or already dark: the nearest shop ahead': 'Kein offener Laden mehr vor der Nacht oder schon dunkel: der nächste Laden vor dir',
    'A shop without known opening hours says «Not sure»': 'Ein Laden ohne bekannte Öffnungszeiten sagt «Nicht sicher»',
    'Start the live map with a route and open the panel: under «Stops» the card «Last open shop before the night» shows a shop.': 'Live-Karte mit Route starten und das Panel öffnen: Unter «Stopps» zeigt die Karte «Letzter offener Laden vor der Nacht» einen Laden.',
    'Tap «Navigate» on the card: Google Maps or OsmAnd opens with the shop.': 'Auf der Karte «Navigieren» tippen: Google Maps oder OsmAnd öffnet sich mit dem Laden.',
  },
};
