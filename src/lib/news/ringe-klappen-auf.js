// «Ringe klappen auf» (Noah 07.11.2026 «2a» des Entwurfs «Wege besser sichtbar»): a ring with several sports shows them, each a way
export default {
  title: 'Rings open up into their sports',
  lead: 'A ring that counts several sports opens a list of them, each one leads to its value in Analyse.',
  points: [{ text: 'Tap «Move» or «Recovery» under Rings: the sports of the ring appear, each with its own stand and a way to Analyse', go: { href: '#/flow', steps: [{ sel: '[data-ring-fold]' }], where: 'Aktiv › Rings.' } }],
  small: [],
  test: ['Open Aktiv and tap «Move» under «Rings»: the sports of the ring appear with «2 of 4» and so on.', 'Tap one: its value opens in Analyse. Tap «Move» again: the list closes.'],
  since: [],
  de: {
    'Rings open up into their sports': 'Ringe klappen in ihre Sportarten auf',
    'A ring that counts several sports opens a list of them, each one leads to its value in Analyse.': 'Ein Ring, der mehrere Sportarten zählt, klappt eine Liste davon auf, jede führt zu ihrem Wert in der Analyse.',
    'Tap «Move» or «Recovery» under Rings: the sports of the ring appear, each with its own stand and a way to Analyse': 'Tippe unter «Ringe» auf «Bewegen» oder «Erholung»: die Sportarten des Rings erscheinen, jede mit eigenem Stand und einem Weg in die Analyse',
    'Aktiv › Rings.': 'Aktiv › Ringe.',
    'Open Aktiv and tap «Move» under «Rings»: the sports of the ring appear with «2 of 4» and so on.': 'Öffne Aktiv und tippe unter «Ringe» auf «Bewegen»: die Sportarten des Rings erscheinen mit «2 von 4» und so weiter.',
    'Tap one: its value opens in Analyse. Tap «Move» again: the list closes.': 'Tippe auf eine: ihr Wert öffnet sich in der Analyse. Tippe nochmals auf «Bewegen»: die Liste schliesst sich.',
  },
};
