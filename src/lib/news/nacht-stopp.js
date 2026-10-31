// «Nacht-Stopp-Ablauf» (Noah 28.10.2026 «1a»): what you do at every night stop, as a list to tick off
export default {
  title: 'Night stop routine',
  lead: 'On every race: what you do at a night stop, one step after the other, ticked off.',
  points: [{ text: '«Next stop» takes every tick off and counts the stop', href: '#/racecheck', go: { href: '#/racecheck', where: 'Shows in the plan of a race, under «Night stop routine».' } }],
  small: [{ box: 'new', text: 'Your own steps per race; add, change, delete and sort' }],
  test: ['Open Touren › «Rennen detailliert planen» › a race: the box «Nacht-Stopp-Ablauf» shows the steps.', 'Tick two steps, then «Nächster Stopp: Haken weg»: the ticks are gone and it says «Stopp 2».'],
  since: [],
  de: {
    'Shows in the plan of a race, under «Night stop routine».': 'Zeigt sich im Plan eines Rennens, unter «Nacht-Stopp-Routine».',
    'On every race: what you do at a night stop, one step after the other, ticked off.': 'Bei jedem Rennen: was du bei einem Nacht-Stopp machst, Schritt für Schritt zum Abhaken.',
    '«Next stop» takes every tick off and counts the stop': '«Nächster Stopp» nimmt alle Haken weg und zählt den Stopp',
    'Your own steps per race; add, change, delete and sort': 'Eigene Schritte pro Rennen; dazufügen, ändern, löschen und sortieren',
    'Open Touren › «Rennen detailliert planen» › a race: the box «Nacht-Stopp-Ablauf» shows the steps.': 'Öffne Touren › «Rennen detailliert planen» › ein Rennen: der Kasten «Nacht-Stopp-Ablauf» zeigt die Schritte.',
    'Tick two steps, then «Nächster Stopp: Haken weg»: the ticks are gone and it says «Stopp 2».': 'Zwei Schritte abhaken, dann «Nächster Stopp: Haken weg»: die Haken sind weg und es steht «Stopp 2».',
  },
};
