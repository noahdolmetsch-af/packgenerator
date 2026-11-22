// «Sammlungen: teilen, drucken, Tour» (Noah 05.11.2026 «Touren 2a und b», Thread «Bauen: Freie Zeit Teil 1»)
export default {
  title: 'Collections: share, print, tour',
  lead: 'A collection can go to someone else as a page, onto paper, or be linked with a tour.',
  points: [
    // «Share as a page» and «Linked tour» appear only with an entry or a tour, so the line lights the first step that is always there
    { text: 'In a collection: add an entry, then share it as a page (a link, text only)', go: { href: '#/me/frei/sammlung/recipes', steps: [{ sel: '[data-new-entry]' }] } },
  ],

  small: [{ box: 'new', text: 'Photos and positions never go into the link' }],
  test: ['Open a collection with an entry and tap «Share as a page»: the link opens a read-only page.', 'On the page tap «Print or save as PDF».', 'Choose a tour under «Linked tour»: «Open the tour» leads there.'],
  since: [],
  de: {
    'Collections: share, print, tour': 'Sammlungen: teilen, drucken, Tour',
    'A collection can go to someone else as a page, onto paper, or be linked with a tour.': 'Eine Sammlung kann als Seite zu jemandem gehen, aufs Papier oder mit einer Tour verknüpft werden.',
    'In a collection: add an entry, then share it as a page (a link, text only)': 'In einer Sammlung: Eintrag anlegen, dann als Seite teilen (ein Link, nur Text)',
    'Photos and positions never go into the link': 'Fotos und Positionen kommen nie in den Link',
    'Open a collection with an entry and tap «Share as a page»: the link opens a read-only page.': 'Öffne eine Sammlung mit einem Eintrag und tippe auf «Als Seite teilen»: Der Link öffnet eine Seite zum Lesen.',
    'On the page tap «Print or save as PDF».': 'Tippe auf der Seite auf «Drucken oder als PDF speichern».',
    'Choose a tour under «Linked tour»: «Open the tour» leads there.': 'Wähle unter «Verknüpfte Tour» eine Tour: «Tour öffnen» führt dorthin.',
  },
};
