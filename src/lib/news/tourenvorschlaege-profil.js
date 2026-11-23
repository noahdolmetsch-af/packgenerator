// «Tourenvorschläge: Profil und Karte zeigen dieselbe Stelle, die steilsten Stücke» (Noah 23.11.2026 «1-5a», Idee B des Höhenprofil-Auftrags)
// Eine Datei für den ganzen PR (Version nach Reihenfolge auf main: eine Datei je PR).
export default {
  title: 'Tour suggestions: profile and map show the same place, the steepest pieces',
  lead: 'On the page of a suggested tour the height profile is the same as everywhere in the app, the profile and the map show the same place, and the three steepest pieces are listed.',
  points: [
    { text: 'Tap or drag in the height profile: a dot on the map shows the same place. Tap the map near the line: the profile jumps there', go: { href: '#/trips/vorschlaege/sm-33', steps: [{ sel: '[data-profile]' }], where: 'Trips › Dreams › Tour suggestions › a tour: Height and ground.' } },
    { text: 'Under the profile the three steepest climbs from 12 % are listed, with km, average and highest gradient and metres climbed. A tap lights the piece dark red, and the map and the profile zoom into it', go: { href: '#/trips/vorschlaege/sm-33', steps: [{ sel: '[data-vs-steep]' }] } },
    { text: 'The profile shows how steep it is in colours, and you can zoom into a piece. The ground (single trail, gravel, asphalt) stays as a strip under it', go: { href: '#/trips/vorschlaege/sm-33', steps: [{ sel: '[data-vs-ground-strip]' }] } },
  ],
  small: [{ box: 'nicer', text: 'On a phone the first tap on a dot of the map now shows the card for sure and only the second tap opens the tour', go: null }],
  test: ['Open a tour in Tour suggestions and tap into the height profile: a dot appears on the map at the same place.', 'Tap the line on the map: the cursor in the profile jumps to that place.', 'Under the profile tap one of «The steepest pieces»: it turns dark red, and the map and the profile zoom in. Tap it again to go back.'],
  since: [],
  de: {
    'Tour suggestions: profile and map show the same place, the steepest pieces': 'Tourenvorschläge: Profil und Karte zeigen dieselbe Stelle, die steilsten Stücke',
    'On the page of a suggested tour the height profile is the same as everywhere in the app, the profile and the map show the same place, and the three steepest pieces are listed.': 'Auf der Seite einer vorgeschlagenen Tour ist das Höhenprofil dasselbe wie überall in der App, Profil und Karte zeigen dieselbe Stelle, und die drei steilsten Stücke stehen in einer Liste.',
    'Tap or drag in the height profile: a dot on the map shows the same place. Tap the map near the line: the profile jumps there': 'Tippe oder ziehe im Höhenprofil: ein Punkt auf der Karte zeigt dieselbe Stelle. Tippe auf der Karte nahe an die Linie: das Profil springt dorthin',
    'Trips › Dreams › Tour suggestions › a tour: Height and ground.': 'Touren › Träume › Tourenvorschläge › eine Tour: Höhe und Untergrund.',
    'Under the profile the three steepest climbs from 12 % are listed, with km, average and highest gradient and metres climbed. A tap lights the piece dark red, and the map and the profile zoom into it': 'Unter dem Profil stehen die drei steilsten Anstiege ab 12 %, mit km, Schnitt und höchster Steigung und Höhenmetern. Ein Tipp färbt das Stück dunkelrot, Karte und Profil zoomen hinein',
    'The profile shows how steep it is in colours, and you can zoom into a piece. The ground (single trail, gravel, asphalt) stays as a strip under it': 'Das Profil zeigt die Steilheit in Farben, und du kannst in ein Stück hineinzoomen. Der Untergrund (Singletrail, Schotter, Asphalt) bleibt als Streifen darunter',
    'On a phone the first tap on a dot of the map now shows the card for sure and only the second tap opens the tour': 'Am Handy zeigt der erste Tipp auf einen Punkt der Karte jetzt sicher die Karte, erst der zweite Tipp öffnet die Tour',
    'Open a tour in Tour suggestions and tap into the height profile: a dot appears on the map at the same place.': 'Öffne in den Tourenvorschlägen eine Tour und tippe ins Höhenprofil: auf der Karte erscheint an derselben Stelle ein Punkt.',
    'Tap the line on the map: the cursor in the profile jumps to that place.': 'Tippe auf die Linie auf der Karte: der Cursor im Profil springt an diese Stelle.',
    'Under the profile tap one of «The steepest pieces»: it turns dark red, and the map and the profile zoom in. Tap it again to go back.': 'Tippe unter dem Profil eines der «Die steilsten Stücke» an: es wird dunkelrot, und Karte und Profil zoomen hinein. Tippe es nochmals an, um zurückzugehen.',
  },
};
