// «Rennatlas»: the map like the mockup (Noah 24.11.2026 «richtige Karte»): three zoom levels, places, lakes, scale
export default {
  title: 'A real map in the race atlas',
  lead: 'The map of your race start places now has three zoom levels, like the mockup: Europe, the wider region and a close-up, with place names, lakes and a scale.',
  points: [
    { text: 'Race atlas › Map: a large map and two smaller ones beside it; + and − change the zoom, a tap on a small map makes it the large one, and a dashed frame shows where the next zoom goes', go: { href: '#/race', steps: [{ text: 'Open the race atlas' }] } },
    { text: 'The close-up shows places (Zurich, Bern, Chur …), lakes and a scale in km; a tap on a number still opens the race', go: { href: '#/race', steps: [{ text: 'Open the race atlas' }] } },
  ],
  test: [
    'Go to Trips › Races › «Race atlas» (with your file loaded) and tap «Map».',
    'Tap «−» on the large map: the wider region comes, with the dashed frame of the close-up.',
    'Tap a number on the map: the race opens.',
  ],
  since: [],
  de: {
    'A real map in the race atlas': 'Eine richtige Karte im Rennatlas',
    'The map of your race start places now has three zoom levels, like the mockup: Europe, the wider region and a close-up, with place names, lakes and a scale.': 'Die Karte deiner Startorte hat jetzt drei Zoomstufen wie im Mockup: Europa, die weitere Umgebung und eine Nahaufnahme, mit Ortsnamen, Seen und Massstab.',
    'Race atlas › Map: a large map and two smaller ones beside it; + and − change the zoom, a tap on a small map makes it the large one, and a dashed frame shows where the next zoom goes': 'Rennatlas › Karte: eine grosse Karte und zwei kleinere daneben; mit + und − änderst du den Zoom, ein Tipp auf eine kleine Karte macht sie gross, und ein gestrichelter Rahmen zeigt, wohin der nächste Zoom geht',
    'The close-up shows places (Zurich, Bern, Chur …), lakes and a scale in km; a tap on a number still opens the race': 'Die Nahaufnahme zeigt Orte (Zürich, Bern, Chur …), Seen und einen Massstab in km; ein Tipp auf eine Nummer öffnet weiter das Rennen',
    'Go to Trips › Races › «Race atlas» (with your file loaded) and tap «Map».': 'Geh zu Touren › Rennen › «Rennatlas» (mit geladener Datei) und tippe auf «Karte».',
    'Tap «−» on the large map: the wider region comes, with the dashed frame of the close-up.': 'Tippe auf der grossen Karte auf «−»: Die weitere Umgebung kommt, mit dem gestrichelten Rahmen der Nahaufnahme.',
    'Tap a number on the map: the race opens.': 'Tippe auf eine Nummer auf der Karte: Das Rennen öffnet sich.',
  },
};
