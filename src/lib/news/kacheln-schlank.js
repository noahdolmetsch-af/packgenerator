// Noah 23.11.2026 (thread «Speicher der App auf 1 GB senken»): map tiles counted at their real size
export default {
  title: 'Map tiles count what they weigh',
  lead: 'Chrome counted every kept map tile with about 8 MB. The app now asks for tiles in a way that counts their real size.',
  points: [{ text: 'The tiles you looked at before are loaded again once in the background; none is lost', go: { href: '#/me/data', steps: [{ sel: '[data-storage-measure]' }] } }],
  small: [],
  test: ['Open Me › Data and tap «Measure storage» (wait a minute after the app started, so the tiles are renewed).', 'The map tiles show a few MB, not hundreds; the line «counted by the browser» is much smaller than before.'],
  since: [],
  de: {
    'Map tiles count what they weigh': 'Kartenkacheln zählen, was sie wiegen',
    'Chrome counted every kept map tile with about 8 MB. The app now asks for tiles in a way that counts their real size.': 'Chrome zählte jede gemerkte Kartenkachel mit etwa 8 MB. Die App holt Kacheln jetzt so, dass ihre echte Grösse zählt.',
    'The tiles you looked at before are loaded again once in the background; none is lost': 'Die Kacheln, die du schon angesehen hast, werden einmal im Hintergrund neu geladen; keine geht verloren',
    'Open Me › Data and tap «Measure storage» (wait a minute after the app started, so the tiles are renewed).': 'Öffne Ich › Daten und tippe auf «Speicher messen» (warte nach dem Start der App eine Minute, damit die Kacheln erneuert sind).',
    'The map tiles show a few MB, not hundreds; the line «counted by the browser» is much smaller than before.': 'Die Kartenkacheln zeigen wenige MB statt Hunderten; die Zeile «zählt der Browser» ist viel kleiner als vorher.',
  },
};
