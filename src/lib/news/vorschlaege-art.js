// «Tourenvorschläge: Art und Start» (Noah 05.11.2026 «mit 1 beginnen, dann 2-5»): Art-Filter, Start-Filter, Zeilen wählen
export default {
  title: 'Tour suggestions: kind and start',
  lead: 'You can now filter the tour suggestions by kind and by distance from home, and choose which reasons you see.',
  points: [
    { text: 'Filter by kind: single trail, downhill, gravel and paths, round trip', go: { href: '#/trips/vorschlaege', steps: [{ sel: '[data-vs-arts]' }], where: 'Trips › Dreams › Tour suggestions, under «Region».' } },
    { text: 'With a home place you can limit how far the start may be', go: { href: '#/trips/vorschlaege', steps: [{ sel: '[data-vs-start]' }] } },
    { text: 'In «Why this suggestion?» you choose which lines you want to see', go: { href: '#/trips/vorschlaege/sm-332', steps: [{ sel: '[data-vs-lines] summary' }] } },
  ],
  small: [],
  test: ['Open Trips › Dreams › Tour suggestions and tap «Downhill»: only the downhill stays.', 'Open a tour, open «Choose the lines» and untick «Snow»: the snow line is gone from «Why this suggestion?».'],
  since: [],
  de: {
    'Tour suggestions: kind and start': 'Tourenvorschläge: Art und Start',
    'You can now filter the tour suggestions by kind and by distance from home, and choose which reasons you see.': 'Du kannst die Tourenvorschläge jetzt nach Art und nach Abstand von zu Hause filtern und wählen, welche Gründe du siehst.',
    'Filter by kind: single trail, downhill, gravel and paths, round trip': 'Filtere nach Art: Singletrail, Abfahrt, Schotter und Wege, Runde',
    'Trips › Dreams › Tour suggestions, under «Region».': 'Touren › Träume › Tourenvorschläge, unter «Region».',
    'With a home place you can limit how far the start may be': 'Mit einem Wohnort begrenzt du, wie weit der Start weg sein darf',
    'In «Why this suggestion?» you choose which lines you want to see': 'Unter «Warum dieser Vorschlag?» wählst du, welche Zeilen du sehen willst',
    'Open Trips › Dreams › Tour suggestions and tap «Downhill»: only the downhill stays.': 'Öffne Touren › Träume › Tourenvorschläge und tippe «Abfahrt»: nur die Abfahrt bleibt.',
    'Open a tour, open «Choose the lines» and untick «Snow»: the snow line is gone from «Why this suggestion?».': 'Öffne eine Tour, öffne «Zeilen wählen» und nimm bei «Schnee» den Haken weg: die Schneezeile fehlt unter «Warum dieser Vorschlag?».',
  },
};
