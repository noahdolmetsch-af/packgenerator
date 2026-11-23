// «Tourenvorschläge: 200 Touren und Karte» (Noah 23.11.2026 «alles umsetzen mit 100 strecken … nur schwere touren was kondition angeht», «1a 2b 3a 4a 5a», «die karte unbedingt 1:1 so übernehmen», «100 weitere routen»)
export default {
  title: 'Tour suggestions: 200 tours and a map',
  lead: 'The suggestions now have 200 mountain bike tours from the official network, hard for fitness first, and a map of Switzerland.',
  points: [
    { text: 'A map of Switzerland shows every tour of the list as a dot with its line; tap a dot to open the tour, tap a canton to show only its tours', go: { href: '#/trips/vorschlaege', steps: [{ sel: '[data-vs-view="map"]' }], where: 'Trips › Dreams › Tour suggestions, «Map» above the tours.' } },
    { text: 'The nearest tours come first; fitness «Difficult» is on at the start, the skill level is shown and can be filtered', go: { href: '#/trips/vorschlaege', steps: [{ sel: '[data-vs-cond-group]' }] } },
    { text: 'Filter by canton: every canton with official routes has tours', go: { href: '#/trips/vorschlaege', steps: [{ sel: '[data-vs-region="sg"]' }] } },
  ],
  small: [{ box: 'new', text: 'Switch between «List» and «Map» above the tours', go: { href: '#/trips/vorschlaege', steps: [{ sel: '[data-vs-view="list"]' }] } }],
  test: ['Open Trips › Dreams › Tour suggestions and tap «Map»: the cantons, the dots and the lines show, with the number of tours in each canton.', 'Tap a canton (for example SG): only its tours stay on the map and in the list; tap it again to show all.', 'Tap a dot: the tour opens with its profile and «Why this suggestion?».', 'Switch «Medium» on under Fitness: more tours appear, the strongest of cantons without a hard tour among them.'],
  since: [],
  de: {
    'Tour suggestions: 200 tours and a map': 'Tourenvorschläge: 200 Touren und eine Karte',
    'The suggestions now have 200 mountain bike tours from the official network, hard for fitness first, and a map of Switzerland.': 'Die Vorschläge haben jetzt 200 Mountainbike-Touren aus dem offiziellen Netz, zuerst die mit schwerer Kondition, und eine Karte der Schweiz.',
    'A map of Switzerland shows every tour of the list as a dot with its line; tap a dot to open the tour, tap a canton to show only its tours': 'Eine Karte der Schweiz zeigt jede Tour der Liste als Punkt mit ihrer Linie; tippe auf einen Punkt, um die Tour zu öffnen, auf einen Kanton, um nur seine Touren zu zeigen',
    'Trips › Dreams › Tour suggestions, «Map» above the tours.': 'Touren › Träume › Tourenvorschläge, «Karte» über den Touren.',
    'The nearest tours come first; fitness «Difficult» is on at the start, the skill level is shown and can be filtered': 'Die nächsten Touren kommen zuerst; die Kondition «Schwierig» ist am Anfang an, die Technik wird angezeigt und lässt sich filtern',
    'Filter by canton: every canton with official routes has tours': 'Filtere nach Kanton: jeder Kanton mit offiziellen Routen hat Touren',
    'Switch between «List» and «Map» above the tours': 'Wechsle über den Touren zwischen «Liste» und «Karte»',
    'Open Trips › Dreams › Tour suggestions and tap «Map»: the cantons, the dots and the lines show, with the number of tours in each canton.': 'Öffne Touren › Träume › Tourenvorschläge und tippe «Karte»: die Kantone, die Punkte und die Linien erscheinen, mit der Zahl der Touren je Kanton.',
    'Tap a canton (for example SG): only its tours stay on the map and in the list; tap it again to show all.': 'Tippe auf einen Kanton (zum Beispiel SG): nur seine Touren bleiben auf der Karte und in der Liste; tippe nochmals, um alle zu zeigen.',
    'Tap a dot: the tour opens with its profile and «Why this suggestion?».': 'Tippe auf einen Punkt: die Tour öffnet sich mit Profil und «Warum dieser Vorschlag?».',
    'Switch «Medium» on under Fitness: more tours appear, the strongest of cantons without a hard tour among them.': 'Schalte unter Kondition «Mittel» ein: mehr Touren erscheinen, darunter die stärksten der Kantone ohne schwere Tour.',
  },
};
