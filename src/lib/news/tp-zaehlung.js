// «TrainingPeaks zählt mit» (Noah 22.11.2026 «1a 2a 3a 4a a»): the numbers of the week and the week star include TrainingPeaks
export default {
  title: 'TrainingPeaks counts in your week',
  lead: 'The hours of the week and the week star include your sessions from TrainingPeaks.',
  points: [
    { text: 'In «My training plan» the hours include TrainingPeaks; a line says «of which TrainingPeaks»', go: { href: '#/flow/trainingsplan', where: 'Training › My training plan, in a week with sessions from TrainingPeaks.' } },
    { text: 'A done TrainingPeaks session counts for the week star; an open one holds the star back like any other', go: { href: '#/flow/wochenplan', where: 'Training › Weekly plan, under «This week so far», in a week with sessions from TrainingPeaks.' } },
    { text: 'If the plan and TrainingPeaks together are above your hours, the weekly plan says so and takes nothing away', go: { href: '#/flow/wochenplan', where: 'Training › Weekly plan, under the hours, in a week with a lot of TrainingPeaks.' } },
  ],
  small: [{ box: 'new', text: 'Past weeks stay as they were' }],
  test: [
    'Open Training › My training plan: the row of a TrainingPeaks session says «TrainingPeaks», and under the hours stands «of which TrainingPeaks».',
    'Open Training › Weekly plan: «This week so far» counts the TrainingPeaks sessions as units.',
    'Tick a TrainingPeaks session in My week: it counts as done in the weekly plan after you open it.',
  ],
  since: [],
  de: {
    'TrainingPeaks counts in your week': 'TrainingPeaks zählt in deiner Woche mit',
    'The hours of the week and the week star include your sessions from TrainingPeaks.': 'Die Stunden der Woche und der Wochenstern enthalten deine Einheiten aus TrainingPeaks.',
    'In «My training plan» the hours include TrainingPeaks; a line says «of which TrainingPeaks»': 'In «Mein Trainingsplan» enthalten die Stunden TrainingPeaks; eine Zeile sagt «davon TrainingPeaks»',
    'Training › My training plan, in a week with sessions from TrainingPeaks.': 'Training › Mein Trainingsplan, in einer Woche mit Einheiten aus TrainingPeaks.',
    'A done TrainingPeaks session counts for the week star; an open one holds the star back like any other': 'Eine erledigte TrainingPeaks-Einheit zählt für den Wochenstern; eine offene hält ihn zurück wie jede andere',
    'Training › Weekly plan, under «This week so far», in a week with sessions from TrainingPeaks.': 'Training › Wochenplan, unter «Diese Woche bisher», in einer Woche mit Einheiten aus TrainingPeaks.',
    'If the plan and TrainingPeaks together are above your hours, the weekly plan says so and takes nothing away': 'Liegen Plan und TrainingPeaks zusammen über deinen Stunden, sagt der Wochenplan das und nimmt nichts weg',
    'Training › Weekly plan, under the hours, in a week with a lot of TrainingPeaks.': 'Training › Wochenplan, unter den Stunden, in einer Woche mit viel TrainingPeaks.',
    'Past weeks stay as they were': 'Vergangene Wochen bleiben, wie sie waren',
    'Open Training › My training plan: the row of a TrainingPeaks session says «TrainingPeaks», and under the hours stands «of which TrainingPeaks».': 'Öffne Training › Mein Trainingsplan: Die Zeile einer TrainingPeaks-Einheit sagt «TrainingPeaks», und unter den Stunden steht «davon TrainingPeaks».',
    'Open Training › Weekly plan: «This week so far» counts the TrainingPeaks sessions as units.': 'Öffne Training › Wochenplan: «Diese Woche bisher» zählt die TrainingPeaks-Einheiten als Einheiten.',
    'Tick a TrainingPeaks session in My week: it counts as done in the weekly plan after you open it.': 'Hake eine TrainingPeaks-Einheit in Meine Woche ab: Sie zählt im Wochenplan als erledigt, sobald du ihn öffnest.',
  },
};
