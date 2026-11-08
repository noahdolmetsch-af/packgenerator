// «Notfall ohne Standort» (UX-Test 08.11.2026, Noah «1–5 a»): no dead end on the emergency page, an old address says it is gone, the bar fits at 320 px
export default {
  title: 'Emergency without a position',
  lead: 'The emergency page no longer ends in a dead end when the position is off, an old address says so, and the bottom bar fits on a very small phone.',
  points: [
    { text: 'Emergency: when the position is off, «Try the position again» and «Open the map» are there', go: { href: '#/mountain/sos', where: 'Shows on the emergency page when the position is switched off or does not come: two buttons in the box «Your position».' } },
    { text: 'An old address in Aktiv, such as the old Tennis bookmark, says «This page is not there any more» and leads to the sport', go: { href: '#/flow/tennis', steps: [{ text: 'This page is not there any more' }] } },
    { text: 'On a very small phone (320 px) the bar shows «Bikes and gear» in two whole lines', go: { href: '#/flow', where: 'Shows in the bar at the bottom of a phone that is 320 px wide.' } },
  ],
  small: [],
  test: [
    'Open Touren › Skitouren › Berg und Notfall › Emergency with the position switched off for the app: under «Your position» tap «Try the position again», then «Open the map».',
    'Open the old address …/#/flow/tennis: the page says it is gone; «To Tennis» opens the sport, «To Active» the start of Aktiv.',
    'On a phone that is 320 px wide look at the bar at the bottom: «Bikes and gear» stands in two whole lines.',
  ],
  since: [],
  de: {
    'Emergency without a position': 'Notfall ohne Standort',
    'The emergency page no longer ends in a dead end when the position is off, an old address says so, and the bottom bar fits on a very small phone.':
      'Die Notfall-Seite endet nicht mehr in einer Sackgasse, wenn der Standort aus ist, eine alte Adresse sagt es, und die untere Leiste passt auf ein sehr kleines Handy.',
    'Emergency: when the position is off, «Try the position again» and «Open the map» are there': 'Notfall: ist der Standort aus, gibt es «Nochmal versuchen» und «Karte öffnen»',
    'Shows on the emergency page when the position is switched off or does not come: two buttons in the box «Your position».': 'Erscheint auf der Notfall-Seite, wenn der Standort aus ist oder nicht kommt: zwei Knöpfe im Kasten «Dein Standort».',
    'An old address in Aktiv, such as the old Tennis bookmark, says «This page is not there any more» and leads to the sport': 'Eine alte Adresse in Aktiv, etwa das alte Tennis-Lesezeichen, sagt «Diese Seite gibt es nicht mehr» und führt zur Sportart',
    'On a very small phone (320 px) the bar shows «Bikes and gear» in two whole lines': 'Auf einem sehr kleinen Handy (320 px) steht «Velos und Material» in der Leiste in zwei ganzen Zeilen',
    'Shows in the bar at the bottom of a phone that is 320 px wide.': 'Zeigt sich in der Leiste unten bei einem Handy mit 320 px Breite.',
    'Open Touren › Skitouren › Berg und Notfall › Emergency with the position switched off for the app: under «Your position» tap «Try the position again», then «Open the map».':
      'Öffne Touren › Skitouren › Berg und Notfall › Notfall bei ausgeschaltetem Standort: tippe unter «Dein Standort» auf «Nochmal versuchen», dann auf «Karte öffnen».',
    'Open the old address …/#/flow/tennis: the page says it is gone; «To Tennis» opens the sport, «To Active» the start of Aktiv.': 'Öffne die alte Adresse …/#/flow/tennis: die Seite sagt, dass es sie nicht mehr gibt; «Zu Tennis» öffnet die Sportart, «Zu Aktiv» den Start von Aktiv.',
    'On a phone that is 320 px wide look at the bar at the bottom: «Bikes and gear» stands in two whole lines.': 'Schau bei einem Handy mit 320 px Breite die Leiste unten an: «Velos und Material» steht in zwei ganzen Zeilen.',
  },
};
