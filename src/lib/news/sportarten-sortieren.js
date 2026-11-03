// «Meine Sportarten sortieren» (Noah 02.11.2026 «1a»): one grip, arrows only with «Sort», Undo, the page scrolls along
export default {
  title: 'Sort your sports more easily',
  lead: 'One grip to drag, arrows only when you want them.',
  points: [
    { text: 'One grip per sport; the arrows appear with «Sort»', go: { href: '#/flow/sports', steps: [{ sel: '[data-my-sports] [data-sort-grip]' }] } },
    { text: 'After moving, «Undo» brings the old order back', go: { href: '#/flow/sports', steps: [{ sel: '[data-my-sports] [data-sort-grip]' }] } },
  ],
  small: [{ box: 'nicer', text: 'A long list scrolls along while you drag near the edge', go: null }],
  test: [
    'Open Aktiv › Meine Sportarten: each sport has one grip on the right, no arrow buttons.',
    'Drag a sport by its grip to another place; at the bottom tap «Undo».',
    'Tap «Sort» above the list: arrows appear next to the grips.',
  ],
  since: [],
  de: {
    'Sort your sports more easily': 'Sportarten leichter sortieren',
    'One grip to drag, arrows only when you want them.': 'Ein Griff zum Ziehen, Pfeile nur wenn du sie willst.',
    'One grip per sport; the arrows appear with «Sort»': 'Ein Griff pro Sportart; die Pfeile erscheinen mit «Sortieren»',
    'After moving, «Undo» brings the old order back': 'Nach dem Verschieben bringt «Rückgängig» die alte Reihenfolge zurück',
    'A long list scrolls along while you drag near the edge': 'Eine lange Liste scrollt mit, wenn du am Rand ziehst',
    'Open Aktiv › Meine Sportarten: each sport has one grip on the right, no arrow buttons.': 'Öffne Aktiv › Meine Sportarten: jede Sportart hat rechts einen Griff, keine Pfeilknöpfe.',
    'Drag a sport by its grip to another place; at the bottom tap «Undo».': 'Ziehe eine Sportart am Griff an einen anderen Platz; unten tippst du auf «Rückgängig».',
    'Tap «Sort» above the list: arrows appear next to the grips.': 'Tippe über der Liste auf «Sortieren»: neben den Griffen erscheinen Pfeile.',
  },
};
