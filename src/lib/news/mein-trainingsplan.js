// «Mein Trainingsplan» (Noah 21.11.2026 «ich möchte alle entwürfe 1-3 umsetzen», S6): Plan und Gemachtes auf einer Seite
export default {
  title: 'My training plan',
  lead: 'Your plan and what you did, on one page. Only to look at, nothing is graded.',
  points: [
    { text: 'The new page «My training plan» shows the week in hours and units, the hours per week against the plan and the last 4 weeks', go: 'f.meinplan' },
    { text: 'Under «This week» on Active a new link leads there', go: { href: '#/flow', steps: [{ sel: '[data-to-trainingsplan]' }], where: 'On Active, in the box «This week».' } },
  ],
  small: [],
  test: ['On Active tap «My training plan» under «This week».', 'Tap a bar of the chart and read that week unit by unit.'],
  since: ['f.meinplan'],
  de: {
    'My training plan': 'Mein Trainingsplan',
    'Your plan and what you did, on one page. Only to look at, nothing is graded.': 'Dein Plan und was du gemacht hast, auf einer Seite. Nur zum Anschauen, nichts wird bewertet.',
    'The new page «My training plan» shows the week in hours and units, the hours per week against the plan and the last 4 weeks': 'Die neue Seite «Mein Trainingsplan» zeigt die Woche in Stunden und Einheiten, die Stunden pro Woche gegen den Plan und die letzten 4 Wochen',
    'Under «This week» on Active a new link leads there': 'Unter «Diese Woche» auf Aktiv führt ein neuer Link dorthin',
    'On Active tap «My training plan» under «This week».': 'Tippe auf Aktiv unter «Diese Woche» auf «Mein Trainingsplan».',
    'On Active, in the box «This week».': 'Auf Aktiv, im Kasten «Diese Woche».',
    'Tap a bar of the chart and read that week unit by unit.': 'Tippe auf einen Balken im Diagramm und lies diese Woche Einheit für Einheit.',
  },
};
