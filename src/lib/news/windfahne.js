// «Windfahne beim Wetter» (Noah 03.11.2026 «b», Paket D, Idee 15): a small vane shows where the wind blows and how hard
export default {
  title: 'A wind vane in the weather',
  lead: 'A small vane shows where the wind comes from and flutters harder the more wind there is.',
  points: [{ text: 'The wind line shows a vane: the pennant points where the wind blows to', go: { href: '#/wetter', where: 'Shows beside the wind in the weather line on Today, on the weather page and in the weather of a trip.' } }],
  small: [{ box: 'new', text: 'In a calm it hangs short and still; with «Reduce motion» it never flutters' }],
  test: ['Open Weather: beside the wind a small vane points to where the wind blows (wind from the west: pennant to the right).', 'The stronger the forecast wind, the longer the pennant and the faster it flutters.'],
  since: [],
  de: {
    'A wind vane in the weather': 'Eine Windfahne beim Wetter',
    'A small vane shows where the wind comes from and flutters harder the more wind there is.': 'Eine kleine Fahne zeigt, woher der Wind kommt, und flattert stärker, je mehr Wind es hat.',
    'The wind line shows a vane: the pennant points where the wind blows to': 'In der Windzeile steht eine Fahne: Das Fähnchen zeigt, wohin der Wind weht',
    'Shows beside the wind in the weather line on Today, on the weather page and in the weather of a trip.': 'Steht neben dem Wind in der Wetterzeile auf Heute, auf der Wetterseite und im Wetter einer Tour.',
    'In a calm it hangs short and still; with «Reduce motion» it never flutters': 'Bei Windstille hängt sie kurz und still; bei «Bewegung reduzieren» flattert sie nie',
    'Open Weather: beside the wind a small vane points to where the wind blows (wind from the west: pennant to the right).': 'Öffne Wetter: Neben dem Wind zeigt eine kleine Fahne, wohin der Wind weht (Wind aus Westen: Fähnchen nach rechts).',
    'The stronger the forecast wind, the longer the pennant and the faster it flutters.': 'Je stärker der Wind in der Vorhersage, desto länger das Fähnchen und desto schneller flattert es.',
  },
};
