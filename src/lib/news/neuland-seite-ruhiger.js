// «Neuland-Seite verbessern» (Noah 27.11.2026 «1 2 3 4 5 6 7», Paket 2: Punkte 4, 5 und 6; Mouseover «bei mouseover erscheint der name der gemeinde / kanton»)
export default {
  title: 'New ground: a calmer page',
  lead: 'The head of New ground is shorter, the collections sit in one row, and what you have to confirm comes first.',
  points: [
    { text: 'The collections (Cantons to Waterfalls) are one row; the chosen one is on top and the list of finds sits below it', go: { href: '#/neuland', steps: [{ sel: '[data-nl-chips]' }] } },
    { text: '«Maybe ridden: please confirm» stands at the top of the page, whichever collection you look at', go: { href: '#/neuland', steps: [{ sel: '[data-nl-chips]' }] } },
    { text: 'On the computer, the mouse on a place of a map shows its name (canton, municipality, pass)', go: { href: '#/neuland', steps: [{ sel: '.nmap' }] } },
  ],
  small: [{ box: 'nicer', text: 'One short line under the title; «Choose collections» and «Heatmap» are smaller; «How it works» moved to the end of the page' }],
  test: [
    'Open New ground: under the title one line, then «What you can do here» and two small buttons.',
    'The collections are one row; on the phone it scrolls sideways and fades out at the edge.',
    'Choose «Alpine passes»: its map and list come first, the list of finds is below.',
    'On the computer, rest the mouse on a canton of the map: its name appears next to the mouse.',
  ],
  since: [],
  de: {
    'New ground: a calmer page': 'Neuland: eine ruhigere Seite',
    'The head of New ground is shorter, the collections sit in one row, and what you have to confirm comes first.': 'Der Kopf von Neuland ist kürzer, die Sammlungen stehen in einer Zeile, und was du bestätigen sollst, steht zuerst.',
    'The collections (Cantons to Waterfalls) are one row; the chosen one is on top and the list of finds sits below it': 'Die Sammlungen (Kantone bis Wasserfälle) stehen in einer Zeile; die gewählte steht oben und die Fundliste darunter',
    '«Maybe ridden: please confirm» stands at the top of the page, whichever collection you look at': '«Vielleicht gefahren: bitte bestätigen» steht oben auf der Seite, egal welche Sammlung du ansiehst',
    'One short line under the title; «Choose collections» and «Heatmap» are smaller; «How it works» moved to the end of the page': 'Eine kurze Zeile unter dem Titel; «Sammlungen wählen» und «Heatmap» sind kleiner; «So geht\'s» steht jetzt am Seitenende',
    'On the computer, the mouse on a place of a map shows its name (canton, municipality, pass)': 'Am Computer zeigt die Maus auf einem Ort der Karte seinen Namen (Kanton, Gemeinde, Pass)',
    'On the computer, rest the mouse on a canton of the map: its name appears next to the mouse.': 'Am Computer: halte die Maus auf einen Kanton der Karte, neben der Maus erscheint sein Name.',
    'Open New ground: under the title one line, then «What you can do here» and two small buttons.': 'Öffne Neuland: unter dem Titel eine Zeile, dann «Was du hier tun kannst» und zwei kleine Knöpfe.',
    'The collections are one row; on the phone it scrolls sideways and fades out at the edge.': 'Die Sammlungen sind eine Zeile; am Handy scrollt sie seitwärts und blendet am Rand aus.',
    'Choose «Alpine passes»: its map and list come first, the list of finds is below.': 'Wähle «Alpenpässe»: Karte und Liste kommen zuerst, die Fundliste steht darunter.',
  },
};
