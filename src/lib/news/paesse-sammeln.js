// «Pässe sammeln» (Noah 03.11.2026 «E und F», Paket E, Idee 24): the passes you rode over as yellow signs
export default {
  title: 'Collect passes',
  lead: 'The passes you rode over, as yellow signs with height and day.',
  points: [{ text: 'Trips › Look back › Passes: rides suggest the passes they crossed, you collect the signs and can add your own', go: 'f.passes' }],
  small: [{ box: 'new', go: 'f.passes', text: 'Each sign can be changed and removed; nothing is collected without your tap' }],
  test: [
    'Open Trips › Look back › Passes.',
    'Tap «Collect» at a suggested pass, or «Add a pass» for one of your own.',
    'The yellow sign with name, height and day is in your collection.',
  ],
  since: ['f.passes'],
  de: {
    'Collect passes': 'Pässe sammeln',
    'The passes you rode over, as yellow signs with height and day.': 'Die Pässe, über die du gefahren bist, als gelbe Schilder mit Höhe und Tag.',
    'Trips › Look back › Passes: rides suggest the passes they crossed, you collect the signs and can add your own': 'Touren › Rückblick › Pässe: Fahrten schlagen die Pässe vor, über die sie gingen; du sammelst die Schilder und kannst eigene hinzufügen',
    'Each sign can be changed and removed; nothing is collected without your tap': 'Jedes Schild lässt sich ändern und entfernen; ohne dein Tippen kommt nichts hinein',
  },
};
