// «Träume und Neuland» N10 (Noah 27.10.2026 «1-5 a»): Neuland, Gipfelbuch und «Neuland des Jahres» lesen aus einer Liste
export default {
  title: 'One find list',
  lead: 'New ground, the summit book and «Neuland of the year» now read from one list, so nothing is ticked twice.',
  points: [
    { text: 'A summit or pass in the summit book ticks it in New ground: «from your summit book»', href: '#/neuland' },
    { text: '«Neuland» of the year shows what New ground and the summit book found first this year, each once', href: '#/me/wohl' },
  ],
  small: [{ box: 'new', text: 'Your own entries stay first; the same name never shows twice' }],
  test: [
    'Enter a summit with a place in the summit book; open New ground › Peaks: it is ticked «from your summit book».',
    'Open Me › What is good for me: under «Neuland» it shows once.',
  ],
  since: ['f.findlist'],
  de: {
    'New ground, the summit book and «Neuland of the year» now read from one list, so nothing is ticked twice.': 'Neuland, Gipfelbuch und «Neuland des Jahres» lesen jetzt aus einer Liste, damit nichts doppelt abgehakt wird.',
    'A summit or pass in the summit book ticks it in New ground: «from your summit book»': 'Ein Gipfel oder Pass im Gipfelbuch hakt ihn in Neuland ab: «aus deinem Gipfelbuch»',
    '«Neuland» of the year shows what New ground and the summit book found first this year, each once': '«Neuland» des Jahres zeigt, was Neuland und Gipfelbuch dieses Jahr zum ersten Mal fanden, jedes einmal',
    'Your own entries stay first; the same name never shows twice': 'Deine eigenen Einträge bleiben zuerst; derselbe Name kommt nie zweimal',
    'Enter a summit with a place in the summit book; open New ground › Peaks: it is ticked «from your summit book».': 'Trag einen Gipfel mit Ort ins Gipfelbuch ein; öffne Neuland › Gipfel: er ist abgehakt «aus deinem Gipfelbuch».',
    'Open Me › What is good for me: under «Neuland» it shows once.': 'Öffne Auswerten › Was mir gut tut: unter «Neuland» steht er einmal.',
  },
};
