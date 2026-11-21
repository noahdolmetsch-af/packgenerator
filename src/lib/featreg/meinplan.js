// «Mein Trainingsplan» (Noah 21.11.2026 «ich möchte alle entwürfe 1-3 umsetzen», S6): Plan und Gemachtes auf einer Seite
export default {
  features: [
    { id: 'f.meinplan', group: 'active', title: 'My training plan', text: 'Your plan and what you did, on one page: the goal with the weeks to go, the week in hours and units, the hours per week (bars: done, line: plan), this week unit by unit and the plan against what you did for the last 4 weeks. It reads your weekly plan and your week and only shows; changing is done where it was done before. No alarm, no grade.', href: '#/flow/trainingsplan', words: 'trainingsplan mein plan woche stunden geplant gemacht ziel wochenplan einheiten vergleich plan gegen ist training my training plan planned done goal weeks hours units compare', moment: 'koerper' },
  ],
  howto: { 'f.meinplan': ['Open Active; under «This week» tap «My training plan».', 'Read the week in hours and units, and the bars against the plan line.', 'Tap a bar for that week, or a unit to change it in the weekly plan.'] },
  handbook: {
    'f.meinplan': {
      on: null,
      steps: ['Open Active; under «This week» tap «My training plan».', 'Read the week in hours and units, and the bars against the plan line.', 'Tap a bar for that week, or a unit to change it in the weekly plan.'],
      example: 'Example: 5:54 h of 9:00 h planned, 4 of 7 units done, 93 % of the plan hours so far.',
    },
  },
  home: { 'f.meinplan': '#/flow/trainingsplan' },
};
