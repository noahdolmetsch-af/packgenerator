// «Rennen-Liste auf Deutsch» (Durchklick Etappe 3, E3-001): the first group on Touren › Rennen had an English title
export default {
  title: 'Race list in German',
  lead: 'On Touren › Races the group of coming races has a German title now.',
  points: [{ text: 'The group «Coming» on the race list is called «Kommende» in the German app', go: { href: '#/race', where: 'Trips › Races, the first box under the buttons.' } }],
  small: [],
  test: ['Open Trips › Races with a coming race on the list.', 'The first box is called «Kommende», not «Coming».'],
  since: [],
  de: {
    'Race list in German': 'Rennen-Liste auf Deutsch',
    'On Touren › Races the group of coming races has a German title now.': 'Auf Touren › Rennen hat die Gruppe der kommenden Rennen jetzt einen deutschen Titel.',
    'The group «Coming» on the race list is called «Kommende» in the German app': 'Die Gruppe «Coming» auf der Rennen-Liste heisst in der deutschen App «Kommende»',
    'Trips › Races, the first box under the buttons.': 'Touren › Rennen, das erste Feld unter den Knöpfen.',
    'Open Trips › Races with a coming race on the list.': 'Öffne Touren › Rennen mit einem kommenden Rennen in der Liste.',
    'The first box is called «Kommende», not «Coming».': 'Das erste Feld heisst «Kommende», nicht «Coming».',
  },
};
