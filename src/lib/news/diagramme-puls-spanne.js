// «Diagramme überall verbessern» (Noah 23.11.2026 «fehler?»): the resting pulse in Körperwerte also gets the usual range and one sentence
export default {
  title: 'Your usual range for the resting pulse',
  lead: 'The pulse chart in the body values shows where your resting pulse usually lies, and one sentence says how the latest compares.',
  points: [
    { text: 'A soft band «Your usual range at rest» behind the resting pulse and a sentence above the chart', go: { href: '#/flow/stats/hr', where: 'Auswerten › Body › Body values › Pulse: range «4 wk.».' } },
  ],
  test: [
    'Open Body values, the tab «Pulse» and the range «4 wk.»: a soft band lies behind the line at rest.',
    'Above the chart stands a sentence like «Resting pulse: Now 50 bpm, 2 bpm more than on 26 Oct».',
  ],
  since: [],
  de: {
    'Your usual range for the resting pulse': 'Deine übliche Spanne beim Puls in Ruhe',
    'The pulse chart in the body values shows where your resting pulse usually lies, and one sentence says how the latest compares.': 'Das Pulsdiagramm in den Körperwerten zeigt, wo dein Puls in Ruhe üblicherweise liegt, und ein Satz sagt, wie der letzte dazu steht.',
    'A soft band «Your usual range at rest» behind the resting pulse and a sentence above the chart': 'Ein ruhiges Band «Deine übliche Spanne in Ruhe» hinter dem Puls in Ruhe und ein Satz über dem Diagramm',
    'Auswerten › Body › Body values › Pulse: range «4 wk.».': 'Auswerten › Körper › Körperwerte › Puls: Zeitraum «4 Wo.».',
    'Open Body values, the tab «Pulse» and the range «4 wk.»: a soft band lies behind the line at rest.': 'Öffne die Körperwerte, den Reiter «Puls» und den Zeitraum «4 Wo.»: ein ruhiges Band liegt hinter der Linie in Ruhe.',
    'Above the chart stands a sentence like «Resting pulse: Now 50 bpm, 2 bpm more than on 26 Oct».': 'Über dem Diagramm steht ein Satz wie «Puls in Ruhe: Jetzt 50 bpm, 2 bpm mehr als am 26. Okt.».',
  },
};
