// «Abbiegepunkte für den Garmin» (Noah 23.11.2026 «3a», Thread «Live-Navigation»)
export default {
  title: 'Turns for the Garmin',
  lead: 'The FIT course for the Edge now has the turns of the route: an arrow before each, with the phone off.',
  points: [
    { text: 'The FIT course («FIT course with n points») also holds the turns of the route; the Edge shows an arrow and «Turn left» before each', go: null },
    { text: 'The chip «With turns» switches them off again; the places (shops, water, beds) always come first', go: null },
  ],
  test: ['Open Supplies for a tour with a route and look under the stops: the chip «With turns» is on.', 'Tap the chip: the number of points drops to the places; tap again: it rises.', 'Save the .fit file and copy it into the folder «NewFiles» of the Edge: an arrow shows before each turn.'],
  since: [],
  de: {
    'Turns for the Garmin': 'Abbiegepunkte für den Garmin',
    'The FIT course for the Edge now has the turns of the route: an arrow before each, with the phone off.': 'Der FIT-Kurs für den Edge enthält jetzt die Abbiegungen der Route: vor jeder ein Pfeil, auch bei ausgeschaltetem Handy.',
    'The FIT course («FIT course with n points») also holds the turns of the route; the Edge shows an arrow and «Turn left» before each': 'Der FIT-Kurs («FIT-Kurs mit n Kurspunkten») enthält auch die Abbiegungen der Route; der Edge zeigt vor jeder einen Pfeil und «Links abbiegen»',
    'The chip «With turns» switches them off again; the places (shops, water, beds) always come first': 'Der Chip «Mit Abbiegepunkten» schaltet sie wieder ab; die Orte (Läden, Wasser, Betten) kommen immer zuerst',
    'Open Supplies for a tour with a route and look under the stops: the chip «With turns» is on.': 'Öffne Verpflegung für eine Tour mit Route und schau unter die Stopps: der Chip «Mit Abbiegepunkten» ist an.',
    'Tap the chip: the number of points drops to the places; tap again: it rises.': 'Tippe den Chip: die Zahl der Punkte sinkt auf die Orte; tippe noch einmal: sie steigt.',
    'Save the .fit file and copy it into the folder «NewFiles» of the Edge: an arrow shows before each turn.': 'Speichere die .fit-Datei und kopiere sie in den Ordner «NewFiles» des Edge: vor jeder Abzweigung erscheint ein Pfeil.',
  },
};
