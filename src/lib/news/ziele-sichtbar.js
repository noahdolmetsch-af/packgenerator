// «Ziele sichtbar» (Noah 21.11.2026 «ich möchte alle entwürfe 1-3 umsetzen», S10): das Stundenziel im Sportjahr
export default {
  title: 'Your goal in the sports year',
  lead: 'The hours goal you set shows as a line in the sports year. Only to look at, nothing is graded.',
  points: [
    { text: 'The line in the chart is your goal in hours per week, and a sentence says how many hours per week you had in this period', go: { href: '#/auswerten/sportjahr', steps: [{ sel: '[data-sj-goal]' }], where: 'Shows when a goal with hours per week is set under Active › Training.' } },
    { text: 'When the goal day has passed, a quiet sentence offers a new goal or lets you leave it out', go: { href: '#/auswerten/sportjahr', steps: [{ sel: '[data-sj-goal]' }], where: 'Shows after the day of your goal.' } },
  ],
  small: [],
  test: ['Set a goal with hours per week under Active › Training, then open Analysis › Sports year.', 'Read the line in the chart and the sentence with your hours per week.'],
  since: [],
  de: {
    'Your goal in the sports year': 'Dein Ziel im Sportjahr',
    'The hours goal you set shows as a line in the sports year. Only to look at, nothing is graded.': 'Das Stundenziel, das du gesetzt hast, steht im Sportjahr als Linie. Nur zum Anschauen, nichts wird bewertet.',
    'The line in the chart is your goal in hours per week, and a sentence says how many hours per week you had in this period': 'Die Linie im Diagramm ist dein Ziel in Stunden pro Woche, und ein Satz sagt, wie viele Stunden pro Woche es in diesem Zeitraum waren',
    'Shows when a goal with hours per week is set under Active › Training.': 'Erscheint, wenn unter Aktiv › Training ein Ziel mit Stunden pro Woche gesetzt ist.',
    'When the goal day has passed, a quiet sentence offers a new goal or lets you leave it out': 'Ist der Zieltag vorbei, bietet ein ruhiger Satz ein neues Ziel an oder lässt es weg',
    'Shows after the day of your goal.': 'Erscheint nach dem Tag deines Ziels.',
    'Set a goal with hours per week under Active › Training, then open Analysis › Sports year.': 'Setze unter Aktiv › Training ein Ziel mit Stunden pro Woche und öffne dann Auswerten › Sportjahr.',
    'Read the line in the chart and the sentence with your hours per week.': 'Lies die Linie im Diagramm und den Satz mit deinen Stunden pro Woche.',
  },
};
