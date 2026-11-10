// «Wochenplan» (Noah 09.11.2026, Auftrag «bau los», Teil 2: die Seite): Wochenstunden → Einheiten mit Zeiten, Plus/Minus pro Einheit
export default {
  features: [
    { id: 'f.wochenplan', group: 'active', title: 'Weekly plan', text: 'Set your hours per week and the app suggests units and places them in the week with times. Each unit can be changed with plus and minus, and what does not fit is shown. Rules, no AI; your week goals stay as they are.', href: '#/flow/wochenplan', words: 'wochenplan woche plan stunden einheiten training tennis yoga gym sauna velo laufen eishockey meditation dehnen ruheblock sommer winter weekly plan hours units week schedule', moment: 'koerper' },
  ],
  howto: { 'f.wochenplan': ['Open Active › Weekly plan and tap «Start my weekly plan».', 'Set the hours per week with plus and minus; the units and the week follow.', 'Change a unit with plus or minus and read under «What does not fit» what to adjust.'] },
  handbook: {
    'f.wochenplan': {
      on: null,
      steps: ['Open Active › Weekly plan and tap «Start my weekly plan».', 'Set the hours per week with plus and minus; the units and the week follow.', 'Change a unit with plus or minus and read under «What does not fit» what to adjust.'],
      example: 'Example: 15 hours in winter give tennis three times, yoga and gym twice and a rest block, each with a time.',
    },
  },
  home: { 'f.wochenplan': '#/flow/wochenplan' },
};
