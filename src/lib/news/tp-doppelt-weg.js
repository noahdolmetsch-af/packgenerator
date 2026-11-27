// «TrainingPeaks nur noch einmal» (Noah 27.11.2026, Thread «TrainingPeaks-Einheiten korrekt übernehmen»): every workout showed three times
export default {
  title: 'Each TrainingPeaks session shows once',
  lead: 'Doubles of TrainingPeaks sessions in Training › My week are merged into one.',
  points: [
    { text: 'Training › My week: every planned TrainingPeaks session stands once per day; doubles are merged on the next fetch, ticks and your changes stay', go: { href: '#/flow/training', where: 'Training › My week, once a TrainingPeaks link is added.' } },
  ],
  small: [{ box: 'new', text: 'The card «TrainingPeaks plan» says how many doubles were merged' }],
  test: [
    'Open Me › Connections › TrainingPeaks plan and tap «Fetch again»: the line says how many double entries were merged.',
    'Open Training › My week: each TrainingPeaks session stands once per day; a session you ticked is still ticked.',
  ],
  since: [],
  de: {
    'Each TrainingPeaks session shows once': 'Jede TrainingPeaks-Einheit steht nur einmal',
    'Doubles of TrainingPeaks sessions in Training › My week are merged into one.': 'Doppelte TrainingPeaks-Einheiten in Training › Meine Woche werden zu einer zusammengeführt.',
    'Training › My week: every planned TrainingPeaks session stands once per day; doubles are merged on the next fetch, ticks and your changes stay': 'Training › Meine Woche: Jede geplante TrainingPeaks-Einheit steht pro Tag nur einmal; Doppelte werden beim nächsten Abruf zusammengeführt, Abgehaktes und deine Änderungen bleiben',
    'Training › My week, once a TrainingPeaks link is added.': 'Training › Meine Woche, sobald ein TrainingPeaks-Link eingetragen ist.',
    'The card «TrainingPeaks plan» says how many doubles were merged': 'Die Karte «TrainingPeaks-Plan» sagt, wie viele Doppelte zusammengeführt wurden',
    'Open Me › Connections › TrainingPeaks plan and tap «Fetch again»: the line says how many double entries were merged.': 'Öffne Ich › Verbindungen › TrainingPeaks-Plan und tippe «Neu abrufen»: Die Zeile sagt, wie viele doppelte Einträge zusammengeführt wurden.',
    'Open Training › My week: each TrainingPeaks session stands once per day; a session you ticked is still ticked.': 'Öffne Training › Meine Woche: Jede TrainingPeaks-Einheit steht pro Tag nur einmal; was du abgehakt hast, ist noch abgehakt.',
  },
};
