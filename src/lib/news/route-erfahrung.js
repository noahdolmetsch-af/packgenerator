// «Route kennt deine Erfahrung» (Noah 21.11.2026 «2b»): under a route, what your own rides say about it
export default {
  title: 'Your routes know your rides',
  lead: 'Under the route of a trip you see which stretches you marked as bad, and how much of the route is new for you.',
  points: [
    { text: 'Stretches you marked as bad or good after a ride show under the map, with the km', go: { href: '#/trips', steps: [{ sel: '[data-route-known]' }], where: 'Trips › a trip with a route › Route' } },
    { text: 'One tap tells how much of the route you have never ridden', go: { href: '#/trips', steps: [{ sel: '[data-route-known-compare]' }], where: 'Trips › a trip with a route › Route' } },
  ],
  small: [{ box: 'new', text: 'Nothing is changed: it is only a hint before you ride' }],
  test: ['Open a trip with a GPX route (Plan › Route): under the map a line says where marked stretches lie, or how to mark them.', 'Tap «How new is this route for me?»: a line says how many percent of the route are new for you.'],
  since: ['f.routeknown'],
  de: {
    'Your routes know your rides': 'Deine Routen kennen deine Fahrten',
    'Under the route of a trip you see which stretches you marked as bad, and how much of the route is new for you.': 'Unter der Route einer Tour siehst du, welche Stücke du als schlecht markiert hast und wie viel der Route neu für dich ist.',
    'Stretches you marked as bad or good after a ride show under the map, with the km': 'Stücke, die du nach einer Fahrt als schlecht oder gut markiert hast, stehen unter der Karte, mit dem km',
    'One tap tells how much of the route you have never ridden': 'Ein Tipp sagt, wie viel der Route du noch nie gefahren bist',
    'Trips › a trip with a route › Route': 'Touren › eine Tour mit Route › Route',
    'Nothing is changed: it is only a hint before you ride': 'Es wird nichts verändert: Es ist nur ein Hinweis vor der Fahrt',
    'Open a trip with a GPX route (Plan › Route): under the map a line says where marked stretches lie, or how to mark them.': 'Öffne eine Tour mit GPX-Route (Plan › Route): Unter der Karte sagt eine Zeile, wo markierte Stücke liegen, oder wie man sie markiert.',
    'Tap «How new is this route for me?»: a line says how many percent of the route are new for you.': 'Tippe auf «Wie neu ist diese Route für mich?»: Eine Zeile sagt, wie viel Prozent der Route neu für dich sind.',
  },
};
