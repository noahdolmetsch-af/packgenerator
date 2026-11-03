// «Planen als verbindende Mitte» (Noah 1.11.2026 «5a» + «bitte ebenfalls einplanen»): close the week
export default {
  title: 'Close the week',
  lead: 'Open to-dos of earlier days wait for your decision, one by one.',
  points: [
    { text: 'Planen › Woche: open to-dos of earlier days can be moved to today, dropped or kept without a day; Undo works after each choice', href: '#/week', go: 'f.weekplan' },
  ],
  small: [],
  test: ['Planen › Woche: with an open to-do from a past day, the card «Close the week» shows it.', 'Tap «Move to today»: it moves to today, and «Undo» brings it back.'],
  since: [],
  de: {
    'Close the week': 'Woche abschliessen',
    'Open to-dos of earlier days wait for your decision, one by one.': 'Offene To-dos früherer Tage warten auf deine Entscheidung, eines nach dem anderen.',
    'Planen › Woche: open to-dos of earlier days can be moved to today, dropped or kept without a day; Undo works after each choice': 'Planen › Woche: Offene To-dos früherer Tage kannst du auf heute verschieben, fallen lassen oder ohne Tag behalten; Rückgängig geht nach jeder Wahl',
    'Planen › Woche: with an open to-do from a past day, the card «Close the week» shows it.': 'Planen › Woche: Mit einem offenen To-do von einem vergangenen Tag zeigt es die Karte «Woche abschliessen».',
    'Tap «Move to today»: it moves to today, and «Undo» brings it back.': 'Auf «Auf heute verschieben» tippen: Es rutscht auf heute, und «Rückgängig» holt es zurück.',
  },
};
