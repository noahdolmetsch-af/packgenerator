// «Auswerten in Gruppen» (Noah 03.11.2026 «2a»): the pages of Auswerten stand by the question you ask
export default {
  title: 'Analysis by question',
  lead: 'The pages of Analysis stand in three groups: how am I doing, what did I do, what did I learn.',
  points: [{ text: 'On the phone «All n» in Analysis shows the pages in three groups', go: { href: '#/auswerten', steps: [{ sel: 'nav.ptabs .pmore' }] } }],
  small: [{ box: 'new', text: 'The order inside «All n» can still be changed with «Change the order»' }],
  test: ['Open Analysis and tap «All n» next to the tabs: three headings show.', 'Tap a page: it opens, and «All n» still lists all pages.'],
  since: [],
  de: {
    'Analysis by question': 'Auswerten nach Frage',
    'The pages of Analysis stand in three groups: how am I doing, what did I do, what did I learn.': 'Die Seiten von Auswerten stehen in drei Gruppen: Wie geht es mir, was habe ich gemacht, was habe ich gelernt.',
    'On the phone «All n» in Analysis shows the pages in three groups': 'Auf dem Handy zeigt «Alle n» in Auswerten die Seiten in drei Gruppen',
    'The order inside «All n» can still be changed with «Change the order»': 'Die Reihenfolge in «Alle n» lässt sich weiter mit «Reihenfolge ändern» anpassen',
    'Open Analysis and tap «All n» next to the tabs: three headings show.': 'Öffne Auswerten und tippe neben den Reitern auf «Alle n»: Drei Überschriften erscheinen.',
    'Tap a page: it opens, and «All n» still lists all pages.': 'Tippe eine Seite an: Sie öffnet sich, und «Alle n» listet weiter alle Seiten.',
  },
};
