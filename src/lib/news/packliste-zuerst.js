// «Ganze App neu denken» Schritt 4b (Noah 18.11.2026 «1a»): the packing list comes first on the page «Plan» of a trip
export default {
  title: 'The packing list first',
  lead: 'On the page «Plan» of a trip the packing list comes right after the conditions.',
  points: [
    { text: 'Route, bike and bags, weight, stages and notes follow below the list', go: { href: '#/pack', where: 'Open a planned trip under Trips: the tab «Plan» shows the list first, the cards below it.' } },
  ],
  small: [],
  test: [
    'Open a planned trip under «Trips» and look at the tab «Plan»: the packing list stands before the route and the bike.',
    'Scroll down: route, bike and bags, weight, stages and notes are all still there.',
  ],
  since: [],
  de: {
    'The packing list first': 'Die Packliste zuerst',
    'On the page «Plan» of a trip the packing list comes right after the conditions.': 'Auf der Seite «Planen» einer Tour steht die Packliste direkt nach den Bedingungen.',
    'Route, bike and bags, weight, stages and notes follow below the list': 'Strecke, Velo und Taschen, Gewicht, Etappen und Notizen stehen unter der Liste',
    'Open a planned trip under Trips: the tab «Plan» shows the list first, the cards below it.': 'Öffne unter Touren eine geplante Tour: der Reiter «Planen» zeigt zuerst die Liste, darunter die Karten.',
    'Open a planned trip under «Trips» and look at the tab «Plan»: the packing list stands before the route and the bike.': 'Öffne unter «Touren» eine geplante Tour und schau den Reiter «Planen» an: die Packliste steht vor der Strecke und dem Velo.',
    'Scroll down: route, bike and bags, weight, stages and notes are all still there.': 'Scrolle nach unten: Strecke, Velo und Taschen, Gewicht, Etappen und Notizen sind alle noch da.',
  },
};
