// «Zuletzt gelöscht» (Noah 23.11.2026 «1a», Thread «Papierkorb, Tab-Titel und Ziehen bauen»): the trash of everything
export default {
  features: [
    { id: 'f.trash', group: 'data', title: 'Recently deleted', text: 'Everything you delete (a bike, a tour, gear, a document, an entry, a to-do, an entry of My day) waits here for 30 days. «Back» brings it back with what belonged to it («Comes back with: 14 rides, 3 care entries»). The trash of the notes stands in the list too. Filter by kind. After 30 days the app asks once whether to empty it for good; nothing goes by itself. On a computer ⌘ Z / Ctrl Z takes the last delete back.', href: '#/me/trash', words: 'papierkorb gelöscht gelöscht zurück wiederherstellen rückgängig löschen entfernt trash undo restore', moment: 'app' },
  ],
  howto: { 'f.trash': ['Delete something, for example a gear item.', 'Open Me › Recently deleted: the item stands there with its days left.', 'Tap «Back»: it is there again with what belonged to it.'] },
  handbook: {
    'f.trash': {
      on: null,
      steps: ['Delete something, for example a gear item.', 'Open Me › Recently deleted: the item stands there with its days left.', 'Tap «Back»: it is there again with what belonged to it.'],
      example: 'Example: a deleted bike comes back with its km book, workshop visits and care entries.',
    },
  },
  home: { 'f.trash': '#/me/trash' },
};
