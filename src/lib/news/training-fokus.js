// «Training verbessern» 3 (Noah 2.11.2026 «3»): harder, easier and a focus for the suggested week
export default {
  title: 'Harder, easier or another focus',
  lead: 'The suggested training week has buttons: a bit harder or easier, and a focus on endurance, intervals, strength or recovery. The week recalculates at once.',
  points: [{ text: 'In «Suggestion for this week» tap «Harder» or a focus', go: { href: '#/flow/training', steps: [{ sel: '[data-suggest-open]' }, { sel: '[data-sug-focus-btn="hit"]' }] } }],
  small: [{ box: 'new', text: 'Your changes to single days are dropped when you change the buttons', go: null }],
  test: [
    'Open Aktiv › Training, tap «Suggestion for this week», then «Harder».',
    'Tap «Intervals»: two hard sessions appear. Tap «Recovery»: the week gets shorter and calm.',
  ],
  since: [],
  de: {
    'Harder, easier or another focus': 'Härter, leichter oder ein anderer Fokus',
    'The suggested training week has buttons: a bit harder or easier, and a focus on endurance, intervals, strength or recovery. The week recalculates at once.': 'Die vorgeschlagene Trainingswoche hat Knöpfe: etwas härter oder leichter, und ein Fokus auf Ausdauer, Intervalle, Kraft oder Erholung. Die Woche rechnet sich sofort neu.',
    'In «Suggestion for this week» tap «Harder» or a focus': 'Tippe bei «Vorschlag für diese Woche» auf «Härter» oder einen Fokus',
    'Your changes to single days are dropped when you change the buttons': 'Deine Änderungen an einzelnen Tagen gehen verloren, wenn du die Knöpfe änderst',
    'Open Aktiv › Training, tap «Suggestion for this week», then «Harder».': 'Öffne Aktiv › Training, tippe auf «Vorschlag für diese Woche», dann auf «Härter».',
    'Tap «Intervals»: two hard sessions appear. Tap «Recovery»: the week gets shorter and calm.': 'Tippe auf «Intervalle»: zwei harte Einheiten erscheinen. Tippe auf «Erholung»: die Woche wird kürzer und ruhig.',
  },
};
