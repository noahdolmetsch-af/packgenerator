// «Wochenplan» (Noah 09.11.2026 «bau los», Teil 2): die Seite unter Aktiv
export default {
  title: 'Your weekly plan',
  lead: 'Set your hours per week and the app places units in the week with times.',
  points: [
    { text: 'Hours per week with plus and minus; the units fit the hours', go: 'f.wochenplan' },
    { text: 'Each unit has its own plus and minus; «What does not fit» says what to adjust', go: 'f.wochenplan' },
  ],
  small: [{ box: 'new', text: 'On Active under «This week» and in «This week» of the week planner a link leads to the page' }],
  test: [
    'On Active under «This week» tap «Weekly plan», then «Start my weekly plan»: the week appears with times.',
    'Tap the plus beside the hours: the units and the week change. Tap «Undo»: it is as before.',
    'Tap the minus beside «Tennis»: one unit less, the plan shows its hours.',
  ],
  since: ['f.wochenplan'],
  de: {
    'Your weekly plan': 'Dein Wochenplan',
    'Set your hours per week and the app places units in the week with times.': 'Stell deine Stunden pro Woche ein, und die App legt Einheiten mit Zeiten in die Woche.',
    'Hours per week with plus and minus; the units fit the hours': 'Stunden pro Woche mit Plus und Minus; die Einheiten passen zu den Stunden',
    'Each unit has its own plus and minus; «What does not fit» says what to adjust': 'Jede Einheit hat ihr eigenes Plus und Minus; «Was nicht passt» sagt, was du anpassen kannst',
    'On Active under «This week» and in «This week» of the week planner a link leads to the page': 'Auf Aktiv unter «Diese Woche» und in «Woche planen» führt ein Link zur Seite',
    'On Active under «This week» tap «Weekly plan», then «Start my weekly plan»: the week appears with times.': 'Tippe auf Aktiv unter «Diese Woche» auf «Wochenplan», dann auf «Meinen Wochenplan starten»: Die Woche erscheint mit Zeiten.',
    'Tap the plus beside the hours: the units and the week change. Tap «Undo»: it is as before.': 'Tippe das Plus neben den Stunden: Die Einheiten und die Woche ändern sich. Tippe «Rückgängig»: Es ist wie vorher.',
    'Tap the minus beside «Tennis»: one unit less, the plan shows its hours.': 'Tippe das Minus bei «Tennis»: eine Einheit weniger, der Plan zeigt seine Stunden.',
  },
};
