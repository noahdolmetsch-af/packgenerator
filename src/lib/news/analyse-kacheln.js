// «Analyse: Kacheln» (Noah 03.11.2026 «4a»): groups closed, each tile says more or less than before
export default {
  title: 'Analysis tiles: closed groups',
  lead: 'In «All values» the groups are closed, and each tile says whether it is more or less than before.',
  points: [{ text: 'Open a group such as Heart or Sleep; a tile shows e.g. «▲ 2 bpm more than before»', go: { href: '#/auswerten/analyse', steps: [{ sel: '[data-tab="werte"]' }, { sel: '[data-groups-toggle]' }], where: 'Auswerten › Analyse › All values.' } }],
  small: [{ box: 'new', text: 'The small lines in the tiles are taller' }],
  test: ['Open Auswerten › Analyse › All values: the groups are closed.', 'Tap «Open all groups»: the tiles show, some with «more than before» or «less than before».'],
  since: [],
  de: {
    'Analysis tiles: closed groups': 'Analyse-Kacheln: Gruppen zu',
    'In «All values» the groups are closed, and each tile says whether it is more or less than before.': 'In «Alle Werte» sind die Gruppen zu, und jede Kachel sagt, ob es mehr oder weniger ist als davor.',
    'Open a group such as Heart or Sleep; a tile shows e.g. «▲ 2 bpm more than before»': 'Öffne eine Gruppe wie Herz oder Schlaf; eine Kachel zeigt z. B. «▲ 2 bpm mehr als davor»',
    'Auswerten › Analyse › All values.': 'Auswerten › Analyse › Alle Werte.',
    'The small lines in the tiles are taller': 'Die kleinen Linien in den Kacheln sind höher',
    'Open Auswerten › Analyse › All values: the groups are closed.': 'Öffne Auswerten › Analyse › Alle Werte: die Gruppen sind zu.',
    'Tap «Open all groups»: the tiles show, some with «more than before» or «less than before».': 'Tippe auf «Alle Gruppen öffnen»: die Kacheln erscheinen, manche mit «mehr als davor» oder «weniger als davor».',
  },
};
