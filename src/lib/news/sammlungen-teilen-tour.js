// «Sammlungen: teilen, drucken, Tour» (Noah 05.11.2026 «Touren 2a und b», Thread «Bauen: Freie Zeit Teil 1»)
export default {
  title: 'Collections: share, print, tour',
  lead: 'A collection can go to someone else as a page, onto paper, or be linked with a tour.',
  points: [
    { text: 'Share a collection as a page (a link, text only)', go: { href: '#/me/frei/sammlung/recipes', steps: [{ sel: '[data-share-page]' }] } },
    { text: 'Link a collection with one of your tours', go: { href: '#/me/frei/sammlung/recipes', steps: [{ sel: '[data-coll-tour]' }] } },
  ],
  small: [{ box: 'new', text: 'Photos and positions never go into the link' }],
  test: ['Open a collection with an entry and tap «Share as a page»: the link opens a read-only page.', 'On the page tap «Print or save as PDF».', 'Choose a tour under «Linked tour»: «Open the tour» leads there.'],
  since: [],
  de: {
    'Collections: share, print, tour': 'Sammlungen: teilen, drucken, Tour',
    'A collection can go to someone else as a page, onto paper, or be linked with a tour.': 'Eine Sammlung kann als Seite zu jemandem gehen, aufs Papier oder mit einer Tour verknüpft werden.',
    'Share a collection as a page (a link, text only)': 'Eine Sammlung als Seite teilen (ein Link, nur Text)',
    'Link a collection with one of your tours': 'Eine Sammlung mit einer deiner Touren verknüpfen',
    'Photos and positions never go into the link': 'Fotos und Positionen kommen nie in den Link',
    'Open a collection with an entry and tap «Share as a page»: the link opens a read-only page.': 'Öffne eine Sammlung mit einem Eintrag und tippe auf «Als Seite teilen»: Der Link öffnet eine Seite zum Lesen.',
    'On the page tap «Print or save as PDF».': 'Tippe auf der Seite auf «Drucken oder als PDF speichern».',
    'Choose a tour under «Linked tour»: «Open the tour» leads there.': 'Wähle unter «Verknüpfte Tour» eine Tour: «Tour öffnen» führt dorthin.',
  },
};
