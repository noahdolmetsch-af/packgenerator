// «Material aufräumen» (Noah 23.11.2026): on top only search, «View» and «+ Item»; the tools in «…»
export default {
  title: 'Gear tidied up',
  lead: 'Gear starts with the search and the list; the views and tools sit in two menus.',
  points: [
    { text: 'On top of Gear only the search, «View», «+ Item» and «…»; the list by category follows right below', go: { href: '#/gear', steps: [{ sel: '[data-gear-views]' }], where: 'Bikes and gear › Gear.' } },
    { text: '«View» holds the views (all, most used, proven, favourites, never used, unweighed), the other lists, your own views and «Sort and filter»', go: { href: '#/gear', steps: [{ sel: '[data-gear-views] summary' }], where: 'Bikes and gear › Gear, «View».' } },
    { text: 'The tools (weigh items, change several, lighter alternatives, power values, import, bar code, convert units) are in «…»', go: { href: '#/gear', steps: [{ sel: 'details.gmore:not(.vmenu) summary' }, { sel: '[data-gear-quick-item="weigh"]' }], where: 'Bikes and gear › Gear, «…».' } },
  ],
  small: [
    { box: 'nicer', text: 'The strip «Belongs to» and the row «On this page» are gone from Gear; the column of views on the right is the menu «View»' },
  ],
  test: [
    'Open «Gear»: on top only the search, «View», «+ Item» and «…»; the list follows right below.',
    'Tap «View», choose «Favourites»: the list shows only favourites; «Show all» brings the rest back.',
    'Tap «…»: «Weigh items» and «Change several» are there.',
  ],
  since: [],
  de: {
    'Gear tidied up': 'Material aufgeräumt',
    'Gear starts with the search and the list; the views and tools sit in two menus.': 'Material beginnt mit der Suche und der Liste; die Ansichten und Werkzeuge stehen in zwei Menüs.',
    'On top of Gear only the search, «View», «+ Item» and «…»; the list by category follows right below': 'Oben auf Material nur die Suche, «Ansicht», «+ Teil» und «…»; die Liste nach Kategorie folgt gleich darunter',
    'Bikes and gear › Gear.': 'Velos und Material › Material.',
    '«View» holds the views (all, most used, proven, favourites, never used, unweighed), the other lists, your own views and «Sort and filter»': '«Ansicht» hat die Ansichten (alle, meist genutzt, bewährt, Favoriten, nie gebraucht, ungewogen), die anderen Listen, deine eigenen Ansichten und «Sortieren und filtern»',
    'Bikes and gear › Gear, «View».': 'Velos und Material › Material, «Ansicht».',
    'The tools (weigh items, change several, lighter alternatives, power values, import, bar code, convert units) are in «…»': 'Die Werkzeuge (Teile wiegen, mehrere ändern, leichtere Alternativen, Strom-Werte, Import, Strichcode, Masse umrechnen) stehen im «…»',
    'Bikes and gear › Gear, «…».': 'Velos und Material › Material, «…».',
    'The strip «Belongs to» and the row «On this page» are gone from Gear; the column of views on the right is the menu «View»': 'Der Streifen «Gehört zu» und die Zeile «Auf dieser Seite» sind auf Material weg; die Spalte der Ansichten rechts ist das Menü «Ansicht»',
    'Open «Gear»: on top only the search, «View», «+ Item» and «…»; the list follows right below.': 'Öffne «Material»: oben nur die Suche, «Ansicht», «+ Teil» und «…»; die Liste folgt gleich darunter.',
    'Tap «View», choose «Favourites»: the list shows only favourites; «Show all» brings the rest back.': 'Tippe auf «Ansicht» und wähle «Favoriten»: Die Liste zeigt nur Favoriten; «Alle zeigen» bringt den Rest zurück.',
    'Tap «…»: «Weigh items» and «Change several» are there.': 'Tippe auf «…»: «Teile wiegen» und «Mehrere ändern» sind dort.',
  },
};
