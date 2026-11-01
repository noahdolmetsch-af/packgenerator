// «Velo-Countdown» (Noah 27.10.2026, idea 3 of the ultra analysis): bike steps in the weeks before a race
export default {
  title: 'Bike countdown',
  lead: 'On every race: what to do with the bike 6, 5, 4 … weeks before, with its day.',
  points: [{ text: 'Seven suggestions to tick off; change the weeks, add or delete steps', href: '#/racecheck', go: { href: '#/racecheck', where: 'Shows in the plan of a race, under «Bike countdown».' } }],
  small: [{ box: 'new', text: 'Shows what is overdue and what is due this week' }],
  test: ['Open Touren › «Rennen detailliert planen» › a race: the box «Velo-Countdown» shows the steps with their day.', 'Tick one step: above stands «1 von 7 erledigt»; after a reload the tick is still there.'],
  since: [],
  de: {
    'Shows in the plan of a race, under «Bike countdown».': 'Zeigt sich im Plan eines Rennens, unter «Velo-Countdown».',
    'On every race: what to do with the bike 6, 5, 4 … weeks before, with its day.': 'Bei jedem Rennen: was du 6, 5, 4 … Wochen vorher am Velo machst, mit dem Tag dazu.',
    'Seven suggestions to tick off; change the weeks, add or delete steps': 'Sieben Vorschläge zum Abhaken; Wochen ändern, Schritte dazufügen oder löschen',
    'Shows what is overdue and what is due this week': 'Zeigt, was überfällig ist und was diese Woche fällig ist',
    'Open Touren › «Rennen detailliert planen» › a race: the box «Velo-Countdown» shows the steps with their day.': 'Öffne Touren › «Rennen detailliert planen» › ein Rennen: der Kasten «Velo-Countdown» zeigt die Schritte mit ihrem Tag.',
    'Tick one step: above stands «1 von 7 erledigt»; after a reload the tick is still there.': 'Hake einen Schritt ab: oben steht «1 von 7 erledigt»; nach dem Neuladen ist der Haken noch da.',
  },
};
