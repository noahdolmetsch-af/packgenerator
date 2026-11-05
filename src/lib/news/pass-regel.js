// «Entdecken und Sammeln» (Noah 04.11.2026 «1a 2a 3a 4b 5a»): eine Regel für Pässe in Neuland und Pässe sammeln
export default {
  title: 'One rule for passes',
  lead: 'Neuland and «Passes» now use the same rule: up to 600 m from the top counts, up to 1.2 km the app asks.',
  points: [{ text: 'Trips › Look back › Passes: a pass the line only just passed says «Please confirm» and has «Yes, rode it»', href: '#/debrief/paesse', go: 'f.passes' }],
  small: [{ box: 'new', text: 'New ground › Alpine passes lists such passes as «maybe ridden»: nothing counts until you say so', go: 'f.neuland' }],
  test: [
    'Open Trips › Look back › Passes: a pass with «Please confirm» shows how many metres the line passed from the top.',
    'Tap «Yes, rode it»: the pass is in your collection. «Collect all sure ones» leaves such passes out.',
    'Open New ground › Alpine passes: «maybe ridden» has «Yes, I was there» and «Not there».',
  ],
  since: [],
  de: {
    'One rule for passes': 'Eine Regel für Pässe',
    'Neuland and «Passes» now use the same rule: up to 600 m from the top counts, up to 1.2 km the app asks.': 'Neuland und «Pässe» brauchen jetzt dieselbe Regel: bis 600 m von der Passhöhe zählt, bis 1,2 km fragt die App.',
    'Trips › Look back › Passes: a pass the line only just passed says «Please confirm» and has «Yes, rode it»': 'Touren › Rückblick › Pässe: ein Pass, an dem die Linie nur knapp vorbeiging, sagt «Bitte bestätigen» und hat «Ja, gefahren»',
    'New ground › Alpine passes lists such passes as «maybe ridden»: nothing counts until you say so': 'Neuland › Alpenpässe führt solche Pässe als «vielleicht gefahren»: nichts zählt, bis du es sagst',
    'Open Trips › Look back › Passes: a pass with «Please confirm» shows how many metres the line passed from the top.': 'Öffne Touren › Rückblick › Pässe: ein Pass mit «Bitte bestätigen» zeigt, wie viele Meter die Linie von der Passhöhe vorbeiging.',
    'Tap «Yes, rode it»: the pass is in your collection. «Collect all sure ones» leaves such passes out.': 'Tippe «Ja, gefahren»: der Pass ist in deiner Sammlung. «Alle sicheren einsammeln» lässt solche Pässe aus.',
    'Open New ground › Alpine passes: «maybe ridden» has «Yes, I was there» and «Not there».': 'Öffne Neuland › Alpenpässe: «vielleicht gefahren» hat «Ja, ich war dort» und «Nicht dort».',
  },
};
