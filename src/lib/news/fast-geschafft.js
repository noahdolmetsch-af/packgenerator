// «Meilensteine aktiver machen» PR 4 (Noah 01.11.2026 «4a»): after a tick, a line when the next star is close
export default {
  title: 'Almost there',
  lead: 'After a tick a line tells you when the next star is close: «Only 1× to star 5»',
  points: [{ text: 'Under «ticked» a line shows how far the next star still is when it is close', go: { href: '#/', steps: [{ sel: '[data-section="acts"]' }], where: 'Appears under the message after a tick when a star is nearly reached.' } }],
  test: ['Tick a sport that is one tick before a star: under «ticked» it says «Only 1× to star …».', 'Tick a sport that is far from any star: no extra line.'],
  since: [],
  de: {
    'Almost there': 'Fast geschafft',
    'After a tick a line tells you when the next star is close: «Only 1× to star 5»': 'Nach dem Abhaken sagt eine Zeile, wenn der nächste Stern nah ist: «Noch 1× bis Stern 5»',
    'Under «ticked» a line shows how far the next star still is when it is close': 'Unter «abgehakt» steht, wie weit der nächste Stern noch ist, wenn er nah ist',
    'Appears under the message after a tick when a star is nearly reached.': 'Erscheint unter der Meldung nach einem Haken, wenn ein Stern fast erreicht ist.',
    'Tick a sport that is one tick before a star: under «ticked» it says «Only 1× to star …».': 'Hake eine Sportart ab, der noch ein Haken zum Stern fehlt: unter «abgehakt» steht «Noch 1× bis Stern …».',
    'Tick a sport that is far from any star: no extra line.': 'Hake eine Sportart ab, die weit von jedem Stern ist: keine Zusatzzeile.',
  },
};
