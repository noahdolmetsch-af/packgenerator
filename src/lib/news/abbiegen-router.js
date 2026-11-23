// «Hinweise vom Router» (Noah 23.11.2026 «2a»): on a way the router planned, the live map says the real junctions and the roundabout exit
export default {
  title: 'Turn hints from the router',
  lead: 'On a way the app planned for you, the live map now says real junctions and roundabouts.',
  points: [
    { text: 'On the way to a goal or back onto the route the turns come from the router: «In 200 m roundabout: take exit 2»', go: { href: '#/live', where: 'Shows on the live map when you ride a way planned with «Plan to …» or «Re-plan to …».' } },
    { text: 'Your own GPX route keeps the hints from the shape of the line, as before', go: { href: '#/live', where: 'Shows on the live map during a ride on a route.' } },
  ],
  small: [{ box: 'new', text: 'The list «Step by step» names roundabouts with their exit', go: { href: '#/live', where: 'Shows on the live map under the way to a goal.' } }],
  test: ['Start the live map, choose a place and tap «Plan to …»: the way is planned.', 'Ride toward the first junction: the big arrow says the turn, at a roundabout «Take exit N».'],
  since: [],
  de: {
    'Turn hints from the router': 'Abbiegehinweise vom Router',
    'On a way the app planned for you, the live map now says real junctions and roundabouts.': 'Auf einem Weg, den die App für dich geplant hat, nennt die Live-Karte jetzt echte Abzweigungen und Kreisel.',
    'On the way to a goal or back onto the route the turns come from the router: «In 200 m roundabout: take exit 2»': 'Auf dem Weg zu einem Ziel oder zurück auf die Strecke kommen die Hinweise vom Router: «In 200 m Kreisel: 2. Ausfahrt nehmen»',
    'Shows on the live map when you ride a way planned with «Plan to …» or «Re-plan to …».': 'Zeigt sich auf der Live-Karte, wenn du einen Weg fährst, der mit «Dorthin planen» oder «Neu planen zu …» geplant wurde.',
    'Your own GPX route keeps the hints from the shape of the line, as before': 'Deine eigene GPX-Strecke behält die Hinweise aus der Form der Linie, wie bisher',
    'Shows on the live map during a ride on a route.': 'Zeigt sich auf der Live-Karte während einer Fahrt auf einer Strecke.',
    'The list «Step by step» names roundabouts with their exit': 'Die Liste «Schritt für Schritt» nennt Kreisel mit ihrer Ausfahrt',
    'Shows on the live map under the way to a goal.': 'Zeigt sich auf der Live-Karte unter dem Weg zum Ziel.',
    'Start the live map, choose a place and tap «Plan to …»: the way is planned.': 'Live-Karte starten, einen Ort wählen und «Dorthin planen» tippen: der Weg wird geplant.',
    'Ride toward the first junction: the big arrow says the turn, at a roundabout «Take exit N».': 'Auf die erste Abzweigung zufahren: der grosse Pfeil nennt die Richtung, bei einem Kreisel «Ausfahrt Nr. nehmen».',
  },
};
