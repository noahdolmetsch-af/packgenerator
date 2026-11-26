// «Fokus Intervalle / Kraft als Wochen-Art» (Noah 23./24.11.2026 «3a», Thread «Wochenplan-Vorschläge verlässlich machen»)
export default {
  title: 'Focus on intervals or strength for a week',
  lead: 'The weekly plan has two more kinds of week: «Focus intervals» and «Focus strength». Your hours stay, the units change.',
  points: [
    { text: 'Tap «Focus intervals» and two bike units become intervals, on days that do not follow each other. Tap «Focus strength» and the week has three gym sessions and an easy bike', go: { href: '#/flow/wochenplan', where: 'Training › Weekly plan, under «This week», next to «Lighter week» and «Harder week».' } },
    { text: 'Small units such as the mini workout or the treadmill make room, and the plan says which: the hours of your week stay', go: { href: '#/flow/wochenplan', where: 'Training › Weekly plan, «What the plan changed on its own».' } },
  ],
  small: [
    { box: 'new', text: 'A week has one focus at most: intervals or strength, never both; in a ski tour week it does not apply' },
    { box: 'new', text: 'Every tap has Undo, and next week has its own switches' },
  ],
  test: [
    'Open Training › Weekly plan and tap «Focus intervals» under «This week»: two bike units carry the word «intervals». Tap «Focus strength»: the intervals are gone and the week has three gym sessions.',
    'Tap «Undo»: the week is as it was. Switch on «Ski tour week» with a focus on: a line says the focus does not apply.',
  ],
  since: [],
  de: {
    'Focus on intervals or strength for a week': 'Eine Woche mit Fokus auf Intervalle oder Kraft',
    'The weekly plan has two more kinds of week: «Focus intervals» and «Focus strength». Your hours stay, the units change.': 'Der Wochenplan hat zwei weitere Arten von Woche: «Fokus Intervalle» und «Fokus Kraft». Deine Stunden bleiben, die Einheiten ändern sich.',
    'Tap «Focus intervals» and two bike units become intervals, on days that do not follow each other. Tap «Focus strength» and the week has three gym sessions and an easy bike': 'Tippe «Fokus Intervalle», und zwei Velo-Einheiten werden Intervalle, an Tagen, die nicht aufeinander folgen. Tippe «Fokus Kraft», und die Woche hat drei Gym-Einheiten und ein lockeres Velo',
    'Training › Weekly plan, under «This week», next to «Lighter week» and «Harder week».': 'Training › Wochenplan, unter «Diese Woche», neben «Leichtere Woche» und «Härtere Woche».',
    'Small units such as the mini workout or the treadmill make room, and the plan says which: the hours of your week stay': 'Kleine Einheiten wie das Mini-Workout oder das Laufband machen Platz, und der Plan sagt, welche: die Stunden deiner Woche bleiben',
    'Training › Weekly plan, «What the plan changed on its own».': 'Training › Wochenplan, «Was der Plan selbst angepasst hat».',
    'A week has one focus at most: intervals or strength, never both; in a ski tour week it does not apply': 'Eine Woche hat höchstens einen Fokus: Intervalle oder Kraft, nie beides; in einer Skitour-Woche gilt er nicht',
    'Every tap has Undo, and next week has its own switches': 'Jeder Tipp hat Rückgängig, und die nächste Woche hat ihre eigenen Schalter',
    'Open Training › Weekly plan and tap «Focus intervals» under «This week»: two bike units carry the word «intervals». Tap «Focus strength»: the intervals are gone and the week has three gym sessions.': 'Öffne Training › Wochenplan und tippe unter «Diese Woche» auf «Fokus Intervalle»: zwei Velo-Einheiten tragen das Wort «Intervalle». Tippe «Fokus Kraft»: die Intervalle sind weg und die Woche hat drei Gym-Einheiten.',
    'Tap «Undo»: the week is as it was. Switch on «Ski tour week» with a focus on: a line says the focus does not apply.': 'Tippe «Rückgängig»: die Woche ist wie vorher. Schalte «Skitour-Woche» bei laufendem Fokus an: eine Zeile sagt, dass der Fokus nicht gilt.',
  },
};
