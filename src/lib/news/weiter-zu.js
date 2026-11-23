// «Weiter zu …» (thread «Navigation ohne Sackgassen», Noah 23.11.2026 «ja», Punkt 3 «Keine Sackgassen»)
export default {
  title: 'Every page shows the way on',
  lead: 'Pages that led nowhere now end with «Continue to …».',
  points: [
    { text: 'Pages like Stops nearby, Quiz the evening before or Small apps end with a quiet line «Continue to» and up to three pages that usually come next', go: { href: '#/stopps', where: 'Trips › Stops nearby: scroll to the end of the page.' } },
  ],
  small: [{ box: 'new', text: '«Continue to» sits at the end of the page, never above the content' }],
  test: [
    'Open Trips › Stops nearby and scroll to the end: the line «Continue to» shows «Way to the goal», «Food and water» and «Trips».',
    'Tap «Way to the goal»: that page opens. Tap Back: you are on Stops nearby again.',
  ],
  since: [],
  de: {
    'Every page shows the way on': 'Jede Seite zeigt, wie es weitergeht',
    'Pages that led nowhere now end with «Continue to …».': 'Seiten, die nirgends hin führten, enden jetzt mit «Weiter zu …».',
    'Pages like Stops nearby, Quiz the evening before or Small apps end with a quiet line «Continue to» and up to three pages that usually come next': 'Seiten wie Stopps in der Nähe, Quiz am Vorabend oder Kleine Apps enden mit einer ruhigen Zeile «Weiter zu» und bis zu drei Seiten, die meist als Nächstes kommen',
    'Trips › Stops nearby: scroll to the end of the page.': 'Touren › Stopps in der Nähe: ans Ende der Seite scrollen.',
    '«Continue to» sits at the end of the page, never above the content': '«Weiter zu» steht am Ende der Seite, nie über dem Inhalt',
    'Open Trips › Stops nearby and scroll to the end: the line «Continue to» shows «Way to the goal», «Food and water» and «Trips».': 'Öffne Touren › Stopps in der Nähe und scrolle ans Ende: Die Zeile «Weiter zu» zeigt «Weg zum Ziel», «Verpflegung und Wasser» und «Touren».',
    'Tap «Way to the goal»: that page opens. Tap Back: you are on Stops nearby again.': 'Tippe auf «Weg zum Ziel»: Die Seite öffnet. Tippe auf Zurück: Du bist wieder bei Stopps in der Nähe.',
  },
};
