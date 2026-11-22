// Noah 22.11.2026 «Freie Zeit 3b» (Thread «App-Landkarte»): a trip with a night outdoors points to «First night» while packing
export default {
  title: 'First night, right where you pack',
  lead: 'When a trip has a night outdoors, packing now points to «First night».',
  points: [{ text: 'On a trip with a night outdoors, «Fits here» under «Before and the evening before» leads to «First night»', go: { href: '#/pack', where: 'Pack › More about this trip › Before and the evening before.' } }],
  small: [],
  test: ['Open a trip with a night outdoors (Bivouac or Bivouac + tent) in Pack, open «Before and the evening before»: «Fits here» shows «First night» and «Good night».', 'Tap «First night»: the guided first night opens. A trip without a night outdoors shows no such row.'],
  since: [],
  de: {
    'First night, right where you pack': 'Erste Nacht, gleich beim Packen',
    'When a trip has a night outdoors, packing now points to «First night».': 'Wenn eine Tour eine Nacht draussen hat, zeigt das Packen jetzt auf «Erste Nacht».',
    'On a trip with a night outdoors, «Fits here» under «Before and the evening before» leads to «First night»': 'Bei einer Tour mit einer Nacht draussen führt «Passt hier» unter «Vorher und am Abend» zu «Erste Nacht»',
    'Pack › More about this trip › Before and the evening before.': 'Packen › Mehr zu dieser Tour › Vorher und am Abend.',
    'Open a trip with a night outdoors (Bivouac or Bivouac + tent) in Pack, open «Before and the evening before»: «Fits here» shows «First night» and «Good night».': 'Öffne beim Packen eine Tour mit einer Nacht draussen (Biwak oder Biwak + Zelt) und klappe «Vorher und am Abend» auf: «Passt hier» zeigt «Erste Nacht» und «Gute Nacht».',
    'Tap «First night»: the guided first night opens. A trip without a night outdoors shows no such row.': 'Tippe auf «Erste Nacht»: die geführte erste Nacht öffnet sich. Eine Tour ohne Nacht draussen zeigt diese Zeile nicht.',
  },
};
