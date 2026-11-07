// «Packliste aufräumen: lange Namen» (Durchklick Etappe 2, Befund E2-001, Noah 05.11.2026)
export default {
  title: 'Tidy up: long names fit the screen',
  lead: 'On a phone, «Tidy up the packing list» no longer gets wider than the screen when a thing has a long name.',
  points: [{ text: 'Packing list tidy-up: a long name breaks inside its row', go: { href: '#/blocks/aufraeumen', steps: [{ sel: '[data-tidy="std"]' }] } }],
  small: [],
  test: ['Open Building blocks › Tidy up the packing list on a phone: the page does not move sideways, even with a long name in «Always with you».', 'A long name breaks into two lines inside its row; the arrows and the × stay on the right.'],
  since: [],
  de: {
    'Tidy up: long names fit the screen': 'Packliste aufräumen: lange Namen passen auf den Bildschirm',
    'On a phone, «Tidy up the packing list» no longer gets wider than the screen when a thing has a long name.': 'Auf dem Handy wird «Packliste aufräumen» nicht mehr breiter als der Bildschirm, wenn ein Teil einen langen Namen hat.',
    'Packing list tidy-up: a long name breaks inside its row': 'Packliste aufräumen: Ein langer Name bricht innerhalb seiner Zeile um',
    'Open Building blocks › Tidy up the packing list on a phone: the page does not move sideways, even with a long name in «Always with you».': 'Öffne Bausteine › Packliste aufräumen auf dem Handy: Die Seite verschiebt sich nicht seitwärts, auch nicht mit einem langen Namen bei «Immer dabei».',
    'A long name breaks into two lines inside its row; the arrows and the × stay on the right.': 'Ein langer Name bricht in zwei Zeilen um; die Pfeile und das × bleiben rechts.',
  },
};
