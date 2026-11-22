// «Vorrat: Auswahl mit Suchfeld» (Durchklick Etappe 2, Frage 4a und Design b, Noah 05.11.2026)
export default {
  title: 'Supplies: pick an item with a search field',
  lead: '«Also keep as a supply» had a list of hundreds of items. Now a search field above it narrows the list.',
  points: [{ text: 'Supplies: «Also keep as a supply» has a search field; the list shows only what fits', go: { href: '#/gear/supplies', steps: [{ sel: '[data-ss-search]' }] } }],
  small: [],
  test: ['Open Material › Supplies and scroll to «Auch als Vorrat führen»: above the list is a field «Alle Teile durchsuchen».', 'Type part of a name: the list shows only the items that fit. Choose one and tap «Hinzufügen».'],
  since: [],
  de: {
    'Supplies: pick an item with a search field': 'Vorrat: Teil mit Suchfeld auswählen',
    '«Also keep as a supply» had a list of hundreds of items. Now a search field above it narrows the list.': 'Bei «Auch als Vorrat führen» stand eine Liste mit Hunderten von Teilen. Jetzt macht ein Suchfeld darüber die Liste kürzer.',
    'Supplies: «Also keep as a supply» has a search field; the list shows only what fits': 'Vorrat: «Auch als Vorrat führen» hat ein Suchfeld; die Liste zeigt nur, was passt',
    'Open Material › Supplies and scroll to «Auch als Vorrat führen»: above the list is a field «Alle Teile durchsuchen».': 'Öffne Material › Vorrat und scrolle zu «Auch als Vorrat führen»: Über der Liste steht das Feld «Alle Teile durchsuchen».',
    'Type part of a name: the list shows only the items that fit. Choose one and tap «Hinzufügen».': 'Tippe einen Teil des Namens: Die Liste zeigt nur die passenden Teile. Wähle eines und tippe auf «Hinzufügen».',
  },
};
