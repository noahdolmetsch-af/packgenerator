// «Rast suchen» (Noah 26.11.2026 «1a 2a 3a 4a»): die Live-Karte nennt mit einem Tipp drei Orte zum Anhalten in den nächsten 20 km.
export default {
  title: 'Find a rest',
  lead: 'On the live map one tap lists three places to stop in the next 20 km.',
  points: [{ text: 'Live map › «Find a rest»: up to three shops, cafes, fuel stops or water points ahead, the shortest detour first', go: { href: '#/live', where: 'Shows on the live map during a ride on a route.' } }],
  test: ['Start the live map on a route and scroll to the card «Rest stop».', 'Tap «Find a rest»: up to three places ahead, each with its detour in km.'],
  since: [],
  de: {
    'Find a rest': 'Rast suchen',
    'On the live map one tap lists three places to stop in the next 20 km.': 'Die Live-Karte nennt mit einem Tipp drei Orte zum Anhalten in den nächsten 20 km.',
    'Live map › «Find a rest»: up to three shops, cafes, fuel stops or water points ahead, the shortest detour first': 'Live-Karte › «Rast suchen»: bis zu drei Läden, Cafés, Tankstellen oder Wasserstellen voraus, der kürzeste Umweg zuerst',
    'Shows on the live map during a ride on a route.': 'Zeigt sich auf der Live-Karte während einer Fahrt auf einer Strecke.',
    'Start the live map on a route and scroll to the card «Rest stop».': 'Starte die Live-Karte auf einer Strecke und scrolle zur Karte «Rast».',
    'Tap «Find a rest»: up to three places ahead, each with its detour in km.': 'Tippe «Rast suchen»: bis zu drei Orte voraus, jeder mit seinem Umweg in km.',
  },
};
