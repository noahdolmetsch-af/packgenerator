// «UI-Test Flow» Fund 8 (Noah «c»): under «Heute abhaken» one help line instead of two that said nearly the same
export default {
  title: 'One help line under «Tick off today»',
  lead: 'Under the tiles of «Tick off today» one line now says what a tap, a long press and Meditation do. Before there were two lines.',
  points: [{ text: 'One line: tap ticks, long press or ••• opens duration, place, stopwatch, Meditation starts or ticks', go: { href: '#/flow', steps: [{ sel: 'main [data-tick-help]' }], where: 'Aktiv › Heute › «Heute abhaken».' } }],
  small: [],
  test: ['Open Aktiv › Heute and look under the tiles of «Heute abhaken».', 'One help line also names Meditation; there is no second line below it.'],
  since: [],
  de: {
    'One help line under «Tick off today»': 'Eine Hilfezeile unter «Heute abhaken»',
    'Under the tiles of «Tick off today» one line now says what a tap, a long press and Meditation do. Before there were two lines.': 'Unter den Kacheln von «Heute abhaken» sagt jetzt eine Zeile, was Tippen, langes Drücken und Meditation tun. Vorher waren es zwei Zeilen.',
    'One line: tap ticks, long press or ••• opens duration, place, stopwatch, Meditation starts or ticks': 'Eine Zeile: Tippen hakt ab, langes Drücken oder ••• öffnet Dauer, Ort, Stoppuhr, Meditation startet oder hakt ab',
    'Aktiv › Heute › «Heute abhaken».': 'Aktiv › Heute › «Heute abhaken».',
    'Open Aktiv › Heute and look under the tiles of «Heute abhaken».': 'Öffne Aktiv › Heute und schau unter die Kacheln von «Heute abhaken».',
    'One help line also names Meditation; there is no second line below it.': 'Eine Hilfezeile nennt auch Meditation; darunter steht keine zweite Zeile.',
  },
};
