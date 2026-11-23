// «Neue Ordnung» V4b2 (Noah 22.11.2026 «1a»): the row on top of Training › Week: suggest the week, lighter, harder, rain, ski
export default {
  title: 'Lighter or harder week, on top of Training',
  lead: 'On top of Training › Week stands one row: suggest the week, and switch it to lighter, harder, rainy or a ski tour week.',
  points: [
    { text: '«Lighter» and «Harder» change the hours of this week only, your goals stay; a tap again takes it back', go: { href: '#/flow/training', steps: [{ sel: '[data-week-modes]' }], where: 'Open Week › Training: the row stands above the page. The switches «Lighter» and «Harder» need a saved weekly plan.' } },
  ],
  small: [],
  test: [
    'Open Week › Training: the row on top has «Suggest the week». With a weekly plan it also has «Lighter», «Harder», «Rainy week» and «Ski tour week».',
    'Tap «Harder»: it is marked. Tap «Lighter»: «Lighter» is marked and «Harder» is off again.',
  ],
  since: [],
  de: {
    'Lighter or harder week, on top of Training': 'Leichtere oder härtere Woche, oben auf Training',
    'On top of Training › Week stands one row: suggest the week, and switch it to lighter, harder, rainy or a ski tour week.': 'Oben auf Training › Woche steht eine Reihe: die Woche vorschlagen und sie auf leichter, härter, Regenwoche oder Skitour-Woche stellen.',
    '«Lighter» and «Harder» change the hours of this week only, your goals stay; a tap again takes it back': '«Leichter» und «Härter» ändern die Stunden nur für diese Woche, deine Ziele bleiben; ein zweiter Tipp nimmt es zurück',
    'Open Week › Training: the row stands above the page. The switches «Lighter» and «Harder» need a saved weekly plan.': 'Öffne Woche › Training: die Reihe steht oben auf der Seite. «Leichter» und «Härter» brauchen einen gespeicherten Wochenplan.',
    'Open Week › Training: the row on top has «Suggest the week». With a weekly plan it also has «Lighter», «Harder», «Rainy week» and «Ski tour week».': 'Öffne Woche › Training: die Reihe oben hat «Woche vorschlagen». Mit Wochenplan hat sie auch «Leichter», «Härter», «Regenwoche» und «Skitour-Woche».',
    'Tap «Harder»: it is marked. Tap «Lighter»: «Lighter» is marked and «Harder» is off again.': 'Tippe «Härter»: es ist markiert. Tippe «Leichter»: «Leichter» ist markiert und «Härter» ist wieder aus.',
  },
};
