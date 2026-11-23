// «Tourenvorschläge: die steilsten Stücke» (Noah 23.11.2026 «1-5a», Idee B des Höhenprofil-Auftrags)
export default {
  title: 'Tour suggestions: the steepest pieces',
  lead: 'Under the height profile of a suggested tour the three steepest pieces are listed, and a tap shows each one on the map and in the profile.',
  points: [
    { text: 'The three steepest climbs from 12 %, with km, average and highest gradient and metres climbed. A tap lights the piece dark red, and the map and the profile zoom into it', go: { href: '#/trips/vorschlaege/sm-33', steps: [{ sel: '[data-vs-steep]' }], where: 'Trips › Dreams › Tour suggestions › a tour: Height and ground.' } },
  ],
  small: [],
  test: ['Open a tour in Tour suggestions and look under the height profile: «The steepest pieces» lists up to three.', 'Tap one: it turns dark red, and the map and the profile zoom in. Tap it again to go back to the whole tour.'],
  since: [],
  de: {
    'Tour suggestions: the steepest pieces': 'Tourenvorschläge: die steilsten Stücke',
    'Under the height profile of a suggested tour the three steepest pieces are listed, and a tap shows each one on the map and in the profile.': 'Unter dem Höhenprofil einer vorgeschlagenen Tour stehen die drei steilsten Stücke, und ein Tipp zeigt jedes auf der Karte und im Profil.',
    'The three steepest climbs from 12 %, with km, average and highest gradient and metres climbed. A tap lights the piece dark red, and the map and the profile zoom into it': 'Die drei steilsten Anstiege ab 12 %, mit km, Schnitt und höchster Steigung und Höhenmetern. Ein Tipp färbt das Stück dunkelrot, Karte und Profil zoomen hinein',
    'Trips › Dreams › Tour suggestions › a tour: Height and ground.': 'Touren › Träume › Tourenvorschläge › eine Tour: Höhe und Untergrund.',
    'Open a tour in Tour suggestions and look under the height profile: «The steepest pieces» lists up to three.': 'Öffne in den Tourenvorschlägen eine Tour und schau unter das Höhenprofil: «Die steilsten Stücke» nennt bis zu drei.',
    'Tap one: it turns dark red, and the map and the profile zoom in. Tap it again to go back to the whole tour.': 'Tippe eines an: es wird dunkelrot, und Karte und Profil zoomen hinein. Tippe es nochmals an, um zur ganzen Tour zurückzukehren.',
  },
};
