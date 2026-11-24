// «Dein Trainingsplan im Wochenplan» (Noah 23.11.2026 «5a», Thread «Wochenplan-Vorschläge verlässlich machen»), Schritt 6
export default {
  title: 'Your training plan in the weekly plan',
  lead: 'A training plan you use now takes its place in the week like TrainingPeaks: the weekly plan adds no bike units on top.',
  points: [
    { text: 'The sessions of a training plan (for example «Ultra») stand fixed in the weekly plan and count towards your hours; the plan puts fewer bike units of its own', go: { href: '#/flow/wochenplan', where: 'Training › Weekly plan, in a week with a training plan in use.' } },
    { text: 'Under the hours it says what your training plan brings and what it replaced', go: { href: '#/flow/plans', where: 'Training › Training plans, take a plan into your week first.' } },
  ],
  small: [{ box: 'new', text: 'Same rule as TrainingPeaks: the same sport is replaced, nothing else is taken away' }],
  test: [
    'Take a training plan into your week (Training › Training plans), then open Training › Weekly plan: under the hours it says «Your training plan brings … h this week».',
    'Look at Training › Week: the plan sessions stand on their days, and the weekly plan has no second bike unit beside them.',
  ],
  since: [],
  de: {
    'Your training plan in the weekly plan': 'Dein Trainingsplan im Wochenplan',
    'A training plan you use now takes its place in the week like TrainingPeaks: the weekly plan adds no bike units on top.': 'Ein Trainingsplan, den du nutzt, hat jetzt wie TrainingPeaks seinen Platz in der Woche: Der Wochenplan setzt keine Velo-Einheiten obendrauf.',
    'The sessions of a training plan (for example «Ultra») stand fixed in the weekly plan and count towards your hours; the plan puts fewer bike units of its own': 'Die Einheiten eines Trainingsplans (zum Beispiel «Ultra») stehen im Wochenplan fest und zählen auf deine Stunden; der Plan setzt weniger eigene Velo-Einheiten',
    'Training › Weekly plan, in a week with a training plan in use.': 'Training › Wochenplan, in einer Woche mit einem Trainingsplan in Gebrauch.',
    'Under the hours it says what your training plan brings and what it replaced': 'Unter den Stunden steht, was dein Trainingsplan bringt und was er ersetzt hat',
    'Training › Training plans, take a plan into your week first.': 'Training › Trainingspläne, nimm zuerst einen Plan in deine Woche.',
    'Same rule as TrainingPeaks: the same sport is replaced, nothing else is taken away': 'Dieselbe Regel wie bei TrainingPeaks: Die gleiche Sportart wird ersetzt, sonst wird nichts weggenommen',
    'Take a training plan into your week (Training › Training plans), then open Training › Weekly plan: under the hours it says «Your training plan brings … h this week».': 'Nimm einen Trainingsplan in deine Woche (Training › Trainingspläne) und öffne Training › Wochenplan: Unter den Stunden steht «Dein Trainingsplan bringt … Std.».',
    'Look at Training › Week: the plan sessions stand on their days, and the weekly plan has no second bike unit beside them.': 'Öffne Training › Woche: Die Einheiten des Plans stehen an ihren Tagen, und der Wochenplan hat daneben keine zweite Velo-Einheit.',
  },
};
