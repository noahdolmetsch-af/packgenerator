// «Heute-Check» (Noah 30.10.2026 «1-5a», Thread «Tagescheck optimieren»): a tile that always leads to the questionnaire
export default {
  title: "Today's check",
  lead: 'The questionnaire is one tap away on Today, also when you have answered it.',
  points: [
    { text: 'The tile «Today\'s check» opens the questionnaire at any time and shows how many answers there are today', go: { href: '#/', steps: [{ sel: '[data-section="heutecheck"]' }] } },
    { text: 'On the questionnaire page «What goes together» and «All answers» are one tap away', go: { href: '#/check/morning', steps: [{ sel: '[data-check-tabs]' }] } },
  ],
  small: [{ box: 'new', text: 'The tile sits under «Your body today» and can be moved or taken away like every tile' }],
  test: [
    'Open Today and find the tile «Today\'s check»: tap «Open questionnaire».',
    'On the page tap «What goes together»: your insights open.',
  ],
  since: [],
  de: {
    "Today's check": 'Heute-Check',
    'The questionnaire is one tap away on Today, also when you have answered it.': 'Der Fragebogen ist auf Heute einen Tipp entfernt, auch wenn du ihn schon ausgefüllt hast.',
    "The tile «Today's check» opens the questionnaire at any time and shows how many answers there are today": 'Die Kachel «Heute-Check» öffnet den Fragebogen jederzeit und zeigt, wie viele Antworten es heute gibt',
    'On the questionnaire page «What goes together» and «All answers» are one tap away': 'Auf der Fragebogen-Seite sind «Was zusammenpasst» und «Alle Antworten» einen Tipp entfernt',
    "The tile sits under «Your body today» and can be moved or taken away like every tile": 'Die Kachel steht unter «Dein Körper heute» und lässt sich wie jede Kachel verschieben oder wegnehmen',
    "Open Today and find the tile «Today's check»: tap «Open questionnaire».": 'Öffne Heute und such die Kachel «Heute-Check»: tippe auf «Fragebogen öffnen».',
    'On the page tap «What goes together»: your insights open.': 'Tippe auf der Seite auf «Was zusammenpasst»: deine Erkenntnisse öffnen sich.',
  },
};
