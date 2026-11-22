// «Velopflege umgebaut» (Noah 21.11.2026 «1a 2a 3a 4a 5a», Thread «Velopflege zum Inspektions-Begleiter machen», Schritt B)
export default {
  title: 'Bike care, shorter and clearer',
  lead: 'The care page of a bike is shorter: what is due first, then three check cards, then the wear and the parts. The rest is one tap down under «More».',
  points: [
    { text: 'Three check cards: quick check, monthly check, full inspection, each with its points and the tools you need', go: { href: '#/bikes?tab=care', where: 'On a bike\'s care page, under «Due now».', steps: [{ sel: '[data-inspect-card]' }] } },
    { text: 'The ride ledger, the bike sheets and the care rules are under «More»', go: { href: '#/bikes?tab=care', where: 'On a bike\'s care page, near the bottom: «More».', steps: [{ sel: '[data-care-more]' }] } },
  ],
  small: [{ box: 'new', text: '«More» opens by itself while a ride of the bike is unclear' }],
  test: [
    'Bikes › Care: under «At a glance» and «Due now» come three check cards with their tools.',
    'Tap «More»: the ride ledger, the sheets and the care rules are all still there.',
  ],
  since: [],
  de: {
    'Bike care, shorter and clearer': 'Velopflege, kürzer und klarer',
    'The care page of a bike is shorter: what is due first, then three check cards, then the wear and the parts. The rest is one tap down under «More».': 'Die Pflege-Seite eines Velos ist kürzer: zuerst was fällig ist, dann drei Check-Karten, dann der Verschleiss und die Teile. Der Rest liegt einen Tipp tiefer unter «Mehr».',
    'Three check cards: quick check, monthly check, full inspection, each with its points and the tools you need': 'Drei Check-Karten: Kurzcheck, Monatlicher Check, Grosse Inspektion, je mit den Punkten und dem Werkzeug, das du brauchst',
    'On a bike\'s care page, under «Due now».': 'Auf der Pflege-Seite eines Velos, unter «Jetzt fällig».',
    'The ride ledger, the bike sheets and the care rules are under «More»': 'Das Fahrtenbuch, die Velo-Blätter und die Pflege-Regeln liegen unter «Mehr»',
    'On a bike\'s care page, near the bottom: «More».': 'Auf der Pflege-Seite eines Velos, weiter unten: «Mehr».',
    '«More» opens by itself while a ride of the bike is unclear': '«Mehr» öffnet sich von selbst, solange eine Fahrt des Velos unklar ist',
    'Bikes › Care: under «At a glance» and «Due now» come three check cards with their tools.': 'Velos › Pflege: Unter «Auf einen Blick» und «Jetzt fällig» stehen drei Check-Karten mit ihrem Werkzeug.',
    'Tap «More»: the ride ledger, the sheets and the care rules are all still there.': 'Tippe auf «Mehr»: Fahrtenbuch, Blätter und Pflege-Regeln sind alle noch da.',
  },
};
