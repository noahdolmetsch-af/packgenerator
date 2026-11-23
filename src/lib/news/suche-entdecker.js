// «Suche als Entdecker» (Noah 23.11.2026 «1-5a», V4): die leere Suche zeigt, was viele suchen; Treffer sagen den Weg
export default {
  title: 'The search shows you the way',
  lead: 'An empty search offers six things many look for, and every result says where it lives.',
  points: [
    { text: 'An empty search first shows six wishes: tick off, packing list, tour suggestions, milestones, bike care, weather', go: { href: '#/', steps: [{ aria: 'Search everything' }], where: 'The search field at the top; on a phone the magnifying glass.' } },
    { text: 'Results say the way, for example Analysis › Rides for the milestones', go: { href: '#/', steps: [{ aria: 'Search everything' }], where: 'Search › type «milestones».' } },
  ],
  small: [{ box: 'new', text: 'The commands to try stand behind «Show commands»; under results a line leads to the map of the app' }],
  test: ['Tap the search: six wishes stand first.', 'Tap «Milestones»: the result says Analysis › Rides.', 'Tap «Show commands»: the three commands appear.'],
  since: [],
  de: {
    'The search shows you the way': 'Die Suche zeigt dir den Weg',
    'An empty search offers six things many look for, and every result says where it lives.': 'Die leere Suche bietet sechs Dinge an, die viele suchen, und jeder Treffer sagt, wo er liegt.',
    'An empty search first shows six wishes: tick off, packing list, tour suggestions, milestones, bike care, weather': 'Die leere Suche zeigt zuerst sechs Wünsche: Abhaken, Packliste, Tourenvorschläge, Meilensteine, Velopflege, Wetter',
    'The search field at the top; on a phone the magnifying glass.': 'Das Suchfeld oben; am Handy die Lupe.',
    'Results say the way, for example Analysis › Rides for the milestones': 'Treffer sagen den Weg, zum Beispiel Auswerten › Fahrten für die Meilensteine',
    'Search › type «milestones».': 'Suche › «Meilensteine» tippen.',
    'The commands to try stand behind «Show commands»; under results a line leads to the map of the app': 'Die Befehle zum Ausprobieren stehen hinter «Befehle zeigen»; unter den Treffern führt eine Zeile zur Karte der App',
    'Tap the search: six wishes stand first.': 'Tippe auf die Suche: sechs Wünsche stehen zuerst.',
    'Tap «Milestones»: the result says Analysis › Rides.': 'Tippe auf «Meilensteine»: der Treffer sagt Auswerten › Fahrten.',
    'Tap «Show commands»: the three commands appear.': 'Tippe auf «Befehle zeigen»: die drei Befehle erscheinen.',
  },
};
