// «Faustregeln aus deinen Rückblicken» (Idee D2 «App denkt mit», Noah 02.11.2026 «3b»)
export default {
  features: [
    { id: 'f.faustregel', group: 'after', title: 'Rules of thumb from your debriefs', text: 'When your finished trips show a pattern for an own block, e.g. used only below 8 °C, the app suggests that rule; you decide.', href: '#/me/regeln', words: 'faustregel regel vorschlag rückblick muster baustein temperatur eigene regeln lernen', moment: 'zurueck' },
  ],
  howto: { 'f.faustregel': ['Open Me › How the app decides.', 'On top: a rule of thumb from your debriefs, if there is a clear pattern.', '«Make it a rule» saves it on the block; Undo takes it back.'] },
  handbook: {
    'f.faustregel': {
      on: 'Needs an own building block and at least 4 finished trips with it.',
      steps: ['Open Me › How the app decides.', 'On top: a rule of thumb the app found in your debriefs.', '«Make it a rule» saves it on the block; «Not this one» stops the suggestion.'],
      example: 'Example: block «Warm things» used on 2 trips below 6 °C, left unused on 2 trips above 12 °C → rule «below 9 °C».',
    },
  },
  home: { 'f.faustregel': '#/me/regeln' },
};
