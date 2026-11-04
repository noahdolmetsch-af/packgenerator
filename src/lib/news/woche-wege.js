// «Wege aus Diese Woche» (Noah 03.11.2026 «3a», Zusatz Sonntags-Faden): Wochenrückblick and Trainingspläne one tap from the week on Aktiv
export default {
  title: 'Week in review and plans, one tap away',
  lead: 'Under «This week» on Active you now find the week in review and the training plans.',
  points: [{ text: 'Two links under «This week»: Week in review and Training plans', go: { href: '#/flow', steps: [{ sel: '[data-to-review]' }] } }, { text: 'From Friday evening to Monday a line says the week is almost over and leads to the review', go: { href: '#/flow', where: 'Active, under «This week», from Friday 17:00 to the end of Monday.' } }],
  small: [{ box: 'new', text: 'Before, the review and the plans were three taps away' }],
  test: ['Open Active: under «This week» tap «Week in review».', 'Go back and tap «Training plans»: the four plans show.'],
  since: [],
  de: {
    'Week in review and plans, one tap away': 'Wochenrückblick und Pläne, ein Tipp entfernt',
    'Under «This week» on Active you now find the week in review and the training plans.': 'Unter «Diese Woche» auf Aktiv findest du jetzt den Wochenrückblick und die Trainingspläne.',
    'Two links under «This week»: Week in review and Training plans': 'Zwei Links unter «Diese Woche»: Wochenrückblick und Trainingspläne',
    'From Friday evening to Monday a line says the week is almost over and leads to the review': 'Von Freitagabend bis Montag sagt eine Zeile, dass die Woche bald zu Ende ist, und führt zum Rückblick',
    'Active, under «This week», from Friday 17:00 to the end of Monday.': 'Aktiv, unter «Diese Woche», ab Freitag 17:00 bis Ende Montag.',
    'Before, the review and the plans were three taps away': 'Vorher waren Rückblick und Pläne drei Tipps entfernt',
    'Open Active: under «This week» tap «Week in review».': 'Öffne Aktiv: Tippe unter «Diese Woche» auf «Wochenrückblick».',
    'Go back and tap «Training plans»: the four plans show.': 'Geh zurück und tippe «Trainingspläne»: Die vier Pläne erscheinen.',
  },
};
