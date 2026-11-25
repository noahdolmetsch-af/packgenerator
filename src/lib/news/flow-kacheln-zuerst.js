// «Heute abhaken» (Noah 24.11.2026 «1-5a», impeccable whole app): the tiles first, one number for the week
export default {
  title: 'Tick off today: the tiles come first',
  lead: 'On «Tick off today» the tiles stand right under the help line, and the week counts ticks, not repetitions.',
  points: [
    { text: 'The tiles of «Tick off today» stand right under the help line; the question «How was it?» waits below them', go: 'f.tick' },
    { text: 'The number of the week counts every tick once, so «Push-ups · 20» is one unit, in Aktiv and in Woche alike', go: 'f.tick' },
  ],
  test: ['Open Woche › Training › Tick off today on a phone: the tiles start right under the help line, with «Stopwatch» left and «Edit» right above them.', 'Tick a sport with 20 repetitions: the line «this week k of n units» counts one more, not twenty.'],
  de: {
    'Tick off today: the tiles come first': 'Heute abhaken: die Kacheln zuerst',
    'On «Tick off today» the tiles stand right under the help line, and the week counts ticks, not repetitions.': 'Bei «Heute abhaken» stehen die Kacheln direkt unter der Hilfe-Zeile, und die Woche zählt Haken, keine Wiederholungen.',
    'The tiles of «Tick off today» stand right under the help line; the question «How was it?» waits below them': 'Die Kacheln von «Heute abhaken» stehen direkt unter der Hilfe-Zeile; die Frage «Wie war\'s?» wartet darunter',
    'The number of the week counts every tick once, so «Push-ups · 20» is one unit, in Aktiv and in Woche alike': 'Die Zahl der Woche zählt jeden Haken einmal, «Liegestütze · 20» ist also eine Einheit, in Aktiv und in Woche gleich',
    'Open Woche › Training › Tick off today on a phone: the tiles start right under the help line, with «Stopwatch» left and «Edit» right above them.': 'Öffne Woche › Training › Heute abhaken auf dem Handy: die Kacheln beginnen direkt unter der Hilfe-Zeile, darüber «Stoppuhr» links und «Bearbeiten» rechts.',
    'Tick a sport with 20 repetitions: the line «this week k of n units» counts one more, not twenty.': 'Hake eine Sportart mit 20 Wiederholungen ab: die Zeile «diese Woche k von n Einheiten» zählt eine mehr, nicht zwanzig.',
  },
};
