// «Wohnort und Wetter pro Tour» (Noah 01.11.2026 «2a»): choose home place or next tour on the weather page
export default {
  title: 'Weather for home or the next tour',
  lead: 'The weather page lets you switch between your home place and the place of your next tour.',
  points: [{ text: 'At the top of the weather page tap «Home place» or «Next tour»', go: 'f.weather' }],
  small: [{ box: 'new', text: 'Another place stays one search away' }],
  test: [
    'Open Weather (Me › Weather). At the top you see «Home place».',
    'With a planned tour that has a place or a route, «Next tour: …» is there too: tap it, the weather changes to that place.',
  ],
  since: [],
  de: {
    'Weather for home or the next tour': 'Wetter für Zuhause oder die nächste Tour',
    'The weather page lets you switch between your home place and the place of your next tour.': 'Auf der Wetter-Seite wechselst du zwischen deinem Wohnort und dem Ort deiner nächsten Tour.',
    'At the top of the weather page tap «Home place» or «Next tour»': 'Oben auf der Wetter-Seite «Wohnort» oder «Nächste Tour» antippen',
    'Another place stays one search away': 'Ein anderer Ort bleibt eine Suche entfernt',
    'Open Weather (Me › Weather). At the top you see «Home place».': 'Öffne Wetter (Ich › Wetter). Oben siehst du «Wohnort».',
    'With a planned tour that has a place or a route, «Next tour: …» is there too: tap it, the weather changes to that place.': 'Bei einer geplanten Tour mit Ort oder Route gibt es auch «Nächste Tour: …»: antippen, und das Wetter wechselt zu diesem Ort.',
  },
};
