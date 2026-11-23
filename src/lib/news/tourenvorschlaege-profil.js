// «Tourenvorschläge: Profil und Karte zeigen dieselbe Stelle» (Noah 23.11.2026 «1-5a», Idee B des Höhenprofil-Auftrags)
export default {
  title: 'Tour suggestions: profile and map show the same place',
  lead: 'On the page of a suggested tour the height profile is the same as everywhere in the app, and the profile and the map show the same place.',
  points: [
    { text: 'Tap or drag in the height profile: a dot on the map shows the same place. Tap the map near the line: the profile jumps there', go: { href: '#/trips/vorschlaege/sm-33', steps: [{ sel: '[data-profile]' }], where: 'Trips › Dreams › Tour suggestions › a tour: Height and ground.' } },
    { text: 'The profile shows how steep it is in colours, and you can zoom into a piece. The ground (single trail, gravel, asphalt) stays as a strip under it', go: { href: '#/trips/vorschlaege/sm-33', steps: [{ sel: '[data-vs-ground-strip]' }] } },
  ],
  small: [],
  test: ['Open a tour in Tour suggestions and tap into the height profile: a dot appears on the map at the same place.', 'Tap the line on the map: the cursor in the profile jumps to that place.', 'Under the profile you see the ground as a coloured strip with a key.'],
  since: [],
  de: {
    'Tour suggestions: profile and map show the same place': 'Tourenvorschläge: Profil und Karte zeigen dieselbe Stelle',
    'On the page of a suggested tour the height profile is the same as everywhere in the app, and the profile and the map show the same place.': 'Auf der Seite einer vorgeschlagenen Tour ist das Höhenprofil dasselbe wie überall in der App, und Profil und Karte zeigen dieselbe Stelle.',
    'Tap or drag in the height profile: a dot on the map shows the same place. Tap the map near the line: the profile jumps there': 'Tippe oder ziehe im Höhenprofil: ein Punkt auf der Karte zeigt dieselbe Stelle. Tippe auf der Karte nahe an die Linie: das Profil springt dorthin',
    'Trips › Dreams › Tour suggestions › a tour: Height and ground.': 'Touren › Träume › Tourenvorschläge › eine Tour: Höhe und Untergrund.',
    'The profile shows how steep it is in colours, and you can zoom into a piece. The ground (single trail, gravel, asphalt) stays as a strip under it': 'Das Profil zeigt die Steilheit in Farben, und du kannst in ein Stück hineinzoomen. Der Untergrund (Singletrail, Schotter, Asphalt) bleibt als Streifen darunter',
    'Open a tour in Tour suggestions and tap into the height profile: a dot appears on the map at the same place.': 'Öffne in den Tourenvorschlägen eine Tour und tippe ins Höhenprofil: auf der Karte erscheint an derselben Stelle ein Punkt.',
    'Tap the line on the map: the cursor in the profile jumps to that place.': 'Tippe auf die Linie auf der Karte: der Cursor im Profil springt an diese Stelle.',
    'Under the profile you see the ground as a coloured strip with a key.': 'Unter dem Profil siehst du den Untergrund als farbigen Streifen mit Legende.',
  },
};
