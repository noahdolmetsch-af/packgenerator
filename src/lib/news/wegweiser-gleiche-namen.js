// «Wegweiser statt Katalog» PR 22 (Noah 01.11.2026 «1a 2a 3a 4a 5a», plan «freigabe»): one name per function, on the page,
// in the catalogue, the search, the tips and the handbook
export default {
  title: 'One name per function',
  lead: 'What the catalogue calls a function is now what the page shows.',
  points: [
    {
      text: '«Trips compared» and «Language»: the tips and the catalogue use the names of the page',
      go: { href: '#/debrief', steps: [{ sel: '#compare' }], where: 'The section «Trips compared» of the review.' },
    },
    {
      text: '«Log km» in New, in the search and in the handbook',
      go: null,
    },
  ],
  small: [{ box: 'new', text: 'The tennis page is called «Tennis» in the catalogue, like its title', go: 'f.tennistop' }],
  test: [
    'Open the catalogue and search «Touren im Vergleich»: it opens the review at that section.',
    'Tap «Neu»: the line for the counter is called «km eintragen», and so is its window.',
  ],
  since: [],
  de: {
    'One name per function': 'Ein Name pro Funktion',
    'What the catalogue calls a function is now what the page shows.': 'Wie der Katalog eine Funktion nennt, so heisst sie jetzt auch auf der Seite.',
    '«Trips compared» and «Language»: the tips and the catalogue use the names of the page': '«Touren im Vergleich» und «Sprache»: Tipps und Katalog nutzen die Namen der Seite',
    'The section «Trips compared» of the review.': 'Der Abschnitt «Touren im Vergleich» im Rückblick.',
    '«Log km» in New, in the search and in the handbook': '«km eintragen» in Neu, in der Suche und im Handbuch',
    'The tennis page is called «Tennis» in the catalogue, like its title': 'Die Tennis-Seite heisst im Katalog «Tennis», wie ihr Titel',
    'Open the catalogue and search «Touren im Vergleich»: it opens the review at that section.': 'Öffne den Katalog und suche «Touren im Vergleich»: er öffnet den Rückblick bei diesem Abschnitt.',
    'Tap «Neu»: the line for the counter is called «km eintragen», and so is its window.': 'Tippe «Neu»: die Zeile für den Zähler heisst «km eintragen», ihr Fenster auch.',
  },
};
