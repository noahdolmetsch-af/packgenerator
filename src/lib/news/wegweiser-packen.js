// «Wegweiser statt Katalog» PR 5 «Packen, Planen, Teilen» (Noah 01.11.2026 «1a 2a 3a 4a 5a», Inhalte «1-5a»)
export default {
  title: 'Packing helpers where you pack',
  lead: 'Weight, route, ski tour and sharing now lead to the functions that belong to them.',
  points: [
    {
      text: 'Pack: «Fits here» under the weight (how sure it is, lighter things, bag plan) and under a route without GPX',
      go: { href: '#/pack', steps: [{ sel: '[data-passt-hier="weight"]' }], where: 'Shows on Pack for a bike trip with items.' },
    },
    {
      text: 'A ski tour on Pack leads to its backpack check, the plan and the start check',
      go: { href: '#/pack', steps: [{ sel: '[data-passt-hier="ski"]' }], where: 'Shows on Pack when the trip is a ski tour.' },
    },
  ],
  small: [
    { box: 'new', text: 'The trip menu on Pack has «Preview as the receiver sees it» next to «Share link»', go: 'f.sharepreview' },
    { box: 'new', text: '«Measure a route» has a line «Good to know»', go: 'f.mapmeasure' },
  ],
  test: [
    'Open Pack with a bike trip: under the weight is «Fits here»; without a GPX route it is also under «Route».',
    'Tap «Measure a route»: the map tool opens with «Good to know» at the top.',
    'Open the menu of the trip (⋯): under «Share link» is «Preview as the receiver sees it».',
  ],
  since: [],
  de: {
    'Packing helpers where you pack': 'Pack-Helfer dort, wo du packst',
    'Weight, route, ski tour and sharing now lead to the functions that belong to them.': 'Gewicht, Strecke, Skitour und Teilen führen jetzt zu den Funktionen, die dazugehören.',
    'Pack: «Fits here» under the weight (how sure it is, lighter things, bag plan) and under a route without GPX': 'Packen: «Passt hier» unter dem Gewicht (wie sicher es ist, Leichteres, Taschen-Plan) und unter einer Strecke ohne GPX',
    'Shows on Pack for a bike trip with items.': 'Erscheint unter Packen bei einer Velotour mit Sachen.',
    'A ski tour on Pack leads to its backpack check, the plan and the start check': 'Eine Skitour unter Packen führt zum Rucksack-Check, zum Plan und zum Start-Check',
    'Shows on Pack when the trip is a ski tour.': 'Erscheint unter Packen, wenn die Tour eine Skitour ist.',
    'The trip menu on Pack has «Preview as the receiver sees it» next to «Share link»': 'Das Tour-Menü unter Packen hat neben «Link teilen» die «Vorschau, wie der Empfänger sie sieht»',
    '«Measure a route» has a line «Good to know»': '«Strecke messen» hat eine Zeile «Gut zu wissen»',
    'Open Pack with a bike trip: under the weight is «Fits here»; without a GPX route it is also under «Route».': 'Öffne Packen mit einer Velotour: unter dem Gewicht steht «Passt hier»; ohne GPX-Strecke auch unter «Strecke».',
    'Tap «Measure a route»: the map tool opens with «Good to know» at the top.': 'Tippe auf «Strecke messen»: die Karte öffnet sich mit «Gut zu wissen» oben.',
    'Open the menu of the trip (⋯): under «Share link» is «Preview as the receiver sees it».': 'Öffne das Menü der Tour (⋯): unter «Link teilen» steht «Vorschau, wie der Empfänger sie sieht».',
  },
};
