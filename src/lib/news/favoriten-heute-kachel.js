// «Favoriten auf Heute» (Noah 27.11.2026 «1-5a», Thread «Lieblingsinhalte besser sichtbar machen»): Schritt 2
export default {
  title: 'Your favourites on Today',
  lead: 'Your favourites stand right under the greeting, as cards.',
  points: [
    { text: 'The first six favourites are cards on top of Today; «All» opens the rest, by group', go: { href: '#/', steps: [{ sel: '[data-pins-all]' }, { sel: '[data-fav-all]' }] } },
    { text: 'Pages you open often are suggested quietly under the cards; the star keeps one', go: { href: '#/', where: 'Shows under the favourites once you opened a page on three days in two weeks.' } },
  ],
  small: [{ box: 'new', text: 'Groups of favourites can be renamed and deleted in the window «All»' }],
  test: ['Open Today: the favourites stand on top, before «Tick off».', 'Tap «All» and rename a group, then tap «Done».'],
  since: [],
  de: {
    'Your favourites on Today': 'Deine Favoriten auf Heute',
    'Your favourites stand right under the greeting, as cards.': 'Deine Favoriten stehen gleich unter dem Gruss, als Karten.',
    'The first six favourites are cards on top of Today; «All» opens the rest, by group': 'Die ersten sechs Favoriten sind Karten ganz oben auf Heute; «Alle» öffnet den Rest, nach Gruppen',
    'Pages you open often are suggested quietly under the cards; the star keeps one': 'Seiten, die du oft öffnest, werden leise unter den Karten vorgeschlagen; der Stern merkt eine',
    'Shows under the favourites once you opened a page on three days in two weeks.': 'Erscheint unter den Favoriten, sobald du eine Seite an drei Tagen in zwei Wochen geöffnet hast.',
    'Groups of favourites can be renamed and deleted in the window «All»': 'Gruppen von Favoriten lassen sich im Fenster «Alle» umbenennen und löschen',
    'Open Today: the favourites stand on top, before «Tick off».': 'Öffne Heute: die Favoriten stehen oben, vor «Abhaken».',
    'Tap «All» and rename a group, then tap «Done».': 'Tippe auf «Alle», benenne eine Gruppe um und tippe auf «Fertig».',
  },
};
