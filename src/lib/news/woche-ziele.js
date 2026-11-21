// «App vereinfachen» Schritt V1 (Noah 21.11.2026 «1a 2a 3a 4a 5a»): the week page counts units done and shows the goals of the week
export default {
  title: 'The week: units done and the goals of the week',
  lead: 'The week page now says how many units are done and shows your goals of the week next to the days.',
  points: [
    { text: '«2 of 5 units done» on top of the week; the goals of the week with their bars stand next to the days', go: { href: '#/week', steps: [{ sel: '[data-week-units]' }, { sel: '[data-week-goals]' }], where: 'Plan › Week: the count on top, the goals next to the days.' } },
  ],
  small: [],
  test: [
    'Open Plan › Week: at the top it says how many units are done.',
    'Look for «My week goals»: the same goals and bars as on Active.',
  ],
  since: [],
  de: {
    'The week: units done and the goals of the week': 'Die Woche: erledigte Einheiten und die Ziele der Woche',
    'The week page now says how many units are done and shows your goals of the week next to the days.': 'Die Wochenseite sagt jetzt, wie viele Einheiten erledigt sind, und zeigt deine Ziele der Woche neben den Tagen.',
    '«2 of 5 units done» on top of the week; the goals of the week with their bars stand next to the days': '«2 von 5 Einheiten erledigt» oben auf der Woche; die Ziele der Woche mit ihren Balken stehen neben den Tagen',
    'Plan › Week: the count on top, the goals next to the days.': 'Planen › Woche: oben die Zahl, neben den Tagen die Ziele.',
    'Open Plan › Week: at the top it says how many units are done.': 'Öffne Planen › Woche: oben steht, wie viele Einheiten erledigt sind.',
    'Look for «My week goals»: the same goals and bars as on Active.': 'Suche «Meine Wochenziele»: dieselben Ziele und Balken wie auf Aktiv.',
  },
};
