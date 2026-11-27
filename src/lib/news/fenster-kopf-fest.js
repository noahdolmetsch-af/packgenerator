// «Fenster: Kopf und Fuss bündig» (Noah 27.11.2026 «1, 2, 3, 4», Punkt 3, Thread «Lieblingsinhalte besser sichtbar machen»)
export default {
  title: 'Windows keep head and foot flush',
  lead: 'In a long window, the next row no longer peeks out above the title while you scroll.',
  points: [
    { text: 'Open «All» under your favourites on Today and scroll: the title and «Done» stay clean at the edges', go: { href: '#/', steps: [{ sel: '[data-pins-all]' }, { sel: '[data-fav-all]' }] } },
  ],
  small: [{ box: 'fixed', text: 'Same for every window with a fixed head and foot' }],
  test: ['Open Today, tap «All» in the favourites and scroll to the bottom.', 'The title stays at the very top edge, «Done» at the bottom edge, nothing shows above or below them.'],
  since: [],
  de: {
    'Windows keep head and foot flush': 'Fenster: Kopf und Fuss bündig',
    'In a long window, the next row no longer peeks out above the title while you scroll.': 'In einem langen Fenster blitzt beim Scrollen die nächste Zeile nicht mehr über dem Titel auf.',
    'Open «All» under your favourites on Today and scroll: the title and «Done» stay clean at the edges': 'Öffne «Alle» bei deinen Favoriten auf Heute und scrolle: Titel und «Fertig» bleiben sauber am Rand',
    'Same for every window with a fixed head and foot': 'Gilt für jedes Fenster mit festem Kopf und Fuss',
    'Open Today, tap «All» in the favourites and scroll to the bottom.': 'Öffne Heute, tippe bei den Favoriten auf «Alle» und scrolle ganz nach unten.',
    'The title stays at the very top edge, «Done» at the bottom edge, nothing shows above or below them.': 'Der Titel bleibt ganz am oberen Rand, «Fertig» am unteren Rand, darüber und darunter ist nichts zu sehen.',
  },
};
