// «Licht» (Noah 02.11.2026, Vorschlag 4): does the bike lamp last through the dark part of the ride
export default {
  title: 'Does your lamp last?',
  lead: 'The live map counts the dark hours still ahead and tells you whether your bike lamp lasts through them.',
  points: [{ text: 'New card «Light» in the stops: until when your lamp burns and how long you ride in the dark, with a warning when it will not last', href: '#/live', go: 'f.live' }],
  small: [{ box: 'new', text: 'Tell it what is left in your lamp; how long it burns on a full charge is yours to change' }],
  test: ['Start the live map with a route and open the stops: the card «Light» says whether your lamp lasts or that no darkness is ahead.', 'Tap «Almost empty»: the sentence changes. Open «Change lamp» and set the hours your lamp burns.'],
  since: [],
  de: {
    'Does your lamp last?': 'Reicht dein Licht?',
    'The live map counts the dark hours still ahead and tells you whether your bike lamp lasts through them.': 'Die Live-Karte zählt die dunklen Stunden, die noch vor dir liegen, und sagt, ob dein Velolicht dafür reicht.',
    'New card «Light» in the stops: until when your lamp burns and how long you ride in the dark, with a warning when it will not last': 'Neue Karte «Licht» bei den Stopps: bis wann dein Licht brennt und wie lange du im Dunkeln fährst, mit Warnung, wenn es nicht reicht',
    'Tell it what is left in your lamp; how long it burns on a full charge is yours to change': 'Sag, wie viel noch im Licht ist; wie lange es mit voller Ladung brennt, änderst du selbst',
    'Start the live map with a route and open the stops: the card «Light» says whether your lamp lasts or that no darkness is ahead.': 'Live-Karte mit Strecke starten und die Stopps öffnen: Die Karte «Licht» sagt, ob dein Licht reicht oder dass es nicht dunkel wird.',
    'Tap «Almost empty»: the sentence changes. Open «Change lamp» and set the hours your lamp burns.': '«Fast leer» antippen: Der Satz ändert sich. «Licht ändern» öffnen und die Brenndauer einstellen.',
  },
};
