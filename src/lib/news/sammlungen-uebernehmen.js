// «Sammlungen: übernehmen» (Noah 07.11.2026 «a», Thread «Bauen: Freie Zeit Teil 1»)
export default {
  title: 'Keep a shared collection',
  lead: 'Someone sends you a collection as a page: one tap keeps it as your own.',
  points: [
    // the button sits on the shared page, which needs a link; the line shows where collections are shared from
    { text: 'On a shared collection tap «Keep in my collections»', go: { href: '#/me/frei/sammlung/recipes', steps: [{ sel: '[data-new-entry]' }] } },
  ],
  small: [{ box: 'new', text: 'Only the text comes along, no photos' }],
  test: ['Share a collection as a page and open the link.', 'Tap «Keep in my collections», then «Open it»: the collection is in your list.', 'Tap «Undo» in the note: it is gone again.'],
  since: [],
  de: {
    'Keep a shared collection': 'Geteilte Sammlung behalten',
    'Someone sends you a collection as a page: one tap keeps it as your own.': 'Jemand schickt dir eine Sammlung als Seite: ein Tippen behält sie als deine eigene.',
    'On a shared collection tap «Keep in my collections»': 'Tippe bei einer geteilten Sammlung auf «In meine Sammlungen übernehmen»',
    'Only the text comes along, no photos': 'Nur der Text kommt mit, keine Fotos',
    'Share a collection as a page and open the link.': 'Teile eine Sammlung als Seite und öffne den Link.',
    'Tap «Keep in my collections», then «Open it»: the collection is in your list.': 'Tippe auf «In meine Sammlungen übernehmen», dann auf «Öffnen»: Die Sammlung steht in deiner Liste.',
    'Tap «Undo» in the note: it is gone again.': 'Tippe in der Meldung auf «Rückgängig»: Sie ist wieder weg.',
  },
};
