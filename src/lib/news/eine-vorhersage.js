// UI-Test 26.10.2026 T8 «Wetter und Tipps aus einer Vorhersage» (G1-06, G2-06): on a trip day the «Fits today» tips follow the trip weather shown on Pack and Ride (pageinfo.js tripWxOn); tiles that ask for the home weather at the same time share one answer (home-weather.js); «Your values today» says «weather not loaded right now» when a home place is set
export default {
  title: 'One forecast',
  lead: 'Weather and tips now come from the same forecast.',
  points: [{ text: 'On a trip day the «Fits today» tips follow the weather of the trip', href: '#/pack', go: 'f.pagetips' }],
  small: [{ box: 'fixed', text: '«Your values today» no longer asks for a home place you already entered', go: null }],
  test: ['Open the tour of today in Pack: when it says «dry» at the weather, no tip says «Rain is forecast».', 'Today, «Your values today»: the weather shows the same °C as «You today».'],
  since: [],
  de: {
    'One forecast': 'Eine Vorhersage',
    'Weather and tips now come from the same forecast.': 'Wetter und Tipps kommen jetzt aus derselben Vorhersage.',
    'On a trip day the «Fits today» tips follow the weather of the trip': 'Am Tag einer Tour richten sich die Tipps «Passt zu heute» nach dem Wetter der Tour',
    '«Your values today» no longer asks for a home place you already entered': '«Deine Werte heute» fragt nicht mehr nach einem Wohnort, den du schon eingetragen hast',
    'Open the tour of today in Pack: when it says «dry» at the weather, no tip says «Rain is forecast».': 'Öffne die Tour von heute in Packen: Steht beim Wetter «trocken», sagt kein Tipp «Regen ist angesagt».',
    'Today, «Your values today»: the weather shows the same °C as «You today».': 'Heute, «Deine Werte heute»: Das Wetter zeigt dieselben °C wie «Du heute».',
  },
};
