// «Heute entdecken» (Noah 23.11.2026 «1a 2b 3a 4a 5a»): the card «Entdecken» left «Mehr»; one idea with its «Warum» stands under the chips
export default {
  title: 'Discover today',
  lead: 'One idea a day stands under the chips on Today, always with its reason.',
  points: [
    { text: 'The row «Discover today»: a star that is almost there, the tour suggestions, what is new or a function you never opened', go: { href: '#/', steps: [{ sel: '[data-ideas-row]' }], where: 'Today, right under the chips «Ride today» and «Tick off».' } },
    { text: '«More ideas» opens three ideas, each with «Later» and «Not for me»', go: { href: '#/', steps: [{ sel: '[data-ideas-more]' }], where: 'Today › Discover today › More ideas.' } },
  ],
  small: [{ box: 'new', text: 'The card «Discover» is no longer under «More»; the switch in «More ideas» takes the row away' }],
  test: ['Open Today: under the chips stands «Discover today» with one idea and a «Why» line.', 'Tap «More ideas»: three ideas, each with «Later» and «Not for me».', 'Tap × on the row: the idea is gone until tomorrow, and «Undo» brings it back.'],
  since: ['f.heuteentdecken'],
  de: {
    'Discover today': 'Heute entdecken',
    'One idea a day stands under the chips on Today, always with its reason.': 'Unter den Chips auf Heute steht jeden Tag eine Idee, immer mit ihrem Grund.',
    'The row «Discover today»: a star that is almost there, the tour suggestions, what is new or a function you never opened': 'Die Zeile «Heute entdecken»: ein Stern, der fast da ist, die Tourenvorschläge, was neu ist oder eine Funktion, die du noch nie geöffnet hast',
    'Today, right under the chips «Ride today» and «Tick off».': 'Heute, direkt unter den Chips «Heute fahren» und «Abhaken».',
    '«More ideas» opens three ideas, each with «Later» and «Not for me»': '«Mehr Ideen» zeigt drei Ideen, jede mit «Später» und «Nicht für mich»',
    'Today › Discover today › More ideas.': 'Heute › Heute entdecken › Mehr Ideen.',
    'The card «Discover» is no longer under «More»; the switch in «More ideas» takes the row away': 'Die Karte «Entdecken» steht nicht mehr unter «Mehr»; der Schalter in «Mehr Ideen» nimmt die Zeile weg',
    'Open Today: under the chips stands «Discover today» with one idea and a «Why» line.': 'Öffne Heute: unter den Chips steht «Heute entdecken» mit einer Idee und einer Zeile «Warum».',
    'Tap «More ideas»: three ideas, each with «Later» and «Not for me».': 'Tippe auf «Mehr Ideen»: drei Ideen, jede mit «Später» und «Nicht für mich».',
    'Tap × on the row: the idea is gone until tomorrow, and «Undo» brings it back.': 'Tippe auf × in der Zeile: die Idee ist bis morgen weg, und «Rückgängig» holt sie zurück.',
  },
};
