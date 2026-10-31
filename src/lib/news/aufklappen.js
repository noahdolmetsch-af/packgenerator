// «Neuer Schwung» Aufklappen (Noah 26.10.2026 «2a», 27.10.2026 «alle offen, gemerkt»): on a phone a tap on an area's
// heading on Today folds it to one line; the phone remembers it. A computer shows every area open.
export default {
  title: 'Fold areas on Today',
  lead: 'On your phone a tap on an area heading on Today folds it away.',
  points: [{ text: 'Tap a heading such as «Deine Woche»: the area folds to one line with its tiles, a second tap opens it', go: { href: '#/', where: 'On the phone, on Today: tap the heading of an area, for example «Deine Woche».' } }],
  small: [{ box: 'nicer', text: 'Your phone remembers which areas you folded; at first all are open', go: { href: '#/', where: 'On the phone, on Today: tap the heading of an area, for example «Deine Woche».' } }, { box: 'new', text: '«Open all areas» at the bottom opens every folded area at once', go: { href: '#/', where: 'On the phone, on Today: fold an area, then «Open all areas» shows at the bottom.' } }],
  test: ['On the phone open Heute and tap the heading of an area: it folds to one line with the names of its tiles.', 'Reload the page: the area stays folded. Tap it again: it opens.'],
  since: [],
  de: {
    'Fold areas on Today': 'Bereiche auf Heute zuklappen',
    'On your phone a tap on an area heading on Today folds it away.': 'Am Handy klappt ein Tipp auf eine Bereichs-Überschrift auf Heute den Bereich zu.',
    'Tap a heading such as «Deine Woche»: the area folds to one line with its tiles, a second tap opens it': 'Tippe auf eine Überschrift wie «Deine Woche»: der Bereich wird zu einer Zeile mit seinen Kacheln, ein zweiter Tipp öffnet ihn',
    'Your phone remembers which areas you folded; at first all are open': 'Dein Handy merkt sich, welche Bereiche zu sind; am Anfang sind alle offen',
    '«Open all areas» at the bottom opens every folded area at once': '«Alle aufklappen» ganz unten öffnet alle zugeklappten Bereiche auf einmal',
    'On the phone, on Today: tap the heading of an area, for example «Deine Woche».': 'Am Handy auf Heute: Tippe auf die Überschrift eines Bereichs, zum Beispiel «Deine Woche».',
    'On the phone, on Today: fold an area, then «Open all areas» shows at the bottom.': 'Am Handy auf Heute: Klappe einen Bereich zu, dann erscheint unten «Alle aufklappen».',
    'On the phone open Heute and tap the heading of an area: it folds to one line with the names of its tiles.': 'Öffne am Handy Heute und tippe auf die Überschrift eines Bereichs: er wird zu einer Zeile mit den Namen seiner Kacheln.',
    'Reload the page: the area stays folded. Tap it again: it opens.': 'Lade die Seite neu: der Bereich bleibt zu. Tippe nochmals: er geht auf.',
  },
};
