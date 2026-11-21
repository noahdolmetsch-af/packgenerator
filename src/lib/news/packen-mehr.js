// «Packen: Mehr zu dieser Tour» (Noah 07.11.2026 «1a 2a 3a 4b 5a», Vereinfachen ohne Verlust, Schritt 2): the packing list first, the rest in five closed groups
export default {
  title: 'Packing: the list first',
  lead: 'Under the packing list, five closed groups hold everything else a trip can have. Nothing is gone.',
  points: [{ text: 'Tap «More about this trip» under the list: weather, before, with others, easier, learn', go: { href: '#/pack', steps: [{ sel: '[data-pack-more]' }], where: 'Pack, under the packing list.' } }],
  small: [{ box: 'new', text: 'A group opens by itself when a link leads into it, for example the shopping list' }],
  test: [
    'Open Pack with a trip: the packing list comes first, below it «More about this trip» shows five closed groups.',
    'Open «Before and the evening before»: bike care, charging, papers, check-in and the shopping list are there.',
    'Search for «Plan B» or «Packing for two»: the search still finds them.',
  ],
  since: [],
  de: {
    'Packing: the list first': 'Packen: zuerst die Liste',
    'Under the packing list, five closed groups hold everything else a trip can have. Nothing is gone.': 'Unter der Packliste liegen fünf geschlossene Gruppen mit allem anderen, was eine Tour haben kann. Nichts ist weg.',
    'Tap «More about this trip» under the list: weather, before, with others, easier, learn': 'Öffne unter der Liste «Mehr zu dieser Tour»: Wetter, Vorher, mit anderen, leichter, lernen',
    'Pack, under the packing list.': 'Packen, unter der Packliste.',
    'A group opens by itself when a link leads into it, for example the shopping list': 'Eine Gruppe öffnet sich von selbst, wenn ein Link in sie führt, zum Beispiel die Einkaufsliste',
    'Open Pack with a trip: the packing list comes first, below it «More about this trip» shows five closed groups.': 'Öffne Packen mit einer Tour: zuerst die Packliste, darunter zeigt «Mehr zu dieser Tour» fünf geschlossene Gruppen.',
    'Open «Before and the evening before»: bike care, charging, papers, check-in and the shopping list are there.': 'Öffne «Vorher und am Abend»: Velopflege, Laden, Papiere, Check-in und die Einkaufsliste sind da.',
    'Search for «Plan B» or «Packing for two»: the search still finds them.': 'Suche nach «Plan B» oder «Zu zweit packen»: Die Suche findet sie weiterhin.',
  },
};
