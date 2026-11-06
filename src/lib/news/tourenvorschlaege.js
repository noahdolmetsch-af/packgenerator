// «Tourenvorschläge» (Noah 05.11.2026 «a b, Mockup ja», «1a 2a 3a»): Pilot mit fünf Mountainbike-Touren aus SchweizMobil
export default {
  title: 'Tour suggestions',
  lead: 'The app suggests mountain bike tours from the official network of SchweizMobil. First pilot: five tours in Zurich and Grisons.',
  points: [
    { text: 'Filter the suggestions by region, difficulty and time; «Medium» and «Difficult» are on at the start', go: { href: '#/trips/vorschlaege', steps: [{ sel: '[data-vs-filters]' }], where: 'Trips › Dreams › Tour suggestions, the filters at the top.' } },
    { text: 'Every tour says «Why this suggestion?» and shows the height and the ground along the way', go: { href: '#/trips/vorschlaege/sm-332', steps: [{ sel: '[data-vs-why]' }] } },
    { text: 'Tours with snow up high stand grey in their own group; keep a tour as a dream, save it as GPX or hide it with «Not for me»', go: { href: '#/trips/vorschlaege', steps: [{ sel: '[data-vs-fits]' }] } },
  ],
  small: [{ box: 'new', text: 'Trips › Dreams has a button «Tour suggestions»', go: { href: '#/trips/dreams', steps: [{ sel: '[data-dreams-suggest]' }] } }],
  test: ['Open Trips › Dreams and tap «Tour suggestions»: five tours show, split into «Fits now» and, in winter, «Not for today».', 'Open «Davos Platz, Route 332»: the map, the height profile and «Why this suggestion?» show; move the slider and the dot moves on the map.', 'Tap «Not for me» on a tour: it goes, and «Undo» brings it back.'],
  since: ['f.tourvorschlag'],
  de: {
    'Tour suggestions': 'Tourenvorschläge',
    'The app suggests mountain bike tours from the official network of SchweizMobil. First pilot: five tours in Zurich and Grisons.': 'Die App schlägt Mountainbike-Touren aus dem offiziellen Netz von SchweizMobil vor. Erster Pilot: fünf Touren in Zürich und Graubünden.',
    'Filter the suggestions by region, difficulty and time; «Medium» and «Difficult» are on at the start': 'Filtere die Vorschläge nach Region, Schwierigkeit und Zeit; «Mittel» und «Schwierig» sind am Anfang an',
    'Trips › Dreams › Tour suggestions, the filters at the top.': 'Touren › Träume › Tourenvorschläge, die Filter ganz oben.',
    'Every tour says «Why this suggestion?» and shows the height and the ground along the way': 'Jede Tour sagt «Warum dieser Vorschlag?» und zeigt die Höhe und den Untergrund unterwegs',
    'Tours with snow up high stand grey in their own group; keep a tour as a dream, save it as GPX or hide it with «Not for me»': 'Touren mit Schnee in der Höhe stehen grau in einer eigenen Gruppe; merke eine Tour als Traum, speichere sie als GPX oder blende sie mit «Nicht für mich» aus',
    'Trips › Dreams has a button «Tour suggestions»': 'Touren › Träume hat einen Knopf «Tourenvorschläge»',
    'Open Trips › Dreams and tap «Tour suggestions»: five tours show, split into «Fits now» and, in winter, «Not for today».': 'Öffne Touren › Träume und tippe «Tourenvorschläge»: fünf Touren erscheinen, getrennt in «Passt jetzt» und im Winter «Heute nicht».',
    'Open «Davos Platz, Route 332»: the map, the height profile and «Why this suggestion?» show; move the slider and the dot moves on the map.': 'Öffne «Davos Platz, Route 332»: die Karte, das Höhenprofil und «Warum dieser Vorschlag?» erscheinen; schiebe den Regler, dann wandert der Punkt auf der Karte.',
    'Tap «Not for me» on a tour: it goes, and «Undo» brings it back.': 'Tippe bei einer Tour «Nicht für mich»: sie verschwindet, «Rückgängig» holt sie zurück.',
  },
};
