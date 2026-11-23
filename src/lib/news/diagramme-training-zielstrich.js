// «Diagramme überall verbessern» (Noah 23.11.2026 «ja»): the hour goal as a dashed line in the six weeks of Training
export default {
  title: 'Your hour goal in the six weeks',
  lead: 'If you set an hour goal in Training, the chart «Hours per week» shows it as a dashed line, so you see at a glance which weeks reached it.',
  points: [
    { text: 'A dashed line «Goal a week» in the six weeks of Training › Week (only if you set an hour goal yourself)', go: { href: '#/flow/training', where: 'Active › Training › Week: «Your training goal», then the look back below.' } },
  ],
  test: [
    'Open Training › Week and set an hour goal (for example 8 hours per week).',
    'In the look back, the chart «Hours per week» shows a dashed line «Goal: 8 h a week»; weeks above it reached the goal.',
  ],
  since: [],
  de: {
    'Your hour goal in the six weeks': 'Dein Stundenziel in den sechs Wochen',
    'If you set an hour goal in Training, the chart «Hours per week» shows it as a dashed line, so you see at a glance which weeks reached it.': 'Hast du im Training ein Stundenziel gesetzt, zeigt das Diagramm «Stunden pro Woche» es als gestrichelte Linie. So siehst du auf einen Blick, welche Wochen es erreicht haben.',
    'A dashed line «Goal a week» in the six weeks of Training › Week (only if you set an hour goal yourself)': 'Eine gestrichelte Linie «Ziel pro Woche» in den sechs Wochen von Training › Woche (nur, wenn du selbst ein Stundenziel gesetzt hast)',
    'Active › Training › Week: «Your training goal», then the look back below.': 'Aktiv › Training › Woche: «Dein Trainingsziel», darunter der Rückblick.',
    'Open Training › Week and set an hour goal (for example 8 hours per week).': 'Öffne Training › Woche und setze ein Stundenziel (zum Beispiel 8 Stunden pro Woche).',
    'In the look back, the chart «Hours per week» shows a dashed line «Goal: 8 h a week»; weeks above it reached the goal.': 'Im Rückblick zeigt das Diagramm «Stunden pro Woche» eine gestrichelte Linie «Ziel pro Woche: 8 Std.»; Wochen darüber haben das Ziel erreicht.',
  },
};
